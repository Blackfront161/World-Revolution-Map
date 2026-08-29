export const MOBILE_PRIMARY_ACTIONS = Object.freeze(['map', 'filters', 'discover', 'saved', 'more']);
export const MOBILE_LAYOUT_QUERY = '(max-width: 820px), (max-width: 1000px) and (max-height: 520px) and (orientation: landscape)';
export const EVENT_SHEET_STATES = Object.freeze(['compact', 'expanded']);

export function normalizeEventSheetState(value) {
  return EVENT_SHEET_STATES.includes(value) ? value : 'compact';
}

export function eventSheetStateAfterAction(current, action) {
  const state = normalizeEventSheetState(current);
  if (action === 'expand') return 'expanded';
  if (action === 'collapse') return 'compact';
  if (action === 'toggle') return state === 'expanded' ? 'compact' : 'expanded';
  return state;
}

export function eventSheetButtonState(state) {
  const normalized = normalizeEventSheetState(state);
  return {
    state: normalized,
    canExpand: normalized !== 'expanded',
    canCollapse: normalized !== 'compact'
  };
}

export function isVisibleFocusTarget(element) {
  if (!element || element.hidden || element.disabled) return false;
  const view = element.ownerDocument?.defaultView;
  const style = view?.getComputedStyle?.(element);
  if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;
  return typeof element.getClientRects !== 'function' || element.getClientRects().length > 0;
}

export function eventSheetInitialFocusTarget({ mobile, expand, close, title }) {
  const candidates = mobile ? [expand, close, title] : [title, close, expand];
  return candidates.find(isVisibleFocusTarget) || null;
}
