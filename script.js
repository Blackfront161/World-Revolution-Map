// 1. VERBINDUNG ZU DEINEM SUPABASE AUFBAUEN
const supabaseUrl = 'https://pixafxinyydzwplirrnm.supabase.co';
const supabaseKey = 'sb_publishable_cAh2ZxD6aaXREXhMIVyvyA_C_yeFxRd';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. DIE KARTE LADEN
const map = new maplibregl.Map({
    container: 'map', 
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', 
    center: [10, 40], 
    zoom: 2 
});

let alleEreignisse = null;

map.on('load', async () => {
    
    // 3. DATEN LIVE AUS DEINER SUPABASE TABELLE "ereignisse" ABRUFEN
    const { data, error } = await supabase.from('ereignisse').select('*');

    if (error) {
        console.error('Fehler beim Laden aus Supabase:', error);
        return;
    }

    // 4. SUPABASE-DATEN FÜR DIE KARTE ÜBERSETZEN
    alleEreignisse = {
        type: 'FeatureCollection',
        features: data.map(ereignis => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [ereignis.longitude, ereignis.latitude]
            },
            properties: {
                title: ereignis.title,
                location: ereignis.location,
                category: ereignis.category,
                description: ereignis.description,
                image: ereignis.image_url
            }
        }))
    };

    // 5. CLUSTERING UND PUNKTE ZEICHNEN
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
        paint: {
            'circle-color': '#00ffcc', 
            'circle-radius': 8,        
            'circle-blur': 0.2,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff'
        }
    });

    // 6. KLICK-INTERAKTIONEN
    map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties.cluster_id;
        map.getSource('widerstand-daten').getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;
            map.easeTo({ center: features[0].geometry.coordinates, zoom: zoom });
        });
    });

    map.on('click', 'unclustered-point', (e) => {
        const props = e.features[0].properties;
        const coordinates = e.features[0].geometry.coordinates.slice();
        
        const title = props.title;
        const category = props.category;
        const location = props.location;
        const description = props.description;
        const imageUrl = props.image;

        const imageHTML = imageUrl ? `<img src="${imageUrl}" class="popup-image" alt="Historisches Bild zu ${title}">` : '';
        const locationHTML = location ? `<div class="popup-location">📍 ${location}</div>` : '';

        new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(`${imageHTML}<span class="category-badge">${category}</span><h3>${title}</h3>${locationHTML}<p>${description}</p>`)
            .addTo(map);
    });

    map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });
    map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = ''; });

    // 7. FILTER-LOGIK (SUCHE & DROPDOWN)
    const filterKarte = () => {
        const ausgewaehlteKategorie = document.getElementById('category-filter').value;
        const suchText = document.getElementById('search-bar').value.toLowerCase();

        const gefiltertePunkte = alleEreignisse.features.filter(ereignis => {
            const props = ereignis.properties;
            const passtKategorie = (ausgewaehlteKategorie === 'alle' || props.category === ausgewaehlteKategorie);
            const titelKlein = props.title ? props.title.toLowerCase() : '';
            const textKlein = props.description ? props.description.toLowerCase() : '';
            const ortKlein = props.location ? props.location.toLowerCase() : '';
            
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