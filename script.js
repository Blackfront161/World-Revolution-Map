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
        const category = e.features[0].properties.category;
        const description = e.features[0].properties.description;

        new maplibregl.Popup()
            .setLngLat(coordinates)
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

    // NEU: Die Logik für das Dropdown-Menü
    document.getElementById('category-filter').addEventListener('change', (e) => {
        const ausgewaehlteKategorie = e.target.value;

        if (ausgewaehlteKategorie === 'alle') {
            // Wenn "Alle" ausgewählt ist, heben wir den Filter auf
            map.setFilter('widerstand-punkte', null);
        } else {
            // Ansonsten filtern wir so, dass nur Punkte der gewählten Kategorie angezeigt werden
            map.setFilter('widerstand-punkte', ['==', ['get', 'category'], ausgewaehlteKategorie]);
        }
    });
});