import {
  CATEGORY_COLORS,
  createConnection,
  createMission,
  createPowerExcuse,
  createQuiz,
  filterEvents,
  isValidEvent,
  levelProgress,
  normalizeEvent,
  seededShuffle,
  solidarityResult
} from './src/game-core.js';
import { createAtlasApi } from './src/atlas-api.js';
import { readRuntimeConfig } from './src/atlas-config.js';
import { parseStoredProgress, reconcileProgress, sanitizeProgress } from './src/progress-store.js';
import { LANGUAGES, createI18n, formatLocalizedYear, translateCategory } from './src/i18n.js';

const SUPABASE_URL = 'https://pixafxinyydzwplirrnm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cAh2ZxD6aaXREXhMIVyvyA_C_yeFxRd';
const STORAGE_KEY = 'atlas-des-widerstands-progress-v2';
const VIEW_STORAGE_KEY = 'atlas-des-widerstands-view-v1';
const runtimeConfig = readRuntimeConfig(window.location.search, document.documentElement.dataset, window.location.href);
const i18n = createI18n({ search: window.location.search, storage: window.localStorage, navigatorLanguage: navigator.language });

const DEFAULT_PROGRESS = {
  xp: 0,
  discoveredIds: [],
  unlockedAchievements: [],
  quizAnswered: 0,
  missionsCompleted: 0,
  mission: null,
  seenWelcome: false,
  lastVisit: null,
  visitStreak: 1,
  connectionIds: [],
  solidarityCombo: 0,
  bestSolidarityCombo: 0,
  lastDiscoveredId: null
};

const ACHIEVEMENTS = [
  { id: 'first-trace', icon: 'âœ¦', title: 'Erste Spur', description: 'Sichere deinen ersten Archiveintrag.', test: ({ discovered }) => discovered.length >= 1 },
  { id: 'collector', icon: 'â–¤', title: 'Spurensammler*in', description: 'Entdecke fÃ¼nf Ereignisse.', test: ({ discovered }) => discovered.length >= 5 },
  { id: 'archivist', icon: 'âŒ˜', title: 'Archivar*in', description: 'Entdecke zehn Ereignisse.', test: ({ discovered }) => discovered.length >= 10 },
  { id: 'world-link', icon: 'â—Ž', title: 'Globale Verbindung', description: 'Finde Spuren auf vier Kontinenten.', test: ({ discovered }) => new Set(discovered.map(event => event.continent)).size >= 4 },
  { id: 'time-traveller', icon: 'âŒ›', title: 'Zeitreisende*r', description: 'Entdecke Ereignisse aus drei Jahrhunderten.', test: ({ discovered }) => new Set(discovered.filter(event => event.yearStart).map(event => Math.floor(event.yearStart / 100))).size >= 3 },
  { id: 'quiz-mind', icon: '?', title: 'Kritischer Geist', description: 'Beantworte drei Quizfragen richtig.', test: ({ progress }) => progress.quizAnswered >= 3 },
  { id: 'mission-one', icon: 'â—ˆ', title: 'Mission erfÃ¼llt', description: 'SchlieÃŸe deine erste Mission ab.', test: ({ progress }) => progress.missionsCompleted >= 1 },
  { id: 'spark-smith', icon: 'âš¡', title: 'Funken-Schmied*in', description: 'Entdecke fÃ¼nf neue Verbindungen im Funkenlabor.', test: ({ progress }) => progress.connectionIds.length >= 5 },
  { id: 'solidarity-chain', icon: 'â›“', title: 'Internationale der offenen Tabs', description: 'Erreiche eine SolidaritÃ¤ts-Combo von vier.', test: ({ progress }) => progress.bestSolidarityCombo >= 4 },
  { id: 'completionist', icon: 'â˜…', title: 'Lebendiges GedÃ¤chtnis', description: 'ErschlieÃŸe das gesamte kuratierte Archiv.', test: ({ discovered, events }) => events.length > 0 && discovered.length === events.length }
];

const ui = {};
const app = {
  map: null,
  popup: null,
  events: [],
  filteredEvents: [],
  progress: loadProgress(),
  filters: loadViewFilters(),
  activeQuiz: null,
  activeConnection: null,
  bridge: null
};

document.addEventListener('DOMContentLoaded', start);

async function start() {
  document.documentElement.style.setProperty('--accent', runtimeConfig.accent);
  document.body.classList.toggle('is-embedded', runtimeConfig.embed);
  bindUi();
  setupLanguageSelector();
  applyLanguage();
  updateVisitStreak();
  attachUiEvents();
  setupHostApi();

  try {
    await waitForMapLibre();
    app.events = await loadEvents();
    app.progress = reconcileProgress(app.progress, new Set(app.events.map(event => event.id)));
    populateCategories();
    applyFiltersToUi();
    ensureMission();
    initializeMap();
    updateGameUi();
    if (runtimeConfig.showWelcome && !app.progress.seenWelcome) openModal(ui.welcomeModal);
    emitAtlasEvent('ready', { eventCount: app.events.length, embedded: runtimeConfig.embed });
  } catch (error) {
    console.error('Atlas konnte nicht gestartet werden:', error);
    setDataStatus(i18n.t('mapFailed'), 'fallback');
    showToast(i18n.t('startFailed'), i18n.t('startFailedBody'));
  }
}

function bindUi() {
  const ids = [
    'search-input', 'category-filter', 'era-from', 'era-to', 'undiscovered-only', 'result-count',
    'reset-filters', 'fit-results', 'clear-search', 'random-event', 'start-mission', 'data-status', 'level-value', 'xp-value',
    'xp-progress', 'mission-card', 'mission-title', 'mission-description', 'mission-reward',
    'mission-progress-text', 'mission-progress-bar', 'archive-count', 'achievement-count',
    'archive-drawer', 'archive-list', 'achievements-drawer', 'achievement-list', 'connections-drawer',
    'connection-content', 'new-connection', 'copy-connection', 'power-excuse', 'power-counter', 'new-excuse', 'quiz-button',
    'quiz-modal', 'quiz-title', 'quiz-content', 'welcome-modal', 'modal-backdrop', 'begin-button',
    'help-button', 'toast-region', 'menu-toggle', 'menu-close', 'control-panel', 'language-select'
  ];
  ids.forEach(id => { ui[toCamel(id)] = document.getElementById(id); });
  ui.navButtons = [...document.querySelectorAll('.nav-button')];
  ui.drawerCloseButtons = [...document.querySelectorAll('.drawer-close')];
  ui.modalCloseButtons = [...document.querySelectorAll('.modal-close')];
}

function setupLanguageSelector() {
  ui.languageSelect.replaceChildren();
  LANGUAGES.forEach(language => {
    const option = document.createElement('option');
    option.value = language.code;
    option.textContent = language.label;
    ui.languageSelect.append(option);
  });
  ui.languageSelect.value = i18n.language;
}

function applyLanguage() {
  document.documentElement.lang = i18n.language;
  document.title = i18n.t('appTitle');
  document.getElementById('meta-description')?.setAttribute('content', i18n.t('metaDescription'));
  document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = i18n.t(element.dataset.i18n); });
  document.querySelectorAll('[data-i18n-aria]').forEach(element => { element.setAttribute('aria-label', i18n.t(element.dataset.i18nAria)); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => { element.setAttribute('placeholder', i18n.t(element.dataset.i18nPlaceholder)); });
  document.querySelectorAll('[data-i18n-title]').forEach(element => { element.setAttribute('title', i18n.t(element.dataset.i18nTitle)); });
  ui.languageSelect.setAttribute('aria-label', i18n.t('language'));
}

function changeLanguage(language) {
  i18n.setLanguage(language);
  applyLanguage();
  if (app.events.length) {
    populateCategories();
    updateGameUi();
    renderMapData();
    if (app.activeConnection) renderConnection(app.activeConnection);
    if (!ui.connectionsDrawer.hidden) renderPowerExcuse();
    if (!ui.quizModal.hidden) openQuiz();
    setDataStatus(i18n.t(ui.dataStatus.classList.contains('is-online') ? 'liveStatus' : 'fallbackStatus', { count: app.events.length }), ui.dataStatus.classList.contains('is-online') ? 'online' : 'fallback');
  }
  app.popup?.remove();
  emitAtlasEvent('language-changed', { language: i18n.language });
}

function attachUiEvents() {
  ui.languageSelect.addEventListener('change', () => changeLanguage(ui.languageSelect.value));
  ui.searchInput.addEventListener('input', () => { app.filters.query = ui.searchInput.value; renderMapData(); });
  ui.clearSearch.addEventListener('click', () => {
    app.filters.query = '';
    ui.searchInput.value = '';
    ui.searchInput.focus();
    renderMapData();
  });
  ui.categoryFilter.addEventListener('change', () => { app.filters.category = ui.categoryFilter.value; renderMapData(); });
  ui.eraFrom.addEventListener('change', updateEraFilter);
  ui.eraTo.addEventListener('change', updateEraFilter);
  ui.undiscoveredOnly.addEventListener('change', () => { app.filters.undiscoveredOnly = ui.undiscoveredOnly.checked; renderMapData(); });
  ui.resetFilters.addEventListener('click', resetFilters);
  ui.fitResults.addEventListener('click', fitFilteredEvents);
  ui.randomEvent.addEventListener('click', () => flyToRandomEvent(app.filteredEvents));
  ui.startMission.addEventListener('click', () => startNewMission());
  ui.newConnection.addEventListener('click', () => drawConnection(true));
  ui.copyConnection.addEventListener('click', copyConnection);
  ui.newExcuse.addEventListener('click', renderPowerExcuse);
  ui.missionCard.addEventListener('click', event => {
    if (event.target.closest('button')) return;
    const target = currentMissionTargets().find(item => !app.progress.mission.completedIds.includes(item.id));
    if (target) flyToEvent(target);
  });
  ui.quizButton.addEventListener('click', openQuiz);
  ui.beginButton.addEventListener('click', () => {
    app.progress.seenWelcome = true;
    saveProgress();
    closeModals();
    showToast(i18n.t('started'), i18n.t('startedBody'));
  });
  ui.helpButton.addEventListener('click', () => openModal(ui.welcomeModal));
  ui.modalBackdrop.addEventListener('click', closeModals);
  ui.modalCloseButtons.forEach(button => button.addEventListener('click', closeModals));
  ui.drawerCloseButtons.forEach(button => button.addEventListener('click', closeDrawers));
  ui.menuToggle.addEventListener('click', () => toggleMobileMenu(true));
  ui.menuClose.addEventListener('click', () => toggleMobileMenu(false));

  ui.navButtons.forEach(button => button.addEventListener('click', () => {
    const panel = button.dataset.panel;
    if (panel === 'archive') toggleDrawer(ui.archiveDrawer, button);
    if (panel === 'achievements') toggleDrawer(ui.achievementsDrawer, button);
    if (panel === 'connections') {
      toggleDrawer(ui.connectionsDrawer, button);
      if (!ui.connectionsDrawer.hidden) drawConnection(false);
    }
    if (panel === 'map') closeDrawers();
  }));

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeModals(); closeDrawers(); toggleMobileMenu(false); }
    if (isFormElement(document.activeElement)) return;
    if (event.key.toLowerCase() === 'f') { event.preventDefault(); ui.searchInput.focus(); toggleMobileMenu(true); }
    if (event.key.toLowerCase() === 'r') flyToRandomEvent(app.filteredEvents);
    if (event.key.toLowerCase() === 'm') startNewMission();
    if (event.key.toLowerCase() === 'v') openPanel('connections');
    if (event.key === '?') openModal(ui.welcomeModal);
  });
}

async function loadEvents() {
  const catalogResponse = await fetch('./data/event-catalog.json');
  if (!catalogResponse.ok) throw new Error('Datenkatalog fehlt.');
  const catalog = await catalogResponse.json();
  if (!Array.isArray(catalog) || !catalog.length || catalog.some(file => typeof file !== 'string' || !/^[a-z0-9-]+\.json$/i.test(file))) {
    throw new Error('Datenkatalog ist ungÃ¼ltig.');
  }
  const fallbackResponses = await Promise.all(catalog.map(file => fetch(`./data/${file}`)));
  if (fallbackResponses.some(response => !response.ok)) throw new Error('Fallback-Daten fehlen.');
  const fallbackRows = (await Promise.all(fallbackResponses.map(response => response.json())))
    .flat()
    .filter(row => !row.archived)
    .slice(0, 5000);
  const fallback = fallbackRows.map(normalizeEvent).filter(isValidEvent);

  if (!runtimeConfig.useSupabase || !window.supabase?.createClient) {
    setDataStatus(i18n.t('offlineStatus', { count: fallback.length }), 'fallback');
    return fallback;
  }

  try {
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    const { data, error } = await client.from('ereignisse').select('*').limit(runtimeConfig.maxRemoteEvents);
    if (error) throw error;
    const remote = (data || []).map(normalizeEvent).filter(isValidEvent);
    const merged = mergeEvents(fallback, remote);
    setDataStatus(i18n.t('liveStatus', { count: merged.length }), 'online');
    return merged;
  } catch (error) {
    console.warn('Supabase nicht erreichbar, kuratierter Fallback wird verwendet:', error);
    setDataStatus(i18n.t('fallbackStatus', { count: fallback.length }), 'fallback');
    return fallback;
  }
}

function mergeEvents(fallback, remote) {
  const bySignature = new Map(fallback.map(event => [eventSignature(event), event]));
  remote.forEach(event => {
    const signature = eventSignature(event);
    const existing = bySignature.get(signature);
    bySignature.set(signature, existing ? { ...existing, ...withoutEmptyValues(event), id: existing.id } : event);
  });
  return [...bySignature.values()].sort((a, b) => (a.yearStart || 9999) - (b.yearStart || 9999));
}

function initializeMap() {
  app.map = new window.maplibregl.Map({
    container: 'map',
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    center: [9, 30],
    zoom: 1.7,
    minZoom: 1.2,
    maxZoom: 14,
    attributionControl: false
  });
  app.map.addControl(new window.maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  app.map.addControl(new window.maplibregl.AttributionControl({ compact: true }), 'bottom-right');

  app.map.on('load', () => {
    app.map.addSource('resistance-events', {
      type: 'geojson',
      data: toGeoJson(app.events),
      cluster: true,
      clusterMaxZoom: 7,
      clusterRadius: 48
    });

    app.map.addLayer({
      id: 'mission-halo',
      type: 'circle',
      source: 'resistance-events',
      filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'missionTarget'], true]],
      paint: {
        'circle-radius': 17,
        'circle-color': 'rgba(255,201,107,0.08)',
        'circle-stroke-color': '#ffc96b',
        'circle-stroke-width': 2,
        'circle-opacity': .85
      }
    });

    app.map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'resistance-events',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': ['step', ['get', 'point_count'], '#65f3a6', 6, '#20d477', 12, '#118650'],
        'circle-radius': ['step', ['get', 'point_count'], 18, 6, 24, 12, 31],
        'circle-opacity': .88,
        'circle-stroke-width': 3,
        'circle-stroke-color': 'rgba(101,243,166,.26)'
      }
    });

    app.map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'resistance-events',
      filter: ['has', 'point_count'],
      layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 12, 'text-font': ['Open Sans Bold'] },
      paint: { 'text-color': '#042113' }
    });

    app.map.addLayer({
      id: 'event-points',
      type: 'circle',
      source: 'resistance-events',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'ë~v¶‰žËkºwµçQÑ½¸¹±…ÍÍ9…µ”€ô€ÅÕ¥èµ½ÁÑ¥½¸œì(€€€‰ÕÑÑ½¸¹‘…Ñ…Í•Ð¹…¹ÍÝ•È€ôMÑÉ¥¹œ¡½ÁÑ¥½¸¤ì(€€€‰ÕÑÑ½¸¹Ñ•áÑ½¹Ñ•¹Ð€ô9Õµ‰•È¹¥Í¥¹¥Ñ”¡9Õµ‰•È¡½ÁÑ¥½¸¤¤€ü½ÁÑ¥½¸€èÑÉ…¹Í±…Ñ•…Ñ•½Éä¡½ÁÑ¥½¸°¤Äá¸¹±…¹Õ…”¤ì(€€€‰ÕÑÑ½¸¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ°€ ¤€ôø…¹ÍÝ•ÉEÕ¥è¡½ÁÑ¥½¸°‰ÕÑÑ½¸°½ÁÑ¥½¹Ì¤¤ì(€€€½ÁÑ¥½¹Ì¹…ÁÁ•¹¡‰ÕÑÑ½¸¤ì(€ô¤ì(€Õ¤¹ÅÕ¥é½¹Ñ•¹Ð¹…ÁÁ•¹¡•Ù•¹Ñ…É°½ÁÑ¥½¹Ì¤ì)ô()™Õ¹Ñ¥½¸…¹ÍÝ•ÉEÕ¥è¡½ÁÑ¥½¸°‰ÕÑÑ½¸°½ÁÑ¥½¹Ì¤ì(€¥˜€¡…ÁÀ¹…Ñ¥Ù•EÕ¥è¹…¹ÍÝ•É•¤É•ÑÕÉ¸ì(€…ÁÀ¹…Ñ¥Ù•EÕ¥è¹…¹ÍÝ•É•€ôÑÉÕ”ì(€½¹ÍÐ½ÉÉ•Ð€ôMÑÉ¥¹œ¡½ÁÑ¥½¸¤€ôôôMÑÉ¥¹œ¡…ÁÀ¹…Ñ¥Ù•EÕ¥è¹…¹ÍÝ•È¤ì(€l¸¸¹½ÁÑ¥½¹Ì¹¡¥±‘É•¹t¹™½É… ¡¥Ñ•´€ôøì(€€€¥Ñ•´¹‘¥Í…‰±•€ôÑÉÕ”ì(€€€¥˜€¡¥Ñ•´¹‘…Ñ…Í•Ð¹…¹ÍÝ•È€ôôôMÑÉ¥¹œ¡…ÁÀ¹…Ñ¥Ù•EÕ¥è¹…¹ÍÝ•È¤¤¥Ñ•´¹±…ÍÍ1¥ÍÐ¹…‘ ¥Ìµ½ÉÉ•Ðœ¤ì(€ô¤ì(€¥˜€ …½ÉÉ•Ð¤‰ÕÑÑ½¸¹±…ÍÍ1¥ÍÐ¹…‘ ¥ÌµÝÉ½¹œœ¤ì(€¥˜€¡½ÉÉ•Ð¤ì(€€€…ÁÀ¹ÁÉ½É•ÍÌ¹ÅÕ¥é¹ÍÝ•É•€¬ô€Äì(€€€…Ý…É‘aÀ ÈÀ°™…±Í”¤ì(€€€¡•­¡¥•Ù•µ•¹ÑÌ ¤ì(€€€Í…Ù•AÉ½É•ÍÌ ¤ì(€€€ÕÁ‘…Ñ•…µ•U¤ ¤ì(€€€Í¡½ÝQ½…ÍÐ¡¤Äá¸¹Ð ½ÉÉ•Ðœ¤°€œ¬ÈÀa@œ¤ì(€ô•±Í”ì(€€€½¹ÍÐ…¹ÍÝ•È€ô9Õµ‰•È¹¥Í¥¹¥Ñ”¡9Õµ‰•È¡…ÁÀ¹…Ñ¥Ù•EÕ¥è¹…¹ÍÝ•È¤¤€ü…ÁÀ¹…Ñ¥Ù•EÕ¥è¹…¹ÍÝ•È€èÑÉ…¹Í±…Ñ•…Ñ•½Éä¡…ÁÀ¹…Ñ¥Ù•EÕ¥è¹…¹ÍÝ•È°¤Äá¸¹±…¹Õ…”¤ì(€€€Í¡½ÝQ½…ÍÐ¡¤Äá¸¹Ð …±µ½ÍÐœ¤°¤Äá¸¹Ð ½ÉÉ•Ñ¹ÍÝ•Èœ°ì…¹ÍÝ•Èô¤¤ì(€ô)ô()™Õ¹Ñ¥½¸™±åQ½I…¹‘½µÙ•¹Ð¡•Ù•¹ÑÌ¤ì(€¥˜€ …•Ù•¹ÑÌ¹±•¹Ñ ¤ìÍ¡½ÝQ½…ÍÐ¡¤Äá¸¹Ð ¹½I•ÍÕ±ÑÌœ¤°¤Äá¸¹Ð É•Í•Ñ!¥¹Ðœ¤¤ìÉ•ÑÕÉ¸ìô(€½¹ÍÐ•Ù•¹Ð€ôÍ••‘•‘M¡Õ™™±”¡•Ù•¹ÑÌ°€‘í…Ñ”¹¹½Ü ¥ôµÉ…¹‘½µ€¥lÁtì(€™±åQ½Ù•¹Ð¡•Ù•¹Ð¤ì)ô()™Õ¹Ñ¥½¸™¥Ñ¥±Ñ•É•‘Ù•¹ÑÌ ¤ì(€¥˜€ ……ÁÀ¹™¥±Ñ•É•‘Ù•¹ÑÌ¹±•¹Ñ ¤ì(€€€Í¡½ÝQ½…ÍÐ¡¤Äá¸¹Ð ¹½I•ÍÕ±ÑÌœ¤°¤Äá¸¹Ð É•Í•Ñ!¥¹Ðœ¤¤ì(€€€É•ÑÕÉ¸ì(€ô(€¥˜€¡…ÁÀ¹™¥±Ñ•É•‘Ù•¹ÑÌ¹±•¹Ñ €ôôô€Ä¤ì(€€€™±åQ½Ù•¹Ð¡…ÁÀ¹™¥±Ñ•É•‘Ù•¹ÑÍlÁt¤ì(€€€É•ÑÕÉ¸ì(€ô(€½¹ÍÐ‰½Õ¹‘Ì€ô¹•ÜÝ¥¹‘½Ü¹µ…Á±¥‰É•°¹1¹1…Ñ	½Õ¹‘Ì ¤ì(€…ÁÀ¹™¥±Ñ•É•‘Ù•¹ÑÌ¹™½É… ¡•Ù•¹Ð€ôø‰½Õ¹‘Ì¹•áÑ•¹¡m•Ù•¹Ð¹±½¹¥ÑÕ‘”°•Ù•¹Ð¹±…Ñ¥ÑÕ‘•t¤¤ì(€…ÁÀ¹µ…À¹™¥Ñ	½Õ¹‘Ì¡‰½Õ¹‘Ì°ì(€€€Á…‘‘¥¹œèìÑ½Àè€ÄÄÀ°É¥¡Ðè€àÀ°‰½ÑÑ½´è€ÄÄÀ°±•™ÐèÝ¥¹‘½Ü¹¥¹¹•É]¥‘Ñ €ø€àÈÀ€ü€ÌäÀ€è€ØÀô°(€€€µ…ái½½´è€Ø°(€€€‘ÕÉ…Ñ¥½¸èÝ¥¹‘½Ü¹µ…Ñ¡5•‘¥„ œ¡ÁÉ•™•ÉÌµÉ•‘Õ•µµ½Ñ¥½¸èÉ•‘Õ”¤œ¤¹µ…Ñ¡•Ì€ü€À€è€àÔÀ(€ô¤ì)ô()™Õ¹Ñ¥½¸™±åQ½Ù•¹Ð¡•Ù•¹Ð°½Á•¹A½ÁÕÀ€ôÑÉÕ”¤ì(€¥˜€ ……ÁÀ¹µ…À¤É•ÑÕÉ¸ì(€½¹ÍÐÉ•‘Õ•‘5½Ñ¥½¸€ôÝ¥¹‘½Ü¹µ…Ñ¡5•‘¥„ œ¡ÁÉ•™•ÉÌµÉ•‘Õ•µµ½Ñ¥½¸èÉ•‘Õ”¤œ¤¹µ…Ñ¡•Ìì(€½¹ÍÐ‘ÕÉ…Ñ¥½¸€ôÉ•‘Õ•‘5½Ñ¥½¸€ü€À€è€ÄÈÀÀì(€…ÁÀ¹µ…À¹™±åQ¼¡ì(€€€•¹Ñ•Èèm•Ù•¹Ð¹±½¹¥ÑÕ‘”°•Ù•¹Ð¹±…Ñ¥ÑÕ‘•t°(€€€é½½´è5…Ñ ¹µ…à¡…ÁÀ¹µ…À¹•Ñi½½´ ¤°€Ô¤°(€€€½™™Í•ÐèlÀ°5…Ñ ¹µ¥¸ ÄØÀ°Ý¥¹‘½Ü¹¥¹¹•É!•¥¡Ð€¨€À¸Äà¥t°(€€€•ÍÍ•¹Ñ¥…°è™…±Í”°(€€€‘ÕÉ…Ñ¥½¸(€ô¤ì(€¥˜€¡½Á•¹A½ÁÕÀ¤Ý¥¹‘½Ü¹Í•ÑQ¥µ•½ÕÐ  ¤€ôø½Á•¹Ù•¹ÑA½ÁÕÀ¡•Ù•¹Ð¤°‘ÕÉ…Ñ¥½¸€¬€ÄÀÀ¤ì)ô()…Íå¹Œ™Õ¹Ñ¥½¸•áÁ…¹‘±ÕÍÑ•È¡•Ù•¹Ð¤ì(€½¹ÍÐ™•…ÑÕÉ”€ô…ÁÀ¹µ…À¹ÅÕ•ÉåI•¹‘•É•‘•…ÑÕÉ•Ì¡•Ù•¹Ð¹Á½¥¹Ð°ì±…å•ÉÌèl±ÕÍÑ•ÉÌtô¥lÁtì(€¥˜€ …™•…ÑÕÉ”¤É•ÑÕÉ¸ì(€ÑÉäì(€€€½¹ÍÐé½½´€ô…Ý…¥Ð…ÁÀ¹µ…À¹•ÑM½ÕÉ” É•Í¥ÍÑ…¹”µ•Ù•¹ÑÌœ¤¹•Ñ±ÕÍÑ•ÉáÁ…¹Í¥½¹i½½´¡™•…ÑÕÉ”¹ÁÉ½Á•ÉÑ¥•Ì¹±ÕÍÑ•É}¥¤ì(€€€…ÁÀ¹µ…À¹•…Í•Q¼¡ì•¹Ñ•Èè™•…ÑÕÉ”¹•½µ•ÑÉä¹½½É‘¥¹…Ñ•Ì°é½½´ô¤ì(€ô…Ñ €¡•ÉÉ½È¤ì(€€€½¹Í½±”¹Ý…É¸ ±ÕÍÑ•È­½¹¹Ñ”¹¥¡Ð—Ù™™¹•ÐÝ•É‘•¸èœ°•ÉÉ½È¤ì(€ô)ô()™Õ¹Ñ¥½¸Á½ÁÕ±…Ñ•…Ñ•½É¥•Ì ¤ì(€Õ¤¹…Ñ•½Éå¥±Ñ•È¹É•Á±…•¡¥±‘É•¸ ¤ì(€½¹ÍÐ…±°€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ½ÁÑ¥½¸œ¤ì(€…±°¹Ù…±Õ”€ô€…±°œì(€…±°¹Ñ•áÑ½¹Ñ•¹Ð€ô¤Äá¸¹Ð …±±5½Ù•µ•¹ÑÌœ¤ì(€Õ¤¹…Ñ•½Éå¥±Ñ•È¹…ÁÁ•¹¡…±°¤ì(€l¸¸¹¹•ÜM•Ð¡…ÁÀ¹•Ù•¹ÑÌ¹™±…Ñ5…À¡•Ù•¹Ð€ôøm•Ù•¹Ð¹…Ñ•½Éä°€¸¸¹•Ù•¹Ð¹Ñ…Ít¤¥t(€€€€¹Í½ÉÐ ¡„°ˆ¤€ôøÑÉ…¹Í±…Ñ•…Ñ•½Éä¡„°¤Äá¸¹±…¹Õ…”¤¹±½…±•½µÁ…É”¡ÑÉ…¹Í±…Ñ•…Ñ•½Éä¡ˆ°¤Äá¸¹±…¹Õ…”¤°¤Äá¸¹±½…±”¤¤(€€€€¹™½É… ¡…Ñ•½Éä€ôøì(€€€½¹ÍÐ½ÁÑ¥½¸€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ½ÁÑ¥½¸œ¤ì(€€€½ÁÑ¥½¸¹Ù…±Õ”€ô…Ñ•½Éäì(€€€½ÁÑ¥½¸¹Ñ•áÑ½¹Ñ•¹Ð€ôÑÉ…¹Í±…Ñ•…Ñ•½Éä¡…Ñ•½Éä°¤Äá¸¹±…¹Õ…”¤ì(€€€Õ¤¹…Ñ•½Éå¥±Ñ•È¹…ÁÁ•¹¡½ÁÑ¥½¸¤ì(€ô¤ì(€Õ¤¹…Ñ•½Éå¥±Ñ•È¹Ù…±Õ”€ô…ÁÀ¹™¥±Ñ•ÉÌ¹…Ñ•½Éäì)ô()™Õ¹Ñ¥½¸ÕÁ‘…Ñ•É…¥±Ñ•È ¤ì(€±•Ð™É½´€ô9Õµ‰•È¡Õ¤¹•É…É½´¹Ù…±Õ”¤ì(€±•ÐÑ¼€ô9Õµ‰•È¡Õ¤¹•É…Q¼¹Ù…±Õ”¤ì(€¥˜€ …9Õµ‰•È¹¥Í¥¹¥Ñ”¡™É½´¤¤™É½´€ô€´ÄÈÀÀì(€¥˜€ …9Õµ‰•È¹¥Í¥¹¥Ñ”¡Ñ¼¤¤Ñ¼€ô€ÈÀÌÀì(€¥˜€¡™É½´€øÑ¼¤m™É½´°Ñ½t€ômÑ¼°™É½µtì(€Õ¤¹•É…É½´¹Ù…±Õ”€ô™É½´ì(€Õ¤¹•É…Q¼¹Ù…±Õ”€ôÑ¼ì(€…ÁÀ¹™¥±Ñ•ÉÌ¹™É½´€ô™É½´ì(€…ÁÀ¹™¥±Ñ•ÉÌ¹Ñ¼€ôÑ¼ì(€É•¹‘•É5…Á…Ñ„ ¤ì)ô()™Õ¹Ñ¥½¸É•Í•Ñ¥±Ñ•ÉÌ ¤ì(€…ÁÀ¹™¥±Ñ•ÉÌ€ôìÅÕ•Éäè€œœ°…Ñ•½Éäè€…±°œ°™É½´è€´ÄÈÀÀ°Ñ¼è€ÈÀÌÀ°Õ¹‘¥Í½Ù•É•‘=¹±äè™…±Í”ôì(€Õ¤¹Í•…É¡%¹ÁÕÐ¹Ù…±Õ”€ô€œœì(€Õ¤¹…Ñ•½Éå¥±Ñ•È¹Ù…±Õ”€ô€…±°œì(€Õ¤¹•É…É½´¹Ù…±Õ”€ô€´ÄÈÀÀì(€Õ¤¹•É…Q¼¹Ù…±Õ”€ô€ÈÀÌÀì(€Õ¤¹Õ¹‘¥Í½Ù•É•‘=¹±ä¹¡•­•€ô™…±Í”ì(€É•¹‘•É5…Á…Ñ„ ¤ì)ô()™Õ¹Ñ¥½¸…ÁÁ±å¥±Ñ•ÉÍQ½U¤ ¤ì(€Õ¤¹Í•…É¡%¹ÁÕÐ¹Ù…±Õ”€ô…ÁÀ¹™¥±Ñ•ÉÌ¹ÅÕ•Éäì(€Õ¤¹…Ñ•½Éå¥±Ñ•È¹Ù…±Õ”€ô…ÁÀ¹™¥±Ñ•ÉÌ¹…Ñ•½Éäì(€Õ¤¹•É…É½´¹Ù…±Õ”€ô…ÁÀ¹™¥±Ñ•ÉÌ¹™É½´ì(€Õ¤¹•É…Q¼¹Ù…±Õ”€ô…ÁÀ¹™¥±Ñ•ÉÌ¹Ñ¼ì(€Õ¤¹Õ¹‘¥Í½Ù•É•‘=¹±ä¹¡•­•€ô…ÁÀ¹™¥±Ñ•ÉÌ¹Õ¹‘¥Í½Ù•É•‘=¹±äì)ô()™Õ¹Ñ¥½¸±½…‘Y¥•Ý¥±Ñ•ÉÌ ¤ì(€½¹ÍÐ‘•™…Õ±ÑÌ€ôìÅÕ•Éäè€œœ°…Ñ•½Éäè€…±°œ°™É½´è€´ÄÈÀÀ°Ñ¼è€ÈÀÌÀ°Õ¹‘¥Í½Ù•É•‘=¹±äè™…±Í”ôì(€ÑÉäì(€€€½¹ÍÐÍÑ½É•€ô)M=8¹Á…ÉÍ”¡Ý¥¹‘½Ü¹Í•ÍÍ¥½¹MÑ½É…”¹•Ñ%Ñ•´¡Y%]}MQ=I}-d¤ñð€íôœ¤ì(€€€½¹ÍÐ™É½´€ô9Õµ‰•È¡ÍÑ½É•¹™É½´¤ì(€€€½¹ÍÐÑ¼€ô9Õµ‰•È¡ÍÑ½É•¹Ñ¼¤ì(€€€É•ÑÕÉ¸ì(€€€€€ÅÕ•ÉäèÑåÁ•½˜ÍÑ½É•¹ÅÕ•Éä€ôôô€ÍÑÉ¥¹œœ€üÍÑ½É•¹ÅÕ•Éä¹Í±¥” À°€ÄØÀ¤€è‘•™…Õ±ÑÌ¹ÅÕ•Éä°(€€€€€…Ñ•½ÉäèÑåÁ•½˜ÍÑ½É•¹…Ñ•½Éä€ôôô€ÍÑÉ¥¹œœ€üÍÑ½É•¹…Ñ•½Éä¹Í±¥” À°€ÄÀÀ¤€è‘•™…Õ±ÑÌ¹…Ñ•½Éä°(€€€€€™É½´è9Õµ‰•È¹¥Í¥¹¥Ñ”¡™É½´¤€ü5…Ñ ¹µ…à ´ÄÈÀÀ°5…Ñ ¹µ¥¸ ÈÀÌÀ°™É½´¤¤€è‘•™…Õ±ÑÌ¹™É½´°(€€€€€Ñ¼è9Õµ‰•È¹¥Í¥¹¥Ñ”¡Ñ¼¤€ü5…Ñ ¹µ…à ´ÄÈÀÀ°5…Ñ ¹µ¥¸ ÈÀÌÀ°Ñ¼¤¤€è‘•™…Õ±ÑÌ¹Ñ¼°(€€€€€Õ¹‘¥Í½Ù•É•‘=¹±äè	½½±•…¸¡ÍÑ½É•¹Õ¹‘¥Í½Ù•É•‘=¹±ä¤(€€€ôì(€ô…Ñ ì(€€€É•ÑÕÉ¸‘•™…Õ±ÑÌì(€ô)ô()™Õ¹Ñ¥½¸Í…Ù•Y¥•Ý¥±Ñ•ÉÌ ¤ì(€ÑÉäìÝ¥¹‘½Ü¹Í•ÍÍ¥½¹MÑ½É…”¹Í•Ñ%Ñ•´¡Y%]}MQ=I}-d°)M=8¹ÍÑÉ¥¹¥™ä¡…ÁÀ¹™¥±Ñ•ÉÌ¤¤ìô…Ñ ì€¼¨ÁÉ¥Ù…Ñ”µ½‘”€¨¼ô)ô()™Õ¹Ñ¥½¸•Ù•¹ÑM¡…É•UÉ°¡•Ù•¹Ñ%¤ì(€½¹ÍÐÕÉ°€ô¹•ÜUI0¡Ý¥¹‘½Ü¹±½…Ñ¥½¸¹¡É•˜¤ì(€ÕÉ°¹Í•…É¡A…É…µÌ¹Í•Ð •Ù•¹Ðœ°•Ù•¹Ñ%¤ì(€É•ÑÕÉ¸ÕÉ°¹Ñ½MÑÉ¥¹œ ¤ì)ô()™Õ¹Ñ¥½¸Í•ÑÙ•¹Ñ%¹UÉ°¡•Ù•¹Ñ%¤ì(€½¹ÍÐÕÉ°€ô¹•ÜUI0¡Ý¥¹‘½Ü¹±½…Ñ¥½¸¹¡É•˜¤ì(€ÕÉ°¹Í•…É¡A…É…µÌ¹Í•Ð •Ù•¹Ðœ°•Ù•¹Ñ%¤ì(€Ý¥¹‘½Ü¹¡¥ÍÑ½Éä¹É•Á±…•MÑ…Ñ”¡¹Õ±°°€œœ°ÕÉ°¤ì)ô()™Õ¹Ñ¥½¸±•…ÉÙ•¹ÑÉ½µUÉ°¡•Ù•¹Ñ%¤ì(€½¹ÍÐÕÉ°€ô¹•ÜUI0¡Ý¥¹‘½Ü¹±½…Ñ¥½¸¹¡É•˜¤ì(€¥˜€¡ÕÉ°¹Í•…É¡A…É…µÌ¹•Ð •Ù•¹Ðœ¤€„ôô•Ù•¹Ñ%¤É•ÑÕÉ¸ì(€ÕÉ°¹Í•…É¡A…É…µÌ¹‘•±•Ñ” •Ù•¹Ðœ¤ì(€Ý¥¹‘½Ü¹¡¥ÍÑ½Éä¹É•Á±…•MÑ…Ñ”¡¹Õ±°°€œœ°ÕÉ°¤ì)ô()…Íå¹Œ™Õ¹Ñ¥½¸½ÁåÙ•¹Ñ1¥¹¬¡•Ù•¹Ð¤ì(€ÑÉäì(€€€…Ý…¥Ð¹…Ù¥…Ñ½È¹±¥Á‰½…É¹ÝÉ¥Ñ•Q•áÐ¡•Ù•¹ÑM¡…É•UÉ°¡•Ù•¹Ð¹¥¤¤ì(€€€Í¡½ÝQ½…ÍÐ¡¤Äá¸¹Ð •Ù•¹Ñ1¥¹­½Á¥•œ¤°•Ù•¹Ð¹Ñ¥Ñ±”¤ì(€ô…Ñ ì(€€€Í¡½ÝQ½…ÍÐ¡¤Äá¸¹Ð ½Áå…¥±•œ¤°¤Äá¸¹Ð ½Áå…¥±•‘	½‘äœ¤¤ì(€ô)ô()™Õ¹Ñ¥½¸Ñ½±•É…Ý•È¡‘É…Ý•È°…Ñ¥Ù•	ÕÑÑ½¸¤ì(€½¹ÍÐÍ¡½Õ±‘=Á•¸€ô‘É…Ý•È¹¡¥‘‘•¸ì(€±½Í•É…Ý•ÉÌ ¤ì(€¥˜€¡Í¡½Õ±‘=Á•¸¤ì(€€€‘É…Ý•È¹¡¥‘‘•¸€ô™…±Í”ì(€€€Õ¤¹¹…Ù	ÕÑÑ½¹Ì¹™½É… ¡‰ÕÑÑ½¸€ôø‰ÕÑÑ½¸¹±…ÍÍ1¥ÍÐ¹Ñ½±” ¥Ìµ…Ñ¥Ù”œ°‰ÕÑÑ½¸€ôôô…Ñ¥Ù•	ÕÑÑ½¸¤¤ì(€ô)ô()™Õ¹Ñ¥½¸½Á•¹A…¹•°¡Á…¹•°¤ì(€¥˜€¡Á…¹•°€ôôô€ÅÕ¥èœ¤ì½Á•¹EÕ¥è ¤ìÉ•ÑÕÉ¸ÑÉÕ”ìô(€¥˜€¡Á…¹•°€ôôô€µ…Àœ¤ì±½Í•É…Ý•ÉÌ ¤ìÉ•ÑÕÉ¸ÑÉÕ”ìô(€½¹ÍÐ‘É…Ý•ÉÌ€ôì(€€€…É¡¥Ù”èÕ¤¹…É¡¥Ù•É…Ý•È°(€€€…¡¥•Ù•µ•¹ÑÌèÕ¤¹…¡¥•Ù•µ•¹ÑÍÉ…Ý•È°(€€€½¹¹•Ñ¥½¹ÌèÕ¤¹½¹¹•Ñ¥½¹ÍÉ…Ý•È(€ôì(€½¹ÍÐ‘É…Ý•È€ô‘É…Ý•ÉÍmÁ…¹•±tì(€¥˜€ …‘É…Ý•È¤É•ÑÕÉ¸™…±Í”ì(€±½Í•É…Ý•ÉÌ ¤ì(€‘É…Ý•È¹¡¥‘‘•¸€ô™…±Í”ì(€Õ¤¹¹…Ù	ÕÑÑ½¹Ì¹™½É… ¡‰ÕÑÑ½¸€ôø‰ÕÑÑ½¸¹±…ÍÍ1¥ÍÐ¹Ñ½±” ¥Ìµ…Ñ¥Ù”œ°‰ÕÑÑ½¸¹‘…Ñ…Í•Ð¹Á…¹•°€ôôôÁ…¹•°¤¤ì(€¥˜€¡Á…¹•°€ôôô€½¹¹•Ñ¥½¹Ìœ¤‘É…Ý½¹¹•Ñ¥½¸¡™…±Í”¤ì(€É•ÑÕÉ¸ÑÉÕ”ì)ô()™Õ¹Ñ¥½¸±½Í•É…Ý•ÉÌ ¤ì(€Õ¤¹…É¡¥Ù•É…Ý•È¹¡¥‘‘•¸€ôÑÉÕ”ì(€Õ¤¹…¡¥•Ù•µ•¹ÑÍÉ…Ý•È¹¡¥‘‘•¸€ôÑÉÕ”ì(€Õ¤¹½¹¹•Ñ¥½¹ÍÉ…Ý•È¹¡¥‘‘•¸€ôÑÉÕ”ì(€Õ¤¹¹…Ù	ÕÑÑ½¹Ì¹™½É… ¡‰ÕÑÑ½¸€ôø‰ÕÑÑ½¸¹±…ÍÍ1¥ÍÐ¹Ñ½±” ¥Ìµ…Ñ¥Ù”œ°‰ÕÑÑ½¸¹‘…Ñ…Í•Ð¹Á…¹•°€ôôô€µ…Àœ¤¤ì)ô()™Õ¹Ñ¥½¸½Á•¹5½‘…°¡µ½‘…°¤ì(€±½Í•5½‘…±Ì ¤ì(€Õ¤¹µ½‘…±	…­‘É½À¹¡¥‘‘•¸€ô™…±Í”ì(€µ½‘…°¹¡¥‘‘•¸€ô™…±Í”ì(€µ½‘…°¹ÅÕ•ÉåM•±•Ñ½È ‰ÕÑÑ½¸°m¡É•™t°¥¹ÁÕÐœ¤ü¹™½ÕÌ ¤ì)ô()™Õ¹Ñ¥½¸±½Í•5½‘…±Ì ¤ì(€Õ¤¹µ½‘…±	…­‘É½À¹¡¥‘‘•¸€ôÑÉÕ”ì(€Õ¤¹Ý•±½µ•5½‘…°¹¡¥‘‘•¸€ôÑÉÕ”ì(€Õ¤¹ÅÕ¥é5½‘…°¹¡¥‘‘•¸€ôÑÉÕ”ì)ô()™Õ¹Ñ¥½¸Ñ½±•5½‰¥±•5•¹Ô¡½Á•¸¤ì(€Õ¤¹½¹ÑÉ½±A…¹•°¹±…ÍÍ1¥ÍÐ¹Ñ½±” ¥Ìµ½Á•¸œ°½Á•¸¤ì(€Õ¤¹µ•¹ÕQ½±”¹Í•ÑÑÑÉ¥‰ÕÑ” …É¥„µ•áÁ…¹‘•œ°MÑÉ¥¹œ¡½Á•¸¤¤ì)ô()™Õ¹Ñ¥½¸Í•ÑÕÁ!½ÍÑÁ¤ ¤ì(€…ÁÀ¹‰É¥‘”€ôÉ•…Ñ•Ñ±…ÍÁ¤¡ì(€€€¡½ÍÐèÝ¥¹‘½Ü°(€€€Á…É•¹Ñ=É¥¥¸èÉÕ¹Ñ¥µ•½¹™¥œ¹Á…É•¹Ñ=É¥¥¸°(€€€•ÑM¹…ÁÍ¡½Ðè€ ¤€ôø€¡ì(€€€€€É•…‘äè	½½±•…¸¡…ÁÀ¹•Ù•¹ÑÌ¹±•¹Ñ €˜˜…ÁÀ¹µ…À¤°(€€€€€•Ù•¹Ñ½Õ¹Ðè…ÁÀ¹•Ù•¹ÑÌ¹±•¹Ñ °(€€€€€™¥±Ñ•É•‘Ù•¹Ñ½Õ¹Ðè…ÁÀ¹™¥±Ñ•É•‘Ù•¹ÑÌ¹±•¹Ñ °(€€€€€™¥±Ñ•ÉÌè…ÁÀ¹™¥±Ñ•ÉÌ°(€€€€€ÁÉ½É•ÍÌèÍ…¹¥Ñ¥é•AÉ½É•ÍÌ¡…ÁÀ¹ÁÉ½É•ÍÌ¤°(€€€€€…Ñ¥Ù•½¹¹•Ñ¥½¹%è…ÁÀ¹…Ñ¥Ù•½¹¹•Ñ¥½¸ü¹¥ñð¹Õ±°°(€€€€€±…¹Õ…”è¤Äá¸¹±…¹Õ…”(€€€ô¤°(€€€…Ñ¥½¹Ìèì(€€€€€Í•Ñ¥±Ñ•ÉÌè…ÁÁ±åáÑ•É¹…±¥±Ñ•ÉÌ°(€€€€€Í•Ñ1…¹Õ…”è±…¹Õ…”€ôøì(€€€€€€€½¹ÍÐÍÕÁÁ½ÉÑ•€ô19UL¹Í½µ”¡¥Ñ•´€ôø¥Ñ•´¹½‘”€ôôô±…¹Õ…”¤ì(€€€€€€€¥˜€ …ÍÕÁÁ½ÉÑ•¤É•ÑÕÉ¸™…±Í”ì(€€€€€€€Õ¤¹±…¹Õ…•M•±•Ð¹Ù…±Õ”€ô±…¹Õ…”ì(€€€€€€€¡…¹•1…¹Õ…”¡±…¹Õ…”¤ì(€€€€€€€É•ÑÕÉ¸ÑÉÕ”ì(€€€€€ô°(€€€€€™½ÕÍÙ•¹Ðè¥€ôøì(€€€€€€€½¹ÍÐ•Ù•¹Ð€ô…ÁÀ¹•Ù•¹ÑÌ¹™¥¹¡¥Ñ•´€ôø¥Ñ•´¹¥€ôôô¥¤ì(€€€€€€€¥˜€ …•Ù•¹Ð¤É•ÑÕÉ¸™…±Í”ì(€€€€€€€™±åQ½Ù•¹Ð¡•Ù•¹Ð¤ì(€€€€€€€É•ÑÕÉ¸ÑÉÕ”ì(€€€€€ô°(€€€€€É…¹‘½µÙ•¹Ðè€ ¤€ôøì(€€€€€€€™±åQ½I…¹‘½µÙ•¹Ð¡…ÁÀ¹™¥±Ñ•É•‘Ù•¹ÑÌ¤ì(€€€€€€€É•ÑÕÉ¸…ÁÀ¹™¥±Ñ•É•‘Ù•¹ÑÌ¹±•¹Ñ €ø€Àì(€€€€€ô°(€€€€€½Á•¹A…¹•°°(€€€€€•áÁ½ÉÑAÉ½É•ÍÌè€ ¤€ôøÍ…¹¥Ñ¥é•AÉ½É•ÍÌ¡…ÁÀ¹ÁÉ½É•ÍÌ¤°(€€€€€¥µÁ½ÉÑAÉ½É•ÍÌèÙ…±Õ”€ôøì(€€€€€€€…ÁÀ¹ÁÉ½É•ÍÌ€ôÉ•½¹¥±•AÉ½É•ÍÌ¡Ù…±Õ”°¹•ÜM•Ð¡…ÁÀ¹•Ù•¹ÑÌ¹µ…À¡•Ù•¹Ð€ôø•Ù•¹Ð¹¥¤¤¤ì(€€€€€€€•¹ÍÕÉ•5¥ÍÍ¥½¸ ¤ì(€€€€€€€Í…Ù•AÉ½É•ÍÌ ¤ì(€€€€€€€ÕÁ‘…Ñ•…µ•U¤ ¤ì(€€€€€€€É•¹‘•É5…Á…Ñ„ ¤ì(€€€€€€€•µ¥ÑÑ±…ÍÙ•¹Ð ÁÉ½É•ÍÌµ¥µÁ½ÉÑ•œ°ì‘¥Í½Ù•É•‘½Õ¹Ðè…ÁÀ¹ÁÉ½É•ÍÌ¹‘¥Í½Ù•É•‘%‘Ì¹±•¹Ñ ô¤ì(€€€€€€€É•ÑÕÉ¸ÑÉÕ”ì(€€€€€ô°(€€€€€É•Í•ÑAÉ½É•ÍÌè€ ¤€ôøì(€€€€€€€…ÁÀ¹ÁÉ½É•ÍÌ€ôÍ…¹¥Ñ¥é•AÉ½É•ÍÌ¡U1Q}AI=IML¤ì(€€€€€€€•¹ÍÕÉ•5¥ÍÍ¥½¸ ¤ì(€€€€€€€Í…Ù•AÉ½É•ÍÌ ¤ì(€€€€€€€ÕÁ‘…Ñ•…µ•U¤ ¤ì(€€€€€€€É•¹‘•É5…Á…Ñ„ ¤ì(€€€€€€€•µ¥ÑÑ±…ÍÙ•¹Ð ÁÉ½É•ÍÌµÉ•Í•Ðœ°íô¤ì(€€€€€€€É•ÑÕÉ¸ÑÉÕ”ì(€€€€€ô(€€€ô(€ô¤ì(€‘½Õµ•¹Ð¹‘½Õµ•¹Ñ±•µ•¹Ð¹‘…Ñ…Í•Ð¹…Ñ±…ÍÁ¥I•…‘ä€ô…ÁÀ¹‰É¥‘”¹…Á¤¹Ù•ÉÍ¥½¸ì)ô()™Õ¹Ñ¥½¸…ÁÁ±åáÑ•É¹…±¥±Ñ•ÉÌ¡™¥±Ñ•ÉÌ€ôíô¤ì(€½¹ÍÐ…±±½Ý•‘…Ñ•½É¥•Ì€ô¹•ÜM•Ð¡l…±°œ°€¸¸¹…ÁÀ¹•Ù•¹ÑÌ¹™±…Ñ5…À¡•Ù•¹Ð€ôøm•Ù•¹Ð¹…Ñ•½Éä°€¸¸¹•Ù•¹Ð¹Ñ…Ít¥t¤ì(€½¹ÍÐÉ…ÝÉ½´€ô9Õµ‰•È¡™¥±Ñ•ÉÌ¹™É½´€üü…ÁÀ¹™¥±Ñ•ÉÌ¹™É½´¤ì(€½¹ÍÐÉ…ÝQ¼€ô9Õµ‰•È¡™¥±Ñ•ÉÌ¹Ñ¼€üü…ÁÀ¹™¥±Ñ•ÉÌ¹Ñ¼¤ì(€½¹ÍÐ™É½´€ô9Õµ‰•È¹¥Í¥¹¥Ñ”¡É…ÝÉ½´¤€ü5…Ñ ¹µ…à ´ÄÈÀÀ°5…Ñ ¹µ¥¸ ÈÀÌÀ°É…ÝÉ½´¤¤€è…ÁÀ¹™¥±Ñ•ÉÌ¹™É½´ì(€½¹ÍÐÑ¼€ô9Õµ‰•È¹¥Í¥¹¥Ñ”¡É…ÝQ¼¤€ü5…Ñ ¹µ…à ´ÄÈÀÀ°5…Ñ ¹µ¥¸ ÈÀÌÀ°É…ÝQ¼¤¤€è…ÁÀ¹™¥±Ñ•ÉÌ¹Ñ¼ì(€…ÁÀ¹™¥±Ñ•ÉÌ€ôì(€€€ÅÕ•ÉäèMÑÉ¥¹œ¡™¥±Ñ•ÉÌ¹ÅÕ•Éä€üü…ÁÀ¹™¥±Ñ•ÉÌ¹ÅÕ•Éä¤¹Í±¥” À°€ÄØÀ¤°(€€€…Ñ•½Éäè…±±½Ý•‘…Ñ•½É¥•Ì¹¡…Ì¡™¥±Ñ•ÉÌ¹…Ñ•½Éä¤€ü™¥±Ñ•ÉÌ¹…Ñ•½Éä€è…ÁÀ¹™¥±Ñ•ÉÌ¹…Ñ•½Éä°(€€€™É½´è5…Ñ ¹µ¥¸¡™É½´°Ñ¼¤°(€€€Ñ¼è5…Ñ ¹µ…à¡™É½´°Ñ¼¤°(€€€Õ¹‘¥Í½Ù•É•‘=¹±äè	½½±•…¸¡™¥±Ñ•ÉÌ¹Õ¹‘¥Í½Ù•É•‘=¹±ä€üü…ÁÀ¹™¥±Ñ•ÉÌ¹Õ¹‘¥Í½Ù•É•‘=¹±ä¤(€ôì(€Õ¤¹Í•…É¡%¹ÁÕÐ¹Ù…±Õ”€ô…ÁÀ¹™¥±Ñ•ÉÌ¹ÅÕ•Éäì(€Õ¤¹…Ñ•½Éå¥±Ñ•È¹Ù…±Õ”€ô…ÁÀ¹™¥±Ñ•ÉÌ¹…Ñ•½Éäì(€Õ¤¹•É…É½´¹Ù…±Õ”€ô…ÁÀ¹™¥±Ñ•ÉÌ¹™É½´ì(€Õ¤¹•É…Q¼¹Ù…±Õ”€ô…ÁÀ¹™¥±Ñ•ÉÌ¹Ñ¼ì(€Õ¤¹Õ¹‘¥Í½Ù•É•‘=¹±ä¹¡•­•€ô…ÁÀ¹™¥±Ñ•ÉÌ¹Õ¹‘¥Í½Ù•É•‘=¹±äì(€É•¹‘•É5…Á…Ñ„ ¤ì(€•µ¥ÑÑ±…ÍÙ•¹Ð ™¥±Ñ•ÉÌµ¡…¹•œ°ì™¥±Ñ•ÉÌè…ÁÀ¹™¥±Ñ•ÉÌ°É•ÍÕ±Ñ½Õ¹Ðè…ÁÀ¹™¥±Ñ•É•‘Ù•¹ÑÌ¹±•¹Ñ ô¤ì(€É•ÑÕÉ¸ÑÉÕ”ì)ô()™Õ¹Ñ¥½¸•µ¥ÑÑ±…ÍÙ•¹Ð¡ÑåÁ”°‘•Ñ…¥°¤ì(€…ÁÀ¹‰É¥‘”ü¹•µ¥Ð¡ÑåÁ”°‘•Ñ…¥°¤ì)ô()™Õ¹Ñ¥½¸Í•Ñ…Ñ…MÑ…ÑÕÌ¡µ•ÍÍ…”°µ½‘”¤ì(€Õ¤¹‘…Ñ…MÑ…ÑÕÌ¹±…ÍÍ9…µ”€ô‘…Ñ„µÍÑ…ÑÕÌ¥Ì´‘íµ½‘•õ€ì(€Õ¤¹‘…Ñ…MÑ…ÑÕÌ¹±…ÍÑ±•µ•¹Ñ¡¥±¹Ñ•áÑ½¹Ñ•¹Ð€ôµ•ÍÍ…”ì)ô()™Õ¹Ñ¥½¸Í¡½ÝQ½…ÍÐ¡Ñ¥Ñ±”°µ•ÍÍ…”¤ì(€½¹ÍÐÑ½…ÍÐ€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‘¥Øœ¤ì(€Ñ½…ÍÐ¹±…ÍÍ9…µ”€ô€Ñ½…ÍÐœì(€½¹ÍÐÍÑÉ½¹œ€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ÍÑÉ½¹œœ¤ì(€ÍÑÉ½¹œ¹Ñ•áÑ½¹Ñ•¹Ð€ôÑ¥Ñ±”ì(€½¹ÍÐ½Áä€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ÍÁ…¸œ¤ì(€½Áä¹Ñ•áÑ½¹Ñ•¹Ð€ôµ•ÍÍ…”ì(€Ñ½…ÍÐ¹…ÁÁ•¹¡ÍÑÉ½¹œ°½Áä¤ì(€Õ¤¹Ñ½…ÍÑI•¥½¸¹…ÁÁ•¹¡Ñ½…ÍÐ¤ì(€Ý¥¹‘½Ü¹Í•ÑQ¥µ•½ÕÐ  ¤€ôøÑ½…ÍÐ¹É•µ½Ù” ¤°€ÐÈÀÀ¤ì)ô()…Íå¹Œ™Õ¹Ñ¥½¸É•Í½±Ù•%µ…•UÉ°¡•Ù•¹Ð¤ì(€½¹ÍÐ‘¥É•Ð€ôÍ…™•%µ…•UÉ°¡•Ù•¹Ð¹¥µ…•UÉ°¤ì(€¥˜€¡‘¥É•Ð¤É•ÑÕÉ¸‘¥É•Ðì(€½¹ÍÐ…Á¥UÉ°€ôÍ…™•]¥­¥Á•‘¥…Á¥UÉ°¡•Ù•¹Ð¹¥µ…•Á¥UÉ°¤ì(€¥˜€ ……Á¥UÉ°¤É•ÑÕÉ¸€œœì(€½¹ÍÐ½¹ÑÉ½±±•È€ô¹•Ü‰½ÉÑ½¹ÑÉ½±±•È ¤ì(€½¹ÍÐÑ¥µ•½ÕÐ€ôÝ¥¹‘½Ü¹Í•ÑQ¥µ•½ÕÐ  ¤€ôø½¹ÑÉ½±±•È¹…‰½ÉÐ ¤°€ØÀÀÀ¤ì(€ÑÉäì(€€€½¹ÍÐÉ•ÍÁ½¹Í”€ô…Ý…¥Ð™•Ñ ¡…Á¥UÉ°°ìÍ¥¹…°è½¹ÑÉ½±±•È¹Í¥¹…°°É•‘•¹Ñ¥…±Ìè€½µ¥Ðœ°É•™•ÉÉ•ÉA½±¥äè€¹¼µÉ•™•ÉÉ•Èœô¤ì(€€€¥˜€ …É•ÍÁ½¹Í”¹½¬¤É•ÑÕÉ¸€œœì(€€€½¹ÍÐ‘…Ñ„€ô…Ý…¥ÐÉ•ÍÁ½¹Í”¹©Í½¸ ¤ì(€€€É•ÑÕÉ¸Í…™•%µ…•UÉ°¡‘…Ñ„¹Ñ¡Õµ‰¹…¥°ü¹Í½ÕÉ”ñð‘…Ñ„¹½É¥¥¹…±¥µ…”ü¹Í½ÕÉ”ñð€œœ¤ì(€ô…Ñ ì(€€€É•ÑÕÉ¸€œœì(€ô™¥¹…±±äì(€€€Ý¥¹‘½Ü¹±•…ÉQ¥µ•½ÕÐ¡Ñ¥µ•½ÕÐ¤ì(€ô)ô()™Õ¹Ñ¥½¸±½…‘AÉ½É•ÍÌ ¤ì(€ÑÉäì(€€€½¹ÍÐÍ…Ù•€ôÁ…ÉÍ•MÑ½É•‘AÉ½É•ÍÌ¡±½…±MÑ½É…”¹•Ñ%Ñ•´¡MQ=I}-d¤ñð€íôœ¤ì(€€€É•ÑÕÉ¸Í…¹¥Ñ¥é•AÉ½É•ÍÌ¡ì€¸¸¹U1Q}AI=IML°€¸¸¹Í…Ù•ô¤ì(€ô…Ñ ì(€€€É•ÑÕÉ¸Í…¹¥Ñ¥é•AÉ½É•ÍÌ¡U1Q}AI=IML¤ì(€ô)ô()™Õ¹Ñ¥½¸Í…Ù•AÉ½É•ÍÌ ¤ì(€…ÁÀ¹ÁÉ½É•ÍÌ€ôÍ…¹¥Ñ¥é•AÉ½É•ÍÌ¡…ÁÀ¹ÁÉ½É•ÍÌ¤ì(€ÑÉäì±½…±MÑ½É…”¹Í•Ñ%Ñ•´¡MQ=I}-d°)M=8¹ÍÑÉ¥¹¥™ä¡…ÁÀ¹ÁÉ½É•ÍÌ¤¤ìô…Ñ €¡•ÉÉ½È¤ì½¹Í½±”¹Ý…É¸ ½ÉÑÍ¡É¥ÑÐ­½¹¹Ñ”¹¥¡Ð•ÍÁ•¥¡•ÉÐÝ•É‘•¸èœ°•ÉÉ½È¤ìô)ô()™Õ¹Ñ¥½¸ÕÁ‘…Ñ•Y¥Í¥ÑMÑÉ•…¬ ¤ì(€½¹ÍÐÑ½‘…ä€ô¹•Ü…Ñ” ¤ì(€½¹ÍÐ‘…Ñ•-•ä€ôÑ½‘…ä¹Ñ½%M=MÑÉ¥¹œ ¤¹Í±¥” À°€ÄÀ¤ì(€¥˜€¡…ÁÀ¹ÁÉ½É•ÍÌ¹±…ÍÑY¥Í¥Ð€ôôô‘…Ñ•-•ä¤É•ÑÕÉ¸ì(€¥˜€¡…ÁÀ¹ÁÉ½É•ÍÌ¹±…ÍÑY¥Í¥Ð¤ì(€€€½¹ÍÐÁÉ•Ù¥½ÕÌ€ô¹•Ü…Ñ”¡€‘í…ÁÀ¹ÁÉ½É•ÍÌ¹±…ÍÑY¥Í¥ÑõPÀÀèÀÀèÀÁ€¤ì(€€€½¹ÍÐ‘•±Ñ„€ô5…Ñ ¹É½Õ¹ ¡¹•Ü…Ñ”¡€‘í‘…Ñ•-•åõPÀÀèÀÀèÀÁ€¤€´ÁÉ•Ù¥½ÕÌ¤€¼€àØÐÀÀÀÀÀ¤ì(€€€…ÁÀ¹ÁÉ½É•ÍÌ¹Ù¥Í¥ÑMÑÉ•…¬€ô‘•±Ñ„€ôôô€Ä€ü…ÁÀ¹ÁÉ½É•ÍÌ¹Ù¥Í¥ÑMÑÉ•…¬€¬€Ä€è€Äì(€ô(€…ÁÀ¹ÁÉ½É•ÍÌ¹±…ÍÑY¥Í¥Ð€ô‘…Ñ•-•äì(€Í…Ù•AÉ½É•ÍÌ ¤ì)ô()™Õ¹Ñ¥½¸‘¥Í½Ù•É•‘Ù•¹ÑÌ ¤ì(€½¹ÍÐ¥‘Ì€ô¹•ÜM•Ð¡…ÁÀ¹ÁÉ½É•ÍÌ¹‘¥Í½Ù•É•‘%‘Ì¤ì(€É•ÑÕÉ¸…ÁÀ¹•Ù•¹ÑÌ¹™¥±Ñ•È¡•Ù•¹Ð€ôø¥‘Ì¹¡…Ì¡•Ù•¹Ð¹¥¤¤ì)ô()™Õ¹Ñ¥½¸…Ñ•½Éå½±½ÉáÁÉ•ÍÍ¥½¸ ¤ì(€½¹ÍÐ•áÁÉ•ÍÍ¥½¸€ôlµ…Ñ œ°l•Ðœ°€…Ñ•½Éäutì(€=‰©•Ð¹•¹ÑÉ¥•Ì¡Q=Ie}=1=IL¤¹™½É…  ¡m…Ñ•½Éä°½±½Ét¤€ôø•áÁÉ•ÍÍ¥½¸¹ÁÕÍ ¡…Ñ•½Éä°½±½È¤¤ì(€•áÁÉ•ÍÍ¥½¸¹ÁÕÍ  œŒÝá˜œ¤ì(€É•ÑÕÉ¸•áÁÉ•ÍÍ¥½¸ì)ô()™Õ¹Ñ¥½¸•Ù•¹ÑM¥¹…ÑÕÉ”¡•Ù•¹Ð¤ì(€É•ÑÕÉ¸€‘í•Ù•¹Ð¹Ñ¥Ñ±”¹Ñ½1½…±•1½Ý•É…Í” ‘”œ¥õð‘í•Ù•¹Ð¹±½…Ñ¥½¸¹Ñ½1½…±•1½Ý•É…Í” ‘”œ¥õ€ì)ô()™Õ¹Ñ¥½¸Ý¥Ñ¡½ÕÑµÁÑåY…±Õ•Ì¡½‰©•Ð¤ì(€É•ÑÕÉ¸=‰©•Ð¹™É½µ¹ÑÉ¥•Ì¡=‰©•Ð¹•¹ÑÉ¥•Ì¡½‰©•Ð¤¹™¥±Ñ•È ¡l°Ù…±Õ•t¤€ôøÙ…±Õ”€„ôô€œœ(€€€€˜˜Ù…±Õ”€„ôô¹Õ±°(€€€€˜˜Ù…±Õ”€„ôôÕ¹‘•™¥¹•(€€€€˜˜€ …ÉÉ…ä¹¥ÍÉÉ…ä¡Ù…±Õ”¤ñðÙ…±Õ”¹±•¹Ñ €ø€À¤¤¤ì)ô()™Õ¹Ñ¥½¸Í…™•áÑ•É¹…±UÉ°¡Ù…±Õ”¤ì(€ÑÉäì(€€€½¹ÍÐÕÉ°€ô¹•ÜUI0¡Ù…±Õ”¤ì(€€€É•ÑÕÉ¸ÕÉ°¹ÁÉ½Ñ½½°€ôôô€¡ÑÑÁÌèœ€üÕÉ°¹¡É•˜€è€œœì(€ô…Ñ ìÉ•ÑÕÉ¸€œœìô)ô()™Õ¹Ñ¥½¸Í…™•]¥­¥Á•‘¥…Á¥UÉ°¡Ù…±Õ”¤ì(€½¹ÍÐÕÉ°€ôÍ…™•áÑ•É¹…±UÉ°¡Ù…±Õ”¤ì(€¥˜€ …ÕÉ°¤É•ÑÕÉ¸€œœì(€½¹ÍÐ¡½ÍÑ¹…µ”€ô¹•ÜUI0¡ÕÉ°¤¹¡½ÍÑ¹…µ”ì(€É•ÑÕÉ¸l‘”¹Ý¥­¥Á•‘¥„¹½Éœœ°€•¸¹Ý¥­¥Á•‘¥„¹½Éœt¹¥¹±Õ‘•Ì¡¡½ÍÑ¹…µ”¤€üÕÉ°€è€œœì)ô()™Õ¹Ñ¥½¸Í…™•%µ…•UÉ°¡Ù…±Õ”¤ì(€½¹ÍÐÕÉ°€ôÍ…™•áÑ•É¹…±UÉ°¡Ù…±Õ”¤ì(€¥˜€ …ÕÉ°¤É•ÑÕÉ¸€œœì(€É•ÑÕÉ¸¹•ÜUI0¡ÕÉ°¤¹¡½ÍÑ¹…µ”€ôôô€ÕÁ±½…¹Ý¥­¥µ•‘¥„¹½Éœœ€üÕÉ°€è€œœì)ô()™Õ¹Ñ¥½¸‘…¥±åM•• ¤ìÉ•ÑÕÉ¸¹•Ü…Ñ” ¤¹Ñ½%M=MÑÉ¥¹œ ¤¹Í±¥” À°€ÄÀ¤ìô)™Õ¹Ñ¥½¸Ñ½…µ•°¡Ù…±Õ”¤ìÉ•ÑÕÉ¸Ù…±Õ”¹É•Á±…” ¼´¡m„µét¤½œ°€¡|°±•ÑÑ•È¤€ôø±•ÑÑ•È¹Ñ½UÁÁ•É…Í” ¤¤ìô)™Õ¹Ñ¥½¸¥Í½Éµ±•µ•¹Ð¡•±•µ•¹Ð¤ìÉ•ÑÕÉ¸l%9AUPœ°€M1Pœ°€QaQIt¹¥¹±Õ‘•Ì¡•±•µ•¹Ðü¹Ñ…9…µ”¤ìô()™Õ¹Ñ¥½¸Ý…¥Ñ½É5…Á1¥‰É”¡Ñ¥µ•½ÕÐ€ô€ÄÀÀÀÀ¤ì(€½¹ÍÐÍÑ…ÉÑ•€ô…Ñ”¹¹½Ü ¤ì(€É•ÑÕÉ¸¹•ÜAÉ½µ¥Í” ¡É•Í½±Ù”°É•©•Ð¤€ôøì(€€€½¹ÍÐ¡•¬€ô€ ¤€ôøì(€€€€€¥˜€¡Ý¥¹‘½Ü¹µ…Á±¥‰É•°¤É•ÑÕÉ¸É•Í½±Ù” ¤ì(€€€€€¥˜€¡…Ñ”¹¹½Ü ¤€´ÍÑ…ÉÑ•€øÑ¥µ•½ÕÐ¤É•ÑÕÉ¸É•©•Ð¡¹•ÜÉÉ½È 5…Á1¥‰É”ÝÕÉ‘”¹¥¡Ð•±…‘•¸¸œ¤¤ì(€€€€€Ý¥¹‘½Ü¹Í•ÑQ¥µ•½ÕÐ¡¡•¬°€ÔÀ¤ì(€€€ôì(€€€¡•¬ ¤ì(€ô¤ì)ô(