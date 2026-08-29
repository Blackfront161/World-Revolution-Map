# Lizenzen und Attribution

Dieses Repository enthält Bestandteile mit unterschiedlichen Rechteketten. Es wird derzeit **keine pauschale Lizenz für das Gesamtprojekt** behauptet.

## Code

Im Repository liegt derzeit keine vom Rechteinhaber freigegebene `LICENSE`-Datei. Der Projektcode ist deshalb nicht automatisch Open Source. Eine spätere Lizenzentscheidung muss durch die Rechteinhaber*innen erfolgen; Abhängigkeiten behalten ihre eigenen Lizenzen. Die vollständigen versionierten Hinweise für MapLibre GL JS 5.24.0 (Globus-Testversion) und die nur bei ausdrücklichem Opt-in geladene Supabase-JavaScript-Bibliothek 2.45.4 stehen in [`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md). Der MapLibre-Lizenztext wurde gegen 5.24.0 geprüft und ist gegenüber 4.7.1 unverändert. Ältere Release-Audits behalten ihren historischen Versionsbezug.

## Ereignisdaten und Redaktion

Historische Tatsachen, redaktionelle Formulierungen und verlinkte Quellwerke haben unterschiedliche Rechtezustände. Bis zu einer ausdrücklichen Freigabe lautet der Status der projektinternen Zusammenstellung `rights-unclear`. Verlinkte Archive, Museen, Community-Organisationen und Publikationen bleiben bei ihren jeweiligen Rechteinhaber*innen; ihre Verlinkung überträgt keine Nutzungsrechte.

## Biografiedaten

Die drei in `data/biography-catalog.json` geführten Dateien enthalten eigene Lizenzhinweise je Datensatz. Bis ein identifizierter Lizenzgeber Umfang, Lizenzlink und Attribution nachweist, werden die redaktionellen Biografietexte konservativ als `rights-unclear` geführt. Daraus folgt keine Lizenz für den Gesamtkatalog. Quellenmetadaten und Links übertragen weder Rechte an Archivmaterialien noch an verlinkten Texten.

## Bilder

Die Oberfläche zeigt standardmäßig lokale Symbolkarten. Ein optionales Ereignisbild wird nur über das vertraglich definierte `visualMedia`-Objekt geladen, wenn eine konkrete Wikimedia-Commons-Dateiseite, Urheber-/Creditangabe, konkrete Lizenz und `rights-reviewed`-Einzelprüfung vollständig vorliegen. Ungeprüfte oder ältere Bild-URL-Felder sind keine Freigabe und werden nicht abgerufen. Aktuell enthält der aktive Katalog kein freigegebenes Ereignisbild.

Das Produktlogo `assets/brand/world-revolution-atlas-user-v1.png` wurde von der Projektleitung zur Einbindung bereitgestellt und bleibt bytegleich archiviert. Aktiv ist die separat gespeicherte, auf Wunsch KI-bearbeitete Pergamentvariante `assets/brand/world-revolution-atlas-parchment-v2.png`. Der Bildbearbeitungsauftrag ersetzt den schwarzen Außenhintergrund durch warmes Archivpapier und erhält Schrift, Farben und Komposition möglichst nah am Original; Pixelidentität und Transparenz werden für diese Variante nicht behauptet. Die messingfarbene Einfassung entsteht in CSS. Eine pauschale Weiterverwendungslizenz oder Urheberrechtsprüfung folgt aus der Bereitstellung nicht. Frühere SVG-/PNG-Entwürfe bleiben archiviert, werden aber nicht mehr als Produktmarke angezeigt. Die Freigabe- und Markenentscheidung bleibt bei den Rechteinhaber*innen.

## Kartendaten und Basiskarte

Die Basiskarte wird von CARTO bereitgestellt und enthält OpenStreetMap-Daten. Die sichtbare Kartenattribution darf nicht entfernt werden.

- OpenStreetMap-Daten: © OpenStreetMap-Mitwirkende, [ODbL und Attribution](https://www.openstreetmap.org/copyright)
- CARTO: [Attributionsanforderungen](https://carto.com/attribution/)
- Kartenrenderer: MapLibre GL JS, BSD-3-Clause (siehe oben)

Attribution allein belegt noch keine CARTO-Nutzungsberechtigung. API-Key, Vertrag/Grant, Basemap Terms sowie die sichtbare CARTO-/OpenStreetMap-/OpenMapTiles-Attribution müssen im konkreten Zielhosting vor Freigabe geprüft werden.

Die Darstellungen „Dunkles Archiv“, „Kontrastreich monochrom“ und „Warmes Papierarchiv“ sind ausschließlich lokale CSS-/Renderer-Varianten derselben CARTO-/OpenStreetMap-Basiskarte. Sie binden keinen weiteren Tileanbieter ein und verändern oder verdecken die Attribution nicht. Eine zusätzliche Datenschutz- oder Rechtebehauptung für neue Kartendienste ist damit nicht verbunden.

Satelliten- oder Luftbildkacheln sind bewusst nicht integriert. Dafür wären vorab eine separate Provider-, Vertrags-/Lizenz-, CSP-, Datenschutz- und Attributionentscheidung im Zielhosting erforderlich.

## Beiträge

Wer Text, Daten oder Medien beiträgt, muss die Herkunft benennen und darf keine Rechte Dritter zusichern, die nicht nachweisbar sind. Unklarer Rechtezustand wird mit `rights-unclear`, Einzelmedien mit `per-item` und externe Kartendienste mit `third-party-terms` dokumentiert.
