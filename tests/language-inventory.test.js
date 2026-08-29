import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  NON_TRANSLATABLE_UI_FIELDS,
  buildCoverageBaseline,
  buildLanguageInventory,
  compareCoverageBaseline,
  dataTranslationStatus,
  strictGaps,
  translationValueDigest,
  validateReleasedBatches
} from '../scripts/language-inventory.mjs';

const root = new URL('../', import.meta.url);

test('Sprachmatrix bildet alle Phase-1-Bestände und Fallbacks exakt ab', async () => {
  const inventory = await buildLanguageInventory();
  assert.deepEqual(inventory.languages, ['de', 'en', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr']);
  assert.equal(inventory.summary.ui.sourceFields, 376);
  assert.ok(NON_TRANSLATABLE_UI_FIELDS.has('appTitle'));
  assert.ok(!inventory.scopes.ui[0].sourceFields.includes('appTitle'));
  assert.equal(inventory.summary.events.entities, 674);
  assert.equal(inventory.summary.events.sourceFields, 6663);
  assert.equal(inventory.summary.events.sourceSegments, 7574);
  assert.equal(inventory.summary.events.coverage.en.missing, 6663);
  assert.equal(inventory.summary.events.coverage.en.reviewed, 0);
  assert.equal(inventory.summary.biographies.entities, 40);
  assert.equal(inventory.summary.biographies.sourceFields, 1314);
  assert.equal(inventory.summary.routes.sourceFields, 18);
  assert.equal(inventory.summary.dossiers.sourceFields, 30);
  assert.equal(inventory.summary.editorialMetadata.entities, 133);
  assert.equal(inventory.summary.taxonomy.entities, 73);
  for (const language of ['it', 'pt', 'ru', 'el', 'tr']) {
    assert.equal(inventory.summary.ui.coverage[language].fallback, 0);
    assert.equal(inventory.summary.ui.coverage[language].presentUnreviewed, 376);
  }
});

test('eingecheckte Matrix ist deterministisch und entspricht den Quellen', async () => {
  const first = await buildLanguageInventory();
  const second = await buildLanguageInventory();
  const committed = JSON.parse(await readFile(new URL('data/language-inventory.json', root), 'utf8'));
  assert.deepEqual(first, second);
  assert.deepEqual(committed, first);
});

test('No-regression schützt reviewed und vorhandene Zieltexte, erlaubt Verbesserungen', async () => {
  const inventory = await buildLanguageInventory();
  const baseline = buildCoverageBaseline(inventory);
  assert.deepEqual(compareCoverageBaseline(inventory, baseline), []);

  const lostPresent = structuredClone(inventory);
  const field = lostPresent.scopes.ui[0].coverage.it.presentUnreviewedFields.shift();
  lostPresent.scopes.ui[0].coverage.it.fallbackFields.push(field);
  assert.ok(compareCoverageBaseline(lostPresent, baseline).some(issue => issue.includes('vorhandener Zieltext regressiert')));

  const reviewedBaseline = structuredClone(baseline);
  reviewedBaseline.scopes.ui.languages.it.reviewedTokens = [`application-ui::${field}`];
  assert.ok(compareCoverageBaseline(inventory, reviewedBaseline).some(issue => issue.includes('geprüfte Übersetzung regressiert')));

  const nonsense = structuredClone(inventory);
  nonsense.scopes.ui[0].coverage.it.targetDigests[field] = translationValueDigest('Beliebiger Nonsens');
  assert.ok(compareCoverageBaseline(nonsense, baseline).some(issue => issue.includes('Zieltext wurde verändert')));

  const englishFallback = structuredClone(inventory);
  englishFallback.scopes.ui[0].coverage.it.targetDigests[field] = englishFallback.scopes.ui[0].coverage.en.targetDigests[field];
  assert.ok(compareCoverageBaseline(englishFallback, baseline).some(issue => issue.includes('Zieltext wurde verändert')));

  const improvement = structuredClone(inventory);
  const improvedField = improvement.scopes.events[0].coverage.en.missingFields.shift();
  improvement.scopes.events[0].coverage.en.reviewedFields.push(improvedField);
  assert.deepEqual(compareCoverageBaseline(improvement, baseline), []);
});

test('Reviewmanifest bietet für alle codebasierten Scopes einen konstruktiven reviewed-Pfad', async () => {
  const base = await buildLanguageInventory();
  const reviews = [];
  for (const scope of ['ui', 'dossiers', 'editorialMetadata', 'taxonomy']) {
    const entity = base.scopes[scope].find(item => item.coverage.en.presentUnreviewedFields.length);
    assert.ok(entity, `${scope} benötigt mindestens einen direkten englischen Zieltext`);
    const field = entity.coverage.en.presentUnreviewedFields[0];
    reviews.push({
      scope, entityId: entity.id, field, language: 'en', status: 'reviewed',
      sourceDigest: entity.sourceDigests[field], targetDigest: entity.coverage.en.targetDigests[field],
      reviewedAt: '2026-08-26', languageReviewer: 'Human EN Reviewer', factReviewer: 'Human Fact Reviewer',
      policyVersion: '1.0.0', machineAssisted: false
    });
  }
  const inventory = await buildLanguageInventory({ reviewManifestOverride: { schemaVersion: 1, policyVersion: '1.0.0', reviews } });
  for (const review of reviews) {
    const entity = inventory.scopes[review.scope].find(item => item.id === review.entityId);
    assert.ok(entity.coverage.en.reviewedFields.includes(review.field), `${review.scope} wurde nicht reviewed`);
  }
  const staleManifest = structuredClone({ schemaVersion: 1, policyVersion: '1.0.0', reviews });
  staleManifest.reviews[0].sourceDigest = `sha256:${'0'.repeat(64)}`;
  const stale = await buildLanguageInventory({ reviewManifestOverride: staleManifest });
  assert.ok(stale.scopes.ui[0].coverage.en.staleFields.includes(reviews[0].field));
});

test('verschachtelte Biografiepfade verwenden den tatsächlichen Ausgangswert für stale', () => {
  const source = 'Aufbau lokaler Strukturen.';
  const proof = {
    text: 'Building local structures.', status: 'reviewed', sourceDigest: translationValueDigest(source),
    reviewedAt: '2026-08-26', languageReviewer: 'Human EN Reviewer', factReviewer: 'Human Fact Reviewer',
    policyVersion: '1.0.0', machineAssisted: false
  };
  const row = { lifeStages: [{ description: source }], translations: { en: { 'lifeStages.0.description': proof } } };
  assert.equal(dataTranslationStatus(row, 'en', 'lifeStages.0.description', '1.0.0'), 'reviewed');
  row.lifeStages[0].description = 'Geänderter Ausgangstext.';
  assert.equal(dataTranslationStatus(row, 'en', 'lifeStages.0.description', '1.0.0'), 'stale');
});

test('Matrix lehnt dieselben HTML-, Bidi-, NFC-, Placeholder- und Formfehler für Routen und Biografien ab wie die Runtime', () => {
  const cases = [
    ['HTML', 'Ausgangstext.', '<b>unsafe</b>'],
    ['Bidi', 'Ausgangstext.', 'Unsafe\u202E text'],
    ['NFC', 'Café.', 'Cafe\u0301'],
    ['Placeholder', 'Text {count}', 'Text {total}'],
    ['Form', 'Ausgangstext.', ['Wrong list form']]
  ];
  for (const [label, source, target] of cases) {
    const entry = {
      text: target, status: 'reviewed', sourceDigest: translationValueDigest(source), reviewedAt: '2026-08-26',
      languageReviewer: 'Human EN Reviewer', factReviewer: 'Human Fact Reviewer', policyVersion: '1.0.0', machineAssisted: false
    };
    const route = { title: source, translations: { en: { title: entry } } };
    const biography = { lifeStages: [{ description: source }], translations: { en: { 'lifeStages.0.description': entry } } };
    assert.equal(dataTranslationStatus(route, 'en', 'title', '1.0.0'), 'present-unreviewed', `Route/${label}`);
    assert.equal(dataTranslationStatus(biography, 'en', 'lifeStages.0.description', '1.0.0'), 'present-unreviewed', `Biografie/${label}`);
  }
});

test('Chargengrenze zählt echte Listensegmente statt Feldtokens', () => {
  const scopes = {
    events: [{ id: 'many-items', sourceSegmentCounts: { participants: 301 }, coverage: { en: { reviewedFields: ['participants'] } } }]
  };
  const batches = {
    policyVersion: '1.0.0', limits: { maximumIds: 25, maximumSegments: 300, maximumBiographies: 5 },
    releasedBatches: [{ id: 'too-many-segments', scope: 'events', language: 'en', tokens: ['many-items::participants'] }]
  };
  assert.throws(() => validateReleasedBatches(batches, scopes, ['de', 'en'], 'de', '1.0.0'), /301 Segmente/);
});

test('Strict-Zielgate bleibt bis zur menschlichen Vollprüfung bewusst rot', async () => {
  const inventory = await buildLanguageInventory();
  const gaps = strictGaps(inventory);
  assert.ok(gaps.length > 60000);
  assert.ok(gaps.some(gap => gap.includes('events/en/')));
  assert.ok(gaps.some(gap => gap.includes('[present-unreviewed]')));
});
