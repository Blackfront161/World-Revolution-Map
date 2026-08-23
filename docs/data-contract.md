# Interner Datenvertrag

Der maschinenlesbare Vertrag steht in `data/archive-contract.json`. Er gilt für das eigenständige Archiv-Spiel und ist bewusst rückwärtskompatibel zur bestehenden Ereignissammlung.

## Identität und Versionierung

- `schemaVersion` ist eine positive Ganzzahl. Version 1 ergänzt Metadaten, ohne alte Ereignisdateien ungültig zu machen.
- `id` ist eine stabile, kleingeschriebene, durch Bindestriche getrennte kanonische ID. Veröffentlichte IDs werden weder wiederverwendet noch still umbenannt.
- `aliases` enthält optionale frühere oder alternative IDs. Eine Alias-ID muss projektweit eindeutig sein und auf genau eine kanonische ID zeigen.
- Links und Routen speichern immer die kanonische ID; der Resolver akzeptiert zusätzlich Aliase.

## Herkunft, Rechte und Prüfung

- `provenance.sourceUrls` nennt die konkrete redaktionelle Quellenbasis; `checkedAt` ist der letzte Link-/Inhaltsabgleich.
- `license.status` beschreibt ausschließlich den bekannten Rechtezustand des jeweiligen Datensatzes. `rights-unclear` bedeutet ausdrücklich nicht frei lizenziert.
- `reviewStatus` unterscheidet Bestand, Pilotstand und redaktionell vertiefte Einträge. Ein Prüfstatus ist keine Garantie auf Fehlerfreiheit.
- Quellen werden paraphrasiert. Kurze Stimmen oder Zitate benötigen eine direkte Quellenbasis; erfundene oder rückübersetzte Zitate sind unzulässig.

## Koordinaten und Sensitivität

`coordinatePrecision` hat genau vier Werte:

- `exact`: fester, historisch öffentlicher Ort; Veröffentlichung birgt kein erkennbares aktuelles Schutzrisiko.
- `approximate`: Stadt- oder Ortsnähe, keine punktgenaue Behauptung.
- `region`: ein räumlich verteilter Kampf; der Punkt dient nur als Kartenanker.
- `hidden`: angezeigter Punkt ist absichtlich grob. Aktuelle Treffpunkte, Schutzräume oder gefährdete Gemeinschaften dürfen daraus nicht ableitbar sein.

Die 53 bereits als sensibel gekennzeichneten Ereignisse sind in `data/event-metadata.json` einzeln klassifiziert. Vier gegenwärtige bzw. fortwirkende Land-/Wasserschutzkontexte und die weiterhin bestehende Aboriginal Tent Embassy sind zusätzlich als `hidden` behandelt. Die Anwendung zeigt die Präzisionsstufe, aber keine numerischen Koordinaten in der Detailansicht.

## Redaktionelle Überschreibungen

`data/event-editorial-overrides.json` vertieft vorhandene IDs. Es ist kein zweiter Ereigniskatalog: Geometrie, Titel und Grunddaten bleiben im ursprünglichen Datensatz; die Redaktionsebene überschreibt nur belegte Text- und Quellenfelder.

`data/routes.json` referenziert ausschließlich kanonische IDs. Fehlende, doppelte oder aliasbasierte Stopps lassen die Validierung scheitern.

## Kartenmodell, Zeit und Themenebenen

`data/map-taxonomy.json` ist die kontrollierte, versionierte Taxonomie der Kartenoberfläche:

- `time` legt den erlaubten Zeitraum, die Standardgrenzen und den ausdrücklichen Umgang mit undatierten Einträgen fest. Negative Werte stehen für Jahre vor unserer Zeitrechnung. Der Regler erzeugt keine zusätzliche Datierungsgenauigkeit; sichtbare ungefähre Datierungen bleiben in `dateLabel` und `uncertainty` erklärt.
- `layers` enthält stabile Themen-IDs. Die Zuordnung wird aus vorhandener Kategorie und vorhandenen Tags abgeleitet; mehrere gewählte Ebenen werden als einschließende ODER-Suche behandelt.
- `tactics` enthält stabile Symbol-IDs, ein lokales Textsymbol und belegte Suchbegriffe. Ein unbekannter oder nicht zuordenbarer Begriff bleibt als Text sichtbar und wird nicht erraten.
- `styles` enthält die drei lokalen Darstellungsvarianten. Sie verwenden dieselbe dokumentierte Basiskarte und wechseln keinen Tileanbieter.
- `network` begrenzt Knoten und Kanten, damit die Zusatzansicht bei der vollständigen Sammlung bedienbar bleibt.

Die reproduzierbaren URL-Parameter heißen `from`, `to`, `undated`, `layers` und `style`. Sie enthalten niemals Ereigniskoordinaten.

## Beziehungen

`data/relations.json` modelliert sichtbare Verbindungen als eigene Objekte. Jede Relation besitzt eine stabile `id`, zwei kanonische Ereignis-IDs, `relationType` und `evidenceMode`.

- `same-route` beschreibt ausschließlich die redaktionelle Nachbarschaft innerhalb einer belegten Route.
- `similar-tactic` kennzeichnet eine nachvollziehbare Ähnlichkeit, keine historische Beeinflussung.
- `shared-movement` kennzeichnet dieselbe Gemeinschaft oder Bewegung, soweit dies in den Ereignisdaten bzw. Quellen belegt ist.
- `editorial-relation` ist für eine ausdrücklich belegte redaktionelle Beziehung reserviert und benötigt den Modus `sourced-relation` mit Quellenbeleg.

`heuristic-similarity` darf niemals als Ursache, Einfluss oder direkte Zusammenarbeit formuliert werden. Der Validator weist unbekannte IDs, doppelte Relationen, Selbstbezüge, unzulässige Typen und fehlende Quellen bei ausdrücklich behaupteten Beziehungen zurück.

## Schutz in Ausgabe und Deep-Links

Die Präzisionsklasse ist Teil des redaktionellen Metadatensatzes, nicht Teil der URL. `hidden`-Ereignisse werden weder als Punkt-Feature an MapLibre übergeben noch mit numerischen Koordinaten in Detailansicht, Listenansicht, öffentlichem App-Snapshot oder Deep-Link ausgegeben. Die Oberfläche darf nur einen ungefährlichen Welt-/Regionsanker zur Navigation verwenden und muss den Schutzgrund sichtbar erklären.
