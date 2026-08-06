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
});

test('Fallback-Archiv enthält valide, eindeutige und belegte Ereignisse', async () => {
  const files = ['data/fallback-events.json', 'data/movement-events.json', 'data/historical-resistance-events.json'];
  const allRows = (await Promise.all(files.map(file => readFile(new URL(file, root), 'utf8')))).flatMap(JSON.parse);
  assert.equal(allRows.filter(event => event.category === 'Tiefe Geschichte').length, 0);
  const rows = allRows.filter(row => !row.archived);
  const events = rows.map(normalizeEvent);
  assert.equal(events.length, 160);
  assert.equal(new Set(events.map(event => event.id)).size, events.length);
  assert.ok(events.every(isValidEvent));
  assert.ok(events.every(event => event.sourceUrl.startsWith('https://')));
  assert.ok(new Set(events.map(event => event.continent)).size >= 6);
  assert.ok(new Set(events.flatMap(event => [event.category, ...event.tags])).size >= 18);
  assert.equal(events.filter(event => event.category === 'Tiefe Geschichte').length, 0);
  assert.equal(Math.min(...events.map(event => event.yearStart)), -1157);
  assert.ok(events.filter(event => event.yearStart < 1500).length >= 18);
});

test('Datenbankinhalte werden nicht über innerHTML in die Seite geschrieben', async () => {
  const script = await readFile(new URL('script.js', root), 'utf8');
  assert.doesNotMatch(script, /\.innerHTML\s*=/);
  assert.match(script, /setDOMContent/);
  assert.match(script, /sanitizeProgress/);
  assert.match(script, /safeWikipediaApiUrl/);
});

test('Design berücksichtigt reduzierte Bewegung und mobile Ansichten', async () => {
  const css = await readFile(new URL('styles.css', root), 'utf8');
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /@media \(max-width: 820px\)/);
});
