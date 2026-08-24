# Rechteketten- und Lizenzinventar 2.9.0

Stand: 24. August 2026

Geprüfter Commit: `0941f6abba34ecd0164564100a10ed10e556d095`

Prüfart: Read-only-Bestandsaufnahme; keine Lizenzfreigabe und keine Rechtsberatung

## Kurzfazit

Das Repository hat keine `LICENSE`, keine `NOTICE`-/`THIRD_PARTY_NOTICES`-Datei und keine durchgehende Rechtekette. Die vorhandene Dokumentation behauptet zutreffend keine Gesamtprojektlizenz. Ein öffentlicher Release als lediglich sichtbare Website ist von einer Weiterlizenzierung des Repositorys zu unterscheiden; für beide Fälle fehlen jedoch belegte Entscheidungen und teilweise zwingende Drittanbieterhinweise.

Vor einem öffentlichen Release sind insbesondere zu klären oder technisch zu beseitigen:

1. Wer Code, UI-Texte, Übersetzungen, Datenzusammenstellung, redaktionelle Texte, Dokumentation und das SVG-Icon freigeben darf und zu welchen Bedingungen.
2. Ob die elf Biografien mit dem Text „CC BY 4.0“ tatsächlich vom verfügungsberechtigten Rechteinhaber unter dieser Lizenz angeboten wurden; die übrigen 29 Biografien sind `rights-unclear`.
3. Ob die 24 dynamisch geladenen Wikipedia-/Wikimedia-Bilder einzeln mit Urheber, Dateiseite, konkreter Lizenz und Attributionszeile belegt werden oder bis dahin nicht öffentlich ausgeliefert werden.
4. Ob die konkrete anonyme Nutzung der CARTO-Basemap nach den aktuellen CARTO-Bedingungen zulässig ist; ein Vertrag, Grant oder eigener API-Key ist im Repository nicht dokumentiert.
5. Wie die Lizenztexte und Copyright-Hinweise für MapLibre GL JS 4.7.1 und `@supabase/supabase-js` 2.45.4 mit dem Release ausgeliefert werden.
6. Ob alle bisherigen Beiträge vom freigabeberechtigten Rechteinhaber stammen und ob für künftige Beiträge eine eindeutige eingehende Rechteeinräumung eingeführt wird.

`rights-unclear` ist in diesem Bericht kein Lizenzname, keine Freigabe und keine Aussage darüber, ob eine Nutzung gesetzlich erlaubt oder verboten ist. Es bezeichnet ausschließlich eine nicht belegte Rechtekette.

## Prüfgrundlage und Zählung

- `package.json` nennt Version 2.9.0, `private: true` und keine installierten Abhängigkeiten.
- `data/event-catalog.json` führt 24 Ereignisdateien mit 702 Rohdatensätzen. Davon sind 34 als archiviert markiert und 668 aktiv.
- Jeder aktive Ereignisdatensatz hat genau einen `sourceUrl`: 568 führen zu Wikipedia, 100 zu anderen Domains. Ein Quellenlink ist ein Recherchehinweis, keine Nutzungslizenz für den Atlastext.
- Nur 13 aktive Ereignisse besitzen im Datensatz selbst `license` und `provenance`; alle 13 stehen in `data/social-achievements-next.json` und sind `rights-unclear`.
- 20 weitere Ereignisse erhalten über `data/event-editorial-overrides.json` ein `license.status: rights-unclear` und konkrete `provenance.sourceUrls`.
- Damit haben 635 der 668 aktiven Ereignisse weder ein eigenes noch ein per Override ergänztes `license`-Feld. Die globale Angabe `data: rights-unclear` in `data/archive-contract.json` dokumentiert die Unsicherheit der Zusammenstellung, ersetzt aber keine datensatzbezogene Rechtekette.
- 22 aktive Ereignisse enthalten ein `voices`-Feld. Mehrere Einträge kennzeichnen den Inhalt als Paraphrase; es gibt jedoch keinen vollständigen, datensatzbezogenen Nachweis, dass keine geschützte Formulierung übernommen wurde.
- `data/biography-catalog.json` führt 40 Biografien mit 97 Quellenreferenzen. Elf Datensätze nennen CC BY 4.0, 29 `rights-unclear`.
- 24 aktive Ereignisse in `data/fallback-events.json` enthalten `imageApiUrl`. Es gibt keine lokale Bilddatei und kein per-item Bildlizenzmanifest.
- Die Git-Historie umfasst 52 Commits. Als Autor erscheint nur `Blackfront`, jedoch mit zwei E-Mail-Adressen. Git-Metadaten belegen Urheberschaft oder Verfügungsbefugnis nicht.

## Entscheidungsmatrix

| ID | Rechtekette / Befund | Entscheidung oder Nachweis des Rechteinhabers bzw. Betreibers | Blockiert öffentlichen Release? | Wenn geklärt: nur Attribution/Notice? | Betroffene Dateien |
|---|---|---|---|---|---|
| R1 | Projektcode, UI, Tests, Skripte und Dokumentation sind ohne Projektlizenz; `data/archive-contract.json` nennt Code und Daten `rights-unclear`. | Identität und Verfügungsbefugnis feststellen; getrennte Freigabe für Code, Dokumentation/UI-Texte und Daten festlegen. Dabei Hosting/Anzeige und Weitergabe/Änderung des Repositorys getrennt entscheiden. | **Ja**, wenn der Betreiber die Veröffentlichungsbefugnis nicht anderweitig belegen kann. Eine Open-Source-Veröffentlichung ist ohne ausdrückliche Lizenz jedenfalls nicht dokumentiert. | Nein; dies ist eine originäre Rechteentscheidung. | Alle projektinternen Dateien, insbesondere `index.html`, `styles.css`, `script.js`, `service-worker.js`, `src/**`, `scripts/**`, `tests/**`, `.github/workflows/quality.yml`, `README.md`, `CONTRIBUTING.md`, `docs/**` und `package.json`. |
| R2 | 668 aktive Ereignisse sind redaktionelle Zusammenstellungen. Nur 33 haben eine explizite, stets unklare Statusangabe; 635 haben kein wirksames per-event `license`-Feld. | Bestätigen, dass die Atlasformulierungen eigene Synthesen sind und wer sie freigeben darf; anschließend Umfang und Bedingungen für Texte, strukturierte Metadaten und Datenbankzusammenstellung getrennt festlegen. | **Ja** für eine behauptete offene Daten-/Textlizenz; auch für die öffentliche Auslieferung, solange die Befugnis zur Veröffentlichung der Texte nicht belegt ist. | Nein; Quellenattribution allein heilt keine fehlende Rechtekette an den Atlastexten. | Die 24 unter „Ereignisdateien“ aufgeführten Dateien, `data/event-editorial-overrides.json`, `data/event-metadata.json`, `data/event-catalog.json`, `data/archive-contract.json`, `data/routes.json`, `data/relations.json`, `data/map-taxonomy.json`. |
| R3 | Elf Schwarze Biografien tragen als String „Redaktioneller Text: CC BY 4.0“, nennen aber keinen Lizenzgeber/Urheber, keinen Lizenzlink und kein Änderungskennzeichen. Die Form widerspricht dem Objektmodell der übrigen Biografien. | Lizenzgeber und Berechtigung schriftlich bestätigen; festlegen, welche Felder genau erfasst sind und welche Namensnennung verlangt wird. Falls keine belastbare Freigabe existiert, den Status vor Release neu bewerten. | **Ja**, solange der Release sich auf diese CC-BY-Erlaubnis stützen soll oder die Veröffentlichung anderweitig nicht belegt ist. | Nach wirksamer Freigabe voraussichtlich Attribution, Lizenzlink und Änderungskennzeichnung gemäß [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); keine Entscheidung darüber wird hier getroffen. | `data/biographies-black.json`; mittelbar `src/biography-core.js`, `script.js`, `data/biography-catalog.json`. |
| R4 | 29 Biografien sind `rights-unclear`: elf indigene Biografien als String, 18 libertäre als Objekt mit Hinweis auf separat verbleibende Quellenrechte. | Verfügungsberechtigte Person und gewünschte Freigabe je Datei oder Datensatz bestimmen; Eigenanteil und Quellenanteile abgrenzen. | **Ja** für offene Weiterlizenzierung und bei fehlendem Nachweis auch für öffentliche Auslieferung. | Nein; Quellenangaben sind zusätzlich, nicht ersetzend. | `data/biographies-indigenous.json`, `data/biographies-libertarian.json`. |
| R5 | 97 Biografie-Quellenreferenzen und 668 Ereignis-`sourceUrl`-Links bezeichnen fremde Werke. Links und bibliografische Metadaten übertragen keine Rechte. 568 aktive Ereignislinks führen zu Wikipedia. | Keine pauschale Fremdwerklizenz behaupten; bei übernommenen Formulierungen, Übersetzungen, Zitaten oder umfangreichen Metadaten den jeweiligen Ursprung und die Nutzungserlaubnis dokumentieren. | **Nicht allein wegen des Links.** **Ja** für konkrete übernommene geschützte Inhalte ohne Beleg. | Reine Verlinkung/Quellenangabe benötigt in der Regel keine Projektlizenz; erforderliche Zitat- oder Werkattribution bleibt einzelfallbezogen. | Alle 24 Ereignisdateien; drei Biografiedateien; `data/event-editorial-overrides.json`; `data/routes.json`. |
| R6 | 24 Wikipedia-REST-Endpunkte liefern zur Laufzeit Thumbnail- oder Originalbild-URLs von `upload.wikimedia.org`. Die App speichert oder zeigt weder Urheber, Dateiseite, konkrete Lizenz noch Änderungsangabe. Der REST-Summary-Endpunkt ist kein Bildlizenzmanifest. Auch lokal auf Wikipedia gehostete Dateien können andere Bedingungen als Commons-Dateien haben. | Je Bild eine belastbare per-item Entscheidung treffen: Datei-/Quellseite, Urheber, Lizenz/PD-Status, geforderte Creditline, Bearbeitungen und weitere Rechte dokumentieren; alternativ die öffentliche Bildauslieferung bis zur Klärung deaktivieren. | **Ja**, solange die Bilder ohne per-item Nachweis und sichtbare Erfüllung der Bedingungen angezeigt werden. | Erst nach Einzelprüfung; viele freie Wikimedia-Dateien benötigen Attribution und Lizenzlink, manche ShareAlike oder weitere Hinweise. Siehe [Wikimedia-Nachnutzung](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/en). | `data/fallback-events.json`, `script.js` (`resolveImageUrl`, URL-Allowlist und Bilddarstellung), `index.html` (CSP), `docs/licensing-and-attribution.md`; potenziell Remote-Daten nach `docs/supabase-schema.sql`. |
| R7 | Das lokale SVG-App-Icon enthält keine Fremdreferenz, aber auch keinen Autor-, Copyright- oder Lizenznachweis. Manifest und Service Worker verteilen es. Unicode-Zeichen in der UI stammen aus keiner eingebundenen Icon-Bibliothek. | Rechteinhaber des Iconentwurfs bestätigen und entscheiden, ob das Icon mit Code, als Marken-/Brand-Asset oder separat freigegeben wird. | **Ja**, wenn die Befugnis zur öffentlichen Nutzung nicht belegt ist; sonst nur Teil der allgemeinen Projektentscheidung R1. | Nicht zwingend nur Attribution; Marken- und Brandregeln können separat sein. | `icons/atlas-icon.svg`, `manifest.webmanifest`, `service-worker.js`, `tests/static-assets.test.js`. |
| R8 | MapLibre GL JS 4.7.1 wird als JS und CSS von unpkg geladen. Die BSD-3-Clause-Lizenzdatei enthält neben MapLibre-Hinweisen auch Notices für enthaltene Mapbox-, glfx.js- und d3-color-Anteile. Im Repository ist nur ein Link auf die aktuelle `main`-Lizenz, nicht die versionierte vollständige Notice vorhanden. | Keine neue Lizenzentscheidung nötig; für den konkreten Release die vollständigen Hinweise der tatsächlich verwendeten Version zugänglich mitliefern und Versionsbezug beibehalten. | **Ja, als behebbarer Compliance-Mangel**, falls der Release die Softwarekopie verteilt/ausliefert, ohne die verlangten Notices zu reproduzieren. | **Ja:** Copyright-, Lizenzbedingungen und Disclaimer der [MapLibre-4.7.1-Lizenz](https://github.com/maplibre/maplibre-gl-js/blob/v4.7.1/LICENSE.txt) erhalten; keine Endorsement-Behauptung. | `index.html`, `script.js`, `styles.css`, `docs/licensing-and-attribution.md`, `tests/static-assets.test.js`. |
| R9 | `@supabase/supabase-js` 2.45.4 wird von jsDelivr geladen. Es steht unter MIT; im Repository fehlt der Copyright-/Lizenztext vollständig. | Keine neue Lizenzentscheidung nötig; vollständigen MIT-Hinweis der verwendeten Version in die Release-Hinweise aufnehmen. | **Ja, als behebbarer Compliance-Mangel**, soweit eine Kopie ausgeliefert/weitergegeben wird. | **Ja:** Copyright und Permission Notice gemäß [Supabase-js 2.45.4](https://github.com/supabase/supabase-js/blob/v2.45.4/LICENSE) erhalten. | `index.html`, `script.js`, `src/atlas-config.js`, `docs/supabase-schema.sql`; fehlender Drittanbieterhinweis betrifft das Releasepaket insgesamt. |
| R10 | CARTO liefert Style, Sprite, Glyphen und Vektortiles; diese basieren laut TileJSON auf OpenStreetMap/OpenMapTiles. Die App aktiviert MapLibres AttributionControl und CSS versteckt ihn nicht. CARTOs aktuelle Bedingungen verlangen prominente CARTO-/OSM-Attribution, eigenen API-Key, Nutzungsgrenzen und untersagen unter anderem Speichern/Redistribution von Karteninhalten und serverseitiges Caching. Das Repository dokumentiert weder Vertrag/Grant noch API-Key. | Betreiber muss die konkrete Berechtigung für den anonymen Endpunkt, Releaseart, erwartetes Volumen, Screenshots/Exports und etwaige Einbettungen mit den [CARTO Basemap Terms](https://carto.com/legal/basemap-terms/) abgleichen und erforderlichenfalls CARTO-Berechtigung beschaffen oder einen anderen rechtlich geklärten Dienst wählen. | **Ja.** Die sichtbare Attribution allein belegt keine Nutzungsberechtigung für den Dienst. | Attribution ist zusätzlich zwingend, aber nicht die einzige Bedingung. | `script.js` (Style-URL/AttributionControl), `index.html` (Preconnect/CSP), `styles.css`, `service-worker.js`, `data/map-taxonomy.json`, `docs/licensing-and-attribution.md`, `README.md`. |
| R11 | OSM-Daten stehen unter ODbL. Das von CARTO gelieferte TileJSON setzt „© CARTO, © OpenStreetMap contributors“, verlinkt OSM derzeit aber auf `/about/` statt direkt auf die Lizenzseite; OpenMapTiles wird nur in der Beschreibung genannt. | Bei jeder Kartenansicht und jedem zulässigen statischen Export die verlangte, gut sichtbare Creditline und den ODbL-Hinweis sicherstellen; tatsächliche Laufzeitdarstellung auf Desktop, Mobil, Embed und PWA prüfen. CARTO-/OpenMapTiles-Stilbedingungen gegen die konkrete Hosted-Basemap-Kette prüfen. | **Ja, wenn Attribution/Lizenzhinweis fehlt, verdeckt oder im Zielmedium nicht funktioniert.** Der bestehende Control ist eine gute technische Grundlage, aber noch kein dokumentierter Release-Nachweis. | **Ja:** OSM-Credit und ODbL-Hinweis nach [OSM Copyright and License](https://www.openstreetmap.org/copyright), CARTO nach [CARTO Attribution](https://carto.com/attribution/); die CARTO-Style-Lizenz nennt zusätzlich CARTO/OpenMapTiles/OSM-Credits, siehe [CARTO basemap-styles LICENSE](https://github.com/CartoDB/basemap-styles/blob/master/LICENSE.md). | Gleich wie R10; zusätzlich alle Screenshots, Store-Abbildungen, PDFs oder Marketingmaterialien außerhalb des Repositorys. |
| R12 | `CONTRIBUTING.md` verlangt Herkunft und geklärte Bildrechte, enthält aber keine eingehende Lizenz, kein CLA/DCO und keine Erklärung, unter welchen Bedingungen Beiträge angenommen werden. Die aktuelle Historie zeigt nur einen Namen, jedoch zwei E-Mail-Identitäten. | Bestehende Beiträge und mögliche Auftrags-/Arbeits-/KI-Anteile dokumentieren; für künftige Beiträge eine ausdrücklich gewählte eingehende Rechtekette festlegen, passend zur noch zu entscheidenden Projektlizenz. | **Ja**, wenn nicht belegt ist, dass der freigebende Rechteinhaber alle bisherigen Beiträge abdecken darf. Für künftige Beiträge spätestens vor deren Annahme. | Nein; Attribution der Git-Autor*innen ersetzt keine Rechteeinräumung. | Gesamte Git-Historie, `CONTRIBUTING.md`, `README.md`, GitHub-Workflow und künftige Pull Requests/Issues mit übernommenem Inhalt. |
| R13 | `docs/supabase-schema.sql` erlaubt Remote-Zeilen mit Text, `image_url` und `source_url`, besitzt aber keine Spalten für `license`, `provenance`, Bildurheber oder Attribution. Runtime-Normalisierung macht fehlende Lizenz zu `null`; Remote-Inhalte können lokale Inhalte überlagern. | Betreiber muss festlegen, ob Remote-Inhalte vor öffentlicher Anzeige denselben Rechte-Nachweis wie lokale Daten benötigen, und die produktive Datenbank separat inventarisieren. | **Ja**, falls Supabase im öffentlichen Release aktiv ist und die produktiven Zeilen nicht geprüft wurden. | Nicht pauschal; hängt von jeder Remote-Zeile und jedem Bild ab. | `docs/supabase-schema.sql`, `script.js`, `src/game-core.js`, `src/atlas-config.js`, `index.html`. |

## Detailinventar

### 1. Projektinterner Code, Oberfläche und Dokumentation

Als mutmaßlich projektintern verfasste Bestandteile erscheinen:

- Laufzeit: `index.html`, `styles.css`, `script.js`, `service-worker.js`.
- Module: `src/atlas-api.js`, `src/atlas-config.js`, `src/biography-core.js`, `src/game-core.js`, `src/i18n.js`, `src/local-library.js`, `src/progress-store.js`.
- Werkzeuge: `scripts/check-encoding.mjs`, `scripts/check-js.mjs`, `scripts/check-sources.mjs`, `scripts/serve.mjs`, `scripts/validate-data.mjs`.
- Tests: `tests/biography-core.test.js`, `tests/game-core.test.js`, `tests/i18n.test.js`, `tests/integration-security.test.js`, `tests/local-library.test.js`, `tests/static-assets.test.js`.
- Projekt-/CI-Dateien: `package.json`, `.github/workflows/quality.yml`.
- Dokumentation und darin enthaltene Beispieltexte: `README.md`, `CONTRIBUTING.md`, `docs/data-contract.md`, `docs/embedding.md`, `docs/licensing-and-attribution.md`, `docs/security.md`, `docs/supabase-schema.sql`.

Es gibt im Repository keine Copyright-Header. Aus der Git-Historie lässt sich nicht ableiten, ob Code oder Texte vollständig selbst erstellt, im Auftrag erstellt, aus Vorversionen übernommen oder mit Werkzeugen generiert wurden. Das ist kein Befund einer Fremdübernahme, sondern eine Beleglücke.

### 2. Ereignisdateien

Die 24 katalogisierten Dateien und ihre aktiven Datensätze sind:

| Datei | Aktiv | Eigenes `license` | Ohne eigenes `license` |
|---|---:|---:|---:|
| `data/fallback-events.json` | 24 | 0 | 24 |
| `data/movement-events.json` | 56 | 0 | 56 |
| `data/historical-resistance-events.json` | 80 | 0 | 80 |
| `data/expansion-africa.json` | 29 | 0 | 29 |
| `data/expansion-asia.json` | 41 | 0 | 41 |
| `data/expansion-europe.json` | 24 | 0 | 24 |
| `data/expansion-latin-america.json` | 40 | 0 | 40 |
| `data/expansion-north-america.json` | 30 | 0 | 30 |
| `data/expansion-oceania.json` | 16 | 0 | 16 |
| `data/expansion-care-abolition.json` | 40 | 0 | 40 |
| `data/expansion-queer-feminist-2.json` | 40 | 0 | 40 |
| `data/expansion-worker-peasant-2.json` | 40 | 0 | 40 |
| `data/expansion-decolonial-2.json` | 40 | 0 | 40 |
| `data/expansion-africa-3.json` | 20 | 0 | 20 |
| `data/expansion-asia-oceania-3.json` | 15 | 0 | 15 |
| `data/expansion-latin-caribbean-3.json` | 18 | 0 | 18 |
| `data/expansion-commons-global-3.json` | 17 | 0 | 17 |
| `data/expansion-replacements-3.json` | 27 | 0 | 27 |
| `data/expansion-final-3.json` | 2 | 0 | 2 |
| `data/expansion-600th.json` | 1 | 0 | 1 |
| `data/expansion-indigenous-canada-4.json` | 35 | 0 | 35 |
| `data/expansion-black-globalization-4.json` | 5 | 0 | 5 |
| `data/expansion-social-achievements-4.json` | 15 | 0 | 15 |
| `data/social-achievements-next.json` | 13 | 13 (`rights-unclear`) | 0 |
| **Summe** | **668** | **13** | **655** |

`data/event-editorial-overrides.json` ergänzt 20 der 655 Datensätze um `rights-unclear`, sodass 635 aktive Ereignisse ganz ohne datensatzbezogenen Lizenzstatus verbleiben. Die Validierung verlangt `license` nur für „Redaktionell vertieft“; das erklärt, weshalb ein grüner Testlauf keine vollständige Rechtekette bestätigt. `src/game-core.js` akzeptiert mehrere Statuswerte (`rights-unclear`, `per-item`, `third-party-terms`, `public-domain`, `licensed`), doch `licensed` enthält ohne Lizenzkennung, Lizenzgeber und Beleg keine ausreichende Rechteinformation.

Zum redaktionellen Eigenanteil gehören nicht nur `description` und `significance`, sondern auch Forderungen, Beteiligte, Machtstrukturen, Taktiken, Folgen, Repression, menschliche Kosten, Nachgeschichte, offene Fragen, `voices`, Quellenbewertung, Unsicherheit, Sensitivität, Routenbeschreibungen, Beziehungen und Taxonomie. Historische Tatsachen und schutzfähige Formulierungen sind deshalb in der Freigabeentscheidung getrennt zu behandeln.

### 3. Biografien

Die elf abweichend mit CC BY 4.0 markierten Datensätze in `data/biographies-black.json` sind:

- Queen Nanny, Harriet Tubman, Robert Smalls, Yaa Asantewaa, Lamine Senghor, Funmilayo Ransome-Kuti, Ella Baker, Claudia Jones, Andrée Blouin, Bayard Rustin und Wangari Maathai.

Der Lizenzstring beschränkt sich sprachlich auf „Redaktioneller Text“ und nimmt Rechte an verlinkten Quellen aus. Unklar bleibt, ob strukturierte Faktenfelder, Auswahl/Anordnung, Quellenmetadaten und Übersetzungen eingeschlossen sind. CC BY 4.0 verlangt bei Nutzung unter anderem angemessene Namensnennung, Lizenzlink und Kennzeichnung von Änderungen. Da kein Lizenzgeber genannt wird, kann eine nachnutzende Person diese Pflichten derzeit nicht zuverlässig erfüllen.

`data/biographies-indigenous.json` enthält elf `rights-unclear`-Strings. `data/biographies-libertarian.json` enthält 18 `rights-unclear`-Objekte mit Notices. Die drei Formate sind semantisch und maschinell inkonsistent; `src/biography-core.js` normalisiert sie zwar für die Anzeige, schafft aber keine Rechte.

### 4. Quellenmetadaten und Links

Die Quellenketten belegen redaktionelle Recherche, nicht die Lizenz des daraus entstandenen Atlastexts. Besonders zu prüfen sind:

- mögliche nahe Paraphrasen oder Übersetzungen geschützter Quelltexte;
- direkt oder sinngemäß wiedergegebene Stimmen;
- Titel, Abstracts, längere Beschreibungen oder Archivtexte, falls sie mehr als rein bibliografische Angaben übernehmen;
- Quellen, deren eigene Nutzungsbedingungen automatisierte Wiedergabe, Digitalisate oder Archivmaterial gesondert regeln;
- Wikipedia-Texte, falls Ausdruck statt nur Tatsachen übernommen wurde: deren eigene CC-BY-SA-Kette wäre dann gesondert relevant. Ein bloßer Wikipedia-Link setzt den Atlastext nicht automatisch unter CC BY-SA.

Die vorhandenen `sourceType`, `sourceQuality`, `reviewStatus`, `checkedAt` und `accessedAt` sind redaktionelle Qualitätsmetadaten, aber keine Lizenzbelege. Für eine belastbare Freigabe sollte ein Nachweis pro redaktioneller Einheit zumindest Autor/Lizenzgeber des Atlastexts, Entstehungsmethode, Quellenbasis, Lizenzstatus und Prüfdatum trennen.

### 5. Wikimedia-Bilder

Die Bildkette lautet derzeit:

`data/fallback-events.json:imageApiUrl` → Wikipedia REST Page Summary → `thumbnail.source` oder `originalimage.source` → `upload.wikimedia.org` → Anzeige durch `script.js`.

Dabei gehen die rechtlich relevanten Metadaten verloren. `imageAlt` ist nur eine Bildbeschreibung. Weder Hotlinking noch Wikimedia-Hosting ersetzt Attribution und Lizenzprüfung. Wikimedia weist selbst darauf hin, dass jede Datei andere Anforderungen haben kann und dass die Foundation keine Gewähr für den Rechtezustand gibt. Das bestehende globale `images: per-item` in `data/archive-contract.json` beschreibt das richtige Prüfprinzip, enthält aber noch keinen einzigen konkreten Einzelbeleg.

Auch die Supabase-Tabelle erlaubt `image_url`, ohne korrespondierende Rechtefelder. Deshalb reicht ein einmaliges Inventar der 24 lokalen API-URLs nicht aus, solange Live-Daten aktiviert bleiben.

### 6. Kartenkette

Die technische Kette ist:

`script.js` → CARTO Dark Matter Style JSON → CARTO Sprite/Glyphs → CARTO Vector TileJSON/Tiles → OpenMapTiles-Schema/OpenStreetMap-Daten → MapLibre GL JS Renderer.

Positive Befunde:

- `script.js` erzeugt einen `AttributionControl`; `styles.css` entfernt ihn nicht.
- Der Service Worker cached keine externen Styles, Tiles, Sprites, Glyphen oder Wikimedia-Bilder.
- Die drei lokalen Kartenstile verwenden dieselbe Basemap und verändern nur Renderfarben.
- Das aktuelle CARTO-TileJSON enthält eine CARTO-/OSM-Creditline.

Offene bzw. blockierende Punkte:

- Die aktuelle CARTO-Nutzungsberechtigung ist nicht dokumentiert; insbesondere fehlt der nach den aktuellen Bedingungen geforderte eigene API-Key bzw. ein anderer Vertrags-/Grant-Nachweis.
- Die vorhandene Dokumentation reduziert CARTO auf Attribution und erwähnt die weitergehenden Basemap Terms nicht.
- OSM verlangt neben dem Credit, klar auf ODbL hinzuweisen. Der vom TileJSON gelieferte OSM-Link führt aktuell auf `/about/`, nicht direkt auf `/copyright`.
- Das TileJSON beschreibt die Daten als „packaged by OpenMapTiles“, zeigt in der gelieferten Attribution aber keinen OpenMapTiles-Credit. Die CARTO-Style-Lizenz nennt einen solchen Credit; welche Bedingung für den konkret gehosteten Dienst maßgeblich ist, muss der Betreiber mit CARTO klären.
- CARTO untersagt nach den aktuellen Bedingungen unter anderem Caching/Redistribution von Karteninhalt und Screenshots/statische Bilder anstelle des API-Zugriffs. Store-Screenshots, Pressebilder, Druck/PDF und Offline-Erweiterungen benötigen deshalb eine eigene Prüfung.

### 7. Drittanbieter-Code

| Bestandteil | Einbindung | Primärlizenz | Vorhandener Hinweis | Fehlender Beleg/Hinweis |
|---|---|---|---|---|
| MapLibre GL JS 4.7.1 | unpkg, JS + CSS mit SRI | [Versionierte LICENSE.txt](https://github.com/maplibre/maplibre-gl-js/blob/v4.7.1/LICENSE.txt), BSD-3-Clause plus gebündelte Notices | Link auf unversioniertes `main` in `docs/licensing-and-attribution.md` | Vollständiger versionierter Copyright-/Lizenz-/Disclaimertext im Release |
| `@supabase/supabase-js` 2.45.4 | jsDelivr, JS mit SRI | [Versionierte MIT-Lizenz](https://github.com/supabase/supabase-js/blob/v2.45.4/LICENSE) | keiner | Vollständiger MIT-Copyright- und Permission-Notice im Release |
| CARTO Dark Matter / Tiles | Remote-Service | [Basemap Terms](https://carto.com/legal/basemap-terms/), [Attribution](https://carto.com/attribution/), Stylehinweis [CC BY 4.0](https://github.com/CartoDB/basemap-styles/blob/master/LICENSE.md) | Laufzeit-Control; allgemeiner Docs-Link | Nutzungsberechtigung/Key/Vertrag, aktueller Terms-Nachweis, dokumentierter Attributionstest |
| OpenStreetMap-Daten | über CARTO | [ODbL und Attribution](https://www.openstreetmap.org/copyright) | Laufzeit-Credit aus CARTO-TileJSON; Docs-Link | Nachweis, dass ODbL-Hinweis in allen Zielmedien erreichbar und sichtbar ist |
| Wikimedia-Einzelbilder | Wikipedia REST / Wikimedia Upload | je Datei; [Wikimedia Reuse Guide](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/en) | nur global `per-item` | Vollständiges Inventar und sichtbare Creditline je Bild |

unpkg und jsDelivr sind Transportdienste, keine Ersatzlizenzgeber. Die SRI-Hashes sichern Integrität, erfüllen aber keine Copyright- oder Notice-Pflicht.

### 8. Icon, Manifest und Beiträge

`icons/atlas-icon.svg` ist das einzige lokale grafische Asset. Es besteht aus einfachen SVG-Grundformen, doch das Repository enthält keinen Entstehungs- oder Rechtehinweis. Seine Einbindung in `manifest.webmanifest` und den Offline-Cache macht es zu einem eigenständig ausgelieferten Asset. Der Rechteinhaber sollte ausdrücklich entscheiden, ob es frei lizenziert, nur mit der App nutzbar oder als Brand-/Markenbestandteil zurückbehalten wird.

`CONTRIBUTING.md` enthält sinnvolle Quellen- und Bildregeln, aber keine Bedingung, unter welcher Lizenz oder Rechteeinräumung Pull Requests angenommen werden. Vor einer öffentlichen Beitragsannahme muss diese Lücke passend zur Projektentscheidung geschlossen werden. Für die bestehenden 52 Commits sollte der Rechteinhaber mindestens bestätigen, dass beide im Git-Log verwendeten E-Mail-Adressen derselben berechtigten Person zuzuordnen sind und keine Rechte Dritter, Arbeitgeber oder Auftraggeber entgegenstehen.

## Konkrete Release-Gates

### Muss vor öffentlichem Release erledigt oder bewusst aus dem Release entfernt werden

- G1: Veröffentlichungsbefugnis für projektinternen Code, UI/Dokumentation, Ereignis-/Biografietexte, Datenzusammenstellung und Icon schriftlich festhalten.
- G2: Die elf CC-BY-Biografien mit identifizierbarem Lizenzgeber, eindeutigem Lizenzumfang und verlangter Attribution belegen oder nicht auf die bestehende CC-BY-Angabe vertrauen.
- G3: Für 29 `rights-unclear`-Biografien und 635 Ereignisse ohne per-item Status eine Freigabe-/Ausschlussentscheidung treffen; die globalen Statuswerte reichen nicht als Lizenzbeleg.
- G4: Wikimedia-Bilder pro Datei klären und korrekt attributieren oder die Bildauslieferung deaktivieren.
- G5: CARTO-Nutzungsberechtigung einschließlich API-Key/Vertrag/Grant, Nutzungsart und Volumen belegen; OSM/CARTO/OpenMapTiles-Attribution in allen Ansichten testen.
- G6: Vollständige versionierte Notices für MapLibre 4.7.1 und Supabase-js 2.45.4 mit dem Release zugänglich machen.
- G7: Produktive Supabase-Inhalte separat prüfen oder Supabase für den Release deaktivieren; das Repository inventarisiert diese externen Zeilen nicht.
- G8: Rechtekette der bisherigen Beiträge bestätigen.

### Benötigt nach geklärter Nutzungsberechtigung primär Attribution/Notice

- MapLibre GL JS 4.7.1: vollständige versionierte Lizenz und eingebettete Drittanbieter-Notices.
- Supabase-js 2.45.4: MIT-Copyright- und Permission-Notice.
- OpenStreetMap: sichtbarer Credit an die Mitwirkenden und klarer ODbL-Hinweis/Link.
- CARTO/OpenMapTiles/Style: die für den konkreten Dienst vertraglich und lizenzseitig verlangten sichtbaren Credits; dies ersetzt nicht G5.
- Wirksam unter CC BY 4.0 freigegebene Biografietexte: identifizierbare Namensnennung, Lizenzlink, Beibehaltung verlangter Hinweise und Änderungskennzeichnung.
- Jedes einzeln als frei nachnutzbar bestätigte Wikimedia-Bild: die auf seiner Dateiseite verlangte Creditline, Lizenzverlinkung und gegebenenfalls ShareAlike-/Änderungshinweise.

### Kein eigenständiger Lizenzblocker ohne übernommene geschützte Inhalte

- Reine HTTPS-Quellenlinks und knappe bibliografische Angaben.
- Historische Tatsachen als solche; die konkrete Auswahl, Struktur und Formulierung bleibt davon getrennt zu prüfen.
- SRI-Hashes, Versionsnummern und technische URL-Metadaten.

## Abweichungen von der vorhandenen Rechte-Dokumentation

1. `docs/licensing-and-attribution.md` nennt MapLibre, aber nicht Supabase-js und nicht die vollständigen gebündelten MapLibre-Notices.
2. Die Dokumentation beschreibt CARTO hauptsächlich als Attributionsfrage. Die aktuellen Basemap Terms enthalten weitergehende Vertrags-, Key-, Caching-, Screenshot- und Nutzungslimitbedingungen.
3. Die Dokumentation erkennt die CC-BY/`rights-unclear`-Mischung der Biografien, benennt aber nicht den fehlenden Lizenzgeber und die drei inkompatiblen Feldformen.
4. `data/archive-contract.json` sagt global `data: rights-unclear`; 635 aktive Ereignisse haben dennoch keinen per-item Status. Die Validierung erzwingt ihn nur für vertiefte Datensätze.
5. Das Bildmodell sagt korrekt `per-item`, aber es existiert kein einziges ausgefülltes Bildrechteobjekt; die Oberfläche zeigt keine Bildattribution.
6. `docs/supabase-schema.sql` kann Remote-Text und Remote-Bilder öffentlich ausliefern, ohne Felder für deren Rechtekette.
7. `CONTRIBUTING.md` verlangt Herkunft, enthält aber keine eingehende Lizenz oder Rechteerklärung.

## Nicht geprüft / außerhalb des Repository-Nachweises

- Identität, Vertragsverhältnisse und tatsächliche Verfügungsbefugnis der im Git-Log genannten Person.
- Produktiver Supabase-Datenbestand und dort hinterlegte Bilder/Quellen.
- Tatsächliche CARTO-Konto-, Grant-, Order-Form- oder API-Key-Situation außerhalb des Repositorys.
- Jede einzelne Wikimedia-Dateiseite und ihr aktueller Rechtezustand; das Fehlen der nötigen Zuordnung ist gerade der Befund.
- Jurisdiktionsabhängige Schranken, Datenbankrechte, Urheberpersönlichkeits-, Marken-, Persönlichkeits-, Datenschutz- oder indigene kulturelle Rechte.
- Inhalte von Issues, Pull Requests, externen Backups, Deployments, Screenshots, PDFs, App-Store-Materialien oder früheren Releases.

Dieses Inventar trifft ausdrücklich keine Lizenzentscheidung und empfiehlt keine konkrete Projektlizenz. Es beschreibt, welche Entscheidungen und Belege vor einer öffentlichen Freigabe fehlen.
