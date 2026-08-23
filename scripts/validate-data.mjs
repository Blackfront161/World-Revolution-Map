import { readFile } from 'node:fs/promises';
import {
  EVENT_ID_PATTERN,
  isValidEvent,
  normalizeEvent,
  validateContractFields,
  validateEditorialFields,
  validateRoutes
} from '../src/game-core.js';

const catalog = JSON.parse(await readFile('data/event-catalog.json', 'utf8'));
if (!Array.isArray(catalog) || !catalog.length) throw new Error('event-catalog.json muss eine nichtleere Liste sein.');

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
    const event = normalizeEvent(row, index);
    if (!isValidEvent(event)) throw new Error(`${label}: ungültige Koordinaten.`);
    if (!event.id || ids.has(event.id)) throw new Error(`${label}: fehlende oder doppelte ID ${event.id}.`);
    ids.add(event.id);
    rawById.set(event.id, row);
    activeCount += 1;
    if (!/^https:\/\//.test(event.sourceUrl)) throw new Error(`${label}: sourceUrl muss HTTPS verwenden.`);
    try { new URL(event.sourceUrl); } catch { throw new Error(`${label}: sourceUrl ist keine gültige URL.`); }
  });
}

const contract = JSON.parse(await readFile('data/archive-contract.json', 'utf8'));
if (contract.schemaVersion !== 1) throw new Error('archive-contract.json: nicht unterstützte schemaVersion.');
if (!contract.idPolicy || contract.idPolicy.pattern !== EVENT_ID_PATTERN.source) throw new Error('archive-contract.json: ID-Policy stimmt nicht mit der Laufzeit überein.');
if (!contract.provenance?.method || !contract.provenance?.sourcePolicy) throw new Error('archive-contract.json: Provenance-Policy fehlt.');
for (const field of ['code', 'data', 'images', 'mapData', 'notice']) {
  if (!contract.license?.[field]) throw new Error(`archive-contract.json: license.${field} fehlt.`);
}

const metadata = JSON.parse(await readFile('data/event-metadata.json', 'utf8'));
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

const originallySensitive = [...rawById.values()].filter(row => row.sensitivity && !['Niedrig', 'Nein', 'Keine'].includes(row.sensitivity));
if (originallySensitive.length !== 53) throw new Error(`Erwartet wurden 53 bereits sensible Ereignisse, gefunden: ${originallySensitive.length}.`);
for (const row of originallySensitive) {
  const meta = metadata.events.find(item => item.id === row.id);
  if (!meta?.coordinatePrecision) throw new Error(`${row.id}: sensible Koordinate ist nicht klassifiziert.`);
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

console.log(`${catalog.length} Datendateien, ${activeCount} aktive Ereignisse, ${deepenedCount} Vertiefungen, ${metadataIds.size} Koordinatenklassifikationen und ${routes.routes.length} Routen validiert.`);
