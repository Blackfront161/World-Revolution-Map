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
  'Ereignis': '#c7d8cf'
};

const clean = value => typeof value === 'string' ? value.trim() : value;

export function extractYear(text = '') {
  const match = String(text).match(/(?:17|18|19|20)\d{2}/);
  return match ? Number(match[0]) : null;
}

export function normalizeEvent(row, index = 0) {
  const longitude = Number(row.longitude ?? row.lng ?? row.coordinates?.[0]);
  const latitude = Number(row.latitude ?? row.lat ?? row.coordinates?.[1]);
  const title = clean(row.title) || 'Unbekanntes Ereignis';
  const description = clean(row.description) || 'Für diesen Eintrag liegt noch kein Kurztext vor.';
  const yearStart = Number(row.year_start ?? row.yearStart ?? row.year ?? extractYear(description));
  const yearEnd = Number(row.year_end ?? row.yearEnd ?? yearStart);
  const rawId = row.id ?? `${title}-${yearStart || 'undatiert'}-${index}`;
  const tags = Array.isArray(row.tags)
    ? row.tags.map(clean).filter(Boolean)
    : typeof row.tags === 'string'
      ? row.tags.split(',').map(clean).filter(Boolean)
      : [];

  return {
    id: String(rawId).toLowerCase().replace(/[^a-z0-9äöüß]+/gi, '-').replace(/(^-|-$)/g, ''),
    title,
    location: clean(row.location) || 'Ort unbekannt',
    country: clean(row.country) || '',
    continent: clean(row.continent) || 'Weltweit',
    category: clean(row.category) || 'Ereignis',
    tags: [...new Set(tags)],
    description,
    significance: clean(row.significance ?? row.why_it_matters) || '',
    clue: clean(row.clue) || `Suche in der Nähe von ${clean(row.location) || 'diesem Ort'}.`,
    longitude,
    latitude,
    yearStart: Number.isFinite(yearStart) ? yearStart : null,
    yearEnd: Number.isFinite(yearEnd) ? yearEnd : Number.isFinite(yearStart) ? yearStart : null,
    dateLabel: clean(row.date_label ?? row.dateLabel) || '',
    imageApiUrl: clean(row.image_api_url ?? row.imageApiUrl ?? row.image_url) || '',
    imageUrl: clean(row.image ?? row.imageUrl) || '',
    imageAlt: clean(row.image_alt ?? row.imageAlt) || `Historische Darstellung: ${title}`,
    sourceUrl: clean(row.source_url ?? row.sourceUrl) || '',
    difficulty: Math.min(3, Math.max(1, Number(row.difficulty) || 1)),
    featured: Boolean(row.featured)
  };
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
  const eligibleCategories = [...new Set(events.map(event => event.category))]
    .filter(category => events.filter(event => event.category === category).length >= 3);
  const category = seededShuffle(eligibleCategories, `${seed}-category`)[0];
  const pool = category ? events.filter(event => event.category === category) : events;
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
