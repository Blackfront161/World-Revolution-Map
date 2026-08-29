# World Revolution Atlas — Arbeitsstand und Übergabe

Stand: 2026-08-29. Lokale Testversion; nicht committed, gepusht oder veröffentlicht.

## Verbindliche Entscheidungen

- Produktname immer **World Revolution Atlas**, nicht übersetzen.
- Eigenständiger Atlas; Integration in World Revolution News ausdrücklich erst später.
- Alle vorhandenen uncommitteten Änderungen bewahren. Vor Weiterarbeit Git-Status lesen.
- Neun Sprachen: de, en, es, fr, it, pt, ru, el, tr. Vorhandene UI-Übersetzung ist
  nicht gleichbedeutend mit menschlichem Review oder vollständigen historischen Übersetzungen.
- Koordinatenschutz, Quellenkritik, Listenalternative und reduzierte Bewegung bewahren.
- Das bereitgestellte Logo bleibt unter `assets/brand/world-revolution-atlas-user-v1.png`
  bytegleich erhalten. Aktiv: separate Pergamentbearbeitung `world-revolution-atlas-parchment-v2.png`.

## Aktuell umgesetzt

- Globus als Opt-in unter Ansicht in den Suchfiltern; URL `?projection=globe`.
- Ohne Parameter weiterhin Mercator. Runder Knopf neben Ansicht: Weltübersicht.
- MapLibre GL JS 5.24.0, JS und CSS mit SHA-384-SRI; weiterhin CARTO-Kacheln.
  5.x ist ein bewusster Zwischenschritt, nicht die neueste Hauptversion.
- Keine automatische Rotation. Globus dreht durch Ziehen/Wischen; beim Hineinzoomen
  wird die Darstellung regional. Gewählte Ereignisse und Filter bleiben beim Umschalten erhalten.
- Papierglobus: gedeckte Meeresfarben, warme Landflächen und zurückhaltende Atmosphäre.
- Kleine Hochformatgeräte: eigene Kartenfläche unter der Mission, oberhalb der Navigation.
- Überlappungsschutz: kompakter Header blendet den unveränderlichen Produktnamen visuell
  unter 561 px zugunsten des Logos aus; mobile Navigationswörter werden nicht mehr mitten
  im Wort getrennt. Ereignismetadaten, Dialog-/Schubladentitel und Aktionsfelder umbrechen
  kontrolliert. Auf Desktop liegen Ereignisfenster, Missionskarte, Zoomsteuerung und Navigation
  nicht mehr übereinander; mittlere Desktopbreiten priorisieren beim Lesen das Ereignisfenster.
- Zusätzliche Kameraneigung ist im Globus ausgeblendet; Schutz-/Zoomgrenzen gelten weiter.
- Breite Trefferverteilung oder Datumsgrenzenüberquerung: Globusübersicht statt irreführendem Fit.
- Fünf neue UI-Schlüssel in neun Sprachen; Baseline bewusst um 40 ungeprüfte Zieltexte erweitert.
- Offlinecache-Generation r23; lokale Shell einschließlich neuem Projektionsmodul gecacht,
  Kartenruntime und Kacheln bleiben extern. Kein Versprechen einer Offline-Basiskarte.

## Inhalt und Prüfstand

- 674 Ereignisse / 25 Datendateien, 40 Biografien / 97 Quellen, 6 Routen.
- 376 übersetzbare UI-Schlüssel. 68.856 offene Reviewfelder im gesamten Sprachinventar.
- 54 bewusst offene Quellenprüfungen beim Inclusive-Language-Gate.
- 85 Node-Tests; dazu Daten-, Syntax-, Encoding-, Sprachinventar- und Sprachregressionsprüfung.
- Browser: Globus und Kartenwechsel, Pariser-Kommune-Fokus mit erhaltener Suche/URL,
  320px-Hochformat, 471 px, 1024 px und 1440 px, russische Langtexte, Dialog-/Schubladenköpfe
  und Bottom-Sheet-Abstände; Offline-Neustart ohne lokalen Server geprüft.
- Keine Vollfreigabe aller Geräte, Screenreader, Quellen, Übersetzungen oder Bildrechte behaupten.
- `npm`-Launcher ist lokal defekt; die Skripte funktionieren direkt mit `node`.

## Nächste Entscheidungen — noch nicht umgesetzt

1. **Terrain:** ausdrücklich erst Machbarkeit erklären. Kein Terrain-Code und keine
   zusätzliche Höhenquelle eingebaut. Optionales regionales Relief mit echten DEM-Daten
   ist möglich. Provider, Nutzungsrechte, Attribution, CSP und Leistungsbudget zuerst klären.
2. Gestaltung: Archivglobus verfeinern, alternativ Natur-/Reliefstil oder kuratierte Erzählansicht.
3. Werkzeuge: IIIF für Archivbilder; geprüfte/georeferenzierte historische Karten als Overlays;
   PMTiles für eigene Kartenauslieferung. Nur Vorschläge, keine Konten/Provider angebunden.
4. Vor Veröffentlichung reale Android-/iOS-Geräte, schwächere GPUs, Karte/Globus-Rückwechsel,
   reduzierte Bewegung, Gegenhemisphäre, Cluster, Routen und Deep-Links systematisch prüfen.

## Fortsetzen

Repository: `C:\Users\patri\Documents\ChatGPT\Widerstands Karte`

Vorschau: http://127.0.0.1:4187/?style=paper&projection=globe

Wichtige Dateien: `script.js`, `styles.css`, `index.html`, `src/map-projection.js`,
`src/map-focus.js`, `src/i18n.js`, `service-worker.js`, `tests/map-projection.test.js`.

Der Aufgabenverlauf ist lang. Für eine neue größere Ausbauphase ist eine fokussierte
Folgeaufgabe mit dieser Notiz sinnvoll; das ist eine Vorsichtsmaßnahme, kein Nachweis
eines bereits eingetretenen Qualitätsverlusts. Nicht aus alten Verlaufsaussagen auf
aktuellen Deployment-, PR- oder Reviewstatus schließen.
