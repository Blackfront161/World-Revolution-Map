# World Revolution Atlas

Eine interaktive, spielerische Weltkarte historischer Bewegungen, Aufstände, Streiks und Kämpfe um Selbstbestimmung. Besucher*innen reisen über die Karte, sichern Ereignisse für ihr persönliches Archiv, erfüllen Missionen, lösen Quizfragen und schalten Erfolge frei.

## Was die Anwendung bietet

- interaktive MapLibre-Weltkarte mit Clustern, beschrifteten Taktiksymbolen und erklärter Ortsgenauigkeit
- zugänglicher Zeitraumregler mit Zahleneingaben, optionaler Zeitreise, Deep-Link und ausdrücklicher Behandlung undatierter Einträge
- elf mehrfach auswählbare Themenebenen – einschließlich „Meere, Häfen & maritime Gegenmacht“ – mit aktiven Filterchips und gemeinsamem Filter für Karte, Liste, Routen, Zeitleiste und Ergebniszahl
- zehn lokale Taktiksymbole für Streik, Besetzung, Blockade, Boykott, Aufstand, Landverteidigung, gegenseitige Hilfe, Kunst/Medien, Selbstverwaltung und Gefangenenstreik
- optionale, begrenzte 2D-Netzwerkansicht mit zugänglicher Beziehungsliste und klarer Trennung von redaktionellen Routenbezügen und bloßen Ähnlichkeiten
- drei lokal umgeschaltete Kartenstile – dunkles Archiv, kontrastreich monochrom und warmes Papierarchiv – auf derselben attribuierten Basiskarte
- tolerante Volltextsuche mit Diakritika-, Bindestrich- und kuratierten Synonymvarianten sowie Kategorie-, Themen- und Zeitraumfiltern
- 674 kuratierte, aktive Ereignisse in 25 Datendateien aus allen Weltregionen
- 40 koordinatenfreie Lebenswege mit 97 strukturierten Quellen, Suche nach Person, Gemeinschaft/Region, Tradition und Zeitraum sowie Verknüpfungen zu bestehenden Ereignissen
- sechs geführte, quellengebundene Archiv-Routen mit neutralem Lesefortschritt und zugänglicher Stoppliste
- 33 validierte Beziehungen zwischen stabilen Ereignis-IDs; heuristische Ähnlichkeiten behaupten ausdrücklich keinen historischen Einfluss
- neun lokal gespeicherte Oberflächensprachen wie bei World Revolution News: Deutsch, Englisch, Spanisch, Französisch, Italienisch, Portugiesisch, Russisch, Griechisch und Türkisch
- Mehrfach-Tags für überlappende Spektren wie Anarchismus, indigener Widerstand, Antisexismus, Schwarze Befreiung, Antifaschismus, Antikolonialismus und Tierbefreiung
- regional aufgeteilte, über `data/event-catalog.json` erweiterbare Datendateien
- historische Spannweite vom frühesten ausführlich dokumentierten Streik in Deir el-Medina (ca. 1157 v. u. Z.) bis zu heutigen Bewegungen
- eigene Perspektiven auf frühe soziale Revolten, Widerstand versklavter Menschen, antifeudale Kämpfe, Commons und Rätebewegungen
- ein vertiefter Kanada-Schwerpunkt mit über 40 indigenen Land-, Autonomie-, Kultur-, Fischerei- und Umweltkämpfen vom 18. Jahrhundert bis zur Gegenwart
- soziale Errungenschaften als eigene Kategorie: erkämpfte Wahl-, Arbeits-, Gesundheits-, reproduktive und queere Rechte – jeweils mit ihren Grenzen und möglichen Rückschritten
- maritime Geschichte mit sechs neuen quellenkritischen Ereignissen, zwei Vertiefungen, zwei Vergleichsrouten, redundanten Wellenzeichen und einem Pirat*innen-Dossier, das interne Borddemokratie nicht mit allgemeiner Befreiung verwechselt
- optionaler Supabase-Abruf ausschließlich nach explizitem `?supabase=1`; die RC startet standardmäßig vollständig aus den lokalen Daten
- Karten-Popups mit Einordnung und weiterführender Quelle sowie präzisionsabhängigem, sensitivitätsschonendem Fokus; ein Remote-Bild erscheint nur nach vollständigem `rights-reviewed`-Einzelnachweis, sonst eine lokale Symbolkarte
- ausführliche, optionale Ergebnisfelder ohne Einteilung in „gewonnen“ oder „verloren“
- sichtbare und in allen neun UI-Sprachen beschriftete Quellenart, Quellenqualität, Prüfstatus, Unsicherheit und Hinweise zu sensiblen Inhalten
- 22 Ereignisvertiefungen als separate, nachvollziehbare Redaktionsebene; weitere Ereignisse führen ihre Redaktionsfelder direkt im jeweiligen Datensatz
- zugängliche, tastaturbedienbare Ereignistabelle als Alternative zur Karte
- sichtbare aktive Filter, die einzeln entfernt werden können
- Vorher-/Zurück-zur-Welt-/Nächster-Navigation, lokale Lesezeichen, benannte Sammlungen mit begrenztem JSON-Import/-Export und reproduzierbare Ansichtsparameter in der URL
- gemischter Vergleich von zwei bis drei Ereignissen oder Lebenswegen, „Hier weiterlesen“, Quellen-Metadatenvorschau und ruhiger Lesemodus
- atomar installierte Offline-Grundlage für lokale Oberfläche, beide Kataloge, alle katalogisierten Datendateien, Listen, Lebenswege, Routen und Sammlungen; eine unvollständige Cachegeneration wird nicht aktiviert, externe Kartenskripte und Kartenkacheln werden nicht vorab gespeichert
- lokales Fortschrittssystem mit XP, Levels und Entdeckungsarchiv
- zufällige und tägliche Missionen
- Wissensquiz, Solidaritäts-Combos und zehn freischaltbare Erfolge
- humorvolles Funkenlabor für belegbare Verbindungen zwischen Zeiten, Orten und Bewegungen
- satirische „Ausrede der Herrschenden“ mit historischer Gegenprobe
- mobil optimierte und tastaturbedienbare Oberfläche
- sichere DOM-Ausgabe statt ungeprüfter HTML-Injektion aus der Datenbank
- Content Security Policy, kryptografische CDN-Integritätsprüfung und begrenzte Remote-/Speicherdaten
- versionierte Einbettungs-API, Embed-Modus und strikt adressierte postMessage-Ereignisse
- automatische Rückfallebene, falls Supabase nicht erreichbar ist
- Tests für Normalisierung, Filter, Level, Missionen und Quizlogik

Spielfortschritt, Leseposition, Anzeigeeinstellungen und Sammlungen werden ausschließlich im lokalen Browser gespeichert. Es gibt weder Tracking noch ein Benutzerkonto. Die Integrations-API kann den validierten Spielstand exportieren, damit eine Host-App ihn freiwillig synchronisieren kann.

Die Sprache kann im Kopfbereich oder mit `?lang=de|en|es|fr|it|pt|ru|el|tr` gewählt werden. Oberfläche, Filterbegriffe, Zeitangaben, Missionen, Quiz, Funkenlabor sowie die Beschriftungen und standardisierten Kurzwerte der redaktionellen Quellenfelder werden vollständig lokal übersetzt. Historische Eigennamen bleiben unverändert; die kuratierten Langtexte und ereignisspezifischen Redaktionsfelder sind vorerst als gekennzeichnete deutsche Originalfassungen enthalten. Eine fachlich geprüfte Übersetzung dieser historischen Inhalte in die acht weiteren Sprachen bleibt redaktionell offen. Es wird kein Text an externe Übersetzungsdienste übertragen.

Zeit, Suche, Kategorie, Themenebenen, Kartenstil, Vergleich sowie ein Lebensweg können über `from`, `to`, `undated`, `q`, `category`, `layers`, `style`, `compare` und `bio` geteilt werden. `event` und `bio` werden robust nebeneinander verarbeitet. Die URL enthält keine Ereigniskoordinaten. Eine automatische Zeitreise ist optional und wird bei aktivierter Betriebssystem-Einstellung für reduzierte Bewegung abgeschaltet.

## Produktlogo

Das bereitgestellte Original liegt unverändert in
`assets/brand/world-revolution-atlas-user-v1.png` (1254 × 1254 Pixel).
Die aktive, KI-bearbeitete Hintergrundvariante liegt separat in
`assets/brand/world-revolution-atlas-parchment-v2.png` (1254 × 1254 Pixel, ca. 3,12 MB).
Der Bildbearbeitungsauftrag ersetzt den schwarzen Außenhintergrund durch warmes,
dezent gealtertes Pergament und erhält Schrift, Komposition und Farben möglichst nah
am Original; die bearbeitete Variante ist nicht pixelidentisch und nicht transparent.
Eine messinggerahmte Papiereinfassung verbindet sie mit dem Serifensatz der
Oberfläche. Das Logo im Kopfbereich öffnet die Einführung mit einer größeren,
unbeschnittenen Ansicht. Unter 470 Pixeln bleibt im Kopfbereich nur die Plakette;
der vollständige Produktname ist weiterhin für Screenreader verfügbar und steht
in der Einführung zusätzlich als Text. Der Kontrastmodus zeigt die gesamte
Oberfläche einschließlich Logo monochrom; die Quelldatei wird nicht verändert.
Die früheren Entwürfe bleiben zur Nachvollziehbarkeit gespeichert, werden aber
nicht mehr als Produktlogo angezeigt oder vorab in den Offlinecache geladen.

## Sanfte Kartenperspektive

Unter **Kartenstil → Sanfte 3D-Perspektive** lässt sich eine optionale,
nordorientierte Kameraneigung einschalten: 28° am Desktop, 20° im mobilen Layout.
2D bleibt bei jedem Neustart Standard. Betriebssystemseitig reduzierte Bewegung
deaktiviert den Schalter und stellt ohne Animation auf 2D zurück. Sensible,
regionale, verborgene oder nicht klassifizierte Ereignisorte werden ebenfalls
flach fokussiert; Koordinaten- und Zoomgrenzen bleiben unverändert.
Es ist eine [MapLibre-Kameraperspektive](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/CameraOptions/),
kein Gelände-, Gebäude- oder Satellitenmodell. Keine neuen Kartenanbieter,
Datenpakete oder Daueranimationen werden dafür geladen. Kartenkacheln benötigen
weiterhin Netz; die lokale Archivliste und das Logo bleiben im Offlinepaket.

## Globus-Testversion (2026-08-28)

`?projection=globe` aktiviert den Globus; ohne Parameter bleibt die flache Karte
Standard. Oben in den Suchfiltern lässt sich **Ansicht** zwischen beiden wechseln.
Der runde Knopf daneben öffnet die Weltübersicht. Filter und Ereignis-IDs bleiben
erhalten; die Rückseite ist naturgemäß nicht sichtbar, die Liste enthält alle Treffer.
Ziehen/Wischen dreht die Erde; es gibt keine automatische Rotation. Reduzierte
Bewegung unterdrückt Kamerafahrten. Im Globus ist die zusätzliche Kameraneigung
deaktiviert; die vorhandenen Zoom- und Koordinatenschutzregeln gelten weiter.

Die Runtime wurde für diese lokale Testversion von MapLibre GL JS 4.7.1 auf
5.24.0 aktualisiert (JS/CSS fest versioniert mit neuen SHA-384-Prüfsummen).
Das ist der geprüfte 5.x-Zwischenschritt, keine Behauptung über die neueste
Hauptversion. Kartenstil und Kacheln bleiben bei CARTO; keine zusätzlichen
Provider, Konten oder API-Schlüssel wurden ergänzt. Ein synchroner Fehler beim
Projektionswechsel fällt auf Mercator zurück; ohne funktionierende WebGL-Runtime
bleiben die Archivlisten verfügbar. Gelände wurde ausdrücklich noch nicht eingebaut.

Die Notices wurden mit der vollständigen 5.24.0-Lizenz abgeglichen (Lizenztext
unverändert). Ältere Auditdokumente beschreiben weiterhin ihren damaligen Stand.
Lokaler Arbeitsstand und nächste Entscheidungen: `docs/current-handoff.md`.

## In eine andere App einbetten

Der Atlas kann als iframe, WebView oder Mikro-Frontend eingebunden werden. Query-Parameter steuern Embed-Modus, Einführung, Akzentfarbe und den optionalen Supabase-Zugriff. Eine kleine JavaScript-API bietet Filter, Ereignisfokus, Panels sowie Fortschrittsimport und -export. Die vollständige Schnittstelle und ein abgesichertes iframe-Beispiel stehen in `docs/embedding.md`.

## Sicherheit

- Datenbankinhalte werden ausschließlich über `textContent` und DOM-Knoten ausgegeben.
- Quellenlinks akzeptieren nur HTTPS; ungeprüfte Bildfelder und Bild-APIs sind deaktiviert, optionale Ereignisbilder benötigen die enge Host- und Einzelrechteprüfung des Datenvertrags.
- Fortschrittsimporte werden typisiert, längenbegrenzt und gegen bekannte Ereignis-IDs abgeglichen.
- Sammlungsimporte sind auf 200 KB, 20 Sammlungen und insgesamt 500 bekannte Ereignis-/Biografiereferenzen begrenzt.
- Supabase ist standardmäßig aus und wird nur mit `?supabase=1` geladen; Live-Daten sind dann auf 2.000 Zeilen pro Abruf begrenzt.
- Externe Skripte und Styles sind fest versioniert und mit SHA-384-SRI abgesichert.
- Die CSP beschränkt Skripte, Netzwerkziele, Worker, Formulare und Plugins.
- postMessage wird nur mit einer expliziten, validierten Empfänger-Origin aktiviert; `*` ist verboten.
- Sprachwahl und Übersetzungen funktionieren offline; Atlas-Texte werden nicht an Übersetzungsdienste gesendet.
- Ereignisdetails, Tabellenzeilen und Quellenhinweise entstehen ausschließlich mit DOM-Knoten und `textContent`.

## Geschichte von unten und Methodik

Die Karte beginnt bei Beteiligten, Betroffenen, Basisbewegungen und lokalen Gemeinschaften. Rechte werden nicht als Geschenke von Regierungen erzählt. Ergebnisse beschreiben unmittelbare Folgen, Repression, menschliche Kosten, langfristige Wirkungen und offene Forderungen konkret und dürfen nicht als „gewonnen“ oder „verloren“ verkürzt werden.

Quellentyp, Quellenqualität und redaktioneller Prüfstand sind getrennte Felder. Ältere Wikipedia-Links bleiben transparent als sekundäre oder weiterführende Einstiege sichtbar; sie werden nicht nachträglich zu Primärquellen erklärt. Umstrittene Datierungen und Deutungen gehören in `uncertainty`. Ereignisse mit schwerer Gewalt nutzen den sachlichen Modus: keine XP, Missionen, Quizfragen, Solidaritäts-Combos oder satirischen Kommentare.

Die Grundsätze sind direkt in der Anwendung über „Über diese Karte und Methodik“ erreichbar. Korrekturen und bessere Quellen können über GitHub Issues vorgeschlagen werden.

Der stabile Datenvertrag ist in [`docs/data-contract.md`](docs/data-contract.md) und maschinenlesbar in [`data/archive-contract.json`](data/archive-contract.json) beschrieben. Die ursprünglichen 53 sensiblen Ereignisse sind als nicht-regressierbare Basis im Vertrag verankert; auch jedes neu hinzukommende sensible Ereignis benötigt eine geprüfte Ortsgenauigkeitsklasse. Aktuelle oder fortwirkende Schutzkontexte werden nur grob verortet. Rechte- und Attributionsstände für Code, Ereignisdaten, Biografietexte, Bilder und Kartendaten stehen getrennt in [`docs/licensing-and-attribution.md`](docs/licensing-and-attribution.md); vollständige versionierte Drittanbieterhinweise stehen in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). Diese Dokumente erteilen ausdrücklich keine pauschale Gesamtprojektlizenz.

Die Kartentaxonomie liegt in [`data/map-taxonomy.json`](data/map-taxonomy.json), die eigenständigen Beziehungen in [`data/relations.json`](data/relations.json). Verborgene Schutzorte werden nicht als Marker und nicht als numerische Koordinaten an DOM, öffentliche App-Snapshots oder Deep-Links ausgegeben. Die visuelle Netzwerkdarstellung ist auf 72 Knoten und 140 Kanten begrenzt; die relationale Liste bleibt die barrierearme Alternative. Ein 3D-Globus ist bewusst zurückgestellt, weil er gegenüber dieser Stufe zusätzliche Renderinglast und eine parallele zugängliche Bedienoberfläche erfordern würde, ohne den Quellenwert zu erhöhen.

Satelliten-/Luftbildkarten bleiben ebenfalls zurückgestellt: Ein zusätzlicher Anbieter benötigt eine separate Prüfung von Vertrag, Lizenz, Attribution, CSP und Datenschutz.

Der Publishable Key im Browser ist bestimmungsgemäß öffentlich und kein Geheimnis. Die Sicherheit der Datenbank hängt davon ab, dass das dokumentierte RLS-/Grant-Schema tatsächlich in der produktiven Supabase-Instanz angewendet wird. Spiel-XP ist lokale UI-Daten und darf nie als serverseitige Berechtigung oder geldwerter Nachweis gelten.

## Lokal starten

Die Anwendung benötigt keinen Build-Schritt. Wegen der JSON-Daten sollte sie über einen lokalen Webserver geöffnet werden:

```bash
node scripts/serve.mjs
```

Danach `http://localhost:4173` aufrufen.

## Tests

```bash
npm test
npm run verify
npm run check:translations
npm run check:inclusive-language
npm run check:sources
```

Benötigt wird Node.js 20 oder neuer. Es müssen keine Pakete installiert werden. Die Quellenprüfung benötigt Internetzugang und weist 401-, 403-, 405- und 429-Antworten separat als automatisiert blockiert aus; 404/410 bleiben definitive Fehler.

Der Übersetzungs- und Inclusive-Language-Prozess ist in [docs/translation-workflow.md](docs/translation-workflow.md) dokumentiert. `npm run check:translations:strict` ist das bewusst noch rote Vollständigkeits-Zielgate und gehört nicht zum normalen PR-Gate.

## Datenquellen

Beim Start liest die Anwendung `data/event-catalog.json` und lädt daraus die 25 Ereignisdateien. `data/biography-catalog.json` katalogisiert drei eigenständige Biografiedateien; Lebenswege werden nicht als Kartenereignisse behandelt und erhalten keine künstlichen Koordinaten. Neue Sammlungen können durch eine zusätzliche JSON-Datei und einen Katalogeintrag ergänzt werden, ohne den JavaScript-Lader zu verändern. Nur mit dem ausdrücklichen Parameter `?supabase=1` werden Datensätze aus `public.ereignisse` ergänzt beziehungsweise mit gleichnamigen Einträgen zusammengeführt. Ohne diesen Parameter startet die RC ausschließlich aus dem lokalen Archiv.

Ein Eintrag besitzt eine primäre Kategorie und beliebig viele `tags`. Der Filter berücksichtigt beides. Negative Jahreswerte stehen für Jahre vor unserer Zeitrechnung; für ihre sichtbare Datierung wird zusätzlich `dateLabel` gepflegt. Paläontologische Fundorte gehören nicht in diesen Atlas: Der zeitliche Anfang folgt der frühesten belastbaren Überlieferung kollektiven sozialen Handelns. Moderne Begriffe werden in antiken und mittelalterlichen Einträgen nicht als Selbstbezeichnungen ausgegeben.

Das Datenmodell akzeptiert zusätzlich rückwärtskompatible optionale Felder: `demands`, `participants`, `powerStructures`, `tactics`, `immediateConsequences`, `longTermImpact`, `repression`, `humanCosts`, `aftermath`, `openQuestions`, `voices`, `sourceType`, `sourceQuality`, `uncertainty`, `sensitivity`, `reviewStatus`, `schemaVersion`, `aliases`, `coordinatePrecision`, `provenance`, `license`, das einzeln zu prüfende `visualMedia` sowie für soziale Errungenschaften `bottomUpPressure`, `achievement` und `limits`. Neue Einträge sollen diese Felder nur mit belegbaren Aussagen füllen; leere Felder dürfen leer bleiben. Kontrollierte Themen-, Taktik-, Stil- und Zeitwerte stehen in `data/map-taxonomy.json`; Beziehungen mit stabiler ID, `relationType` und `evidenceMode` stehen getrennt in `data/relations.json`.

Geprüfte Ereignisübersetzungen werden optional und feldweise unter `translations` gespeichert. Jede Sprachfassung muss pro Feld die Form `{ "text": "…", "status": "reviewed" }` verwenden. Nur so markierte Felder überschreiben das deutsche Original; Entwürfe oder fehlende Felder werden nicht als Übersetzung ausgegeben. Die Oberfläche kennzeichnet deshalb auch teilweise übersetzte Einträge ausdrücklich.

Für die historischen Ereignis- und Biografie-Langtexte liegen derzeit noch keine vollständigen fachlich geprüften Übersetzungen in allen neun Sprachen vor. Die neuen Lebenswege-, Sammlungs-, Vergleichs-, Lese- und Offline-Hinweise sind in allen neun UI-Sprachen übersetzt; historische Langtexte bleiben sichtbar als deutsches Original gekennzeichnet.

Das erweiterte Referenzschema einschließlich einer Nur-Lesen-RLS-Policy befindet sich unter `docs/supabase-schema.sql`. Der im Browser verwendete Supabase-Schlüssel ist ein öffentlicher Publishable Key. Schreibzugriffe müssen dennoch zwingend durch Row Level Security blockiert werden.

## Tastaturkürzel

Ereignisdetails und Auswahlmarkierung erscheinen sofort beim Öffnen, parallel zur
präzisionsabhängigen Kamerafahrt. Schnelle Wechsel erzeugen keine verzögert
aufspringenden Detailfenster. `Esc` schließt auch die Ereignisansicht und hält
ihre laufende Kamerafahrt an. Die Systemeinstellung für reduzierte Bewegung gilt
ebenfalls beim Auflösen von Punktgruppen.

- `F` – Suche fokussieren
- `R` – zufällige Spur anzeigen
- `M` – neue Mission starten
- `V` – Funkenlabor öffnen
- `?` – Einführung und Spielregeln öffnen
- `Esc` – Dialoge und Seitenleisten schließen

## Inhaltlicher Hinweis

Der Atlas ist ein Bildungs- und Vermittlungsprojekt. Seine Kurztexte können komplexe historische Konflikte nur einführen und ersetzen keine wissenschaftliche Quellenprüfung. Beiträge sollten den Grundsätzen in `CONTRIBUTING.md` folgen.
