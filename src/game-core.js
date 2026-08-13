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

const cleanList = (value, itemLength = 500, maxItems = 24) => {
  const list = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/\s*;\s*/) : [];
  return [...new Set(list.map(item => clean(typeof item === 'object' ? item?.text : item, itemLength)).filter(Boolean))].slice(0, maxItems);
};

export function isSensitiveEvent(event) {
  const marker = String(event?.sensitivity || '').toLocaleLowerCase('de');
  return Boolean(marker) && !['nein', 'none', 'keine', 'low', 'niedrig'].includes(marker);
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
    difficulty: Math.min(3, Math.max(1, Number(row.difficulty) || 1)),
    featured: Boolean(row.featured)
  };
  return event;
}

export function validateEditorialFields(row) {
  const issues = [];
  for (const field of EDITORIAL_LIST_FIELDS) {
    if (row[field] !== undefined && !Array.isArray(row[field]) && typeof row[field] !== 'string') issues.push(`${field} muss Text oder eine Textliste sein`);
  }
  for (const field of EDITORIAL_TEXT_FIELDS) {
    if (row[field] !== undefined && typeof row[field] !== 'string') issues.push(`${field} muss Text sein`);
  }
  if (Array.isArray(row.voices) && row.voices.some(item => typeof item !== 'string' && typeof item?.text !== 'string')) issues.push('voices enthält einen ungültigen Eintrag');
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
