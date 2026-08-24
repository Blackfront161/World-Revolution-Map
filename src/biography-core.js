import { EVENT_ID_PATTERN } from './game-core.js';

export const BIOGRAPHY_ID_PATTERN = /^bio-[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const BIOGRAPHY_REVIEW_VALUES = new Set(['draft', 'reviewed', 'deep-reviewed']);
export const BIOGRAPHY_SENSITIVITY_VALUES = new Set(['standard', 'contextual', 'sensitive']);
export const BIOGRAPHY_SOURCE_TYPES = new Set(['primary', 'community', 'movement', 'archive', 'oral-history', 'museum', 'academic', 'public-institution', 'human-rights']);

const text = (value, maximum = 2000) => typeof value === 'string' ? value.trim().slice(0, maximum) : '';
const list = (value, maximum = 24) => Array.isArray(value) ? value.map(item => text(item, 500)).filter(Boolean).slice(0, maximum) : [];
const year = value => value === null || value === undefined || value === '' ? null : Number.isFinite(Number(value)) ? Number(value) : null;

const historicalYear = value => {
  if (value === null || value === undefined || value === '' || /^unknown$/i.test(String(value).trim())) return null;
  const match = String(value).match(/-?\d{3,4}/);
  return match ? Number(match[0]) : null;
};

const normalizeReview = value => {
  const raw = text(value?.status ?? value, 120).toLowerCase();
  if (raw.includes('vertieft')) return 'deep-reviewed';
  if (raw.includes('geprüft') || raw.includes('reviewed') || raw.includes('pilotstand')) return 'reviewed';
  return 'draft';
};

const normalizeSensitivity = value => {
  const raw = text(value?.level ?? value, 80).toLowerCase();
  if (raw === 'hoch' || raw === 'high' || raw === 'sensitive') return 'sensitive';
  if (raw === 'mittel' || raw === 'medium' || raw === 'contextual') return 'contextual';
  return 'standard';
};

const normalizeSourceType = value => {
  const raw = text(value, 120).toLowerCase();
  if (/primär|primary/.test(raw)) return 'primary';
  if (/oral|mündlich/.test(raw)) return 'oral-history';
  if (/bewegung|movement/.test(raw)) return 'movement';
  if (/indigen|community|gemeinschaft|organisation/.test(raw)) return 'community';
  if (/archiv|archive|forschungsführer/.test(raw)) return 'archive';
  if (/museum|sammlung|collection/.test(raw)) return 'museum';
  if (/wissenschaft|universität|university|biografie|biography/.test(raw)) return 'academic';
  if (/menschenrecht|human.right/.test(raw)) return 'human-rights';
  return 'public-institution';
};

export function normalizeBiography(row = {}, defaults = {}) {
  const birthRaw = row.birthYear ?? row.yearBirth ?? row.birth?.date ?? row.birth;
  const deathRaw = row.deathYear ?? row.yearDeath ?? row.death?.date ?? row.death;
  const rawSources = row.sources ?? row.sourceRefs;
  const rawReview = row.reviewStatus ?? row.review;
  const rawSensitivity = row.sensitivity;
  return {
    id: text(row.id, 120),
    name: text(row.name ?? row.displayName ?? row.personName, 180),
    selfName: text(row.selfName ?? row.selfDesignation, 180),
    searchAliases: list(row.searchAliases, 16),
    birthYear: historicalYear(birthRaw),
    deathYear: historicalYear(deathRaw),
    dateLabel: text(row.dateLabel, 120) || (text(birthRaw, 80) || text(deathRaw, 80) ? `${text(birthRaw, 80) || 'unknown'}–${text(deathRaw, 80) || 'unknown'}` : ''),
    regions: list(row.regions ?? row.region ?? row.places, 12),
    communities: list(row.communities ?? row.community, 12),
    traditions: list(row.traditions ?? row.tradition, 16).length ? list(row.traditions ?? row.tradition, 16) : list([defaults.defaultTradition], 1),
    summary: text(row.summary ?? row.shortBiography ?? row.shortDescription, 2400),
    lifePhases: Array.isArray(row.lifePhases ?? row.lifeStages) ? (row.lifePhases ?? row.lifeStages).slice(0, 24).map(phase => ({
      id: text(phase?.id, 120),
      title: text(phase?.title, 180),
      period: text(phase?.period ?? phase?.dateLabel, 120),
      startYear: year(phase?.startYear),
      endYear: year(phase?.endYear),
      description: text(phase?.description, 1600)
    })) : [],
    ideasAndPractice: list(row.ideasAndPractice ?? row.ideasAndPractices ?? row.ideas, 24),
    organizingAndAchievements: list(row.organizingAndAchievements ?? row.organizing, 24),
    repressionAndRisks: list(row.repressionAndRisks ?? row.repression, 24),
    tensionsAndCriticism: list(row.tensionsAndCriticism ?? row.tensionsAndCritique ?? row.tensions, 24),
    legacy: text(row.legacy, 2000),
    relatedEventIds: Array.isArray(row.relatedEventIds) ? [...new Set(row.relatedEventIds.map(value => text(value, 120)).filter(Boolean))].slice(0, 40) : [],
    reviewStatus: normalizeReview(rawReview),
    reviewLabel: text(rawReview?.status ?? rawReview, 120),
    reviewedAt: text(rawReview?.reviewedAt, 10),
    sensitivity: normalizeSensitivity(rawSensitivity),
    sensitivityRule: text(rawSensitivity?.displayRule, 500),
    provenance: row.provenance && typeof row.provenance === 'object' ? { method: text(row.provenance.method, 1000), sourcePolicy: text(row.provenance.sourcePolicy, 1000), checkedAt: text(row.provenance.checkedAt ?? rawReview?.reviewedAt, 10), quotationPolicy: text(row.provenance.quotationPolicy, 500) } : {},
    license: text(row.license?.status ?? row.license, 500),
    licenseNotice: text(row.license?.notice, 1000),
    sources: Array.isArray(rawSources) ? rawSources.slice(0, 24).map(source => ({
      url: text(source?.url, 800),
      publisher: text(source?.publisher, 180),
      language: text(source?.language, 20).toLowerCase(),
      type: normalizeSourceType(source?.type),
      typeLabel: text(source?.type, 160),
      accessedAt: text(source?.accessedAt, 10),
      title: text(source?.title, 240)
    })) : []
  };
}

export function validateBiography(row, canonicalEventIds = new Set(), defaults = {}) {
  const issues = [];
  if (!row || typeof row !== 'object' || Array.isArray(row)) return ['Biografie muss ein Objekt sein'];
  if ('coordinates' in row || 'latitude' in row || 'longitude' in row || 'lat' in row || 'lng' in row) issues.push('Biografien dürfen keine Koordinaten enthalten');
  if ('quotes' in row || 'quote' in row || 'voices' in row) issues.push('Biografien führen keine unbelegten Zitatfelder');
  const bio = normalizeBiography(row, defaults);
  if (row.searchAliases !== undefined && (!Array.isArray(row.searchAliases) || row.searchAliases.length > 16 || row.searchAliases.some(alias => typeof alias !== 'string' || !alias.trim() || alias.length > 180))) issues.push('searchAliases muss eine begrenzte Liste kuratierter Namen sein');
  if (new Set(bio.searchAliases.map(alias => alias.toLocaleLowerCase())).size !== bio.searchAliases.length) issues.push('searchAliases enthält Duplikate');
  if (!BIOGRAPHY_ID_PATTERN.test(bio.id)) issues.push('id muss eine stabile bio-* ID sein');
  if (!bio.name) issues.push('name fehlt');
  if (!bio.summary) issues.push('summary fehlt');
  if (!bio.regions.length) issues.push('regions fehlt');
  if (!bio.traditions.length) issues.push('traditions fehlt');
  if (!bio.lifePhases.length || bio.lifePhases.some(phase => !phase.description || (!phase.period && phase.startYear === null))) issues.push('lifePhases benötigen Beschreibung und Zeitraum');
  if (!bio.ideasAndPractice.length) issues.push('ideasAndPractice fehlt');
  if (!bio.organizingAndAchievements.length) issues.push('organizingAndAchievements fehlt');
  if (!bio.tensionsAndCriticism.length) issues.push('tensionsAndCriticism fehlt');
  if (!bio.legacy) issues.push('legacy fehlt');
  if (!BIOGRAPHY_REVIEW_VALUES.has(bio.reviewStatus) || bio.reviewStatus === 'draft') issues.push('reviewStatus ist nicht redaktionell geprüft');
  if (!BIOGRAPHY_SENSITIVITY_VALUES.has(bio.sensitivity)) issues.push('sensitivity ist nicht kontrolliert');
  if (!bio.sensitivityRule) issues.push('sensitivity.displayRule fehlt');
  if (!bio.provenance.method || !/^\d{4}-\d{2}-\d{2}$/.test(bio.provenance.checkedAt)) issues.push('provenance benötigt method und checkedAt');
  if (!bio.license) issues.push('license fehlt');
  const licenseText = typeof row.license === 'string' ? row.license : [row.license?.status, row.license?.name].filter(Boolean).join(' ');
  if (/\bcc\s*by\b/i.test(licenseText)) {
    const completeClaim = row.license && typeof row.license === 'object'
      && typeof row.license.licensor === 'string' && row.license.licensor.trim()
      && /^https:\/\//.test(row.license.url || '')
      && typeof row.license.scope === 'string' && row.license.scope.trim();
    if (!completeClaim) issues.push('CC-BY-Behauptung benötigt Lizenzgeber, HTTPS-Link und eindeutigen Umfang');
  }
  if (bio.birthYear !== null && bio.deathYear !== null && bio.birthYear > bio.deathYear) issues.push('Lebensdaten sind inkonsistent');
  if (bio.sources.length < 2) issues.push('mindestens zwei Quellen sind erforderlich');
  bio.sources.forEach((source, index) => {
    if (!/^https:\/\//.test(source.url)) issues.push(`sources[${index}].url muss HTTPS sein`);
    if (!source.publisher || !source.language || !BIOGRAPHY_SOURCE_TYPES.has(source.type)) issues.push(`sources[${index}] benötigt publisher, language und kontrollierten type`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.accessedAt)) issues.push(`sources[${index}].accessedAt muss YYYY-MM-DD sein`);
  });
  bio.relatedEventIds.forEach(id => {
    if (!EVENT_ID_PATTERN.test(id) || !canonicalEventIds.has(id)) issues.push(`relatedEventIds enthält unbekannte oder nicht-kanonische ID ${id}`);
  });
  return issues;
}

export function biographyYearLabel(bio, unknownLabel = 'nicht sicher überliefert') {
  if (bio.dateLabel) {
    const parts = bio.dateLabel.split(/\s*[–—]\s*/);
    if (parts.length === 2) {
      return parts.map(part => !part.trim() || /^unknown$/i.test(part.trim()) ? unknownLabel : part.trim()).join('–');
    }
    return /^unknown$/i.test(bio.dateLabel.trim()) ? unknownLabel : bio.dateLabel.replace(/\bunknown\b/gi, unknownLabel);
  }
  if (bio.birthYear === null && bio.deathYear === null) return unknownLabel;
  const from = bio.birthYear ?? unknownLabel;
  const to = bio.deathYear ?? unknownLabel;
  return `${from}–${to}`;
}

export function filterBiographies(biographies, filters = {}, normalize = value => String(value || '').toLowerCase()) {
  const query = normalize(filters.query || '');
  const region = filters.region || 'all';
  const tradition = filters.tradition || 'all';
  const from = Number.isFinite(Number(filters.from)) ? Number(filters.from) : -Infinity;
  const to = Number.isFinite(Number(filters.to)) ? Number(filters.to) : Infinity;
  return biographies.filter(bio => {
    const haystack = normalize([bio.name, bio.selfName, ...bio.searchAliases, bio.summary, ...bio.regions, ...bio.communities, ...bio.traditions].join(' '));
    const bioStart = bio.birthYear ?? -Infinity;
    const bioEnd = bio.deathYear ?? Infinity;
    return (!query || query.split(' ').filter(Boolean).every(token => haystack.includes(token)))
      && (region === 'all' || bio.regions.includes(region) || bio.communities.includes(region))
      && (tradition === 'all' || bio.traditions.includes(tradition))
      && bioStart <= to && bioEnd >= from;
  });
}
