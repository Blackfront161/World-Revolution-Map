import { readFile } from 'node:fs/promises';
import {
  EVENT_ID_PATTERN,
  isValidEvent,
  normalizeEvent,
  validateContractFields,
  validateEditorialFields,
  validateMapTaxonomy,
  validateRelations,
  validateRoutes
} from '../src/game-core.js';
import { BIOGRAPHY_ID_PATTERN, normalizeBiography, validateBiography } from '../src/biography-core.js';

const catalog = JSON.parse(await readFile('data/event-catalog.json', 'utf8'));
if (!Array.isArray(catalog) || !catalog.length) throw new Error('event-catalog.json muss eine nichtleere Liste sein.');
const contract = JSON.parse(await readFile('data/archive-contract.json', 'utf8'));
const metadata = JSON.parse(await readFile('data/event-metadata.json', 'utf8'));
const precisionById = new Map((metadata.events || []).map(row => [row.id, row.coordinatePrecision]));
const rawCoordinateFields = ['coordinates', 'longitude', 'latitude', 'lng', 'lat'];

const ids = new Set();
const rawById = new Map();
let activeCount = 0;
for (const filename of catalog) {
  if (typeof filename !== 'string' || !/^[a-z0-9-]+\.json$/i.test(filename)) throw new Error(`Ungültiger Katalogpfad: ${filename}`);
  const rows = JSON.parse(await readFile(`data/${filename}`, 'utf8'));
  if (!Array.isArray(rows)) throw new Error(`${filename} muss eine JSON-Liste enthalten.`);
  rows.forEach((row, index) => {
    const label = `${filename}[${index}]`;
    const editorialIssues = validateEditorialFields(row);
    if (editorialIssues.length) throw new Error(`${label}: ${editorialIssues.join('; ')}`);
    if (row.archived) return;
    const coordinatePrecision = precisionById.get(row.id) || row.coordinatePrecision || '';
    if (coordinatePrecision === 'hidden' && rawCoordinateFields.some(field => field in row)) {
      throw new Error(`${label}: hidden-Ereignisse dürfen keine Rohkoordinaten enthalten.`);
    }
    const event = normalizeEvent({ ...row, coordinatePrecision }, index);
    if (!isValidEvent(event)) throw new Error(`${label}: ungültige Koordinaten.`);
    if (!event.id || ids.has(event.id)) throw new Error(`${label}: fehlende oder doppelte ID ${event.id}.`);
    ids.add(event.id);
    rawById.set(event.id, row);
    activeCount += 1;
    if (!/^https:\/\//.test(event.sourceUrl)) throw new Error(`${label}: sourceUrl muss HTTPS verwenden.`);
    try { new URL(event.sourceUrl); } catch { throw new Error(`${label}: sourceUrl ist keine gültige URL.`); }
  });
}

if (contract.schemaVersion !== 1) throw new Error('archive-contract.json: nicht unterstützte schemaVersion.');
if (!contract.idPolicy || contract.idPolicy.pattern !== EVENT_ID_PATTERN.source) throw new Error('archive-contract.json: ID-Policy stimmt nicht mit der Laufzeit überein.');
if (!contract.provenance?.method || !contract.provenance?.sourcePolicy) throw new Error('archive-contract.json: Provenance-Policy fehlt.');
for (const field of ['code', 'data', 'images', 'mapData', 'notice']) {
  if (!contract.license?.[field]) throw new Error(`archive-contract.json: license.${field} fehlt.`);
}
if (!contract.mapModel?.hiddenCoordinateRule || contract.mapModel.layerMode !== 'multi-select-or') throw new Error('archive-contract.json: Kartenmodell fehlt.');

if (metadata.schemaVersion !== contract.schemaVersion || !Array.isArray(metadata.events)) throw new Error('event-metadata.json: ungültige Struktur.');
const metadataIds = new Set();
const allAliases = new Map();
for (const [index, row] of metadata.events.entries()) {
  const label = `event-metadata.json[${index}]`;
  const issues = validateContractFields(row);
  if (issues.length) throw new Error(`${label}: ${issues.join('; ')}`);
  if (!ids.has(row.id)) throw new Error(`${label}: unbekannte Event-ID ${row.id}.`);
  if (metadataIds.has(row.id)) throw new Error(`${label}: doppelte Event-ID ${row.id}.`);
  metadataIds.add(row.id);
  for (const alias of row.aliases || []) {
    if (ids.has(alias) || allAliases.has(alias)) throw new Error(`${label}: kollidierende Alias-ID ${alias}.`);
    allAliases.set(alias, row.id);
  }
}

const sensitiveEvents = [...rawById.values()].filter(row => row.sensitivity && !['Niedrig', 'Nein', 'Keine'].includes(row.sensitivity));
for (const row of sensitiveEvents) {
  const meta = metadata.events.find(item => item.id === row.id);
  if (!meta?.coordinatePrecision) throw new Error(`${row.id}: sensible Koordinate ist nicht klassifiziert.`);
  if (row.coordinatePrecision && row.coordinatePrecision !== meta.coordinatePrecision) throw new Error(`${row.id}: Koordinatenklassifikation widerspricht dem Ereignisdatensatz.`);
}
const baselineSensitiveIds = contract.sensitivityPolicy?.baselineSensitiveIds;
if (!Array.isArray(baselineSensitiveIds) || !baselineSensitiveIds.length || new Set(baselineSensitiveIds).size !== baselineSensitiveIds.length) throw new Error('archive-contract.json: sensible Baseline fehlt oder ist doppelt.');
for (const id of baselineSensitiveIds) {
  const row = rawById.get(id);
  if (!row?.sensitivity) throw new Error(`${id}: sensible Baseline ist nicht mehr als sensibel gekennzeichnet.`);
  if (!metadataIds.has(id)) throw new Error(`${id}: sensible Baseline hat keine Koordinatenklassifikation.`);
}

const overrides = JSON.parse(await readFile('data/event-editorial-overrides.json', 'utf8'));
if (overrides.schemaVersion !== contract.schemaVersion || !overrides.events || Array.isArray(overrides.events)) throw new Error('event-editorial-overrides.json: ungültige Struktur.');
let deepenedCount = 0;
for (const [id, row] of Object.entries(overrides.events)) {
  const label = `event-editorial-overrides.json.${id}`;
  if (!ids.has(id)) throw new Error(`${label}: unbekannte Event-ID.`);
  const issues = validateEditorialFields({ ...row, id });
  if (issues.length) throw new Error(`${label}: ${issues.join('; ')}`);
  const required = ['demands', 'participants', 'powerStructures', 'tactics', 'immediateConsequences', 'longTermImpact', 'repression', 'humanCosts', 'aftermath', 'openQuestions', 'sourceType', 'sourceQuality', 'uncertainty', 'sensitivity', 'reviewStatus', 'provenance', 'license'];
  for (const field of required) if (!row[field] || (Array.isArray(row[field]) && !row[field].length)) throw new Error(`${label}: ${field} fehlt.`);
  if (row.reviewStatus !== 'Redaktionell vertieft') throw new Error(`${label}: reviewStatus muss Redaktionell vertieft sein.`);
  if (!row.provenance.sourceUrls.includes(row.sourceUrl)) throw new Error(`${label}: sourceUrl fehlt in provenance.sourceUrls.`);
  if (!metadataIds.has(id)) throw new Error(`${label}: coordinatePrecision fehlt in event-metadata.json.`);
  deepenedCount += 1;
}
if (deepenedCount < 20 || deepenedCount > 25) throw new Error(`Redaktionsrunde muss 20–25 Ereignisse enthalten; gefunden: ${deepenedCount}.`);

const routes = JSON.parse(await readFile('data/routes.json', 'utf8'));
if (routes.schemaVersion !== contract.schemaVersion) throw new Error('routes.json: schemaVersion stimmt nicht.');
const routeIssues = validateRoutes(routes, ids);
if (routeIssues.length) throw new Error(routeIssues.join('; '));

const taxonomy = JSON.parse(await readFile('data/map-taxonomy.json', 'utf8'));
if (taxonomy.schemaVersion !== contract.schemaVersion) throw new Error('map-taxonomy.json: schemaVersion stimmt nicht.');
const taxonomyIssues = validateMapTaxonomy(taxonomy);
if (taxonomyIssues.length) throw new Error(taxonomyIssues.join('; '));
if (taxonomy.layers.length !== 10 || taxonomy.tactics.length !== 10 || taxonomy.mapStyles.length !== 3) throw new Error('map-taxonomy.json: erwartet werden 10 Layer, 10 Taktiken und 3 Kartenstile.');

const relations = JSON.parse(await readFile('data/relations.json', 'utf8'));
if (relations.schemaVersion !== contract.schemaVersion) throw new Error('relations.json: schemaVersion stimmt nicht.');
const relationIssues = validateRelations(relations, ids, new Set(routes.routes.map(route => route.id)));
if (relationIssues.length) throw new Error(relationIssues.join('; '));
if (relations.relations.length < 20) throw new Error('relations.json: mindestens 20 kuratierte Beziehungen erforderlich.');

const biographyContract = contract.biographyModel;
if (!biographyContract || biographyContract.idPattern !== BIOGRAPHY_ID_PATTERN.source || biographyContract.minimumHttpsSources !== 2) throw new Error('archive-contract.json: Biografiemodell fehlt oder ist inkonsistent.');
const biographyCatalog = JSON.parse(await readFile('data/biography-catalog.json', 'utf8'));
if (biographyCatalog.schemaVersion !== contract.schemaVersion || !Array.isArray(biographyCatalog.files) || biographyCatalog.files.length !== 3) throw new Error('biography-catalog.json: ungültige Struktur.');
const biographyIds = new Set();
let biographyCount = 0;
let biographySourceCount = 0;
for (const entry of biographyCatalog.files) {
  if (!entry || typeof entry !== 'object' || !/^[a-z0-9-]+\.json$/i.test(entry.file) || typeof entry.defaultTradition !== 'string' || !entry.defaultTradition.trim()) throw new Error('biography-catalog.json: ungültiger Katalogeintrag.');
  const rows = JSON.parse(await readFile(`data/${entry.file}`, 'utf8'));
  if (!Array.isArray(rows)) throw new Error(`${entry.file}: Biografiedatei muss eine Liste sein.`);
  rows.forEach((row, index) => {
    const issues = validateBiography(row, ids, entry);
    if (issues.length) throw new Error(`${entry.file}[${index}]: ${issues.join('; ')}`);
    const bio = normalizeBiography(row, entry);
    if (biographyIds.has(bio.id)) throw new Error(`${entry.file}[${index}]: doppelte Biografie-ID ${bio.id}`);
    biographyIds.add(bio.id);
    biographyCount += 1;
    biographySourceCount += bio.sources.length;
  });
}

console.log(`${catalog.length} Ereignisdateien, ${activeCount} aktive Ereignisse, ${deepenedCount} Vertiefungen, ${metadataIds.size} Koordinatenklassifikationen, ${biographyCount} Biografien mit ${biographySourceCount} Quellen in ${biographyCatalog.files.length} Biografiedateien, ${routes.routes.length} Routen, ${taxonomy.layers.length} Layer, ${taxonomy.tactics.length} Taktiken, ${relations.relations.length} Beziehungen und ${taxonomy.mapStyles.length} Kartenstile validiert.`);
