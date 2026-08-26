# Übersetzungs- und Inclusive-Language-Workflow

## Ausgangslage von Phase 1

Die verbindliche, maschinenlesbare Bestandsaufnahme steht in `data/language-inventory.json`; die No-Regression-Basis in `data/language-coverage-baseline.json`. Sie unterscheidet ausdrücklich zwischen deutschem Ausgangstext, `present-unreviewed`, Laufzeit-Fallback, `stale`, fehlend und `reviewed`.

Aktueller Inventurumfang:

- 357 UI-Schlüssel;
- 674 aktive Ereignisse mit 6.663 übersetzbaren Feld-Einheiten beziehungsweise 7.574 Textsegmenten je Zielsprache;
- 40 Biografien mit 1.314 narrativen Einheiten je Zielsprache;
- sechs Routen mit 18 Feldern je Zielsprache;
- 16 Methodik- und 14 Pirat*innen-Dossier-Schlüssel als nicht-additive UI-Sichten;
- 133 unterschiedliche redaktionelle Metadatenwerte;
- 73 sichtbare Kategorie-/Tag-Begriffe, die in einer späteren Datenmigration stabile sprachneutrale IDs benötigen.

Für Ereignis-, Biografie- und Routentexte gibt es in den acht Zielsprachen derzeit keine als `reviewed` freigegebenen Übersetzungen. Phase 1 erfindet diesen Prüfstand nicht. Die vormals 40 englischen UI-Fallbacks in Italienisch, Portugiesisch, Russisch, Griechisch und Türkisch besitzen jetzt explizite Zielsprachfassungen, bleiben aber bis zum menschlichen Review `present-unreviewed`.

## Verbindliche Reviewregeln

Eine Datenfeldübersetzung darf nur dann `reviewed` heißen, wenn sie alle Nachweise der Policy `1.0.0` enthält:

- `sourceDigest`: SHA-256 über den JSON-kodierten, NFC-normalisierten Ausgangswert;
- `reviewedAt`: Datum im Format `YYYY-MM-DD`;
- `languageReviewer`: menschliche Sprachprüfung;
- `factReviewer`: menschliche Faktenprüfung gegen die Quellenbasis;
- `policyVersion`: exakt die aktive Policyversion;
- `machineAssisted`: wahrheitsgemäße boolesche Angabe.

Der Validator und die Browser-Laufzeit berechnen den Digest erneut über den exakten aktuellen Ausgangswert. Ein bloß formal gültiger SHA-256 reicht nicht: Bei Abweichung wird der Zieltext weder als `reviewed` gezählt noch ausgeliefert. Ändert sich der Ausgangstext oder die Policy, wird die Übersetzung `stale`. Identische Quell- und Zieltexte benötigen eine begründete `preserveReason`; Gleichheit allein ist kein Reviewbeleg. Listenform und Listenlänge sowie Platzhalter wie `{count}` bleiben erhalten. Zulässig ist ausschließlich Unicode NFC ohne Bidi-Steuerzeichen oder eingebettetes HTML. Sensible oder identitätsbezogene Inhalte benötigen zusätzlich einen benannten Fachreview.

Codebasierte Texte in UI, Dossiers, redaktionellen Metadaten und Taxonomie werden über `data/translation-review-manifest.json` geprüft. Jeder Manifest-Eintrag bindet Scope, Sprache, Entität und Feld sowohl an `sourceDigest` als auch `targetDigest` und enthält dieselben menschlichen Reviewnachweise. Ohne Manifest bleibt ein vorhandener Zieltext `present-unreviewed`; ein geänderter Quell- oder Zieltext wird `stale`. Das leere Phase-1-Manifest ist damit ein konstruktiver, getesteter Reviewpfad und keine fingierte Freigabe.

Freigegebene Chargen dürfen weder Fallbacks noch Teilübersetzungen verdecken. Eine Sprachcharge umfasst höchstens 25 IDs beziehungsweise 300 echte Segmente, eine Biografiecharge höchstens fünf Personen. Listenfelder zählen mit jedem Listenelement und nicht nur als ein Feldtoken. Teilübersetzungen bleiben in der UI sichtbar als solche gekennzeichnet.

Ereignisse werden nach der Normalisierung feldweise lokalisiert. Biografien werden vor `normalizeBiography` auf ihren verschachtelten Quellpfaden wie `lifeStages.0.description` lokalisiert; Routen werden beim Laden vor der Darstellung lokalisiert. Alle drei Wege verwenden dieselbe Digest-, Review-, Struktur-, NFC-, Bidi- und HTML-Prüfung. Fehlt ein gültiger Review oder ist der Digest stale, bleibt sichtbar die deutsche Originalfassung; der Vertrag verspricht damit keinen ungenutzten Datenpfad.

## Sprach- und Genderregeln

- Jede Sprache neutralisiert natürlich nach ihren eigenen grammatischen Möglichkeiten; das deutsche Genderzeichen wird nicht kopiert.
- Geschlecht oder Pronomen werden nicht aus Namen, Endungen oder vermeintlicher Bekanntheit abgeleitet.
- Belegte geschlechtsspezifische historische Gruppen bleiben sichtbar.
- Eigennamen, Selbstbezeichnungen und Originaltitel werden bewahrt.
- Koloniale Fremdbegriffe erscheinen nur mit notwendigem Kontext, nie als unmarkierte Selbstbezeichnung.
- Zitate werden nur direkt und überprüfbar belegt; maschinelle Rückübersetzungen sind keine Zitate.
- Unsicherheitsmarker, Spannungen und Einschränkungen des Ausgangstexts dürfen nicht geglättet werden.
- Englisch folgt `en-GB`, Portugiesisch `pt-PT`.

Der deutsche Linter `npm run check:inclusive-language` prüft kanonische UI-Texte, Routen, alle 40 Biografien und den effektiven Ereignisbestand nach der Runtime-Reihenfolge Rohdaten → Redaktions-Overrides. Historisch tatsächlich männliche Gruppen, Eigennamen, Institutionen und offene Quellenprüfungen benötigen einen genauen Locator und eine Begründung in `data/inclusive-language-allowlist.json`; pauschale Wort-Ausnahmen sind unzulässig. Die vormals pauschal als historisch männlich behandelte 44er-Gruppe bleibt bis zu locator-spezifischen Quellenbelegen ausdrücklich `manual-source-review`.

## Befehle und Baselinepflege

- `npm run check:translations`: erzeugt die Matrix im Speicher, vergleicht sie bytegenau mit dem eingecheckten Inventar und prüft die No-Regression-Baseline.
- `npm run inventory:translations`: schreibt die aktuelle Matrix, ändert aber nicht still die Baseline.
- `npm run update:translation-baseline`: bewusste, reviewpflichtige Aktualisierung von Matrix und Baseline.
- `npm run check:translations:strict`: Zielgate; scheitert, solange irgendein erforderliches Feld nicht `reviewed` ist. Es ist absichtlich nicht das normale PR-Gate.

Die normale CI verhindert, dass bereits geprüfte Felder ihren Status verlieren, vorhandene Zieltexte wieder zu Fallback/fehlend werden, sich ihr Zieltext-Digest unbemerkt ändert oder neue offene Einheiten ohne bewusste Baselineentscheidung hinzukommen. Dadurch fallen auch Nonsense-Änderungen oder ein Rückfall auf englischen Text trotz unverändertem Schlüssel auf. Verbesserungen von `missing`, `fallback` oder `present-unreviewed` zu `reviewed` bleiben nach bewusster Review- und Baselinepflege erlaubt.

## Chargenstatus

Phase 1 umfasst ausschließlich Vertrag, Inventar, Gates, die 40 früheren UI-Fallbacks sowie kontextsensitive deutsche Genderkorrekturen in UI, Dossiers, Routen, Biografien und der vereinbarten Ereignischarge. Sie enthält keine neue freigegebene historische Langtextübersetzung. Weitere Übersetzungsinhalte beginnen erst nach einer fokussierten Kontrolle dieses Zwischenstands.
