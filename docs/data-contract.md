# Interner Datenvertrag

Der maschinenlesbare Vertrag steht in `data/archive-contract.json`. Er gilt für das eigenständige Archiv-Spiel und ist bewusst rückwärtskompatibel zur bestehenden Ereignissammlung.

## Identität und Versionierung

- `schemaVersion` ist eine positive Ganzzahl. Version 1 ergänzt Metadaten, ohne alte Ereignisdateien ungültig zu machen.
- `id` ist eine stabile, kleingeschriebene, durch Bindestriche getrennte kanonische ID. Veröffentlichte IDs werden weder wiederverwendet noch still umbenannt.
- `aliases` enthält optionale frühere oder alternative IDs. Eine Alias-ID muss projektweit eindeutig sein und auf genau eine kanonische ID zeigen.
- Biografien können in `searchAliases` ausschließlich kuratierte Namens- und häufige Schreibvarianten führen; daraus entsteht keine allgemeine Fuzzy-Suche.
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

Die ursprünglichen 53 sensiblen Ereignisse stehen als `baselineSensitiveIds` im Vertrag und müssen dauerhaft sensibel sowie in `data/event-metadata.json` klassifiziert bleiben. Der Gesamtwert ist absichtlich nicht fest codiert: Neue sensible Ereignisse sind zulässig, benötigen aber ebenfalls Metadaten und eine übereinstimmende `coordinatePrecision`. Vier gegenwärtige bzw. fortwirkende Land-/Wasserschutzkontexte und die weiterhin bestehende Aboriginal Tent Embassy sind zusätzlich als `hidden` behandelt. Diese fünf Datensätze besitzen bereits in den öffentlich ausgelieferten Ereignis-JSONs keine Koordinatenfelder; Validator und Tests erzwingen diese Invariante. Die Anwendung zeigt die Präzisionsstufe, aber keine numerischen Koordinaten in der Detailansicht.

## Eigenständiges Biografiemodell

`data/biography-catalog.json` katalogisiert drei Biografiedateien. Biografien sind keine Kartenereignisse, erhalten keine Koordinaten und verwenden stabile IDs nach dem Muster `bio-*`.

- Pflicht sind Name, Kurzbiografie, Lebensphasen, Ideen/Praxis, Organisierung/Errungenschaften, Spannungen/Kritik, Vermächtnis, Review-, Sensitivitäts-, Provenance- und Lizenzangaben.
- Jede Biografie benötigt mindestens zwei strukturierte HTTPS-Quellen mit Herausgeber, Sprache, Typ und Abrufdatum.
- `relatedEventIds` enthalten ausschließlich kanonische vorhandene Ereignis-IDs; sie begründen eine explizite UI-Verknüpfung, aber keine künstliche räumliche oder kausale Behauptung.
- Unbelegte Zitatfelder sind unzulässig. Die vorliegenden Texte paraphrasieren; direkte Stimmen müssten künftig einzeln und unmittelbar belegt werden.
- Lebensdaten dürfen als unsicher oder unbekannt erhalten bleiben. Der Zeitraumfilter erzeugt daraus keine falsche Genauigkeit.

Derzeit enthält der Katalog 40 Lebenswege und 97 Quellen. Die UI-Langtexte sind vollständig neunsprachig; die historischen Biografietexte bleiben als deutsche Originalfassung gekennzeichnet.

## Redaktionelle Überschreibungen

`data/event-editorial-overrides.json` vertieft vorhandene IDs. Es ist kein zweiter Ereigniskatalog: Geometrie, Titel und Grunddaten bleiben im ursprünglichen Datensatz; die Redaktionsebene überschreibt nur belegte Text- und Quellenfelder.

`data/routes.json` referenziert ausschließlich kanonische IDs. Fehlende, doppelte oder aliasbasierte Stopps lassen die Validierung scheitern.

## Soziale Errungenschaften

Einträge der Kategorie `Soziale Errungenschaft` können drei ausdrücklich getrennte Perspektivfelder führen:

- `bottomUpPressure`: Organisierung, Forderungen und Druck von unten;
- `achievement`: das konkret belegte rechtliche, soziale oder institutionelle Ergebnis;
- `limits`: Ausnahmen, Umsetzungsprobleme, Rückschritte und fortdauernde Konflikte.

Diese Trennung verhindert, dass Rechte als Geschenk von Regierungen oder als pauschal „gewonnen“ erzählt werden. Die drei maritimen Errungenschaften in `data/expansion-maritime.json` müssen alle Felder vollständig führen; der Validator erzwingt zusätzlich mindestens zwei Provenance-URLs und `rights-unclear`.

## Kartenmodell, Zeit und Themenebenen

`data/map-taxonomy.json` ist die kontrollierte, versionierte Taxonomie der Kartenoberfläche:

- `time` legt den erlaubten Zeitraum, die Standardgrenzen und den ausdrücklichen Umgang mit undatierten Einträgen fest. Negative Werte stehen für Jahre vor unserer Zeitrechnung. Der Regler erzeugt keine zusätzliche Datierungsgenauigkeit; sichtbare ungefähre Datierungen bleiben in `dateLabel` und `uncertainty` erklärt.
- `layers` enthält stabile Themen-IDs. Die Zuordnung wird aus vorhandener Kategorie und vorhandenen Tags abgeleitet; mehrere gewählte Ebenen werden als einschließende ODER-Suche behandelt.
- `tactics` enthält stabile Symbol-IDs, ein lokales Textsymbol und belegte Suchbegriffe. Ein unbekannter oder nicht zuordenbarer Begriff bleibt als Text sichtbar und wird nicht erraten.
- `styles` enthält die drei lokalen Darstellungsvarianten. Sie verwenden dieselbe dokumentierte Basiskarte und wechseln keinen Tileanbieter.
- `network` begrenzt Knoten und Kanten, damit die Zusatzansicht bei der vollständigen Sammlung bedienbar bleibt.

Die Ebene `maritime` wird ausschließlich über kontrollierte Begriffe wie `Maritime Gegenmacht`, `Meeresrechte`, `Meeresschutz` und `Hafenwiderstand` zugeordnet. Ein maritimer Marker erhält zusätzlich ein Wellenzeichen; Farbe ist nie das einzige Signal. Neue maritime Geometrien sind nur `approximate` oder `region`. Die gestrichelten Linien der beiden maritimen Routen visualisieren redaktionelle Nachbarschaft mit `curated-context`, keine tatsächliche Reise, Kausalität oder historische Einflusslinie.

Die reproduzierbaren URL-Parameter heißen `from`, `to`, `undated`, `q`, `category`, `layers`, `style`, `event`, `bio` und `compare`. Sie enthalten niemals Ereigniskoordinaten. `compare` akzeptiert höchstens drei begrenzte `event:*`-/`bio:*`-Referenzen.

## Beziehungen

`data/relations.json` modelliert sichtbare Verbindungen als eigene Objekte. Jede Relation besitzt eine stabile `id`, zwei kanonische Ereignis-IDs, `relationType` und `evidenceMode`.

- `same-route` beschreibt ausschließlich die redaktionelle Nachbarschaft innerhalb einer belegten Route.
- `similar-tactic` kennzeichnet eine nachvollziehbare Ähnlichkeit, keine historische Beeinflussung.
- `shared-movement` kennzeichnet dieselbe Gemeinschaft oder Bewegung, soweit dies in den Ereignisdaten bzw. Quellen belegt ist.
- `editorial-relation` ist für eine ausdrücklich belegte redaktionelle Beziehung reserviert und benötigt den Modus `sourced-relation` mit Quellenbeleg.

`heuristic-similarity` darf niemals als Ursache, Einfluss oder direkte Zusammenarbeit formuliert werden. Der Validator weist unbekannte IDs, doppelte Relationen, Selbstbezüge, unzulässige Typen und fehlende Quellen bei ausdrücklich behaupteten Beziehungen zurück.

## Schutz in Ausgabe und Deep-Links

Die Präzisionsklasse ist Teil des redaktionellen Metadatensatzes, nicht Teil der URL. `hidden`-Ereignisse werden weder als Punkt-Feature an MapLibre übergeben noch mit numerischen Koordinaten in Detailansicht, Listenansicht, öffentlichem App-Snapshot oder Deep-Link ausgegeben. Die Oberfläche darf nur einen ungefährlichen Welt-/Regionsanker zur Navigation verwenden und muss den Schutzgrund sichtbar erklären.
