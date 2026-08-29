export function normalizeMapProjection(value) {
  return value === 'globe' ? 'globe' : 'mercator';
}

export function worldOverviewCamera({ projection = 'mercator', width = 1280, height = 800, mobile = false, framed = false, reducedMotion = false } = {}) {
  const globe = normalizeMapProjection(projection) === 'globe';
  const diameter = Math.min(Math.max(160, width - (mobile ? 36 : 380)), Math.max(160, height - (framed ? 36 : mobile ? 240 : 220)));
  return {
    center: [9, 20],
    zoom: globe ? Math.max(-.5, Math.min(1.9, Math.log2(diameter * Math.PI / 512))) : 1.7,
    pitch: 0, bearing: 0,
    offset: globe ? [mobile ? 0 : 135, mobile ? 25 : 15] : [0, 0],
    duration: reducedMotion ? 0 : 850, essential: false
  };
}

// A globe cannot show all hemispheres at once. Broad result sets use a world
// overview instead of fitting a misleading bounding rectangle.
export function needsGlobeOverview(events) {
  const visible = events.filter(event => event.coordinatePrecision !== 'hidden' && Number.isFinite(event.longitude) && Number.isFinite(event.latitude));
  if (visible.length < 2) return false;
  const longitudes = visible.map(event => event.longitude);
  const latitudes = visible.map(event => event.latitude);
  return Math.max(...longitudes) - Math.min(...longitudes) > 150 || Math.max(...latitudes) - Math.min(...latitudes) > 100;
}
