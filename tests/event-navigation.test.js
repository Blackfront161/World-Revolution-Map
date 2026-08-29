import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { eventFocusPolicy, mapPerspectivePolicy } from '../src/map-focus.js';

const source = await readFile(new URL('../script.js', import.meta.url), 'utf8');

// Exercise the actual browser handlers with small DOM/map doubles. No WebGL or
// network is needed to catch delayed selection and keyboard regressions.
function productionFunction(name, context) {
  const declaration = source.match(new RegExp(`^(?:async )?function ${name}\\([^]*?^\\}`, 'm'))?.[0];
  assert.ok(declaration, `${name} must exist in script.js`);
  return runInNewContext(`(${declaration})`, context);
}

function navigationHarness() {
  const opened = [];
  const focused = [];
  const pending = [];
  const app = { map: {}, popup: null };
  const context = {
    app,
    safeDisplayCoordinates: () => [0, 0],
    focusMapOnEvent: event => { focused.push(event.id); return { duration: 1100 }; },
    openEventPopup: event => {
      opened.push(event.id);
      app.popup = { remove: () => { app.popup = null; } };
    },
    window: { setTimeout: callback => pending.push(callback) },
    i18n: { t: key => key },
    showToast: () => {}
  };
  return { app, opened, focused, pending, navigate: productionFunction('flyToEvent', context) };
}

function perspectiveHarness({ reduced = false, mobile = false } = {}) {
  const movements = [];
  const media = { reduced, mobile };
  const app = { mapDepth: false, mapReady: true, events: [], selectedEventId: null,
    map: { getPitch: () => 15, getBearing: () => 0, easeTo: options => movements.push(options), flyTo: options => movements.push(options) } };
  const ui = { mapDepthToggle: {}, timePlay: {}, motionNote: {} };
  const context = { app, ui, mapPerspectivePolicy, eventFocusPolicy, MOBILE_LAYOUT_QUERY: 'mobile',
    window: { matchMedia: query => ({ matches: query === 'mobile' ? media.mobile : media.reduced }) },
    isSensitiveEvent: event => event.sensitive === true,
    eventFocusOffset: () => [0, -50], i18n: { t: key => key }, stopTimeTravel: () => {} };
  context.mapPerspectiveFor = productionFunction('mapPerspectiveFor', context);
  context.syncMapPerspective = productionFunction('syncMapPerspective', context);
  return { app, ui, movements, media, sync: context.syncMapPerspective,
    focus: productionFunction('focusMapOnEvent', context), motion: productionFunction('syncMotionPreference', context) };
}

test('echte Kamerasteuerung schaltet 3D ohne Änderung von Zoom oder Mittelpunkt ein und aus', () => {
  const h = perspectiveHarness();
  h.app.mapDepth = true;
  h.sync(true);
  assert.equal(h.ui.mapDepthToggle.checked, true);
  assert.equal(h.ui.mapDepthToggle.disabled, false);
  assert.equal(h.movements.at(-1).pitch, 28);
  assert.equal('zoom' in h.movements.at(-1), false);
  assert.equal('center' in h.movements.at(-1), false);
  h.media.mobile = true;
  h.sync();
  assert.equal(h.movements.at(-1).pitch, 20);
  h.app.mapDepth = false;
  h.sync(true);
  assert.equal(h.movements.at(-1).pitch, 0);
  h.app.mapReady = false;
  const count = h.movements.length;
  h.sync();
  assert.equal(h.ui.mapDepthToggle.disabled, true);
  assert.equal(h.movements.length, count);
});

test('Ereignisfokus koppelt die Perspektive an vorhandene Schutz- und Zoomregeln', () => {
  const h = perspectiveHarness();
  h.app.mapDepth = true;
  h.focus({ id: 'historical', coordinatePrecision: 'exact' }, [1, 2]);
  assert.equal(h.movements.at(-1).pitch, 28);
  assert.equal(h.movements.at(-1).zoom, 9);
  h.focus({ id: 'sensitive', sensitive: true, coordinatePrecision: 'exact' }, [3, 4]);
  assert.equal(h.movements.at(-1).pitch, 0);
  assert.equal(h.movements.at(-1).zoom, 5);
  h.app.events = [{ id: 'sensitive', sensitive: true, coordinatePrecision: 'exact' }];
  h.app.selectedEventId = 'sensitive';
  h.sync(true);
  assert.equal(h.movements.at(-1).pitch, 0, 'auch erneutes Einschalten darf die Schutzauswahl nicht umgehen');
  h.media.reduced = true;
  h.motion();
  assert.equal(h.app.mapDepth, false);
  assert.equal(h.ui.mapDepthToggle.disabled, true);
  assert.equal(h.movements.at(-1).duration, 0);
  h.media.reduced = false;
  h.motion();
  assert.equal(h.ui.mapDepthToggle.checked, false, 'keine automatische erneute Aktivierung');
});

test('Ereignisdetails reagieren sofort und planen keine veralteten Popups ein', () => {
  const h = navigationHarness();
  assert.equal(h.navigate({ id: 'first' }), true);
  assert.deepEqual(h.opened, ['first']);
  assert.equal(h.pending.length, 0);
  h.navigate({ id: 'second' });
  assert.deepEqual(h.focused, ['first', 'second']);
  assert.deepEqual(h.opened, ['first', 'second']);
  h.app.popup.remove();
  h.pending.forEach(callback => callback());
  assert.equal(h.app.popup, null, 'Closed details must not reopen after camera animation');
});

test('Vorschau ohne Popup und fehlende Onlinekarte bleiben unterstützt', () => {
  const h = navigationHarness();
  assert.equal(h.navigate({ id: 'preview' }, false), true);
  assert.deepEqual(h.focused, ['preview']);
  assert.deepEqual(h.opened, []);
  assert.equal(h.pending.length, 0);
  h.app.map = null;
  assert.equal(h.navigate({ id: 'offline' }), false);
  assert.deepEqual(h.focused, ['preview']);
});

function keyboardHandler(context) {
  const handler = source.match(/document\.addEventListener\('keydown', (event => \{[^]*?^  \})\);/m)?.[1];
  assert.ok(handler, 'Global keyboard handler must exist');
  return runInNewContext(`(${handler})`, { document: { activeElement: null }, isFormElement: () => false, ...context });
}

test('Escape schließt Ereignisdetails und hält die laufende Kamerafahrt an', () => {
  const calls = [];
  const handler = keyboardHandler({
    app: { popup: { remove: () => calls.push('popup') }, map: { stop: () => calls.push('stop') } },
    closeModals: () => calls.push('modals'),
    closeDrawers: () => calls.push('drawers'),
    toggleMobileMenu: () => calls.push('menu')
  });
  handler({ key: 'Escape' });
  assert.deepEqual(calls, ['stop', 'popup', 'modals', 'drawers', 'menu']);
});

test('Escape ohne Ereignis bleibt sicher und respektiert bereits behandelte Tastendrücke', () => {
  let changes = 0;
  const handler = keyboardHandler({
    app: { popup: null, map: null },
    closeModals: () => changes++, closeDrawers: () => changes++, toggleMobileMenu: () => changes++
  });
  handler({ key: 'Escape', defaultPrevented: true });
  assert.equal(changes, 0);
  handler({ key: 'Escape' });
  assert.equal(changes, 3);
});

test('Punktgruppen respektieren Reduced Motion ohne essenzielle Animation', async () => {
  for (const reducedMotion of [true, false]) {
    const movements = [];
    const expand = productionFunction('expandCluster', {
      app: { map: {
        queryRenderedFeatures: () => [{ geometry: { coordinates: [1, 2] }, properties: { cluster_id: 7 } }],
        getSource: () => ({ getClusterExpansionZoom: async () => 5 }),
        easeTo: options => movements.push(options)
      } },
      window: { matchMedia: () => ({ matches: reducedMotion }) },
      console
    });
    await expand({ point: [0, 0] });
    assert.equal(movements.length, 1);
    assert.equal(movements[0].duration, reducedMotion ? 0 : 650);
    assert.equal(movements[0].essential, false);
    assert.equal(movements[0].zoom, 5);
  }
});
