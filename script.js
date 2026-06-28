// Globale Supabase Variable sicher initialisieren
if (!window.supabaseClient) {
    const supabaseUrl = 'https://pixafxinyydzwplirrnm.supabase.co';
    const supabaseKey = 'sb_publishable_cAh2ZxD6aaXREXhMIVyvyA_C_yeFxRd';
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
}

const map = new maplibregl.Map({
    container: 'map', 
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', 
    center: [10, 40], 
    zoom: 2 
});

map.on('load', async () => {
    // Daten abrufen
    const { data, error } = await window.supabaseClient.from('ereignisse').select('*');

    if (error) {
        console.error("Supabase Fehler:", error);
        return;
    }

    const features = (data || []).map(e => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [parseFloat(e.longitude), parseFloat(e.latitude)] },
        properties: { title: e.title, location: e.location, category: e.category, description: e.description, image: e.image_url }
    }));

    map.addSource('widerstand-daten', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: features },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
    });

    // Layer hinzufügen
    map.addLayer({ id: 'clusters', type: 'circle', source: 'widerstand-daten', filter: ['has', 'point_count'], paint: { 'circle-color': '#00ffcc', 'circle-radius': 15 }});
    map.addLayer({ id: 'unclustered-point', type: 'circle', source: 'widerstand-daten', filter: ['!', ['has', 'point_count']], paint: { 'circle-color': '#00ffcc', 'circle-radius': 8 }});

    // Popups
    map.on('click', 'unclustered-point', (e) => {
        const p = e.features[0].properties;
        new maplibregl.Popup()
            .setLngLat(e.features[0].geometry.coordinates)
            .setHTML(`${p.image ? `<img src="${p.image}" class="popup-image">` : ''}<h3>${p.title}</h3><p>${p.description}</p>`)
            .addTo(map);
    });
});