# Atlas des Widerstands

Eine interaktive, spielerische Weltkarte historischer Bewegungen, Aufstände, Streiks und Kämpfe um Selbstbestimmung. Besucher*innen reisen über die Karte, sichern Ereignisse für ihr persönliches Archiv, erfüllen Missionen, lösen Quizfragen und schalten Erfolge frei.

## Was die Anwendung bietet

- interaktive MapLibre-Weltkarte mit Clustern und farbcodierten Kategorien
- Volltextsuche sowie Kategorie- und Zeitraumfilter
- 500 kuratierte Ereignisse aus allen Weltregionen
- Mehrfach-Tags für überlappende Spektren wie Anarchismus, indigener Widerstand, Antisexismus, Schwarze Befreiung, Antifaschismus, Antikolonialismus und Tierbefreiung
- regional aufgeteilte, über `data/event-catalog.json` erweiterbare Datendateien
- historische Spannweite vom frühesten ausführlich dokumentierten Streik in Deir el-Medina (ca. 1157 v. u. Z.) bis zu heutigen Bewegungen
- eigene Perspektiven auf frühe soziale Revolten, Widerstand versklavter Menschen, antifeudale Kämpfe, Commons und Rätebewegungen
- Live-Daten aus Supabase, automatisch mit dem Fallback-Archiv zusammengeführt
- Karten-Popups mit Einordnung, Bild und weiterführender Quelle
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

Der Spielfortschritt wird ausschließlich im lokalen Browser gespeichert. Es gibt weder Tracking noch ein Benutzerkonto. Die Integrations-API kann diesen validierten Spielstand exportieren, damit eine Host-App ihn freiwillig synchronisieren kann.

## In eine andere App einbetten

Der Atlas kann als iframe, WebView oder Mikro-Frontend eingebunden werden. Query-Parameter steuern Embed-Modus, Einführung, Akzentfarbe und den optionalen Supabase-Zugriff. Eine kleine JavaScript-API bietet Filter, Ereignisfokus, Panels sowie Fortschrittsimport und -export. Die vollständige Schnittstelle und ein abgesichertes iframe-Beispiel stehen in `docs/embedding.md`.

## Sicherheit

- Datenbankinhalte werden ausschließlich über `textContent` und DOM-Knoten ausgegeben.
- Quellenlinks akzeptieren nur HTTPS; dynamische Bilder und Bild-APIs sind auf Wikimedia/Wikipedia begrenzt.
- Fortschrittsimporte werden typisiert, längenbegrenzt und gegen bekannte Ereignis-IDs abgeglichen.
- Supabase-Live-Daten sind auf 2.000 Zeilen pro Abruf begrenzt.
- Externe Skripte und Styles sind fest versioniert und mit SHA-384-SRI abgesichert.
- Die CSP beschränkt Skripte, Netzwerkziele, Worker, Formulare und Plugins.
- postMessage wird nur mit einer expliziten, validierten Empfänger-Origin aktiviert; `*` ist verboten.

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
npm run check:sources
```

Benötigt wird Node.js 20 oder neuer. Es müssen keine Pakete installiert werden. Die Quellenprüfung benötigt Internetzugang und weist 401-, 403- und 429-Antworten separat als automatisiert blockiert aus.

## Datenquellen

Beim Start liest die Anwendung `data/event-catalog.json` und lädt daraus die drei Kernsammlungen sowie zehn thematische und regionale Erweiterungsdateien. Neue Sammlungen können durch eine zusätzliche JSON-Datei und einen Katalogeintrag ergänzt werden, ohne den JavaScript-Lader zu verändern. Wenn Supabase verfügbar ist, werden Datensätze aus `public.ereignisse` ergänzt beziehungsweise mit gleichnamigen Einträgen zusammengeführt. Dadurch bleibt die Karte auch bei einem Ausfall der Datenbank nutzbar.

Ein Eintrag besitzt eine primäre Kategorie und beliebig viele `tags`. Der Filter berücksichtigt beides. Negative Jahreswerte stehen für Jahre vor unserer Zeitrechnung; für ihre sichtbare Datierung wird zusätzlich `dateLabel` gepflegt. Paläontologische Fundorte gehören nicht in diesen Atlas: Der zeitliche Anfang folgt der frühesten belastbaren Überlieferung kollektiven sozialen Handelns. Moderne Begriffe werden in antiken und mittelalterlichen Einträgen nicht als Selbstbezeichnungen ausgegeben.

Das erweiterte Referenzschema einschließlich einer Nur-Lesen-RLS-Policy befindet sich unter `docs/supabase-schema.sql`. Der im Browser verwendete Supabase-Schlüssel ist ein öffentlicher Publishable Key. Schreibzugriffe müssen dennoch zwingend durch Row Level Security blockiert werden.

## Tastaturkürzel

- `F` – Suche fokussieren
- `R` – zufällige Spur anzeigen
- `M` – neue Mission starten
- `V` – Funkenlabor öffnen
- `?` – Einführung und Spielregeln öffnen
- `Esc` – Dialoge und Seitenleisten schließen

## Inhaltlicher Hinweis

Der Atlas ist ein Bildungs- und Vermittlungsprojekt. Seine Kurztexte können komplexe historische Konflikte nur einführen und ersetzen keine wissenschaftliche Quellenprüfung. Beiträge sollten den Grundsätzen in `CONTRIBUTING.md` folgen.
