import test from 'node:test';
import assert from 'node:assert/strict';
import { createAtlasApi } from '../src/atlas-api.js';
import { normalizeParentOrigin, parseBoolean, readRuntimeConfig } from '../src/atlas-config.js';
import { parseStoredProgress, reconcileProgress, sanitizeProgress } from '../src/progress-store.js';
import { createConnection, createPowerExcuse, solidarityResult } from '../src/game-core.js';

test('Einbettungskonfiguration akzeptiert nur sichere Parent-Origins', () => {
  assert.equal(normalizeParentOrigin('*'), '');
  assert.equal(normalizeParentOrigin('javascript:alert(1)'), '');
  assert.equal(normalizeParentOrigin('http://example.com'), '');
  assert.equal(normalizeParentOrigin('http://localhost:3000/path'), 'http://localhost:3000');
  assert.equal(normalizeParentOrigin('https://app.example.org/path'), 'https://app.example.org');
  assert.equal(parseBoolean('yes'), true);
  const config = readRuntimeConfig('?embed=1&welcome=0&supabase=false&accent=%23ff00aa&parentOrigin=https%3A%2F%2Fapp.example.org');
  assert.deepEqual({ embed: config.embed, welcome: config.showWelcome, supabase: config.useSupabase, accent: config.accent, parent: config.parentOrigin },
    { embed: true, welcome: false, supabase: false, accent: '#ff00aa', parent: 'https://app.example.org' });
  assert.equal(readRuntimeConfig('').useSupabase, false);
  assert.equal(readRuntimeConfig('?supabase=1').useSupabase, true);
});

test('Fortschrittsimporte werden begrenzt und mit dem Archiv abgeglichen', () => {
  const unsafe = {
    xp: Infinity,
    discoveredIds: ['valid-id', '<script>', 'valid-id'],
    unlockedAchievements: ['first-trace', '"><img>'],
    visitStreak: -20,
    connectionIds: ['connection-1'],
    mission: { id: 'm', targetIds: ['missing'], completedIds: ['missing'], goal: 99 }
  };
  const clean = reconcileProgress(sanitizeProgress(unsafe), new Set(['valid-id']));
  assert.equal(clean.xp, 0);
  assert.deepEqual(clean.discoveredIds, ['valid-id']);
  assert.deepEqual(clean.unlockedAchievements, ['first-trace']);
  assert.equal(clean.visitStreak, 1);
  assert.equal(clean.mission, null);
  assert.equal(parseStoredProgress('{kaputt').xp, 0);
  assert.equal(parseStoredProgress('x'.repeat(200_001)).xp, 0);
});

test('Funkenlabor erzeugt belegbare Verbindungen und Combos', () => {
  const events = [
    { id: 'a', title: 'A', category: 'Commons', tags: ['Antirassismus'], continent: 'Europa', yearStart: 1649 },
    { id: 'b', title: 'B', category: 'Indigener Widerstand', tags: ['Commons'], continent: 'Südamerika', yearStart: 2000 },
    { id: 'c', title: 'C', category: 'Tierbefreiung', tags: [], continent: 'Europa', yearStart: 1980 }
  ];
  const connection = createConnection(events, 'test');
  assert.deepEqual(connection.eventIds.sort(), ['a', 'b']);
  assert.ok(connection.sharedTags.includes('Commons'));
  assert.deepEqual(solidarityResult(events[0], events[1], 2), { combo: 3, bonusXp: 9, sharedTags: ['Commons'] });
  assert.match(createPowerExcuse(events[0], 'test').counter, /A/);
});

test('öffentliche API gibt Kopien aus und postet nur an die konfigurierte Origin', () => {
  const dispatched = [];
  const posted = [];
  class FakeCustomEvent { constructor(type, init) { this.type = type; this.detail = init.detail; } }
  const host = {
    CustomEvent: FakeCustomEvent,
    dispatchEvent: event => dispatched.push(event),
    parent: { postMessage: (message, origin) => posted.push({ message, origin }) }
  };
  const state = { progress: { xp: 5 } };
  const bridge = createAtlasApi({
    host,
    parentOrigin: 'https://app.example.org',
    getSnapshot: () => state,
    actions: {
      setFilters: () => true, setLanguage: language => language === 'en', focusEvent: () => true, randomEvent: () => true, openPanel: () => true,
      exportProgress: () => state.progress, importProgress: () => true, resetProgress: () => true
    }
  });
  const snapshot = bridge.api.getState();
  snapshot.progress.xp = 999;
  assert.equal(state.progress.xp, 5);
  assert.equal(bridge.api.setLanguage('en'), true);
  bridge.emit('ready', { count: 160 });
  assert.equal(dispatched[0].type, 'resistance-atlas:ready');
  assert.equal(posted[0].origin, 'https://app.example.org');
  bridge.destroy();
  assert.equal(host.ResistanceAtlas, undefined);
});
