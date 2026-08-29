import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import { isValidEvent, normalizeEvent } from '../src/game-core.js';

const root = new URL('../', import.meta.url);

function paeth(left, up, upperLeft) {
  const prediction = left + up - upperLeft;
  const leftDistance = Math.abs(prediction - left);
  const upDistance = Math.abs(prediction - up);
  const upperLeftDistance = Math.abs(prediction - upperLeft);
  return leftDistance <= upDistance && leftDistance <= upperLeftDistance ? left : upDistance <= upperLeftDistance ? up : upperLeft;
}

function decodeRgbaPng(bytes) {
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const bitDepth = bytes[24];
  const colorType = bytes[25];
  assert.equal(bitDepth, 8, 'Produktions-PNG muss 8 Bit pro Kanal verwenden');
  assert.equal(colorType, 6, 'Produktions-PNG muss echtes RGBA statt RGB verwenden');
  const idat = [];
  for (let offset = 8; offset + 12 <= bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString('ascii');
    if (type === 'IDAT') idat.push(bytes.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
    if (type === 'IEND') break;
  }
  const encoded = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const pixels = Buffer.alloc(stride * height);
  let sourceOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = encoded[sourceOffset++];
    for (let x = 0; x < stride; x += 1) {
      const raw = encoded[sourceOffset++];
      const left = x >= 4 ? pixels[y * stride + x - 4] : 0;
      const up = y ? pixels[(y - 1) * stride + x] : 0;
      const upperLeft = y && x >= 4 ? pixels[(y - 1) * stride + x - 4] : 0;
      const value = filter === 0 ? raw
        : filter === 1 ? raw + left
          : filter === 2 ? raw + up
            : filter === 3 ? raw + Math.floor((left + up) / 2)
              : filter === 4 ? raw + paeth(left, up, upperLeft)
                : NaN;
      assert.ok(Number.isFinite(value), `Unbekannter PNG-Filter ${filter}`);
      pixels[y * stride + x] = value & 255;
    }
  }
  return { width, height, pixels };
}

test('Globus verwendet gepinnte Runtime, lokale Steuerung und keine Terrainquelle', async () => {
  const html = await readFile(new URL('index.html',root),'utf8');
  const script = await readFile(new URL('script.js',root),'utf8');
  const notices = await readFile(new URL('THIRD_PARTY_NOTICES.md',root),'utf8');
  assert.equal((html.match(/maplibre-gl@5\.24\.0\/dist\/maplibre-gl\./g)||[]).length,2);
  assert.match(html,/id="map-projection-select"[^>]*aria-describedby="globe-note"/);
  assert.match(notices,/MapLibre GL JS 5\.24\.0/);
  assert.match(script,/setProjection\(\{ type: requested \}\)/);
  assert.match(script,/app\.projection !== 'globe'/);
  assert.doesNotMatch(script,/setTerrain\(|raster-dem|api\.maptiler\.com/);
});

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

test('Produktname und lokale Markenassets bleiben über Shell und Simulator konsistent', async () => {
  const [html, manifestText, simulator, icon, embedding, readme, wideSvg, markSvg, wideBytes, markBytes] = await Promise.all([
    readFile(new URL('index.html', root), 'utf8'),
    readFile(new URL('manifest.webmanifest', root), 'utf8'),
    readFile(new URL('mobile-simulator.html', root), 'utf8'),
    readFile(new URL('icons/atlas-icon.svg', root), 'utf8'),
    readFile(new URL('docs/embedding.md', root), 'utf8'),
    readFile(new URL('README.md', root), 'utf8'),
    readFile(new URL('assets/brand/world-revolution-atlas-logo-v1.svg', root), 'utf8'),
    readFile(new URL('assets/brand/world-revolution-atlas-mark-v1.svg', root), 'utf8'),
    readFile(new URL('assets/brand/world-revolution-atlas-logo-v1.png', root)),
    readFile(new URL('assets/brand/world-revolution-atlas-mark-v1.png', root))
  ]);
  const manifest = JSON.parse(manifestText);
  assert.equal(manifest.name, 'World Revolution Atlas');
  for (const text of [html, simulator, icon, embedding, readme]) assert.match(text, /World Revolution Atlas/);
  const suppliedLogo = await readFile(new URL('assets/brand/world-revolution-atlas-user-v1.png', root));
  assert.equal(createHash('sha256').update(suppliedLogo).digest('hex'), '0235c9cea2a9e9df1efac281e463000a3649c59f31a4c6865d1d1de92dab138d', 'Das bereitgestellte Logo muss bytegleich erhalten bleiben');
  assert.equal(suppliedLogo.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(suppliedLogo.readUInt32BE(16), 1254);
  assert.equal(suppliedLogo.readUInt32BE(20), 1254);
  assert.equal(suppliedLogo[25], 2, 'RGB-Original: keine erfundene Transparenzbehauptung');
  const parchmentLogo = await readFile(new URL('assets/brand/world-revolution-atlas-parchment-v2.png', root));
  assert.equal(createHash('sha256').update(parchmentLogo).digest('hex'), '8ebe0eec9b4faceb7995506714b12eda14c9bdc268d63a3a27635f603b52f1db');
  assert.equal(parchmentLogo.readUInt32BE(16), 1254);
  assert.equal(parchmentLogo.readUInt32BE(20), 1254);
  assert.match(html, /id="brand-open"[^>]*aria-haspopup="dialog"[^>]*aria-controls="welcome-modal"/);
  assert.equal((html.match(/<img class="brand-logo"[^>]+src="assets\/brand\/world-revolution-atlas-parchment-v2\.png"[^>]+alt=""[^>]+width="1254" height="1254"/g) || []).length, 2);
  assert.match(html, /<figcaption>World Revolution Atlas<\/figcaption>/);
  assert.match(html, /rel="icon" href="assets\/brand\/world-revolution-atlas-parchment-v2\.png"/);
  assert.doesNotMatch(html + manifestText, /world-revolution-atlas-(?:logo|mark)-v1\./);
  assert.deepEqual(manifest.icons, [{ src: 'assets/brand/world-revolution-atlas-parchment-v2.png', sizes: '1254x1254', type: 'image/png', purpose: 'any' }]);
  // Retained draft files are no longer active; keep their existing format checks.
  for (const svg of [wideSvg, markSvg]) {
    assert.match(svg, /<svg[^>]+viewBox=/);
    assert.match(svg, /<title id="title">World Revolution Atlas<\/title>/);
    assert.doesNotMatch(svg, /<(?:image|foreignObject)\b|(?:href|xlink:href)=/i);
    assert.doesNotMatch(svg, /<rect\b/i, 'Markenquelle darf keine eingebrannte Hintergrundplatte enthalten');
  }
  assert.match(wideSvg, />WORLD REVOLUTION ATLAS<\/text>/);
  const assets = [
    { name: 'Wortmarke', decoded: decodeRgbaPng(wideBytes), expected: [1200, 400] },
    { name: 'Signet', decoded: decodeRgbaPng(markBytes), expected: [512, 512] }
  ];
  for (const { name, decoded, expected } of assets) {
    assert.deepEqual([decoded.width, decoded.height], expected);
    let transparent = 0;
    let opaque = 0;
    let cyan = 0;
    let red = 0;
    let white = 0;
    for (let y = 0; y < decoded.height; y += 1) {
      for (let x = 0; x < decoded.width; x += 1) {
        const offset = (y * decoded.width + x) * 4;
        const [r, g, b, a] = decoded.pixels.subarray(offset, offset + 4);
        if (a === 0) transparent += 1;
        if (a >= 220) {
          opaque += 1;
          if (r < 80 && g > 170 && b > 190) cyan += 1;
          if (r > 210 && g < 120 && b < 140) red += 1;
          if (r > 225 && g > 225 && b > 225) white += 1;
        }
        if (x < 8 || y < 8 || x >= decoded.width - 8 || y >= decoded.height - 8) assert.equal(a, 0, `${name}: Außenbereich muss transparent und frei von Schachbrettflächen sein`);
      }
    }
    assert.ok(transparent > decoded.width * decoded.height * .2, `${name}: zu wenig transparente Fläche`);
    assert.ok(opaque > 1000 && cyan > 100 && red > 100 && white > 100, `${name}: erwartete Cyan-/Rot-/Weiß-Vektormarke fehlt`);
  }
});

test('Nutzerlogo sitzt unbeschnitten in einer tastaturbedienbaren Archivplakette', async () => {
  const [css, script, server] = await Promise.all(['styles.css', 'script.js', 'scripts/serve.mjs'].map(path => readFile(new URL(path, root), 'utf8')));
  assert.match(css, /\.brand-logo\s*\{[^}]*object-fit:\s*contain/);
  assert.match(css, /\.brand-frontispiece\s*\{[^}]*border:\s*3px double/);
  assert.match(css, /\.brand-visual:focus-visible/);
  assert.match(script, /ui\.brandOpen\.addEventListener\('click', \(\) => openModal\(ui\.welcomeModal\)\)/);
  assert.match(server, /'\.png': 'image\/png'/);
  assert.match(server, /'\.webmanifest': 'application\/manifest\+json'/);
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
  assert.equal(contract.visualMediaModel.eventField, 'visualMedia');
  assert.equal(contract.visualMediaModel.reviewStatus, 'rights-reviewed');
  assert.deepEqual(contract.visualMediaModel.allowedAssetHosts, ['upload.wikimedia.org']);
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
  assert.match(worker, /atlas-local-v2\.9\.0-rc2-r23/);
  const coreMatch = worker.match(/const CORE_RESOURCES = \[([\s\S]*?)\];/);
  assert.ok(coreMatch, 'CORE_RESOURCES muss für die Offline-Generation deklarativ bleiben');
  const coreResources = [...coreMatch[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
  const digest = createHash('sha256');
  for (const resource of coreResources) {
    const normalizedPath = resource === './' ? 'index.html' : resource.replace(/^\.\//, '');
    const bytes = await readFile(new URL(normalizedPath, root));
    const isText = /\.(?:css|html|js|json|mjs|svg|webmanifest)$/i.test(normalizedPath);
    const content = isText ? Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n')) : bytes;
    digest.update(`${resource}\0`);
    digest.update(content);
    digest.update('\0');
  }
  assert.equal(
    digest.digest('hex'),
    'abd408ca17e38c177d156e5c06f43bfaeab66baf279890f08e75a300f0dfb522',
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
  assert.match(worker, /function navigationFallbackUrl\(url\)/);
  assert.match(worker, /endsWith\('\/mobile-simulator\.html'\) \? '\.\/mobile-simulator\.html' : '\.\/index\.html'/);
  assert.match(worker, /request\.mode === 'navigate' \? navigationFallbackUrl\(url\) : request/);
  assert.match(worker, /url\.origin !== self\.location\.origin/);
  assert.doesNotMatch(worker, /https:\/\/(?:api\.maptiler|tiles|carto|wikimedia)/i);
  for (const resource of ['world-revolution-atlas-parchment-v2.png', 'src/map-focus.js']) assert.match(worker, new RegExp(resource.replaceAll('.', '\\.')));
  assert.doesNotMatch(worker, /world-revolution-atlas-(?:logo|mark)-v1\./);
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

test('Remote-Daten und ungeprüfte Bilder sind standardmäßig deaktiviert', async () => {
  const script = await readFile(new URL('script.js', root), 'utf8');
  const config = await readFile(new URL('src/atlas-config.js', root), 'utf8');
  const focus = await readFile(new URL('src/map-focus.js', root), 'utf8');
  assert.match(config, /useSupabase: parseBoolean\([^\n]+, false\)/);
  assert.match(script, /SUPABASE_SDK_INTEGRITY/);
  assert.match(script, /if \(!runtimeConfig\.useSupabase\)/);
  assert.doesNotMatch(script, /upload\.wikimedia\.org|wikipedia\.org/);
  assert.match(focus, /reviewStatus !== 'rights-reviewed'/);
  assert.match(focus, /upload\.wikimedia\.org/);
  assert.match(focus, /commons\.wikimedia\.org/);
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
  assert.match(script, /selected-event-halo/);
  assert.match(script, /selected-event-symbol/);
  assert.match(script, /function clearSelectedEvent/);
  assert.match(script, /if \(!app\.popupReplacing\) clearSelectedEvent\(event\.id\)/);
  assert.match(css, /\.event-focus-active \.map-vignette/);
  assert.match(css, /\.map-focus-card\.is-sensitive/);
  assert.match(css, /prefers-reduced-motion[\s\S]*\.map-focus-card/);
  assert.match(script, /biographyVisualAccent\(bio\.id\)/);
});

test('Mobile Oberfläche wahrt Navigation, Safe Areas, Typografie und Bottom-Sheet-Vertrag', async () => {
  const [html, css, script, translations, simulator, worker] = await Promise.all([
    readFile(new URL('index.html', root), 'utf8'),
    readFile(new URL('styles.css', root), 'utf8'),
    readFile(new URL('script.js', root), 'utf8'),
    readFile(new URL('src/i18n.js', root), 'utf8'),
    readFile(new URL('mobile-simulator.html', root), 'utf8'),
    readFile(new URL('service-worker.js', root), 'utf8')
  ]);
  assert.match(html, /width=device-width, initial-scale=1, viewport-fit=cover/);
  assert.equal((html.match(/class="mobile-nav-button/g) || []).length, 5);
  for (const action of ['map', 'filters', 'discover', 'saved', 'more']) assert.match(html, new RegExp(`data-mobile-action="${action}"`));
  assert.equal((html.match(/class="nav-button desktop-nav-button/g) || []).length, 11);
  assert.match(html, /id="mobile-more-drawer"[\s\S]*data-panel-target="biographies"[\s\S]*data-panel-target="quiz"/);
  assert.match(html, /id="mobile-show-results"/);
  assert.match(css, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /font-size: 16px/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /height: min\(38dvh, 360px\)/);
  assert.match(css, /data-sheet-state="expanded"/);
  assert.match(css, /min-width: 700px[\s\S]*orientation: landscape/);
  assert.match(css, /max-width: 820px\), \(max-width: 1000px\) and \(max-height: 520px\) and \(orientation: landscape\)/);
  assert.match(css, /summary\.maplibregl-ctrl-attrib-button[\s\S]*width: 44px !important;[\s\S]*height: 44px !important;/);
  assert.match(css, /\.mobile-nav-button \{[\s\S]*font-size: 12px;/);
  assert.match(css, /@media \(max-width: 360px\)[\s\S]*\.mobile-nav-button \{ font-size: 11px; line-height: 1\.15; \}/);
  assert.match(css, /@media \(max-width: 560px\)[\s\S]*\.brand-copy[\s\S]*clip-path: inset\(50%\)/);
  assert.match(css, /\.mobile-nav-button > span:last-child \{[\s\S]*overflow-wrap: normal;[\s\S]*white-space: nowrap;/);
  assert.match(css, /\.event-popup-meta \{[\s\S]*flex-wrap: wrap;/);
  assert.match(css, /\.drawer-header h2 \{ overflow-wrap: break-word; \}/);
  assert.match(css, /event-focus-active \.maplibregl-ctrl-top-right \{ right: 406px; \}/);
  assert.match(css, /min-width: 821px\) and \(max-width: 1319px\)[\s\S]*\.maplibregl-popup \{ bottom: 88px; \}/);
  assert.match(css, /min-width: 1320px[\s\S]*event-focus-active \.mission-card \{ right: 412px; \}/);
  assert.match(css, /min-width: 1320px[\s\S]*event-focus-active \.maplibregl-ctrl-top-right \{ right: 708px; \}/);
  assert.match(css, /\.event-sheet-actions \[data-sheet-action="expand"\],[\s\S]*\.event-sheet-actions \[data-sheet-action="collapse"\] \{ display: none; \}/);
  assert.match(script, /MOBILE_LAYOUT_QUERY/);
  assert.match(script, /closeButton: !mobilePopup/);
  assert.match(script, /updateEventSheetState\(content, 'collapse'\)/);
  assert.match(script, /setMobileNavigationState/);
  assert.equal((translations.match(/showFilteredEvents:/g) || []).length, 9);
  assert.equal((translations.match(/expandEventSheet:/g) || []).length, 9);
  assert.equal((translations.match(/collapseEventSheet:/g) || []).length, 9);
  assert.match(simulator, /iPhone SE · 320 × 568/);
  assert.match(simulator, /prefers-reduced-motion/);
  assert.match(worker, /'\.\/mobile-simulator\.html'/);
  assert.match(worker, /'\.\/src\/mobile-ui\.js'/);
});

test('Quellenprüfung trennt definitive Fehler von Netzwerkunsicherheit', async () => {
  const sourceCheck = await readFile(new URL('scripts/check-sources.mjs', root), 'utf8');
  assert.match(sourceCheck, /const unresolved = \[\]/);
  assert.match(sourceCheck, /401, 403, 405, 429/);
  assert.match(sourceCheck, /UNENTSCHIEDEN/);
  assert.match(sourceCheck, /if \(failures\.length\) process\.exitCode = 1/);
  assert.match(sourceCheck, /biography-catalog\.json/);
});
