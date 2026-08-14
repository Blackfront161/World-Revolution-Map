import test from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGES, createI18n, formatLocalizedYear, normalizeLanguage, translateCategory, translateEditorialMetadata } from '../src/i18n.js';

const expected = ['de', 'en', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr'];

test('bietet dieselben neun Sprachen wie World Revolution News', () => {
  assert.deepEqual(LANGUAGES.map(language => language.code), expected);
  expected.forEach(language => {
    const i18n = createI18n({ search: `?lang=${language}` });
    assert.notEqual(i18n.t('appTitle'), 'appTitle');
    assert.notEqual(i18n.t('welcomeBody'), 'welcomeBody');
    assert.match(i18n.t('missionCategory', { count: 3, category: 'X' }), /3/);
  });
});

test('priorisiert URL-Sprache, normalisiert Browserwerte und speichert Wechsel lokal', () => {
  const values = new Map([['atlas-language-v1', 'fr']]);
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  const i18n = createI18n({ search: '?lang=tr', storage, navigatorLanguage: 'en-US' });
  assert.equal(i18n.language, 'tr');
  assert.equal(i18n.setLanguage('EL-gr'), 'el');
  assert.equal(values.get('atlas-language-v1'), 'el');
  assert.equal(normalizeLanguage('xx'), 'de');
});

test('lokalisiert Kategorien und tiefe Jahresangaben ohne Netzzugriff', () => {
  const i18n = createI18n({ search: '?lang=en' });
  assert.equal(translateCategory('Arbeiter*innenbewegung', 'en'), 'Labour movement');
  assert.match(formatLocalizedYear({ yearStart: -1157, yearEnd: -1157 }, i18n), /1,157/);
  assert.equal(formatLocalizedYear({ yearStart: 1918, yearEnd: 1921 }, i18n), '1918–1921');
});

test('lokalisiert die Komfortfunktionen in allen neun Sprachen', () => {
  for (const language of LANGUAGES.map(item => item.code)) {
    const i18n = createI18n({ search: `?lang=${language}` });
    for (const key of ['clearSearch', 'showResults', 'copyEventLink', 'eventLinkCopied', 'aboutMap', 'eventList', 'sensitiveNotice', 'immediateConsequences', 'sourceTypeLabel', 'sourceQualityLabel', 'reviewStatusLabel', 'eventTextGermanNotice', 'partialEventTranslation']) {
      assert.notEqual(i18n.t(key), key);
    }
  }
  assert.equal(translateEditorialMetadata('Redaktioneller Pilotstand', 'en'), 'Editorial pilot');
});
