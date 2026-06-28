const map = new maplibregl.Map({
    container: 'map', 
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', 
    center: [10, 40], 
    zoom: 2 
});

let alleEreignisse = null;

map.on('load', async () => {
    
    // Daten mit Cache-Buster laden
    const response = await fetch('data.json?v=' + Date.now());
    alleEreignisse = await response.json();

    // NEU: Wir aktivieren "cluster: true". Das macht die Karte bereit für 100.000 Punkte!
    map.addSource('widerstand-daten', {
        type: 'geojson',
        data: alleEreignisse,
        cluster: true,
        clusterMaxZoom: 14, // Ab dieser Zoom-Stufe spalten sich alle Cluster auf
        clusterRadius: 50 // Wie groß der Einzugsbereich eines Clusters ist
    });

    // LAYER 1: Die zusammengefassten Cluster (Große Kreise)
    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'widerstand-daten',
        filter: ['has', 'point_count'],
        paint: {
            // Die Farbe und Größe ändert sich, je nachdem wie viele Ereignisse im Cluster sind
            'circle-color': [
                'step',
                ['get', 'point_count'],
                '#00ffcc', // Farbe für kleine Cluster (unter 10)
                10,
                '#00b38f', // Farbe für mittlere Cluster (10 bis 50)
                50,
                '#006652'  // Farbe für riesige Cluster
            ],
            'circle-radius': [
                'step',
                ['get', 'point_count'],
                15, // Radius für kleine Cluster
                10,
                20, // Radius für mittlere Cluster
                50,
                30  // Radius für riesige Cluster
            ],
            'circle-opacity': 0.8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#00ffcc'
        }
    });

    // LAYER 2: Die Zahlen in den großen Clustern
    map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'widerstand-daten',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': '{point_count_abbreviated}',
            'text-size': 14
        },
        paint: {
            'text-color': '#000000'
        }
    });

    // LAYER 3: Die einzelnen, echten Ereignisse (wenn man nah genug dran ist)
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

    // INTERAKTION: Wenn man auf einen großen Cluster klickt, zoomt die Karte automatisch heran
    map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties.cluster_id;
        map.getSource('widerstand-daten').getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;
            map.easeTo({
                center: features[0].geometry.coordinates,
                zoom: zoom
            });
        });
    });

    // INTERAKTION: Pop-up öffnen (jetzt bei LAYER 3)
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

    // Mauszeiger ändert sich bei Clustern und Einzelpunkten
    map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });
    map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = ''; });

    // FILTER-LOGIK (Suche und Dropdown)
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

        // Wenn wir filtern, aktualisieren wir die Daten. Das Clustering passt sich automatisch an!
        map.getSource('widerstand-daten').setData({
            type: 'FeatureCollection',
            features: gefiltertePunkte
        });
    };

    document.getElementById('category-filter').addEventListener('change', filterKarte);
    document.getElementById('search-bar').addEventListener('input', filterKarte);
});