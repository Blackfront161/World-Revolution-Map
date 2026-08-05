# Atlas des Widerstands

Eine interaktive, spielerische Weltkarte historischer Bewegungen, Aufstände, Streiks und Kämpfe um Selbstbestimmung. Besucher*innen reisen über die Karte, sichern Ereignisse für ihr persönliches Archiv, erfüllen Missionen, lösen Quizfragen und schalten Erfolge frei.

## Was die Anwendung bietet

- interaktive MapLibre-Weltkarte mit Clustern und farbcodierten Kategorien
- Volltextsuche sowie Kategorie- und Zeitraumfilter
- 160 kuratierte Ereignisse auf sechs Kontinenten
- Mehrfach-Tags für überlappende Spektren wie Anarchismus, indigener Widerstand, Antisexismus, Schwarze Befreiung, Antifaschismus, Antikolonialismus und Tierbefreiung
- historische Spannweite vom frühesten ausführlich dokumentierten Streik in Deir el-Medina (ca. 1157 v. u. Z.) bis zu heutigen Bewegungen
- eigene Perspektiven auf frühe soziale Revolten, Widerstand versklavter Menschen, antifeudale Kämpfe, Commons und Rätebewegungen
- Live-Daten aus Supabase, automatisch mit dem Fallback-Archiv zusammengeführt
- Karten-Popups mit Einordnung, Bild und weiterführender Quelle
- lokales Fortschrittssystem mit XP, Levels und Entdeckungsarchiv
- zufällige und tägliche Missionen
- Wissensquiz und acht freischaltbare Erfolge
- mobil optimierte und tastaturbedienbare Oberfläche
- sichere DOM-Ausgabe statt ungeprüfter HTML-Injektion aus der Datenbank
- automatische Rückfallebene, falls Supabase nicht erreichbar ist
- Tests für Normalisierung, Filter, Level, Missionen und Quizlogik

Der Spielfortschritt wird ausschließlich im lokalen Browser gespeichert. Es gibt weder Tracking noch ein Benutzerkonto.

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

Benötigt wird Node.js 20 oder neuer. Es müssen keine Pakete installiert werden. Die Quellenprüfung benötigt Internetzugang und meldet vorübergehende Sperren einzelner Webseiten gegebenenfalls ebenfalls als Fehler.

## Datenquellen

Beim Start lädt die Anwendung `data/fallback-events.json`, `data/movement-events.json` und `data/historical-resistance-events.json`. Wenn Supabase verfügbar ist, werden Datensätze aus `public.ereignisse` ergänzt beziehungsweise mit gleichnamigen Einträgen zusammengeführt. Dadurch bleibt die Karte auch bei einem Ausfall der Datenbank nutzbar.

Ein Eintrag besitzt eine primäre Kategorie und beliebig viele `tags`. Der Filter berücksichtigt beides. Negative Jahreswerte stehen für Jahre vor unserer Zeitrechnung; für ihre sichtbare Datierung wird zusätzlich `dateLabel` gepflegt. Paläontologische Fundorte gehören nicht in diesen Atlas: Der zeitliche Anfang folgt der frühesten belastbaren Überlieferung kollektiven sozialen Handelns. Moderne Begriffe werden in antiken und mittelalterlichen Einträgen nicht als Selbstbezeichnungen ausgegeben.

Das erweiterte Referenzschema einschließlich einer Nur-Lesen-RLS-Policy befindet sich unter `docs/supabase-schema.sql`. Der im Browser verwendete Supabase-Schlüssel ist ein öffentlicher Publishable Key. Schreibzugriffe müssen dennoch zwingend durch Row Level Security blockiert werden.

## Tastaturkürzel

- `F` – Suche fokussieren
- `R` – zufällige Spur anzeigen
- `M` – neue Mission starten
- `?` – Einführung und Spielregeln öffnen
- `Esc` – Dialoge und Seitenleisten schließen

## Inhaltlicher Hinweis

Der Atlas ist ein Bildungs- und Vermittlungsprojekt. Seine Kurztexte können komplexe historische Konflikte nur einführen und ersetzen keine wissenschaftliche Quellenprüfung. Beiträge sollten den Grundsätzen in `CONTRIBUTING.md` folgen.
