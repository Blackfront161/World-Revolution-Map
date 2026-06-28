const map = new maplibregl.Map({
    container: 'map', 
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', 
    center: [-40, 40], 
    zoom: 2 
});

let alleEreignisse = null;

map.on('load', async () => {
    
    // DER CACHE BUSTER: Durch die angehängte Zeit (Date.now()) MUSS der Browser die neue Datei laden.
    const response = await fetch('data.json?v=' + Date.now());
    alleEreignisse = await response.json();

    map.addSource('widerstand-daten', {
        type: 'geojson',
        data: alleEreignisse
    });

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

    map.on('click', 'widerstand-punkte', (e) => {
        const props = e.features[0].properties;
        const coordinates = e.features[0].geometry.coordinates.slice();
        
        const title = props.title;
        const category = props.category;
        const location = props.location; // Die neue Ortsangabe
        const description = props.description;
        const imageUrl = props.image;

        // Wenn ein Bild in der Datenquelle ist, wird es hier gerendert
        const imageHTML = imageUrl ? `<img src="${imageUrl}" class="popup-image" alt="Historisches Bild zu ${title}">` : '';
        const locationHTML = location ? `<div class="popup-location">📍 ${location}</div>` : '';

        new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(`${imageHTML}<span class="category-badge">${category}</span><h3>${title}</h3>${locationHTML}<p>${description}</p>`)
            .addTo(map);
    });

    map.on('mouseenter', 'widerstand-punkte', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'widerstand-punkte', () => { map.getCanvas().style.cursor = ''; });

    const filterKarte = () => {
        const ausgewaehlteKategorie = document.getElementById('category-filter').value;
        const suchText = document.getElementById('search-bar').value.toLowerCase();

        const gefiltertePunkte = alleEreignisse.features.filter(ereignis => {
            const props = ereignis.properties;
            
            const passtKategorie = (ausgewaehlteKategorie === 'alle' || props.category === ausgewaehlteKategorie);
            
            // NEU: Jetzt wird auch der Ort durchsucht!
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