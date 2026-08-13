import { readFile } from 'node:fs/promises';
import { isValidEvent, normalizeEvent, validateEditorialFields } from '../src/game-core.js';

const catalog = JSON.parse(await readFile('data/event-catalog.json', 'utf8'));
if (!Array.isArray(catalog) || !catalog.length) throw new Error('event-catalog.json muss eine nichtleere Liste sein.');

const ids = new Set();
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
    activeCount += 1;
    if (!/^https:\/\//.test(event.sourceUrl)) throw new Error(`${label}: sourceUrl muss HTTPS verwenden.`);
    try { new URL(event.sourceUrl); } catch { throw new Error(`${label}: sourceUrl ist keine gültige URL.`); }
  });
}

console.log(`${catalog.length} Datendateien, ${activeCount} aktive eindeutige Ereignisse und alle optionalen Redaktionsfelder validiert.`);
