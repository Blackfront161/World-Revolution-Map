import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EVENT_SHEET_STATES,
  MOBILE_PRIMARY_ACTIONS,
  eventSheetButtonState,
  eventSheetInitialFocusTarget,
  eventSheetStateAfterAction,
  isVisibleFocusTarget,
  normalizeEventSheetState
} from '../src/mobile-ui.js';

test('mobile Primärnavigation bleibt auf fünf stabile Ziele begrenzt', () => {
  assert.deepEqual(MOBILE_PRIMARY_ACTIONS, ['map', 'filters', 'discover', 'saved', 'more']);
  assert.equal(new Set(MOBILE_PRIMARY_ACTIONS).size, 5);
});

test('Ereignis-Bottom-Sheet normalisiert und wechselt nur bekannte Zustände', () => {
  assert.deepEqual(EVENT_SHEET_STATES, ['compact', 'expanded']);
  assert.equal(normalizeEventSheetState('unbekannt'), 'compact');
  assert.equal(eventSheetStateAfterAction('compact', 'expand'), 'expanded');
  assert.equal(eventSheetStateAfterAction('expanded', 'collapse'), 'compact');
  assert.equal(eventSheetStateAfterAction('expanded', 'toggle'), 'compact');
  assert.equal(eventSheetStateAfterAction('compact', 'unbekannt'), 'compact');
});

test('Bottom-Sheet-Schaltflächen bilden den Zustand redundant ab', () => {
  assert.deepEqual(eventSheetButtonState('compact'), { state: 'compact', canExpand: true, canCollapse: false });
  assert.deepEqual(eventSheetButtonState('expanded'), { state: 'expanded', canExpand: false, canCollapse: true });
});

function focusTarget({ display = 'block', visibility = 'visible', rects = 1, hidden = false, disabled = false } = {}) {
  const target = {
    hidden,
    disabled,
    ownerDocument: {
      defaultView: {
        getComputedStyle: () => ({ display, visibility })
      }
    },
    getClientRects: () => Array.from({ length: rects }, () => ({}))
  };
  return target;
}

test('initialer Dialogfokus folgt der tatsächlich sichtbaren DOM-Steuerung', () => {
  const visibleExpand = focusTarget();
  const hiddenExpand = focusTarget({ display: 'none', rects: 0 });
  const close = focusTarget();
  const title = focusTarget();

  assert.equal(isVisibleFocusTarget(hiddenExpand), false);
  assert.equal(eventSheetInitialFocusTarget({ mobile: true, expand: visibleExpand, close, title }), visibleExpand);
  assert.equal(eventSheetInitialFocusTarget({ mobile: true, expand: hiddenExpand, close, title }), close);
  assert.equal(eventSheetInitialFocusTarget({ mobile: false, expand: visibleExpand, close, title }), title);
});
