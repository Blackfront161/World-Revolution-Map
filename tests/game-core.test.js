import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMission,
  createQuiz,
  filterEvents,
  formatYearRange,
  isValidEvent,
  levelFromXp,
  levelProgress,
  normalizeEvent,
  seededShuffle
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
