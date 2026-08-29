import { readFile } from 'node:fs/promises';
import { createI18n } from '../src/i18n.js';
import { directUiKeys } from './language-inventory.mjs';

const root = new URL('../', import.meta.url);
const readJson = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));

function stringsFrom(value, prefix = '') {
  if (typeof value === 'string') return [{ path: prefix, text: value }];
  if (Array.isArray(value)) return value.flatMap((item, index) => stringsFrom(item, `${prefix}.${index}`));
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) => stringsFrom(child, prefix ? `${prefix}.${key}` : key));
}

function compileRules(config) {
  return config.rules.map(rule => ({
    ...rule,
    regex: new RegExp(`(?<![\\p{L}])(?:${rule.pattern})(?![\\p{L}*])`, 'giu')
  }));
}

function scanText(locator, text, rules) {
  const findings = [];
  for (const rule of rules) {
    for (const match of text.matchAll(rule.regex)) findings.push({ locator, term: match[0], rule: rule.id, context: text.slice(Math.max(0, match.index - 80), match.index + match[0].length + 80) });
  }
  return findings;
}

const config = await readJson('data/inclusive-language-allowlist.json');
if (config.schemaVersion !== 1 || config.policyVersion !== '1.0.0' || !Array.isArray(config.exceptions) || !Array.isArray(config.exceptionGroups)) throw new Error('inclusive-language-allowlist.json: ungültige Struktur.');
const exceptions = [
  ...config.exceptions,
  ...config.exceptionGroups.flatMap(group => (group.items || []).flatMap(item => (item.terms || []).map(term => ({
    locator: item.locator, term, decision: group.decision, category: group.category, reason: group.reason
  }))))
];
const categories = new Set(config.allowedCategories || []);
for (const exception of exceptions) {
  if (!exception.locator || !exception.term || !['keep', 'manual'].includes(exception.decision) || !categories.has(exception.category) || typeof exception.reason !== 'string' || exception.reason.trim().length < 30) {
    throw new Error(`Ungültige Inclusive-Language-Ausnahme: ${JSON.stringify(exception)}`);
  }
}

const [eventCatalog, overrides, biographyCatalog, routes, i18nSource] = await Promise.all([
  readJson('data/event-catalog.json'), readJson('data/event-editorial-overrides.json'), readJson('data/biography-catalog.json'),
  readJson('data/routes.json'), readFile(new URL('src/i18n.js', root), 'utf8')
]);
const rules = compileRules(config);
const findings = [];

const uiKeys = directUiKeys(i18nSource, ['de']).de;
const de = createI18n({ search: '?lang=de' });
for (const key of uiKeys) findings.push(...scanText(`ui:${key}`, de.t(key), rules));

for (const route of routes.routes) for (const { path, text } of stringsFrom(route)) {
  if (['title', 'description', 'sourceNote'].includes(path)) findings.push(...scanText(`route:${route.id}:${path}`, text, rules));
}

for (const entry of biographyCatalog.files) {
  const biographies = await readJson(`data/${entry.file}`);
  for (const biography of biographies) for (const { path, text } of stringsFrom(biography)) {
    if (/^(?:sourceRefs|license\.status|review\.|provenance\.checkedAt|provenance\.sourcePolicy)/.test(path)) continue;
    findings.push(...scanText(`biography:${biography.id}:${path}`, text, rules));
  }
}

const rawEvents = (await Promise.all(eventCatalog.map(filename => readJson(`data/${filename}`)))).flat().filter(row => !row.archived);
for (const raw of rawEvents) {
  const event = { ...raw, ...(overrides.events?.[raw.id] || {}) };
  for (const { path, text } of stringsFrom(event)) {
    if (/^(?:sourceUrl|imageApiUrl|provenance|license|translations)/.test(path)) continue;
    findings.push(...scanText(`event:${event.id}:${path}`, text, rules));
  }
}

const used = new Set();
const unresolved = [];
for (const finding of findings) {
  const index = exceptions.findIndex(exception => exception.locator === finding.locator && exception.term.toLocaleLowerCase('de-DE') === finding.term.toLocaleLowerCase('de-DE'));
  if (index >= 0) used.add(index);
  else unresolved.push(finding);
}
const stale = exceptions.map((exception, index) => ({ exception, index })).filter(({ index }) => !used.has(index));
if (unresolved.length || stale.length) {
  const details = [
    ...unresolved.map(item => `NICHT ENTSCHIEDEN ${item.locator} [${item.term}] ${item.context}`),
    ...stale.map(({ exception }) => `VERALTETE AUSNAHME ${exception.locator} [${exception.term}]`)
  ];
  throw new Error(`Inclusive-Language-Gate: ${unresolved.length} offene und ${stale.length} veraltete Entscheidungen.\n${details.join('\n')}`);
}

const manual = exceptions.filter(exception => exception.decision === 'manual');
console.log(`${findings.length} kontextsensitive Fundstellen sind entschieden: ${findings.length - manual.length} keep/korrigiert, ${manual.length} bewusst offene Quellenprüfungen.`);
