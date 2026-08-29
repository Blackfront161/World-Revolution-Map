import test from 'node:test';
import assert from 'node:assert/strict';
import { addCollection, exportLibrary, parseLibrary, sanitizeLibrary, toggleCollectionItem, toggleComparison } from '../src/local-library.js';

test('begrenzt lokale Sammlungen, Vergleiche und Importdaten', () => {
  let library = addCollection({}, 'Wasser & Land', 'seed');
  assert.equal(library.collections.length, 1);
  library = toggleCollectionItem(library, library.collections[0].id, 'event:standing-rock');
  library = toggleCollectionItem(library, library.collections[0].id, 'bio:bio-example');
  assert.deepEqual(library.collections[0].items, ['event:standing-rock', 'bio:bio-example']);
  library = toggleComparison(library, 'event:standing-rock');
  library = toggleComparison(library, 'bio:bio-example');
  assert.equal(library.compare.length, 2);
  assert.deepEqual(parseLibrary(exportLibrary(library)), sanitizeLibrary(library));
  assert.equal(parseLibrary('x'.repeat(200_001)).collections.length, 0);
});

test('verwirft unsichere Referenzen und begrenzt Lesemoduswerte', () => {
  const clean = sanitizeLibrary({ compare: ['event:ok', 'javascript:alert'], lastRead: 'bio:bio-safe', reader: { enabled: true, fontScale: 999, lineWidth: 2 } });
  assert.deepEqual(clean.compare, ['event:ok']);
  assert.equal(clean.lastRead, 'bio:bio-safe');
  assert.equal(clean.reader.fontScale, 140);
  assert.equal(clean.reader.lineWidth, 48);
});
