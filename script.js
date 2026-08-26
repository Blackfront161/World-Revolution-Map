import {
  CATEGORY_COLORS,
  buildNetworkModel,
  classifyEventLayers,
  classifyEventTactics,
  createConnection,
  createMission,
  createPowerExcuse,
  createQuiz,
  filterEvents,
  isSensitiveEvent,
  isValidEvent,
  levelProgress,
  localizeEvent,
  normalizeEvent,
  normalizeSearchText,
  normalizeTimeRange,
  resolveEventId,
  seededShuffle,
  solidarityResult
} from './src/game-core.js';
import { biographyYearLabel, filterBiographies, normalizeBiography } from './src/biography-core.js';
import { addCollection, exportLibrary, parseLibrary, sanitizeLibrary, toggleCollectionItem, toggleComparison } from './src/local-library.js';
import { createAtlasApi } from './src/atlas-api.js';
import { readRuntimeConfig } from './src/atlas-config.js';
import { parseStoredProgress, reconcileProgress, sanitizeProgress } from './src/progress-store.js';
import { LANGUAGES, createI18n, formatLocalizedYear, translateCategory, translateEditorialMetadata } from './src/i18n.js';

const SUPABASE_URL = 'https://pixafxinyydzwplirrnm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cAh2ZxD6aaXREXhMIVyvyA_C_yeFxRd';
const SUPABASE_SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4';
const SUPABASE_SDK_INTEGRITY = 'sha384-GFr3yTh5lJznCbZfpTtXnwboFsxqtTQoeTZCRHhE0579KrRmlCzen5AA8ohaB5ug';
const STORAGE_KEY = 'atlas-des-widerstands-progress-v2';
const VIEW_STORAGE_KEY = 'atlas-des-widerstands-view-v2';
const STYLE_STORAGE_KEY = 'atlas-map-style-v1';
const LIBRARY_STORAGE_KEY = 'atlas-local-library-v1';
const DEFAULT_TIME = { minimum: -1200, maximum: 2030, defaultFrom: -1200, defaultTo: 2030 };
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
  biographies: [],
  routes: [],
  relations: [],
  taxonomy: { time: DEFAULT_TIME, layers: [], tactics: [], mapStyles: [], network: { maximumNodes: 72, maximumEdges: 140 } },
  filteredEvents: [],
  progress: loadProgress(),
  filters: loadViewFilters(),
  activeQuiz: null,
  activeConnection: null,
  bridge: null,
  lastFocus: null,
  mapStyle: loadMapStyle(),
  timeTimer: null,
  library: loadLibrary(),
  biographyFilters: { query: '', region: 'all', tradition: 'all', from: -1200, to: 2030 }
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
  syncMobileMenuAccessibility();
  window.matchMedia('(max-width: 820px)').addEventListener?.('change', () => {
    ui.controlPanel.classList.remove('is-open');
    ui.menuToggle.setAttribute('aria-expanded', 'false');
    syncMobileMenuAccessibility();
  });
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', syncMotionPreference);
  syncMotionPreference();
  setupHostApi();

  try {
    await registerServiceWorker();
    [app.events, app.biographies] = await Promise.all([loadEvents(), loadBiographies()]);
    app.progress = reconcileProgress(app.progress, new Set(app.events.map(event => event.id)));
    populateCategories();
    populateLayerFilters();
    populateMapStyles();
    populateTacticLegend();
    populateSearchSuggestions();
    populateBiographyFilters();
    applyFiltersToUi();
    applyMapStyle();
    ensureMission();
    try {
      await waitForMapLibre();
      initializeMap();
      ui.onlineMapNote.classList.remove('is-offline');
    } catch (mapError) {
      console.warn('Online-Karte nicht verfügbar; lokale Archivansichten bleiben nutzbar:', mapError);
      ui.onlineMapNote.classList.add('is-offline');
      document.body.classList.add('map-unavailable');
    }
    updateGameUi();
    applyReaderSettings();
    renderBiographies();
    renderCollections();
    renderComparison();
    renderContinueReading();
    const hasEventDeepLink = new URLSearchParams(window.location.search).has('event');
    const biographyId = new URLSearchParams(window.location.search).get('bio');
    if (biographyId) openBiography(biographyId, true);
    if (runtimeConfig.showWelcome && !app.progress.seenWelcome && !hasEventDeepLink && !biographyId) openModal(ui.welcomeModal);
    emitAtlasEvent('ready', { eventCount: app.events.length, embedded: runtimeConfig.embed });
  } catch (error) {
    console.error('Atlas konnte nicht gestartet werden:', error);
    showArchiveLoadFailure();
  }
}

function bindUi() {
  const ids = [
    'search-input', 'category-filter', 'era-from', 'era-to', 'era-from-range', 'era-to-range', 'include-undated', 'undiscovered-only', 'result-count',
    'reset-filters', 'reset-layers', 'fit-results', 'clear-search', 'random-event', 'start-mission', 'data-status', 'level-value', 'xp-value',
    'xp-progress', 'mission-card', 'mission-title', 'mission-description', 'mission-reward',
    'mission-progress-text', 'mission-progress-bar', 'archive-count', 'achievement-count',
    'archive-drawer', 'archive-list', 'timeline-drawer', 'timeline-list', 'time-play', 'time-reset', 'motion-note', 'routes-drawer', 'routes-list', 'network-drawer', 'network-summary', 'network-legend', 'network-visual', 'relation-list', 'achievements-drawer', 'achievement-list', 'connections-drawer',
    'connection-content', 'new-connection', 'copy-connection', 'power-excuse', 'power-counter', 'new-excuse', 'quiz-button',
    'quiz-modal', 'quiz-title', 'quiz-content', 'welcome-modal', 'methodology-modal', 'pirate-dossier-modal', 'modal-backdrop', 'begin-button',
    'methodology-button', 'about-map-button', 'pirate-dossier-button', 'help-button', 'toast-region', 'menu-toggle', 'menu-close', 'control-panel', 'language-select',
    'active-filters', 'event-list-drawer', 'event-list-body', 'layer-filters', 'map-style-select', 'tactic-legend', 'maritime-route-note', 'search-suggestions',
    'copy-filter-preset', 'online-map-note', 'continue-card', 'continue-title', 'continue-button', 'reader-enabled', 'reader-font', 'reader-font-output', 'reader-width', 'reader-width-output', 'reader-contrast',
    'biography-count', 'biographies-drawer', 'biography-filters', 'biography-search', 'biography-region', 'biography-tradition', 'biography-from', 'biography-to', 'biography-result-count', 'biography-list', 'biography-detail',
    'compare-count', 'compare-drawer', 'compare-content', 'compare-clear', 'collection-name', 'collection-create', 'collection-select', 'collection-export', 'collection-import-toggle', 'collection-import-panel', 'collection-import', 'collection-import-apply', 'collection-list'
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
    populateLayerFilters();
    populateMapStyles();
    populateTacticLegend();
    populateBiographyFilters();
    updateGameUi();
    applyMapStyle();
    renderMapData();
    renderBiographies();
    renderCollections();
    renderComparison();
    renderContinueReading();
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
  ui.eraFrom.addEventListener('input', updateEraFilter);
  ui.eraTo.addEventListener('input', updateEraFilter);
  ui.eraFromRange.addEventListener('input', updateEraFilterFromRange);
  ui.eraToRange.addEventListener('input', updateEraFilterFromRange);
  ui.includeUndated.addEventListener('change', () => { app.filters.includeUndated = ui.includeUndated.checked; renderMapData(); });
  ui.resetLayers.addEventListener('click', () => { app.filters.layers = []; populateLayerFilters(); renderMapData(); });
  ui.mapStyleSelect.addEventListener('change', () => setMapStyle(ui.mapStyleSelect.value));
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
  ui.pirateDossierButton.addEventListener('click', () => openModal(ui.pirateDossierModal));
  ui.modalBackdrop.addEventListener('click', closeModals);
  ui.modalCloseButtons.forEach(button => button.addEventListener('click', closeModals));
  ui.drawerCloseButtons.forEach(button => button.addEventListener('click', closeDrawers));
  ui.menuToggle.addEventListener('click', () => toggleMobileMenu(true, true));
  ui.menuClose.addEventListener('click', () => toggleMobileMenu(false));
  ui.timePlay.addEventListener('click', toggleTimeTravel);
  ui.timeReset.addEventListener('click', resetTimeRange);
  ui.copyFilterPreset.addEventListener('click', copyFilterPreset);
  ui.continueButton.addEventListener('click', openLastRead);
  for (const control of [ui.readerEnabled, ui.readerFont, ui.readerWidth, ui.readerContrast]) control.addEventListener('input', updateReaderSettings);
  for (const control of [ui.biographySearch, ui.biographyRegion, ui.biographyTradition, ui.biographyFrom, ui.biographyTo]) control.addEventListener('input', updateBiographyFilters);
  ui.compareClear.addEventListener('click', () => { app.library.compare = []; saveLibrary(); renderComparison(); syncComparisonUrl(); });
  ui.collectionCreate.addEventListener('click', createNamedCollection);
  ui.collectionSelect.addEventListener('change', renderCollections);
  ui.collectionExport.addEventListener('click', downloadCollections);
  ui.collectionImportToggle.addEventListener('click', () => { ui.collectionImportPanel.hidden = !ui.collectionImportPanel.hidden; if (!ui.collectionImportPanel.hidden) ui.collectionImport.focus(); });
  ui.collectionImportApply.addEventListener('click', importCollections);

  ui.navButtons.forEach(button => button.addEventListener('click', () => {
    const panel = button.dataset.panel;
    if (panel === 'archive') toggleDrawer(ui.archiveDrawer, button);
    if (panel === 'biographies') { toggleDrawer(ui.biographiesDrawer, button); if (!ui.biographiesDrawer.hidden) renderBiographies(); }
    if (panel === 'timeline') { toggleDrawer(ui.timelineDrawer, button); if (!ui.timelineDrawer.hidden) renderTimeline(); }
    if (panel === 'routes') toggleDrawer(ui.routesDrawer, button);
    if (panel === 'list') toggleDrawer(ui.eventListDrawer, button);
    if (panel === 'network') { toggleDrawer(ui.networkDrawer, button); if (!ui.networkDrawer.hidden) renderNetwork(); }
    if (panel === 'compare') { toggleDrawer(ui.compareDrawer, button); if (!ui.compareDrawer.hidden) renderComparison(); }
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
    if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleMobileMenu(true); ui.searchInput.focus(); }
    if (event.key.toLowerCase() === 'r') flyToRandomEvent(app.filteredEvents);
    if (event.key.toLowerCase() === 'm') startNewMission();
    if (event.key.toLowerCase() === 'v') openPanel('connections');
    if (event.key === '?') openModal(ui.welcomeModal);
  });
}

function isRuntimeEventValid(event) {
  if (event.coordinatePrecision === 'hidden') {
    return !Number.isFinite(event.longitude) && !Number.isFinite(event.latitude);
  }
  return isValidEvent(event);
}

const LOCAL_DATA_TIMEOUT_MS = 8000;

async function fetchLocalJson(url) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), LOCAL_DATA_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-cache' });
    if (!response.ok) throw new Error(`Lokale Archivressource fehlt: ${url}`);
    return await response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

async function loadEvents() {
  const [catalog, metadata, overrides, routes, taxonomy, relations] = await Promise.all([
    fetchLocalJson('./data/event-catalog.json'),
    fetchLocalJson('./data/event-metadata.json'),
    fetchLocalJson('./data/event-editorial-overrides.json'),
    fetchLocalJson('./data/routes.json'),
    fetchLocalJson('./data/map-taxonomy.json'),
    fetchLocalJson('./data/relations.json')
  ]);
  if (!Array.isArray(catalog) || !catalog.length || catalog.some(file => typeof file !== 'string' || !/^[a-z0-9-]+\.json$/i.test(file))) {
    throw new Error('Datenkatalog ist ungültig.');
  }
  const fallbackPayloads = await Promise.all(catalog.map(file => fetchLocalJson(`./data/${file}`)));
  const metadataById = new Map((metadata.events || []).map(row => [row.id, row]));
  const editorialById = overrides.events || {};
  const enrichRow = row => ({ ...row, ...(editorialById[row.id] || {}), ...(metadataById.get(row.id) || {}), schemaVersion: metadata.schemaVersion || 1 });
  app.routes = Array.isArray(routes.routes) ? routes.routes : [];
  app.taxonomy = taxonomy;
  app.relations = Array.isArray(relations.relations) ? relations.relations : [];
  app.filters = sanitizeViewFilters(app.filters);
  const annotateEvent = event => ({
    ...event,
    layerIds: classifyEventLayers(event, app.taxonomy.layers),
    tacticIds: classifyEventTactics(event, app.taxonomy.tactics)
  });
  const fallbackRows = fallbackPayloads
    .flat()
    .filter(row => !row.archived)
    .map(enrichRow)
    .slice(0, 5000);
  const fallback = fallbackRows.map(normalizeEvent).filter(isRuntimeEventValid).map(annotateEvent);

  if (!runtimeConfig.useSupabase) {
    setDataStatus(i18n.t('offlineStatus', { count: fallback.length }), 'fallback');
    return fallback;
  }

  try {
    await loadSupabaseSdk();
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    const { data, error } = await client.from('ereignisse').select('*').limit(runtimeConfig.maxRemoteEvents);
    if (error) throw error;
    const remote = (data || []).map(enrichRow).map(normalizeEvent).filter(isRuntimeEventValid).map(annotateEvent);
    const merged = mergeEvents(fallback, remote);
    setDataStatus(i18n.t('liveStatus', { count: merged.length }), 'online');
    return merged;
  } catch (error) {
    console.warn('Supabase nicht erreichbar, kuratierter Fallback wird verwendet:', error);
    setDataStatus(i18n.t('fallbackStatus', { count: fallback.length }), 'fallback');
    return fallback;
  }
}

async function loadBiographies() {
  const catalog = await fetchLocalJson('./data/biography-catalog.json');
  if (catalog?.schemaVersion !== 1 || !Array.isArray(catalog.files) || !catalog.files.length) throw new Error('Biografiekatalog ist ungültig.');
  const entries = catalog.files.filter(entry => entry && typeof entry === 'object' && /^[a-z0-9-]+\.json$/i.test(entry.file));
  if (entries.length !== catalog.files.length) throw new Error('Biografiekatalog enthält ungültige Einträge.');
  const payloads = await Promise.all(entries.map(async entry => ({ payload: await fetchLocalJson(`./data/${entry.file}`), entry })));
  return payloads
    .flatMap(({ payload, entry }) => (Array.isArray(payload) ? payload : Array.isArray(payload?.biographies) ? payload.biographies : []).map(row => normalizeBiography(row, entry)))
    .filter(bio => bio.id && bio.name)
    .sort((a, b) => a.name.localeCompare(b.name, i18n.locale));
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
    app.map.addSource('maritime-route-guides', {
      type: 'geojson',
      data: toMaritimeRouteGeoJson(app.events)
    });

    app.map.addLayer({
      id: 'maritime-route-guides',
      type: 'line',
      source: 'maritime-route-guides',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#43d9d1',
        'line-width': ['interpolate', ['linear'], ['zoom'], 1, 1.2, 6, 2.4],
        'line-opacity': .46,
        'line-dasharray': [2, 3]
      }
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
        'circle-color': ['step', ['get', 'point_count'], '#5eead4', 6, '#c4b5fd', 12, '#f6c66d'],
        'circle-radius': ['step', ['get', 'point_count'], 18, 6, 24, 12, 31],
        'circle-opacity': .92,
        'circle-stroke-width': 3,
        'circle-stroke-color': 'rgba(244, 249, 246, .72)'
      }
    });

    app.map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'resistance-events',
      filter: ['has', 'point_count'],
      layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 12, 'text-font': ['Open Sans Bold'] },
      paint: { 'text-color': '#10211d', 'text-halo-color': 'rgba(255,255,255,.45)', 'text-halo-width': .5 }
    });

    app.map.addLayer({
      id: 'event-regions',
      type: 'circle',
      source: 'resistance-events',
      filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'coordinatePrecision'], 'region']],
      paint: {
        'circle-color': categoryColorExpression(),
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 16, 6, 34],
        'circle-opacity': .14,
        'circle-stroke-width': 2,
        'circle-stroke-color': categoryColorExpression()
      }
    });

    app.map.addLayer({
      id: 'event-approximate-rings',
      type: 'circle',
      source: 'resistance-events',
      filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'coordinatePrecision'], 'approximate']],
      paint: {
        'circle-radius': 14,
        'circle-color': 'rgba(255,255,255,0)',
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-opacity': .55,
        'circle-blur': .45
      }
    });

    app.map.addLayer({
      id: 'event-maritime-rings',
      type: 'circle',
      source: 'resistance-events',
      filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'maritime'], true], ['==', ['get', 'sensitive'], false]],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 13, 6, 23],
        'circle-color': 'rgba(67,217,209,0.05)',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#43d9d1',
        'circle-stroke-opacity': .82
      }
    });

    app.map.addLayer({
      id: 'event-point-halos',
      type: 'circle',
      source: 'resistance-events',
      filter: ['all', ['!', ['has', 'point_count']], ['!=', ['get', 'coordinatePrecision'], 'region'], ['==', ['get', 'sensitive'], false]],
      paint: {
        'circle-color': categoryColorExpression(),
        'circle-radius': ['case', ['==', ['get', 'discovered'], true], 9, 13],
        'circle-opacity': ['case', ['==', ['get', 'discovered'], true], .08, .16],
        'circle-blur': .35
      }
    });

    app.map.addLayer({
      id: 'event-points',
      type: 'circle',
      source: 'resistance-events',
      filter: ['all', ['!', ['has', 'point_count']], ['!=', ['get', 'coordinatePrecision'], 'region']],
      paint: {
        'circle-color': categoryColorExpression(),
        'circle-radius': ['case', ['==', ['get', 'discovered'], true], 6, 8],
        'circle-opacity': ['case', ['==', ['get', 'sensitive'], true], .72, ['==', ['get', 'discovered'], true], .55, .95],
        'circle-stroke-width': ['case', ['==', ['get', 'discovered'], true], 1, 2],
        'circle-stroke-color': ['case', ['==', ['get', 'sensitive'], true], '#d8c8ac', ['==', ['get', 'discovered'], true], '#dbe9df', '#ffffff']
      }
    });

    app.map.addLayer({
      id: 'event-symbols',
      type: 'symbol',
      source: 'resistance-events',
      filter: ['!', ['has', 'point_count']],
      layout: {
        'text-field': ['get', 'tacticSymbol'],
        'text-size': 9,
        'text-font': ['Open Sans Bold'],
        'text-allow-overlap': true
      },
      paint: { 'text-color': '#07130f', 'text-halo-color': '#ffffff', 'text-halo-width': .5 }
    });

    app.map.addLayer({
      id: 'event-maritime-symbols',
      type: 'symbol',
      source: 'resistance-events',
      filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'maritime'], true], ['==', ['get', 'sensitive'], false]],
      layout: { 'text-field': '≈', 'text-size': 14, 'text-font': ['Open Sans Bold'], 'text-offset': [0, 1.35], 'text-allow-overlap': true },
      paint: { 'text-color': '#d9fffb', 'text-halo-color': '#063d43', 'text-halo-width': 1.2 }
    });

    app.map.on('click', 'clusters', expandCluster);
    ['event-points', 'event-regions'].forEach(layer => app.map.on('click', layer, event => {
      const selected = app.events.find(item => item.id === event.features?.[0]?.properties?.id);
      if (selected) openEventPopup(selected, event.features[0].geometry.coordinates);
    }));
    ['clusters', 'event-points', 'event-regions'].forEach(layer => {
      app.map.on('mouseenter', layer, () => { app.map.getCanvas().style.cursor = 'pointer'; });
      app.map.on('mouseleave', layer, () => { app.map.getCanvas().style.cursor = ''; });
    });

    applyMapStyle();
    renderMapData();
    const eventId = new URLSearchParams(window.location.search).get('event');
    const deepLinkedEvent = resolveEventId(app.events, eventId);
    if (deepLinkedEvent) window.setTimeout(() => flyToEvent(deepLinkedEvent), 150);
  });
}

function renderMapData() {
  const discovered = new Set(app.progress.discoveredIds);
  app.filteredEvents = filterEvents(app.events, app.filters, discovered);
  document.documentElement.classList.toggle('maritime-focus', app.filters.layers.includes('maritime'));
  ui.resultCount.textContent = `${app.filteredEvents.length.toLocaleString(i18n.locale)} ${i18n.t(app.filteredEvents.length === 1 ? 'eventOne' : 'eventMany')}`;
  ui.clearSearch.hidden = !app.filters.query;
  renderActiveFilters();
  renderEventList();
  renderRoutes();
  renderTimeline();
  if (!ui.networkDrawer.hidden) renderNetwork();
  saveViewFilters();
  const source = app.map?.getSource('resistance-events');
  if (source) source.setData(toGeoJson(app.filteredEvents));
  const routeSource = app.map?.getSource('maritime-route-guides');
  if (routeSource) routeSource.setData(toMaritimeRouteGeoJson(app.filteredEvents));
  if (ui.maritimeRouteNote) ui.maritimeRouteNote.hidden = !app.filters.layers.includes('maritime');
}

function renderActiveFilters() {
  ui.activeFilters.replaceChildren();
  const chips = [];
  if (app.filters.query) chips.push({ label: `⌕ ${app.filters.query}`, clear: () => { app.filters.query = ''; ui.searchInput.value = ''; } });
  if (app.filters.category !== 'all') chips.push({ label: translateCategory(app.filters.category, i18n.language), clear: () => { app.filters.category = 'all'; ui.categoryFilter.value = 'all'; } });
  const time = app.taxonomy.time || DEFAULT_TIME;
  if (Number(app.filters.from) !== time.defaultFrom || Number(app.filters.to) !== time.defaultTo) chips.push({ label: `${formatFilterYear(app.filters.from)}–${formatFilterYear(app.filters.to)}`, clear: resetTimeRange });
  if (!app.filters.includeUndated) chips.push({ label: i18n.t('undatedExcluded'), clear: () => { app.filters.includeUndated = true; ui.includeUndated.checked = true; } });
  app.filters.layers.forEach(layerId => {
    const layer = app.taxonomy.layers.find(item => item.id === layerId);
    if (layer) chips.push({ label: i18n.t(layer.labelKey), clear: () => { app.filters.layers = app.filters.layers.filter(id => id !== layerId); populateLayerFilters(); } });
  });
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
    row.classList.toggle('is-maritime', isMaritimeEvent(event));
    const year = document.createElement('td');
    year.textContent = formatLocalizedYear(event, i18n);
    const titleCell = document.createElement('td');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = isMaritimeEvent(event) ? `≈ ${event.title}` : event.title;
    if (isMaritimeEvent(event)) button.setAttribute('aria-label', `${i18n.t('layerMaritime')}: ${event.title}`);
    button.addEventListener('click', () => { closeDrawers(); flyToEvent(event); });
    titleCell.append(button);
    const place = document.createElement('td');
    place.textContent = event.location;
    const movement = document.createElement('td');
    movement.textContent = translateCategory(event.category, i18n.language);
    const tactics = document.createElement('td');
    renderTacticBadges(tactics, event, true);
    const precision = document.createElement('td');
    precision.textContent = precisionExplanation(event);
    row.append(year, titleCell, place, movement, tactics, precision);
    fragment.append(row);
  });
  ui.eventListBody.append(fragment);
  if (!app.filteredEvents.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
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
    features: events.filter(event => event.coordinatePrecision !== 'hidden').map(event => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [event.longitude, event.latitude] },
      properties: {
        id: event.id,
        title: event.title,
        category: event.category,
        yearStart: event.yearStart || 0,
        coordinatePrecision: event.coordinatePrecision || 'exact',
        tacticSymbol: primaryTactic(event)?.symbol || '·',
        maritime: isMaritimeEvent(event),
        discovered: discovered.has(event.id),
        sensitive: isSensitiveEvent(event),
        missionTarget: missionTargets.has(event.id) && !app.progress.mission?.completedIds?.includes(event.id)
      }
    }))
  };
}

async function openEventPopup(event, coordinates = safeDisplayCoordinates(event)) {
  event = localizeEvent(event, i18n.language);
  markLastRead(`event:${event.id}`);
  if (app.popup) app.popup.remove();
  const content = document.createElement('article');
  content.className = 'event-popup';
  content.setAttribute('role', 'dialog');
  content.setAttribute('aria-modal', 'false');
  const sensitive = isSensitiveEvent(event);
  content.classList.toggle('is-sensitive', sensitive);
  content.classList.toggle('is-maritime', isMaritimeEvent(event));

  const media = document.createElement('div');
  media.className = 'event-popup-placeholder';
  media.textContent = sensitive ? '○' : isMaritimeEvent(event) ? '≈' : '✦';
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
  if (isMaritimeEvent(event)) {
    const maritime = document.createElement('span');
    maritime.className = 'event-popup-maritime';
    maritime.textContent = `≈ ${i18n.t('layerMaritime')}`;
    meta.prepend(maritime);
  }

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
  const precisionNotice = document.createElement('p');
  precisionNotice.className = `precision-notice is-${event.coordinatePrecision || 'exact'}`;
  precisionNotice.textContent = `${i18n.t('coordinatePrecisionLabel')}: ${precisionExplanation(event)}`;
  body.append(precisionNotice);
  if (event.localization.usesGermanOriginal) {
    const languageNote = document.createElement('small');
    languageNote.className = 'event-language-note';
    languageNote.textContent = event.localization.translatedFields.length
      ? i18n.t('partialEventTranslation')
      : i18n.t('eventTextGermanNotice');
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

  const tacticBadges = document.createElement('div');
  tacticBadges.className = 'tactic-badges';
  tacticBadges.setAttribute('aria-label', i18n.t('tactics'));
  renderTacticBadges(tacticBadges, event);
  body.append(tacticBadges);

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
  appendEventDetail(details, i18n.t('bottomUpPressure'), event.bottomUpPressure);
  appendEventDetail(details, i18n.t('achievementOutcome'), event.achievement);
  appendEventDetail(details, i18n.t('achievementLimits'), event.limits);
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
  const compare = document.createElement('button');
  compare.type = 'button';
  compare.className = 'share-link';
  compare.textContent = app.library.compare.includes(`event:${event.id}`) ? i18n.t('removeFromCompare') : i18n.t('addToCompare');
  compare.addEventListener('click', () => toggleCompareRef(`event:${event.id}`, compare));
  actions.append(compare);
  appendCollectionAction(actions, `event:${event.id}`);
  body.append(actions);
  const navigation = document.createElement('div');
  navigation.className = 'event-navigation';
  const visibleIndex = app.filteredEvents.findIndex(item => item.id === event.id);
  const previous = visibleIndex > 0 ? app.filteredEvents[visibleIndex - 1] : null;
  const next = visibleIndex >= 0 && visibleIndex < app.filteredEvents.length - 1 ? app.filteredEvents[visibleIndex + 1] : null;
  for (const [label, target] of [[i18n.t('previousEvent'), previous], [i18n.t('backToWorld'), null], [i18n.t('nextEvent'), next]]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    if (label === i18n.t('backToWorld')) button.addEventListener('click', () => { app.popup?.remove(); fitFilteredEvents(); });
    else {
      button.disabled = !target;
      button.addEventListener('click', () => target && flyToEvent(target));
    }
    navigation.append(button);
  }
  body.append(navigation);
  const sourceMetadata = document.createElement('div');
  sourceMetadata.className = 'source-metadata';
  for (const [label, value] of [
    [i18n.t('sourceTypeLabel'), translateEditorialMetadata(event.sourceType, i18n.language)],
    [i18n.t('sourceQualityLabel'), translateEditorialMetadata(event.sourceQuality, i18n.language)],
    [i18n.t('reviewStatusLabel'), translateEditorialMetadata(event.reviewStatus, i18n.language)],
    [i18n.t('coordinatePrecisionLabel'), event.coordinatePrecision ? i18n.t(`coordinatePrecision${event.coordinatePrecision[0].toUpperCase()}${event.coordinatePrecision.slice(1)}`) : '']
  ]) {
    if (!value) continue;
    const badge = document.createElement('span');
    badge.className = 'source-badge';
    badge.textContent = `${label}: ${value}`;
    sourceMetadata.append(badge);
  }
  if (sourceMetadata.childElementCount) body.append(sourceMetadata);
  appendSimilarHistory(body, event);
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

function populateBiographyFilters() {
  const selectedRegion = ui.biographyRegion.value || app.biographyFilters.region;
  const selectedTradition = ui.biographyTradition.value || app.biographyFilters.tradition;
  fillSelect(ui.biographyRegion, [...new Set(app.biographies.flatMap(bio => [...bio.regions, ...bio.communities]))].sort((a, b) => a.localeCompare(b, i18n.locale)), selectedRegion);
  fillSelect(ui.biographyTradition, [...new Set(app.biographies.flatMap(bio => bio.traditions))].sort((a, b) => a.localeCompare(b, i18n.locale)), selectedTradition);
  ui.biographySearch.value = app.biographyFilters.query;
  ui.biographyFrom.value = app.biographyFilters.from;
  ui.biographyTo.value = app.biographyFilters.to;
}

function fillSelect(select, values, selected) {
  select.replaceChildren();
  const all = document.createElement('option');
  all.value = 'all';
  all.textContent = i18n.t('allValues');
  select.append(all);
  values.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.append(option);
  });
  select.value = values.includes(selected) ? selected : 'all';
}

function updateBiographyFilters() {
  app.biographyFilters = {
    query: ui.biographySearch.value.slice(0, 160),
    region: ui.biographyRegion.value,
    tradition: ui.biographyTradition.value,
    from: Math.max(-1200, Math.min(2030, Number(ui.biographyFrom.value) || -1200)),
    to: Math.max(-1200, Math.min(2030, Number(ui.biographyTo.value) || 2030))
  };
  if (app.biographyFilters.from > app.biographyFilters.to) [app.biographyFilters.from, app.biographyFilters.to] = [app.biographyFilters.to, app.biographyFilters.from];
  renderBiographies();
}

function renderBiographies() {
  if (!ui.biographyList) return;
  const filtered = filterBiographies(app.biographies, app.biographyFilters, normalizeSearchText);
  ui.biographyCount.textContent = app.biographies.length;
  ui.biographyResultCount.textContent = i18n.t('biographyResults', { count: filtered.length });
  ui.biographyList.replaceChildren();
  if (!filtered.length) {
    const empty = document.createElement('p');
    empty.className = 'archive-empty';
    empty.textContent = app.biographies.length ? i18n.t('noResults') : i18n.t('biographiesPending');
    ui.biographyList.append(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  filtered.slice(0, 200).forEach(bio => {
    const article = document.createElement('article');
    article.className = 'biography-card';
    article.dataset.accent = biographyVisualAccent(bio.id);
    const heading = document.createElement('h3');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = bio.selfName ? `${bio.name} · ${bio.selfName}` : bio.name;
    button.addEventListener('click', () => openBiography(bio.id));
    heading.append(button);
    const meta = document.createElement('p');
    meta.className = 'biography-meta';
    meta.textContent = `${biographyYearLabel(bio, i18n.t('unknownFriendly'))} · ${bio.regions.join(', ') || i18n.t('unknownFriendly')}`;
    const traditions = document.createElement('p');
    traditions.textContent = bio.traditions.join(' · ') || i18n.t('unknownFriendly');
    article.append(heading, meta, traditions);
    fragment.append(article);
  });
  ui.biographyList.append(fragment);
}

function biographyVisualAccent(id = '') {
  const accents = ['teal', 'gold', 'coral', 'violet', 'green'];
  const total = [...String(id)].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return accents[total % accents.length];
}

function openBiography(id, updateUrl = true) {
  const bio = app.biographies.find(item => item.id === id);
  if (!bio) return false;
  openPanel('biographies');
  ui.biographyList.hidden = true;
  ui.biographyFilters.hidden = true;
  ui.biographyResultCount.hidden = true;
  ui.biographyDetail.hidden = false;
  ui.biographyDetail.replaceChildren();
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'text-button';
  back.textContent = i18n.t('backToBiographyList');
  back.addEventListener('click', closeBiographyDetail);
  const heading = document.createElement('h3');
  heading.id = `biography-title-${bio.id}`;
  heading.tabIndex = -1;
  heading.textContent = bio.selfName ? `${bio.name} · ${bio.selfName}` : bio.name;
  const meta = document.createElement('p');
  meta.className = 'biography-meta';
  meta.textContent = `${biographyYearLabel(bio, i18n.t('unknownFriendly'))} · ${(bio.communities.length ? bio.communities : bio.regions).join(', ') || i18n.t('unknownFriendly')}`;
  const stance = document.createElement('p');
  stance.className = 'editorial-note';
  stance.textContent = i18n.t('biographyStance');
  const summary = document.createElement('p');
  summary.className = 'biography-summary';
  summary.textContent = bio.summary;
  ui.biographyDetail.append(back, heading, meta, stance, summary);
  appendBiographyPhases(ui.biographyDetail, bio.lifePhases);
  appendBiographyField(ui.biographyDetail, i18n.t('ideasPractice'), bio.ideasAndPractice);
  appendBiographyField(ui.biographyDetail, i18n.t('organizingAchievements'), bio.organizingAndAchievements);
  appendBiographyField(ui.biographyDetail, i18n.t('repressionRisks'), bio.repressionAndRisks);
  appendBiographyField(ui.biographyDetail, i18n.t('tensionsCriticism'), bio.tensionsAndCriticism);
  appendBiographyField(ui.biographyDetail, i18n.t('legacy'), bio.legacy);
  appendBiographyRelatedEvents(ui.biographyDetail, bio);
  appendBiographySources(ui.biographyDetail, bio.sources);
  const status = document.createElement('p');
  status.className = 'source-badge biography-status';
  status.textContent = `${i18n.t('reviewStatusLabel')}: ${biographyReviewLabel(bio.reviewStatus)} · ${i18n.t('sensitivityTitle')}: ${i18n.t(`bioSensitivity${bio.sensitivity[0].toUpperCase()}${bio.sensitivity.slice(1)}`)}`;
  const actions = document.createElement('div');
  actions.className = 'event-popup-actions';
  const compare = document.createElement('button');
  compare.type = 'button';
  compare.textContent = app.library.compare.includes(`bio:${bio.id}`) ? i18n.t('removeFromCompare') : i18n.t('addToCompare');
  compare.addEventListener('click', () => toggleCompareRef(`bio:${bio.id}`, compare));
  actions.append(compare);
  appendCollectionAction(actions, `bio:${bio.id}`);
  ui.biographyDetail.append(status, actions);
  ui.biographyDetail.setAttribute('aria-labelledby', heading.id);
  heading.focus({ preventScroll: true });
  markLastRead(`bio:${bio.id}`);
  if (updateUrl) setBiographyInUrl(bio.id);
  return true;
}

function closeBiographyDetail() {
  ui.biographyDetail.hidden = true;
  ui.biographyList.hidden = false;
  ui.biographyFilters.hidden = false;
  ui.biographyResultCount.hidden = false;
  const url = new URL(window.location.href);
  url.searchParams.delete('bio');
  window.history.replaceState(null, '', url);
  ui.biographySearch.focus();
}

function appendBiographyPhases(container, phases) {
  if (!phases.length) return;
  const section = document.createElement('section');
  const heading = document.createElement('h4');
  heading.textContent = i18n.t('lifePhases');
  const list = document.createElement('ol');
  phases.forEach(phase => {
    const item = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = `${phase.period || formatFilterYear(phase.startYear)}${phase.title ? ` · ${phase.title}` : ''}`;
    const text = document.createElement('p');
    text.textContent = phase.description;
    item.append(title, text);
    list.append(item);
  });
  section.append(heading, list);
  container.append(section);
}

function appendBiographyField(container, label, value) {
  const values = Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
  if (!values.length) return;
  const section = document.createElement('section');
  const heading = document.createElement('h4');
  heading.textContent = label;
  section.append(heading);
  if (Array.isArray(value)) {
    const list = document.createElement('ul');
    values.forEach(value => { const item = document.createElement('li'); item.textContent = value; list.append(item); });
    section.append(list);
  } else {
    const paragraph = document.createElement('p');
    paragraph.textContent = values[0];
    section.append(paragraph);
  }
  container.append(section);
}

function appendBiographyRelatedEvents(container, bio) {
  if (!bio.relatedEventIds.length) return;
  const section = document.createElement('section');
  const heading = document.createElement('h4');
  heading.textContent = i18n.t('relatedEvents');
  const list = document.createElement('ul');
  bio.relatedEventIds.forEach(id => {
    const event = resolveEventId(app.events, id);
    if (!event) return;
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'text-button';
    button.textContent = `${event.title} — ${i18n.t('explicitBiographyRelation')}`;
    button.addEventListener('click', () => { closeDrawers(); flyToEvent(event); });
    item.append(button);
    list.append(item);
  });
  section.append(heading, list);
  container.append(section);
}

function appendBiographySources(container, sources) {
  const section = document.createElement('section');
  const heading = document.createElement('h4');
  heading.textContent = i18n.t('sourcesTitle');
  const list = document.createElement('ol');
  sources.forEach(source => {
    const url = safeExternalUrl(source.url);
    if (!url) return;
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = source.title || source.publisher;
    const meta = document.createElement('small');
    meta.textContent = `${source.publisher} · ${source.language || i18n.t('unknownFriendly')} · ${biographySourceTypeLabel(source.type)} · ${i18n.t('accessedAt')} ${source.accessedAt || i18n.t('unknownFriendly')}`;
    item.append(link, meta);
    list.append(item);
  });
  section.append(heading, list);
  container.append(section);
}

function biographyReviewLabel(value) {
  const keys = { draft: 'bioReviewDraft', reviewed: 'bioReviewReviewed', 'deep-reviewed': 'bioReviewDeepReviewed' };
  return i18n.t(keys[value] || 'unknownFriendly');
}

function biographySourceTypeLabel(value) {
  const keys = { primary: 'bioSourcePrimary', community: 'bioSourceCommunity', movement: 'bioSourceMovement', archive: 'bioSourceArchive', 'oral-history': 'bioSourceOralHistory', museum: 'bioSourceMuseum', academic: 'bioSourceAcademic', 'public-institution': 'bioSourcePublicInstitution', 'human-rights': 'bioSourceHumanRights' };
  return i18n.t(keys[value] || 'unknownFriendly');
}

function loadLibrary() {
  let library;
  try { library = parseLibrary(localStorage.getItem(LIBRARY_STORAGE_KEY) || '{}'); } catch { library = sanitizeLibrary(); }
  const compare = new URLSearchParams(window.location.search).get('compare');
  // URLSearchParams liefert bereits dekodierte Werte. Ein zweites Dekodieren
  // könnte bei einem absichtlich fehlerhaften Prozent-Escape die App stoppen.
  if (compare) library.compare = compare.split(',').filter(Boolean).slice(0, 3);
  return sanitizeLibrary(library);
}

function saveLibrary() {
  app.library = sanitizeLibrary(app.library);
  try { localStorage.setItem(LIBRARY_STORAGE_KEY, exportLibrary(app.library)); } catch (error) { console.warn('Lokale Sammlungen konnten nicht gespeichert werden:', error); }
  ui.compareCount.textContent = app.library.compare.length;
}

function validLibraryRef(ref) {
  const [type, id] = String(ref).split(':');
  return type === 'event' ? Boolean(resolveEventId(app.events, id)) : type === 'bio' ? app.biographies.some(bio => bio.id === id) : false;
}

function resolveLibraryRef(ref) {
  const [type, id] = String(ref).split(':');
  if (type === 'event') {
    const event = resolveEventId(app.events, id);
    return event ? { type, id: event.id, title: event.title, years: formatLocalizedYear(event, i18n), region: event.location, tradition: translateCategory(event.category, i18n.language), summary: event.description, review: translateEditorialMetadata(event.reviewStatus, i18n.language), value: event } : null;
  }
  if (type === 'bio') {
    const bio = app.biographies.find(item => item.id === id);
    return bio ? { type, id: bio.id, title: bio.name, years: biographyYearLabel(bio, i18n.t('unknownFriendly')), region: bio.regions.join(', '), tradition: bio.traditions.join(', '), summary: bio.summary, review: biographyReviewLabel(bio.reviewStatus), value: bio } : null;
  }
  return null;
}

function createNamedCollection() {
  const before = app.library.collections.length;
  app.library = addCollection(app.library, ui.collectionName.value);
  if (app.library.collections.length === before) return;
  ui.collectionName.value = '';
  saveLibrary();
  renderCollections();
  ui.collectionSelect.value = app.library.collections.at(-1).id;
}

function renderCollections() {
  if (!ui.collectionSelect) return;
  const selected = ui.collectionSelect.value;
  ui.collectionSelect.replaceChildren();
  if (!app.library.collections.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = i18n.t('noCollections');
    ui.collectionSelect.append(option);
  } else {
    app.library.collections.forEach(collection => {
      const option = document.createElement('option');
      option.value = collection.id;
      option.textContent = `${collection.name} (${collection.items.length})`;
      ui.collectionSelect.append(option);
    });
    ui.collectionSelect.value = app.library.collections.some(item => item.id === selected) ? selected : app.library.collections[0].id;
  }
  ui.collectionList.replaceChildren();
  const collection = app.library.collections.find(item => item.id === ui.collectionSelect.value);
  if (!collection) return;
  collection.items.map(resolveLibraryRef).filter(Boolean).forEach(item => {
    const row = document.createElement('div');
    row.className = 'collection-item';
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'text-button';
    open.textContent = item.title;
    open.addEventListener('click', () => openLibraryItem(`${item.type}:${item.id}`));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'icon-button';
    remove.setAttribute('aria-label', `${i18n.t('removeFromCollection')}: ${item.title}`);
    remove.textContent = '×';
    remove.addEventListener('click', () => { app.library = toggleCollectionItem(app.library, collection.id, `${item.type}:${item.id}`); saveLibrary(); renderCollections(); });
    row.append(open, remove);
    ui.collectionList.append(row);
  });
}

function appendCollectionAction(container, ref) {
  if (!app.library.collections.length) return;
  const collection = app.library.collections.find(item => item.id === ui.collectionSelect?.value) || app.library.collections[0];
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'share-link';
  button.textContent = collection.items.includes(ref) ? i18n.t('removeFromCollection') : i18n.t('addToCollection', { name: collection.name });
  button.addEventListener('click', () => {
    app.library = toggleCollectionItem(app.library, collection.id, ref);
    saveLibrary();
    renderCollections();
    const updated = app.library.collections.find(item => item.id === collection.id);
    button.textContent = updated?.items.includes(ref) ? i18n.t('removeFromCollection') : i18n.t('addToCollection', { name: collection.name });
  });
  container.append(button);
}

function downloadCollections() {
  const blob = new Blob([exportLibrary(app.library)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'atlas-sammlungen.json';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importCollections() {
  const imported = parseLibrary(ui.collectionImport.value);
  imported.collections.forEach(collection => { collection.items = collection.items.filter(validLibraryRef); });
  imported.compare = imported.compare.filter(validLibraryRef).slice(0, 3);
  imported.lastRead = validLibraryRef(imported.lastRead) ? imported.lastRead : null;
  app.library = imported;
  saveLibrary();
  applyReaderSettings();
  renderCollections();
  renderComparison();
  renderContinueReading();
  ui.collectionImport.value = '';
  ui.collectionImportPanel.hidden = true;
  showToast(i18n.t('importComplete'), i18n.t('importCompleteBody', { count: imported.collections.length }));
}

function toggleCompareRef(ref, button) {
  app.library = toggleComparison(app.library, ref);
  saveLibrary();
  syncComparisonUrl();
  renderComparison();
  if (button) button.textContent = app.library.compare.includes(ref) ? i18n.t('removeFromCompare') : i18n.t('addToCompare');
}

function syncComparisonUrl() {
  const url = new URL(window.location.href);
  if (app.library.compare.length) url.searchParams.set('compare', app.library.compare.join(',')); else url.searchParams.delete('compare');
  window.history.replaceState(null, '', url);
}

function renderComparison() {
  if (!ui.compareContent) return;
  app.library.compare = app.library.compare.filter(validLibraryRef).slice(0, 3);
  saveLibrary();
  const items = app.library.compare.map(resolveLibraryRef).filter(Boolean);
  ui.compareContent.replaceChildren();
  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'archive-empty';
    empty.textContent = i18n.t('compareEmpty');
    ui.compareContent.append(empty);
    return;
  }
  const wrapper = document.createElement('div');
  wrapper.className = 'table-scroll';
  const table = document.createElement('table');
  table.className = 'compare-table';
  const head = document.createElement('thead');
  const headRow = document.createElement('tr');
  const emptyHead = document.createElement('th');
  emptyHead.scope = 'col';
  emptyHead.textContent = i18n.t('aspect');
  headRow.append(emptyHead);
  items.forEach(item => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = item.title; headRow.append(th); });
  head.append(headRow);
  const body = document.createElement('tbody');
  for (const [label, key] of [[i18n.t('type'), 'type'], [i18n.t('year'), 'years'], [i18n.t('regionCommunity'), 'region'], [i18n.t('tradition'), 'tradition'], [i18n.t('summary'), 'summary'], [i18n.t('reviewStatusLabel'), 'review']]) {
    const row = document.createElement('tr');
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = label;
    row.append(th);
    items.forEach(item => { const cell = document.createElement('td'); cell.textContent = key === 'type' ? i18n.t(item.type === 'bio' ? 'biographySingular' : 'event') : item[key] || i18n.t('unknownFriendly'); row.append(cell); });
    body.append(row);
  }
  const openRow = document.createElement('tr');
  const openHeading = document.createElement('th');
  openHeading.scope = 'row';
  openHeading.textContent = i18n.t('open');
  openRow.append(openHeading);
  items.forEach(item => { const cell = document.createElement('td'); const button = document.createElement('button'); button.type = 'button'; button.className = 'text-button'; button.textContent = i18n.t('open'); button.addEventListener('click', () => openLibraryItem(`${item.type}:${item.id}`)); cell.append(button); openRow.append(cell); });
  body.append(openRow);
  table.append(head, body);
  wrapper.append(table);
  ui.compareContent.append(wrapper);
}

function openLibraryItem(ref) {
  const item = resolveLibraryRef(ref);
  if (!item) return;
  if (item.type === 'bio') openBiography(item.id);
  else { closeDrawers(); flyToEvent(item.value); }
}

function markLastRead(ref) {
  if (!validLibraryRef(ref)) return;
  app.library.lastRead = ref;
  saveLibrary();
  renderContinueReading();
}

function renderContinueReading() {
  const item = resolveLibraryRef(app.library.lastRead);
  ui.continueCard.hidden = !item;
  if (item) ui.continueTitle.textContent = `${i18n.t(item.type === 'bio' ? 'biographySingular' : 'event')}: ${item.title}`;
}

function openLastRead() {
  if (app.library.lastRead) openLibraryItem(app.library.lastRead);
}

function updateReaderSettings() {
  app.library.reader = {
    enabled: ui.readerEnabled.checked,
    fontScale: Number(ui.readerFont.value),
    lineWidth: Number(ui.readerWidth.value),
    highContrast: ui.readerContrast.checked
  };
  saveLibrary();
  applyReaderSettings();
}

function applyReaderSettings() {
  const reader = app.library.reader;
  ui.readerEnabled.checked = reader.enabled;
  ui.readerFont.value = reader.fontScale;
  ui.readerWidth.value = reader.lineWidth;
  ui.readerContrast.checked = reader.highContrast;
  ui.readerFontOutput.value = `${reader.fontScale}%`;
  ui.readerWidthOutput.value = `${reader.lineWidth}ch`;
  document.body.classList.toggle('reader-mode', reader.enabled);
  document.body.classList.toggle('reader-high-contrast', reader.highContrast);
  document.documentElement.style.setProperty('--reader-scale', String(reader.fontScale / 100));
  document.documentElement.style.setProperty('--reader-width', `${reader.lineWidth}ch`);
}

function populateSearchSuggestions() {
  ui.searchSuggestions.replaceChildren();
  const values = [...new Set(app.events.flatMap(event => [event.title, event.location, event.category, ...event.tags]).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), i18n.locale)).slice(0, 220);
  values.forEach(value => { const option = document.createElement('option'); option.value = value; ui.searchSuggestions.append(option); });
}

async function copyFilterPreset() {
  syncShareableViewUrl();
  try {
    await navigator.clipboard.writeText(window.location.href);
    showToast(i18n.t('filterPresetCopied'), i18n.t('filterPresetCopiedBody'));
  } catch { showToast(i18n.t('copyFailed'), i18n.t('copyFailedBody')); }
}

function appendSimilarHistory(container, event) {
  const relations = app.relations.filter(relation => relation.from === event.id || relation.to === event.id).slice(0, 4);
  if (!relations.length) return;
  const section = document.createElement('section');
  section.className = 'similar-history';
  const heading = document.createElement('h4');
  heading.textContent = i18n.t('similarHistory');
  const list = document.createElement('ul');
  relations.forEach(relation => {
    const otherId = relation.from === event.id ? relation.to : relation.from;
    const other = resolveEventId(app.events, otherId);
    if (!other) return;
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'text-button';
    button.textContent = other.title;
    button.addEventListener('click', () => flyToEvent(other));
    const evidence = document.createElement('small');
    evidence.textContent = `${relationTypeLabel(relation.relationType)} · ${relationEvidenceLabel(relation.evidenceMode)}`;
    item.append(button, evidence);
    list.append(item);
  });
  section.append(heading, list);
  container.append(section);
}

function setBiographyInUrl(id) {
  const url = new URL(window.location.href);
  url.searchParams.set('bio', id);
  window.history.replaceState(null, '', url);
}

async function registerServiceWorker() {
  document.documentElement.dataset.offlineReady = 'false';
  if (!('serviceWorker' in navigator) || !(window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) return false;
  try {
    const registration = await navigator.serviceWorker.register('./service-worker.js', { scope: './', updateViaCache: 'none' });
    const updatingWorker = registration.installing || registration.waiting;
    if (updatingWorker && updatingWorker.state !== 'activated') await waitForServiceWorkerActivation(updatingWorker);
    let readyTimeout = 0;
    await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => { readyTimeout = window.setTimeout(() => reject(new Error('Offline-Installation hat das Zeitlimit überschritten.')), 15000); })
    ]);
    window.clearTimeout(readyTimeout);
    document.documentElement.dataset.offlineReady = 'true';
    return true;
  } catch (error) {
    console.warn('Offline-Shell konnte nicht aktiviert werden:', error);
    return false;
  }
}

function waitForServiceWorkerActivation(worker) {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('Offline-Aktualisierung hat das Zeitlimit überschritten.')), 15000);
    const check = () => {
      if (worker.state === 'activated') {
        window.clearTimeout(timeout);
        worker.removeEventListener('statechange', check);
        resolve();
      } else if (worker.state === 'redundant') {
        window.clearTimeout(timeout);
        worker.removeEventListener('statechange', check);
        reject(new Error('Offline-Aktualisierung wurde verworfen.'));
      }
    };
    worker.addEventListener('statechange', check);
    check();
  });
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
  const validTargets = new Set(app.events.filter(event => !isSensitiveEvent(event)).map(event => event.id));
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
  ui.biographyCount.textContent = app.biographies.length;
  ui.compareCount.textContent = app.library.compare.length;
  updateMissionUi();
  renderArchive(discovered);
  renderRoutes();
  renderAchievements();
  renderCollections();
  renderContinueReading();
}

function renderRoutes() {
  ui.routesList.replaceChildren();
  const discovered = new Set(app.progress.discoveredIds);
  const visibleIds = new Set(app.filteredEvents.map(event => event.id));
  app.routes.forEach(route => {
    const allEvents = route.eventIds.map(id => resolveEventId(app.events, id)).filter(Boolean);
    const events = allEvents.filter(event => visibleIds.has(event.id));
    if (!events.length) return;
    const completed = events.filter(event => discovered.has(event.id)).length;
    const card = document.createElement('article');
    card.className = 'route-card';
    card.classList.toggle('is-maritime-route', ['uprising-on-deck', 'sea-rights-and-protection'].includes(route.id));
    const heading = document.createElement('h3');
    heading.textContent = route.title;
    const description = document.createElement('p');
    description.textContent = route.description;
    const progressLabel = document.createElement('p');
    progressLabel.className = 'route-progress-label';
    progressLabel.textContent = i18n.t('routeProgress', { completed, total: events.length });
    const visibleNote = document.createElement('small');
    visibleNote.className = 'route-visible-note';
    visibleNote.textContent = i18n.t('routeVisible', { visible: events.length, total: allEvents.length });
    const progress = document.createElement('progress');
    progress.max = Math.max(1, events.length);
    progress.value = completed;
    progress.setAttribute('aria-label', progressLabel.textContent);
    const list = document.createElement('ol');
    list.className = 'route-stops';
    events.forEach(event => {
      const item = document.createElement('li');
      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'route-stop';
      const status = discovered.has(event.id) ? `✓ ${i18n.t('routeRead')}` : i18n.t('routeOpen');
      open.textContent = `${event.title} · ${formatLocalizedYear(event, i18n)} — ${status}`;
      open.addEventListener('click', () => { closeDrawers(); flyToEvent(event); });
      item.append(open);
      if (isSensitiveEvent(event)) {
        const sensitive = document.createElement('small');
        sensitive.className = 'route-sensitive';
        sensitive.textContent = i18n.t('routeSensitive');
        item.append(sensitive);
      }
      const sourceUrl = safeExternalUrl(event.sourceUrl);
      if (sourceUrl) {
        const source = document.createElement('a');
        source.href = sourceUrl;
        source.target = '_blank';
        source.rel = 'noopener noreferrer';
        source.textContent = i18n.t('routeSource');
        item.append(source);
      }
      list.append(item);
    });
    const sourceNote = document.createElement('small');
    sourceNote.className = 'route-source-note';
    sourceNote.textContent = `${i18n.t('routeSourceHint')} ${route.sourceNote}`;
    card.append(heading, description, visibleNote, progressLabel, progress, list, sourceNote);
    ui.routesList.append(card);
  });
  if (!ui.routesList.childElementCount) {
    const empty = document.createElement('p');
    empty.className = 'archive-empty';
    empty.textContent = i18n.t('noRoutesInFilter');
    ui.routesList.append(empty);
  }
}

function renderTimeline() {
  if (!ui.timelineList) return;
  ui.timelineList.replaceChildren();
  const sorted = [...app.filteredEvents].sort((a, b) => (a.yearStart ?? Infinity) - (b.yearStart ?? Infinity));
  const visible = sorted.slice(0, 160);
  visible.forEach(event => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'timeline-event';
    const year = document.createElement('strong');
    year.textContent = formatLocalizedYear(event, i18n);
    const title = document.createElement('span');
    title.textContent = event.title;
    const tactic = document.createElement('small');
    tactic.textContent = tacticSummary(event);
    button.append(year, title, tactic);
    button.addEventListener('click', () => { closeDrawers(); flyToEvent(event); });
    item.append(button);
    ui.timelineList.append(item);
  });
  if (!visible.length) {
    const item = document.createElement('li');
    item.textContent = i18n.t('noResults');
    ui.timelineList.append(item);
  } else if (sorted.length > visible.length) {
    const item = document.createElement('li');
    item.className = 'timeline-limit-note';
    item.textContent = i18n.t('timelineLimited', { shown: visible.length, total: sorted.length });
    ui.timelineList.append(item);
  }
  syncMotionPreference();
}

function toggleTimeTravel() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    stopTimeTravel();
    ui.motionNote.textContent = i18n.t('motionDisabled');
    return;
  }
  if (app.timeTimer) { stopTimeTravel(); return; }
  const time = app.taxonomy.time || DEFAULT_TIME;
  if (app.filters.to >= time.maximum) {
    app.filters.from = time.minimum;
    app.filters.to = time.minimum;
  }
  ui.timePlay.setAttribute('aria-pressed', 'true');
  ui.timePlay.lastElementChild.textContent = i18n.t('pauseTime');
  const step = Math.max(1, Math.ceil((time.maximum - time.minimum) / 120));
  app.timeTimer = window.setInterval(() => {
    app.filters.to = Math.min(time.maximum, app.filters.to + step);
    syncTimeInputs();
    renderMapData();
    if (app.filters.to >= time.maximum) stopTimeTravel();
  }, 160);
}

function stopTimeTravel() {
  if (app.timeTimer) window.clearInterval(app.timeTimer);
  app.timeTimer = null;
  if (ui.timePlay) {
    ui.timePlay.setAttribute('aria-pressed', 'false');
    ui.timePlay.lastElementChild.textContent = i18n.t('playTime');
  }
}

function syncMotionPreference() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) stopTimeTravel();
  ui.timePlay.disabled = reduced;
  ui.motionNote.textContent = reduced ? i18n.t('motionDisabled') : i18n.t('motionOptional');
}

function renderNetwork() {
  if (!ui.networkVisual) return;
  const limits = app.taxonomy.network || { maximumNodes: 72, maximumEdges: 140 };
  const model = buildNetworkModel(app.filteredEvents, app.relations, limits.maximumNodes, limits.maximumEdges);
  ui.networkSummary.textContent = i18n.t('networkSummary', {
    nodes: model.nodes.length,
    edges: model.edges.length,
    total: model.totalEvents
  }) + (model.truncated ? ` ${i18n.t('networkLimited', { limit: limits.maximumNodes })}` : '');
  renderNetworkLegend();
  ui.networkVisual.replaceChildren();
  ui.relationList.replaceChildren();
  if (!model.nodes.length) {
    ui.networkVisual.textContent = i18n.t('noResults');
    return;
  }
  const ns = 'http://www.w3.org/2000/svg';
  const width = 680;
  const height = 440;
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('aria-hidden', 'true');
  const positions = new Map();
  model.nodes.forEach((event, index) => {
    const ring = index < 24 ? 138 : 198;
    const ringIndex = index < 24 ? index : index - 24;
    const ringTotal = index < 24 ? Math.min(24, model.nodes.length) : Math.max(1, model.nodes.length - 24);
    const angle = (Math.PI * 2 * ringIndex / ringTotal) - Math.PI / 2;
    positions.set(event.id, { x: width / 2 + Math.cos(angle) * ring, y: height / 2 + Math.sin(angle) * ring });
  });
  model.edges.forEach(relation => {
    const from = positions.get(relation.from);
    const to = positions.get(relation.to);
    if (!from || !to) return;
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', from.x); line.setAttribute('y1', from.y);
    line.setAttribute('x2', to.x); line.setAttribute('y2', to.y);
    line.setAttribute('class', `network-edge is-${relation.relationType}`);
    svg.append(line);
  });
  model.nodes.forEach(event => {
    const position = positions.get(event.id);
    const group = document.createElementNS(ns, 'g');
    group.setAttribute('class', 'network-node');
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', position.x); circle.setAttribute('cy', position.y); circle.setAttribute('r', 10);
    circle.setAttribute('fill', CATEGORY_COLORS[event.category] || '#c7d8cf');
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', position.x); label.setAttribute('y', position.y + 3);
    label.textContent = primaryTactic(event)?.symbol || '·';
    group.append(circle, label);
    svg.append(group);
  });
  ui.networkVisual.append(svg);
  model.edges.forEach(relation => renderRelationListItem(relation));
  if (!model.edges.length) {
    const item = document.createElement('li');
    item.textContent = i18n.t('noRelationsInFilter');
    ui.relationList.append(item);
  }
}

function renderNetworkLegend() {
  ui.networkLegend.replaceChildren();
  for (const type of ['same-route', 'similar-tactic', 'shared-movement']) {
    const item = document.createElement('span');
    const line = document.createElement('i');
    line.className = `network-line-sample is-${type}`;
    const label = document.createElement('span');
    label.textContent = relationTypeLabel(type);
    item.append(line, label);
    ui.networkLegend.append(item);
  }
}

function renderRelationListItem(relation) {
  const first = resolveEventId(app.events, relation.from);
  const second = resolveEventId(app.events, relation.to);
  if (!first || !second) return;
  const item = document.createElement('li');
  const firstButton = document.createElement('button');
  firstButton.type = 'button'; firstButton.textContent = first.title;
  firstButton.addEventListener('click', () => { closeDrawers(); flyToEvent(first); });
  const relationText = document.createElement('span');
  relationText.textContent = `— ${relationTypeLabel(relation.relationType)} · ${relationEvidenceLabel(relation.evidenceMode)} —`;
  const secondButton = document.createElement('button');
  secondButton.type = 'button'; secondButton.textContent = second.title;
  secondButton.addEventListener('click', () => { closeDrawers(); flyToEvent(second); });
  item.append(firstButton, relationText, secondButton);
  ui.relationList.append(item);
}

function relationTypeLabel(type) {
  return i18n.t({ 'same-route': 'relationSameRoute', 'similar-tactic': 'relationSimilarTactic', 'shared-movement': 'relationSharedMovement', 'editorial-relation': 'relationEditorial' }[type] || 'relationEditorial');
}

function relationEvidenceLabel(mode) {
  return i18n.t(mode === 'heuristic-similarity' ? 'heuristicSimilarity' : mode === 'sourced-relation' ? 'sourcedRelation' : 'curatedContext');
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
  if (!app.map) { showToast(i18n.t('onlineMapUnavailable'), i18n.t('onlineMapNote')); return; }
  if (!app.filteredEvents.length) {
    showToast(i18n.t('noResults'), i18n.t('resetHint'));
    return;
  }
  if (app.filteredEvents.length === 1) {
    flyToEvent(app.filteredEvents[0]);
    return;
  }
  const mappable = app.filteredEvents.filter(event => event.coordinatePrecision !== 'hidden');
  if (!mappable.length) {
    showToast(i18n.t('protectedLocations'), i18n.t('hiddenMapNotice'));
    return;
  }
  const bounds = new window.maplibregl.LngLatBounds();
  mappable.forEach(event => bounds.extend([event.longitude, event.latitude]));
  app.map.fitBounds(bounds, {
    padding: { top: 110, right: 80, bottom: 110, left: window.innerWidth > 820 ? 390 : 60 },
    maxZoom: 6,
    duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 850
  });
}

function flyToEvent(event, openPopup = true) {
  if (!app.map) { showToast(i18n.t('onlineMapUnavailable'), i18n.t('onlineMapNote')); return false; }
  if (!app.map) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reducedMotion ? 0 : 1200;
  const hidden = event.coordinatePrecision === 'hidden';
  const coordinates = safeDisplayCoordinates(event);
  app.map.flyTo({
    center: coordinates,
    zoom: hidden ? 1.7 : Math.max(app.map.getZoom(), event.coordinatePrecision === 'region' ? 3 : 5),
    offset: [0, Math.min(160, window.innerHeight * 0.18)],
    essential: false,
    duration
  });
  if (openPopup) window.setTimeout(() => openEventPopup(event, coordinates), duration + 100);
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

function populateLayerFilters() {
  ui.layerFilters.replaceChildren();
  const allowed = new Set(app.taxonomy.layers.map(layer => layer.id));
  app.filters.layers = app.filters.layers.filter(id => allowed.has(id));
  app.taxonomy.layers.forEach(layer => {
    const label = document.createElement('label');
    label.className = 'layer-toggle';
    label.dataset.layer = layer.id;
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = layer.id;
    input.checked = app.filters.layers.includes(layer.id);
    input.addEventListener('change', () => {
      app.filters.layers = input.checked
        ? [...new Set([...app.filters.layers, layer.id])]
        : app.filters.layers.filter(id => id !== layer.id);
      renderMapData();
      if (layer.id === 'maritime' && input.checked) window.setTimeout(fitFilteredEvents, 0);
    });
    const text = document.createElement('span');
    text.textContent = i18n.t(layer.labelKey);
    label.append(input, text);
    ui.layerFilters.append(label);
  });
}

function populateMapStyles() {
  ui.mapStyleSelect.replaceChildren();
  app.taxonomy.mapStyles.forEach(style => {
    const option = document.createElement('option');
    option.value = style.id;
    option.textContent = i18n.t(style.labelKey);
    ui.mapStyleSelect.append(option);
  });
  ui.mapStyleSelect.value = app.mapStyle;
}

function populateTacticLegend() {
  ui.tacticLegend.replaceChildren();
  app.taxonomy.tactics.forEach(tactic => {
    const item = document.createElement('span');
    const symbol = document.createElement('b');
    symbol.textContent = tactic.symbol;
    const label = document.createElement('span');
    label.textContent = i18n.t(tactic.labelKey);
    item.append(symbol, label);
    ui.tacticLegend.append(item);
  });
}

function loadMapStyle() {
  const query = new URLSearchParams(window.location.search).get('style');
  let stored = '';
  try { stored = window.localStorage.getItem(STYLE_STORAGE_KEY) || ''; } catch { /* private mode */ }
  return ['dark', 'mono', 'paper'].includes(query) ? query : ['dark', 'mono', 'paper'].includes(stored) ? stored : 'dark';
}

function setMapStyle(value) {
  app.mapStyle = app.taxonomy.mapStyles.some(style => style.id === value) ? value : 'dark';
  applyMapStyle();
  try { window.localStorage.setItem(STYLE_STORAGE_KEY, app.mapStyle); } catch { /* private mode */ }
  syncShareableViewUrl();
}

function applyMapStyle() {
  document.documentElement.dataset.mapStyle = app.mapStyle;
  document.documentElement.style.setProperty('--accent', app.mapStyle === 'mono' ? '#ffffff' : app.mapStyle === 'paper' ? '#6d2f1d' : runtimeConfig.accent);
  if (ui.mapStyleSelect) ui.mapStyleSelect.value = app.mapStyle;
  if (app.map?.getLayer('maritime-route-guides')) {
    const mono = app.mapStyle === 'mono';
    const paper = app.mapStyle === 'paper';
    app.map.setPaintProperty('maritime-route-guides', 'line-color', mono ? '#ffffff' : paper ? '#075c58' : '#43d9d1');
    app.map.setPaintProperty('event-maritime-rings', 'circle-stroke-color', mono ? '#ffffff' : paper ? '#075c58' : '#43d9d1');
    app.map.setPaintProperty('event-maritime-symbols', 'text-color', mono ? '#ffffff' : paper ? '#075c58' : '#d9fffb');
    app.map.setPaintProperty('event-maritime-symbols', 'text-halo-color', mono ? '#000000' : paper ? '#fff1cf' : '#063d43');
  }
}

function isMaritimeEvent(event) {
  return event?.layerIds?.includes('maritime') || event?.tags?.includes('Maritime Gegenmacht');
}

function toMaritimeRouteGeoJson(events) {
  const collection = { type: 'FeatureCollection', features: [] };
  if (!app.filters.layers.includes('maritime')) return collection;
  const visible = new Map(events
    .filter(event => isMaritimeEvent(event) && event.coordinatePrecision !== 'hidden' && Number.isFinite(event.longitude) && Number.isFinite(event.latitude))
    .map(event => [event.id, event]));
  app.routes.filter(route => ['uprising-on-deck', 'sea-rights-and-protection'].includes(route.id)).forEach(route => {
    route.eventIds.slice(1).forEach((eventId, index) => {
      const from = visible.get(route.eventIds[index]);
      const to = visible.get(eventId);
      if (!from || !to) return;
      collection.features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [[from.longitude, from.latitude], [to.longitude, to.latitude]] },
        properties: { routeId: route.id, evidenceMode: 'curated-context' }
      });
    });
  });
  return collection;
}

function primaryTactic(event) {
  const id = event.tacticIds?.[0];
  return app.taxonomy.tactics.find(tactic => tactic.id === id) || null;
}

function tacticSummary(event) {
  if (!event.tacticIds?.length) return i18n.t('tacticUnknown');
  return event.tacticIds.map(id => {
    const tactic = app.taxonomy.tactics.find(item => item.id === id);
    return tactic ? `${tactic.symbol} ${i18n.t(tactic.labelKey)}` : '';
  }).filter(Boolean).join(' · ');
}

function renderTacticBadges(container, event, compact = false) {
  const ids = event.tacticIds?.length ? event.tacticIds : [null];
  ids.forEach(id => {
    const tactic = app.taxonomy.tactics.find(item => item.id === id);
    const badge = document.createElement('span');
    badge.className = 'tactic-badge';
    const label = tactic ? i18n.t(tactic.labelKey) : i18n.t('tacticUnknown');
    badge.textContent = tactic ? `${tactic.symbol} ${compact ? label : label}` : `· ${label}`;
    badge.setAttribute('aria-label', label);
    container.append(badge);
  });
}

function precisionExplanation(event) {
  const precision = event.coordinatePrecision || 'exact';
  return i18n.t({ exact: 'precisionExactReason', approximate: 'precisionApproximateReason', region: 'precisionRegionReason', hidden: 'precisionHiddenReason' }[precision]);
}

function safeDisplayCoordinates(event) {
  if (event.coordinatePrecision === 'hidden') return [0, 20];
  return [event.longitude, event.latitude];
}

function formatFilterYear(value) {
  const year = Number(value);
  if (year < 0) return i18n.t('yearBce', { year: Math.abs(year) });
  return String(year);
}

function updateEraFilter() {
  const time = app.taxonomy.time || DEFAULT_TIME;
  const range = normalizeTimeRange(ui.eraFrom.value, ui.eraTo.value, time.minimum, time.maximum);
  app.filters.from = range.from;
  app.filters.to = range.to;
  syncTimeInputs();
  renderMapData();
}

function updateEraFilterFromRange() {
  const sourceIsFrom = document.activeElement === ui.eraFromRange;
  let from = Number(ui.eraFromRange.value);
  let to = Number(ui.eraToRange.value);
  if (from > to) {
    if (sourceIsFrom) to = from;
    else from = to;
  }
  app.filters.from = from;
  app.filters.to = to;
  syncTimeInputs();
  renderMapData();
}

function syncTimeInputs() {
  ui.eraFrom.value = app.filters.from;
  ui.eraTo.value = app.filters.to;
  ui.eraFromRange.value = app.filters.from;
  ui.eraToRange.value = app.filters.to;
}

function resetTimeRange() {
  const time = app.taxonomy.time || DEFAULT_TIME;
  app.filters.from = time.defaultFrom;
  app.filters.to = time.defaultTo;
  stopTimeTravel();
  syncTimeInputs();
  renderMapData();
}

function resetFilters() {
  const time = app.taxonomy.time || DEFAULT_TIME;
  app.filters = { query: '', category: 'all', from: time.defaultFrom, to: time.defaultTo, includeUndated: true, layers: [], undiscoveredOnly: false };
  ui.searchInput.value = '';
  ui.categoryFilter.value = 'all';
  syncTimeInputs();
  ui.includeUndated.checked = true;
  ui.undiscoveredOnly.checked = false;
  populateLayerFilters();
  stopTimeTravel();
  renderMapData();
}

function applyFiltersToUi() {
  ui.searchInput.value = app.filters.query;
  ui.categoryFilter.value = app.filters.category;
  syncTimeInputs();
  ui.includeUndated.checked = app.filters.includeUndated;
  ui.undiscoveredOnly.checked = app.filters.undiscoveredOnly;
}

function loadViewFilters() {
  const defaults = { query: '', category: 'all', from: DEFAULT_TIME.defaultFrom, to: DEFAULT_TIME.defaultTo, includeUndated: true, layers: [], undiscoveredOnly: false };
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(VIEW_STORAGE_KEY) || '{}');
    const params = new URLSearchParams(window.location.search);
    const from = Number(params.get('from') ?? stored.from);
    const to = Number(params.get('to') ?? stored.to);
    const range = normalizeTimeRange(from, to, DEFAULT_TIME.minimum, DEFAULT_TIME.maximum);
    const layers = params.has('layers') ? params.get('layers').split(',') : stored.layers;
    return {
      query: String(params.get('q') ?? stored.query ?? defaults.query).slice(0, 160),
      category: String(params.get('category') ?? stored.category ?? defaults.category).slice(0, 100),
      from: range.from,
      to: range.to,
      includeUndated: params.get('undated') === '0' ? false : stored.includeUndated !== false,
      layers: Array.isArray(layers) ? layers.filter(id => typeof id === 'string').slice(0, 10) : defaults.layers,
      undiscoveredOnly: params.get('undiscovered') === '1' || (!params.has('undiscovered') && Boolean(stored.undiscoveredOnly))
    };
  } catch {
    return defaults;
  }
}

function saveViewFilters() {
  try { window.sessionStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(app.filters)); } catch { /* private mode */ }
  syncShareableViewUrl();
}

function sanitizeViewFilters(filters) {
  const time = app.taxonomy.time || DEFAULT_TIME;
  const range = normalizeTimeRange(filters.from, filters.to, time.minimum, time.maximum);
  const layerIds = new Set(app.taxonomy.layers.map(layer => layer.id));
  return {
    query: String(filters.query || '').slice(0, 160),
    category: String(filters.category || 'all').slice(0, 100),
    from: range.from,
    to: range.to,
    includeUndated: filters.includeUndated !== false,
    layers: [...new Set((filters.layers || []).filter(id => layerIds.has(id)))],
    undiscoveredOnly: Boolean(filters.undiscoveredOnly)
  };
}

function syncShareableViewUrl() {
  const url = new URL(window.location.href);
  const time = app.taxonomy.time || DEFAULT_TIME;
  if (app.filters.from === time.defaultFrom) url.searchParams.delete('from'); else url.searchParams.set('from', app.filters.from);
  if (app.filters.to === time.defaultTo) url.searchParams.delete('to'); else url.searchParams.set('to', app.filters.to);
  if (app.filters.includeUndated) url.searchParams.delete('undated'); else url.searchParams.set('undated', '0');
  if (app.filters.layers.length) url.searchParams.set('layers', app.filters.layers.join(',')); else url.searchParams.delete('layers');
  if (app.filters.query) url.searchParams.set('q', app.filters.query); else url.searchParams.delete('q');
  if (app.filters.category !== 'all') url.searchParams.set('category', app.filters.category); else url.searchParams.delete('category');
  if (app.filters.undiscoveredOnly) url.searchParams.set('undiscovered', '1'); else url.searchParams.delete('undiscovered');
  if (app.mapStyle === 'dark') url.searchParams.delete('style'); else url.searchParams.set('style', app.mapStyle);
  window.history.replaceState(null, '', url);
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
  closeDrawers(false);
  if (shouldOpen) {
    app.lastFocus = activeButton;
    drawer.hidden = false;
    drawer.scrollTo({ top: 0 });
    ui.navButtons.forEach(button => button.classList.toggle('is-active', button === activeButton));
    drawer.focus();
  } else if (app.lastFocus?.isConnected) {
    app.lastFocus.focus();
  }
}

function openPanel(panel) {
  if (panel === 'quiz') { openQuiz(); return true; }
  if (panel === 'map') { closeDrawers(); return true; }
  const drawers = {
    archive: ui.archiveDrawer,
    biographies: ui.biographiesDrawer,
    timeline: ui.timelineDrawer,
    routes: ui.routesDrawer,
    list: ui.eventListDrawer,
    network: ui.networkDrawer,
    compare: ui.compareDrawer,
    achievements: ui.achievementsDrawer,
    connections: ui.connectionsDrawer
  };
  const drawer = drawers[panel];
  if (!drawer) return false;
  closeDrawers(false);
  app.lastFocus = ui.navButtons.find(button => button.dataset.panel === panel) || document.activeElement;
  drawer.hidden = false;
  drawer.scrollTo({ top: 0 });
  ui.navButtons.forEach(button => button.classList.toggle('is-active', button.dataset.panel === panel));
  if (panel === 'connections') drawConnection(false);
  if (panel === 'timeline') renderTimeline();
  if (panel === 'network') renderNetwork();
  if (panel === 'biographies') renderBiographies();
  if (panel === 'compare') renderComparison();
  drawer.focus();
  return true;
}

function closeDrawers(restoreFocus = true) {
  const hadOpenDrawer = [ui.archiveDrawer, ui.biographiesDrawer, ui.timelineDrawer, ui.routesDrawer, ui.eventListDrawer, ui.networkDrawer, ui.compareDrawer, ui.achievementsDrawer, ui.connectionsDrawer]
    .some(drawer => !drawer.hidden);
  ui.archiveDrawer.hidden = true;
  ui.biographiesDrawer.hidden = true;
  ui.timelineDrawer.hidden = true;
  ui.routesDrawer.hidden = true;
  ui.eventListDrawer.hidden = true;
  ui.networkDrawer.hidden = true;
  ui.compareDrawer.hidden = true;
  ui.achievementsDrawer.hidden = true;
  ui.connectionsDrawer.hidden = true;
  if (!ui.biographyDetail.hidden) {
    ui.biographyDetail.hidden = true;
    ui.biographyList.hidden = false;
    ui.biographyFilters.hidden = false;
    ui.biographyResultCount.hidden = false;
    const url = new URL(window.location.href);
    url.searchParams.delete('bio');
    window.history.replaceState(null, '', url);
  }
  stopTimeTravel();
  ui.navButtons.forEach(button => button.classList.toggle('is-active', button.dataset.panel === 'map'));
  if (restoreFocus && hadOpenDrawer && app.lastFocus?.isConnected) app.lastFocus.focus();
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
  const hadOpenModal = !ui.welcomeModal.hidden || !ui.quizModal.hidden || !ui.methodologyModal.hidden || !ui.pirateDossierModal.hidden;
  ui.modalBackdrop.hidden = true;
  ui.welcomeModal.hidden = true;
  ui.quizModal.hidden = true;
  ui.methodologyModal.hidden = true;
  ui.pirateDossierModal.hidden = true;
  if (restoreFocus && hadOpenModal && app.lastFocus?.isConnected) app.lastFocus.focus();
}

function trapModalFocus(event) {
  const modal = [ui.welcomeModal, ui.quizModal, ui.methodologyModal, ui.pirateDossierModal].find(item => !item.hidden);
  if (!modal) return;
  const focusable = [...modal.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

function toggleMobileMenu(open, focusPanel = false) {
  ui.controlPanel.classList.toggle('is-open', open);
  ui.menuToggle.setAttribute('aria-expanded', String(open));
  syncMobileMenuAccessibility();
  if (open && focusPanel && window.matchMedia('(max-width: 820px)').matches) ui.menuClose.focus();
  if (!open && window.matchMedia('(max-width: 820px)').matches && ui.controlPanel.contains(document.activeElement)) {
    ui.menuToggle.focus();
  }
}

function syncMobileMenuAccessibility() {
  const mobile = window.matchMedia('(max-width: 820px)').matches;
  const open = ui.controlPanel.classList.contains('is-open');
  ui.controlPanel.toggleAttribute('inert', mobile && !open);
  if (mobile) ui.controlPanel.setAttribute('aria-hidden', String(!open));
  else ui.controlPanel.removeAttribute('aria-hidden');
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
        const event = resolveEventId(app.events, id);
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
  const time = app.taxonomy.time || DEFAULT_TIME;
  const range = normalizeTimeRange(filters.from ?? app.filters.from, filters.to ?? app.filters.to, time.minimum, time.maximum);
  const allowedLayers = new Set(app.taxonomy.layers.map(layer => layer.id));
  const layers = Array.isArray(filters.layers) ? filters.layers.filter(id => allowedLayers.has(id)) : app.filters.layers;
  app.filters = {
    query: String(filters.query ?? app.filters.query).slice(0, 160),
    category: allowedCategories.has(filters.category) ? filters.category : app.filters.category,
    from: range.from,
    to: range.to,
    includeUndated: Boolean(filters.includeUndated ?? app.filters.includeUndated),
    layers: [...new Set(layers)],
    undiscoveredOnly: Boolean(filters.undiscoveredOnly ?? app.filters.undiscoveredOnly)
  };
  ui.searchInput.value = app.filters.query;
  ui.categoryFilter.value = app.filters.category;
  syncTimeInputs();
  ui.includeUndated.checked = app.filters.includeUndated;
  ui.undiscoveredOnly.checked = app.filters.undiscoveredOnly;
  populateLayerFilters();
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

function showArchiveLoadFailure() {
  app.events = [];
  app.filteredEvents = [];
  ui.resultCount.textContent = i18n.t('archiveLoadFailed');
  setDataStatus(i18n.t('archiveLoadFailed'), 'error');
  showToast(i18n.t('startFailed'), i18n.t('archiveLoadFailedBody'));
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

function loadSupabaseSdk() {
  if (window.supabase?.createClient) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-atlas-supabase]');
    if (existing) {
      existing.addEventListener('load', () => window.supabase?.createClient ? resolve() : reject(new Error('Supabase SDK ist ungültig.')), { once: true });
      existing.addEventListener('error', () => reject(new Error('Supabase SDK konnte nicht geladen werden.')), { once: true });
      return;
    }
    const sdk = document.createElement('script');
    sdk.src = SUPABASE_SDK_URL;
    sdk.integrity = SUPABASE_SDK_INTEGRITY;
    sdk.crossOrigin = 'anonymous';
    sdk.referrerPolicy = 'no-referrer';
    sdk.dataset.atlasSupabase = 'opt-in';
    sdk.addEventListener('load', () => window.supabase?.createClient ? resolve() : reject(new Error('Supabase SDK ist ungültig.')), { once: true });
    sdk.addEventListener('error', () => reject(new Error('Supabase SDK konnte nicht geladen werden.')), { once: true });
    document.head.append(sdk);
  });
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
