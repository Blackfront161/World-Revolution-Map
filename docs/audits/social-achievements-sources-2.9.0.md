# Quellen-Audit: soziale Errungenschaften 2.9.0

Prüfstand: Repository-HEAD `0941f6abba34ecd0164564100a10ed10e556d095`, Datendatei `data/social-achievements-next.json`, geprüft am 24. August 2026.

## Ergebnis

| Status | Einträge |
|---|---:|
| PASS | 10 |
| MANUELL PRÜFEN | 2 |
| ERSETZEN | 1 |
| **Gesamt** | **13** |

Zusätzlich wurden alle 44 Einträge in `provenance.sourceUrls` geprüft. Alle 44 verwenden HTTPS. Alle 34 Verweisvorkommen in `relatedEventIds` (23 unterschiedliche IDs) existieren im Repository; die Beziehungen sind thematisch oder historisch plausibel. In keinem der 13 Datensätze wird eine Aussage als direktes historisches Zitat ausgegeben; erfundene Zitate wurden daher nicht festgestellt.

`PASS` bedeutet, dass die angeführten Quellen in ihrer Gesamtheit Institution, Zeitraum, Errungenschaft, Organisierung von unten und wesentliche Grenzen ausreichend tragen. `MANUELL PRÜFEN` bedeutet, dass der Kern stimmt, aber eine konkrete Provenienzbehauptung oder eine nicht maschinell identifizierbare Datei noch am Original geprüft werden sollte. `ERSETZEN` bedeutet hier nicht, dass die Errungenschaft erfunden ist, sondern dass mindestens eine gespeicherte URL bzw. die Quellenabdeckung vor Veröffentlichung ersetzt oder ergänzt werden muss.

Beim ersten automatisierten Vollabruf waren 19/44 Ziele direkt inhaltlich lesbar; 25/44 ergaben 403, Redirect-Schleifen, Timeouts, 502/503 oder ein leeres Parser-Ergebnis. Solche Abruffehler wurden nicht als inhaltliches Scheitern gewertet, wenn dieselbe institutionelle Seite mit passendem Titel und Inhalt im Suchindex, offiziellen Dokumentbestand oder über einen parallelen amtlichen Endpunkt nachweisbar war. Nicht bestätigbare Deep Links oder abweichende Zielpfade führen dagegen zu `MANUELL PRÜFEN` oder `ERSETZEN`.

## Einzelprüfung

### 1. `ilo-domestic-workers-convention-189-2011` — PASS

Die ILO-Seiten bestätigen Annahme von Konvention 189 und Empfehlung 201 am 16. Juni 2011, die aktive Beteiligung von Hausangestellten und ihren Organisationen sowie spätere Organisierungs- und Ratifizierungskampagnen. Die Publikation zu migrantischen Hausangestellten trägt die besonderen Grenzen für migrantische und live-in Beschäftigte. Institution, Datierung und Errungenschaft passen. `sewa-india` und `justice-for-janitors` sind als verwandte Beispiele informeller, migrantischer und gewerkschaftlicher Organisierung plausibel, wenn auch keine direkten Stationen der C189-Verhandlung.

- [Domestic workers organizing and collective bargaining](https://www.ilo.org/topics-and-sectors/domestic-workers/domestic-workers-organizing-and-collective-bargaining) — automatisiert 403, aber als gleichnamige ILO-Seite indexiert; bestätigt C189/R201, Organisationsrolle und Schwierigkeiten kollektiver Organisierung.
- [Development of Convention 189 and Recommendation 201](https://www.ilo.org/resource/development-convention-189-and-recommendation-201) — automatisiert 403, institutionell/indexiert bestätigt; nennt den Normsetzungsprozess und die aktive Beteiligung von Hausangestellten selbst.
- [Decent work for migrant domestic workers: moving the agenda forward](https://www.ilo.org/sites/default/files/wcmsp5/groups/public/%40ed_protect/%40protrav/%40migrant/documents/publication/wcms_535596.pdf) — automatisiert 403; Dokument-ID und Titel sind in ILO-Nachweisen bestätigt. Die Datei ist für Migrations- und Umsetzungsgrenzen einschlägig.

Keine erfundenen Zitate. Sämtliche URLs sind HTTPS.

### 2. `un-declaration-indigenous-rights-2007` — PASS

Resolution 61/295 wurde am 13. September 2007 mit 143 Ja-Stimmen, 4 Nein-Stimmen und 11 Enthaltungen angenommen; die UN-Seiten tragen Rechtsinhalt, langjährigen Prozess und Umsetzungslücken. Der gespeicherte Hauptlink ist trotz des ungewöhnlichen `%20` genau unter dieser URL im UN-Suchindex nachweisbar und kein festgestellter Fehlpfad. Die präzise Beteiligungsaussage ist ebenfalls gedeckt: Die angegebene UN-Seite „Indigenous Peoples at the United Nations“ nennt ausdrücklich, dass mehr als 100 indigene Organisationen jährlich an der Arbeitsgruppe teilnahmen.

- [gespeicherter UNDRIP-Hauptlink](https://www.un.org/development/desa/indigenouspeoples/declaration-on-%20the-rights-of-indigenous-peoples.html) — automatisiert 403, aber genau diese URL ist als UN-DESA-Seite indexiert; bestätigt Datum, Abstimmung, Rechtsinhalt und historischen Ablauf.
- [Indigenous Peoples at the United Nations](https://www.un.org/development/desa/indigenouspeoples/about-us-html) — automatisiert 403, institutionell/indexiert bestätigt; belegt ausdrücklich die regelmäßige Teilnahme von mehr als 100 indigenen Organisationen.
- [Recommendations on Human Rights](https://www.un.org/development/desa/indigenouspeoples/mandated-areas1/human-rights/recommendations-on-human-rights.html) — automatisiert 403, institutionell/indexiert bestätigt; trägt ernste Umsetzungslücken, Landentzug, Zwangsumsiedlung und fortdauernde Gewalt.
- [UN-Pressemitteilung GA/10612](https://press.un.org/en/2007/ga10612.doc.htm) — automatisierter Timeout, aber als UN-Pressemitteilung vollständig indexiert; bestätigt Datum, Abstimmung, fast 25 Jahre Verhandlungen sowie Land-, Ressourcen- und Kulturrechte.

`aboriginal-tent-embassy`, `wave-hill-walk-off`, `idle-no-more` und `standing-rock` sind als indigene Land-, Selbstbestimmungs- und Zustimmungsbewegungen plausibel. Keine erfundenen Zitate; alle URLs sind HTTPS.

### 3. `ilo-collective-bargaining-convention-98-1949` — MANUELL PRÜFEN

Normtext, Annahme am 1. Juli 1949, Inkrafttreten am 18. Juli 1951 und die Ausnahmen für Polizei, Streitkräfte und Staatsverwaltung sind korrekt belegt. Die Quellen tragen auch Schutz vor antigewerkschaftlicher Diskriminierung und die Förderung freiwilliger Tarifverhandlungen. Zwei Punkte erfordern Prüfung: Die drei NORMLEX-Links sind Normtext bzw. Aufsichtsauslegung, keine Geschichte jahrzehntelanger Streiks, Branchenverbände oder der Überführung dieser Kämpfe in die ILO. Außerdem fand die Annahme laut ILO am 1. Juli 1949 in **San Francisco** statt; `location`, Koordinaten und Hinweis verorten den Eintrag dagegen in Genf. Genf ist nur als heutiger Institutionsanker vertretbar und sollte als solcher gekennzeichnet oder durch den Annahmeort ersetzt werden.

- [NORMLEX Instrument ID 312243](https://normlex.ilo.org/dyn/nrmlx_en/f?p=NORMLEXPUB%3A12201%3A0%3A%3ANO%3A%3AP12201_INSTRUMENT_ID%3A312243) — automatisierte Redirect-Schleife; Instrument-ID ist C098 zugeordnet, der konkrete View sollte im Browser kontrolliert werden.
- [NORMLEX C098, Normtext](https://normlex.ilo.org/dyn/nrmlx_fr/f?p=NORMLEXPUB%3A12100%3A0%3A%3ANO%3A%3AP12100_INSTRUMENT_ID%2CP12100_LANG_CODE%3A312243%2Cen) — automatisierte Redirect-Schleife; Instrument-ID, Normtitel und Artikel sind über den aktuellen NORMLEX-Treffer bestätigt. Der Host-/Sprachmix `nrmlx_fr` plus `en` ist unnötig fragil.
- [NORMLEX-Auslegung, Hierarchie 3947747](https://normlex.ilo.org/dyn/nrmlx_en/f?p=NORMLEXPUB%3A70002%3A0%3A%3ANO%3A%3AP70002_HIER_ELEMENT_ID%2CP70002_HIER_LEVEL%3A3947747%2C1) — automatisierte Redirect-Schleife; externe amtliche Verweise identifizieren die Hierarchie als ILO-Auslegung zur Reichweite für Staatsbedienstete.

Konkrete Maßnahme: Ortslogik entscheiden, die drei Legacy-Deep-Links möglichst auf aktuelle kanonische NORMLEX-URLs umstellen und eine ILO-Archiv- oder ILO-Geschichtsquelle für die behauptete Bewegungsvorgeschichte ergänzen. `winnipeg-general-strike`, `justice-for-janitors` und `grunwick-strike` sind als Tarif-, Organisierungs- und Gewerkschaftskämpfe plausibel. Keine erfundenen Zitate; alle URLs sind HTTPS.

### 4. `un-human-right-water-sanitation-2010` — PASS

Die UN-Digitalbibliothek und General Comment 15 bestätigen Rechtsinhalt, Datum und normative Vorstufe von 2002; die Abstimmung 122–0–41 ist korrekt. Die UC-Studie behandelt den Wasserkrieg von Cochabamba, gemeinschaftliche Wasserordnungen, Privatisierungsgegner und staatliche Gewalt. Damit sind die breit formulierte Bottom-up-Erzählung und die Grenzen als nicht monokausale, weiterhin umkämpfte Umsetzung angemessen abgesichert.

- [UN Digital Library, A/RES/64/292](https://digitallibrary.un.org/record/687112?ln=en) — automatisiert 403, aber Datensatz, Titel, Datum und Abstimmung institutionell/indexiert bestätigt.
- [CESCR General Comment No. 15](https://docstore.ohchr.org/SelfServices/FilesHandler.ashx?enc=Osgj5xgnGZAiiHuNDxXQ2to35LljZKGwGDpiXFgzvULVQZm%2BA5eUzbhm3XQIC9EYGSIK25WcotNiA9MPevycxQ%3D%3D) — direkt lesbar; datiert 2002/2003 und trägt Verfügbarkeit, Qualität, Zugänglichkeit, Bezahlbarkeit und Nichtdiskriminierung.
- [Social Property in the Cochabamba Water War](https://escholarship.org/content/qt7v1168rz/qt7v1168rz.pdf) — direkt als 16-seitige wissenschaftliche PDF lesbar; passt zu Cochabamba, Organisierung und Grenzen gemeinschaftlicher/öffentlicher Kontrolle.

`cochabamba-water-war` ist direkt, `mahad-satyagraha` über diskriminierungsfreien Zugang zu öffentlichem Wasser und `standing-rock` über indigene Wasser- und Landverteidigung plausibel. Keine erfundenen Zitate; alle URLs sind HTTPS.

### 5. `us-fair-labor-standards-act-1938` — MANUELL PRÜFEN

Die DOL-Geschichte bestätigt Unterzeichnung 1938, 25 Cent Mindestlohn, 44-Stunden-Woche, Kinderarbeitsregeln und anfängliche Abdeckung von nur etwa einem Fünftel der Erwerbsbevölkerung. Gesetzestext und DOL-Fachseiten tragen Überstunden, spätere Ausweitung sowie fortbestehende Landwirtschafts- und Haushaltsausnahmen. Das Quellenset ist aber fast ausschließlich gesetzes- und verwaltungsgeschichtlich und belegt die konkrete Bottom-up-Kausalaussage zu Arbeitskämpfen und Gewerkschaftswachstum nicht hinreichend. Auch die rassistisch wirksamen Ausschlüsse von Landwirtschaft und Hausarbeit sollten gezielt mit einer Archiv- oder Forschungspublikation abgesichert werden.

- [DOL-Geschichte des FLSA](https://www.dol.gov/general/aboutdol/history/flsa1938) — automatisiert 403, aber als DOL-Seite vollständig indexiert; trägt Kernzahlen, Gesetzgebungsstreit und Datierung.
- [Fair Labor Standards Act, Gesetzestext](https://www.dol.gov/whd/regs/statutes/FairLaborStandAct.pdf) — Sicherheits-/Abrufblock im Automationsclient; Titel und DOL-Zuordnung indexiert bestätigt.
- [FLSA 75th Anniversary Paper Series](https://www.dol.gov/sites/dolgov/files/OASP/legacy/files/FLSAPaperSeries.pdf) — automatisiert 403, institutionell/indexiert bestätigt; einschlägige historische und gegenwärtige Einordnung.
- [DOL: FLSA in Agriculture](https://www.dol.gov/agencies/whd/agriculture/flsa) — direkt lesbar; aktuelle DOL-Landwirtschaftsseite zu Reichweite und Ausnahmen.

Konkrete Maßnahme: Eine belastbare Arbeits- oder Sozialgeschichtsquelle zu Gewerkschaftsdruck und den rassistisch strukturierten Ausschlüssen ergänzen oder `bottomUpPressure` enger an die vorhandene DOL-Gesetzesgeschichte formulieren. `haymarket`, `bread-and-roses` und `justice-for-janitors` sind als historische bzw. spätere Kämpfe um Arbeitszeit, Lohn und Durchsetzung plausibel. Keine erfundenen Zitate; alle URLs sind HTTPS.

### 6. `brown-board-school-desegregation-1954` — PASS

Die drei National-Archives-Seiten decken das Urteil, die fünf zusammengeführten lokalen Verfahren, Schüler*innen- und Familieninitiative, die langfristige NAACP-Rechtsstrategie, Brown II und verzögerte Umsetzung ab. Urteilstitel, Fundstelle 347 U.S. 483, Datum und Aussage „separate educational facilities are inherently unequal“ stimmen. Die Grenzen durch die unbestimmte Brown-II-Formel, Widerstand, Schulschließungen und fortbestehende faktische Segregation sind quellengerecht zusammengefasst.

- [Milestone Document: Brown v. Board](https://www.archives.gov/milestone-documents/brown-v-board-of-education) — direkt lesbar; Primärtext, Datum, Fundstelle, Brown II und Widerstand.
- [Education Resources: Brown v. Board](https://www.archives.gov/education/lessons/brown-v-board) — direkt lesbar; NAACP-Strategie, lokale Kläger*innen, fünf Verfahren und Brown II.
- [Federal Records Pertaining to Brown](https://www.archives.gov/publications/ref-info-papers/112-brown-board-educ/intro.html) — direkt lesbarer Archiv-Finding-Aid; Institution, Aktenkontext und Datierung passen.

`montgomery-bus-boycott`, `greensboro-sit-ins` und `selma-marches` sind als anschließende Bürgerrechtsmobilisierungen plausibel. Keine erfundenen Zitate; alle URLs sind HTTPS.

### 7. `section-504-regulations-signed-1977` — PASS

NPS und Smithsonian bestätigen die landesweiten Proteste, den 26-tägigen San-Francisco-Sit-in, cross-disability Organisierung, gegenseitige Versorgung, Gewerkschafts-, Kirchen-, queere und Black-Panther-Unterstützung sowie Califanos unveränderte Unterzeichnung am 28. April 1977. Der govinfo-Bericht behandelt Reichweite und Vollzug von Section 504 und passt zu den benannten Grenzen.

- [NPS: 504 Protest](https://www.nps.gov/articles/000/504-protest-disability-community-and-civil-rights.htm) — direkt lesbar; besonders starker Beleg für Bottom-up-Organisierung, Bündnisse, Versorgungsarbeit und Repression während der Besetzung.
- [Smithsonian: Sitting-in for disability rights](https://www.americanhistory.si.edu/explore/stories/sitting-disability-rights-section-504-protests-1970s) — automatisierter Timeout; der kanonische Smithsonian-Treffer ohne `www` ist indexiert und bestätigt die unveränderte Unterzeichnung am 28. April 1977. Der gespeicherte Host sollte bei Gelegenheit manuell auf Weiterleitung geprüft werden.
- [National Council on Disability: Rehabilitating Section 504](https://www.govinfo.gov/content/pkg/GOVPUB-Y3_D63_3-PURL-LPS97246/pdf/GOVPUB-Y3_D63_3-PURL-LPS97246.pdf) — direkt als 115-seitige govinfo-PDF lesbar; geeignete amtliche Quelle zu Durchsetzung und verbleibenden Grenzen.

`section-504-sit-in` ist direkt und `black-panther-party` wegen der dokumentierten materiellen Unterstützung des Sit-ins plausibel. Keine erfundenen Zitate; alle URLs sind HTTPS.

### 8. `bolivia-agrarian-reform-1953` — PASS

Die FAO-Analyse beschreibt ausdrücklich generalisierte Hacienda-Besetzungen und indigene Rebellion als Auslöser einer zunächst unklaren Regierungspolitik. FAOLEX bestätigt Dekret 3464 vom 2. August 1953, soziale Funktion des Eigentums und Verteilung; weitere FAO-Texte tragen Pongueaje-Ende, männlich dominierte Titulierung, schwache Kleinbetriebsförderung und neue Landkonzentration im Tiefland. Datierung, Errungenschaft, Bottom-up-Druck und Grenzen passen.

- [FAO: Bolivia, el abandono de la reforma agraria](https://www.fao.org/4/y5639t/y5639t04.htm) — direkt lesbar; besonders starker Beleg für Landbesetzungen, indigene Rebellion, Geschlechtergrenzen und Tiefland-Latifundien.
- [FAOLEX: Legislative Decree No. 03464](https://faolex.fao.org/docs/pdf/bol4481E.pdf) — direkt als 36-seitige Gesetzes-PDF lesbar; Datum, Institution, soziale Funktion und Rechtsrahmen stimmen.
- [FAO: Evolución y tendencias de las reformas agrarias](https://www.fao.org/4/j0415t/j0415t0b.htm) — direkt lesbar; ordnet Reichweite, revolutionären Kontext und strukturelle Grenzen ein.

`cochabamba-water-war`, `tebhaga-movement` und `wave-hill-walk-off` sind als bäuerliche/indigene Ressourcen-, Land- und Umverteilungskämpfe plausibel. Keine erfundenen Zitate; alle URLs sind HTTPS.

### 9. `brazil-sus-constitution-1988` — PASS

Die beiden Fiocruz-Rückblicke bestätigen Aufbau der Reforma Sanitária seit den 1970er Jahren, Opposition zur Diktatur, mehr als 4.000 Beteiligte an der erstmals breit geöffneten 8. Nationalen Gesundheitskonferenz 1986 und die Überführung ihrer Forderungen in Verfassung und SUS-Gesetze. Die wissenschaftlichen Fiocruz-Publikationen sind für institutionelle Entwicklung sowie regionale, rassistische und indigene Ungleichheiten einschlägig. Drei direkte Abrufe liefen in Timeouts; Titel, Institution und Kernaussagen waren jedoch über Fiocruz-indexierte Seiten überprüfbar. Das ist ein Automationsproblem, kein festgestellter Quellenfehler.

- [Fiocruz: saúde como direito de todos e dever do Estado](https://cee.fiocruz.br/40-anos-da-8a-conferencia-nacional-de-saude-a-saude-como-direito-de-todos-e-dever-do-estado/) — direkter Abruf leer/Timeout, aber vollständig indexiert; Publikation vom 19. März 2026, 8. CNS 17.–21. März 1986, mehr als 4.000 Teilnehmende, Verfassungs- und SUS-Bezug.
- [Fiocruz: testemunho de participantes](https://cee.fiocruz.br/40-anos-da-8a-conferencia-nacional-de-saude-o-testemunho-de-participantes-do-movimento-da-reforma-sanitaria/) — Timeout, institutionell/indexiert bestätigt; trägt Organisierung, Wissensproduktion und Bewegungskontinuität.
- [Cadernos de Saúde Pública, Download 7068](https://cadernos.ensp.fiocruz.br/ojs/index.php/csp/article/download/7068/15412/44456) — Timeout; Domain und Journal sind korrekt, der numerische Deep Link offenbart im Index jedoch keinen Titel. Wegen der übrigen Abdeckung kein Statusabzug, aber bei redaktioneller Wartung durch DOI oder Artikelseite ersetzen.
- [Fiocruz EPSJV: Unequal Voices](https://www.epsjv.fiocruz.br/sites/default/files/files/vozes%20desiguais%20ingles.pdf) — Timeout; Projekt und Fiocruz-Zuordnung sind indexiert bestätigt, einschlägig für ungleichen Zugang, insbesondere indigene Versorgung.

`act-up-wall-street` ist als Gesundheitsbewegung und `brazil-june-journeys` wegen der Gesundheits- und öffentlichen-Dienste-Forderungen plausibel. Keine erfundenen Zitate; alle URLs sind HTTPS.

### 10. `india-cooked-midday-meal-entitlement-2001` — PASS

Die Regierungsseite zitiert die konkrete Supreme-Court-Anordnung vom 28. November 2001: gekochtes Essen, mindestens 300 Kalorien und 8–12 Gramm Protein, mindestens 200 Schultage, staatliche und staatlich unterstützte Grundschulen. UNU-WIDER behandelt PUCL, Right-to-Food-Litigation und Kampagnenstrategien. LSE belegt Kastendiskriminierung gegen Dalit-Kinder und Dalit-Köchinnen; Wiley bestätigt den gerichtlichen Politikdurchbruch und dessen iterative Umsetzung. Errungenschaft, Organisierung und Grenzen sind damit gut abgedeckt.

- [PM POSHAN: Meal Provision](https://pmposhan.education.gov.in/Meal%20Provision.html) — direkter Abruf leer, aber Regierungsseite vollständig indexiert; Wortlaut, Datum und Mindestwerte stimmen.
- [UNU-WIDER: Rights-based Approach to Development](https://www.wider.unu.edu/publication/rights-based-approach-development) — direkt lesbar; PUCL-Klage 2001, Hunger-Kontext und Bewegungs-/Prozessstrategien.
- [LSE Public Policy Review, Artikel 101](https://ppr.lse.ac.uk/articles/101) — Timeout, aber vollständig indexiert; trägt Expansion, soziale Wirkungen sowie konkrete Kastendiskriminierung bei Sitzordnung, Essen und Köchinnen.
- [Wiley: Courts as Entrepreneurs](https://onlinelibrary.wiley.com/doi/10.1111/j.1943-0787.2012.01363.x) — direkt lesbare Metadaten und Abstract; Titel, DOI, Publikation 2012 und Gerichts-/Programmbezug passen.

`black-panther-party` ist wegen kostenloser Schulfrühstücksprogramme und `mahad-satyagraha` wegen Antikasten-Organisierung um diskriminierungsfreien Zugang plausibel. Keine erfundenen Zitate; alle URLs sind HTTPS.

### 11. `south-africa-tac-nevirapine-judgment-2002` — PASS

Das Haupturteil ist eindeutig korrekt: *Minister of Health v Treatment Action Campaign (No 2)*, ZACC 15, entschieden am 5. Juli 2002. Es bestätigt die unvernünftige Beschränkung auf Pilotstellen und ordnet Verfügbarkeit von Nevirapin in geeigneten öffentlichen Einrichtungen sowie ein umfassendes, koordiniertes Präventionsprogramm an. ZACC 16 ist ein echtes verbundenes Zwischenurteil. Die UCT-Datei war direkt als 62-seitige MPhil-Fallstudie von Jennifer L. Peterson (2006), *Facilitating Policy Formulation and Policy Implementation: A Case Study of Policy on the Prevention of Mother to Child HIV Transmission in South Africa*, lesbar. Sie belegt TAC-geführte Koalition, öffentliche Mobilisierung, Übergang zum Gerichtsweg und Umsetzungsmonitoring. Damit sind Bottom-up-Prozess und Grenzen gedeckt.

- [SAFLII: TAC (No 2), ZACC 15](https://www.saflii.org/za/cases/ZACC/2002/15.html) — als vollständiges Urteil indexiert und inhaltlich lesbar; Datum, Gericht, Parteien, Begründung, Grenzen und Anordnung stimmen.
- [SAFLII: TAC (No 1), ZACC 16](https://www.saflii.org/za/cases/ZACC/2002/16.html) — automatisiert 403; als interlocutorisches Begleiturteil institutionell/indexiert bestätigt. Nicht falsch, aber für die Kernaussage entbehrlich.
- [UCT-Bitstream d5509c2f…](https://open.uct.ac.za/server/api/core/bitstreams/d5509c2f-6311-4fc2-af99-5e5581b38638/content) — direkt lesbare 62-seitige UCT-Fallstudie von Jennifer L. Peterson (2006); passend zu TAC-Koalition, Mobilisierung, Rechtsstrategie und Umsetzung.

`act-up-wall-street` ist als HIV-Behandlungsaktivismus und `black-panther-party` als Community-Gesundheitsorganisierung plausibel. Keine erfundenen Zitate; alle URLs sind HTTPS.

### 12. `red-vienna-municipal-housing-1923` — ERSETZEN

Stadt Wien und TU Wien bestätigen Wahlsieg 1919, Wohnbausteuer und erstes Programm 1923, progressive Finanzierung, rund 61.175 Gemeindewohnungen plus 5.257 Siedlerhäuser sowie soziale Infrastruktur. Das vorhandene Quellenset reicht dennoch für zwei konstitutive Teile nicht: Es dokumentiert weder die behauptete konkrete Macht von Mieter*innenorganisationen und Siedlerbewegung auf das Programm noch die Grenzen „Zuteilung blieb selektiv“, kleine Wohnungen und spätere Verfolgung/Enteignung jüdischer Bewohner*innen ausreichend. Weil Bottom-up-Organisierung und Grenzen Pflichtteil des Audits sind, müssen Quellen ersetzt bzw. substanziell ergänzt werden; ein bloßer manueller Vorbehalt genügt nicht.

- [City of Vienna: From Socialism to Fascism](https://www.wien.gv.at/en/education/history-red-vienna) — direkt lesbar; politischer Zeitraum und Übergang zum Autoritarismus passen.
- [Stadt-Wien-Video: Ringstraße des Proletariats](https://www.wien.gv.at/video/546/Ringstrasse-des-Proletariats) — direkt lesbare Mitschrift; Programm 1923, etwa 65.000 Wohnungen, Arbeiter*innen-Wohnnot und Infrastruktur.
- [TU Wien: Ringstrasse des Proletariats](https://www.hb2.tuwien.ac.at/en/vu-hb2-ringstrasse-des-proletariats/) — direkt lesbar; bestätigt Wohnbausteuer, 1919–1933 und fast 65.000 Wohnungen, ist aber ein aktuelles Lehrprojekt, keine historische Primärquelle.
- [Stadt Wien: 90 Jahre kommunaler Wohnbau](https://presse.wien.gv.at/2013/09/20/str-michael-ludwig-zum-90-jahr-jubilaeum-des-kommunalen-wohnbaus-in-wien) — direkt lesbar; 25.000er-Programm, starke Progression, 61.175 Wohnungen, 5.257 Siedlerhäuser und Gemeinschaftseinrichtungen.

Konkrete Maßnahme: Wiener Stadt- und Landesarchiv oder wissenschaftliche Wohnbaugeschichte für Mieter*innen-/Siedlerbewegung, Vergabepraxis und Verfolgung ergänzen. `panama-rent-strike-1925` und `green-bans-australia` sind als Mieter*innen- bzw. stadtpolitische Arbeiter*innenkämpfe plausibel. Keine erfundenen Zitate; alle URLs sind HTTPS.

### 13. `aboriginal-land-rights-nt-act-1976` — PASS

DCCEEW belegt Wave-Hill-Walk-off, schlechte Arbeits- und Lebensbedingungen, Aufbau von Daguragu, Gewerkschaftshilfe, neun Jahre Beharrlichkeit und Landübergabe 1975. Das Bundesgesetz trägt Reservatsübertragung und Anspruchsverfahren und definiert unalienated Crown land einschließlich des Ausschlusses von Stadtland; AIATSIS ordnet Land Rights Act und Native Title im Northern Territory ein. Die gespeicherte Gesetzes-URL zeigt eine amtliche konsolidierte Fassung zum 1. Juli 2014, nicht die „as made“-Fassung von 1976. Das ist transparent am Ziel erkennbar und verfälscht die geprüften Struktur- und Grenzenaussagen nicht. Eine ursprüngliche Fassung wäre als Zusatz wünschenswert, nicht freigabeblockierend.

- [Aboriginal Land Rights (Northern Territory) Act 1976, Compilation 2014-07-01](https://www.legislation.gov.au/C2004A01620/2014-07-01/2014-07-01/text/original/epub/OEBPS/document_1/document_1.html) — direkt lesbar und amtlich; die Fassung ist transparent als 2014er Konsolidierung gekennzeichnet und deckt die geprüften Struktur- und Grenzenaussagen.
- [DCCEEW: Wave Hill Walk-Off Route](https://www.dcceew.gov.au/parks-heritage/heritage/places/national/wave-hill) — direkt lesbar; starker amtlicher Beleg für Bottom-up-Prozess, Datierung, Daguragu, Gewerkschaftssolidarität und Landübergabe.
- [AIATSIS: Native Title Information Handbook 2016, NT](https://aiatsis.gov.au/sites/default/files/research_pub/native_title_information_handbook_2016_nt_2.pdf) — als 39-seitiges AIATSIS-PDF indexiert und inhaltlich extrahiert; Institution, Gegenstand und Einordnung passen.

`wave-hill-walk-off` ist direkt, `aboriginal-tent-embassy` als nachfolgende nationale Landrechtsmobilisierung und `pilbara-strike` als verwandter Aboriginal-Arbeits- und Autonomiekampf plausibel. Keine erfundenen Zitate; alle URLs sind HTTPS.

## Gesamtempfehlung

Die zehn `PASS`-Einträge können aus Sicht dieses Quellen-Audits übernommen werden. Vor Veröffentlichung sollten die beiden Einträge `ilo-collective-bargaining-convention-98-1949` und `us-fair-labor-standards-act-1938` die genannten Orts- bzw. Bottom-up-Nachweise erhalten. `red-vienna-municipal-housing-1923` sollte mit dem derzeitigen Quellenset nicht freigegeben werden; hier sind Quellenersatz oder substanzielle Ergänzungen erforderlich.

Priorität der Nacharbeit:

1. Für C98 die Ortslogik Genf/San Francisco klären und eine ILO-Archivquelle zur Bewegungsvorgeschichte ergänzen.
2. Für den FLSA eine Arbeits-/Sozialgeschichtsquelle zu Gewerkschaftsdruck und rassistisch wirksamen Ausschlüssen ergänzen.
3. Für Rotes Wien eine Archiv-/Fachquelle zu Mieter*innen, Siedler*innen, Vergabe und Verfolgung ergänzen oder die nicht belegten Aussagen enger fassen.
