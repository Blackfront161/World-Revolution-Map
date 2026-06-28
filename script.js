// 1. Die Karte aufbauen
const map = new maplibregl.Map({
    container: 'map', 
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', 
    center: [-40, 40], 
    zoom: 2 
});

// Hier speichern wir die Originaldaten zwischen, damit wir sie durchsuchen können
let alleEreignisse = null;

// 2. Warten, bis die Weltkarte fertig geladen ist
map.on('load', async () => {
    
    // NEU: Wir laden die Daten jetzt direkt aus der Datei in unseren Speicher
    const response = await fetch('data.json');
    alleEreignisse = await response.json();

    // Die Datenquelle zur Karte hinzufügen
    map.addSource('widerstand-daten', {
        type: 'geojson',
        data: alleEreignisse
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
        // NEU: Bild-URL auslesen
        const imageUrl = e.features[0].properties.image;

        // Wenn es ein Bild gibt, bauen wir den HTML-Code dafür zusammen
        const imageHTML = imageUrl ? `<img src="${imageUrl}" class="popup-image" alt="Historisches Bild zu ${title}">` : '';

        new maplibregl.Popup()
            .setLngLat(coordinates)
            // Das Bild wird ganz oben ins Fenster eingefügt
            .setHTML(`${imageHTML}<span class="category-badge">${category}</span><h3>${title}</h3><p>${description}</p>`)
            .addTo(map);
    });

    // Mauszeiger-Interaktionen
    map.on('mouseenter', 'widerstand-punkte', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'widerstand-punkte', () => { map.getCanvas().style.cursor = ''; });

    // -----------------------------------------------------------------
    // NEU: Die kombinierte Logik für Suche und Dropdown
    // -----------------------------------------------------------------
    const filterKarte = () => {
        // 1. Was steht im Dropdown?
        const ausgewaehlteKategorie = document.getElementById('category-filter').value;
        // 2. Was steht im Suchfeld? (Alles in Kleinbuchstaben, damit Groß-/Kleinschreibung egal ist)
        const suchText = document.getElementById('search-bar').value.toLowerCase();

        // 3. Wir sortieren die Originaldaten aus
        const gefiltertePunkte = alleEreignisse.features.filter(ereignis => {
            const props = ereignis.properties;
            
            // Passt die Kategorie?
            const passtKategorie = (ausgewaehlteKategorie === 'alle' || props.category === ausgewaehlteKategorie);
            
            // Ist der Suchbegriff im Titel oder in der Beschreibung?
            const titelKlein = props.title.toLowerCase();
            const textKlein = props.description.toLowerCase();
            const passtSuche = titelKlein.includes(suchText) || textKlein.includes(suchText);

            // Der Punkt darf bleiben, wenn BEIDES passt
            return passtKategorie && passtSuche;
        });

        // 4. Wir geben der Karte die neuen, gefilterten Daten
        map.getSource('widerstand-daten').setData({
            type: 'FeatureCollection',
            features: gefiltertePunkte
        });
    };

    // Wir lauschen, ob jemand tippt oder das Dropdown ändert
    document.getElementById('category-filter').addEventListener('change', filterKarte);
    // 'input' reagiert bei jedem einzelnen getippten Buchstaben!
    document.getElementById('search-bar').addEventListener('input', filterKarte);
});