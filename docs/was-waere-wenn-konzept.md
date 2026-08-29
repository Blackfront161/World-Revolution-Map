# Was wäre, wenn? – KI-Szenarien für den Atlas

Stand: 28. August 2026. Status: Produktidee und Umsetzungsvorschlag, nicht implementiert.

## Ziel

Spieler*innen verändern einen historischen Ausgangspunkt und erkunden mehrere
mögliche Entwicklungen bis zur Gegenwart. Die KI entwirft begründete alternative
Geschichten. Sie berechnet keine nachweislich richtige Parallelwelt und liefert
keine belastbaren Eintrittswahrscheinlichkeiten.

Historische Ausgangsdaten, bewusst veränderte Annahmen und erfundene Folgen bleiben
in Darstellung, Speicherung und Export getrennt. Der belegte Atlas wird nicht
überschrieben.

## Eingriffe

| Eingriff | Bedienung | Zu klärende Annahme |
| --- | --- | --- |
| Ereignis entfällt | Vorhandenes Ereignis öffnen und „Was wäre ohne dieses Ereignis?“ wählen | Warum entfällt es? Nur dieser Anlass oder auch eine seiner Ursachen? |
| Ereignis kommt hinzu | Zeitpunkt, Region und ein erfundenes Ereignis eingeben | Welche Voraussetzungen braucht es, und werden diese ebenfalls verändert? |
| Ereignis verläuft anders | Zeitpunkt, Beteiligung, Unterstützung oder Ausgang verändern | Was genau wird geändert, was bleibt zunächst gleich? |

Beispiel für eine rein erfundene Eingabe: „In dieser Region findet 1900 ein großer
branchenübergreifender Streik statt.“ Vor der Generierung zeigt die Anwendung,
welche Annahmen über Organisation, Kommunikation und Beteiligung dafür nötig wären.
Die Jahreszahl und Handlung sind hier nur ein Bedienbeispiel, keine historische
Behauptung.

## Ablauf im Spiel

1. Ereignis auswählen oder ein neues Szenario eingeben.
2. Ausgangslage lesen: belegter Kontext, Datenlücken, gewählter Eingriff und
   zusätzliche Annahmen. Spieler*innen können die Annahmen ändern.
3. Drei mögliche Verläufe erzeugen. Sie unterscheiden sich durch konkrete
   Reaktionen und Bedingungen, nicht durch ein pauschales Gut/Schlecht-Schema.
4. Einen Verlauf auf der Zeitleiste erkunden: unmittelbare Folgen, nächste Jahre,
   spätere Jahrzehnte, mögliche Gegenwart.
5. Zu jeder Folge „Warum?“, „Unter welcher Annahme?“ und „Was könnte dagegen
   sprechen?“ öffnen.
6. An einem späteren Punkt erneut eingreifen und eine neue Verzweigung speichern.

Ein Beispiel ohne Anspruch auf historische Gültigkeit:

> Ein bestimmter Streik entfällt. In einem Verlauf entsteht später eine andere
> Mobilisierung und ähnliche Reformen werden verzögert erreicht. In einem zweiten
> Verlauf fehlen entscheidende Bündnisse und Forderungen bleiben länger offen. In
> einem dritten Verlauf führen andere politische Kräfte Teilreformen durch, mit
> anderen Ausschlüssen und Abhängigkeiten. Welche Unterschiede davon bis heute
> bestehen bleiben, hängt von weiteren ausdrücklich genannten Annahmen ab.

Ein fehlendes Ereignis löscht also nicht automatisch die Forderungen, Konflikte
oder Menschen, die es hervorgebracht haben. Auch spätere Ersatzereignisse und
ähnliche Endzustände müssen als Möglichkeiten vorkommen.

## Sichtbar machen

- Umschalter zwischen „Belegte Geschichte“ und „Hypothetisches Szenario“.
- Vergleich der historischen und alternativen Zeitleiste nebeneinander.
- Eigene Szenarioebene auf der Karte mit Textkennzeichnung und unterscheidbaren
  Symbolen; Farbe allein reicht nicht.
- Anklickbare Folgen und Verbindungen mit Erklärung des angenommenen Mechanismus.
- Vergleichskarten für Arbeit und Alltag, Rechte und Teilhabe, Machtverhältnisse,
  internationale Beziehungen sowie Umwelt und Technik – nur soweit im Szenario
  sinnvoll begründbar.
- Für jede Gegenwartsaussage: Wer wäre betroffen, in welcher Region, auf welchem
  Weg, mit welchen offenen Fragen? Keine pauschale globale Fortschrittszahl.
- Zugängliche Listenansicht als gleichwertige Alternative zu Karte und Graph.

Die Karte zeigt zunächst betroffene Regionen und Zusammenhänge. Präzise erfundene
Grenzen, Bevölkerungszahlen oder Wohlstandswerte würden mehr Genauigkeit vortäuschen,
als das Verfahren begründen kann, und gehören nicht in die erste Version.

## Wie die KI arbeiten soll

1. Einen begrenzten, zur Frage passenden Kontext aus dem Archiv zusammenstellen.
   Der Atlas ist keine vollständige historische Weltdatenbank. Fehlender Kontext
   bleibt sichtbar und darf eine Einschränkung des Szenarios auslösen.
2. Den Eingriff als konkrete Änderung formulieren. Weitere nötige Änderungen als
   eigene Annahmen zeigen; keine stillschweigenden Veränderungen der Vorgeschichte.
3. Mehrere Folgeschritte mit Beteiligten, Interessen, Ressourcen, Gegenreaktionen,
   Institutionen und möglichen Ausweichentwicklungen entwerfen.
4. Für jeden Schritt Voraussetzungen und mindestens einen möglichen Einwand nennen.
   Eine Folge darf von mehreren Ursachen abhängen; eine einfache Dominokette genügt
   für komplexe Verläufe nicht.
5. Widersprüche, zeitliche Fehler, unbegründete Sprünge und unpassende Technik prüfen.
   Regelprüfungen und eine zusätzliche KI-Prüfung können Fehler finden, garantieren
   aber keine historische Plausibilität.
6. Strukturierte Szenariodaten ausgeben, die die Oberfläche validiert und darstellt.

Vorgeschlagene Daten je Szenario: Versionsnummer, Ausgangsereignis oder neue
Prämisse, Eingriff, Kontextreferenzen, Datenstand, Zieljahr, Annahmen, Verzweigungen,
Folgen, hypothetische Wirkungsbeziehungen, Einwände und Generierungsmetadaten.
Folgen benötigen stabile interne IDs und Elternreferenzen für spätere Eingriffe.

„Bis heute“ verwendet das aktuelle Zieljahr. Das ist ausdrücklich nicht dasselbe
wie der Aktualitätsstand der verfügbaren historischen Quellen. Fehlende aktuelle
Daten dürfen nicht als recherchierter Gegenwartsvergleich erscheinen.

## Regeln für Glaubwürdigkeit

- Sichtbare Kennzeichnungen: „Historischer Ausgangspunkt“, „Deine Änderung“,
  „Zusätzliche Annahme“ und „KI-generierte mögliche Folge“.
- Quellen belegen nur den historischen Kontext, nicht die alternative Zukunft.
  Quellenreferenzen müssen aus dem bereitgestellten Kontext stammen; die KI darf
  keine erfundenen Belege oder Zitate hinzufügen.
- Die vorhandenen Atlas-Beziehungen sind teilweise Routenvergleiche oder
  Ähnlichkeiten. Sie dürfen nicht automatisch zu historischen Ursachen werden.
- Keine Prozentwahrscheinlichkeiten oder numerischen Vertrauenswerte ohne eine
  dafür begründete und geprüfte Methode. Stattdessen die konkreten Unsicherheiten
  erklären. Auch eine überzeugende Formulierung ist kein Plausibilitätsnachweis.
- Mit zunehmendem Abstand vom Eingriff werden zusätzliche Annahmen und alternative
  Entwicklungen sichtbar. Ein Szenario darf bei unzureichender Grundlage auch
  sagen: „Hier lassen sich keine sinnvoll begründeten Folgen ableiten.“
- Hypothesen dürfen nicht in Archivsuche, historische Quizantworten oder belegte
  Ereignisbeziehungen einfließen. Export und erneutes Öffnen behalten die Hinweise.
- Schutzregeln für sensible Ereignisse gelten weiter: keine Verharmlosung, keine
  Belohnungen für Gewaltfolgen und keine Rekonstruktion geschützter Ortsangaben.

## Technische Einbindung

Die vorhandene Anwendung ist ein statisches Frontend mit lokalen Archivdaten.
Für einen gehosteten KI-Dienst wird ein zusätzlicher Server-Endpunkt benötigt.
Geheime Zugangsschlüssel bleiben auf dem Server, niemals im Browser oder Repository.

Der Server begrenzt Eingabelänge, Anfragen, Laufzeit und Kosten; lädt bekannten
Kontext selbst anhand validierter IDs; und prüft die Antwortstruktur. Eingaben und
Archivtexte sind Daten, keine Anweisungen zur Umgehung dieser Regeln. Ausgaben
werden wie bestehende Atlastexte als Text und sichere DOM-Knoten dargestellt.

Vor dem Absenden wird erklärt, welche Eingabe und Kontextdaten an welchen Dienst
gehen. Kein automatisches Mitsenden von Spielstand, Sammlungen oder sensiblen
Koordinaten. Der übrige Atlas bleibt ohne KI nutzbar. Bereits lokal gespeicherte
Szenarien können offline lesbar bleiben; neue Generierungen benötigen bei dieser
Architektur eine Verbindung.

Eine lokale KI wäre eine eigene technische Variante mit anderen Anforderungen an
Geräte und Betrieb. Anbieter, Modell, Hosting, Datenschutzbedingungen und Kosten
sind vor einer Live-Anbindung separat zu entscheiden und aktuell zu prüfen.

## Erste umsetzbare Version

Ein Einstieg im Ereignisdetail plus eine Eingabe für zusätzliche Ereignisse; pro
Anfrage zunächst ein Eingriff, drei Verläufe und höchstens vier Zeitabschnitte.
Der räumliche und thematische Umfang wird vor der Generierung ausgewiesen und
begrenzt. Vertiefungen werden erst auf Anforderung erzeugt.

Zunächst Zeitleistenvergleich, Annahmen, Einwände und mögliche Auswirkungen auf
heutigen Alltag. Danach Verzweigungen, zusätzliche Eingriffe und Kartenebenen.
Kombinierte Eingriffe dürfen später nicht nur als Summe einzelner Szenarien
behandelt werden, sondern benötigen eine erneute Prüfung ihrer Wechselwirkungen.

Vor einer Freigabe prüfen: Trennung von Fakten und Fiktion, unverändertes Archiv,
gültige Quellenreferenzen, Fehlerfälle und Kostenlimits, Orts- und Inhaltsschutz,
Tastaturbedienung sowie die Kennzeichnung beim Speichern und Exportieren. Eine
fachliche Stichprobe soll die Qualität und Grenzen der Szenarien beurteilen;
technische Tests können diese redaktionelle Prüfung nicht ersetzen.
