import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { isValidEvent, normalizeEvent } from '../src/game-core.js';

const root = new URL('../', import.meta.url);

test('HTML verweist auf vorhandene lokale Kernressourcen', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  for (const resource of ['styles.css', 'script.js']) {
    assert.match(html, new RegExp(resource.replace('.', '\\.')));
    const file = await readFile(new URL(resource, root), 'utf8');
    assert.ok(file.length > 100);
  }
  assert.match(html, /aria-label=/);
  assert.match(html, /skip-link/);
  assert.match(html, /Content-Security-Policy/);
  assert.equal((html.match(/integrity="sha384-/g) || []).length, 3);
  assert.doesNotMatch(html, /targetOrigin="\*"/);
  assert.match(html, /id="clear-search"/);
  assert.match(html, /id="fit-results"/);
  assert.match(html, /id="methodology-modal"/);
  assert.match(html, /id="event-list-drawer"/);
  assert.match(html, /id="routes-drawer"/);
  assert.match(html, /id="timeline-drawer"/);
  assert.match(html, /id="network-drawer"/);
  assert.match(html, /id="layer-filters"/);
  assert.match(html, /id="tactic-legend"/);
  assert.match(html, /id="map-style-select"/);
  assert.match(html, /id="active-filters"/);
});

test('Fallback-Archiv enthält valide, eindeutige und belegte Ereignisse', async () => {
  const catalog = JSON.parse(await readFile(new URL('data/event-catalog.json', root), 'utf8'));
  const files = catalog.map(file => `data/${file}`);
  const allRows = (await Promise.all(files.map(file => readFile(new URL(file, root), 'utf8')))).flatMap(JSON.parse);
  assert.equal(allRows.filter(event => event.category === 'Tiefe Geschichte').length, 0);
  const rows = allRows.filter(row => !row.archived);
  const events = rows.map(normalizeEvent);
  assert.equal(events.length, 655);
  assert.equal(new Set(events.map(event => event.id)).size, events.length);
  assert.ok(events.every(isValidEvent));
  assert.ok(events.every(event => event.sourceUrl.startsWith('https://')));
  assert.ok(new Set(events.map(event => event.continent)).size >= 6);
  assert.ok(new Set(events.flatMap(event => [event.category, ...event.tags])).size >= 35);
  assert.equal(events.filter(event => event.category === 'Tiefe Geschichte').length, 0);
  assert.equal(Math.min(...events.map(event => event.yearStart)), -1157);
  assert.ok(events.filter(event => event.yearStart < 1500).length >= 25);
  assert.ok(events.filter(event => event.continent === 'Afrika').length >= 40);
  assert.ok(events.filter(event => event.continent === 'Asien').length >= 55);
  assert.ok(events.filter(event => event.continent === 'Ozeanien').length >= 18);
  assert.ok(events.filter(event => event.country.includes('Kanada') && [event.category, ...event.tags].includes('Indigener Widerstand')).length >= 40);
  assert.ok(events.filter(event => event.country.includes('Kanada') && [event.category, ...event.tags].includes('Indigener Widerstand') && event.yearStart < 1900).length >= 7);
  assert.ok(events.filter(event => event.category === 'Soziale Errungenschaft').length >= 15);
  for (const id of ['battle-of-seattle-wto-1999', 'rodney-king-beating-1991', 'baltimore-uprising-2015', 'black-lives-matter-toronto-pride-2016', 'breonna-taylor-louisville-protests']) {
    assert.ok(events.some(event => event.id === id), `Erwarteter Eintrag fehlt: ${id}`);
  }
});

test('Datenvertrag, Koordinatenschutz, Vertiefungen und Routen bleiben konsistent', async () => {
  const catalog = JSON.parse(await readFile(new URL('data/event-catalog.json', root), 'utf8'));
  const rows = (await Promise.all(catalog.map(file => readFile(new URL(`data/${file}`, root), 'utf8')))).flatMap(JSON.parse).filter(row => !row.archived);
  const ids = new Set(rows.map(row => row.id));
  const metadata = JSON.parse(await readFile(new URL('data/event-metadata.json', root), 'utf8'));
  const overrides = JSON.parse(await readFile(new URL('data/event-editorial-overrides.json', root), 'utf8'));
  const routes = JSON.parse(await readFile(new URL('data/routes.json', root), 'utf8'));
  const taxonomy = JSON.parse(await readFile(new URL('data/map-taxonomy.json', root), 'utf8'));
  const relations = JSON.parse(await readFile(new URL('data/relations.json', root), 'utf8'));
  const sensitiveIds = rows.filter(row => row.sensitivity && !['Niedrig', 'Nein', 'Keine'].includes(row.sensitivity)).map(row => row.id);
  const precisionById = new Map(metadata.events.map(row => [row.id, row.coordinatePrecision]));

  assert.equal(sensitiveIds.length, 53);
  assert.ok(sensitiveIds.every(id => precisionById.has(id)));
  assert.equal(Object.keys(overrides.events).length, 20);
  assert.ok(Object.entries(overrides.events).every(([id, row]) => ids.has(id) && !/wikipedia\.org/i.test(row.sourceUrl) && row.reviewStatus === 'Redaktionell vertieft'));
  assert.equal(routes.routes.length, 4);
  assert.equal(taxonomy.layers.length, 10);
  assert.equal(taxonomy.tactics.length, 10);
  assert.equal(taxonomy.mapStyles.length, 3);
  assert.equal(taxonomy.network.maximumNodes, 72);
  assert.equal(relations.relations.length, 24);
  assert.ok(routes.routes.every(route => route.eventIds.every(id => ids.has(id)) && route.sensitivityMode === 'neutral-progress'));
  for (const id of ['standing-rock', 'muskrat-falls-land-protectors', '1492-land-back-lane', 'camp-morgan-landfill-search', 'aboriginal-tent-embassy']) {
    assert.equal(precisionById.get(id), 'hidden');
  }
});

test('Priorisierte Ereignisse besitzen vertiefte redaktionelle Angaben', async () => {
  const catalog = JSON.parse(await readFile(new URL('data/event-catalog.json', root), 'utf8'));
  const rows = (await Promise.all(catalog.map(file => readFile(new URL(`data/${file}`, root), 'utf8')))).flatMap(JSON.parse);
  const byId = new Map(rows.filter(event => !event.archived).map(event => [event.id, event]));
  const priorityIds = [
    'tsilhqotin-war-1864', 'north-west-resistance-1885', 'nisgaa-land-committee-1887',
    'white-paper-resistance-1969', 'james-bay-cree-hydro-resistance',
    'anicinabe-park-occupation-1974', 'native-peoples-caravan-1974',
    'constitution-express-1980', 'meares-island-blockade-1984', '1492-land-back-lane',
    'haitianische-revolution', 'mau-mau', 'herero-nama-resistance', 'maji-maji-rebellion',
    'rhodes-must-fall', 'haymarket', 'bread-and-roses', 'dakar-niger-railway-strike',
    'durban-strikes-1973', 'winnipeg-general-strike'
  ];
  const requiredFields = [
    'demands', 'participants', 'powerStructures', 'tactics',
    'immediateConsequences', 'longTermImpact', 'sourceType', 'sourceQuality', 'reviewStatus'
  ];

  assert.equal(priorityIds.length, 20);
  for (const id of priorityIds) {
    const event = byId.get(id);
    assert.ok(event, `Priorisiertes Ereignis fehlt: ${id}`);
    for (const field of requiredFields) {
      assert.ok(event[field]?.length, `${id}: ${field} fehlt oder ist leer`);
    }
  }
});

test('Zweite Redaktionsrunde ist vertieft und nutzt keine Wikipedia-Einzelquelle', async () => {
  const catalog = JSON.parse(await readFile(new URL('data/event-catalog.json', root), 'utf8'));
  const rows = (await Promise.all(catalog.map(file => readFile(new URL(`data/${file}`, root), 'utf8')))).flatMap(JSON.parse);
  const byId = new Map(rows.filter(event => !event.archived).map(event => [event.id, event]));
  const priorityIds = [
    'mica-bay-incident-1849', 'red-river-resistance-1869', 'cranmer-potlatch-resistance-1921',
    'six-nations-council-resistance-1924', 'lubicon-spirit-sings-boycott-1988',
    'ardoch-uranium-blockade', 'muskrat-falls-land-protectors', 'camp-morgan-landfill-search',
    'day-of-mourning-1938', 'montgomery-bus-boycott', 'selma-marches', 'act-up-wall-street',
    'natal-indian-strike-1913', 'niger-delta-womens-protests', 'enmore-martyrs-strike',
    'ecuador-indigenous-uprising-1990', 'togo-general-strike-1992', 'swaziland-general-strike-1996',
    'shutitall-down-namibia', 'trinidad-oilfield-strike', 'jamaica-labour-rebellion-1938',
    'black-trans-liberation-march'
  ];
  const requiredFields = [
    'demands', 'participants', 'powerStructures', 'tactics',
    'immediateConsequences', 'longTermImpact', 'sourceType', 'sourceQuality', 'reviewStatus'
  ];

  assert.equal(priorityIds.length, 22);
  for (const id of priorityIds) {
    const event = byId.get(id);
    assert.ok(event, `Priorisiertes Ereignis fehlt: ${id}`);
    for (const field of requiredFields) assert.ok(event[field]?.length, `${id}: ${field} fehlt oder ist leer`);
    assert.doesNotMatch(event.sourceUrl, /wikipedia\.org/i, `${id}: Wikipedia darf nicht die einzige verlinkte Quelle sein`);
  }
});

test('Dritte Redaktionsrunde ist vertieft und nutzt belastbare Nicht-Wikipedia-Quellen', async () => {
  const catalog = JSON.parse(await readFile(new URL('data/event-catalog.json', root), 'utf8'));
  const rows = (await Promise.all(catalog.map(file => readFile(new URL(`data/${file}`, root), 'utf8')))).flatMap(JSON.parse);
  const byId = new Map(rows.filter(event => !event.archived).map(event => [event.id, event]));
  const priorityIds = [
    'pueblo-revolt', 'standing-rock', 'bastion-point-occupation', 'maori-language-petition',
    'foreshore-seabed-hikoi', 'bagua-protests', 'ghadar-bewegung', 'salt-march', 'quit-india',
    'fifth-pan-african-congress', 'lip-selbstverwaltung', 'cochabamba-water-war',
    'narmada-bachao-andolan', 'justice-for-janitors', 'tebhaga-movement',
    'combahee-river-collective', 'mujeres-libres', 'greenham-common', 'stonewall',
    'comptons-cafeteria-riot'
  ];
  const requiredFields = [
    'demands', 'participants', 'powerStructures', 'tactics', 'immediateConsequences',
    'longTermImpact', 'repression', 'humanCosts', 'aftermath', 'openQuestions', 'voices',
    'sourceType', 'sourceQuality', 'uncertainty', 'sensitivity', 'reviewStatus'
  ];

  assert.equal(priorityIds.length, 20);
  for (const id of priorityIds) {
    const event = byId.get(id);
    assert.ok(event, `Priorisiertes Ereignis fehlt: ${id}`);
    for (const field of requiredFields) assert.ok(event[field]?.length, `${id}: ${field} fehlt oder ist leer`);
    assert.doesNotMatch(event.sourceUrl, /wikipedia\.org/i, `${id}: Wikipedia darf nicht die einzige verlinkte Quelle sein`);
    assert.match(event.sourceUrl, /^https:\/\//, `${id}: Quelle muss HTTPS verwenden`);
  }
});

test('Datenbankinhalte werden nicht über innerHTML in die Seite geschrieben', async () => {
  const script = await readFile(new URL('script.js', root), 'utf8');
  assert.doesNotMatch(script, /\.innerHTML\s*=/);
  assert.match(script, /setDOMContent/);
  assert.match(script, /sanitizeProgress/);
  assert.match(script, /safeWikipediaApiUrl/);
  assert.match(script, /VIEW_STORAGE_KEY/);
  assert.match(script, /eventShareUrl/);
  assert.match(script, /fitFilteredEvents/);
  assert.match(script, /appendEventDetail/);
  assert.match(script, /trapModalFocus/);
  assert.match(script, /syncMobileMenuAccessibility/);
  assert.match(script, /toggleAttribute\('inert'/);
  assert.match(script, /resolveEventId/);
  assert.match(script, /renderRoutes/);
  assert.match(script, /renderTimeline/);
  assert.match(script, /renderNetwork/);
  assert.match(script, /event\.coordinatePrecision !== 'hidden'/);
  assert.match(script, /safeDisplayCoordinates/);
  assert.match(script, /syncShareableViewUrl/);
});

test('Design berücksichtigt reduzierte Bewegung und mobile Ansichten', async () => {
  const css = await readFile(new URL('styles.css', root), 'utf8');
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /@media \(max-width: 820px\)/);
  assert.match(css, /data-map-style="mono"/);
  assert.match(css, /data-map-style="paper"/);
  assert.match(css, /event-approximate-rings|precision-sample\.is-approximate/);
});

test('Quellenprüfung trennt definitive Fehler von Netzwerkunsicherheit', async () => {
  const sourceCheck = await readFile(new URL('scripts/check-sources.mjs', root), 'utf8');
  assert.match(sourceCheck, /const unresolved = \[\]/);
  assert.match(sourceCheck, /UNENTSCHIEDEN/);
  assert.match(sourceCheck, /if \(failures\.length\) process\.exitCode = 1/);
});
