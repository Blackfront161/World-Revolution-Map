import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { isValidEvent, normalizeEvent } from '../src/game-core.js';

const root = new URL('../', import.meta.url);

test('HTML verweist auf vorhandene lokale Kernressourcen', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  for (const resource of ['styles.css', 'script.js', 'manifest.webmanifest']) {
    assert.match(html, new RegExp(resource.replace('.', '\\.')));
    const file = await readFile(new URL(resource, root), 'utf8');
    assert.ok(file.length > 100);
  }
  assert.match(html, /aria-label=/);
  assert.match(html, /skip-link/);
  assert.match(html, /Content-Security-Policy/);
  assert.equal((html.match(/integrity="sha384-/g) || []).length, 2);
  assert.doesNotMatch(html, /supabase-js@2\.45\.4/);
  assert.doesNotMatch(html, /wikipedia\.org/);
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
  assert.match(html, /id="biographies-drawer"/);
  assert.match(html, /id="compare-drawer"/);
  assert.match(html, /id="pirate-dossier-modal"/);
  assert.match(html, /Piraterie ist nicht automatisch Anarchie/);
  assert.match(html, /class="reader-settings"/);
});

test('Fallback-Archiv enthält valide, eindeutige und belegte Ereignisse', async () => {
  const catalog = JSON.parse(await readFile(new URL('data/event-catalog.json', root), 'utf8'));
  const metadata = JSON.parse(await readFile(new URL('data/event-metadata.json', root), 'utf8'));
  const metadataById = new Map(metadata.events.map(row => [row.id, row]));
  const files = catalog.map(file => `data/${file}`);
  const allRows = (await Promise.all(files.map(file => readFile(new URL(file, root), 'utf8')))).flatMap(JSON.parse);
  assert.equal(allRows.filter(event => event.category === 'Tiefe Geschichte').length, 0);
  const rows = allRows.filter(row => !row.archived);
  const events = rows.map(row => normalizeEvent({ ...row, ...(metadataById.get(row.id) || {}) }));
  assert.equal(events.length, 674);
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
  for (const resource of ['service-worker.js', 'icons/atlas-icon.svg']) assert.ok((await readFile(new URL(resource, root), 'utf8')).length > 100);
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
  const contract = JSON.parse(await readFile(new URL('data/archive-contract.json', root), 'utf8'));
  const sensitiveIds = rows.filter(row => row.sensitivity && !['Niedrig', 'Nein', 'Keine'].includes(row.sensitivity)).map(row => row.id);
  const precisionById = new Map(metadata.events.map(row => [row.id, row.coordinatePrecision]));

  assert.ok(sensitiveIds.every(id => precisionById.has(id)));
  assert.ok(contract.sensitivityPolicy.baselineSensitiveIds.length >= 53);
  assert.ok(contract.sensitivityPolicy.baselineSensitiveIds.every(id => sensitiveIds.includes(id) && precisionById.has(id)));
  assert.equal(Object.keys(overrides.events).length, 22);
  assert.ok(Object.entries(overrides.events).every(([id, row]) => ids.has(id) && !/wikipedia\.org/i.test(row.sourceUrl) && row.reviewStatus === 'Redaktionell vertieft'));
  assert.equal(routes.routes.length, 6);
  assert.equal(taxonomy.layers.length, 11);
  assert.equal(taxonomy.tactics.length, 10);
  assert.equal(taxonomy.mapStyles.length, 3);
  assert.equal(taxonomy.network.maximumNodes, 72);
  assert.equal(relations.relations.length, 33);
  assert.ok(routes.routes.every(route => route.eventIds.every(id => ids.has(id)) && route.sensitivityMode === 'neutral-progress'));
  for (const id of ['standing-rock', 'muskrat-falls-land-protectors', '1492-land-back-lane', 'camp-morgan-landfill-search', 'aboriginal-tent-embassy']) {
    assert.equal(precisionById.get(id), 'hidden');
    const raw = rows.find(row => row.id === id);
    assert.ok(raw);
    assert.ok(!('coordinates' in raw) && !('latitude' in raw) && !('longitude' in raw) && !('lat' in raw) && !('lng' in raw));
  }
});

test('Maritime Erweiterung bleibt quellenkritisch, regional und ohne Piraten-Mythenevent', async () => {
  const maritime = JSON.parse(await readFile(new URL('data/expansion-maritime.json', root), 'utf8'));
  const routes = JSON.parse(await readFile(new URL('data/routes.json', root), 'utf8'));
  const relations = JSON.parse(await readFile(new URL('data/relations.json', root), 'utf8'));
  const html = await readFile(new URL('index.html', root), 'utf8');
  const script = await readFile(new URL('script.js', root), 'utf8');
  assert.equal(maritime.length, 6);
  assert.equal(new Set(maritime.map(row => row.id)).size, maritime.length);
  assert.ok(maritime.every(row => row.tags.includes('Maritime Gegenmacht')));
  assert.ok(maritime.every(row => ['approximate', 'region'].includes(row.coordinatePrecision)));
  assert.ok(maritime.every(row => row.license?.status === 'rights-unclear'));
  assert.ok(maritime.every(row => row.provenance?.sourceUrls?.length >= 2 && row.provenance.sourceUrls.includes(row.sourceUrl)));
  const achievements = maritime.filter(row => row.category === 'Soziale Errungenschaft');
  assert.equal(achievements.length, 3);
  assert.ok(achievements.every(row => row.bottomUpPressure && row.achievement && row.limits));
  const tallurutiup = maritime.find(row => row.id === 'tallurutiup-imanga-inuit-agreement-2019');
  assert.ok(tallurutiup);
  assert.doesNotMatch(`${tallurutiup.significance} ${tallurutiup.achievement} ${tallurutiup.immediateConsequences}`, /formell (?:eingerichtet|etabliert)/i);
  assert.match(tallurutiup.limits, /gesetzliche Einrichtung/i);
  assert.match(tallurutiup.limits, /noch aus/i);
  assert.match(tallurutiup.achievement, /IIBA[\s\S]*begannen[\s\S]*kooperativ zu betreiben/i);
  assert.ok(routes.routes.some(route => route.id === 'uprising-on-deck'));
  assert.ok(routes.routes.some(route => route.id === 'sea-rights-and-protection'));
  assert.ok(relations.relations.filter(row => row.contextId === 'uprising-on-deck' || row.contextId === 'sea-rights-and-protection').every(row => row.evidenceMode === 'curated-context'));
  assert.ok(!maritime.some(row => /libertalia|anne-bonny|mary-read/.test(row.id)));
  assert.match(html, /Libertalia: Mythos, kein Kartenpunkt/);
  assert.match(html, /1721 gedruckter Bericht des Vizeadmiralitätsverfahrens/);
  assert.match(html, /persee\.fr\/doc\/dhs_0070-6760_1998_num_30_1_2258/);
  assert.match(html, /archive\.org\/details\/the-tryals-of-captain-john-rackham/);
  assert.match(html, /blogs\.loc\.gov\/law\/2024\/07\/the-life-and-trial-of-anne-bonny/);
  assert.match(html, /york\.ac\.uk\/eighteenth-century-studies\/news\/2018\/fictional-facts/);
  assert.match(script, /ui\.pirateDossierModal\.hidden = true/);
  assert.match(script, /ui\.methodologyModal, ui\.pirateDossierModal/);
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
  assert.doesNotMatch(script, /safeWikipediaApiUrl|safeImageUrl|resolveImageUrl/);
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
  assert.match(script, /function isRuntimeEventValid/);
  assert.match(script, /safeDisplayCoordinates/);
  assert.match(script, /syncShareableViewUrl/);
  assert.match(script, /loadBiographies/);
  assert.match(script, /'biography-filters'/);
  assert.match(script, /renderComparison/);
  assert.match(script, /parseLibrary/);
  assert.doesNotMatch(script, /decodeURIComponent\(value\)/);
  assert.match(script, /navigator\.serviceWorker\.register/);
  assert.match(script, /updateViaCache: 'none'/);
  assert.match(script, /navigator\.serviceWorker\.ready/);
  assert.match(script, /dataset\.offlineReady = 'true'/);
  assert.match(script, /registration\.installing \|\| registration\.waiting/);
  assert.match(script, /waitForServiceWorkerActivation/);
});

test('Biografiekatalog enthält 40 koordinatenfreie, belegte Lebenswege', async () => {
  const catalog = JSON.parse(await readFile(new URL('data/biography-catalog.json', root), 'utf8'));
  const rows = (await Promise.all(catalog.files.map(entry => readFile(new URL(`data/${entry.file}`, root), 'utf8')))).flatMap(JSON.parse);
  const sources = rows.flatMap(row => row.sources ?? row.sourceRefs ?? []);
  assert.equal(catalog.files.length, 3);
  assert.equal(rows.length, 40);
  assert.equal(sources.length, 97);
  assert.equal(new Set(rows.map(row => row.id)).size, 40);
  assert.ok(rows.every(row => /^bio-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.id)));
  assert.ok(rows.every(row => !('coordinates' in row) && !('lat' in row) && !('lng' in row)));
  assert.ok(rows.every(row => (row.sources ?? row.sourceRefs ?? []).length >= 2));
  assert.ok(sources.every(source => /^https:\/\//.test(source.url)));
});

test('Offline-Shell aktiviert nur eine vollständige atomare lokale Generation', async () => {
  const worker = await readFile(new URL('service-worker.js', root), 'utf8');
  const eventCatalog = JSON.parse(await readFile(new URL('data/event-catalog.json', root), 'utf8'));
  const biographyCatalog = JSON.parse(await readFile(new URL('data/biography-catalog.json', root), 'utf8'));
  assert.equal(eventCatalog.length, 25);
  assert.equal(biographyCatalog.files.length, 3);
  assert.match(worker, /atlas-local-v2\.9\.0-rc2-r11/);
  const coreMatch = worker.match(/const CORE_RESOURCES = \[([\s\S]*?)\];/);
  assert.ok(coreMatch, 'CORE_RESOURCES muss für die Offline-Generation deklarativ bleiben');
  const coreResources = [...coreMatch[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
  const digest = createHash('sha256');
  for (const resource of coreResources) {
    const normalizedPath = resource === './' ? 'index.html' : resource.replace(/^\.\//, '');
    const content = (await readFile(new URL(normalizedPath, root), 'utf8')).replace(/\r\n/g, '\n');
    digest.update(`${resource}\0${content}\0`);
  }
  assert.equal(
    digest.digest('hex'),
    'a5cabb165c7c2c430891e0ee5b89f25962ffed82bf7cdf42cc3ae82198240d14',
    'Vorab gecachte Kernressourcen haben sich geändert: CACHE_VERSION erhöhen und den geprüften Generations-Digest aktualisieren.'
  );
  assert.match(worker, /STAGING_CACHE/);
  assert.match(worker, /MANIFEST_URL/);
  assert.match(worker, /catalogFileUrls\(eventCatalog\)/);
  assert.match(worker, /catalogFileUrls\(biographyCatalog, 'files'\)/);
  for (const resource of ['event-catalog.json', 'biography-catalog.json', 'archive-contract.json', 'event-metadata.json', 'event-editorial-overrides.json', 'routes.json', 'map-taxonomy.json', 'relations.json']) {
    assert.match(worker, new RegExp(resource.replaceAll('.', '\\.')));
  }
  assert.match(worker, /verifyGeneration\(staging, resources\)/);
  assert.match(worker, /verifyGeneration\(finalCache, \[\.\.\.resources, MANIFEST_URL\]\)/);
  assert.doesNotMatch(worker, /Promise\.allSettled|cacheIfAvailable/);
  assert.match(worker, /fetch\(request, \{ cache: 'no-cache', signal: controller\.signal \}\)/);
  assert.match(worker, /controller\.abort\(\), 500/);
  assert.match(worker, /cache\.match\(fallbackUrl\)/);
  assert.match(worker, /url\.origin !== self\.location\.origin/);
  assert.doesNotMatch(worker, /https:\/\/(?:api\.maptiler|tiles|carto|wikimedia)/i);
  assert.ok(worker.indexOf('await verifyGeneration(cache') < worker.indexOf("keys.filter(key => key.startsWith('atlas-local-')"));
});

test('Fehlerhafte lokale Datenladung endet in einem sichtbaren, lokalisierten Zustand', async () => {
  const script = await readFile(new URL('script.js', root), 'utf8');
  const translations = await readFile(new URL('src/i18n.js', root), 'utf8');
  assert.match(script, /LOCAL_DATA_TIMEOUT_MS = 8000/);
  assert.match(script, /function showArchiveLoadFailure\(\)/);
  assert.match(script, /ui\.resultCount\.textContent = i18n\.t\('archiveLoadFailed'\)/);
  assert.match(script, /setDataStatus\(i18n\.t\('archiveLoadFailed'\), 'error'\)/);
  assert.equal((translations.match(/archiveLoadFailed:/g) || []).length, 9);
  assert.equal((translations.match(/archiveLoadFailedBody:/g) || []).length, 9);
});

test('Biografien und Routen werden auch nach einem Sprachwechsel digestgebunden neu lokalisiert', async () => {
  const script = await readFile(new URL('script.js', root), 'utf8');
  const biographies = await readFile(new URL('src/biography-core.js', root), 'utf8');
  assert.match(script, /app\.routes = localizeRoutes\(app\.routeSources\)/);
  assert.match(script, /app\.biographies = localizeBiographies\(app\.biographySources\)/);
  assert.match(script, /localizeTranslatedRecord\(route, i18n\.language, ROUTE_TRANSLATION_FIELDS\)/);
  assert.match(biographies, /localizeTranslatedRecord\(row, defaults\.language \|\| 'de', BIOGRAPHY_TRANSLATION_FIELDS\)/);
});

test('Remote-Daten und -Bilder sind im RC standardmäßig deaktiviert', async () => {
  const script = await readFile(new URL('script.js', root), 'utf8');
  const config = await readFile(new URL('src/atlas-config.js', root), 'utf8');
  assert.match(config, /useSupabase: parseBoolean\([^\n]+, false\)/);
  assert.match(script, /SUPABASE_SDK_INTEGRITY/);
  assert.match(script, /if \(!runtimeConfig\.useSupabase\)/);
  assert.doesNotMatch(script, /upload\.wikimedia\.org|wikipedia\.org/);
});

test('Design berücksichtigt reduzierte Bewegung und mobile Ansichten', async () => {
  const css = await readFile(new URL('styles.css', root), 'utf8');
  const script = await readFile(new URL('script.js', root), 'utf8');
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /@media \(max-width: 820px\)/);
  assert.match(css, /data-map-style="mono"/);
  assert.match(css, /data-map-style="paper"/);
  assert.match(css, /event-approximate-rings|precision-sample\.is-approximate/);
  assert.match(css, /grid-template-columns: repeat\(auto-fit, minmax\(50px, 1fr\)\)/);
  assert.match(css, /\.nav-button \{ min-width: 0; width: 100%;/);
  for (const token of ['--atlas-green', '--atlas-gold', '--atlas-coral', '--atlas-violet', '--atlas-teal']) assert.match(css, new RegExp(token));
  assert.match(css, /\.nav-button\[data-panel="biographies"\]/);
  assert.match(css, /html\[data-map-style="mono"\].*background: #000/s);
  assert.match(css, /html\[data-map-style="paper"\]/);
  assert.match(css, /html\[data-map-style="paper"\] \{[\s\S]*--atlas-teal: #075c58/);
  assert.match(css, /--paper-focus: #563400/);
  assert.match(css, /html\[data-map-style="mono"\] \{[\s\S]*--atlas-green: #fff/);
  assert.match(css, /html\[data-map-style="mono"\] \.app-shell \{ filter: grayscale\(1\); \}/);
  assert.match(css, /network-edge\.is-shared-movement/);
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*min-height: 44px/);
  assert.match(script, /event-point-halos/);
  assert.match(script, /sensitive: isSensitiveEvent\(event\)/);
  assert.match(script, /sensitive \? '○' : isMaritimeEvent\(event\) \? '≈' : '✦'/);
  assert.match(script, /event-maritime-rings/);
  assert.match(script, /maritime-route-guides/);
  assert.match(script, /biographyVisualAccent\(bio\.id\)/);
});

test('Quellenprüfung trennt definitive Fehler von Netzwerkunsicherheit', async () => {
  const sourceCheck = await readFile(new URL('scripts/check-sources.mjs', root), 'utf8');
  assert.match(sourceCheck, /const unresolved = \[\]/);
  assert.match(sourceCheck, /401, 403, 405, 429/);
  assert.match(sourceCheck, /UNENTSCHIEDEN/);
  assert.match(sourceCheck, /if \(failures\.length\) process\.exitCode = 1/);
  assert.match(sourceCheck, /biography-catalog\.json/);
});
