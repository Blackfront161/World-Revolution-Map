import {
  CATEGORY_COLORS,
  createConnection,
  createMission,
  createPowerExcuse,
  createQuiz,
  filterEvents,
  formatYearRange,
  isValidEvent,
  levelProgress,
  normalizeEvent,
  seededShuffle,
  solidarityResult
} from './src/game-core.js';
import { createAtlasApi } from './src/atlas-api.js';
import { readRuntimeConfig } from './src/atlas-config.js';
import { parseStoredProgress, reconcileProgress, sanitizeProgress } from './src/progress-store.js';

const SUPABASE_URL = 'https://pixafxinyydzwplirrnm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cAh2ZxD6aaXREXhMIVyvyA_C_yeFxRd';
const STORAGE_KEY = 'atlas-des-widerstands-progress-v2';
const runtimeConfig = readRuntimeConfig(window.location.search, document.documentElement.dataset, window.location.href);

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
  filters: { query: '', category: 'all', from: -1200, to: 2030, undiscoveredOnly: false },
  activeQuiz: null,
  activeConnection: null,
  bridge: null
};

document.addEventListener('DOMContentLoaded', start);

async function start() {
  document.documentElement.style.setProperty('--accent', runtimeConfig.accent);
  document.body.classList.toggle('is-embedded', runtimeConfig.embed);
  bindUi();
  updateVisitStreak();
  attachUiEvents();
  setupHostApi();

  try {
    await waitForMapLibre();
    app.events = await loadEvents();
    app.progress = reconcileProgress(app.progress, new Set(app.events.map(event => event.id)));
    populateCategories();
    ensureMission();
    initializeMap();
    updateGameUi();
    if (runtimeConfig.showWelcome && !app.progress.seenWelcome) openModal(ui.welcomeModal);
    emitAtlasEvent('ready', { eventCount: app.events.length, embedded: runtimeConfig.embed });
  } catch (error) {
    console.error('Atlas konnte nicht gestartet werden:', error);
    setDataStatus('Die Karte konnte nicht geladen werden.', 'fallback');
    showToast('Start fehlgeschlagen', 'Bitte prÃ¼fe deine Internetverbindung und lade die Seite neu.');
  }
}

function bindUi() {
  const ids = [
    'search-input', 'category-filter', 'era-from', 'era-to', 'undiscovered-only', 'result-count',
    'reset-filters', 'random-event', 'start-mission', 'data-status', 'level-value', 'xp-value',
    'xp-progress', 'mission-card', 'mission-title', 'mission-description', 'mission-reward',
    'mission-progress-text', 'mission-progress-bar', 'archive-count', 'achievement-count',
    'archive-drawer', 'archive-list', 'achievements-drawer', 'achievement-list', 'connections-drawer',
    'connection-content', 'new-connection', 'copy-connection', 'power-excuse', 'power-counter', 'new-excuse', 'quiz-button',
    'quiz-modal', 'quiz-title', 'quiz-content', 'welcome-modal', 'modal-backdrop', 'begin-button',
    'help-button', 'toast-region', 'menu-toggle', 'menu-close', 'control-panel'
  ];
  ids.forEach(id => { ui[toCamel(id)] = document.getElementById(id); });
  ui.navButtons = [...document.querySelectorAll('.nav-button')];
  ui.drawerCloseButtons = [...document.querySelectorAll('.drawer-close')];
  ui.modalCloseButtons = [...document.querySelectorAll('.modal-close')];
}

function attachUiEvents() {
  ui.searchInput.addEventListener('input', () => { app.filters.query = ui.searchInput.value; renderMapData(); });
  ui.categoryFilter.addEventListener('change', () => { app.filters.category = ui.categoryFilter.value; renderMapData(); });
  ui.eraFrom.addEventListener('change', updateEraFilter);
  ui.eraTo.addEventListener('change', updateEraFilter);
  ui.undiscoveredOnly.addEventListener('change', () => { app.filters.undiscoveredOnly = ui.undiscoveredOnly.checked; renderMapData(); });
  ui.resetFilters.addEventListener('click', resetFilters);
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
    showToast('Expedition gestartet', 'Ã–ffne einen Kartenpunkt und sichere deine erste Spur.');
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
  const fallbackResponses = await Promise.all([
    fetch('./data/fallback-events.json'),
    fetch('./data/movement-events.json'),
    fetch('./data/historical-resistance-events.json')
  ]);
  if (fallbackResponses.some(response => !response.ok)) throw new Error('Fallback-Daten fehlen.');
  const fallbackRows = (await Promise.all(fallbackResponses.map(response => response.json())))
    .flat()
    .filter(row => !row.archived)
    .slice(0, 5000);
  const fallback = fallbackRows.map(normalizeEvent).filter(isValidEvent);

  if (!runtimeConfig.useSupabase || !window.supabase?.createClient) {
    setDataStatus(`${fallback.length} kuratierte EintrÃ¤ge Â· Offline-Fallback`, 'fallback');
    return fallback;
  }

  try {
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    const { data, error } = await client.from('ereignisse').select('*').limit(runtimeConfig.maxRemoteEvents);
    if (error) throw error;
    const remote = (data || []).map(normalizeEvent).filter(isValidEvent);
    const merged = mergeEvents(fallback, remote);
    setDataStatus(`${merged.length} EintrÃ¤ge Â· Live-Archiv verbunden`, 'online');
    return merged;
  } catch (error) {
    console.warn('Supabase nicht erreichbar, kuratierter Fallback wird verwendet:', error);
    setDataStatus(`${fallback.length} kuratierte EintrÃ¤ge Â· Fallback aktiv`, 'fallback');
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
  });
}

function renderMapData() {
  const discovered = new Set(app.progress.discoveredIds);
  app.filteredEvents = filterEvents(app.events, app.filters, discovered);
  ui.resultCount.textContent = `${app.filteredEvents.length} ${app.filteredEvents.length === 1 ? 'Ereignis' : 'Ereignisse'}`;
  const source = app.map?.getSource('resistance-events');
  if (source) source.setData(toGeoJson(app.filteredEvents));
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

  const media = document.createElement('div');
  media.className = 'event-popup-placeholder';
  media.textContent = 'âœ¦';
  content.append(media);

  const body = document.createElement('div');
  body.className = 'event-popup-body';
  const meta = document.createElement('div');
  meta.className = 'event-popup-meta';
  const category = document.creatß­ù¶‰žËkºwµçMÑ¥½¸µ¡•…‘±¥¹”œì(€¡•…‘±¥¹”¹Ñ•áÑ½¹Ñ•¹Ð€ô½¹¹•Ñ¥½¸¹¡•…‘±¥¹”ì(€½¹ÍÐÉ¥€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‘¥Øœ¤ì(€É¥¹±…ÍÍ9…µ”€ô€½¹¹•Ñ¥½¸µÉ¥œì(€•Ù•¹ÑÌ¹™½É…  ¡•Ù•¹Ð°¥¹‘•à¤€ôøì(€€€¥˜€¡¥¹‘•à¤ì(€€€€€½¹ÍÐ‰½±Ð€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ÍÁ…¸œ¤ì(€€€€€‰½±Ð¹±…ÍÍ9…µ”€ô€½¹¹•Ñ¥½¸µ‰½±Ðœì(€€€€€‰½±Ð¹Ñ•áÑ½¹Ñ•¹Ð€ô€ŸŠj„œì(€€€€€‰½±Ð¹Í•ÑÑÑÉ¥‰ÕÑ” …É¥„µ¡¥‘‘•¸œ°€ÑÉÕ”œ¤ì(€€€€€É¥¹…ÁÁ•¹¡‰½±Ð¤ì(€€€ô(€€€½¹ÍÐ…É€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰ÕÑÑ½¸œ¤ì(€€€…É¹ÑåÁ”€ô€‰ÕÑÑ½¸œì(€€€…É¹±…ÍÍ9…µ”€ô€½¹¹•Ñ¥½¸µ•Ù•¹Ðœì(€€€½¹ÍÐå•…È€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ÍÁ…¸œ¤ì(€€€å•…È¹±…ÍÍ9…µ”€ô€½¹¹•Ñ¥½¸µå•…Èœì(€€€å•…È¹Ñ•áÑ½¹Ñ•¹Ð€ô™½Éµ…Ñe•…ÉI…¹”¡•Ù•¹Ð¤ì(€€€½¹ÍÐÑ¥Ñ±”€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ÍÑÉ½¹œœ¤ì(€€€Ñ¥Ñ±”¹Ñ•áÑ½¹Ñ•¹Ð€ô•Ù•¹Ð¹Ñ¥Ñ±”ì(€€€½¹ÍÐÁ±…”€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð Íµ…±°œ¤ì(€€€Á±…”¹Ñ•áÑ½¹Ñ•¹Ð€ô•Ù•¹Ð¹±½…Ñ¥½¸ì(€€€…É¹…ÁÁ•¹¡å•…È°Ñ¥Ñ±”°Á±…”¤ì(€€€…É¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ°€ ¤€ôøì±½Í•É…Ý•ÉÌ ¤ì™±åQ½Ù•¹Ð¡•Ù•¹Ð¤ìô¤ì(€€€É¥¹…ÁÁ•¹¡…É¤ì(€ô¤ì((€½¹ÍÐ¥¹Í¥¡Ð€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð Àœ¤ì(€¥¹Í¥¡Ð¹±…ÍÍ9…µ”€ô€½¹¹•Ñ¥½¸µ¥¹Í¥¡Ðœì(€¥¹Í¥¡Ð¹Ñ•áÑ½¹Ñ•¹Ð€ô½¹¹•Ñ¥½¸¹¥¹Í¥¡Ðì(€½¹ÍÐÑ…Ì€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‘¥Øœ¤ì(€Ñ…Ì¹±…ÍÍ9…µ”€ô€½¹¹•Ñ¥½¸µÑ…Ìœì(€½¹¹•Ñ¥½¸¹Í¡…É•‘Q…Ì¹Í±¥” À°€Ô¤¹™½É… ¡Ñ…œ€ôøì(€€€½¹ÍÐ¡¥À€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ÍÁ…¸œ¤ì(€€€¡¥À¹Ñ•áÑ½¹Ñ•¹Ð€ôÑ…œì(€€€Ñ…Ì¹…ÁÁ•¹¡¡¥À¤ì(€ô¤ì(€Õ¤¹½¹¹•Ñ¥½¹½¹Ñ•¹Ð¹…ÁÁ•¹¡¡•…‘±¥¹”°É¥°¥¹Í¥¡Ð°Ñ…Ì¤ì)ô()™Õ¹Ñ¥½¸É•¹‘•ÉA½Ý•ÉáÕÍ” ¤ì(€½¹ÍÐÁ½½°€ô‘¥Í½Ù•É•‘Ù•¹ÑÌ ¤¹±•¹Ñ €ü‘¥Í½Ù•É•‘Ù•¹ÑÌ ¤€è…ÁÀ¹•Ù•¹ÑÌì(€½¹ÍÐ•Ù•¹Ð€ôÍ••‘•‘M¡Õ™™±”¡Á½½°°…Ñ”¹¹½Ü ¤€¬€œµ½Õ¹Ñ•Èœ¥lÁtì(€½¹ÍÐ¥Ñ•´€ôÉ•…Ñ•A½Ý•ÉáÕÍ”¡•Ù•¹Ð°…Ñ”¹¹½Ü ¤€¬€œ´œ€¬5…Ñ ¹É…¹‘½´ ¤¤ì(€Õ¤¹Á½Ý•ÉáÕÍ”¹Ñ•áÑ½¹Ñ•¹Ð€ô¥Ñ•´¹•áÕÍ”ì(€Õ¤¹Á½Ý•É½Õ¹Ñ•È¹Ñ•áÑ½¹Ñ•¹Ð€ô¥Ñ•´¹½Õ¹Ñ•Èì)ô()…Íå¹Œ™Õ¹Ñ¥½¸½Áå½¹¹•Ñ¥½¸ ¤ì(€¥˜€ ……ÁÀ¹…Ñ¥Ù•½¹¹•Ñ¥½¸¤É•ÑÕÉ¸ì(€½¹ÍÐÑ•áÐ€ô…ÁÀ¹…Ñ¥Ù•½¹¹•Ñ¥½¸¹¡•…‘±¥¹”€¬€q¸œ€¬…ÁÀ¹…Ñ¥Ù•½¹¹•Ñ¥½¸¹¥¹Í¥¡Ð€¬€q¸Ñ±…Í•Í]¥‘•ÉÍÑ…¹‘Ìœì(€ÑÉäì(€€€¥˜€ …¹…Ù¥…Ñ½È¹±¥Á‰½…Éü¹ÝÉ¥Ñ•Q•áÐ¤Ñ¡É½Ü¹•ÜÉÉ½È ±¥Á‰½…ÉA$™•¡±Ðœ¤ì(€€€…Ý…¥Ð¹…Ù¥…Ñ½È¹±¥Á‰½…É¹ÝÉ¥Ñ•Q•áÐ¡Ñ•áÐ¤ì(€€€Í¡½ÝQ½…ÍÐ Y•É‰¥¹‘Õ¹œ­½Á¥•ÉÐœ°€	•É•¥Ð›ñÈÍ½±¥‘…É¥Í¡”]•¥Ñ•ÉÙ•ÉÝ•¹‘Õ¹œ¸œ¤ì(€ô…Ñ ì(€€€Í¡½ÝQ½…ÍÐ -½Á¥•É•¸¹¥¡Ð·Ù±¥ œ°€•¥¸	É½ÝÍ•ÈÙ•ÉÝ•¥•ÉÐ•É…‘”‘¥”É•Ù½±ÕÑ¥½»‘É”iÝ¥Í¡•¹…‰±…”¸œ¤ì(€ô)ô()™Õ¹Ñ¥½¸½Á•¹EÕ¥è ¤ì(€½¹ÍÐÁ½½°€ô‘¥Í½Ù•É•‘Ù•¹ÑÌ ¤¹±•¹Ñ €ü‘¥Í½Ù•É•‘Ù•¹ÑÌ ¤€è…ÁÀ¹•Ù•¹ÑÌì(€¥˜€ …Á½½°¹±•¹Ñ ¤É•ÑÕÉ¸ì(€½¹ÍÐ•Ù•¹Ð€ôÍ••‘•‘M¡Õ™™±”¡Á½½°°€‘í…Ñ”¹¹½Ü ¥ôµÅÕ¥é€¥lÁtì(€…ÁÀ¹…Ñ¥Ù•EÕ¥è€ôì•Ù•¹Ð°€¸¸¹É•…Ñ•EÕ¥è¡•Ù•¹Ð°…ÁÀ¹•Ù•¹ÑÌ°…Ñ”¹¹½Ü ¤¤°…¹ÍÝ•É•è™…±Í”ôì(€Õ¤¹ÅÕ¥éQ¥Ñ±”¹Ñ•áÑ½¹Ñ•¹Ð€ô…ÁÀ¹…Ñ¥Ù•EÕ¥è¹ÅÕ•ÍÑ¥½¸ì(€É•¹‘•ÉEÕ¥è ¤ì(€½Á•¹5½‘…°¡Õ¤¹ÅÕ¥é5½‘…°¤ì)ô()™Õ¹Ñ¥½¸É•¹‘•ÉEÕ¥è ¤ì(€½¹ÍÐÅÕ¥è€ô…ÁÀ¹…Ñ¥Ù•EÕ¥èì(€Õ¤¹ÅÕ¥é½¹Ñ•¹Ð¹É•Á±…•¡¥±‘É•¸ ¤ì(€½¹ÍÐ•Ù•¹Ñ…É€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‘¥Øœ¤ì(€•Ù•¹Ñ…É¹±…ÍÍ9…µ”€ô€ÅÕ¥èµ•Ù•¹Ðœì(€½¹ÍÐµ…É­•È€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ÍÁ…¸œ¤ì(€µ…É­•È¹Ñ•áÑ½¹Ñ•¹Ð€ô€ŸŠr˜œì(€½¹ÍÐ½Áä€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‘¥Øœ¤ì(€½¹ÍÐÑ¥Ñ±”€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ÍÑÉ½¹œœ¤ì(€Ñ¥Ñ±”¹Ñ•áÑ½¹Ñ•¹Ð€ôÅÕ¥è¹•Ù•¹Ð¹Ñ¥Ñ±”ì(€½¹ÍÐÁ±…”€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð Íµ…±°œ¤ì(€Á±…”¹Ñ•áÑ½¹Ñ•¹Ð€ôÅÕ¥è¹•Ù•¹Ð¹±½…Ñ¥½¸ì(€½Áä¹…ÁÁ•¹¡Ñ¥Ñ±”°‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰Èœ¤°Á±…”¤ì(€•Ù•¹Ñ…É¹…ÁÁ•¹¡µ…É­•È°½Áä¤ì((€½¹ÍÐ½ÁÑ¥½¹Ì€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‘¥Øœ¤ì(€½ÁÑ¥½¹Ì¹±…ÍÍ9…µ”€ô€ÅÕ¥èµ½ÁÑ¥½¹Ìœì(€ÅÕ¥è¹½ÁÑ¥½¹Ì¹™½É… ¡½ÁÑ¥½¸€ôøì(€€€½¹ÍÐ‰ÕÑÑ½¸€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰ÕÑÑ½¸œ¤ì(€€€‰ÕÑÑ½¸¹ÑåÁ”€ô€‰ÕÑÑ½¸œì(€€€‰ÕÑÑ½¸¹±…ÍÍ9…µ”€ô€ÅÕ¥èµ½ÁÑ¥½¸œì(€€€‰ÕÑÑ½¸¹Ñ•áÑ½¹Ñ•¹Ð€ô½ÁÑ¥½¸ì(€€€‰ÕÑÑ½¸¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ°€ ¤€ôø…¹ÍÝ•ÉEÕ¥è¡½ÁÑ¥½¸°‰ÕÑÑ½¸°½ÁÑ¥½¹Ì¤¤ì(€€€½ÁÑ¥½¹Ì¹…ÁÁ•¹¡‰ÕÑÑ½¸¤ì(€ô¤ì(€Õ¤¹ÅÕ¥é½¹Ñ•¹Ð¹…ÁÁ•¹¡•Ù•¹Ñ…É°½ÁÑ¥½¹Ì¤ì)ô()™Õ¹Ñ¥½¸…¹ÍÝ•ÉEÕ¥è¡½ÁÑ¥½¸°‰ÕÑÑ½¸°½ÁÑ¥½¹Ì¤ì(€¥˜€¡…ÁÀ¹…Ñ¥Ù•EÕ¥è¹…¹ÍÝ•É•¤É•ÑÕÉ¸ì(€…ÁÀ¹…Ñ¥Ù•EÕ¥è¹…¹ÍÝ•É•€ôÑÉÕ”ì(€½¹ÍÐ½ÉÉ•Ð€ôMÑÉ¥¹œ¡½ÁÑ¥½¸¤€ôôôMÑÉ¥¹œ¡…ÁÀ¹…Ñ¥Ù•EÕ¥è¹…¹ÍÝ•È¤ì(€l¸¸¹½ÁÑ¥½¹Ì¹¡¥±‘É•¹t¹™½É… ¡¥Ñ•´€ôøì(€€€¥Ñ•´¹‘¥Í…‰±•€ôÑÉÕ”ì(€€€¥˜€¡¥Ñ•´¹Ñ•áÑ½¹Ñ•¹Ð€ôôôMÑÉ¥¹œ¡…ÁÀ¹…Ñ¥Ù•EÕ¥è¹…¹ÍÝ•È¤¤¥Ñ•´¹±…ÍÍ1¥ÍÐ¹…‘ ¥Ìµ½ÉÉ•Ðœ¤ì(€ô¤ì(€¥˜€ …½ÉÉ•Ð¤‰ÕÑÑ½¸¹±…ÍÍ1¥ÍÐ¹…‘ ¥ÌµÝÉ½¹œœ¤ì(€¥˜€¡½ÉÉ•Ð¤ì(€€€…ÁÀ¹ÁÉ½É•ÍÌ¹ÅÕ¥é¹ÍÝ•É•€¬ô€Äì(€€€…Ý…É‘aÀ ÈÀ°™…±Í”¤ì(€€€¡•­¡¥•Ù•µ•¹ÑÌ ¤ì(€€€Í…Ù•AÉ½É•ÍÌ ¤ì(€€€ÕÁ‘…Ñ•…µ•U¤ ¤ì(€€€Í¡½ÝQ½…ÍÐ I¥¡Ñ¥œÙ•É­»ñÁ™Ðœ°€œ¬ÈÀa@œ¤ì(€ô•±Í”ì(€€€Í¡½ÝQ½…ÍÐ …ÍÐ„œ°¥”É¥¡Ñ¥”¹ÑÝ½ÉÐ¥ÍÐ€‘í…ÁÀ¹…Ñ¥Ù•EÕ¥è¹…¹ÍÝ•Éô¹€¤ì(€ô)ô()™Õ¹Ñ¥½¸™±åQ½I…¹‘½µÙ•¹Ð¡•Ù•¹ÑÌ¤ì(€¥˜€ …•Ù•¹ÑÌ¹±•¹Ñ ¤ìÍ¡½ÝQ½…ÍÐ -•¥¹”QÉ•™™•Èœ°€M•Ñé”‘¥”¥±Ñ•ÈéÕËñ¬°Õ´Ý¥•‘•ÈMÁÕÉ•¸éÔÍ•¡•¸¸œ¤ìÉ•ÑÕÉ¸ìô(€½¹ÍÐ•Ù•¹Ð€ôÍ••‘•‘M¡Õ™™±”¡•Ù•¹ÑÌ°€‘í…Ñ”¹¹½Ü ¥ôµÉ…¹‘½µ€¥lÁtì(€™±åQ½Ù•¹Ð¡•Ù•¹Ð¤ì)ô()™Õ¹Ñ¥½¸™±åQ½Ù•¹Ð¡•Ù•¹Ð°½Á•¹A½ÁÕÀ€ôÑÉÕ”¤ì(€¥˜€ ……ÁÀ¹µ…À¤É•ÑÕÉ¸ì(€½¹ÍÐÉ•‘Õ•‘5½Ñ¥½¸€ôÝ¥¹‘½Ü¹µ…Ñ¡5•‘¥„ œ¡ÁÉ•™•ÉÌµÉ•‘Õ•µµ½Ñ¥½¸èÉ•‘Õ”¤œ¤¹µ…Ñ¡•Ìì(€½¹ÍÐ‘ÕÉ…Ñ¥½¸€ôÉ•‘Õ•‘5½Ñ¥½¸€ü€À€è€ÄÈÀÀì(€…ÁÀ¹µ…À¹™±åQ¼¡ì(€€€•¹Ñ•Èèm•Ù•¹Ð¹±½¹¥ÑÕ‘”°•Ù•¹Ð¹±…Ñ¥ÑÕ‘•t°(€€€é½½´è5…Ñ ¹µ…à¡…ÁÀ¹µ…À¹•Ñi½½´ ¤°€Ô¤°(€€€½™™Í•ÐèlÀ°5…Ñ ¹µ¥¸ ÄØÀ°Ý¥¹‘½Ü¹¥¹¹•É!•¥¡Ð€¨€À¸Äà¥t°(€€€•ÍÍ•¹Ñ¥…°è™…±Í”°(€€€‘ÕÉ…Ñ¥½¸(€ô¤ì(€¥˜€¡½Á•¹A½ÁÕÀ¤Ý¥¹‘½Ü¹Í•ÑQ¥µ•½ÕÐ  ¤€ôø½Á•¹Ù•¹ÑA½ÁÕÀ¡•Ù•¹Ð¤°‘ÕÉ…Ñ¥½¸€¬€ÄÀÀ¤ì)ô()…Íå¹Œ™Õ¹Ñ¥½¸•áÁ…¹‘±ÕÍÑ•È¡•Ù•¹Ð¤ì(€½¹ÍÐ™•…ÑÕÉ”€ô…ÁÀ¹µ…À¹ÅÕ•ÉåI•¹‘•É•‘•…ÑÕÉ•Ì¡•Ù•¹Ð¹Á½¥¹Ð°ì±…å•ÉÌèl±ÕÍÑ•ÉÌtô¥lÁtì(€¥˜€ …™•…ÑÕÉ”¤É•ÑÕÉ¸ì(€ÑÉäì(€€€½¹ÍÐé½½´€ô…Ý…¥Ð…ÁÀ¹µ…À¹•ÑM½ÕÉ” É•Í¥ÍÑ…¹”µ•Ù•¹ÑÌœ¤¹•Ñ±ÕÍÑ•ÉáÁ…¹Í¥½¹i½½´¡™•…ÑÕÉ”¹ÁÉ½Á•ÉÑ¥•Ì¹±ÕÍÑ•É}¥¤ì(€€€…ÁÀ¹µ…À¹•…Í•Q¼¡ì•¹Ñ•Èè™•…ÑÕÉ”¹•½µ•ÑÉä¹½½É‘¥¹…Ñ•Ì°é½½´ô¤ì(€ô…Ñ €¡•ÉÉ½È¤ì(€€€½¹Í½±”¹Ý…É¸ ±ÕÍÑ•È­½¹¹Ñ”¹¥¡Ð—Ù™™¹•ÐÝ•É‘•¸èœ°•ÉÉ½È¤ì(€ô)ô()™Õ¹Ñ¥½¸Á½ÁÕ±…Ñ•…Ñ•½É¥•Ì ¤ì(€l¸¸¹¹•ÜM•Ð¡…ÁÀ¹•Ù•¹ÑÌ¹™±…Ñ5…À¡•Ù•¹Ð€ôøm•Ù•¹Ð¹…Ñ•½Éä°€¸¸¹•Ù•¹Ð¹Ñ…Ít¤¥t¹Í½ÉÐ ¡„°ˆ¤€ôø„¹±½…±•½µÁ…É”¡ˆ°€‘”œ¤¤¹™½É… ¡…Ñ•½Éä€ôøì(€€€½¹ÍÐ½ÁÑ¥½¸€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ½ÁÑ¥½¸œ¤ì(€€€½ÁÑ¥½¸¹Ù…±Õ”€ô…Ñ•½Éäì(€€€½ÁÑ¥½¸¹Ñ•áÑ½¹Ñ•¹Ð€ô…Ñ•½Éäì(€€€Õ¤¹…Ñ•½Éå¥±Ñ•È¹…ÁÁ•¹¡½ÁÑ¥½¸¤ì(€ô¤ì)ô()™Õ¹Ñ¥½¸ÕÁ‘…Ñ•É…¥±Ñ•È ¤ì(€±•Ð™É½´€ô9Õµ‰•È¡Õ¤¹•É…É½´¹Ù…±Õ”¤ì(€±•ÐÑ¼€ô9Õµ‰•È¡Õ¤¹•É…Q¼¹Ù…±Õ”¤ì(€¥˜€ …9Õµ‰•È¹¥Í¥¹¥Ñ”¡™É½´¤¤™É½´€ô€´ÄÈÀÀì(€¥˜€ …9Õµ‰•È¹¥Í¥¹¥Ñ”¡Ñ¼¤¤Ñ¼€ô€ÈÀÌÀì(€¥˜€¡™É½´€øÑ¼¤m™É½´°Ñ½t€ômÑ¼°™É½µtì(€Õ¤¹•É…É½´¹Ù…±Õ”€ô™É½´ì(€Õ¤¹•É…Q¼¹Ù…±Õ”€ôÑ¼ì(€…ÁÀ¹™¥±Ñ•ÉÌ¹™É½´€ô™É½´ì(€…ÁÀ¹™¥±Ñ•ÉÌ¹Ñ¼€ôÑ¼ì(€É•¹‘•É5…Á…Ñ„ ¤ì)ô()™Õ¹Ñ¥½¸É•Í•Ñ¥±Ñ•ÉÌ ¤ì(€…ÁÀ¹™¥±Ñ•ÉÌ€ôìÅÕ•Éäè€œœ°…Ñ•½Éäè€…±°œ°™É½´è€´ÄÈÀÀ°Ñ¼è€ÈÀÌÀ°Õ¹‘¥Í½Ù•É•‘=¹±äè™…±Í”ôì(€Õ¤¹Í•…É¡%¹ÁÕÐ¹Ù…±Õ”€ô€œœì(€Õ¤¹…Ñ•½Éå¥±Ñ•È¹Ù…±Õ”€ô€…±°œì(€Õ¤¹•É…É½´¹Ù…±Õ”€ô€´ÄÈÀÀì(€Õ¤¹•É…Q¼¹Ù…±Õ”€ô€ÈÀÌÀì(€Õ¤¹Õ¹‘¥Í½Ù•É•‘=¹±ä¹¡•­•€ô™…±Í”ì(€É•¹‘•É5…Á…Ñ„ ¤ì)ô()™Õ¹Ñ¥½¸Ñ½±•É…Ý•È¡‘É…Ý•È°…Ñ¥Ù•	ÕÑÑ½¸¤ì(€½¹ÍÐÍ¡½Õ±‘=Á•¸€ô‘É…Ý•È¹¡¥‘‘•¸ì(€±½Í•É…Ý•ÉÌ ¤ì(€¥˜€¡Í¡½Õ±‘=Á•¸¤ì(€€€‘É…Ý•È¹¡¥‘‘•¸€ô™…±Í”ì(€€€Õ¤¹¹…Ù	ÕÑÑ½¹Ì¹™½É… ¡‰ÕÑÑ½¸€ôø‰ÕÑÑ½¸¹±…ÍÍ1¥ÍÐ¹Ñ½±” ¥Ìµ…Ñ¥Ù”œ°‰ÕÑÑ½¸€ôôô…Ñ¥Ù•	ÕÑÑ½¸¤¤ì(€ô)ô()™Õ¹Ñ¥½¸½Á•¹A…¹•°¡Á…¹•°¤ì(€¥˜€¡Á…¹•°€ôôô€ÅÕ¥èœ¤ì½Á•¹EÕ¥è ¤ìÉ•ÑÕÉ¸ÑÉÕ”ìô(€¥˜€¡Á…¹•°€ôôô€µ…Àœ¤ì±½Í•É…Ý•ÉÌ ¤ìÉ•ÑÕÉ¸ÑÉÕ”ìô(€½¹ÍÐ‘É…Ý•ÉÌ€ôì(€€€…É¡¥Ù”èÕ¤¹…É¡¥Ù•É…Ý•È°(€€€…¡¥•Ù•µ•¹ÑÌèÕ¤¹…¡¥•Ù•µ•¹ÑÍÉ…Ý•È°(€€€½¹¹•Ñ¥½¹ÌèÕ¤¹½¹¹•Ñ¥½¹ÍÉ…Ý•È(€ôì(€½¹ÍÐ‘É…Ý•È€ô‘É…Ý•ÉÍmÁ…¹•±tì(€¥˜€ …‘É…Ý•È¤É•ÑÕÉ¸™…±Í”ì(€±½Í•É…Ý•ÉÌ ¤ì(€‘É…Ý•È¹¡¥‘‘•¸€ô™…±Í”ì(€Õ¤¹¹…Ù	ÕÑÑ½¹Ì¹™½É… ¡‰ÕÑÑ½¸€ôø‰ÕÑÑ½¸¹±…ÍÍ1¥ÍÐ¹Ñ½±” ¥Ìµ…Ñ¥Ù”œ°‰ÕÑÑ½¸¹‘…Ñ…Í•Ð¹Á…¹•°€ôôôÁ…¹•°¤¤ì(€¥˜€¡Á…¹•°€ôôô€½¹¹•Ñ¥½¹Ìœ¤‘É…Ý½¹¹•Ñ¥½¸¡™…±Í”¤ì(€É•ÑÕÉ¸ÑÉÕ”ì)ô()™Õ¹Ñ¥½¸±½Í•É…Ý•ÉÌ ¤ì(€Õ¤¹…É¡¥Ù•É…Ý•È¹¡¥‘‘•¸€ôÑÉÕ”ì(€Õ¤¹…¡¥•Ù•µ•¹ÑÍÉ…Ý•È¹¡¥‘‘•¸€ôÑÉÕ”ì(€Õ¤¹½¹¹•Ñ¥½¹ÍÉ…Ý•È¹¡¥‘‘•¸€ôÑÉÕ”ì(€Õ¤¹¹…Ù	ÕÑÑ½¹Ì¹™½É… ¡‰ÕÑÑ½¸€ôø‰ÕÑÑ½¸¹±…ÍÍ1¥ÍÐ¹Ñ½±” ¥Ìµ…Ñ¥Ù”œ°‰ÕÑÑ½¸¹‘…Ñ…Í•Ð¹Á…¹•°€ôôô€µ…Àœ¤¤ì)ô()™Õ¹Ñ¥½¸½Á•¹5½‘…°¡µ½‘…°¤ì(€±½Í•5½‘…±Ì ¤ì(€Õ¤¹µ½‘…±	…­‘É½À¹¡¥‘‘•¸€ô™…±Í”ì(€µ½‘…°¹¡¥‘‘•¸€ô™…±Í”ì(€µ½‘…°¹ÅÕ•ÉåM•±•Ñ½È ‰ÕÑÑ½¸°m¡É•™t°¥¹ÁÕÐœ¤ü¹™½ÕÌ ¤ì)ô()™Õ¹Ñ¥½¸±½Í•5½‘…±Ì ¤ì(€Õ¤¹µ½‘…±	…­‘É½À¹¡¥‘‘•¸€ôÑÉÕ”ì(€Õ¤¹Ý•±½µ•5½‘…°¹¡¥‘‘•¸€ôÑÉÕ”ì(€Õ¤¹ÅÕ¥é5½‘…°¹¡¥‘‘•¸€ôÑÉÕ”ì)ô()™Õ¹Ñ¥½¸Ñ½±•5½‰¥±•5•¹Ô¡½Á•¸¤ì(€Õ¤¹½¹ÑÉ½±A…¹•°¹±…ÍÍ1¥ÍÐ¹Ñ½±” ¥Ìµ½Á•¸œ°½Á•¸¤ì(€Õ¤¹µ•¹ÕQ½±”¹Í•ÑÑÑÉ¥‰ÕÑ” …É¥„µ•áÁ…¹‘•œ°MÑÉ¥¹œ¡½Á•¸¤¤ì)ô()™Õ¹Ñ¥½¸Í•ÑÕÁ!½ÍÑÁ¤ ¤ì(€…ÁÀ¹‰É¥‘”€ôÉ•…Ñ•Ñ±…ÍÁ¤¡ì(€€€¡½ÍÐèÝ¥¹‘½Ü°(€€€Á…É•¹Ñ=É¥¥¸èÉÕ¹Ñ¥µ•½¹™¥œ¹Á…É•¹Ñ=É¥¥¸°(€€€•ÑM¹…ÁÍ¡½Ðè€ ¤€ôø€¡ì(€€€€€É•…‘äè	½½±•…¸¡…ÁÀ¹•Ù•¹ÑÌ¹±•¹Ñ €˜˜…ÁÀ¹µ…À¤°(€€€€€•Ù•¹Ñ½Õ¹Ðè…ÁÀ¹•Ù•¹ÑÌ¹±•¹Ñ °(€€€€€™¥±Ñ•É•‘Ù•¹Ñ½Õ¹Ðè…ÁÀ¹™¥±Ñ•É•‘Ù•¹ÑÌ¹±•¹Ñ °(€€€€€™¥±Ñ•ÉÌè…ÁÀ¹™¥±Ñ•ÉÌ°(€€€€€ÁÉ½É•ÍÌèÍ…¹¥Ñ¥é•AÉ½É•ÍÌ¡…ÁÀ¹ÁÉ½É•ÍÌ¤°(€€€€€…Ñ¥Ù•½¹¹•Ñ¥½¹%è…ÁÀ¹…Ñ¥Ù•½¹¹•Ñ¥½¸ü¹¥ñð¹Õ±°(€€€ô¤°(€€€…Ñ¥½¹Ìèì(€€€€€Í•Ñ¥±Ñ•ÉÌè…ÁÁ±åáÑ•É¹…±¥±Ñ•ÉÌ°(€€€€€™½ÕÍÙ•¹Ðè¥€ôøì(€€€€€€€½¹ÍÐ•Ù•¹Ð€ô…ÁÀ¹•Ù•¹ÑÌ¹™¥¹¡¥Ñ•´€ôø¥Ñ•´¹¥€ôôô¥¤ì(€€€€€€€¥˜€ …•Ù•¹Ð¤É•ÑÕÉ¸™…±Í”ì(€€€€€€€™±åQ½Ù•¹Ð¡•Ù•¹Ð¤ì(€€€€€€€É•ÑÕÉ¸ÑÉÕ”ì(€€€€€ô°(€€€€€É…¹‘½µÙ•¹Ðè€ ¤€ôøì(€€€€€€€™±åQ½I…¹‘½µÙ•¹Ð¡…ÁÀ¹™¥±Ñ•É•‘Ù•¹ÑÌ¤ì(€€€€€€€É•ÑÕÉ¸…ÁÀ¹™¥±Ñ•É•‘Ù•¹ÑÌ¹±•¹Ñ €ø€Àì(€€€€€ô°(€€€€€½Á•¹A…¹•°°(€€€€€•áÁ½ÉÑAÉ½É•ÍÌè€ ¤€ôøÍ…¹¥Ñ¥é•AÉ½É•ÍÌ¡…ÁÀ¹ÁÉ½É•ÍÌ¤°(€€€€€¥µÁ½ÉÑAÉ½É•ÍÌèÙ…±Õ”€ôøì(€€€€€€€…ÁÀ¹ÁÉ½É•ÍÌ€ôÉ•½¹¥±•AÉ½É•ÍÌ¡Ù…±Õ”°¹•ÜM•Ð¡…ÁÀ¹•Ù•¹ÑÌ¹µ…À¡•Ù•¹Ð€ôø•Ù•¹Ð¹¥¤¤¤ì(€€€€€€€•¹ÍÕÉ•5¥ÍÍ¥½¸ ¤ì(€€€€€€€Í…Ù•AÉ½É•ÍÌ ¤ì(€€€€€€€ÕÁ‘…Ñ•…µ•U¤ ¤ì(€€€€€€€É•¹‘•É5…Á…Ñ„ ¤ì(€€€€€€€•µ¥ÑÑ±…ÍÙ•¹Ð ÁÉ½É•ÍÌµ¥µÁ½ÉÑ•œ°ì‘¥Í½Ù•É•‘½Õ¹Ðè…ÁÀ¹ÁÉ½É•ÍÌ¹‘¥Í½Ù•É•‘%‘Ì¹±•¹Ñ ô¤ì(€€€€€€€É•ÑÕÉ¸ÑÉÕ”ì(€€€€€ô°(€€€€€É•Í•ÑAÉ½É•ÍÌè€ ¤€ôøì(€€€€€€€…ÁÀ¹ÁÉ½É•ÍÌ€ôÍ…¹¥Ñ¥é•AÉ½É•ÍÌ¡U1Q}AI=IML¤ì(€€€€€€€•¹ÍÕÉ•5¥ÍÍ¥½¸ ¤ì(€€€€€€€Í…Ù•AÉ½É•ÍÌ ¤ì(€€€€€€€ÕÁ‘…Ñ•…µ•U¤ ¤ì(€€€€€€€É•¹‘•É5…Á…Ñ„ ¤ì(€€€€€€€•µ¥ÑÑ±…ÍÙ•¹Ð ÁÉ½É•ÍÌµÉ•Í•Ðœ°íô¤ì(€€€€€€€É•ÑÕÉ¸ÑÉÕ”ì(€€€€€ô(€€€ô(€ô¤ì(€‘½Õµ•¹Ð¹‘½Õµ•¹Ñ±•µ•¹Ð¹‘…Ñ…Í•Ð¹…Ñ±…ÍÁ¥I•…‘ä€ô…ÁÀ¹‰É¥‘”¹…Á¤¹Ù•ÉÍ¥½¸ì)ô()™Õ¹Ñ¥½¸…ÁÁ±åáÑ•É¹…±¥±Ñ•ÉÌ¡™¥±Ñ•ÉÌ€ôíô¤ì(€½¹ÍÐ…±±½Ý•‘…Ñ•½É¥•Ì€ô¹•ÜM•Ð¡l…±°œ°€¸¸¹…ÁÀ¹•Ù•¹ÑÌ¹™±…Ñ5…À¡•Ù•¹Ð€ôøm•Ù•¹Ð¹…Ñ•½Éä°€¸¸¹•Ù•¹Ð¹Ñ…Ít¥t¤ì(€½¹ÍÐÉ…ÝÉ½´€ô9Õµ‰•È¡™¥±Ñ•ÉÌ¹™É½´€üü…ÁÀ¹™¥±Ñ•ÉÌ¹™É½´¤ì(€½¹ÍÐÉ…ÝQ¼€ô9Õµ‰•È¡™¥±Ñ•ÉÌ¹Ñ¼€üü…ÁÀ¹™¥±Ñ•ÉÌ¹Ñ¼¤ì(€½¹ÍÐ™É½´€ô9Õµ‰•È¹¥Í¥¹¥Ñ”¡É…ÝÉ½´¤€ü5…Ñ ¹µ…à ´ÄÈÀÀ°5…Ñ ¹µ¥¸ ÈÀÌÀ°É…ÝÉ½´¤¤€è…ÁÀ¹™¥±Ñ•ÉÌ¹™É½´ì(€½¹ÍÐÑ¼€ô9Õµ‰•È¹¥Í¥¹¥Ñ”¡É…ÝQ¼¤€ü5…Ñ ¹µ…à ´ÄÈÀÀ°5…Ñ ¹µ¥¸ ÈÀÌÀ°É…ÝQ¼¤¤€è…ÁÀ¹™¥±Ñ•ÉÌ¹Ñ¼ì(€…ÁÀ¹™¥±Ñ•ÉÌ€ôì(€€€ÅÕ•ÉäèMÑÉ¥¹œ¡™¥±Ñ•ÉÌ¹ÅÕ•Éä€üü…ÁÀ¹™¥±Ñ•ÉÌ¹ÅÕ•Éä¤¹Í±¥” À°€ÄØÀ¤°(€€€…Ñ•½Éäè…±±½Ý•‘…Ñ•½É¥•Ì¹¡…Ì¡™¥±Ñ•ÉÌ¹…Ñ•½Éä¤€ü™¥±Ñ•ÉÌ¹…Ñ•½Éä€è…ÁÀ¹™¥±Ñ•ÉÌ¹…Ñ•½Éä°(€€€™É½´è5…Ñ ¹µ¥¸¡™É½´°Ñ¼¤°(€€€Ñ¼è5…Ñ ¹µ…à¡™É½´°Ñ¼¤°(€€€Õ¹‘¥Í½Ù•É•‘=¹±äè	½½±•…¸¡™¥±Ñ•ÉÌ¹Õ¹‘¥Í½Ù•É•‘=¹±ä€üü…ÁÀ¹™¥±Ñ•ÉÌ¹Õ¹‘¥Í½Ù•É•‘=¹±ä¤(€ôì(€Õ¤¹Í•…É¡%¹ÁÕÐ¹Ù…±Õ”€ô…ÁÀ¹™¥±Ñ•ÉÌ¹ÅÕ•Éäì(€Õ¤¹…Ñ•½Éå¥±Ñ•È¹Ù…±Õ”€ô…ÁÀ¹™¥±Ñ•ÉÌ¹…Ñ•½Éäì(€Õ¤¹•É…É½´¹Ù…±Õ”€ô…ÁÀ¹™¥±Ñ•ÉÌ¹™É½´ì(€Õ¤¹•É…Q¼¹Ù…±Õ”€ô…ÁÀ¹™¥±Ñ•ÉÌ¹Ñ¼ì(€Õ¤¹Õ¹‘¥Í½Ù•É•‘=¹±ä¹¡•­•€ô…ÁÀ¹™¥±Ñ•ÉÌ¹Õ¹‘¥Í½Ù•É•‘=¹±äì(€É•¹‘•É5…Á…Ñ„ ¤ì(€•µ¥ÑÑ±…ÍÙ•¹Ð ™¥±Ñ•ÉÌµ¡…¹•œ°ì™¥±Ñ•ÉÌè…ÁÀ¹™¥±Ñ•ÉÌ°É•ÍÕ±Ñ½Õ¹Ðè…ÁÀ¹™¥±Ñ•É•‘Ù•¹ÑÌ¹±•¹Ñ ô¤ì(€É•ÑÕÉ¸ÑÉÕ”ì)ô()™Õ¹Ñ¥½¸•µ¥ÑÑ±…ÍÙ•¹Ð¡ÑåÁ”°‘•Ñ…¥°¤ì(€…ÁÀ¹‰É¥‘”ü¹•µ¥Ð¡ÑåÁ”°‘•Ñ…¥°¤ì)ô()™Õ¹Ñ¥½¸Í•Ñ…Ñ…MÑ…ÑÕÌ¡µ•ÍÍ…”°µ½‘”¤ì(€Õ¤¹‘…Ñ…MÑ…ÑÕÌ¹±…ÍÍ9…µ”€ô‘…Ñ„µÍÑ…ÑÕÌ¥Ì´‘íµ½‘•õ€ì(€Õ¤¹‘…Ñ…MÑ…ÑÕÌ¹±…ÍÑ±•µ•¹Ñ¡¥±¹Ñ•áÑ½¹Ñ•¹Ð€ôµ•ÍÍ…”ì)ô()™Õ¹Ñ¥½¸Í¡½ÝQ½…ÍÐ¡Ñ¥Ñ±”°µ•ÍÍ…”¤ì(€½¹ÍÐÑ½…ÍÐ€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‘¥Øœ¤ì(€Ñ½…ÍÐ¹±…ÍÍ9…µ”€ô€Ñ½…ÍÐœì(€½¹ÍÐÍÑÉ½¹œ€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ÍÑÉ½¹œœ¤ì(€ÍÑÉ½¹œ¹Ñ•áÑ½¹Ñ•¹Ð€ôÑ¥Ñ±”ì(€½¹ÍÐ½Áä€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ÍÁ…¸œ¤ì(€½Áä¹Ñ•áÑ½¹Ñ•¹Ð€ôµ•ÍÍ…”ì(€Ñ½…ÍÐ¹…ÁÁ•¹¡ÍÑÉ½¹œ°½Áä¤ì(€Õ¤¹Ñ½…ÍÑI•¥½¸¹…ÁÁ•¹¡Ñ½…ÍÐ¤ì(€Ý¥¹‘½Ü¹Í•ÑQ¥µ•½ÕÐ  ¤€ôøÑ½…ÍÐ¹É•µ½Ù” ¤°€ÐÈÀÀ¤ì)ô()…Íå¹Œ™Õ¹Ñ¥½¸É•Í½±Ù•%µ…•UÉ°¡•Ù•¹Ð¤ì(€½¹ÍÐ‘¥É•Ð€ôÍ…™•%µ…•UÉ°¡•Ù•¹Ð¹¥µ…•UÉ°¤ì(€¥˜€¡‘¥É•Ð¤É•ÑÕÉ¸‘¥É•Ðì(€½¹ÍÐ…Á¥UÉ°€ôÍ…™•]¥­¥Á•‘¥…Á¥UÉ°¡•Ù•¹Ð¹¥µ…•Á¥UÉ°¤ì(€¥˜€ ……Á¥UÉ°¤É•ÑÕÉ¸€œœì(€½¹ÍÐ½¹ÑÉ½±±•È€ô¹•Ü‰½ÉÑ½¹ÑÉ½±±•È ¤ì(€½¹ÍÐÑ¥µ•½ÕÐ€ôÝ¥¹‘½Ü¹Í•ÑQ¥µ•½ÕÐ  ¤€ôø½¹ÑÉ½±±•È¹…‰½ÉÐ ¤°€ØÀÀÀ¤ì(€ÑÉäì(€€€½¹ÍÐÉ•ÍÁ½¹Í”€ô…Ý…¥Ð™•Ñ ¡…Á¥UÉ°°ìÍ¥¹…°è½¹ÑÉ½±±•È¹Í¥¹…°°É•‘•¹Ñ¥…±Ìè€½µ¥Ðœ°É•™•ÉÉ•ÉA½±¥äè€¹¼µÉ•™•ÉÉ•Èœô¤ì(€€€¥˜€ …É•ÍÁ½¹Í”¹½¬¤É•ÑÕÉ¸€œœì(€€€½¹ÍÐ‘…Ñ„€ô…Ý…¥ÐÉ•ÍÁ½¹Í”¹©Í½¸ ¤ì(€€€É•ÑÕÉ¸Í…™•%µ…•UÉ°¡‘…Ñ„¹Ñ¡Õµ‰¹…¥°ü¹Í½ÕÉ”ñð‘…Ñ„¹½É¥¥¹…±¥µ…”ü¹Í½ÕÉ”ñð€œœ¤ì(€ô…Ñ ì(€€€É•ÑÕÉ¸€œœì(€ô™¥¹…±±äì(€€€Ý¥¹‘½Ü¹±•…ÉQ¥µ•½ÕÐ¡Ñ¥µ•½ÕÐ¤ì(€ô)ô()™Õ¹Ñ¥½¸±½…‘AÉ½É•ÍÌ ¤ì(€ÑÉäì(€€€½¹ÍÐÍ…Ù•€ôÁ…ÉÍ•MÑ½É•‘AÉ½É•ÍÌ¡±½…±MÑ½É…”¹•Ñ%Ñ•´¡MQ=I}-d¤ñð€íôœ¤ì(€€€É•ÑÕÉ¸Í…¹¥Ñ¥é•AÉ½É•ÍÌ¡ì€¸¸¹U1Q}AI=IML°€¸¸¹Í…Ù•ô¤ì(€ô…Ñ ì(€€€É•ÑÕÉ¸Í…¹¥Ñ¥é•AÉ½É•ÍÌ¡U1Q}AI=IML¤ì(€ô)ô()™Õ¹Ñ¥½¸Í…Ù•AÉ½É•ÍÌ ¤ì(€…ÁÀ¹ÁÉ½É•ÍÌ€ôÍ…¹¥Ñ¥é•AÉ½É•ÍÌ¡…ÁÀ¹ÁÉ½É•ÍÌ¤ì(€ÑÉäì±½…±MÑ½É…”¹Í•Ñ%Ñ•´¡MQ=I}-d°)M=8¹ÍÑÉ¥¹¥™ä¡…ÁÀ¹ÁÉ½É•ÍÌ¤¤ìô…Ñ €¡•ÉÉ½È¤ì½¹Í½±”¹Ý…É¸ ½ÉÑÍ¡É¥ÑÐ­½¹¹Ñ”¹¥¡Ð•ÍÁ•¥¡•ÉÐÝ•É‘•¸èœ°•ÉÉ½È¤ìô)ô()™Õ¹Ñ¥½¸ÕÁ‘…Ñ•Y¥Í¥ÑMÑÉ•…¬ ¤ì(€½¹ÍÐÑ½‘…ä€ô¹•Ü…Ñ” ¤ì(€½¹ÍÐ‘…Ñ•-•ä€ôÑ½‘…ä¹Ñ½%M=MÑÉ¥¹œ ¤¹Í±¥” À°€ÄÀ¤ì(€¥˜€¡…ÁÀ¹ÁÉ½É•ÍÌ¹±…ÍÑY¥Í¥Ð€ôôô‘…Ñ•-•ä¤É•ÑÕÉ¸ì(€¥˜€¡…ÁÀ¹ÁÉ½É•ÍÌ¹±…ÍÑY¥Í¥Ð¤ì(€€€½¹ÍÐÁÉ•Ù¥½ÕÌ€ô¹•Ü…Ñ”¡€‘í…ÁÀ¹ÁÉ½É•ÍÌ¹±…ÍÑY¥Í¥ÑõPÀÀèÀÀèÀÁ€¤ì(€€€½¹ÍÐ‘•±Ñ„€ô5…Ñ ¹É½Õ¹ ¡¹•Ü…Ñ”¡€‘í‘…Ñ•-•åõPÀÀèÀÀèÀÁ€¤€´ÁÉ•Ù¥½ÕÌ¤€¼€àØÐÀÀÀÀÀ¤ì(€€€…ÁÀ¹ÁÉ½É•ÍÌ¹Ù¥Í¥ÑMÑÉ•…¬€ô‘•±Ñ„€ôôô€Ä€ü…ÁÀ¹ÁÉ½É•ÍÌ¹Ù¥Í¥ÑMÑÉ•…¬€¬€Ä€è€Äì(€ô(€…ÁÀ¹ÁÉ½É•ÍÌ¹±…ÍÑY¥Í¥Ð€ô‘…Ñ•-•äì(€Í…Ù•AÉ½É•ÍÌ ¤ì)ô()™Õ¹Ñ¥½¸‘¥Í½Ù•É•‘Ù•¹ÑÌ ¤ì(€½¹ÍÐ¥‘Ì€ô¹•ÜM•Ð¡…ÁÀ¹ÁÉ½É•ÍÌ¹‘¥Í½Ù•É•‘%‘Ì¤ì(€É•ÑÕÉ¸…ÁÀ¹•Ù•¹ÑÌ¹™¥±Ñ•È¡•Ù•¹Ð€ôø¥‘Ì¹¡…Ì¡•Ù•¹Ð¹¥¤¤ì)ô()™Õ¹Ñ¥½¸…Ñ•½Éå½±½ÉáÁÉ•ÍÍ¥½¸ ¤ì(€½¹ÍÐ•áÁÉ•ÍÍ¥½¸€ôlµ…Ñ œ°l•Ðœ°€…Ñ•½Éäutì(€=‰©•Ð¹•¹ÑÉ¥•Ì¡Q=Ie}=1=IL¤¹™½É…  ¡m…Ñ•½Éä°½±½Ét¤€ôø•áÁÉ•ÍÍ¥½¸¹ÁÕÍ ¡…Ñ•½Éä°½±½È¤¤ì(€•áÁÉ•ÍÍ¥½¸¹ÁÕÍ  œŒÝá˜œ¤ì(€É•ÑÕÉ¸•áÁÉ•ÍÍ¥½¸ì)ô()™Õ¹Ñ¥½¸•Ù•¹ÑM¥¹…ÑÕÉ”¡•Ù•¹Ð¤ì(€É•ÑÕÉ¸€‘í•Ù•¹Ð¹Ñ¥Ñ±”¹Ñ½1½…±•1½Ý•É…Í” ‘”œ¥õð‘í•Ù•¹Ð¹±½…Ñ¥½¸¹Ñ½1½…±•1½Ý•É…Í” ‘”œ¥õ€ì)ô()™Õ¹Ñ¥½¸Ý¥Ñ¡½ÕÑµÁÑåY…±Õ•Ì¡½‰©•Ð¤ì(€É•ÑÕÉ¸=‰©•Ð¹™É½µ¹ÑÉ¥•Ì¡=‰©•Ð¹•¹ÑÉ¥•Ì¡½‰©•Ð¤¹™¥±Ñ•È ¡l°Ù…±Õ•t¤€ôøÙ…±Õ”€„ôô€œœ(€€€€˜˜Ù…±Õ”€„ôô¹Õ±°(€€€€˜˜Ù…±Õ”€„ôôÕ¹‘•™¥¹•(€€€€˜˜€ …ÉÉ…ä¹¥ÍÉÉ…ä¡Ù…±Õ”¤ñðÙ…±Õ”¹±•¹Ñ €ø€À¤¤¤ì)ô()™Õ¹Ñ¥½¸Í…™•áÑ•É¹…±UÉ°¡Ù…±Õ”¤ì(€ÑÉäì(€€€½¹ÍÐÕÉ°€ô¹•ÜUI0¡Ù…±Õ”¤ì(€€€É•ÑÕÉ¸ÕÉ°¹ÁÉ½Ñ½½°€ôôô€¡ÑÑÁÌèœ€üÕÉ°¹¡É•˜€è€œœì(€ô…Ñ ìÉ•ÑÕÉ¸€œœìô)ô()™Õ¹Ñ¥½¸Í…™•]¥­¥Á•‘¥…Á¥UÉ°¡Ù…±Õ”¤ì(€½¹ÍÐÕÉ°€ôÍ…™•áÑ•É¹…±UÉ°¡Ù…±Õ”¤ì(€¥˜€ …ÕÉ°¤É•ÑÕÉ¸€œœì(€½¹ÍÐ¡½ÍÑ¹…µ”€ô¹•ÜUI0¡ÕÉ°¤¹¡½ÍÑ¹…µ”ì(€É•ÑÕÉ¸l‘”¹Ý¥­¥Á•‘¥„¹½Éœœ°€•¸¹Ý¥­¥Á•‘¥„¹½Éœt¹¥¹±Õ‘•Ì¡¡½ÍÑ¹…µ”¤€üÕÉ°€è€œœì)ô()™Õ¹Ñ¥½¸Í…™•%µ…•UÉ°¡Ù…±Õ”¤ì(€½¹ÍÐÕÉ°€ôÍ…™•áÑ•É¹…±UÉ°¡Ù…±Õ”¤ì(€¥˜€ …ÕÉ°¤É•ÑÕÉ¸€œœì(€É•ÑÕÉ¸¹•ÜUI0¡ÕÉ°¤¹¡½ÍÑ¹…µ”€ôôô€ÕÁ±½…¹Ý¥­¥µ•‘¥„¹½Éœœ€üÕÉ°€è€œœì)ô()™Õ¹Ñ¥½¸‘…¥±åM•• ¤ìÉ•ÑÕÉ¸¹•Ü…Ñ” ¤¹Ñ½%M=MÑÉ¥¹œ ¤¹Í±¥” À°€ÄÀ¤ìô)™Õ¹Ñ¥½¸Ñ½…µ•°¡Ù…±Õ”¤ìÉ•ÑÕÉ¸Ù…±Õ”¹É•Á±…” ¼´¡m„µét¤½œ°€¡|°±•ÑÑ•È¤€ôø±•ÑÑ•È¹Ñ½UÁÁ•É…Í” ¤¤ìô)™Õ¹Ñ¥½¸¥Í½Éµ±•µ•¹Ð¡•±•µ•¹Ð¤ìÉ•ÑÕÉ¸l%9AUPœ°€M1Pœ°€QaQIt¹¥¹±Õ‘•Ì¡•±•µ•¹Ðü¹Ñ…9…µ”¤ìô()™Õ¹Ñ¥½¸Ý…¥Ñ½É5…Á1¥‰É”¡Ñ¥µ•½ÕÐ€ô€ÄÀÀÀÀ¤ì(€½¹ÍÐÍÑ…ÉÑ•€ô…Ñ”¹¹½Ü ¤ì(€É•ÑÕÉ¸¹•ÜAÉ½µ¥Í” ¡É•Í½±Ù”°É•©•Ð¤€ôøì(€€€½¹ÍÐ¡•¬€ô€ ¤€ôøì(€€€€€¥˜€¡Ý¥¹‘½Ü¹µ…Á±¥‰É•°¤É•ÑÕÉ¸É•Í½±Ù” ¤ì(€€€€€¥˜€¡…Ñ”¹¹½Ü ¤€´ÍÑ…ÉÑ•€øÑ¥µ•½ÕÐ¤É•ÑÕÉ¸É•©•Ð¡¹•ÜÉÉ½È 5…Á1¥‰É”ÝÕÉ‘”¹¥¡Ð•±…‘•¸¸œ¤¤ì(€€€€€Ý¥¹‘½Ü¹Í•ÑQ¥µ•½ÕÐ¡¡•¬°€ÔÀ¤ì(€€€ôì(€€€¡•¬ ¤ì(€ô¤ì)ô(