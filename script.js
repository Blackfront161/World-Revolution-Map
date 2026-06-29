// 1. SUPABASE VERBINDUNG
if (!window.supabaseClient) {
    const supabaseUrl = 'https://pixafxinyydzwplirrnm.supabase.co';
    const supabaseKey = 'sb_publishable_cAh2ZxD6aaXREXhMIVyvyA_C_yeFxRd';
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
}

// 2. KARTE INITIALISIEREN
const map = new maplibregl.Map({
    container: 'map', 
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', 
    center: [10, 40], 
    zoom: 2 
});

let alleEreignisse = null;

map.on('load', async () => {
    // 3. DATEN ABRUFEN
    const { data, error } = await window.supabaseClient.from('ereignisse').select('*');

    if (error) { console.error("Supabase Fehler:", error); return; }

    // 4. SICHERES ÜBERSETZEN DER DATEN
    const features = (data || []).map(e => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [parseFloat(e.longitude), parseFloat(e.latitude)] },
        properties: { 
            title: e.title || "Unbekanntes Ereignis", 
            location: e.location || "", 
            category: e.category || "Ereignis", 
            description: e.description || "", 
            apiUrl: e.image_url || "" // Hier liegt jetzt die API URL
        }
    }));

    alleEreignisse = { type: 'FeatureCollection', features: features };

    map.addSource('widerstand-daten', {
        type: 'geojson',
        data: alleEreignisse,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
    });

    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'widerstand-daten',
        filter: ['has', 'point_count'],
        paint: {
            'circle-color': ['step', ['get', 'point_count'], '#00ffcc', 10, '#00b38f', 50, '#006652'],
            'circle-radius': ['step', ['get', 'point_count'], 15, 10, 20, 50, 30],
            'circle-opacity': 0.8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#00ffcc'
        }
    });

    map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'widerstand-daten',
        filter: ['has', 'point_count'],
        layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 14 },
        paint: { 'text-color': '#000000' }
    });

    map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'widerstand-daten',
        filter: ['!', ['has', 'point_count']],
        paint: { 'circle-color': '#00ffcc', 'circle-radius': 8, 'circle-stroke-width': 1, 'circle-stroke-color': '#ffffff' }
    });

    // 5. LIVE-BILD-FETCH BEIM KLICK
    map.on('click', 'unclustered-point', async (e) => {
        const p = e.features[0].properties;
        const coordinates = e.features[0].geometry.coordinates.slice();
        
        // Eine einzigartige ID für den Platzhalter generieren
        const imgContainerId = `img-box-${Math.random().toString(36).substr(2, 9)}`;
        const locationHTML = p.location ? `<div class="popup-location">📍 ${p.location}</div>` : '';

        // Popup sofort anzeigen (Text ist direkt da!)
        new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
                <div id="${imgContainerId}" style="min-height: 50px; text-align: center; margin-bottom: 10px;">
                    <span style="color: #00ffcc; font-size: 12px; opacity: 0.6;">Lade Bild...</span>
                </div>
                <span class="category-badge">${p.category}</span>
                <h3>${p.title}</h3>
                ${locationHTML}
                <p>${p.description}</p>
            `)
            .addTo(map);

        // Bild im Hintergrund live von Wikipedia holen
        if (p.apiUrl && p.apiUrl.includes('wikipedia.org')) {
            try {
                const response = await fetch(p.apiUrl);
                const apiData = await response.json();
                const container = document.getElementById(imgContainerId);
                
                if (apiData.thumbnail && apiData.thumbnail.source) {
                    container.innerHTML = `<img src="${apiData.thumbnail.source}" class="popup-image" style="width: 100%; height: auto; border-radius: 4px; border: 1px solid rgba(0, 255, 204, 0.3);">`;
                } else {
                    container.style.display = 'none'; // Verstecken, falls kein Bild da ist
                }
            } catch (err) {
                document.getElementById(imgContainerId).style.display = 'none';
            }
        } else {
            document.getElementById(imgContainerId).style.display = 'none';
        }
    });

    map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties.cluster_id;
        map.getSource('widerstand-daten').getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;
            map.easeTo({ center: features[0].geometry.coordinates, zoom: zoom });
        });
    });

    map.on('mouseenter', 'clusters', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'clusters', () => map.getCanvas().style.cursor = '');
    map.on('mouseenter', 'unclustered-point', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'unclustered-point', () => map.getCanvas().style.cursor = '');

    // 6. FILTER LOGIK
    const filterKarte = () => {
        const ausgewaehlteKategorie = document.getElementById('category-filter').value;
        const suchText = document.getElementById('search-bar').value.toLowerCase();

        const gefiltertePunkte = alleEreignisse.features.filter(ereignis => {
            const props = ereignis.properties;
            const passtKategorie = (ausgewaehlteKategorie === 'alle' || props.category === ausgewaehlteKategorie);
            const titelKlein = props.title.toLowerCase();
            const textKlein = props.description.toLowerCase();
            const ortKlein = props.location.toLowerCase();
            
            const passtSuche = titelKlein.includes(suchText) || textKlein.includes(suchText) || ortKlein.includes(suchText);
            return passtKategorie && passtSuche;
        });

        map.getSource('widerstand-daten').setData({
            type: 'FeatureCollection',
            features: gefiltertePunkte
        });
    };

    document.getElementById('category-filter').addEventListener('change', filterKarte);
    document.getElementById('search-bar').addEventListener('input', filterKarte);
});