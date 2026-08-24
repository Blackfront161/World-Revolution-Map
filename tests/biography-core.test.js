import test from 'node:test';
import assert from 'node:assert/strict';
import { filterBiographies, normalizeBiography, validateBiography } from '../src/biography-core.js';
import { normalizeSearchText } from '../src/game-core.js';

const raw = {
  id: 'bio-example-person',
  name: 'Example Person',
  birthYear: 1900,
  deathYear: 1980,
  regions: ['Québec'],
  communities: ['Community'],
  traditions: ['Libertärer Sozialismus'],
  summary: 'Eine belegte Kurzbiografie.',
  lifePhases: [{ id: 'phase-one', title: 'Organisierung', period: '1920–1940', description: 'Aufbau lokaler Strukturen.' }],
  ideasAndPractice: ['Selbstverwaltung'],
  organizingAndAchievements: ['Organisation'],
  repressionAndRisks: ['Überwachung'],
  tensionsAndCriticism: ['Dokumentierte Spannung'],
  legacy: 'Ein widersprüchliches Vermächtnis.',
  relatedEventIds: ['event-one'],
  reviewStatus: 'Redaktionell vertieft',
  sensitivity: { level: 'contextual', displayRule: 'Sachlich und ohne spielerische Belohnung darstellen.' },
  provenance: { method: 'Redaktionelle Synthese der aufgeführten Quellen.', checkedAt: '2026-08-24', quotationPolicy: 'Keine direkten Zitate.' },
  license: 'Redaktioneller Text: CC BY 4.0; Quellenrechte verbleiben bei den Herausgebern.',
  sources: [
    { url: 'https://archive.example/a', publisher: 'Archive', language: 'en', type: 'archive', accessedAt: '2026-08-24' },
    { url: 'https://museum.example/b', publisher: 'Museum', language: 'fr', type: 'museum', accessedAt: '2026-08-24' }
  ]
};

test('normalisiert und validiert eigenständige Biografien ohne Koordinaten', () => {
  const bio = normalizeBiography(raw);
  assert.equal(bio.id, raw.id);
  assert.deepEqual(validateBiography(raw, new Set(['event-one'])), []);
  assert.ok(validateBiography({ ...raw, latitude: 1 }, new Set(['event-one'])).some(issue => issue.includes('Koordinaten')));
  assert.ok(validateBiography({ ...raw, sources: raw.sources.slice(0, 1) }, new Set(['event-one'])).some(issue => issue.includes('zwei Quellen')));
  assert.ok(validateBiography({ ...raw, quotes: ['unbelegt'] }, new Set(['event-one'])).some(issue => issue.includes('Zitatfelder')));
});

test('filtert Lebenswege tolerant nach Region, Tradition und Zeitraum', () => {
  const bio = normalizeBiography(raw);
  assert.equal(filterBiographies([bio], { query: 'quebec', region: 'Québec', tradition: 'Libertärer Sozialismus', from: 1910, to: 1920 }, normalizeSearchText).length, 1);
  assert.equal(filterBiographies([bio], { from: 1981, to: 2000 }, normalizeSearchText).length, 0);
});
