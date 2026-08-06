const SAFE_ID = /^[a-z0-9äöüß][a-z0-9äöüß-]{0,119}$/i;
const MAX_IDS = 2500;
const MAX_XP = 10_000_000;

const integer = (value, min = 0, max = MAX_XP) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.trunc(parsed))) : min;
};

const safeIds = (value, max = MAX_IDS) => Array.isArray(value)
  ? [...new Set(value.map(String).filter(id => SAFE_ID.test(id)))].slice(0, max)
  : [];

function sanitizeMission(value) {
  if (!value || typeof value !== 'object') return null;
  const targetIds = safeIds(value.targetIds, 8);
  if (!targetIds.length) return null;
  const completedIds = safeIds(value.completedIds, 8).filter(id => targetIds.includes(id));
  const goal = Math.min(targetIds.length, Math.max(1, integer(value.goal, 1, 8)));
  return {
    id: SAFE_ID.test(String(value.id || '')) ? String(value.id) : 'mission-imported',
    title: String(value.title || 'Importierte Mission').slice(0, 120),
    description: String(value.description || '').slice(0, 300),
    category: typeof value.category === 'string' ? value.category.slice(0, 120) : null,
    targetIds,
    completedIds,
    goal,
    reward: integer(value.reward, 0, 1000),
    complete: Boolean(value.complete) && completedIds.length >= goal
  };
}

export function sanitizeProgress(value = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    xp: integer(source.xp),
    discoveredIds: safeIds(source.discoveredIds),
    unlockedAchievements: safeIds(source.unlockedAchievements, 100),
    quizAnswered: integer(source.quizAnswered, 0, 100_000),
    missionsCompleted: integer(source.missionsCompleted, 0, 100_000),
    mission: sanitizeMission(source.mission),
    seenWelcome: Boolean(source.seenWelcome),
    lastVisit: /^\d{4}-\d{2}-\d{2}$/.test(String(source.lastVisit || '')) ? String(source.lastVisit) : null,
    visitStreak: integer(source.visitStreak, 1, 10_000),
    connectionIds: safeIds(source.connectionIds, 1000),
    solidarityCombo: integer(source.solidarityCombo, 0, 100),
    bestSolidarityCombo: integer(source.bestSolidarityCombo, 0, 100),
    lastDiscoveredId: SAFE_ID.test(String(source.lastDiscoveredId || '')) ? String(source.lastDiscoveredId) : null
  };
}

export function parseStoredProgress(serialized, maxBytes = 200_000) {
  if (typeof serialized !== 'string' || serialized.length > maxBytes) return sanitizeProgress();
  try {
    return sanitizeProgress(JSON.parse(serialized));
  } catch {
    return sanitizeProgress();
  }
}

export function reconcileProgress(progress, validEventIds) {
  const valid = validEventIds instanceof Set ? validEventIds : new Set(validEventIds || []);
  const clean = sanitizeProgress(progress);
  clean.discoveredIds = clean.discoveredIds.filter(id => valid.has(id));
  clean.lastDiscoveredId = valid.has(clean.lastDiscoveredId) ? clean.lastDiscoveredId : null;
  if (clean.mission && !clean.mission.targetIds.every(id => valid.has(id))) clean.mission = null;
  return clean;
}
