export const ATLAS_API_VERSION = '2.1.0';
export const ATLAS_EVENT_PREFIX = 'resistance-atlas:';

const clone = value => JSON.parse(JSON.stringify(value ?? null));

export function createAtlasApi({ host, parentOrigin = '', getSnapshot, actions }) {
  const emit = (type, detail = {}) => {
    const safeDetail = clone(detail);
    host.dispatchEvent(new host.CustomEvent(ATLAS_EVENT_PREFIX + type, { detail: safeDetail }));
    if (parentOrigin && host.parent && host.parent !== host) {
      host.parent.postMessage({ source: 'resistance-atlas', version: ATLAS_API_VERSION, type, detail: safeDetail }, parentOrigin);
    }
  };

  const api = Object.freeze({
    version: ATLAS_API_VERSION,
    getState: () => clone(getSnapshot()),
    setFilters: filters => actions.setFilters(clone(filters || {})),
    focusEvent: id => actions.focusEvent(String(id || '')),
    randomEvent: () => actions.randomEvent(),
    openPanel: panel => actions.openPanel(String(panel || 'map')),
    exportProgress: () => clone(actions.exportProgress()),
    importProgress: value => actions.importProgress(clone(value)),
    resetProgress: () => actions.resetProgress()
  });

  Object.defineProperty(host, 'ResistanceAtlas', { configurable: true, value: api });
  return {
    api,
    emit,
    destroy() {
      if (host.ResistanceAtlas === api) delete host.ResistanceAtlas;
    }
  };
}
