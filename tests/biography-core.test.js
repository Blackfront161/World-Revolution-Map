import test from 'node:test';
import assert from 'node:assert/strict';
import { biographyYearLabel, filterBiographies, normalizeBiography, validateBiography } from '../src/biography-core.js';
import { normalizeSearchText, translationSourceDigest } from '../src/game-core.js';

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
  license: { status: 'rights-unclear', notice: 'Rechte werden noch geklärt.' },
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
  assert.ok(validateBiography({ ...raw, license: 'Redaktioneller Text: CC BY 4.0' }, new Set(['event-one'])).some(issue => issue.includes('Lizenzgeber')));
  assert.deepEqual(validateBiography({ ...raw, license: { status: 'CC BY 4.0', licensor: 'Example Editorial Collective', url: 'https://creativecommons.org/licenses/by/4.0/', scope: 'summary and editorial fields' } }, new Set(['event-one'])), []);
});

test('wendet nur digestgebundene reviewed-Biografieübersetzungen auf verschachtelte Pfade an', () => {
  const sourceDescription = 'Aufbau lokaler Strukturen.';
  const { summary: _summary, lifePhases: _lifePhases, ...catalogStyleRaw } = raw;
  const translated = {
    ...catalogStyleRaw,
    shortDescription: 'Eine deutsche Kurzbiografie.',
    lifeStages: [{ title: 'Organisierung', period: '1920–1940', description: sourceDescription }],
    translations: {
      en: {
        shortDescription: {
          text: 'An English short biography.', status: 'reviewed', sourceDigest: translationSourceDigest('Eine deutsche Kurzbiografie.'),
          reviewedAt: '2026-08-26', languageReviewer: 'Human EN Reviewer', factReviewer: 'Human Fact Reviewer', policyVersion: '1.0.0', machineAssisted: false
        },
        'lifeStages.0.description': {
          text: 'Building local structures.', status: 'reviewed', sourceDigest: translationSourceDigest(sourceDescription),
          reviewedAt: '2026-08-26', languageReviewer: 'Human EN Reviewer', factReviewer: 'Human Fact Reviewer', policyVersion: '1.0.0', machineAssisted: false
        }
      }
    }
  };
  const bio = normalizeBiography(translated, { language: 'en' });
  assert.equal(bio.summary, 'An English short biography.');
  assert.equal(bio.lifePhases[0].description, 'Building local structures.');
  translated.lifeStages[0].description = 'Geänderter Ausgangstext.';
  assert.equal(normalizeBiography(translated, { language: 'en' }).lifePhases[0].description, 'Geänderter Ausgangstext.');
});

test('Biografien verwerfen reviewed-markierte Zieltexte mit HTML, Bidi, Nicht-NFC, Placeholder- oder Formfehlern', () => {
  const cases = [
    ['HTML', 'Eine Kurzbiografie.', '<b>unsafe</b>'],
    ['Bidi', 'Eine Kurzbiografie.', 'Unsafe\u202E text'],
    ['NFC', 'Café-Biografie.', 'Cafe\u0301 biography'],
    ['Placeholder', 'Biografie {count}', 'Biography {total}'],
    ['Form', 'Eine Kurzbiografie.', ['Wrong list form']]
  ];
  for (const [label, source, target] of cases) {
    const row = {
      ...raw,
      summary: undefined,
      shortDescription: source,
      translations: { en: { shortDescription: {
        text: target, status: 'reviewed', sourceDigest: translationSourceDigest(source), reviewedAt: '2026-08-26',
        languageReviewer: 'Human EN Reviewer', factReviewer: 'Human Fact Reviewer', policyVersion: '1.0.0', machineAssisted: false
      } } }
    };
    assert.equal(normalizeBiography(row, { language: 'en' }).summary, source, label);
  }
});

test('filtert Lebenswege tolerant nach Region, Tradition und Zeitraum', () => {
  const bio = normalizeBiography(raw);
  assert.equal(filterBiographies([bio], { query: 'quebec', region: 'Québec', tradition: 'Libertärer Sozialismus', from: 1910, to: 1920 }, normalizeSearchText).length, 1);
  assert.equal(filterBiographies([bio], { from: 1981, to: 2000 }, normalizeSearchText).length, 0);
});

test('kuratierte Namensvarianten finden Proudhon ohne allgemeine Fuzzy-Suche', () => {
  const proudhon = normalizeBiography({ ...raw, id: 'bio-pierre-joseph-proudhon', name: 'Pierre-Joseph Proudhon', searchAliases: ['Proudon', 'Joseph Proudon'] });
  for (const query of ['Proudon', 'Joseph Proudon', 'pierre joseph proudon']) {
    assert.equal(filterBiographies([proudhon], { query }, normalizeSearchText).length, 1, query);
  }
  assert.equal(filterBiographies([proudhon], { query: 'Proust' }, normalizeSearchText).length, 0);
  assert.ok(validateBiography({ ...raw, searchAliases: 'Proudon' }, new Set(['event-one'])).some(issue => issue.includes('searchAliases')));
});

test('lokalisiert unbekannte und teilweise bekannte Lebensdaten ohne Rohsentinel', () => {
  const unknownLabels = ['nicht sicher überliefert', 'not reliably known', 'no consta con certeza', 'non établi avec certitude', 'non noto con certezza', 'não é conhecido com segurança', 'достоверно не установлено', 'δεν είναι γνωστό με βεβαιότητα', 'güvenilir biçimde bilinmiyor'];
  for (const label of unknownLabels) {
    assert.equal(biographyYearLabel({ dateLabel: 'unknown–1782-09-05' }, label), `${label}–1782-09-05`);
    assert.equal(biographyYearLabel({ dateLabel: '1944-09-12–unknown' }, label), `1944-09-12–${label}`);
    assert.equal(biographyYearLabel({ dateLabel: 'unknown' }, label), label);
    assert.doesNotMatch(biographyYearLabel({ dateLabel: 'unknown–1782-09-05' }, label), /unknown/i);
  }
});
