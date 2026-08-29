import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createI18n, translateCategory, translateEditorialMetadata } from '../src/i18n.js';
import { reviewedTranslationEntryIsAdmissible } from '../src/game-core.js';

const ROOT = new URL('../', import.meta.url);
const INVENTORY_URL = new URL('data/language-inventory.json', ROOT);
const BASELINE_URL = new URL('data/language-coverage-baseline.json', ROOT);
export const NON_TRANSLATABLE_UI_FIELDS = new Set(['appTitle']);

const readJson = async path => JSON.parse(await readFile(new URL(path, ROOT), 'utf8'));
const hasContent = value => Array.isArray(value) ? value.length > 0 : typeof value === 'string' ? Boolean(value.trim()) : value !== null && value !== undefined;

function scanObject(source, openIndex) {
  let depth = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') { blockComment = false; index += 1; }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '/' && next === '/') { lineComment = true; index += 1; continue; }
    if (char === '/' && next === '*') { blockComment = true; index += 1; continue; }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return { literal: source.slice(openIndex, index + 1), end: index + 1 };
    }
  }
  throw new Error(`Nicht abgeschlossenes Objekt ab Zeichen ${openIndex}.`);
}

function topLevelKeys(literal) {
  const keys = new Set();
  let depth = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = 0; index < literal.length; index += 1) {
    const char = literal[index];
    const next = literal[index + 1];
    if (lineComment) { if (char === '\n') lineComment = false; continue; }
    if (blockComment) { if (char === '*' && next === '/') { blockComment = false; index += 1; } continue; }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '/' && next === '/') { lineComment = true; index += 1; continue; }
    if (char === '/' && next === '*') { blockComment = true; index += 1; continue; }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
    if (char === '{') { depth += 1; continue; }
    if (char === '}') { depth -= 1; continue; }
    if (depth !== 1 || !/[A-Za-z_$]/.test(char)) continue;
    const match = literal.slice(index).match(/^([A-Za-z_$][\w$]*)\s*:/);
    if (match) {
      keys.add(match[1]);
      index += match[0].length - 1;
    }
  }
  return keys;
}

export function directUiKeys(source, languages) {
  const result = Object.fromEntries(languages.map(language => [language, new Set()]));
  for (const language of languages) {
    const declaration = new RegExp(`const\\s+${language}\\s*=\\s*{`, 'g');
    const declarationMatch = declaration.exec(source);
    if (!declarationMatch) throw new Error(`UI-Sprachobjekt ${language} fehlt.`);
    const openIndex = declarationMatch.index + declarationMatch[0].lastIndexOf('{');
    topLevelKeys(scanObject(source, openIndex).literal).forEach(key => result[language].add(key));

    const assignment = new RegExp(`Object\\.assign\\(\\s*${language}\\s*,\\s*{`, 'g');
    let match;
    while ((match = assignment.exec(source))) {
      const assignmentOpen = match.index + match[0].lastIndexOf('{');
      const object = scanObject(source, assignmentOpen);
      topLevelKeys(object.literal).forEach(key => result[language].add(key));
      assignment.lastIndex = object.end;
    }
  }
  return result;
}

function quotedPropertyKeys(literal) {
  return new Set([...literal.matchAll(/'([^'\\]*(?:\\.[^'\\]*)*)'\s*:/g)].map(match => match[1]));
}

function directCategoryKeys(source, languages) {
  const result = Object.fromEntries(languages.map(language => [language, new Set()]));
  const marker = /const\s+CATEGORY_TEXT\s*=\s*{/g.exec(source);
  if (!marker) throw new Error('CATEGORY_TEXT fehlt.');
  const whole = scanObject(source, marker.index + marker[0].lastIndexOf('{')).literal;
  for (const language of languages.filter(code => code !== 'de')) {
    const nested = new RegExp(`\\b${language}\\s*:\\s*{`).exec(whole);
    if (nested) quotedPropertyKeys(scanObject(whole, nested.index + nested[0].lastIndexOf('{')).literal).forEach(key => result[language].add(key));
    const assignment = new RegExp(`Object\\.assign\\(\\s*CATEGORY_TEXT\\.${language}\\s*,\\s*{`, 'g');
    let match;
    while ((match = assignment.exec(source))) {
      const object = scanObject(source, match.index + match[0].lastIndexOf('{'));
      quotedPropertyKeys(object.literal).forEach(key => result[language].add(key));
      assignment.lastIndex = object.end;
    }
  }
  return result;
}

export function translationValueDigest(value) {
  const normalized = typeof value === 'string' ? value.normalize('NFC') : Array.isArray(value) ? value.map(item => String(item).normalize('NFC')) : value;
  return `sha256:${createHash('sha256').update(JSON.stringify(normalized)).digest('hex')}`;
}

function reviewProofIsComplete(entry, policyVersion) {
  return /^sha256:[a-f0-9]{64}$/.test(entry?.sourceDigest || '')
    && /^sha256:[a-f0-9]{64}$/.test(entry?.targetDigest || '')
    && /^\d{4}-\d{2}-\d{2}$/.test(entry?.reviewedAt || '')
    && typeof entry?.languageReviewer === 'string' && entry.languageReviewer.trim().length >= 2
    && typeof entry?.factReviewer === 'string' && entry.factReviewer.trim().length >= 2
    && entry?.policyVersion === policyVersion
    && typeof entry?.machineAssisted === 'boolean';
}

const reviewToken = (scope, language, entityId, field) => `${scope}/${language}/${entityId}::${field}`;

function buildReviewIndex(manifest, languages, sourceLanguage, policyVersion) {
  if (manifest?.schemaVersion !== 1 || manifest?.policyVersion !== policyVersion || !Array.isArray(manifest.reviews)) throw new Error('translation-review-manifest.json ist ungültig oder nutzt eine andere Policyversion.');
  const index = new Map();
  for (const review of manifest.reviews) {
    if (!['ui', 'dossiers', 'editorialMetadata', 'taxonomy'].includes(review.scope)) throw new Error(`Reviewmanifest enthält unbekannten Scope: ${review.scope}`);
    if (!languages.includes(review.language) || review.language === sourceLanguage) throw new Error(`Reviewmanifest enthält ungültige Zielsprache: ${review.language}`);
    if (review.status !== 'reviewed' || !reviewProofIsComplete(review, policyVersion)) throw new Error(`Reviewmanifest enthält unvollständigen menschlichen Reviewnachweis: ${review.scope}/${review.language}/${review.entityId}::${review.field}`);
    const token = reviewToken(review.scope, review.language, review.entityId, review.field);
    if (index.has(token)) throw new Error(`Reviewmanifest enthält doppelten Eintrag: ${token}`);
    index.set(token, review);
  }
  return index;
}

export function manifestTranslationStatus({ reviewIndex, scope, language, entityId, field, sourceValue, targetValue, directPresent, policyVersion }) {
  if (!directPresent) return 'fallback';
  const review = reviewIndex.get(reviewToken(scope, language, entityId, field));
  if (!review) return 'present-unreviewed';
  if (!reviewProofIsComplete(review, policyVersion)) return 'present-unreviewed';
  if (review.sourceDigest !== translationValueDigest(sourceValue) || review.targetDigest !== translationValueDigest(targetValue)) return 'stale';
  return 'reviewed';
}

export function dataTranslationStatus(row, language, field, policyVersion) {
  const entry = row.translations?.[language]?.[field];
  if (!entry || !hasContent(entry.text)) return 'missing';
  if (entry.status !== 'reviewed') return entry.status === 'stale' ? 'stale' : 'present-unreviewed';
  const source = valueAtPath(row, field);
  if (entry.sourceDigest !== translationValueDigest(source)) return 'stale';
  return reviewedTranslationEntryIsAdmissible(entry, source, policyVersion) ? 'reviewed' : 'present-unreviewed';
}

function matrixEntity(id, sourceFields, languages, statusForField = () => 'missing', segmentCountForField = () => 1, sourceValueForField = field => field, targetValueForField = () => undefined) {
  const sortedFields = [...new Set(sourceFields)].sort();
  const coverage = {};
  for (const language of languages) {
    if (language === 'de') {
      coverage[language] = { status: 'source', reviewedFields: sortedFields, presentUnreviewedFields: [], fallbackFields: [], staleFields: [], missingFields: [], targetDigests: {} };
      continue;
    }
    const buckets = { reviewed: [], 'present-unreviewed': [], fallback: [], stale: [], missing: [] };
    const targetDigests = {};
    for (const field of sortedFields) {
      const state = statusForField(language, field);
      (buckets[state] || buckets.missing).push(field);
      if (['reviewed', 'present-unreviewed'].includes(state)) {
        const targetValue = targetValueForField(language, field);
        if (!hasContent(targetValue)) throw new Error(`${id}/${language}/${field}: vorhandener Zieltext besitzt keinen digestierbaren Wert.`);
        targetDigests[field] = translationValueDigest(targetValue);
      }
    }
    const open = sortedFields.length - buckets.reviewed.length;
    coverage[language] = {
      status: open ? (buckets.reviewed.length ? 'partial' : buckets.fallback.length === sortedFields.length ? 'fallback' : 'unreviewed') : 'reviewed',
      reviewedFields: buckets.reviewed,
      presentUnreviewedFields: buckets['present-unreviewed'],
      fallbackFields: buckets.fallback,
      staleFields: buckets.stale,
      missingFields: buckets.missing,
      targetDigests
    };
  }
  return {
    id,
    sourceFields: sortedFields,
    sourceSegments: sortedFields.reduce((total, field) => total + segmentCountForField(field), 0),
    sourceSegmentCounts: Object.fromEntries(sortedFields.map(field => [field, segmentCountForField(field)])),
    sourceDigests: Object.fromEntries(sortedFields.map(field => [field, translationValueDigest(sourceValueForField(field))])),
    coverage
  };
}

function valueAtPath(value, path) {
  return path.split('.').reduce((current, part) => current?.[Number.isInteger(Number(part)) ? Number(part) : part], value);
}

function htmlI18nKeys(html, startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`Dossiergrenzen fehlen: ${startMarker} / ${endMarker}`);
  return [...html.slice(start, end).matchAll(/data-i18n(?:-aria)?="([A-Za-z0-9_]+)"/g)].map(match => match[1]);
}

function biographySourceFields(row) {
  const fields = [];
  for (const field of ['places', 'communities', 'ideasAndPractices', 'organizingAndAchievements', 'repressionAndRisks', 'tensionsAndCritique'])
    for (const [index, value] of (row[field] || []).entries()) if (hasContent(value)) fields.push(`${field}.${index}`);
  for (const field of ['shortDescription', 'legacy']) if (hasContent(row[field])) fields.push(field);
  for (const [index, phase] of (row.lifeStages || []).entries()) {
    for (const field of ['title', 'period', 'description']) if (hasContent(phase?.[field])) fields.push(`lifeStages.${index}.${field}`);
  }
  for (const path of ['sensitivity.displayRule']) {
    const [parent, child] = path.split('.');
    if (hasContent(row[parent]?.[child])) fields.push(path);
  }
  return fields;
}

function summaryForScopes(scopes, languages) {
  const summary = {};
  for (const [scope, entities] of Object.entries(scopes)) {
    const fields = entities.reduce((total, entity) => total + entity.sourceFields.length, 0);
    const segments = entities.reduce((total, entity) => total + entity.sourceSegments, 0);
    const coverage = {};
    for (const language of languages) {
      const reviewed = entities.reduce((total, entity) => total + entity.coverage[language].reviewedFields.length, 0);
      const presentUnreviewed = entities.reduce((total, entity) => total + entity.coverage[language].presentUnreviewedFields.length, 0);
      const fallback = entities.reduce((total, entity) => total + entity.coverage[language].fallbackFields.length, 0);
      const stale = entities.reduce((total, entity) => total + entity.coverage[language].staleFields.length, 0);
      const missing = entities.reduce((total, entity) => total + entity.coverage[language].missingFields.length, 0);
      const total = reviewed + presentUnreviewed + fallback + stale + missing;
      coverage[language] = { reviewed, presentUnreviewed, fallback, stale, missing, open: total - reviewed, total };
    }
    summary[scope] = { entities: entities.length, sourceFields: fields, sourceSegments: segments, coverage };
  }
  return summary;
}

export function validateReleasedBatches(batches, scopes, languages, sourceLanguage, policyVersion) {
  if (batches?.policyVersion !== policyVersion || !Array.isArray(batches?.releasedBatches)) throw new Error('translation-batches.json stimmt nicht mit der Übersetzungspolicy überein.');
  for (const batch of batches.releasedBatches) {
    if (!languages.includes(batch.language) || batch.language === sourceLanguage || !Array.isArray(batch.tokens) || !batch.tokens.length) throw new Error(`Übersetzungscharge ${batch.id || '(ohne ID)'} ist ungültig.`);
    if (new Set(batch.tokens).size !== batch.tokens.length) throw new Error(`Übersetzungscharge ${batch.id} enthält doppelte Felder.`);
    const entities = new Map((scopes[batch.scope] || []).map(entity => [entity.id, entity]));
    const parsed = batch.tokens.map(token => {
      const separator = String(token).lastIndexOf('::');
      if (separator <= 0) throw new Error(`Übersetzungscharge ${batch.id} enthält ungültiges Token: ${token}`);
      return { token, id: String(token).slice(0, separator), field: String(token).slice(separator + 2) };
    });
    const ids = new Set(parsed.map(item => item.id));
    if (ids.size > batches.limits.maximumIds) throw new Error(`Übersetzungscharge ${batch.id} überschreitet die ID-Begrenzung.`);
    if (batch.scope === 'biographies' && ids.size > batches.limits.maximumBiographies) throw new Error(`Biografiecharge ${batch.id} überschreitet die Personengrenze.`);
    let segments = 0;
    for (const { token, id, field } of parsed) {
      const entity = entities.get(id);
      if (!entity?.coverage?.[batch.language]?.reviewedFields.includes(field)) throw new Error(`Freigegebene Charge ${batch.id} enthält Fallback, Teiltext oder ungeprüftes Feld: ${token}`);
      const fieldSegments = entity.sourceSegmentCounts?.[field];
      if (!Number.isInteger(fieldSegments) || fieldSegments < 1) throw new Error(`Übersetzungscharge ${batch.id} kann Segmente nicht bestimmen: ${token}`);
      segments += fieldSegments;
    }
    if (segments > batches.limits.maximumSegments) throw new Error(`Übersetzungscharge ${batch.id} umfasst ${segments} Segmente und überschreitet die Grenze ${batches.limits.maximumSegments}.`);
  }
}

export async function buildLanguageInventory(options = {}) {
  const [contract, eventCatalog, biographyCatalog, routes, overrides, batches, storedReviewManifest, i18nSource, html] = await Promise.all([
    readJson('data/archive-contract.json'), readJson('data/event-catalog.json'), readJson('data/biography-catalog.json'),
    readJson('data/routes.json'), readJson('data/event-editorial-overrides.json'), readJson('data/translation-batches.json'),
    readJson('data/translation-review-manifest.json'),
    readFile(new URL('src/i18n.js', ROOT), 'utf8'), readFile(new URL('index.html', ROOT), 'utf8')
  ]);
  const model = contract.translationModel;
  if (!model || model.matrixVersion !== 1) throw new Error('translationModel Version 1 fehlt im Datenvertrag.');
  const languages = model.languages;
  if (new Set(languages).size !== 9 || languages[0] !== model.sourceLanguage) throw new Error('translationModel benötigt neun eindeutige Sprachen mit de als Ausgangssprache.');
  const reviewManifest = options.reviewManifestOverride || storedReviewManifest;
  const reviewIndex = buildReviewIndex(reviewManifest, languages, model.sourceLanguage, model.policyVersion);

  const rawEventFiles = await Promise.all(eventCatalog.map(filename => readJson(`data/${filename}`)));
  const activeEvents = rawEventFiles.flat().filter(row => !row.archived).map(row => ({ ...row, ...(overrides.events?.[row.id] || {}) }));
  const uiDirect = directUiKeys(i18nSource, languages);
  const uiFields = [...uiDirect.de].filter(field => !NON_TRANSLATABLE_UI_FIELDS.has(field)).sort();
  const germanUi = createI18n({ search: '?lang=de' });
  const localizedUi = Object.fromEntries(languages.map(language => [language, createI18n({ search: `?lang=${language}` })]));
  const ui = [matrixEntity(
    'application-ui', uiFields, languages,
    (language, field) => manifestTranslationStatus({ reviewIndex, scope: 'ui', language, entityId: 'application-ui', field, sourceValue: germanUi.t(field), targetValue: localizedUi[language].t(field), directPresent: uiDirect[language].has(field), policyVersion: model.policyVersion }),
    () => 1, field => germanUi.t(field), (language, field) => localizedUi[language].t(field)
  )];

  const dossierDefinitions = [
    ['methodology', 'id="methodology-modal"', 'id="pirate-dossier-modal"', []],
    ['piracy-source-criticism', 'id="pirate-dossier-modal"', 'id="quiz-modal"', ['pirateDossierButton']]
  ];
  const dossiers = dossierDefinitions.map(([id, start, end, extra]) => {
    const keys = [...htmlI18nKeys(html, start, end), ...extra];
    return matrixEntity(
      id, keys, languages,
      (language, field) => manifestTranslationStatus({ reviewIndex, scope: 'dossiers', language, entityId: id, field, sourceValue: germanUi.t(field), targetValue: localizedUi[language].t(field), directPresent: uiDirect[language].has(field), policyVersion: model.policyVersion }),
      () => 1, field => germanUi.t(field), (language, field) => localizedUi[language].t(field)
    );
  });

  const events = activeEvents.map(row => {
    const sourceFields = model.eventFields.filter(field => hasContent(row[field]));
    return matrixEntity(
      row.id,
      sourceFields,
      languages,
      (language, field) => dataTranslationStatus(row, language, field, model.policyVersion),
      field => Array.isArray(row[field]) ? row[field].length : 1,
      field => row[field],
      (language, field) => row.translations?.[language]?.[field]?.text
    );
  });

  const biographyFiles = await Promise.all(biographyCatalog.files.map(entry => readJson(`data/${entry.file}`)));
  const biographies = biographyFiles.flat().map(row => {
    const sourceFields = biographySourceFields(row);
    return matrixEntity(row.id, sourceFields, languages, (language, field) => dataTranslationStatus(row, language, field, model.policyVersion), () => 1, field => valueAtPath(row, field), (language, field) => row.translations?.[language]?.[field]?.text);
  });

  const routeEntities = routes.routes.map(route => {
    const sourceFields = model.routeFields.filter(field => hasContent(route[field]));
    return matrixEntity(route.id, sourceFields, languages, (language, field) => dataTranslationStatus(route, language, field, model.policyVersion), () => 1, field => route[field], (language, field) => route.translations?.[language]?.[field]?.text);
  });

  const metadataValues = new Map();
  for (const event of activeEvents) {
    for (const field of model.metadataFields) if (hasContent(event[field])) metadataValues.set(`${field}:${event[field]}`, { field, value: event[field] });
  }
  const editorialMetadata = [...metadataValues.values()].sort((a, b) => `${a.field}:${a.value}`.localeCompare(`${b.field}:${b.value}`, 'de')).map(({ field, value }) => {
    const id = `${field}:${value}`;
    return matrixEntity(
      id, ['label'], languages,
      language => {
        const targetValue = translateEditorialMetadata(value, language);
        return manifestTranslationStatus({ reviewIndex, scope: 'editorialMetadata', language, entityId: id, field: 'label', sourceValue: value, targetValue, directPresent: targetValue !== value, policyVersion: model.policyVersion });
      },
      () => 1, () => value, language => translateEditorialMetadata(value, language)
    );
  });

  const categoryKeys = directCategoryKeys(i18nSource, languages);
  const taxonomyTerms = [...new Set(activeEvents.flatMap(event => [event.category, ...(event.tags || [])]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de'));
  const taxonomy = taxonomyTerms.map(value => {
    const id = `term-${createHash('sha256').update(value).digest('hex').slice(0, 12)}`;
    return {
      ...matrixEntity(
        id, ['label'], languages,
        language => manifestTranslationStatus({ reviewIndex, scope: 'taxonomy', language, entityId: id, field: 'label', sourceValue: value, targetValue: translateCategory(value, language), directPresent: categoryKeys[language].has(value), policyVersion: model.policyVersion }),
        () => 1, () => value, language => translateCategory(value, language)
      ),
      sourceValue: value
    };
  });

  const scopes = { ui, events, biographies, routes: routeEntities, dossiers, editorialMetadata, taxonomy };
  for (const review of reviewManifest.reviews) {
    const entity = scopes[review.scope]?.find(item => item.id === review.entityId);
    if (!entity?.sourceFields.includes(review.field)) throw new Error(`Reviewmanifest verweist auf unbekanntes Feld: ${reviewToken(review.scope, review.language, review.entityId, review.field)}`);
    const coverage = entity.coverage[review.language];
    if (coverage.fallbackFields.includes(review.field) || coverage.missingFields.includes(review.field)) throw new Error(`Reviewmanifest darf keinen Fallback oder fehlenden Zieltext freigeben: ${reviewToken(review.scope, review.language, review.entityId, review.field)}`);
  }
  const inventory = {
    schemaVersion: 1,
    matrixVersion: model.matrixVersion,
    sourceLanguage: model.sourceLanguage,
    languages,
    statusSemantics: {
      source: 'Deutscher Ausgangstext vorhanden.',
      reviewed: 'Mit Source-Digest, menschlichem Sprach- und Faktenreview sowie Policy-Metadaten geprüft.',
      presentUnreviewed: 'Sprachspezifischer Text ist vorhanden, aber nicht als reviewed freigegeben.',
      fallback: 'Ein Text wird aus einer anderen Sprache geerbt und zählt nicht als Übersetzung.',
      stale: 'Der Ausgangstext oder die Review-Policy hat sich seit der Prüfung geändert.',
      missing: 'Kein Zieltext vorhanden.'
    },
    scopes,
    summary: summaryForScopes(scopes, languages)
  };
  validateReleasedBatches(batches, scopes, languages, model.sourceLanguage, model.policyVersion);
  inventory.digest = createHash('sha256').update(JSON.stringify({ languages, scopes })).digest('hex');
  return inventory;
}

export function buildCoverageBaseline(inventory) {
  const scopes = {};
  for (const [scope, entities] of Object.entries(inventory.scopes)) {
    const languages = {};
    for (const language of inventory.languages.filter(code => code !== inventory.sourceLanguage)) {
      const reviewedTokens = [];
      const presentTokens = [];
      const reviewedTargetDigests = {};
      const presentTargetDigests = {};
      let open = 0;
      for (const entity of entities) {
        for (const field of entity.coverage[language].reviewedFields) {
          const token = `${entity.id}::${field}`;
          reviewedTokens.push(token);
          reviewedTargetDigests[token] = entity.coverage[language].targetDigests[field];
        }
        for (const field of entity.coverage[language].presentUnreviewedFields) {
          const token = `${entity.id}::${field}`;
          presentTokens.push(token);
          presentTargetDigests[token] = entity.coverage[language].targetDigests[field];
        }
        open += entity.sourceFields.length - entity.coverage[language].reviewedFields.length;
      }
      languages[language] = { maximumOpen: open, reviewedTokens: reviewedTokens.sort(), presentTokens: presentTokens.sort(), reviewedTargetDigests, presentTargetDigests };
    }
    scopes[scope] = { entities: entities.length, languages };
  }
  return { schemaVersion: 2, matrixVersion: inventory.matrixVersion, inventoryDigestAtBaseline: inventory.digest, scopes };
}

export function compareCoverageBaseline(inventory, baseline) {
  const regressions = [];
  if (baseline.schemaVersion !== 2 || baseline.matrixVersion !== inventory.matrixVersion) regressions.push('Baseline- oder Matrixversion stimmt nicht.');
  for (const [scope, entities] of Object.entries(inventory.scopes)) {
    const expected = baseline.scopes?.[scope];
    if (!expected) { regressions.push(`${scope}: Baseline-Scope fehlt.`); continue; }
    if (expected.entities !== entities.length) regressions.push(`${scope}: erwartet ${expected.entities} Entitäten, gefunden ${entities.length}.`);
    for (const language of inventory.languages.filter(code => code !== inventory.sourceLanguage)) {
      const coverage = expected.languages?.[language];
      if (!coverage) { regressions.push(`${scope}/${language}: Sprachbaseline fehlt.`); continue; }
      const reviewed = new Set(entities.flatMap(entity => entity.coverage[language].reviewedFields.map(field => `${entity.id}::${field}`)));
      const states = new Map();
      const targetDigests = new Map();
      for (const entity of entities) {
        for (const field of entity.coverage[language].reviewedFields) { states.set(`${entity.id}::${field}`, 'reviewed'); targetDigests.set(`${entity.id}::${field}`, entity.coverage[language].targetDigests[field]); }
        for (const field of entity.coverage[language].presentUnreviewedFields) { states.set(`${entity.id}::${field}`, 'present-unreviewed'); targetDigests.set(`${entity.id}::${field}`, entity.coverage[language].targetDigests[field]); }
        for (const field of entity.coverage[language].fallbackFields) states.set(`${entity.id}::${field}`, 'fallback');
        for (const field of entity.coverage[language].staleFields) states.set(`${entity.id}::${field}`, 'stale');
        for (const field of entity.coverage[language].missingFields) states.set(`${entity.id}::${field}`, 'missing');
      }
      const open = entities.reduce((total, entity) => total + entity.sourceFields.length - entity.coverage[language].reviewedFields.length, 0);
      for (const token of coverage.reviewedTokens || []) if (!reviewed.has(token)) regressions.push(`${scope}/${language}: geprüfte Übersetzung regressiert: ${token}`);
      for (const token of coverage.presentTokens || []) if (!['present-unreviewed', 'reviewed'].includes(states.get(token))) regressions.push(`${scope}/${language}: vorhandener Zieltext regressiert: ${token} (${states.get(token) || 'entfernt'})`);
      for (const [token, digest] of Object.entries(coverage.reviewedTargetDigests || {})) if (targetDigests.get(token) !== digest) regressions.push(`${scope}/${language}: geprüfter Zieltext wurde ohne Baseline-Review verändert: ${token}`);
      for (const [token, digest] of Object.entries(coverage.presentTargetDigests || {})) if (targetDigests.get(token) !== digest) regressions.push(`${scope}/${language}: vorhandener Zieltext wurde verändert oder fiel zurück: ${token}`);
      if (open > coverage.maximumOpen) regressions.push(`${scope}/${language}: offene Reviewfelder stiegen von ${coverage.maximumOpen} auf ${open}.`);
    }
  }
  for (const scope of Object.keys(baseline.scopes || {})) if (!inventory.scopes[scope]) regressions.push(`${scope}: Baseline-Scope ist aus der Matrix verschwunden.`);
  return regressions;
}

export function strictGaps(inventory) {
  const gaps = [];
  for (const [scope, entities] of Object.entries(inventory.scopes)) {
    for (const entity of entities) {
      for (const language of inventory.languages.filter(code => code !== inventory.sourceLanguage)) {
        for (const [status, fields] of [
          ['present-unreviewed', entity.coverage[language].presentUnreviewedFields],
          ['fallback', entity.coverage[language].fallbackFields],
          ['stale', entity.coverage[language].staleFields],
          ['missing', entity.coverage[language].missingFields]
        ]) gaps.push(...fields.map(field => `${scope}/${language}/${entity.id}::${field} [${status}]`));
      }
    }
  }
  return gaps;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const inventory = await buildLanguageInventory();
  if (args.has('--write') || args.has('--refresh-baseline')) await writeFile(INVENTORY_URL, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
  if (args.has('--refresh-baseline')) await writeFile(BASELINE_URL, `${JSON.stringify(buildCoverageBaseline(inventory), null, 2)}\n`, 'utf8');

  if (!args.has('--write') && !args.has('--refresh-baseline')) {
    const committed = JSON.parse(await readFile(INVENTORY_URL, 'utf8'));
    if (JSON.stringify(committed) !== JSON.stringify(inventory)) throw new Error('data/language-inventory.json ist veraltet. Mit npm run inventory:translations aktualisieren.');
  }

  const baseline = JSON.parse(await readFile(BASELINE_URL, 'utf8'));
  const regressions = compareCoverageBaseline(inventory, baseline);
  if (regressions.length) throw new Error(`Übersetzungsabdeckung regressiert:\n${regressions.join('\n')}`);

  const gaps = strictGaps(inventory);
  const scopeSummary = Object.entries(inventory.summary).map(([scope, row]) => `${scope}: ${row.entities} Entitäten`).join(', ');
  console.log(`Sprachmatrix ${inventory.digest.slice(0, 12)} geprüft (${scopeSummary}; ${gaps.length} exakt adressierbare offene Felder).`);
  if (args.has('--strict') && gaps.length) {
    const preview = gaps.slice(0, 200).join('\n');
    throw new Error(`Strict-Mode: ${gaps.length} geprüfte Übersetzungsfelder fehlen. Vollständige Matrix: data/language-inventory.json\n${preview}${gaps.length > 200 ? '\n… weitere Lücken stehen maschinenlesbar in der Matrix.' : ''}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
