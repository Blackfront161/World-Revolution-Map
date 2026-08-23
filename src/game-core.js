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

const EDITORIAL_LIST_FIELDS = ['demands', 'participants', 'powerStructures', 'tactics', 'voices'];
const EDITORIAL_TEXT_FIELDS = [
  'immediateConsequences', 'longTermImpact', 'repression', 'humanCosts', 'aftermath',
  'openQuestions', 'sourceType', 'sourceQuality', 'uncertainty', 'sensitivity', 'reviewStatus'
];
const EVENT_TRANSLATION_FIELDS = new Set([
  'title', 'location', 'description', 'significance', 'clue',
  ...EDITORIAL_LIST_FIELDS, ...EDITORIAL_TEXT_FIELDS
]);
const EVENT_TRANSLATION_LANGUAGES = new Set(['en', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr']);
export const EVENT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const COORDINATE_PRECISION_VALUES = new Set(['exact', 'approximate', 'region', 'hidden']);
export const LICENSE_STATUS_VALUES = new Set(['rights-unclear', 'per-item', 'third-party-terms', 'public-domain', 'licensed']);

const cleanList = (value, itemLength = 500, maxItems = 24) => {
  const list = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/\s*;\s*/) : [];
  return [...new Set(list.map(item => clean(typeof item === 'object' ? item?.text : item, itemLength)).filter(Boolean))].slice(0, maxItems);
};

export function normalizeEventTranslations(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const translations = {};
  for (const [language, fields] of Object.entries(value)) {
    if (!EVENT_TRANSLATION_LANGUAGES.has(language) || !fields || typeof fields !== 'object' || Array.isArray(fields)) continue;
    const reviewed = {};
    for (const [field, entry] of Object.entries(fields)) {
      if (!EVENT_TRANSLATION_FIELDS.has(field) || !entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
      if (entry.status !== 'reviewed') continue;
      const text = Array.isArray(entry.text) ? cleanList(entry.text, 800) : clean(entry.text, 2400);
      if ((Array.isArray(text) && text.length) || (typeof text === 'string' && text)) reviewed[field] = { text, status: 'reviewed' };
    }
    if (Object.keys(reviewed).length) translations[language] = reviewed;
  }
  return translations;
}

export function localizeEvent(event, language = 'de') {
  const localized = { ...event };
  const reviewed = event?.translations?.[language] || {};
  const translatedFields = [];
  const originalFields = [...EVENT_TRANSLATION_FIELDS].filter(field => {
    const value = event?.[field];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  });
  for (const [field, entry] of Object.entries(reviewed)) {
    if (entry?.status !== 'reviewed' || !EVENT_TRANSLATION_FIELDS.has(field)) continue;
    localized[field] = Array.isArray(entry.text) ? [...entry.text] : entry.text;
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
  const longitude = Number(row.longitude ?? row.lng ?? row.coordinates?.[0]);
  const latitude = Number(row.latitude ?? row.lat ?? row.coordinates?.[1]);
  const title = clean(row.title, 160) || 'Unbekanntes Ereignis';
  const description = clean(row.description, 1400) || 'Für diesen Eintrag liegt noch kein Kurztext vor.';
  const yearStart = Number(row.year_start ?? row.yearStart ?? row.year ?? extractYear(description));
  const yearEnd = Number(row.year_end ?? row.yearEnd ?? yearStart);
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
    coordinatePrecision: COORDINATE_PRECISION_VALUES.has(row.coordinatePrecision) ? row.coordinatePrecision : '',
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
    voices: cleanList(row.voices, 800, 12),
    sourceType,
    sourceQuality,
    uncertainty: clean(row.uncertainty, 1200) || '',
    sensitivity: clean(row.sensitivity, 240) || '',
    reviewStatus: clean(row.review_status ?? row.reviewStatus, 120) || 'Ungeprüfter Bestandseintrag',
    translations: normalizeEventTranslations(row.translations),
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
          if (!entry || typeof entry !== 'object' || Array.isArray(entry) || entry.status !== 'reviewed') {
            issues.push(`translations.${language}.${field} benötigt status \"reviewed\"`);
            continue;
          }
          const validText = typeof entry.text === 'string' ? Boolean(entry.text.trim()) : Array.isArray(entry.text) && entry.text.length > 0 && entry.text.every(item => typeof item === 'string' && item.trim());
          if (!validText) issues.push(`translations.${language}.${field} benötigt geprüften Text`);
        }
      }
    }
  }
  return issues;
}

export function isValidEvent(event) {
  return Number.isFinite(event.longitude) && Number.isFinite(event.latitude)
    && event.longitude >= -180 && event.longitude <= 180
    && event.latitude >= -90 && event.latitude <= 90;
}

export function filterEvents(events, filters, discoveredIds = new Set()) {
  const query = String(filters.query || '').trim().toLocaleLowerCase('de');
  const from = Number(filters.from) || -Infinity;
  const to = Number(filters.to) || Infinity;

  return events.filter(event => {
    const haystack = [event.title, event.location, event.country, event.category, ...event.tags, event.description, event.significance, event.yearStart, event.yearEnd]
      .join(' ')
      .toLocaleLowerCase('de');
    const eventStart = event.yearStart ?? -Infinity;
    const eventEnd = event.yearEnd ?? eventStart;

    return (!query || haystack.includes(query))
      && (filters.category === 'all' || event.category === filters.category || event.tags.includes(filters.category))
      && eventStart <= to
      && eventEnd >= from
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
