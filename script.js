// 1. Die Karte aufbauen
const map = new maplibregl.Map({
    container: 'map', 
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', 
    center: [-40, 40], 
    zoom: 2 
});

// 2. Warten, bis die Weltkarte fertig geladen ist
map.on('load', () => {
    
    // Datenquelle laden
    map.addSource('widerstand-daten', {
        type: 'geojson',
        data: 'data.json'
    });

    // Punkte zeichnen
    map.addLayer({
        id: 'widerstand-punkte',
        type: 'circle',
        source: 'widerstand-daten',
        paint: {
            'circle-color': '#00ffcc', 
            'circle-radius': 8,        
            'circle-blur': 0.2         
        }
    });

    // Klick-Interaktion (Pop-ups) hinzufügen
    map.on('click', 'widerstand-punkte', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const title = e.features[0].properties.title;
        // NEU: Wir holen uns die Kategorie aus den Daten
        const category = e.features[0].properties.category;
        const description = e.features[0].properties.description;

        new maplibregl.Popup()
            .setLngLat(coordinates)
            // NEU: Die Kategorie wird als Span (Abzeichen) vor dem Titel eingefügt
            .setHTML(`<span class="category-badge">${category}</span><h3>${title}</h3><p>${description}</p>`)
            .addTo(map);
    });

    // Mauszeiger verwandelt sich in eine Hand
    map.on('mouseenter', 'widerstand-punkte', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    // Mauszeiger wird wieder normal
    map.on('mouseleave', 'widerstand-punkte', () => {
        map.getCanvas().style.cursor = '';
    });
});