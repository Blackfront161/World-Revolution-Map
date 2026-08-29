const PRECISION_LEVELS = new Set(['exact', 'approximate', 'region', 'hidden']);
const SAFE_MEDIA_HOSTS = new Set(['upload.wikimedia.org']);

export function eventFocusPolicy(event, { sensitive = false, reducedMotion = false } = {}) {
  const precision = PRECISION_LEVELS.has(event?.coordinatePrecision) ? event.coordinatePrecision : 'region';
  const publicZoom = { exact: 9, approximate: 6, region: 3.2, hidden: 1.7 }[precision];
  const sensitiveMaximum = { exact: 5, approximate: 4.5, region: 3, hidden: 1.7 }[precision];
  return {
    precision,
    zoom: sensitive ? Math.min(publicZoom, sensitiveMaximum) : publicZoom,
    duration: reducedMotion ? 0 : precision === 'hidden' ? 700 : precision === 'region' ? 900 : 1100,
    essential: false
  };
}

export function selectedEventFilter(eventId) {
  return ['all', ['!', ['has', 'point_count']], ['==', ['get', 'id'], typeof eventId === 'string' ? eventId : '']];
}

// Camera-only depth: never introduces terrain data or changes location precision.
export function mapPerspectivePolicy({ enabled = false, mobile = false, reducedMotion = false, sensitive = false, precision = 'exact' } = {}) {
  const canTilt = enabled === true && !reducedMotion && !sensitive && ['exact', 'approximate'].includes(precision);
  return { pitch: canTilt ? (mobile ? 20 : 28) : 0, bearing: 0, duration: reducedMotion ? 0 : 650, essential: false };
}

export function sanitizeEventVisualMedia(value) {
  if (!value || typeof value !== 'object' || value.reviewStatus !== 'rights-reviewed') return null;
  try {
    const url = new URL(value.url);
    const sourceUrl = new URL(value.sourceUrl);
    if (url.protocol !== 'https:' || !SAFE_MEDIA_HOSTS.has(url.hostname)) return null;
    if (sourceUrl.protocol !== 'https:' || sourceUrl.hostname !== 'commons.wikimedia.org' || !sourceUrl.pathname.startsWith('/wiki/File:')) return null;
    const alt = String(value.alt || '').trim();
    const credit = String(value.credit || '').trim();
    const license = String(value.license || '').trim();
    if (!alt || !credit || !license) return null;
    return { url: url.href, sourceUrl: sourceUrl.href, alt: alt.slice(0, 240), credit: credit.slice(0, 240), license: license.slice(0, 120) };
  } catch {
    return null;
  }
}

export function visualFocusModel(event, { yearLabel = '', tacticSymbol = '✦', categoryLabel = '' } = {}) {
  const media = sanitizeEventVisualMedia(event?.visualMedia);
  return media
    ? { mode: 'image', media, yearLabel: String(yearLabel), categoryLabel: String(categoryLabel) }
    : { mode: 'symbol', symbol: String(tacticSymbol || '✦').slice(0, 3), yearLabel: String(yearLabel), categoryLabel: String(categoryLabel) };
}
