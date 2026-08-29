import test from 'node:test';
import assert from 'node:assert/strict';
import { eventFocusPolicy, mapPerspectivePolicy, sanitizeEventVisualMedia, selectedEventFilter, visualFocusModel } from '../src/map-focus.js';

test('3D-Perspektive ist optional, sanft und ohne zusätzliche Geodaten', () => {
  assert.equal(mapPerspectivePolicy().pitch, 0);
  assert.deepEqual(mapPerspectivePolicy({ enabled: true }), { pitch: 28, bearing: 0, duration: 650, essential: false });
  assert.equal(mapPerspectivePolicy({ enabled: true, mobile: true }).pitch, 20);
  assert.equal(mapPerspectivePolicy({ enabled: 'true' }).pitch, 0);
  assert.equal('zoom' in mapPerspectivePolicy({ enabled: true }), false);
});

test('3D fällt bei sensiblen oder groben Orten und reduzierter Bewegung auf 2D zurück', () => {
  for (const precision of ['exact', 'approximate', 'region', 'hidden', 'unknown']) {
    assert.equal(mapPerspectivePolicy({ enabled: true, sensitive: true, precision }).pitch, 0);
    assert.equal(mapPerspectivePolicy({ enabled: true, reducedMotion: true, precision }).pitch, 0);
  }
  for (const precision of ['region', 'hidden', 'unknown']) assert.equal(mapPerspectivePolicy({ enabled: true, precision }).pitch, 0);
  assert.equal(mapPerspectivePolicy({ enabled: true, reducedMotion: true }).duration, 0);
});

test('Fokuszoom respektiert Präzision, Sensitivität und reduzierte Bewegung', () => {
  assert.equal(eventFocusPolicy({ coordinatePrecision: 'exact' }).zoom, 9);
  assert.equal(eventFocusPolicy({ coordinatePrecision: 'approximate' }).zoom, 6);
  assert.equal(eventFocusPolicy({ coordinatePrecision: 'region' }).zoom, 3.2);
  assert.equal(eventFocusPolicy({ coordinatePrecision: 'unknown' }).precision, 'region');
  assert.deepEqual(eventFocusPolicy({ coordinatePrecision: 'hidden' }, { sensitive: true, reducedMotion: true }), {
    precision: 'hidden', zoom: 1.7, duration: 0, essential: false
  });
  assert.equal(eventFocusPolicy({ coordinatePrecision: 'exact' }, { sensitive: true }).zoom, 5);
});

test('Auswahlfilter lässt sich ohne verbleibenden Markerzustand leeren', () => {
  assert.deepEqual(selectedEventFilter('event-a'), ['all', ['!', ['has', 'point_count']], ['==', ['get', 'id'], 'event-a']]);
  assert.deepEqual(selectedEventFilter(null), ['all', ['!', ['has', 'point_count']], ['==', ['get', 'id'], '']]);
});

test('optionales Fokusbild benötigt geprüfte Commons-Metadaten und sicheren Host', () => {
  const verified = {
    url: 'https://upload.wikimedia.org/example/file.jpg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
    alt: 'Belegte historische Aufnahme',
    credit: 'Beispielarchiv',
    license: 'Public Domain',
    reviewStatus: 'rights-reviewed'
  };
  assert.equal(sanitizeEventVisualMedia({ ...verified, url: 'https://example.org/file.jpg' }), null);
  assert.equal(sanitizeEventVisualMedia({ ...verified, url: 'https://upload.wikimedia.org.evil.example/file.jpg' }), null);
  assert.equal(sanitizeEventVisualMedia({ ...verified, sourceUrl: 'https://commons.wikimedia.org/wiki/Category:Example' }), null);
  assert.equal(sanitizeEventVisualMedia({ ...verified, alt: '' }), null);
  assert.equal(sanitizeEventVisualMedia({ ...verified, reviewStatus: 'draft' }), null);
  assert.equal(sanitizeEventVisualMedia(verified)?.credit, 'Beispielarchiv');
  assert.equal(visualFocusModel({ visualMedia: verified }, { yearLabel: '1910' }).mode, 'image');
  assert.deepEqual(visualFocusModel({}, { yearLabel: '1910', tacticSymbol: 'S', categoryLabel: 'Streik' }), {
    mode: 'symbol', symbol: 'S', yearLabel: '1910', categoryLabel: 'Streik'
  });
});
