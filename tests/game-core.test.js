import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildNetworkModel,
  classifyEventLayers,
  classifyEventTactics,
  createMission,
  createQuiz,
  filterEvents,
  formatYearRange,
  isValidEvent,
  isSensitiveEvent,
  levelFromXp,
  levelProgress,
  localizeEvent,
  normalizeEvent,
  normalizeEventTranslations,
  normalizeTimeRange,
  seededShuffle,
  resolveEventId,
  validateContractFields,
  validateEditorialFields,
  validateMapTaxonomy,
  validateRelations,
  validateRoutes
} from '../src/game-core.js';

const rows = [
  { id: 1, title: 'Eins', category: 'A', location: 'Bern', description: 'Ereignis (1918)', longitude: 7.4, latitude: 46.9 },
  { id: 2, title: 'Zwei', category: 'A', location: 'Paris', year_start: 1871, longitude: 2.3, latitude: 48.8 },
  { id: 3, title: 'Drei', category: 'A', location: 'Prag', year_start: 1989, longitude: 14.4, latitude: 50.0 },
  { id: 4, title: 'Vier', category: 'B', location: 'Tunis', year_start: 2010, longitude: 10.1, latitude: 36.8 }
];
const events = rows.map(normalizeEvent);

test('normalisiert Datenbankfelder und extrahiert Jahreszahlen', () => {
  assert.equal(events[0].yearStart, 1918);
  assert.equal(events[0].id, '1');
  assert.equal(isValidEvent(events[0]), true);
  assert.equal(isValidEvent(normalizeEvent({ title: 'Kaputt', longitude: 999, latitude: 0 })), false);
});

test('filtert nach Suche, Kategorie, Zeitraum und Entdeckungsstatus', () => {
  assert.deepEqual(filterEvents(events, { query: 'bern', category: 'all', from: 1700, to: 2030, undiscoveredOnly: false }).map(event => event.id), ['1']);
  assert.equal(filterEvents(events, { query: '', category: 'A', from: 1900, to: 1950, undiscoveredOnly: false }).length, 1);
  assert.equal(filterEvents(events, { query: '', category: 'all', from: 1700, to: 2030, undiscoveredOnly: true }, new Set(['1'])).length, 3);
});

test('Mehrfach-Tags sind such- und filterbar', () => {
  const tagged = normalizeEvent({ title: 'Fünf', category: 'A', tags: ['Indigener Widerstand', 'Ökologischer Widerstand'], yearStart: 2016, longitude: 1, latitude: 1 });
  const result = filterEvents([tagged], { query: 'ökologisch', category: 'Indigener Widerstand', from: 1900, to: 2030, undiscoveredOnly: false });
  assert.equal(result.length, 1);
});

test('berechnet Level und Fortschritt konsistent', () => {
  assert.equal(levelFromXp(0), 1);
  assert.equal(levelFromXp(100), 2);
  assert.deepEqual(levelProgress(100), { level: 2, percent: 0, nextAt: 300 });
});

test('erstellt reproduzierbare Missionen mit erreichbaren Zielen', () => {
  const first = createMission(events, '2026-08-05');
  const second = createMission(events, '2026-08-05');
  assert.deepEqual(first.targetIds, second.targetIds);
  assert.equal(first.goal, 3);
  assert.ok(first.targetIds.every(id => events.some(event => event.id === id)));
});

test('erstellt ein Quiz mit genau einer richtigen Antwort', () => {
  const quiz = createQuiz(events[0], events, 'quiz');
  assert.equal(quiz.options.filter(option => String(option) === String(quiz.answer)).length, 1);
});

test('mischt deterministisch und formatiert Zeiträume', () => {
  assert.deepEqual(seededShuffle([1, 2, 3, 4], 'seed'), seededShuffle([1, 2, 3, 4], 'seed'));
  assert.equal(formatYearRange({ yearStart: 1918, yearEnd: 1921 }), '1918–1921');
  assert.equal(formatYearRange({ yearStart: null, yearEnd: null }), 'undatiert');
  assert.equal(formatYearRange({ yearStart: -1157, yearEnd: -1157, dateLabel: 'ca. 1157 v. u. Z.' }), 'ca. 1157 v. u. Z.');
});

test('filtert mehrere Themenebenen als ODER und behandelt undatierte Einträge ausdrücklich', () => {
  const layered = [
    { ...events[0], layerIds: ['labour'] },
    { ...events[1], layerIds: ['indigenous'] },
    { ...events[2], layerIds: ['feminist'] },
    { ...normalizeEvent({ id: 'undated', title: 'Undatiert', category: 'A', longitude: 1, latitude: 1 }), layerIds: ['labour'] }
  ];
  const filters = { query: '', category: 'all', from: 1800, to: 2000, includeUndated: true, layers: ['labour', 'indigenous'], undiscoveredOnly: false };
  assert.deepEqual(filterEvents(layered, filters).map(event => event.id), ['1', '2', 'undated']);
  assert.deepEqual(filterEvents(layered, { ...filters, includeUndated: false }).map(event => event.id), ['1', '2']);
  assert.deepEqual(normalizeTimeRange(2100, -2000), { from: -1200, to: 2030 });
});

test('Ereignisübersetzungen werden feldweise und nur nach Prüfung übernommen', () => {
  const translations = {
    en: {
      title: { text: 'Reviewed title', status: 'reviewed' },
      description: { text: 'Unreviewed text', status: 'draft' }
    }
  };
  assert.deepEqual(normalizeEventTranslations(translations), {
    en: { title: { text: 'Reviewed title', status: 'reviewed' } }
  });
  const localized = localizeEvent(normalizeEvent({ title: 'Deutsch', description: 'Deutscher Text', longitude: 1, latitude: 1, translations }), 'en');
  assert.equal(localized.title, 'Reviewed title');
  assert.equal(localized.description, 'Deutscher Text');
  assert.equal(localized.localization.usesGermanOriginal, true);
  assert.deepEqual(validateEditorialFields({ translations: { en: { title: { text: 'Draft', status: 'draft' } } } }), [
    'translations.en.title benötigt status "reviewed"'
  ]);
});

test('normalisiert und validiert optionale Redaktionsfelder rückwärtskompatibel', () => {
  const event = normalizeEvent({
    title: 'Pilot', longitude: 7, latitude: 47, sourceUrl: 'https://de.wikipedia.org/wiki/Test',
    demands: ['Land zurück'], participants: 'Nachbarschaften; Gewerkschaften', powerStructures: ['Staat'],
    immediateConsequences: 'Eine konkrete Folge.', voices: [{ text: 'Eine Stimme.' }], sensitivity: 'Schwere Gewalt'
  });
  assert.deepEqual(event.demands, ['Land zurück']);
  assert.deepEqual(event.participants, ['Nachbarschaften', 'Gewerkschaften']);
  assert.equal(event.sourceType, 'Sekundär / weiterführend');
  assert.equal(isSensitiveEvent(event), true);
  assert.equal(isSensitiveEvent(normalizeEvent({ title: 'Massaker an Streikenden', longitude: 1, latitude: 1 })), true);
  assert.deepEqual(validateEditorialFields({ demands: 42 }), ['demands muss Text oder eine Textliste sein']);
  assert.deepEqual(validateEditorialFields({ demands: ['ok'], reviewStatus: 'Pilot' }), []);
  assert.deepEqual(validateEditorialFields({ voices: ['Belegte Perspektive'] }), ['voices benötigt eine belegende sourceUrl']);
  assert.deepEqual(validateEditorialFields({ sourceType: 'Archiv' }), ['sourceType und sourceQuality müssen gemeinsam gepflegt werden']);
  assert.deepEqual(validateEditorialFields({ reviewStatus: 'Redaktioneller Pilotstand' }), ['Redaktioneller Pilotstand benötigt sourceType und sourceQuality']);
  assert.deepEqual(validateEditorialFields({ demands: [''] }), ['demands enthält einen leeren oder ungültigen Eintrag']);
});

test('sensible Ereignisse werden nicht in Missionen aufgenommen', () => {
  const pool = [
    ...events,
    normalizeEvent({ id: 's', title: 'Sensibel', category: 'A', longitude: 1, latitude: 1, yearStart: 2000, sensitivity: 'Massaker' })
  ];
  const mission = createMission(pool, 'safe-mission');
  assert.equal(mission.targetIds.includes('s'), false);
});

test('validiert Datenvertrag, Aliase, Provenance und Lizenzstatus', () => {
  const contracted = normalizeEvent({
    id: 'canonical-event', aliases: ['former-event'], title: 'Vertrag', longitude: 1, latitude: 2,
    coordinatePrecision: 'region', provenance: { sourceUrls: ['https://example.org/source'], checkedAt: '2026-08-23' },
    license: { status: 'rights-unclear' }
  });
  assert.equal(resolveEventId([contracted], 'former-event')?.id, 'canonical-event');
  assert.deepEqual(validateContractFields(contracted), []);
  assert.ok(validateContractFields({ id: 'Bad ID', coordinatePrecision: 'pinpoint' }).length >= 2);
  assert.deepEqual(validateContractFields({ id: 'same', aliases: ['same'] }), ['aliases darf die kanonische ID nicht enthalten']);
  assert.ok(validateContractFields({ reviewStatus: 'Redaktionell vertieft' }).includes('Redaktionell vertieft benötigt provenance und license'));
});

test('Routen akzeptieren nur kanonische bekannte Stopps und neutralen Fortschritt', () => {
  const route = { routes: [{ id: 'route-one', title: 'Route', description: 'Beschreibung', sourceNote: 'Hinweis', eventIds: ['one', 'two', 'three'], sensitivityMode: 'neutral-progress' }] };
  assert.deepEqual(validateRoutes(route, new Set(['one', 'two', 'three'])), []);
  assert.ok(validateRoutes({ routes: [{ ...route.routes[0], eventIds: ['one', 'alias', 'three'] }] }, new Set(['one', 'two', 'three'])).some(issue => issue.includes('alias')));
});

test('validiert Kartentaxonomie, Relationsdaten und Netzwerkgrenze', () => {
  const taxonomy = {
    schemaVersion: 1,
    time: { minimum: -1200, maximum: 2030, defaultFrom: -1200, defaultTo: 2030 },
    layers: [{ id: 'labour', labelKey: 'layerLabour', terms: ['A'] }],
    tactics: [{ id: 'strike', labelKey: 'tacticStrike', symbol: 'S', terms: ['streik'] }],
    mapStyles: [
      { id: 'dark', labelKey: 'styleDark', basemap: 'carto-dark' },
      { id: 'mono', labelKey: 'styleMono', basemap: 'carto-dark' },
      { id: 'paper', labelKey: 'stylePaper', basemap: 'carto-dark' }
    ],
    network: { maximumNodes: 72, maximumEdges: 140 }
  };
  assert.deepEqual(validateMapTaxonomy(taxonomy), []);
  const relationData = { schemaVersion: 1, relations: [{ id: 'rel-one', from: '1', to: '2', relationType: 'similar-tactic', contextId: 'strike', evidenceMode: 'heuristic-similarity' }] };
  assert.deepEqual(validateRelations(relationData, new Set(['1', '2'])), []);
  const unsourcedEditorial = { schemaVersion: 1, relations: [{ ...relationData.relations[0], relationType: 'editorial-relation' }] };
  assert.ok(validateRelations(unsourcedEditorial, new Set(['1', '2'])).some(issue => issue.includes('sourced-relation')));
  assert.equal(classifyEventLayers(events[0], taxonomy.layers)[0], 'labour');
  const strikeEvent = { ...events[0], tactics: ['Generalstreik'] };
  assert.equal(classifyEventTactics(strikeEvent, taxonomy.tactics)[0], 'strike');
  const model = buildNetworkModel([...events, ...events.map((event, index) => ({ ...event, id: `copy-${index}` }))], relationData.relations, 3, 4);
  assert.equal(model.nodes.length, 3);
  assert.equal(model.edges.length, 1);
  assert.equal(model.truncated, true);
});
