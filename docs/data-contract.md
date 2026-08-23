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
