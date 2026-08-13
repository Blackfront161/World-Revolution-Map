import {
  CATEGORY_COLORS,
  createConnection,
  createMission,
  createPowerExcuse,
  createQuiz,
  filterEvents,
  isSensitiveEvent,
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
  { id: 'first-trace', icon: '✦', title: 'Erste Spur', description: 'Sichere deinen ersten Archiveintrag.', test: ({ discovered }) => discovered.length >= 1 },
  { id: 'collector', icon: '▤', title: 'Spurensammler*in', description: 'Entdecke fünf Ereignisse.', test: ({ discovered }) => discovered.length >= 5 },
  { id: 'archivist', icon: '⌘', title: 'Archivar*in', description: 'Entdecke zehn Ereignisse.', test: ({ discovered }) => discovered.length >= 10 },
  { id: 'world-link', icon: '◎', title: 'Globale Verbindung', description: 'Finde Spuren auf vier Kontinenten.', test: ({ discovered }) => new Set(discovered.map(event => event.continent)).size >= 4 },
  { id: 'time-traveller', icon: '⌛', title: 'Zeitreisende*r', description: 'Entdecke Ereignisse aus drei Jahrhunderten.', test: ({ discovered }) => new Set(discovered.filter(event => event.yearStart).map(event => Math.floor(event.yearStart / 100))).size >= 3 },
  { id: 'quiz-mind', icon: '?', title: 'Kritischer Geist', description: 'Beantworte drei Quizfragen richtig.', test: ({ progress }) => progress.quizAnswered >= 3 },
  { id: 'mission-one', icon: '◈', title: 'Mission erfüllt', description: 'Schließe deine erste Mission ab.', test: ({ progress }) => progress.missionsCompleted >= 1 },
  { id: 'spark-smith', icon: '⚡', title: 'Funken-Schmied*in', description: 'Entdecke fünf neue Verbindungen im Funkenlabor.', test: ({ progress }) => progress.connectionIds.length >= 5 },
  { id: 'solidarity-chain', icon: '⛓', title: 'Internationale der offenen Tabs', description: 'Erreiche eine Solidaritäts-Combo von vier.', test: ({ progress }) => progress.bestSolidarityCombo >= 4 },
  { id: 'completionist', icon: '★', title: 'Lebendiges Gedächtnis', description: 'Erschließe das gesamte kuratierte Archiv.', test: ({ discovered, events }) => events.length > 0 && discovered.length === events.length }
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
  bridge: null,
  lastFocus: null
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
    'quiz-modal', 'quiz-title', 'quiz-content', 'welcome-modal', 'methodology-modal', 'modal-backdrop', 'begin-button',
    'methodology-button', 'about-map-button', 'help-button', 'toast-region', 'menu-toggle', 'menu-close', 'control-panel', 'language-select',
    'active-filters', 'event-list-drawer', 'event-list-body'
  ];
  ids.forEach(id => { ui[toCamel(id)] = document.getElementById(id); });
  ui.navButtons = [...document.querySelectorAll('.nav-button')];
  ui.skipList = document.querySelector('.skip-link-list');
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
  ui.skipList.addEventListener('click', event => { event.preventDefault(); openPanel('list'); ui.eventListDrawer.focus(); });
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
  ui.methodologyButton.addEventListener('click', () => openModal(ui.methodologyModal));
  ui.aboutMapButton.addEventListener('click', () => openModal(ui.methodologyModal));
  ui.modalBackdrop.addEventListener('click', closeModals);
  ui.modalCloseButtons.forEach(button => button.addEventListener('click', closeModals));
  ui.drawerCloseButtons.forEach(button => button.addEventListener('click', closeDrawers));
  ui.menuToggle.addEventListener('click', () => toggleMobileMenu(true));
  ui.menuClose.addEventListener('click', () => toggleMobileMenu(false));

  ui.navButtons.forEach(button => button.addEventListener('click', () => {
    const panel = button.dataset.panel;
    if (panel === 'archive') toggleDrawer(ui.archiveDrawer, button);
    if (panel === 'list') toggleDrawer(ui.eventListDrawer, button);
    if (panel === 'achievements') toggleDrawer(ui.achievementsDrawer, button);
    if (panel === 'connections') {
      toggleDrawer(ui.connectionsDrawer, button);
      if (!ui.connectionsDrawer.hidden) drawConnection(false);
    }
    if (panel === 'map') closeDrawers();
  }));

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeModals(); closeDrawers(); toggleMobileMenu(false); }
    if (event.key === 'Tab') trapModalFocus(event);
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
    throw new Error('Datenkatalog ist ungültig.');
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
        'circle-color': categoryColorExpression(),
        'circle-radius': ['case', ['==', ['get', 'discovered'], true], 6, 8],
        'circle-opacity': ['case', ['==', ['get', 'discovered'], true], .55, .95],
        'circle-stroke-width': ['case', ['==', ['get', 'discovered'], true], 1, 2],
        'circle-stroke-color': ['case', ['==', ['get', 'discovered'], true], '#dbe9df', '#ffffff']
      }
    });

    app.map.on('click', 'clusters', expandCluster);
    app.map.on('click', 'event-points', event => {
      const selected = app.events.find(item => item.id === event.features?.[0]?.properties?.id);
      if (selected) openEventPopup(selected, event.features[0].geometry.coordinates);
    });
    ['clusters', 'event-points'].forEach(layer => {
      app.map.on('mouseenter', layer, () => { app.map.getCanvas().style.cursor = 'pointer'; });
      app.map.on('mouseleave', layer, () => { app.map.getCanvas().style.cursor = ''; });
    });

    renderMapData();
    const eventId = new URLSearchParams(window.location.search).get('event');
    const deepLinkedEvent = app.events.find(event => event.id === eventId);
    if (deepLinkedEvent) window.setTimeout(() => flyToEvent(deepLinkedEvent), 150);
  });
}

function renderMapData() {
  const discovered = new Set(app.progress.discoveredIds);
  app.filteredEvents = filterEvents(app.events, app.filters, discovered);
  ui.resultCount.textContent = `${app.filteredEvents.length.toLocaleString(i18n.locale)} ${i18n.t(app.filteredEvents.length === 1 ? 'eventOne' : 'eventMany')}`;
  ui.clearSearch.hidden = !app.filters.query;
  renderActiveFilters();
  renderEventList();
  saveViewFilters();
  const source = app.map?.getSource('resistance-events');
  if (source) source.setData(toGeoJson(app.filteredEvents));
}

function renderActiveFilters() {
  ui.activeFilters.replaceChildren();
  const chips = [];
  if (app.filters.query) chips.push({ label: `⌕ ${app.filters.query}`, clear: () => { app.filters.query = ''; ui.searchInput.value = ''; } });
  if (app.filters.category !== 'all') chips.push({ label: translateCategory(app.filters.category, i18n.language), clear: () => { app.filters.category = 'all'; ui.categoryFilter.value = 'all'; } });
  if (Number(app.filters.from) !== -1200 || Number(app.filters.to) !== 2030) chips.push({ label: `${app.filters.from}–${app.filters.to}`, clear: () => { app.filters.from = -1200; app.filters.to = 2030; ui.eraFrom.value = -1200; ui.eraTo.value = 2030; } });
  if (app.filters.undiscoveredOnly) chips.push({ label: i18n.t('undiscovered'), clear: () => { app.filters.undiscoveredOnly = false; ui.undiscoveredOnly.checked = false; } });
  chips.forEach(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-chip';
    button.textContent = item.label;
    button.setAttribute('aria-label', `${i18n.t('removeFilter')}: ${item.label}`);
    button.addEventListener('click', () => { item.clear(); renderMapData(); });
    ui.activeFilters.append(button);
  });
}

function renderEventList() {
  ui.eventListBody.replaceChildren();
  const fragment = document.createDocumentFragment();
  [...app.filteredEvents].sort((a, b) => (a.yearStart ?? 9999) - (b.yearStart ?? 9999)).forEach(event => {
    const row = document.createElement('tr');
    const year = document.createElement('td');
    year.textContent = formatLocalizedYear(event, i18n);
    const titleCell = document.createElement('td');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = event.title;
    button.addEventListener('click', () => { closeDrawers(); flyToEvent(event); });
    titleCell.append(button);
    const place = document.createElement('td');
    place.textContent = event.location;
    const movement = document.createElement('td');
    movement.textContent = translateCategory(event.category, i18n.language);
    row.append(year, titleCell, place, movement);
    fragment.append(row);
  });
  ui.eventListBody.append(fragment);
  if (!app.filteredEvents.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 4;
    cell.textContent = i18n.t('noResults');
    row.append(cell);
    ui.eventListBody.append(row);
  }
}

function toGeoJson(events) {
  const discovered = new Set(app.progress.discoveredIds);
  const missionTargets = new Set(currentMissionTargets().map(event => event.id));
  return {
    type: 'FeatureCollection',
    features: events.map(event => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [event.longitude, event.latitude] },
      properties: {
        id: event.id,
        title: event.title,
        category: event.category,
        yearStart: event.yearStart || 0,
        discovered: discovered.has(event.id),
        missionTarget: missionTargets.has(event.id) && !app.progress.mission?.completedIds?.includes(event.id)
      }
    }))
  };
}

async function openEventPopup(event, coordinates = [event.longitude, event.latitude]) {
  if (app.popup) app.popup.remove();
  const content = document.createElement('article');
  content.className = 'event-popup';
  content.setAttribute('role', 'dialog');
  content.setAttribute('aria-modal', 'false');
  const sensitive = isSensitiveEvent(event);
  content.classList.toggle('is-sensitive', sensitive);

  const media = document.createElement('div');
  media.className = 'event-popup-placeholder';
  media.textContent = '✦';
  content.append(media);

  const body = document.createElement('div');
  body.className = 'event-popup-body';
  const meta = document.createElement('div');
  meta.className = 'event-popup-meta';
  const category = document.createElement('span');
  category.className = 'event-popup-category';
  category.textContent = translateCategory(event.category, i18n.language);
  const year = document.createElement('span');
  year.textContent = formatLocalizedYear(event, i18n);
  meta.append(category, year);

  const title = document.createElement('h3');
  title.id = `event-title-${event.id}`;
  title.tabIndex = -1;
  title.textContent = event.title;
  content.setAttribute('aria-labelledby', title.id);
  const location = document.createElement('p');
  location.className = 'event-popup-location';
  location.textContent = `⌖ ${event.location}`;
  const description = document.createElement('p');
  description.className = 'event-popup-description';
  description.textContent = event.description;
  body.append(meta, title, location, description);
  if (sensitive) {
    const notice = document.createElement('p');
    notice.className = 'sensitivity-notice';
    notice.textContent = `${i18n.t('sensitiveNotice')} ${event.sensitivity}`;
    body.append(notice);
  }
  if (i18n.language !== 'de') {
    const languageNote = document.createElement('small');
    languageNote.className = 'event-language-note';
    languageNote.textContent = i18n.t('originalGerman');
    description.before(languageNote);
  }

  if (event.tags.length) {
    const tags = document.createElement('div');
    tags.className = 'event-popup-tags';
    event.tags.slice(0, 4).forEach(tag => {
      const chip = document.createElement('span');
      chip.textContent = translateCategory(tag, i18n.language);
      tags.append(chip);
    });
    body.append(tags);
  }

  const details = document.createElement('div');
  details.className = 'event-detail-grid';
  appendEventDetail(details, i18n.t('demands'), event.demands);
  appendEventDetail(details, i18n.t('participants'), event.participants);
  appendEventDetail(details, i18n.t('powerStructures'), event.powerStructures);
  appendEventDetail(details, i18n.t('tactics'), event.tactics);
  appendEventDetail(details, i18n.t('immediateConsequences'), event.immediateConsequences);
  appendEventDetail(details, i18n.t('longTermImpact'), event.longTermImpact);
  appendEventDetail(details, i18n.t('repression'), event.repression);
  appendEventDetail(details, i18n.t('humanCosts'), event.humanCosts);
  appendEventDetail(details, i18n.t('aftermath'), event.aftermath);
  appendEventDetail(details, i18n.t('openQuestions'), event.openQuestions);
  appendEventDetail(details, i18n.t('voices'), event.voices);
  appendEventDetail(details, i18n.t('uncertainty'), event.uncertainty);
  if (details.childElementCount) body.append(details);

  const actions = document.createElement('div');
  actions.className = 'event-popup-actions';
  const discoverButton = document.createElement('button');
  discoverButton.type = 'button';
  discoverButton.className = 'discover-button';
  const isDiscovered = app.progress.discoveredIds.includes(event.id);
  discoverButton.textContent = isDiscovered ? i18n.t('inArchive') : i18n.t(sensitive ? 'bookmarkEvent' : 'saveTrace');
  discoverButton.disabled = isDiscovered;
  discoverButton.addEventListener('click', () => discoverEvent(event, discoverButton));
  actions.append(discoverButton);

  const sourceUrl = safeExternalUrl(event.sourceUrl);
  if (sourceUrl) {
    const source = document.createElement('a');
    source.className = 'source-link';
    source.href = sourceUrl;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    source.textContent = i18n.t('source');
    actions.append(source);
  }
  const share = document.createElement('button');
  share.type = 'button';
  share.className = 'share-link';
  share.textContent = i18n.t('copyEventLink');
  share.addEventListener('click', () => copyEventLink(event));
  actions.append(share);
  body.append(actions);
  const sourceMetadata = document.createElement('div');
  sourceMetadata.className = 'source-metadata';
  for (const value of [event.sourceType, event.sourceQuality, event.reviewStatus]) {
    if (!value) continue;
    const badge = document.createElement('span');
    badge.className = 'source-badge';
    badge.textContent = value;
    sourceMetadata.append(badge);
  }
  if (sourceMetadata.childElementCount) body.append(sourceMetadata);
  if (event.significance) {
    const significance = document.createElement('p');
    significance.className = 'event-popup-description event-popup-significance';
    const label = document.createElement('strong');
    label.textContent = i18n.t('whyImportant');
    significance.append(label, document.createTextNode(event.significance));
    body.append(significance);
  }
  content.append(body);

  app.popup = new window.maplibregl.Popup({ offset: 14, closeButton: true, focusAfterOpen: false })
    .setLngLat(coordinates)
    .setDOMContent(content)
    .addTo(app.map);
  content.closest('.maplibregl-popup-content')?.scrollTo({ top: 0 });
  title.focus({ preventScroll: true });
  setEventInUrl(event.id);
  app.popup.on('close', () => clearEventFromUrl(event.id));

  const imageUrl = await resolveImageUrl(event);
  if (imageUrl && content.isConnected) {
    const image = document.createElement('img');
    image.className = 'event-popup-image';
    image.src = imageUrl;
    image.alt = event.imageAlt;
    image.loading = 'lazy';
    image.addEventListener('error', () => image.replaceWith(media));
    media.replaceWith(image);
  }
}

function appendEventDetail(container, label, value) {
  const values = Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
  if (!values.length) return;
  const section = document.createElement('section');
  section.className = 'event-detail-section';
  const heading = document.createElement('h4');
  heading.textContent = label;
  section.append(heading);
  if (Array.isArray(value)) {
    const list = document.createElement('ul');
    values.forEach(item => { const entry = document.createElement('li'); entry.textContent = item; list.append(entry); });
    section.append(list);
  } else {
    const paragraph = document.createElement('p');
    paragraph.textContent = values[0];
    section.append(paragraph);
  }
  container.append(section);
}

function discoverEvent(event, button) {
  if (app.progress.discoveredIds.includes(event.id)) return;
  const sensitive = isSensitiveEvent(event);
  const previous = sensitive ? null : app.events.find(item => item.id === app.progress.lastDiscoveredId);
  app.progress.discoveredIds.push(event.id);
  const discoveryXp = sensitive ? 0 : 15 + (event.difficulty * 5);
  if (discoveryXp) awardXp(discoveryXp);
  const solidarity = sensitive ? { combo: app.progress.solidarityCombo, bonusXp: 0, sharedTags: [] } : solidarityResult(previous, event, app.progress.solidarityCombo);
  if (!sensitive) {
    app.progress.solidarityCombo = solidarity.combo;
    app.progress.bestSolidarityCombo = Math.max(app.progress.bestSolidarityCombo, solidarity.combo);
    app.progress.lastDiscoveredId = event.id;
    if (solidarity.bonusXp) awardXp(solidarity.bonusXp, false);
  }
  button.textContent = i18n.t('inArchive');
  button.disabled = true;

  const mission = app.progress.mission;
  if (!sensitive && mission && !mission.complete && mission.targetIds.includes(event.id) && !mission.completedIds.includes(event.id)) {
    mission.completedIds.push(event.id);
    awardXp(10, false);
    if (mission.completedIds.length >= mission.goal) {
      mission.complete = true;
      app.progress.missionsCompleted += 1;
      awardXp(mission.reward, false);
      showToast(i18n.t('missionSuccess'), i18n.t('missionBonus', { xp: mission.reward }));
    }
  }

  if (!sensitive) checkAchievements();
  saveProgress();
  updateGameUi();
  renderMapData();
  if (sensitive) {
    showToast(i18n.t('bookmarked'), event.title);
  } else if (solidarity.bonusXp) {
    showToast(`Solidarity combo ×${solidarity.combo}`, `${translateCategory(solidarity.sharedTags[0], i18n.language)} · +${solidarity.bonusXp} XP`);
  } else {
    showToast(i18n.t('newTrace'), `${event.title} · +${discoveryXp} XP`);
  }
  emitAtlasEvent('event-discovered', { id: event.id, xp: app.progress.xp, combo: solidarity.combo });
}

function awardXp(amount, show = true) {
  const before = levelProgress(app.progress.xp).level;
  app.progress.xp += amount;
  const after = levelProgress(app.progress.xp).level;
  if (show && after > before) showToast(i18n.t('levelReached', { level: after }), i18n.t('levelBody'));
}

function ensureMission() {
  const mission = app.progress.mission;
  const validTargets = new Set(app.events.map(event => event.id));
  const missionIsUsable = mission
    && Array.isArray(mission.targetIds)
    && mission.targetIds.length > 0
    && mission.targetIds.every(id => validTargets.has(id));

  if (!missionIsUsable) {
    app.progress.mission = createMission(app.events, dailySeed());
  } else {
    app.progress.mission.completedIds = Array.isArray(mission.completedIds)
      ? mission.completedIds.filter(id => mission.targetIds.includes(id))
      : [];
  }
  saveProgress();
}

function startNewMission() {
  if (!app.events.length) return;
  if (app.progress.mission && !app.progress.mission.complete && app.progress.mission.completedIds.length > 0) {
    const confirmed = window.confirm(i18n.t('replaceMission'));
    if (!confirmed) return;
  }
  app.progress.mission = createMission(app.events, `${Date.now()}-${Math.random()}`);
  saveProgress();
  updateMissionUi();
  renderMapData();
  const target = currentMissionTargets()[0];
  if (target) flyToEvent(target, false);
  showToast(i18n.t('newMissionToast'), localizedMission(app.progress.mission).description);
}

function currentMissionTargets() {
  const ids = new Set(app.progress.mission?.targetIds || []);
  return app.events.filter(event => ids.has(event.id));
}

function updateGameUi() {
  const level = levelProgress(app.progress.xp);
  ui.levelValue.textContent = level.level;
  ui.xpValue.textContent = app.progress.xp;
  ui.xpProgress.style.width = `${level.percent}%`;
  const discovered = discoveredEvents();
  ui.archiveCount.textContent = discovered.length;
  ui.achievementCount.textContent = app.progress.unlockedAchievements.length;
  updateMissionUi();
  renderArchive(discovered);
  renderAchievements();
}

function updateMissionUi() {
  const mission = app.progress.mission;
  if (!mission) return;
  const count = mission.completedIds.length;
  const localized = localizedMission(mission);
  ui.missionTitle.textContent = mission.complete ? i18n.t('missionDone') : localized.title;
  ui.missionDescription.textContent = mission.complete ? i18n.t('missionDoneBody') : localized.description;
  ui.missionReward.textContent = mission.complete ? i18n.t('fulfilled') : `+${mission.reward} XP`;
  ui.missionProgressText.textContent = `${Math.min(count, mission.goal)} / ${mission.goal}`;
  ui.missionProgressBar.style.width = `${mission.goal ? Math.min(100, (count / mission.goal) * 100) : 0}%`;
}

function localizedMission(mission) {
  const category = mission.category ? translateCategory(mission.category, i18n.language) : '';
  return {
    title: mission.category ? i18n.t('missionMap', { category }) : i18n.t('missionHidden'),
    description: mission.category
      ? i18n.t('missionCategory', { count: mission.goal, category })
      : i18n.t('missionGeneral', { count: mission.goal })
  };
}

function renderArchive(discovered) {
  ui.archiveList.replaceChildren();
  if (!discovered.length) {
    const empty = document.createElement('p');
    empty.className = 'archive-empty';
    empty.textContent = i18n.t('archiveEmpty');
    ui.archiveList.append(empty);
    return;
  }

  [...discovered].sort((a, b) => (a.yearStart || 9999) - (b.yearStart || 9999)).forEach(event => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'archive-entry';
    const year = document.createElement('span');
    year.className = 'archive-year';
    year.textContent = event.yearStart || '?';
    const copy = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = event.title;
    const location = document.createElement('small');
    location.textContent = `${event.location} · ${translateCategory(event.category, i18n.language)}`;
    copy.append(title, location);
    const arrow = document.createElement('span');
    arrow.textContent = '→';
    button.append(year, copy, arrow);
    button.addEventListener('click', () => { closeDrawers(); flyToEvent(event); });
    ui.archiveList.append(button);
  });
}

function checkAchievements() {
  const context = { progress: app.progress, discovered: discoveredEvents(), events: app.events };
  ACHIEVEMENTS.forEach(achievement => {
    if (!app.progress.unlockedAchievements.includes(achievement.id) && achievement.test(context)) {
      app.progress.unlockedAchievements.push(achievement.id);
      app.progress.xp += 25;
      showToast(i18n.t('achievementToast', { title: achievement.title }), '+25 XP');
    }
  });
}

function renderAchievements() {
  ui.achievementList.replaceChildren();
  ACHIEVEMENTS.forEach(achievement => {
    const card = document.createElement('article');
    const unlocked = app.progress.unlockedAchievements.includes(achievement.id);
    card.className = `achievement${unlocked ? ' is-unlocked' : ''}`;
    const icon = document.createElement('span');
    icon.className = 'achievement-icon';
    icon.textContent = achievement.icon;
    const title = document.createElement('strong');
    title.textContent = unlocked ? achievement.title : i18n.t('hiddenAchievement');
    const description = document.createElement('small');
    description.textContent = achievement.description;
    card.append(icon, title, description);
    ui.achievementList.append(card);
  });
}

function drawConnection(rewardNew = true) {
  const discovered = discoveredEvents().filter(event => !isSensitiveEvent(event));
  const pool = discovered.length >= 2 ? discovered : app.events.filter(event => !isSensitiveEvent(event));
  const connection = createConnection(pool, Date.now() + '-' + Math.random());
  if (!connection) {
    ui.connectionContent.textContent = i18n.t('noConnection');
    return;
  }
  app.activeConnection = connection;
  renderConnection(connection);
  renderPowerExcuse();

  if (rewardNew && discovered.length >= 2 && !app.progress.connectionIds.includes(connection.id)) {
    app.progress.connectionIds.push(connection.id);
    awardXp(8, false);
    checkAchievements();
    saveProgress();
    updateGameUi();
    showToast(i18n.t('sparkSaved'), i18n.t('sparkSavedBody'));
    emitAtlasEvent('connection-created', { id: connection.id, eventIds: connection.eventIds });
  }
}

function renderConnection(connection) {
  ui.connectionContent.replaceChildren();
  const events = connection.eventIds.map(id => app.events.find(event => event.id === id)).filter(Boolean);
  if (events.length !== 2) return;

  const headline = document.createElement('h3');
  headline.className = 'connection-headline';
  headline.textContent = localizedConnectionHeadline(connection, events);
  const grid = document.createElement('div');
  grid.className = 'connection-grid';
  events.forEach((event, index) => {
    if (index) {
      const bolt = document.createElement('span');
      bolt.className = 'connection-bolt';
      bolt.textContent = '⚡';
      bolt.setAttribute('aria-hidden', 'true');
      grid.append(bolt);
    }
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'connection-event';
    const year = document.createElement('span');
    year.className = 'connection-year';
    year.textContent = formatLocalizedYear(event, i18n);
    const title = document.createElement('strong');
    title.textContent = event.title;
    const place = document.createElement('small');
    place.textContent = event.location;
    card.append(year, title, place);
    card.addEventListener('click', () => { closeDrawers(); flyToEvent(event); });
    grid.append(card);
  });

  const insight = document.createElement('p');
  insight.className = 'connection-insight';
  insight.textContent = i18n.t('connectionInsight', {
    first: events[0].title,
    second: events[1].title,
    tags: connection.sharedTags.slice(0, 3).map(tag => translateCategory(tag, i18n.language)).join(', ')
  });
  const tags = document.createElement('div');
  tags.className = 'connection-tags';
  connection.sharedTags.slice(0, 5).forEach(tag => {
    const chip = document.createElement('span');
    chip.textContent = translateCategory(tag, i18n.language);
    tags.append(chip);
  });
  ui.connectionContent.append(headline, grid, insight, tags);
}

function localizedConnectionHeadline(connection, events) {
  if (events[0].continent !== events[1].continent) return i18n.t('connectionInternational');
  if (Math.abs((events[0].yearStart || 0) - (events[1].yearStart || 0)) >= 500) return i18n.t('connectionTime');
  return i18n.t('connectionParallel');
}

function renderPowerExcuse() {
  const discovered = discoveredEvents().filter(event => !isSensitiveEvent(event));
  const pool = discovered.length ? discovered : app.events.filter(event => !isSensitiveEvent(event));
  const event = seededShuffle(pool, Date.now() + '-counter')[0];
  const item = createPowerExcuse(event, Date.now() + '-' + Math.random());
  ui.powerExcuse.textContent = i18n.language === 'de' ? item.excuse : i18n.t('defaultExcuse');
  ui.powerCounter.textContent = i18n.language === 'de' ? item.counter : `${i18n.t('defaultCounter')} ${event?.title || ''}`;
}

async function copyConnection() {
  if (!app.activeConnection) return;
  const text = app.activeConnection.headline + '\n' + app.activeConnection.insight + '\n#AtlasDesWiderstands';
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API fehlt');
    await navigator.clipboard.writeText(text);
    showToast(i18n.t('connectionCopied'), i18n.t('connectionCopiedBody'));
  } catch {
    showToast(i18n.t('copyFailed'), i18n.t('copyFailedBody'));
  }
}

function openQuiz() {
  const discovered = discoveredEvents().filter(event => !isSensitiveEvent(event));
  const pool = discovered.length ? discovered : app.events.filter(event => !isSensitiveEvent(event));
  if (!pool.length) return;
  const event = seededShuffle(pool, `${Date.now()}-quiz`)[0];
  app.activeQuiz = { event, ...createQuiz(event, app.events, Date.now()), answered: false };
  ui.quizTitle.textContent = i18n.t(Number.isFinite(Number(app.activeQuiz.answer)) ? 'quizYear' : 'quizCategory', { title: event.title });
  renderQuiz();
  openModal(ui.quizModal);
}

function renderQuiz() {
  const quiz = app.activeQuiz;
  ui.quizContent.replaceChildren();
  const eventCard = document.createElement('div');
  eventCard.className = 'quiz-event';
  const marker = document.createElement('span');
  marker.textContent = '✦';
  const copy = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = quiz.event.title;
  const place = document.createElement('small');
  place.textContent = quiz.event.location;
  copy.append(title, document.createElement('br'), place);
  eventCard.append(marker, copy);

  const options = document.createElement('div');
  options.className = 'quiz-options';
  quiz.options.forEach(option => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quiz-option';
    button.dataset.answer = String(option);
    button.textContent = Number.isFinite(Number(option)) ? option : translateCategory(option, i18n.language);
    button.addEventListener('click', () => answerQuiz(option, button, options));
    options.append(button);
  });
  ui.quizContent.append(eventCard, options);
}

function answerQuiz(option, button, options) {
  if (app.activeQuiz.answered) return;
  app.activeQuiz.answered = true;
  const correct = String(option) === String(app.activeQuiz.answer);
  [...options.children].forEach(item => {
    item.disabled = true;
    if (item.dataset.answer === String(app.activeQuiz.answer)) item.classList.add('is-correct');
  });
  if (!correct) button.classList.add('is-wrong');
  if (correct) {
    app.progress.quizAnswered += 1;
    awardXp(20, false);
    checkAchievements();
    saveProgress();
    updateGameUi();
    showToast(i18n.t('correct'), '+20 XP');
  } else {
    const answer = Number.isFinite(Number(app.activeQuiz.answer)) ? app.activeQuiz.answer : translateCategory(app.activeQuiz.answer, i18n.language);
    showToast(i18n.t('almost'), i18n.t('correctAnswer', { answer }));
  }
}

function flyToRandomEvent(events) {
  if (!events.length) { showToast(i18n.t('noResults'), i18n.t('resetHint')); return; }
  const event = seededShuffle(events, `${Date.now()}-random`)[0];
  flyToEvent(event);
}

function fitFilteredEvents() {
  if (!app.filteredEvents.length) {
    showToast(i18n.t('noResults'), i18n.t('resetHint'));
    return;
  }
  if (app.filteredEvents.length === 1) {
    flyToEvent(app.filteredEvents[0]);
    return;
  }
  const bounds = new window.maplibregl.LngLatBounds();
  app.filteredEvents.forEach(event => bounds.extend([event.longitude, event.latitude]));
  app.map.fitBounds(bounds, {
    padding: { top: 110, right: 80, bottom: 110, left: window.innerWidth > 820 ? 390 : 60 },
    maxZoom: 6,
    duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 850
  });
}

function flyToEvent(event, openPopup = true) {
  if (!app.map) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reducedMotion ? 0 : 1200;
  app.map.flyTo({
    center: [event.longitude, event.latitude],
    zoom: Math.max(app.map.getZoom(), 5),
    offset: [0, Math.min(160, window.innerHeight * 0.18)],
    essential: false,
    duration
  });
  if (openPopup) window.setTimeout(() => openEventPopup(event), duration + 100);
}

async function expandCluster(event) {
  const feature = app.map.queryRenderedFeatures(event.point, { layers: ['clusters'] })[0];
  if (!feature) return;
  try {
    const zoom = await app.map.getSource('resistance-events').getClusterExpansionZoom(feature.properties.cluster_id);
    app.map.easeTo({ center: feature.geometry.coordinates, zoom });
  } catch (error) {
    console.warn('Cluster konnte nicht geöffnet werden:', error);
  }
}

function populateCategories() {
  ui.categoryFilter.replaceChildren();
  const all = document.createElement('option');
  all.value = 'all';
  all.textContent = i18n.t('allMovements');
  ui.categoryFilter.append(all);
  [...new Set(app.events.flatMap(event => [event.category, ...event.tags]))]
    .sort((a, b) => translateCategory(a, i18n.language).localeCompare(translateCategory(b, i18n.language), i18n.locale))
    .forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = translateCategory(category, i18n.language);
    ui.categoryFilter.append(option);
  });
  ui.categoryFilter.value = app.filters.category;
}

function updateEraFilter() {
  let from = Number(ui.eraFrom.value);
  let to = Number(ui.eraTo.value);
  if (!Number.isFinite(from)) from = -1200;
  if (!Number.isFinite(to)) to = 2030;
  if (from > to) [from, to] = [to, from];
  ui.eraFrom.value = from;
  ui.eraTo.value = to;
  app.filters.from = from;
  app.filters.to = to;
  renderMapData();
}

function resetFilters() {
  app.filters = { query: '', category: 'all', from: -1200, to: 2030, undiscoveredOnly: false };
  ui.searchInput.value = '';
  ui.categoryFilter.value = 'all';
  ui.eraFrom.value = -1200;
  ui.eraTo.value = 2030;
  ui.undiscoveredOnly.checked = false;
  renderMapData();
}

function applyFiltersToUi() {
  ui.searchInput.value = app.filters.query;
  ui.categoryFilter.value = app.filters.category;
  ui.eraFrom.value = app.filters.from;
  ui.eraTo.value = app.filters.to;
  ui.undiscoveredOnly.checked = app.filters.undiscoveredOnly;
}

function loadViewFilters() {
  const defaults = { query: '', category: 'all', from: -1200, to: 2030, undiscoveredOnly: false };
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(VIEW_STORAGE_KEY) || '{}');
    const from = Number(stored.from);
    const to = Number(stored.to);
    return {
      query: typeof stored.query === 'string' ? stored.query.slice(0, 160) : defaults.query,
      category: typeof stored.category === 'string' ? stored.category.slice(0, 100) : defaults.category,
      from: Number.isFinite(from) ? Math.max(-1200, Math.min(2030, from)) : defaults.from,
      to: Number.isFinite(to) ? Math.max(-1200, Math.min(2030, to)) : defaults.to,
      undiscoveredOnly: Boolean(stored.undiscoveredOnly)
    };
  } catch {
    return defaults;
  }
}

function saveViewFilters() {
  try { window.sessionStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(app.filters)); } catch { /* private mode */ }
}

function eventShareUrl(eventId) {
  const url = new URL(window.location.href);
  url.searchParams.set('event', eventId);
  return url.toString();
}

function setEventInUrl(eventId) {
  const url = new URL(window.location.href);
  url.searchParams.set('event', eventId);
  window.history.replaceState(null, '', url);
}

function clearEventFromUrl(eventId) {
  const url = new URL(window.location.href);
  if (url.searchParams.get('event') !== eventId) return;
  url.searchParams.delete('event');
  window.history.replaceState(null, '', url);
}

async function copyEventLink(event) {
  try {
    await navigator.clipboard.writeText(eventShareUrl(event.id));
    showToast(i18n.t('eventLinkCopied'), event.title);
  } catch {
    showToast(i18n.t('copyFailed'), i18n.t('copyFailedBody'));
  }
}

function toggleDrawer(drawer, activeButton) {
  const shouldOpen = drawer.hidden;
  closeDrawers();
  if (shouldOpen) {
    app.lastFocus = activeButton;
    drawer.hidden = false;
    ui.navButtons.forEach(button => button.classList.toggle('is-active', button === activeButton));
    drawer.focus();
  }
}

function openPanel(panel) {
  if (panel === 'quiz') { openQuiz(); return true; }
  if (panel === 'map') { closeDrawers(); return true; }
  const drawers = {
    archive: ui.archiveDrawer,
    list: ui.eventListDrawer,
    achievements: ui.achievementsDrawer,
    connections: ui.connectionsDrawer
  };
  const drawer = drawers[panel];
  if (!drawer) return false;
  closeDrawers();
  drawer.hidden = false;
  ui.navButtons.forEach(button => button.classList.toggle('is-active', button.dataset.panel === panel));
  if (panel === 'connections') drawConnection(false);
  return true;
}

function closeDrawers() {
  ui.archiveDrawer.hidden = true;
  ui.eventListDrawer.hidden = true;
  ui.achievementsDrawer.hidden = true;
  ui.connectionsDrawer.hidden = true;
  ui.navButtons.forEach(button => button.classList.toggle('is-active', button.dataset.panel === 'map'));
}

function openModal(modal) {
  closeModals(false);
  app.lastFocus = window.matchMedia('(max-width: 820px)').matches && ui.controlPanel.contains(document.activeElement)
    ? ui.menuToggle
    : document.activeElement;
  closeDrawers();
  toggleMobileMenu(false);
  ui.modalBackdrop.hidden = false;
  modal.hidden = false;
  modal.querySelector('button, [href], input')?.focus();
}

function closeModals(restoreFocus = true) {
  const hadOpenModal = !ui.welcomeModal.hidden || !ui.quizModal.hidden || !ui.methodologyModal.hidden;
  ui.modalBackdrop.hidden = true;
  ui.welcomeModal.hidden = true;
  ui.quizModal.hidden = true;
  ui.methodologyModal.hidden = true;
  if (restoreFocus && hadOpenModal && app.lastFocus?.isConnected) app.lastFocus.focus();
}

function trapModalFocus(event) {
  const modal = [ui.welcomeModal, ui.quizModal, ui.methodologyModal].find(item => !item.hidden);
  if (!modal) return;
  const focusable = [...modal.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

function toggleMobileMenu(open) {
  ui.controlPanel.classList.toggle('is-open', open);
  ui.menuToggle.setAttribute('aria-expanded', String(open));
}

function setupHostApi() {
  app.bridge = createAtlasApi({
    host: window,
    parentOrigin: runtimeConfig.parentOrigin,
    getSnapshot: () => ({
      ready: Boolean(app.events.length && app.map),
      eventCount: app.events.length,
      filteredEventCount: app.filteredEvents.length,
      filters: app.filters,
      progress: sanitizeProgress(app.progress),
      activeConnectionId: app.activeConnection?.id || null,
      language: i18n.language
    }),
    actions: {
      setFilters: applyExternalFilters,
      setLanguage: language => {
        const supported = LANGUAGES.some(item => item.code === language);
        if (!supported) return false;
        ui.languageSelect.value = language;
        changeLanguage(language);
        return true;
      },
      focusEvent: id => {
        const event = app.events.find(item => item.id === id);
        if (!event) return false;
        flyToEvent(event);
        return true;
      },
      randomEvent: () => {
        flyToRandomEvent(app.filteredEvents);
        return app.filteredEvents.length > 0;
      },
      openPanel,
      exportProgress: () => sanitizeProgress(app.progress),
      importProgress: value => {
        app.progress = reconcileProgress(value, new Set(app.events.map(event => event.id)));
        ensureMission();
        saveProgress();
        updateGameUi();
        renderMapData();
        emitAtlasEvent('progress-imported', { discoveredCount: app.progress.discoveredIds.length });
        return true;
      },
      resetProgress: () => {
        app.progress = sanitizeProgress(DEFAULT_PROGRESS);
        ensureMission();
        saveProgress();
        updateGameUi();
        renderMapData();
        emitAtlasEvent('progress-reset', {});
        return true;
      }
    }
  });
  document.documentElement.dataset.atlasApiReady = app.bridge.api.version;
}

function applyExternalFilters(filters = {}) {
  const allowedCategories = new Set(['all', ...app.events.flatMap(event => [event.category, ...event.tags])]);
  const rawFrom = Number(filters.from ?? app.filters.from);
  const rawTo = Number(filters.to ?? app.filters.to);
  const from = Number.isFinite(rawFrom) ? Math.max(-1200, Math.min(2030, rawFrom)) : app.filters.from;
  const to = Number.isFinite(rawTo) ? Math.max(-1200, Math.min(2030, rawTo)) : app.filters.to;
  app.filters = {
    query: String(filters.query ?? app.filters.query).slice(0, 160),
    category: allowedCategories.has(filters.category) ? filters.category : app.filters.category,
    from: Math.min(from, to),
    to: Math.max(from, to),
    undiscoveredOnly: Boolean(filters.undiscoveredOnly ?? app.filters.undiscoveredOnly)
  };
  ui.searchInput.value = app.filters.query;
  ui.categoryFilter.value = app.filters.category;
  ui.eraFrom.value = app.filters.from;
  ui.eraTo.value = app.filters.to;
  ui.undiscoveredOnly.checked = app.filters.undiscoveredOnly;
  renderMapData();
  emitAtlasEvent('filters-changed', { filters: app.filters, resultCount: app.filteredEvents.length });
  return true;
}

function emitAtlasEvent(type, detail) {
  app.bridge?.emit(type, detail);
}

function setDataStatus(message, mode) {
  ui.dataStatus.className = `data-status is-${mode}`;
  ui.dataStatus.lastElementChild.textContent = message;
}

function showToast(title, message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  const strong = document.createElement('strong');
  strong.textContent = title;
  const copy = document.createElement('span');
  copy.textContent = message;
  toast.append(strong, copy);
  ui.toastRegion.append(toast);
  window.setTimeout(() => toast.remove(), 4200);
}

async function resolveImageUrl(event) {
  const direct = safeImageUrl(event.imageUrl);
  if (direct) return direct;
  const apiUrl = safeWikipediaApiUrl(event.imageApiUrl);
  if (!apiUrl) return '';
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(apiUrl, { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!response.ok) return '';
    const data = await response.json();
    return safeImageUrl(data.thumbnail?.source || data.originalimage?.source || '');
  } catch {
    return '';
  } finally {
    window.clearTimeout(timeout);
  }
}

function loadProgress() {
  try {
    const saved = parseStoredProgress(localStorage.getItem(STORAGE_KEY) || '{}');
    return sanitizeProgress({ ...DEFAULT_PROGRESS, ...saved });
  } catch {
    return sanitizeProgress(DEFAULT_PROGRESS);
  }
}

function saveProgress() {
  app.progress = sanitizeProgress(app.progress);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(app.progress)); } catch (error) { console.warn('Fortschritt konnte nicht gespeichert werden:', error); }
}

function updateVisitStreak() {
  const today = new Date();
  const dateKey = today.toISOString().slice(0, 10);
  if (app.progress.lastVisit === dateKey) return;
  if (app.progress.lastVisit) {
    const previous = new Date(`${app.progress.lastVisit}T00:00:00`);
    const delta = Math.round((new Date(`${dateKey}T00:00:00`) - previous) / 86400000);
    app.progress.visitStreak = delta === 1 ? app.progress.visitStreak + 1 : 1;
  }
  app.progress.lastVisit = dateKey;
  saveProgress();
}

function discoveredEvents() {
  const ids = new Set(app.progress.discoveredIds);
  return app.events.filter(event => ids.has(event.id));
}

function categoryColorExpression() {
  const expression = ['match', ['get', 'category']];
  Object.entries(CATEGORY_COLORS).forEach(([category, color]) => expression.push(category, color));
  expression.push('#c7d8cf');
  return expression;
}

function eventSignature(event) {
  return `${event.title.toLocaleLowerCase('de')}|${event.location.toLocaleLowerCase('de')}`;
}

function withoutEmptyValues(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== ''
    && value !== null
    && value !== undefined
    && (!Array.isArray(value) || value.length > 0)));
}

function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : '';
  } catch { return ''; }
}

function safeWikipediaApiUrl(value) {
  const url = safeExternalUrl(value);
  if (!url) return '';
  const hostname = new URL(url).hostname;
  return ['de.wikipedia.org', 'en.wikipedia.org'].includes(hostname) ? url : '';
}

function safeImageUrl(value) {
  const url = safeExternalUrl(value);
  if (!url) return '';
  return new URL(url).hostname === 'upload.wikimedia.org' ? url : '';
}

function dailySeed() { return new Date().toISOString().slice(0, 10); }
function toCamel(value) { return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()); }
function isFormElement(element) { return ['INPUT', 'SELECT', 'TEXTAREA'].includes(element?.tagName); }

function waitForMapLibre(timeout = 10000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      if (window.maplibregl) return resolve();
      if (Date.now() - started > timeout) return reject(new Error('MapLibre wurde nicht geladen.'));
      window.setTimeout(check, 50);
    };
    check();
  });
}
