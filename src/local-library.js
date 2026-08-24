const SAFE_COLLECTION_ID = /^collection-[a-z0-9-]{1,80}$/;
const SAFE_ITEM_REF = /^(?:event|bio):[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_IMPORT_BYTES = 200_000;

const uniqueRefs = value => Array.isArray(value)
  ? [...new Set(value.map(String).filter(ref => SAFE_ITEM_REF.test(ref)))].slice(0, 500)
  : [];

export function sanitizeLibrary(value = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const collections = Array.isArray(source.collections) ? source.collections.slice(0, 20).map((collection, index) => ({
    id: SAFE_COLLECTION_ID.test(String(collection?.id || '')) ? String(collection.id) : `collection-import-${index + 1}`,
    name: String(collection?.name || `Sammlung ${index + 1}`).trim().slice(0, 80),
    items: uniqueRefs(collection?.items)
  })) : [];
  const ids = new Set();
  const deduplicated = collections.filter(collection => collection.name && !ids.has(collection.id) && ids.add(collection.id));
  return {
    schemaVersion: 1,
    collections: deduplicated,
    compare: uniqueRefs(source.compare).slice(0, 3),
    lastRead: SAFE_ITEM_REF.test(String(source.lastRead || '')) ? String(source.lastRead) : null,
    reader: {
      enabled: Boolean(source.reader?.enabled),
      fontScale: Math.min(140, Math.max(90, Number(source.reader?.fontScale) || 100)),
      lineWidth: Math.min(90, Math.max(48, Number(source.reader?.lineWidth) || 68)),
      highContrast: Boolean(source.reader?.highContrast)
    }
  };
}

export function parseLibrary(serialized, maximumBytes = MAX_IMPORT_BYTES) {
  if (typeof serialized !== 'string' || serialized.length > maximumBytes) return sanitizeLibrary();
  try { return sanitizeLibrary(JSON.parse(serialized)); } catch { return sanitizeLibrary(); }
}

export function exportLibrary(library) {
  return JSON.stringify(sanitizeLibrary(library), null, 2);
}

export function addCollection(library, name, seed = Date.now()) {
  const next = sanitizeLibrary(library);
  const cleanName = String(name || '').trim().slice(0, 80);
  if (!cleanName || next.collections.length >= 20) return next;
  const slug = cleanName.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'sammlung';
  let id = `collection-${slug}-${String(seed).replace(/[^a-z0-9]/gi, '').toLowerCase().slice(-10) || 'local'}`;
  let suffix = 2;
  while (next.collections.some(collection => collection.id === id)) id = `collection-${slug}-${suffix++}`;
  next.collections.push({ id, name: cleanName, items: [] });
  return next;
}

export function toggleCollectionItem(library, collectionId, itemRef) {
  const next = sanitizeLibrary(library);
  if (!SAFE_ITEM_REF.test(String(itemRef || ''))) return next;
  const collection = next.collections.find(item => item.id === collectionId);
  if (!collection) return next;
  collection.items = collection.items.includes(itemRef) ? collection.items.filter(ref => ref !== itemRef) : [...collection.items, itemRef].slice(0, 500);
  return next;
}

export function toggleComparison(library, itemRef) {
  const next = sanitizeLibrary(library);
  if (!SAFE_ITEM_REF.test(String(itemRef || ''))) return next;
  next.compare = next.compare.includes(itemRef) ? next.compare.filter(ref => ref !== itemRef) : [...next.compare, itemRef].slice(-3);
  return next;
}
