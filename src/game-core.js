export const CATEGORY_COLORS = {
  'Arbeiter*innenbewegung': '#65f3a6',
  'Antiautoritäre Revolution': '#ffb86b',
  'Antikolonialer Widerstand': '#74b9ff',
  'Feministischer Widerstand': '#ff8fc7',
  'Antifaschistischer Widerstand': '#ff7f7f',
  'Demokratische Erhebung': '#d4a5ff',
  'Ökologischer Widerstand': '#b7e36c',
  'Queerer Widerstand': '#f7d774',
  'Anarchistische Bewegung': '#ff9f6e',
  'Libertärer Kommunismus': '#ffbd7a',
  'Indigener Widerstand': '#57c7b6',
  'Feministischer & antisexistischer Widerstand': '#ff8fc7',
  'Schwarze Befreiungsbewegung': '#ad9cff',
  'Antirassistischer Widerstand': '#80aaff',
  'Antiimperialistischer Widerstand': '#5fc1e8',
  'Gedächtnis der Besiegten': '#d6b48a',
  'Frühe soziale Revolten': '#d8a66f',
  'Sklav*innenwiderstand': '#d99173',
  'Antifeudaler Widerstand': '#e6bb67',
  'Commons-Bewegung': '#86c98d',
  'Rätebewegung': '#ef9867',
  'Tierbefreiung': '#9bd66f',
  'Behindertenbewegung': '#f1d35f',
  'Gefängnisabolitionismus': '#df8f72',
  'Migrantischer Widerstand': '#6dd4c1',
  'Antimilitarismus': '#c5b1ff',
  'Bäuerlicher Widerstand': '#d7b86a',
  'Studierendenbewegung': '#9fb9ff',
  'Ereignis': '#c7d8cf'
};

const clean = (value, maxLength = 600) => typeof value === 'string' ? value.trim().slice(0, maxLength) : value;

export const EDITORIAL_LIST_FIELDS = ['demands', 'participants', 'powerStructures', 'tactics', 'voices'];
export const EDITORIAL_TEXT_FIELDS = [
  'immediateConsequences', 'longTermImpact', 'repression', 'humanCosts', 'aftermath',
  'openQuestions', 'sourceType', 'sourceQuality', 'uncertainty', 'sensitivity', 'reviewStatus',
  'bottomUpPressure', 'achievement', 'limits'
];
export const EVENT_TRANSLATION_FIELDS = new Set([
  'title', 'location', 'description', 'significance', 'clue',
  ...EDITORIAL_LIST_FIELDS,
  ...EDITORIAL_TEXT_FIELDS.filter(field => !['sourceType', 'sourceQuality', 'reviewStatus'].includes(field)),
  'category', 'country', 'continent'
]);
export const EVENT_TRANSLATION_LANGUAGES = new Set(['en', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr']);
export const TRANSLATION_POLICY_VERSION = '1.0.0';
export const BIOGRAPHY_TRANSLATION_FIELDS = new Set([
  'shortDescription', 'legacy', 'sensitivity.displayRule',
  'places.0', 'places.1', 'places.2', 'places.3', 'places.4', 'places.5', 'places.6', 'places.7', 'places.8', 'places.9', 'places.10', 'places.11',
  'communities.0', 'communities.1', 'communities.2', 'communities.3', 'communities.4', 'communities.5', 'communities.6', 'communities.7', 'communities.8', 'communities.9', 'communities.10', 'communities.11',
  'ideasAndPractices.0', 'ideasAndPractices.1', 'ideasAndPractices.2', 'ideasAndPractices.3', 'ideasAndPractices.4', 'ideasAndPractices.5', 'ideasAndPractices.6', 'ideasAndPractices.7', 'ideasAndPractices.8', 'ideasAndPractices.9', 'ideasAndPractices.10', 'ideasAndPractices.11', 'ideasAndPractices.12', 'ideasAndPractices.13', 'ideasAndPractices.14', 'ideasAndPractices.15', 'ideasAndPractices.16', 'ideasAndPractices.17', 'ideasAndPractices.18', 'ideasAndPractices.19', 'ideasAndPractices.20', 'ideasAndPractices.21', 'ideasAndPractices.22', 'ideasAndPractices.23',
  'organizingAndAchievements.0', 'organizingAndAchievements.1', 'organizingAndAchievements.2', 'organizingAndAchievements.3', 'organizingAndAchievements.4', 'organizingAndAchievements.5', 'organizingAndAchievements.6', 'organizingAndAchievements.7', 'organizingAndAchievements.8', 'organizingAndAchievements.9', 'organizingAndAchievements.10', 'organizingAndAchievements.11', 'organizingAndAchievements.12', 'organizingAndAchievements.13', 'organizingAndAchievements.14', 'organizingAndAchievements.15', 'organizingAndAchievements.16', 'organizingAndAchievements.17', 'organizingAndAchievements.18', 'organizingAndAchievements.19', 'organizingAndAchievements.20', 'organizingAndAchievements.21', 'organizingAndAchievements.22', 'organizingAndAchievements.23',
  'repressionAndRisks.0', 'repressionAndRisks.1', 'repressionAndRisks.2', 'repressionAndRisks.3', 'repressionAndRisks.4', 'repressionAndRisks.5', 'repressionAndRisks.6', 'repressionAndRisks.7', 'repressionAndRisks.8', 'repressionAndRisks.9', 'repressionAndRisks.10', 'repressionAndRisks.11', 'repressionAndRisks.12', 'repressionAndRisks.13', 'repressionAndRisks.14', 'repressionAndRisks.15', 'repressionAndRisks.16', 'repressionAndRisks.17', 'repressionAndRisks.18', 'repressionAndRisks.19', 'repressionAndRisks.20', 'repressionAndRisks.21', 'repressionAndRisks.22', 'repressionAndRisks.23',
  'tensionsAndCritique.0', 'tensionsAndCritique.1', 'tensionsAndCritique.2', 'tensionsAndCritique.3', 'tensionsAndCritique.4', 'tensionsAndCritique.5', 'tensionsAndCritique.6', 'tensionsAndCritique.7', 'tensionsAndCritique.8', 'tensionsAndCritique.9', 'tensionsAndCritique.10', 'tensionsAndCritique.11', 'tensionsAndCritique.12', 'tensionsAndCritique.13', 'tensionsAndCritique.14', 'tensionsAndCritique.15', 'tensionsAndCritique.16', 'tensionsAndCritique.17', 'tensionsAndCritique.18', 'tensionsAndCritique.19', 'tensionsAndCritique.20', 'tensionsAndCritique.21', 'tensionsAndCritique.22', 'tensionsAndCritique.23',
  ...Array.from({ length: 24 }, (_, index) => [`lifeStages.${index}.title`, `lifeStages.${index}.period`, `lifeStages.${index}.description`]).flat()
]);
export const ROUTE_TRANSLATION_FIELDS = new Set(['title', 'description', 'sourceNote']);
export const EVENT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const COORDINATE_PRECISION_VALUES = new Set(['exact', 'approximate', 'region', 'hidden']);
export const LICENSE_STATUS_VALUES = new Set(['rights-unclear', 'per-item', 'third-party-terms', 'public-domain', 'licensed']);
export const RELATION_TYPE_VALUES = new Set(['same-route', 'similar-tactic', 'shared-movement', 'editorial-relation']);
export const RELATION_EVIDENCE_VALUES = new Set(['curated-context', 'heuristic-similarity', 'sourced-relation']);
export const MAP_STYLE_VALUES = new Set(['dark', 'mono', 'paper']);

const SEARCH_SYNONYMS = new Map([
  ['arbeiter', ['worker', 'workers', 'labour', 'labor']],
  ['worker', ['arbeiter', 'labour', 'labor']],
  ['indigen', ['indigenous', 'first nations', 'native']],
  ['indigenous', ['indigen', 'first nations', 'native']],
  ['queer', ['lgbt', 'lgbtq', 'homosexuell']],
  ['antikolonial', ['dekolonial', 'decolonial', 'anti colonial']],
  ['decolonial', ['antikolonial', 'dekolonial']],
  ['schwarz', ['black', 'afro']],
  ['black', ['schwarz', 'afro']],
  ['gegenseitige hilfe', ['mutual aid']],
  ['mutual aid', ['gegenseitige hilfe']],
  ['zapatista', ['ezln', 'zapatist']],
  ['ezln', ['zapatista', 'zapatist']]
]);

export function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('de')
    .replace(/[‐‑‒–—―-]+/g, ' ')
    .replace(/[^a-z0-9äöüß]+/gi, ' ')
    .replace(/\s+/g, ' ').trim();
}

export function matchesTolerantSearch(haystack, query) {
  const normalizedHaystack = normalizeSearchText(haystack);
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;
  return normalizedQuery.split(' ').every(token => {
    if (normalizedHaystack.includes(token)) return true;
    const alternatives = SEARCH_SYNONYMS.get(token) || [];
    return alternatives.some(value => normalizedHaystack.includes(normalizeSearchText(value)));
  });
}

const cleanList = (value, itemLength = 500, maxItems = 24) => {
  const list = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/\s*;\s*/) : [];
  return [...new Set(list.map(item => clean(typeof item === 'object' ? item?.text : item, itemLength)).filter(Boolean))].slice(0, maxItems);
};

const SHA256_INITIAL = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
const SHA256_CONSTANTS = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];
const rotateRight = (value, bits) => (value >>> bits) | (value << (32 - bits));

function sha256Hex(input) {
  const bytes = new TextEncoder().encode(input);
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  const bitLength = bytes.length * 8;
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false);
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);
  const hash = [...SHA256_INITIAL];
  const words = new Uint32Array(64);
  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index += 1) words[index] = view.getUint32(offset + index * 4, false);
    for (let index = 16; index < 64; index += 1) {
      const s0 = rotateRight(words[index - 15], 7) ^ rotateRight(words[index - 15], 18) ^ (words[index - 15] >>> 3);
      const s1 = rotateRight(words[index - 2], 17) ^ rotateRight(words[index - 2], 19) ^ (words[index - 2] >>> 10);
      words[index] = (words[index - 16] + s0 + words[index - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index += 1) {
      const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temporary1 = (h + s1 + choice + SHA256_CONSTANTS[index] + words[index]) >>> 0;
      const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temporary2 = (s0 + majority) >>> 0;
      h = g; g = f; f = e; e = (d + temporary1) >>> 0; d = c; c = b; b = a; a = (temporary1 + temporary2) >>> 0;
    }
    hash[0] = (hash[0] + a) >>> 0; hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0; hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0; hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0; hash[7] = (hash[7] + h) >>> 0;
  }
  return hash.map(value => value.toString(16).padStart(8, '0')).join('');
}

export function translationSourceDigest(value) {
  const normalized = typeof value === 'string'
    ? value.normalize('NFC')
    : Array.isArray(value) ? value.map(item => String(item).normalize('NFC')) : value;
  return `sha256:${sha256Hex(JSON.stringify(normalized))}`;
}

export function translationValueAtPath(value, path) {
  return String(path).split('.').reduce((current, part) => current?.[Number.isInteger(Number(part)) ? Number(part) : part], value);
}

const translationEntryHasReviewProof = (entry, policyVersion = TRANSLATION_POLICY_VERSION) => entry?.status === 'reviewed'
  && /^sha256:[a-f0-9]{64}$/.test(entry.sourceDigest || '')
  && /^\d{4}-\d{2}-\d{2}$/.test(entry.reviewedAt || '')
  && typeof entry.languageReviewer === 'string' && entry.languageReviewer.trim().length >= 2
  && typeof entry.factReviewer === 'string' && entry.factReviewer.trim().length >= 2
  && entry.policyVersion === policyVersion
  && typeof entry.machineAssisted === 'boolean';

const translationPlaceholders = value => [...String(value ?? '').matchAll(/\{([A-Za-z0-9_]+)\}/g)].map(match => match[1]).sort();
const unsafeTranslationText = value => typeof value === 'string' && (value !== value.normalize('NFC') || /[\u202A-\u202E\u2066-\u2069]/u.test(value) || /<[^>]+>/u.test(value));
const translationTextMatchesShape = (source, target) => Array.isArray(source)
  ? Array.isArray(target) && source.length === target.length && target.every(item => typeof item === 'string' && item.trim())
  : typeof target === 'string' && Boolean(target.trim());
const translationHasMatchingPlaceholders = (source, target) => {
  if (Array.isArray(source)) return Array.isArray(target) && source.every((item, index) => JSON.stringify(translationPlaceholders(item)) === JSON.stringify(translationPlaceholders(target[index])));
  return JSON.stringify(translationPlaceholders(source)) === JSON.stringify(translationPlaceholders(target));
};
export function reviewedTranslationEntryIsAdmissible(entry, source, policyVersion = TRANSLATION_POLICY_VERSION) {
  if (!translationEntryHasReviewProof(entry, policyVersion) || entry.sourceDigest !== translationSourceDigest(source)) return false;
  if (!translationTextMatchesShape(source, entry.text) || !translationHasMatchingPlaceholders(source, entry.text)) return false;
  const targetParts = Array.isArray(entry.text) ? entry.text : [entry.text];
  if (targetParts.some(unsafeTranslationText)) return false;
  if (JSON.stringify(source) === JSON.stringify(entry.text) && !(typeof entry.preserveReason === 'string' && entry.preserveReason.trim())) return false;
  return true;
}
const isIdentitySensitiveTranslation = row => Boolean(row?.sensitivity && !['Niedrig', 'Nein', 'Keine'].includes(row.sensitivity))
  || /Indigen|Schwarze|queer|feminis|antisex|antirassist|Sklav/i.test([row?.category, ...(row?.tags || [])].join(' '));

export function normalizeReviewedTranslations(value, sourceRow = {}, allowedFields = EVENT_TRANSLATION_FIELDS) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const translations = {};
  for (const [language, fields] of Object.entries(value)) {
    if (!EVENT_TRANSLATION_LANGUAGES.has(language) || !fields || typeof fields !== 'object' || Array.isArray(fields)) continue;
    const reviewed = {};
    for (const [field, entry] of Object.entries(fields)) {
      if (!allowedFields.has(field) || !entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
      const source = translationValueAtPath(sourceRow, field);
      if (!reviewedTranslationEntryIsAdmissible(entry, source)) continue;
      const text = Array.isArray(entry.text) ? cleanList(entry.text, 800) : clean(entry.text, 2400);
      if ((Array.isArray(text) && text.length) || (typeof text === 'string' && text)) reviewed[field] = {
        text,
        status: 'reviewed',
        sourceDigest: entry.sourceDigest,
        reviewedAt: entry.reviewedAt,
        languageReviewer: clean(entry.languageReviewer, 160),
        factReviewer: clean(entry.factReviewer, 160),
        policyVersion: entry.policyVersion,
        machineAssisted: entry.machineAssisted,
        ...(entry.preserveReason ? { preserveReason: clean(entry.preserveReason, 500) } : {}),
        ...(entry.subjectMatterReviewer ? { subjectMatterReviewer: clean(entry.subjectMatterReviewer, 160) } : {})
      };
    }
    if (Object.keys(reviewed).length) translations[language] = reviewed;
  }
  return translations;
}

export function normalizeEventTranslations(value, sourceRow = {}) {
  return normalizeReviewedTranslations(value, sourceRow, EVENT_TRANSLATION_FIELDS);
}

function setTranslationValue(target, path, value) {
  const parts = String(path).split('.');
  let current = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = Number.isInteger(Number(parts[index])) ? Number(parts[index]) : parts[index];
    const existing = current?.[part];
    current[part] = Array.isArray(existing) ? [...existing] : { ...(existing || {}) };
    current = current[part];
  }
  const finalPart = Number.isInteger(Number(parts.at(-1))) ? Number(parts.at(-1)) : parts.at(-1);
  current[finalPart] = Array.isArray(value) ? [...value] : value;
}

export function localizeTranslatedRecord(record, language = 'de', allowedFields = EVENT_TRANSLATION_FIELDS) {
  if (language === 'de') return { ...record };
  const localized = { ...record };
  for (const [field, entry] of Object.entries(record?.translations?.[language] || {})) {
    const source = translationValueAtPath(record, field);
    if (!allowedFields.has(field) || !reviewedTranslationEntryIsAdmissible(entry, source)) continue;
    setTranslationValue(localized, field, entry.text);
  }
  return localized;
}

export function localizeEvent(event, language = 'de') {
  const localized = localizeTranslatedRecord(event, language, EVENT_TRANSLATION_FIELDS);
  const reviewed = event?.translations?.[language] || {};
  const translatedFields = [];
  const originalFields = [...EVENT_TRANSLATION_FIELDS].filter(field => {
    const value = event?.[field];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  });
  for (const [field, entry] of Object.entries(reviewed)) {
    const source = event?.[field];
    if (!EVENT_TRANSLATION_FIELDS.has(field) || !reviewedTranslationEntryIsAdmissible(entry, source)) continue;
    translatedFields.push(field);
  }
  localized.localization = {
    language,
    translatedFields,
    usesGermanOriginal: language !== 'de' && originalFields.some(field => !translatedFields.includes(field))
  };
  return localized;
}

export function isSensitiveEvent(event) {
  const marker = String(event?.sensitivity || '').toLocaleLowerCase('de');
  if (marker && !['nein', 'none', 'keine', 'low', 'niedrig'].includes(marker)) return true;
  const text = [event?.title, event?.description, event?.humanCosts].filter(Boolean).join(' ').toLocaleLowerCase('de');
  return /massaker|massacre|lynch|femizid|femicide|genozid|genocide|tödlich|erschossen|tötung|mord|killing|death in (?:police )?custody/.test(text);
}

export function extractYear(text = '') {
  const match = String(text).match(/(?:17|18|19|20)\d{2}/);
  return match ? Number(match[0]) : null;
}

export function normalizeEvent(row, index = 0) {
  const coordinatePrecision = COORDINATE_PRECISION_VALUES.has(row.coordinatePrecision) ? row.coordinatePrecision : '';
  const longitude = coordinatePrecision === 'hidden' ? null : Number(row.longitude ?? row.lng ?? row.coordinates?.[0]);
  const latitude = coordinatePrecision === 'hidden' ? null : Number(row.latitude ?? row.lat ?? row.coordinates?.[1]);
  const title = clean(row.title, 160) || 'Unbekanntes Ereignis';
  const description = clean(row.description, 1400) || 'Für diesen Eintrag liegt noch kein Kurztext vor.';
  const rawYearStart = row.year_start ?? row.yearStart ?? row.year ?? extractYear(description);
  const yearStart = rawYearStart === null || rawYearStart === undefined || rawYearStart === '' ? Number.NaN : Number(rawYearStart);
  const rawYearEnd = row.year_end ?? row.yearEnd;
  const yearEnd = rawYearEnd === null || rawYearEnd === undefined || rawYearEnd === '' ? yearStart : Number(rawYearEnd);
  const rawId = row.id ?? `${title}-${yearStart || 'undatiert'}-${index}`;
  const tags = Array.isArray(row.tags)
    ? row.tags.map(tag => clean(tag, 100)).filter(Boolean).slice(0, 24)
    : typeof row.tags === 'string'
      ? row.tags.split(',').map(tag => clean(tag, 100)).filter(Boolean).slice(0, 24)
      : [];

  const sourceUrl = clean(row.source_url ?? row.sourceUrl, 1000) || '';
  const sourceType = clean(row.source_type ?? row.sourceType, 120)
    || (/wikipedia\.org/i.test(sourceUrl) ? 'Sekundär / weiterführend' : 'Weiterführende Quelle');
  const sourceQuality = clean(row.source_quality ?? row.sourceQuality, 160) || 'Noch nicht redaktionell bewertet';

  const event = {
    id: String(rawId).toLowerCase().replace(/[^a-z0-9äöüß]+/gi, '-').replace(/(^-|-$)/g, ''),
    title,
    location: clean(row.location, 180) || 'Ort unbekannt',
    country: clean(row.country, 120) || '',
    continent: clean(row.continent, 80) || 'Weltweit',
    category: clean(row.category, 120) || 'Ereignis',
    tags: [...new Set(tags)],
    description,
    significance: clean(row.significance ?? row.why_it_matters, 1400) || '',
    clue: clean(row.clue, 400) || 'Suche in der Nähe von ' + (clean(row.location, 180) || 'diesem Ort') + '.',
    longitude,
    latitude,
    yearStart: Number.isFinite(yearStart) ? yearStart : null,
    yearEnd: Number.isFinite(yearEnd) ? yearEnd : Number.isFinite(yearStart) ? yearStart : null,
    dateLabel: clean(row.date_label ?? row.dateLabel, 100) || '',
    imageApiUrl: clean(row.image_api_url ?? row.imageApiUrl ?? row.image_url, 1000) || '',
    imageUrl: clean(row.image ?? row.imageUrl, 1000) || '',
    imageAlt: clean(row.image_alt ?? row.imageAlt, 240) || 'Historische Darstellung: ' + title,
    sourceUrl,
    schemaVersion: Number.isInteger(Number(row.schemaVersion)) && Number(row.schemaVersion) > 0 ? Number(row.schemaVersion) : 1,
    aliases: cleanList(row.aliases, 120, 16).map(alias => alias.toLowerCase()),
    coordinatePrecision,
    provenance: normalizeProvenance(row.provenance),
    license: normalizeLicense(row.license),
    demands: cleanList(row.demands),
    participants: cleanList(row.participants),
    powerStructures: cleanList(row.power_structures ?? row.powerStructures),
    tactics: cleanList(row.tactics),
    immediateConsequences: clean(row.immediate_consequences ?? row.immediateConsequences, 2400) || '',
    longTermImpact: clean(row.long_term_impact ?? row.longTermImpact, 2400) || '',
    repression: clean(row.repression, 1800) || '',
    humanCosts: clean(row.human_costs ?? row.humanCosts, 1800) || '',
    aftermath: clean(row.aftermath, 2400) || '',
    openQuestions: clean(row.open_questions ?? row.openQuestions, 1800) || '',
    bottomUpPressure: clean(row.bottom_up_pressure ?? row.bottomUpPressure, 2400) || '',
    achievement: clean(row.achievement, 2400) || '',
    limits: clean(row.limits, 2400) || '',
    relatedEventIds: cleanList(row.related_event_ids ?? row.relatedEventIds, 120, 40),
    voices: cleanList(row.voices, 800, 12),
    sourceType,
    sourceQuality,
    uncertainty: clean(row.uncertainty, 1200) || '',
    sensitivity: clean(row.sensitivity, 240) || '',
    reviewStatus: clean(row.review_status ?? row.reviewStatus, 120) || 'Ungeprüfter Bestandseintrag',
    translations: normalizeEventTranslations(row.translations, row),
    difficulty: Math.min(3, Math.max(1, Number(row.difficulty) || 1)),
    featured: Boolean(row.featured)
  };
  return event;
}

function normalizeProvenance(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return {
    sourceUrls: cleanList(value.sourceUrls, 1000, 12),
    checkedAt: clean(value.checkedAt, 20) || '',
    note: clean(value.note, 600) || ''
  };
}

function normalizeLicense(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return {
    status: LICENSE_STATUS_VALUES.has(value.status) ? value.status : 'rights-unclear',
    note: clean(value.note, 600) || ''
  };
}

export function resolveEventId(events, value) {
  const id = String(value || '').trim().toLowerCase();
  if (!id) return null;
  return events.find(event => event.id === id || event.aliases?.includes(id)) || null;
}

export function validateContractFields(row) {
  const issues = [];
  const schemaVersion = row.schemaVersion === undefined ? 1 : Number(row.schemaVersion);
  if (!Number.isInteger(schemaVersion) || schemaVersion < 1) issues.push('schemaVersion muss eine positive Ganzzahl sein');
  if (row.id !== undefined && !EVENT_ID_PATTERN.test(String(row.id))) issues.push('id muss dem stabilen ID-Format entsprechen');
  if (row.aliases !== undefined) {
    if (!Array.isArray(row.aliases)) issues.push('aliases muss eine Liste sein');
    else {
      const aliases = row.aliases.map(String);
      if (aliases.some(alias => !EVENT_ID_PATTERN.test(alias))) issues.push('aliases enthält eine ungültige ID');
      if (new Set(aliases).size !== aliases.length) issues.push('aliases enthält Duplikate');
      if (aliases.includes(String(row.id))) issues.push('aliases darf die kanonische ID nicht enthalten');
    }
  }
  if (row.coordinatePrecision !== undefined && !COORDINATE_PRECISION_VALUES.has(row.coordinatePrecision)) {
    issues.push('coordinatePrecision ist ungültig');
  }
  if (row.provenance !== undefined) {
    const value = row.provenance;
    if (!value || typeof value !== 'object' || Array.isArray(value)) issues.push('provenance muss ein Objekt sein');
    else {
      if (!Array.isArray(value.sourceUrls) || !value.sourceUrls.length) issues.push('provenance.sourceUrls muss eine nichtleere Liste sein');
      else if (value.sourceUrls.some(url => typeof url !== 'string' || !/^https:\/\//.test(url))) issues.push('provenance.sourceUrls muss HTTPS verwenden');
      if (value.checkedAt && !/^\d{4}-\d{2}-\d{2}$/.test(value.checkedAt)) issues.push('provenance.checkedAt muss YYYY-MM-DD verwenden');
    }
  }
  if (row.license !== undefined) {
    if (!row.license || typeof row.license !== 'object' || Array.isArray(row.license)) issues.push('license muss ein Objekt sein');
    else if (!LICENSE_STATUS_VALUES.has(row.license.status)) issues.push('license.status ist ungültig');
  }
  if (row.reviewStatus === 'Redaktionell vertieft' && (!row.provenance || !row.license)) {
    issues.push('Redaktionell vertieft benötigt provenance und license');
  }
  return issues;
}

export function validateRoutes(raw, canonicalIds) {
  const issues = [];
  const routeIds = new Set();
  for (const [index, route] of (raw?.routes || []).entries()) {
    const label = `routes[${index}]`;
    if (!EVENT_ID_PATTERN.test(String(route.id || ''))) issues.push(`${label}: ungültige ID`);
    if (routeIds.has(route.id)) issues.push(`${label}: doppelte ID`);
    routeIds.add(route.id);
    if (!route.title || !route.description || !route.sourceNote) issues.push(`${label}: Titel, Beschreibung und Quellenhinweis sind erforderlich`);
    if (!Array.isArray(route.eventIds) || route.eventIds.length < 3) issues.push(`${label}: mindestens drei Stopps erforderlich`);
    else {
      if (new Set(route.eventIds).size !== route.eventIds.length) issues.push(`${label}: doppelte Stopps`);
      for (const eventId of route.eventIds) if (!canonicalIds.has(eventId)) issues.push(`${label}: unbekannte oder nicht-kanonische Event-ID ${eventId}`);
    }
    if (route.sensitivityMode !== 'neutral-progress') issues.push(`${label}: sensible Routen benötigen neutral-progress`);
  }
  return issues;
}

export function validateMapTaxonomy(raw) {
  const issues = [];
  if (raw?.schemaVersion !== 1) issues.push('map-taxonomy: schemaVersion muss 1 sein');
  const time = raw?.time || {};
  if (![time.minimum, time.maximum, time.defaultFrom, time.defaultTo].every(Number.isFinite)) issues.push('map-taxonomy: Zeitgrenzen fehlen');
  else if (!(time.minimum <= time.defaultFrom && time.defaultFrom <= time.defaultTo && time.defaultTo <= time.maximum)) issues.push('map-taxonomy: Zeitgrenzen sind inkonsistent');
  for (const [kind, rows] of [['layers', raw?.layers], ['tactics', raw?.tactics], ['mapStyles', raw?.mapStyles]]) {
    if (!Array.isArray(rows) || !rows.length) { issues.push(`map-taxonomy: ${kind} fehlt`); continue; }
    const ids = rows.map(row => row?.id);
    if (ids.some(id => !EVENT_ID_PATTERN.test(String(id || ''))) || new Set(ids).size !== ids.length) issues.push(`map-taxonomy: ${kind} enthält ungültige oder doppelte IDs`);
  }
  if (raw?.layers?.some(row => !row.labelKey || !Array.isArray(row.terms) || !row.terms.length)) issues.push('map-taxonomy: Layer benötigen labelKey und terms');
  if (raw?.tactics?.some(row => !row.labelKey || !row.symbol || !Array.isArray(row.terms) || !row.terms.length)) issues.push('map-taxonomy: Taktiken benötigen labelKey, symbol und terms');
  if (raw?.mapStyles?.some(row => !MAP_STYLE_VALUES.has(row.id) || row.basemap !== 'carto-dark' || !row.labelKey)) issues.push('map-taxonomy: Kartenstile sind ungültig');
  if (!Number.isInteger(raw?.network?.maximumNodes) || raw.network.maximumNodes < 1 || raw.network.maximumNodes > 100) issues.push('map-taxonomy: Knotengrenze muss eine positive Ganzzahl bis 100 sein');
  if (!Number.isInteger(raw?.network?.maximumEdges) || raw.network.maximumEdges < 1 || raw.network.maximumEdges > 250) issues.push('map-taxonomy: Kantengrenze muss eine positive Ganzzahl bis 250 sein');
  return issues;
}

export function validateRelations(raw, canonicalIds, routeIds = new Set()) {
  const issues = [];
  const ids = new Set();
  const relationKeys = new Set();
  if (raw?.schemaVersion !== 1 || !Array.isArray(raw?.relations)) return ['relations.json: ungültige Struktur'];
  raw.relations.forEach((relation, index) => {
    const label = `relations[${index}]`;
    if (!EVENT_ID_PATTERN.test(String(relation.id || '')) || ids.has(relation.id)) issues.push(`${label}: ungültige oder doppelte ID`);
    ids.add(relation.id);
    const endpoints = [relation.from, relation.to].sort().join('|');
    const relationKey = `${endpoints}|${relation.relationType}|${relation.contextId}`;
    if (relationKeys.has(relationKey)) issues.push(`${label}: doppelte Beziehung`);
    relationKeys.add(relationKey);
    if (!canonicalIds.has(relation.from) || !canonicalIds.has(relation.to) || relation.from === relation.to) issues.push(`${label}: ungültige Event-Referenz`);
    if (!RELATION_TYPE_VALUES.has(relation.relationType)) issues.push(`${label}: ungültiger relationType`);
    if (!RELATION_EVIDENCE_VALUES.has(relation.evidenceMode)) issues.push(`${label}: ungültiger evidenceMode`);
    if (!EVENT_ID_PATTERN.test(String(relation.contextId || ''))) issues.push(`${label}: contextId fehlt`);
    if (relation.relationType === 'same-route' && !routeIds.has(relation.contextId)) issues.push(`${label}: unbekannte Route`);
    if (relation.evidenceMode === 'sourced-relation' && !/^https:\/\//.test(relation.sourceUrl || '')) issues.push(`${label}: sourced-relation benötigt sourceUrl`);
    if (relation.relationType === 'editorial-relation' && relation.evidenceMode !== 'sourced-relation') issues.push(`${label}: editorial-relation benötigt sourced-relation`);
  });
  return issues;
}

export function classifyEventLayers(event, definitions = []) {
  const terms = new Set([event.category, ...(event.tags || [])].filter(Boolean).map(value => String(value).toLocaleLowerCase('de')));
  return definitions.filter(layer => layer.terms.some(term => terms.has(String(term).toLocaleLowerCase('de')))).map(layer => layer.id);
}

export function classifyEventTactics(event, definitions = []) {
  const haystack = [event.title, event.category, ...(event.tags || []), ...(event.tactics || []), event.description]
    .filter(Boolean).join(' ').toLocaleLowerCase('de');
  return definitions.filter(tactic => tactic.terms.some(term => haystack.includes(String(term).toLocaleLowerCase('de')))).map(tactic => tactic.id);
}

export function normalizeTimeRange(from, to, minimum = -1200, maximum = 2030) {
  const rawFrom = Number(from);
  const rawTo = Number(to);
  const safeFrom = Number.isFinite(rawFrom) ? Math.max(minimum, Math.min(maximum, rawFrom)) : minimum;
  const safeTo = Number.isFinite(rawTo) ? Math.max(minimum, Math.min(maximum, rawTo)) : maximum;
  return { from: Math.min(safeFrom, safeTo), to: Math.max(safeFrom, safeTo) };
}

export function buildNetworkModel(events, relations, maximumNodes = 72, maximumEdges = 140) {
  const eventById = new Map(events.map(event => [event.id, event]));
  const eligibleEdges = relations.filter(relation => eventById.has(relation.from) && eventById.has(relation.to)).slice(0, maximumEdges);
  const connectedIds = [...new Set(eligibleEdges.flatMap(relation => [relation.from, relation.to]))];
  const remainingIds = events.map(event => event.id).filter(id => !connectedIds.includes(id));
  const selectedIds = new Set([...connectedIds, ...remainingIds].slice(0, maximumNodes));
  return {
    nodes: [...selectedIds].map(id => eventById.get(id)).filter(Boolean),
    edges: eligibleEdges.filter(relation => selectedIds.has(relation.from) && selectedIds.has(relation.to)),
    truncated: events.length > selectedIds.size,
    totalEvents: events.length
  };
}

export function validateEditorialFields(row) {
  const issues = [...validateContractFields(row)];
  for (const field of EDITORIAL_LIST_FIELDS) {
    if (row[field] !== undefined && !Array.isArray(row[field]) && typeof row[field] !== 'string') issues.push(`${field} muss Text oder eine Textliste sein`);
    if (Array.isArray(row[field]) && row[field].some(item => {
      const value = typeof item === 'string' ? item : item?.text;
      return typeof value !== 'string' || !value.trim();
    })) issues.push(`${field} enthält einen leeren oder ungültigen Eintrag`);
  }
  for (const field of EDITORIAL_TEXT_FIELDS) {
    if (row[field] !== undefined && typeof row[field] !== 'string') issues.push(`${field} muss Text sein`);
    if (typeof row[field] === 'string' && !row[field].trim()) issues.push(`${field} darf nicht leer sein`);
  }
  const sourceType = row.sourceType ?? row.source_type;
  const sourceQuality = row.sourceQuality ?? row.source_quality;
  const reviewStatus = row.reviewStatus ?? row.review_status;
  if (Boolean(sourceType) !== Boolean(sourceQuality)) issues.push('sourceType und sourceQuality müssen gemeinsam gepflegt werden');
  if (row.voices !== undefined && !(row.sourceUrl ?? row.source_url)) issues.push('voices benötigt eine belegende sourceUrl');
  if (reviewStatus === 'Redaktioneller Pilotstand' && (!sourceType || !sourceQuality)) issues.push('Redaktioneller Pilotstand benötigt sourceType und sourceQuality');
  if (row.translations !== undefined) {
    if (!row.translations || typeof row.translations !== 'object' || Array.isArray(row.translations)) {
      issues.push('translations muss ein Sprachobjekt sein');
    } else {
      for (const [language, fields] of Object.entries(row.translations)) {
        if (!EVENT_TRANSLATION_LANGUAGES.has(language)) issues.push(`translations enthält eine nicht unterstützte Sprache: ${language}`);
        if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
          issues.push(`translations.${language} muss ein Feldobjekt sein`);
          continue;
        }
        for (const [field, entry] of Object.entries(fields)) {
          if (!EVENT_TRANSLATION_FIELDS.has(field)) issues.push(`translations.${language}.${field} ist kein übersetzbares Feld`);
          if (!entry || typeof entry !== 'object' || Array.isArray(entry) || !['draft', 'reviewed', 'stale'].includes(entry.status)) {
            issues.push(`translations.${language}.${field} benötigt status draft, reviewed oder stale`);
            continue;
          }
          const source = row[field];
          if ((Array.isArray(source) && !source.length) || (!Array.isArray(source) && !(typeof source === 'string' && source.trim()))) {
            issues.push(`translations.${language}.${field} hat kein vorhandenes Ausgangsfeld`);
            continue;
          }
          if (!translationTextMatchesShape(source, entry.text)) issues.push(`translations.${language}.${field} muss Typ und Listenlänge des Ausgangsfelds bewahren`);
          const targetParts = Array.isArray(entry.text) ? entry.text : [entry.text];
          if (targetParts.some(unsafeTranslationText)) issues.push(`translations.${language}.${field} benötigt NFC-Text ohne Bidi-Steuerzeichen oder HTML`);
          if (!translationHasMatchingPlaceholders(source, entry.text)) issues.push(`translations.${language}.${field} muss alle Platzhalter unverändert bewahren`);
          if (JSON.stringify(source) === JSON.stringify(entry.text) && !(typeof entry.preserveReason === 'string' && entry.preserveReason.trim())) issues.push(`translations.${language}.${field} benötigt bei identischem Text eine preserveReason`);
          if (entry.status === 'reviewed' && !translationEntryHasReviewProof(entry)) issues.push(`translations.${language}.${field} benötigt vollständigen menschlichen Reviewnachweis für Policy ${TRANSLATION_POLICY_VERSION}`);
          if (entry.status === 'reviewed' && translationEntryHasReviewProof(entry) && entry.sourceDigest !== translationSourceDigest(source)) issues.push(`translations.${language}.${field} ist stale: sourceDigest stimmt nicht mit dem aktuellen Ausgangsfeld überein`);
          if (entry.status === 'reviewed' && isIdentitySensitiveTranslation(row) && !(typeof entry.subjectMatterReviewer === 'string' && entry.subjectMatterReviewer.trim().length >= 2)) issues.push(`translations.${language}.${field} benötigt für sensible oder identitätsbezogene Inhalte einen Fachreview`);
        }
      }
    }
  }
  return issues;
}

export function isValidEvent(event) {
  if (event.coordinatePrecision === 'hidden') {
    return !Number.isFinite(event.longitude) && !Number.isFinite(event.latitude);
  }
  return Number.isFinite(event.longitude) && Number.isFinite(event.latitude)
    && event.longitude >= -180 && event.longitude <= 180
    && event.latitude >= -90 && event.latitude <= 90;
}

export function filterEvents(events, filters, discoveredIds = new Set()) {
  const query = String(filters.query || '').trim();
  const fromValue = Number(filters.from);
  const toValue = Number(filters.to);
  const from = Number.isFinite(fromValue) ? fromValue : -Infinity;
  const to = Number.isFinite(toValue) ? toValue : Infinity;
  const selectedLayers = new Set(Array.isArray(filters.layers) ? filters.layers : []);

  return events.filter(event => {
    const haystack = [event.title, event.location, event.country, event.category, ...event.tags, event.description, event.significance, event.yearStart, event.yearEnd].join(' ');
    const undated = !Number.isFinite(event.yearStart);
    const eventStart = undated ? null : event.yearStart;
    const eventEnd = undated ? null : (event.yearEnd ?? eventStart);

    return matchesTolerantSearch(haystack, query)
      && (filters.category === 'all' || event.category === filters.category || event.tags.includes(filters.category))
      && (!selectedLayers.size || event.layerIds?.some(id => selectedLayers.has(id)))
      && (undated ? filters.includeUndated !== false : eventStart <= to && eventEnd >= from)
      && (!filters.undiscoveredOnly || !discoveredIds.has(event.id));
  });
}

export function xpForLevel(level) {
  return 50 * Math.max(0, level - 1) * Math.max(1, level);
}

export function levelFromXp(xp) {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level += 1;
  return level;
}

export function levelProgress(xp) {
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const ceiling = xpForLevel(level + 1);
  return { level, percent: Math.round(((xp - floor) / (ceiling - floor)) * 100), nextAt: ceiling };
}

export function formatYearRange(event) {
  if (event.dateLabel) return event.dateLabel;
  if (!event.yearStart) return 'undatiert';
  if (event.yearStart < 0) return `ca. ${Math.abs(event.yearStart).toLocaleString('de-DE')} Jahre vor heute`;
  if (!event.yearEnd || event.yearStart === event.yearEnd) return String(event.yearStart);
  return `${event.yearStart}–${event.yearEnd}`;
}

export function hashSeed(seed) {
  return String(seed).split('').reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0) >>> 0;
}

export function seededShuffle(items, seed = Date.now()) {
  let state = hashSeed(seed) || 1;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function createMission(events, seed = Date.now()) {
  const playableEvents = events.filter(event => !isSensitiveEvent(event));
  const eligibleCategories = [...new Set(playableEvents.map(event => event.category))]
    .filter(category => playableEvents.filter(event => event.category === category).length >= 3);
  const category = seededShuffle(eligibleCategories, `${seed}-category`)[0];
  const pool = category ? playableEvents.filter(event => event.category === category) : playableEvents;
  const targets = seededShuffle(pool, `${seed}-targets`).slice(0, Math.min(3, pool.length));
  return {
    id: `mission-${hashSeed(seed)}`,
    title: category ? `${category} kartieren` : 'Verborgene Spuren',
    description: category
      ? `Sichere ${targets.length} Spuren aus der Kategorie „${category}“ für dein Archiv.`
      : `Sichere ${targets.length} neue Spuren für dein Archiv.`,
    category: category || null,
    targetIds: targets.map(event => event.id),
    completedIds: [],
    goal: targets.length,
    reward: Math.max(40, targets.length * 20),
    complete: false
  };
}

const movementTerms = event => [...new Set([event.category, ...(event.tags || [])].filter(Boolean))];

export function createConnection(events, seed = Date.now()) {
  if (!Array.isArray(events) || events.length < 2) return null;
  const shuffled = seededShuffle(events, String(seed) + '-first');
  for (const first of shuffled) {
    const firstTerms = new Set(movementTerms(first));
    const candidates = events
      .filter(event => event.id !== first.id)
      .map(event => ({ event, sharedTags: movementTerms(event).filter(term => firstTerms.has(term)) }))
      .filter(item => item.sharedTags.length)
      .sort((a, b) => b.sharedTags.length - a.sharedTags.length);
    if (!candidates.length) continue;
    const bestScore = candidates[0].sharedTags.length;
    const second = seededShuffle(candidates.filter(item => item.sharedTags.length === bestScore), String(seed) + '-second')[0];
    const centuriesApart = Math.abs((first.yearStart || 0) - (second.event.yearStart || 0)) >= 500;
    const continentsApart = first.continent !== second.event.continent;
    const headline = continentsApart
      ? 'Internationale der unerwarteten Tabs'
      : centuriesApart
        ? 'Zeitreise ohne Genehmigungsformular'
        : 'Verdächtig solidarische Parallelentwicklung';
    return {
      id: 'connection-' + hashSeed([first.id, second.event.id].sort().join('|')),
      eventIds: [first.id, second.event.id],
      sharedTags: second.sharedTags,
      headline,
      insight: first.title + ' und ' + second.event.title + ' verbindet: ' + second.sharedTags.slice(0, 3).join(', ') + '.'
    };
  }
  return null;
}

export function solidarityResult(previous, current, currentCombo = 0) {
  if (!previous || !current || previous.id === current.id) return { combo: 1, bonusXp: 0, sharedTags: [] };
  const previousTerms = new Set(movementTerms(previous));
  const sharedTags = movementTerms(current).filter(term => previousTerms.has(term));
  const combo = sharedTags.length ? Math.max(2, Number(currentCombo || 0) + 1) : 1;
  return { combo, bonusXp: combo > 1 ? Math.min(24, combo * 3) : 0, sharedTags };
}

const POWER_EXCUSES = [
  '„Jetzt ist wirklich nicht der richtige Zeitpunkt.“',
  '„Dafür müsste zuerst eine Kommission ohne Betroffene gegründet werden.“',
  '„Die Forderung ist gleichzeitig zu radikal, zu unklar und erstaunlich laut.“',
  '„Leider erlaubt das Budget nur Repression und einen neuen Imagefilm.“',
  '„Man habe die Anliegen gehört – allerdings durch eine sehr dicke Palasttür.“',
  '„Einzelfall. Sehr viele Einzelfälle. Rein zufällig gemeinsam organisiert.“'
];

export function createPowerExcuse(event, seed = Date.now()) {
  const excuse = seededShuffle(POWER_EXCUSES, String(seed) + '-excuse')[0];
  return {
    excuse,
    counter: event
      ? 'Historische Gegenprobe: ' + event.title + ' zeigt, dass Warten selten die Lieblingsstrategie der Betroffenen war.'
      : 'Historische Gegenprobe: Kollektives Handeln wartet selten auf eine höfliche Einladung.'
  };
}

export function createQuiz(event, allEvents, seed = Date.now()) {
  const useYear = Boolean(event.yearStart && event.yearStart > 0);
  if (useYear) {
    const alternativeYears = [...new Set(allEvents.map(item => item.yearStart).filter(year => year && year !== event.yearStart))];
    const distractors = seededShuffle(alternativeYears, `${seed}-years`).slice(0, 3);
    return {
      question: `Wann begann „${event.title}“?`,
      answer: event.yearStart,
      options: seededShuffle([event.yearStart, ...distractors], `${seed}-options`).slice(0, 4).map(String)
    };
  }
  const categories = [...new Set(allEvents.map(item => item.category).filter(category => category !== event.category))];
  const distractors = seededShuffle(categories, `${seed}-categories`).slice(0, 3);
  return {
    question: `Zu welcher Bewegung gehört „${event.title}“?`,
    answer: event.category,
    options: seededShuffle([event.category, ...distractors], `${seed}-options`).slice(0, 4)
  };
}
