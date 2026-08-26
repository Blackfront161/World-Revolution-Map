# Release Candidate 2.9.0

Prüfdatum: 26. August 2026. Diese Datei trennt automatisierte beziehungsweise in der lokalen Browserumgebung reproduzierte Befunde von weiterhin offenen manuellen Release-Gates. Ein offenes Gate ist ausdrücklich **nicht bestanden**.

## Reproduzierte automatisierte Gates

| Gate | Verifiziertes Ergebnis |
|---|---|
| Encoding | 71 Textdateien: gültiges UTF-8, keine ungeprüften Kontrollzeichen oder bekannten Mojibake-Muster |
| JavaScript | 20 JavaScript-Dateien syntaktisch geprüft |
| Datenvertrag | 24 Ereignisdateien, 668 aktive Ereignisse, 20 Vertiefungen, 86 Koordinatenklassifikationen |
| Biografien | 40 koordinatenfreie Biografien, 97 HTTPS-Quellen, 3 katalogisierte Dateien |
| Archivmodelle | 4 Routen, 10 Layer, 10 Taktiken, 24 Beziehungen, 3 Kartenstile |
| Tests | 42/42 bestanden, 0 fehlgeschlagen |
| Quellencheck | 475/769 direkt erreichbar; 282 automatisiert mit 401/403/405/429 blockiert; 12 nach drei Versuchen unentscheidbar; kein definitiver HTTP-Fehler im Gate |
| Remote-Minimierung | Supabase standardmäßig aus und nur per `?supabase=1` nachladbar; keine Wikipedia-/Wikimedia-Bildabfrage oder Bildausgabe in der RC |
| Drittanbieterhinweise | vollständige versionierte Notices für MapLibre GL JS 4.7.1 und `@supabase/supabase-js` 2.45.4 in `THIRD_PARTY_NOTICES.md` |

Das lokale `npm`-Shim der Prüfmaschine verweist auf eine nicht vorhandene globale `npm-cli.js`. Deshalb wurden die in `package.json` definierten Gates äquivalent und einzeln mit Node ausgeführt: `node scripts/check-encoding.mjs`, `node scripts/check-js.mjs`, `node scripts/validate-data.mjs`, `node --test` und `node scripts/check-sources.mjs`. Der GitHub-Workflow verwendet weiterhin Node 20 über `actions/setup-node` und kann dort `npm` reproduzierbar aufrufen.

## Browser-Smoke und Offline-Reproduktion

Getestet wurde im Codex-In-App-Browser auf einem frischen lokalen Origin. Externe Geräte oder assistive Betriebssystemsoftware wurden dabei nicht simuliert.

| Prüfung | Ergebnis |
|---|---|
| Frische Origin `127.0.0.1:4186` | erster Online-Lauf: 668 Ereignisse und 40 Biografien; Online-Reload: erneut 668/40; `offlineReady=true` |
| Server wirklich gestoppt | Listener-PID wurde beendet und ein unabhängiger HTTP-Abruf bestätigte `SERVER_STOPPED`; Reload lieferte nach 2,5 Sekunden exakt 668 Ereignisse und 40 Biografien, kein hängender Ladezustand |
| Upgrade einer alten Generation | derselbe Origin `127.0.0.1:4194` cachte zuerst `rc2-r5` mit Paper-Teal `#5eead4`; nach Upgrade auf `rc2-r6` war Teal `#075c58`. Nach wirklich gestopptem Server lieferte der Offline-Reload erneut 668 Ereignisse und 40 Biografien. |
| Desktop 1280×720 | kein Seiten-Horizontaloverflow; Suche `Seattle` ergab 4 Treffer; Tabelle zeigte dieselben 4 Treffer; Methodikdialog öffnete; Ereignisdetail „Generalstreik von Seattle“ öffnete mit `?event=seattle-general-strike` |
| Mobile 390×844 | Seitenbreite 390 px; alle 11 Navigationsziele innerhalb des Viewports sichtbar und per Klick/Touch erreichbar; native Buttons und Fokus sind vorhanden. Die echte Hardwaretastatur-Prüfung bleibt ein manuelles Gate. |
| Reflow 640×360 | Seitenbreite 640 px; alle 11 Navigationsziele sichtbar; kein Seiten-Horizontaloverflow |
| Lebenswege-Suche | `Proudon`, `Joseph Proudon` und normalisierte Varianten finden ausschließlich den kuratierten Eintrag Pierre-Joseph Proudhon; kein allgemeines Fuzzy-Matching |
| Lebensdaten | 40 Listeneinträge geprüft; kein sichtbares Rohsentinel `unknown`; teilweise bekannte Angaben bleiben erhalten, zum Beispiel „1944-09-12–nicht sicher überliefert“ |
| Remote-Opt-in | ohne Query-Opt-in kein Supabase-SDK im DOM; keine Ereignisbilder im DOM |

Die atomare Worker-Installation schreibt zuerst in einen Staging-Cache, prüft Kataloge und jede erforderliche Ressource und aktiviert erst danach die vollständige Generation. Kern-Shell, beide Kataloge, alle 24 Ereignisdateien, alle drei Biografiedateien sowie Vertrag, Metadaten, Routen, Taxonomie und Relationen sind abgedeckt. Für die korrigierte Oberfläche ist die Cachegeneration `atlas-local-v2.9.0-rc2-r6`; der Test hält zusätzlich einen Digest der vorab gecachten Kernressourcen fest. Externe Tiles, Kartenstile, CDN-Skripte und Wikimedia-Ressourcen werden nicht vorab gespeichert. Bei fehlenden Daten endet die UI nach einem begrenzten Timeout mit einem lokalisierten Fehlerzustand statt mit „0 Ereignisse“ und einer endlosen Ladeanzeige.

## Designnotiz: farbigeres Archiv ohne Belohnungslogik für Gewalt

Die RC erhält eine lokale, CSS-native Atlaspalette aus Grün, Gold/Ocker, Koralle, Violett und Teal sowie zusätzliche, zurückhaltende Archivraster, Glasflächen und Hierarchieebenen. Farben ergänzen stets Texte, Buchstaben, Symbole und Formen; sie ersetzen keine Bedeutung. Navigation, Routen, Zeitleiste, Archiv, Netzwerk, Vergleiche und Lebenswege nutzen unterschiedliche Akzentfamilien. Akzente in Biografiekarten werden nur deterministisch aus der stabilen ID verteilt und klassifizieren keine Community, Herkunft oder Strömung. Sensible Ereignisse bleiben visuell ruhiger: kein Halo, keine Feieranimation und zurückhaltende Sand-/Neutraltöne. Nach der Kontrastkorrektur nutzt der Papierstil feste dunkle Akzentwerte über festen Papierflächen: die im lokalen Browser gemessenen Schlüsselpaare liegen bei 4,98:1 (Grün), 6,06–7,34:1 (übrige Akzente), 7,83:1 (weißer Text auf Teal) und 8,62:1 (Fokus auf Papier). Der monochrome Stil setzt alle Atlas-Akzente auf Weiß und entsättigt verbleibende dekorative Altwerte; Netzwerk-Knoten/-Kanten und Scrollleisten sind schwarz/weiß. Die CSS- und Browserprüfung deckt 44×44-px-Touchflächen sowie 390×844 und 640×360 ohne Seiten-Horizontaloverflow ab. Enter/Leertaste werden nicht durch einen eigenen Handler abgefangen; die an diese Prüfumgebung gebundene synthetische Eingabe löste jedoch keine native Button-Aktivierung aus. Das bleibt für den echten Browser-/Screenreader-Release-Test offen. Alle zusätzlichen Übergänge werden bei `prefers-reduced-motion` deaktiviert.

## Offene manuelle Geräte- und Accessibility-Matrix

- [ ] **NVDA unter Windows:** vollständige Landmark-, Dialog-, Tabellen-, Kartenalternativ- und Live-Region-Prüfung durch eine Person. Nicht in dieser RC-Umgebung durchgeführt.
- [ ] **VoiceOver auf einem echten iPhone:** Navigation, Drawer, Formulare, Lebenswege und Fokusreihenfolge. Nicht durchgeführt.
- [ ] **Echter Browserzoom 200 %:** nicht mit Viewport-Reflow gleichsetzen; auf einem Zielbrowser manuell prüfen. Nicht durchgeführt.
- [ ] **Echte OS-Einstellung „Bewegung reduzieren“:** Zeitreise, Kartenbewegung, Dialoge und Übergänge bei aktivierter Betriebssystemoption prüfen. Nicht durchgeführt.
- [ ] **Android-PWA-Upgrade:** Installation einer alten produktionsnahen Generation, Update, Prozessbeendigung und Offline-Neustart auf einem echten Android-Gerät. Nicht durchgeführt.

## Offene redaktionelle Quellen-Gates

- [ ] ILO C98: Legacy-NORMLEX-Ziele im Browser auf aktuelle kanonische Ziele umstellen und die behauptete Bewegungsvorgeschichte mit einer ILO-Archiv-/Geschichtsquelle belegen.
- [ ] Treatment Action Campaign: UCT-Bitstream bibliografisch identifizieren und die daraus abgeleiteten Taktikangaben am Original prüfen.
- [ ] Rotes Wien: Bottom-up-Anteil, Vergabe und Verfolgung gegen die im Audit benannten Originalquellen manuell prüfen.
- [ ] Aboriginal Land Rights Act: historische „as made“-Fassung und AIATSIS-PDF manuell prüfen.
- [ ] Die 35 im Biografieaudit als **MANUELL PRÜFEN** geführten Ziele bleiben offen; Emma Goldman hat Priorität, weil konkrete Kritiklinien noch keine punktgenauen Fundstellen besitzen.

Der UNDRIP-Hauptlink wurde auf die offizielle Resolution `https://docs.un.org/A/RES/61/295` umgestellt; die unbelegte genaue Mengenbehauptung wurde zu „zahlreiche indigene Organisationen“ abgeschwächt. Die sechs im Biografieaudit als **ERSETZEN** geführten Fälle sind im Nachbearbeitungsabschnitt des Audits dokumentiert. Die kanonischen Audit-Ausgangsmatrizen wurden nicht rückwirkend umgeschrieben.

## Offene Lizenz- und Hosting-Gates

- [ ] Projektlizenz, Datenlizenz, Veröffentlichungsbefugnis und eingehende Beitragsrechte: Entscheidung und Nachweis durch die Rechteinhaber*innen.
- [ ] 635 Ereignistexte ohne per-item Rechtebeleg: Freigabe-, Lizenz- oder Ausschlussentscheidung.
- [ ] CARTO im Zielhosting: Vertrag/API-Key/Grant, Basemap Terms und erlaubte Nutzungsarten prüfen; sichtbare CARTO-, OpenStreetMap-/ODbL- und gegebenenfalls OpenMapTiles-Attribution testen.
- [ ] Produktive Supabase-Zeilen: Inhalte und Rechtekette getrennt inventarisieren, bevor `?supabase=1` in einem Release angeboten wird.
- [ ] Lokales App-Icon: Entstehung, Rechteinhaber*in und zulässiger Nutzungsumfang klären.
- [ ] Projektinterne und externe Bildrechte: vollständiges per-item Manifest erstellen, bevor Remote-Bilder wieder aktiviert werden.

Die elf zuvor unbelegt als „CC BY 4.0“ bezeichneten Schwarzen Biografietexte stehen bis zur Eigentümerentscheidung konservativ auf `rights-unclear`. Der Validator erlaubt eine künftige CC-BY-Angabe nur mit identifiziertem Lizenzgeber, HTTPS-Lizenzlink und eindeutigem Lizenzumfang. Das ist keine Gesamtprojektlizenz und keine Aussage über Veröffentlichungsbefugnis.

## Deployment-Header-Gate

Vor einem öffentlichen Deployment müssen die folgenden Punkte am tatsächlich ausgelieferten HTTPS-Endpunkt geprüft werden; die HTML-Meta-CSP allein genügt dafür nicht:

- [ ] `Content-Security-Policy` als HTTP-Response-Header, einschließlich einer bewusst festgelegten `frame-ancestors`-Direktive für Standalone- und Embed-Ziele.
- [ ] `Referrer-Policy` als HTTP-Header, mindestens entsprechend `strict-origin-when-cross-origin` oder strenger nach Hostingentscheidung.
- [ ] restriktive `Permissions-Policy`, insbesondere für Kamera, Mikrofon, Geolocation und andere nicht benötigte Fähigkeiten.
- [ ] ausschließlich HTTPS im Zielbetrieb, ohne Mixed Content.
- [ ] Service-Worker-Datei, Pfad und `Service-Worker-Allowed`/Scope so ausliefern, dass ausschließlich der beabsichtigte App-Pfad kontrolliert wird.
- [ ] CSP-, Cache- und Worker-Header auch auf Fehlerseiten, Manifest und JSON-Ressourcen im Zielhosting kontrollieren.

Diese Deployment- und Lizenzpunkte sind bewusst offen und dürfen in PR- oder Release-Texten nicht als erledigt bezeichnet werden.
