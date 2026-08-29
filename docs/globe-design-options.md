# Globus: Gestaltung und Erweiterungen

Stand 2026-08-28. Vorschläge, keine zusätzlichen Provider angebunden.

## Gestaltungsrichtungen

| Richtung | Wirkung | Nächster sinnvoller Schritt |
| --- | --- | --- |
| Archivglobus | Pergament, gedecktes Türkis, feine Grenzen, historische Druckgrafik | Aktuelle Testversion verfeinern, Markerdichte reduzieren und Legende verbessern |
| Natur-/Reliefglobus | Landformen und Landschaft als Kontext historischer Ereignisse | Regional zuschaltbares Terrain mit dezenter Höhendarstellung |
| Erzählglobus | Kuratierte Stationen, Bildkarten und kurze Lesekapitel | Bestehende Routen mit geprüftem Bildmaterial verbinden |
| Quellenansicht | Historische Karte über heutiger Geografie, Transparenzregler | Eine rechtegeklärte, georeferenzierte Pilotkarte mit Datum und Unsicherheit |

Empfehlung: Archivglobus als Grundgestaltung, Erzählansicht als Inhaltsführung,
Relief nur optional. Keine automatischen Drehungen, blinkenden Punkte oder
ungekennzeichneten historischen Rekonstruktionen.

## Werkzeuge und Datenanbindungen

- **MapLibre GL JS:** vorhandene Basis für Globus, Filter, Marker, Routen und
  Gelände. Ein Wechsel zu MapLibre Native ist für diese Browser-App nicht nötig.
  [Globusbeispiel](https://maplibre.org/maplibre-gl-js/docs/examples/display-a-globe-with-a-vector-map/)
- **Höhendaten / DEM:** echtes Terrain benötigt zusätzliche Raster-Höhenkacheln.
  MapLibre zeigt auch ein kombiniertes Globus-/Terrainbeispiel. Providerfreigabe,
  Auflösung, Attribution, CORS/CSP, Kosten und Mobiltests sind vor Integration nötig.
  [Terrainbeispiel](https://maplibre.org/maplibre-gl-js/docs/examples/create-a-heatmap-layer-on-a-globe-with-terrain-elevation/)
- **IIIF:** standardisierte Anbindung von Archivobjekten, Bildfolgen, Metadaten und
  Quellenhinweisen. IIIF ist keine automatische Bildlizenz; Rechte pro Objekt prüfen.
  [IIIF Presentation API](https://iiif.io/api/presentation/3.0/)
- **PMTiles:** perspektivisch eigene Kartendateien per HTTP-Range-Anfragen mit MapLibre
  ausliefern; mehr Kontrolle über Hosting. Nicht automatisch ein mobiles Offlinepaket:
  Download-, Speicher-, Lizenz- und Updatekonzept zusätzlich notwendig.
  [PMTiles mit MapLibre](https://docs.protomaps.com/pmtiles/maplibre)
- **Redaktioneller Medienkatalog:** vorhandene Ereignis-IDs mit geprüften Bildrechten,
  Alternativtexten, Datierung, Urheber*innen und eindeutiger Kennzeichnung als
  Originalaufnahme oder Symbolbild verbinden. Keine ungeprüfte Bildsuche im Client.

## Terrain: möglich, aber derzeit ausdrücklich nicht eingebaut

Empfohlener Pilot: ein historisch öffentlicher Ort mit Gebirgsumgebung, manuell
einschaltbares Relief, Höhenüberhöhung zunächst 1,0×, zusätzliche Downloads erst
nach Opt-in. Ferne Weltübersicht ohne Terrain; regionale Darstellung nach
Kompatibilitätsprüfung gegebenenfalls in der flachen Projektion. Schwächere Geräte
behalten eine Darstellung ohne Relief. Die Schutzregeln für sensible Orte bleiben
unverändert; Terrain darf keine genauere Ereignisposition erschließen.

Moderne Höhendaten sind keine Rekonstruktion der historischen Umgebung. Gebäude,
Vegetation, Küstenverläufe und frühere Landschaftszustände benötigen eigene Quellen.
Meeresbodentopografie ist ein separates Bathymetrie-Thema, kein automatischer
Bestandteil eines Land-Höhenmodells.
