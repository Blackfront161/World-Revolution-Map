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
    showToast('Start fehlgeschlagen', 'Bitte prüfe deine Internetverbindung und lade die Seite neu.');
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
    showToast('Expedition gestartet', 'Öffne einen Kartenpunkt und sichere deine erste Spur.');
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
    setDataStatus(`${fallback.length} kuratierte Einträge · Offline-Fallback`, 'fallback');
    return fallback;
  }

  try {
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    const { data, error } = await client.from('ereignisse').select('*').limit(runtimeConfig.maxRemoteEvents);
    if (error) throw error;
    const remote = (data || []).map(normalizeEvent).filter(isValidEvent);
    const merged = mergeEvents(fallback, remote);
    setDataStatus(`${merged.length} Einträge · Live-Archiv verbunden`, 'online');
    return merged;
  } catch (error) {
    console.warn('Supabase nicht erreichbar, kuratierter Fallback wird verwendet:', error);
    setDataStatus(`${fallback.length} kuratierte Einträge · Fallback aktiv`, 'fallback');
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
  media.textContent = '✦';
  content.append(media);

  const body = document.createElement('div');
  body.className = 'event-popup-body';
  const meta = document.createElement('div');
  meta.className = 'event-popup-meta';
  const category = document.createElement('span');
  category.className = 'event-popup-category';
  category.textContent = event.category;
  const year = document.createElement('span');
  year.textContent = formatYearRange(event);
  meta.append(category, year);

  const title = document.createElement('h3');
  title.textContent = event.title;
  const location = document.createElement('p');
  location.className = 'event-popup-location';
  location.textContent = `⌖ ${event.location}`;
  const description = document.createElement('p');
  description.className = 'event-popup-description';
  description.textContent = event.description;
  body.append(meta, title, location, description);

  if (event.tags.length) {
    const tags = document.createElement('div');
    tags.className = 'event-popup-tags';
    event.tags.slice(0, 4).forEach(tag => {
      const chip = document.createElement('span');
      chip.textContent = tag;
      tags.append(chip);
    });
    body.append(tags);
  }

  const actions = document.createElement('div');
  actions.className = 'event-popup-actions';
  const discoverButton = document.createElement('button');
  discoverButton.type = 'button';
  discoverButton.className = 'discover-button';
  const isDiscovered = app.progress.discoveredIds.includes(event.id);
  discoverButton.textContent = isDiscovered ? '✓ Im Archiv' : 'Spur sichern';
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
    source.textContent = 'Quelle ↗';
    actions.append(source);
  }
  body.append(actions);
  if (event.significance) {
    const significance = document.createElement('p');
    significance.className = 'event-popup-description event-popup-significance';
    const label = document.createElement('strong');
    label.textContent = 'Warum es wichtig ist: ';
    significance.append(label, document.createTextNode(event.significance));
    body.append(significance);
  }
  content.append(body);

  app.popup = new window.maplibregl.Popup({ offset: 14, closeButton: true })
    .setLngLat(coordinates)
    .setDOMContent(content)
    .addTo(app.map);

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

function discoverEvent(event, button) {
  if (app.progress.discoveredIds.includes(event.id)) return;
  const previous = app.events.find(item => item.id === app.progress.lastDiscoveredId);
  app.progress.discoveredIds.push(event.id);
  const discoveryXp = 15 + (event.difficulty * 5);
  awardXp(discoveryXp);
  const solidarity = solidarityResult(previous, event, app.progress.solidarityCombo);
  app.progress.solidarityCombo = solidarity.combo;
  app.progress.bestSolidarityCombo = Math.max(app.progress.bestSolidarityCombo, solidarity.combo);
  app.progress.lastDiscoveredId = event.id;
  if (solidarity.bonusXp) awardXp(solidarity.bonusXp, false);
  button.textContent = '✓ Im Archiv';
  button.disabled = true;

  const mission = app.progress.mission;
  if (mission && !mission.complete && mission.targetIds.includes(event.id) && !mission.completedIds.includes(event.id)) {
    mission.completedIds.push(event.id);
    awardXp(10, false);
    if (mission.completedIds.length >= mission.goal) {
      mission.complete = true;
      app.progress.missionsCompleted += 1;
      awardXp(mission.reward, false);
      showToast('Mission erfüllt!', `+${mission.reward} Bonus-XP · Eine neue Mission wartet.`);
    }
  }

  checkAchievements();
  saveProgress();
  updateGameUi();
  renderMapData();
  if (solidarity.bonusXp) {
    showToast(`Solidaritäts-Combo ×${solidarity.combo}`, `${solidarity.sharedTags[0]} verbindet die Spuren · +${solidarity.bonusXp} Bonus-XP`);
  } else {
    showToast('Neue Spur gesichert', `${event.title} · +${discoveryXp} XP`);
  }
  emitAtlasEvent('event-discovered', { id: event.id, xp: app.progress.xp, combo: solidarity.combo });
}

function awardXp(amount, show = true) {
  const before = levelProgress(app.progress.xp).level;
  app.progress.xp += amount;
  const after = levelProgress(app.progress.xp).level;
  if (show && after > before) showToast(`Level ${after} erreicht`, 'Dein historisches Archiv wächst.');
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
    const confirmed = window.confirm('Die laufende Mission wirklich ersetzen? Ihr Fortschritt geht verloren.');
    if (!confirmed) return;
  }
  app.progress.mission = createMission(app.events, `${Date.now()}-${Math.random()}`);
  saveProgress();
  updateMissionUi();
  renderMapData();
  const target = currentMissionTargets()[0];
  if (target) flyToEvent(target, false);
  showToast('Neue Mission', app.progress.mission.description);
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
  ui.missionTitle.textContent = mission.complete ? 'Mission abgeschlossen' : mission.title;
  ui.missionDescription.textContent = mission.complete ? 'Starte eine neue Mission und entdecke weitere Zusammenhänge.' : mission.description;
  ui.missionReward.textContent = mission.complete ? '✓ Erfüllt' : `+${mission.reward} XP`;
  ui.missionProgressText.textContent = `${Math.min(count, mission.goal)} / ${mission.goal}`;
  ui.missionProgressBar.style.width = `${mission.goal ? Math.min(100, (count / mission.goal) * 100) : 0}%`;
}

function renderArchive(discovered) {
  ui.archiveList.replaceChildren();
  if (!discovered.length) {
    const empty = document.createElement('p');
    empty.className = 'archive-empty';
    empty.textContent = 'Noch ist dein Archiv leer. Öffne einen Kartenpunkt und sichere die erste Spur.';
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
    location.textContent = `${event.location} · ${event.category}`;
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
      showToast(`Erfolg: ${achievement.title}`, '+25 XP');
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
    title.textContent = unlocked ? achievement.title : 'Noch verborgen';
    const description = document.createElement('small');
    description.textContent = achievement.description;
    card.append(icon, title, description);
    ui.achievementList.append(card);
  });
}

function drawConnection(rewardNew = true) {
  const discovered = discoveredEvents();
  const pool = discovered.length >= 2 ? discovered : app.events;
  const connection = createConnection(pool, Date.now() + '-' + Math.random());
  if (!connection) {
    ui.connectionContent.textContent = 'Noch keine tragfähige Verbindung gefunden. Das Archiv verlangt mehr Material.';
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
    showToast('Funke gesichert', 'Keine historische Kurzschlussgefahr · +8 XP');
    emitAtlasEvent('connection-created', { id: connection.id, eventIds: connection.eventIds });
  }
}

function renderConnection(connection) {
  ui.connectionContent.replaceChildren();
  const events = connection.eventIds.map(id => app.events.find(event => event.id === id)).filter(Boolean);
  if (events.length !== 2) return;

  const headline = document.createElement('h3');
  headline.className = 'connection-headline';
  headline.textContent = connection.headline;
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
    year.textContent = formatYearRange(event);
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
  insight.textContent = connection.insight;
  const tags = document.createElement('div');
  tags.className = 'connection-tags';
  connection.sharedTags.slice(0, 5).forEach(tag => {
    const chip = document.createElement('span');
    chip.textContent = tag;
    tags.append(chip);
  });
  ui.connectionContent.append(headline, grid, insight, tags);
}

function renderPowerExcuse() {
  const pool = discoveredEvents().length ? discoveredEvents() : app.events;
  const event = seededShuffle(pool, Date.now() + '-counter')[0];
  const item = createPowerExcuse(event, Date.now() + '-' + Math.random());
  ui.powerExcuse.textContent = item.excuse;
  ui.powerCounter.textContent = item.counter;
}

async function copyConnection() {
  if (!app.activeConnection) return;
  const text = app.activeConnection.headline + '\n' + app.activeConnection.insight + '\n#AtlasDesWiderstands';
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API fehlt');
    await navigator.clipboard.writeText(text);
    showToast('Verbindung kopiert', 'Bereit für solidarische Weiterverwendung.');
  } catch {
    showToast('Kopieren nicht möglich', 'Dein Browser verweigert gerade die revolutionäre Zwischenablage.');
  }
}

function openQuiz() {
  const pool = discoveredEvents().length ? discoveredEvents() : app.events;
  if (!pool.length) return;
  const event = seededShuffle(pool, `${Date.now()}-quiz`)[0];
  app.activeQuiz = { event, ...createQuiz(event, app.events, Date.now()), answered: false };
  ui.quizTitle.textContent = app.activeQuiz.question;
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
    button.textContent = option;
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
    if (item.textContent === String(app.activeQuiz.answer)) item.classList.add('is-correct');
  });
  if (!correct) button.classList.add('is-wrong');
  if (correct) {
    app.progress.quizAnswered += 1;
    awardXp(20, false);
    checkAchievements();
    saveProgress();
    updateGameUi();
    showToast('Richtig verknüpft', '+20 XP');
  } else {
    showToast('Fast!', `Die richtige Antwort ist ${app.activeQuiz.answer}.`);
  }
}

function flyToRandomEvent(events) {
  if (!events.length) { showToast('Keine Treffer', 'Setze die Filter zurück, um wieder Spuren zu sehen.'); return; }
  const event = seededShuffle(events, `${Date.now()}-random`)[0];
  flyToEvent(event);
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
  [...new Set(app.events.flatMap(event => [event.category, ...event.tags]))].sort((a, b) => a.localeCompare(b, 'de')).forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    ui.categoryFilter.append(option);
  });
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

function toggleDrawer(drawer, activeButton) {
  const shouldOpen = drawer.hidden;
  closeDrawers();
  if (shouldOpen) {
    drawer.hidden = false;
    ui.navButtons.forEach(button => button.classList.toggle('is-active', button === activeButton));
  }
}

function openPanel(panel) {
  if (panel === 'quiz') { openQuiz(); return true; }
  if (panel === 'map') { closeDrawers(); return true; }
  const drawers = {
    archive: ui.archiveDrawer,
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
  ui.achievementsDrawer.hidden = true;
  ui.connectionsDrawer.hidden = true;
  ui.navButtons.forEach(button => button.classList.toggle('is-active', button.dataset.panel === 'map'));
}

function openModal(modal) {
  closeModals();
  ui.modalBackdrop.hidden = false;
  modal.hidden = false;
  modal.querySelector('button, [href], input')?.focus();
}

function closeModals() {
  ui.modalBackdrop.hidden = true;
  ui.welcomeModal.hidden = true;
  ui.quizModal.hidden = true;
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
      activeConnectionId: app.activeConnection?.id || null
    }),
    actions: {
      setFilters: applyExternalFilters,
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
