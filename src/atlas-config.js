const truthy = new Set(['1', 'true', 'yes', 'on']);
const falsy = new Set(['0', 'false', 'no', 'off']);

export function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (truthy.has(normalized)) return true;
  if (falsy.has(normalized)) return false;
  return fallback;
}

export function normalizeParentOrigin(value, baseUrl = 'https://atlas.invalid') {
  if (!value || value === '*' || value === 'null') return '';
  try {
    const url = new URL(String(value), baseUrl);
    const localDevelopment = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
    return url.protocol === 'https:' || localDevelopment ? url.origin : '';
  } catch {
    return '';
  }
}

export function normalizeAccent(value, fallback = '#65f3a6') {
  const candidate = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(candidate) ? candidate : fallback;
}

export function readRuntimeConfig(search = '', dataset = {}, baseUrl = 'https://atlas.invalid') {
  const params = new URLSearchParams(search);
  const embed = parseBoolean(params.get('embed') ?? dataset.embed, false);
  return Object.freeze({
    embed,
    showWelcome: parseBoolean(params.get('welcome') ?? dataset.welcome, !embed),
    useSupabase: parseBoolean(params.get('supabase') ?? dataset.supabase, false),
    parentOrigin: normalizeParentOrigin(params.get('parentOrigin') ?? dataset.parentOrigin, baseUrl),
    accent: normalizeAccent(params.get('accent') ?? dataset.accent),
    maxRemoteEvents: 2000
  });
}
