# Audit der Biografiequellen 2.9.0

Stand: 24. August 2026  
Geprüfter Repository-Stand: `0941f6a`  
Umfang: 40 Biografien, 97 `sourceRefs`, 79 Hosts

## Ergebnis

| Bewertung | Anzahl | Bedeutung |
|---|---:|---|
| PASS | 56 | HTTPS-Ziel, Publisher und Titel plausibel; die Person wird behandelt und die Quelle trägt im Verbund die verwendeten Aussagen. |
| MANUELL PRÜFEN | 35 | Ziel war geblockt, nur als schwer auslesbares PDF erreichbar oder die Landingpage deckt Titel, Person oder besonders sensible Aussage nicht eindeutig genug. Geblockte Ziele gelten ausdrücklich nicht als falsch. |
| ERSETZEN | 6 | Nachweislich totes/veraltetes Ziel, HTTPS-/Zertifikatsrückfall oder redaktionell ungeeignete Quelle; Begründung jeweils unten. |

Alle 97 eingetragenen URLs beginnen mit `https://`. Es gibt keine exakte URL-Dublette. Die drei Funmilayo-Ransome-Kuti-Referenzen tragen denselben Titel, sind aber verschiedene Ziele; eine davon ist ein entbehrlicher Drittanbieter-Spiegel. Direkte Zitate wurden in den 40 Biografietexten nicht gefunden. Die einzige im geprüften Quellenmaterial sichtbare wörtliche Aquash-Passage wird im Datensatz nicht übernommen.

## Methodik und Grenzen

Geprüft wurden Schema und URL-String, tatsächliches Navigationsziel/Weiterleitung, Seitentitel, Host und Publisher-Zuordnung, Nennung bzw. substantielle Behandlung der Person, Quellentyp sowie die Deckung von Lebenslauf, Kritik- und Sensitivitätsaussagen. Institutionelle oder Community-Quellen wurden nicht automatisch als neutral behandelt; Selbstdarstellungen, Preisbiografien und Bewegungsstellungnahmen wurden auf ihren begrenzten Aussagebereich zurückgeführt. Primärtexte und Archivfindbücher gelten als belastbare Bestandsnachweise, aber nicht ohne Fundstelle als ausreichender Beleg jeder redaktionellen Interpretation.

Die Prüfung erfolgte lesend per Repository-Analyse, Web-Crawler und direkter Browseransicht. `403`, Bot-Schutz, leere PDF-Browseransicht oder Crawler-Timeout führen zu **MANUELL PRÜFEN**, nicht zu **ERSETZEN**. **PASS** bedeutet redaktionelle Eignung für den konkreten Datensatz, nicht allgemeine Fehlerfreiheit oder Zustimmung zur Perspektive der Quelle.

## Vollständige Referenzmatrix

Legende: `P` = PASS, `M` = MANUELL PRÜFEN, `E` = ERSETZEN. Die Nummern 01–97 folgen der Katalogreihenfolge.

| Biografie | P/M/E | Referenzen |
|---|---:|---|
| Queen Nanny | 1/1/1 | [01 E](https://beta.nlj.gov.jm/qcontentnational-heroes/) · [02 P](https://www.nlj.gov.jm/history-notes/The%20Maroons%20edited%20final.htm) · [03 M](https://whc.unesco.org/uploads/nominations/1356rev.pdf) |
| Harriet Tubman | 2/1/0 | [04 P](https://www.nps.gov/people/harriet-tubman.htm) · [05 M](https://guides.loc.gov/harriet-tubman) · [06 P](https://www.nps.gov/articles/harriet-tubman-and-the-54th-massachusetts.htm) |
| Robert Smalls | 2/1/0 | [07 P](https://home.nps.gov/people/robert-smalls.htm) · [08 P](https://history.house.gov/People/Detail/21764) · [09 M](https://www.history.navy.mil/our-collections/photography/us-people/s/smalls-robert.html) |
| Yaa Asantewaa | 0/2/0 | [10 M](https://www.britishmuseum.org/collection/term/AUTH227870) · [11 M](https://www.britishmuseum.org/about-us/british-museum-story/contested-objects-collection/asante-gold-regalia) |
| Lamine Senghor | 2/1/0 | [12 P](https://catalogue.bnf.fr/ark:/12148/cb16650806b) · [13 M](https://academic.oup.com/manchester-scholarship-online/book/45468/chapter-abstract/392031347) · [14 P](https://www.cambridge.org/core/services/aop-cambridge-core/content/view/10A59EC86C3380378F451526355E571C/9789400603707c8_p211-236_CBO.pdf/no-more-slaves-lamine-senghor-black-internationalism-and-the-league-against-imperialism.pdf) |
| Funmilayo Ransome-Kuti | 1/1/1 | [15 M](https://digitallibrary.un.org/record/830152/) · [16 P](https://archive.ids.ac.uk/eldis/document/A74692.html) · [17 E](https://web.classicistranieri.com/en-women-in-african-history/WAH_EN_Files/FunmilayoRansomeKuti.pdf) |
| Ella Baker | 2/1/0 | [18 M](https://www.nps.gov/articles/women-in-the-african-american-civil-rights-movement-an-historic-context.htm) · [19 P](https://archives.nypl.org/scm/20899) · [20 P](https://www.archives.gov/research/african-americans/black-power/sncc) |
| Claudia Jones | 1/2/0 | [21 M](https://www.nationalarchives.gov.uk/education/resources/commonwealth-migration-since-1945/) · [22 M](https://www.marxists.org/history/usa/pubs/political-affairs/1949-06v28n6-political-affairs.pdf) · [23 P](https://www.marxists.org/archive/jones-claudia/index.htm) |
| Andrée Blouin | 1/1/1 | [24 E](https://www.si.edu/object/siris_sil_160551) · [25 M](https://aflit.arts.uwa.edu.au/blouin10.html) · [26 P](https://link.springer.com/chapter/10.1057/9780230110403_4) |
| Bayard Rustin | 3/0/0 | [27 P](https://www.nps.gov/places/bayard-rustin-residence.htm) · [28 P](https://home.nps.gov/articles/the-places-of-bayard-rustin.htm) · [29 P](https://findingaids.loc.gov/repositories/19/resources/2209) |
| Wangari Maathai | 1/3/0 | [30 M](https://www.nobelprize.org/prizes/peace/2004/maathai/) · [31 M](https://www.nobelprize.org/prizes/peace/2004/maathai/biographical/) · [32 M](https://www.nobelprize.org/prizes/peace/2004/maathai/lecture/) · [33 P](https://www.goldmanprize.org/recipient/wangari-maathai/) |
| Berta Cáceres | 2/0/0 | [34 P](https://berta.copinh.org/biografia-de-berta-isabel-caceres-flores/) · [35 P](https://www.goldmanprize.org/recipient/berta-caceres/) |
| Wilma Mankiller | 1/1/0 | [36 P](https://americanindian.si.edu/collections-search/object/posts_afec77e51815a760af4967d5955e82fc) · [37 M](https://womenshistory.si.edu/blog/wilma-mankiller-led-first-woman-principal-chief-cherokee-nation) |
| Toypurina | 2/0/0 | [38 P](https://www.nps.gov/places/mission-san-gabriel-archangel.htm) · [39 P](https://www.pbssocal.org/history-society/the-rebellion-against-the-mission-of-the-saintly-prince-the-archangel-san-gabriel-of-the-temblors-1785) |
| Oodgeroo Noonuccal | 2/0/0 | [40 P](https://aiatsis.gov.au/collection/featured-collections/identity) · [41 P](https://adb.anu.edu.au/biography/noonuccal-oodgeroo-18057) |
| Rigoberta Menchú Tum | 2/0/0 | [42 P](https://fundacionrigobertamenchutum.org/biografia/) · [43 P](https://www.nobelprize.org/prizes/peace/1992/tum/biographical/) |
| Leonard Peltier | 3/0/0 | [44 P](https://www.ncai.org/news/leonard-peltier-is-going-home-a-step-toward-healing-and-justice) · [45 P](https://www.amnesty.org/en/wp-content/uploads/2022/02/AMR5152082022ENGLISH.pdf) · [46 P](https://apnews.com/article/8b7da707f4921e974b53ede7d032cf23) |
| Annie Mae Aquash | 3/0/0 | [47 P](https://www.canada.ca/en/women-gender-equality/commemorations-celebrations/women-impact/human-rights/anna-mae-aquash.html) · [48 P](https://americanindian.si.edu/collections-search/edan-record/ead_component%3Asova-nmai-ac-449-ref20) · [49 P](https://canadashistory.ca/explore/women/annie-mae-aquash) |
| Bartolina Sisa | 1/1/0 | [50 P](https://mujer.sea.gob.bo/src/personajeResultado.php?variable=4) · [51 M](https://www.minculturas.gob.bo/wp-content/uploads/2024/12/HEROES-Y-HEROINAS-2024_compressed.pdf) |
| Nemonte Nenquimo | 2/0/0 | [52 P](https://amazonfrontlines.org/es/chronicles/siete-mujeres-indigenas-amazonia/) · [53 P](https://www.goldmanprize.org/recipient/nemonte-nenquimo/) |
| Meri Te Tai Mangakāhia | 0/2/0 | [54 M](https://teara.govt.nz/en/biographies/2m30/mangakahia-meri-te-tai) · [55 M](https://nzhistory.govt.nz/people/meri-mangakahia) |
| Eddie Koiki Mabo | 1/0/1 | [56 P](https://aiatsis.gov.au/explore/eddie-koiki-mabo) · [57 E](https://adb.online.anu.edu.au/biography/mabo-edward-koiki-eddie-16122) |
| Lucy Parsons | 1/1/0 | [58 P](https://www.tshaonline.org/handbook/entries/parsons-lucy) · [59 M](https://www.library.illinois.edu/rbx/2019/02/28/lucy-e-parsons/) |
| Emma Goldman | 0/2/0 | [60 M](https://www.archives.gov/nhprc/projects/catalog/emma-goldman) · [61 M](https://digitalcollections.nypl.org/collections/emma-goldman-papers) |
| Pierre-Joseph Proudhon | 0/0/2 | [62 E](https://data.bnf.fr/11920705/pierre-joseph_proudhon/) · [63 E](https://philarchive.org/archive/PROACO-6) |
| Michail Bakunin | 0/2/0 | [64 M](https://search.socialhistory.org/Record/ARCH00018) · [65 M](https://www.britannica.com/biography/Mikhail-Bakunin) |
| Pjotr Kropotkin | 1/1/0 | [66 P](https://pzacad.pitzer.edu/Anarchist_Archives/kropotkin/Kropotkinarchive.html) · [67 M](https://www.britannica.com/biography/Peter-Alekseyevich-Kropotkin) |
| Louise Michel | 2/0/0 | [68 P](https://rdf.archives-nationales.culture.gouv.fr/garance/entities/agent/052652/?lang=en) · [69 P](https://www.bnf.fr/fr/louise-michel-une-heroine-de-la-commune) |
| Errico Malatesta | 2/0/0 | [70 P](https://www.marxists.org/archive/malatesta/) · [71 P](https://www.treccani.it/enciclopedia/errico-malatesta_%28Dizionario-di-Storia%29/) |
| Voltairine de Cleyre | 2/0/0 | [72 P](https://www.pbs.org/wgbh/americanexperience/features/goldman-voltairine-de-cleyre-1866-1912/) · [73 P](https://www.jstor.org/stable/10.3998/mpub.11482) |
| Nestor Machno | 2/0/0 | [74 P](https://esu.com.ua/article-67136) · [75 P](https://encyclopedia.1914-1918-online.net/article/makhno-nestor-ivanovich/) |
| Buenaventura Durruti | 0/2/0 | [76 M](https://pares.mcu.es/ParesBusquedas20/catalogo/autoridad/123548) · [77 M](https://www.akpress.org/durrutiinthespanishrevolution.html) |
| Ricardo Flores Magón | 1/2/0 | [78 M](https://www.constitucion1917.gob.mx/es/inehrm/magon) · [79 P](https://academic.oup.com/edited-volume/61800/chapter/546432065) · [80 M](https://archivomagon.net/it/biografia/) |
| Maria Lacerda de Moura | 2/1/0 | [81 P](https://cpdoc.fgv.br/sites/default/files/verbetes/primeira-republica/1%20Verbetes%20letra%20M.pdf) · [82 P](https://lisa.fflch.usp.br/node/65) · [83 M](https://revistas.usp.br/rieb/article/download/73411/77109/98588) |
| Ba Jin | 1/2/0 | [84 P](https://archives.lib.cuhk.edu.hk/repositories/5/archival_objects/254796) · [85 M](https://dwardmac.pitzer.edu/Anarchist_Archives/bright/bajin/bajinarchive.html) · [86 M](https://fukuoka-prize.org/files/download/en/LaureatesI18n/laureate_blocks/5688b02d-b6ab-48d4-9956-c46be711ecde/value01/value05) |
| Itō Noe | 1/1/0 | [87 P](https://www.aozora.gr.jp/index_pages/person416.html) · [88 M](https://www.ucpress.edu/book/9780520084216/reflections-on-the-way-to-the-gallows) |
| Ōsugi Sakae | 0/2/0 | [89 M](https://publishing.cdlib.org/ucpressebooks/public/book/the-autobiography-of-osugi-sakae.html) · [90 M](https://rmda.kulib.kyoto-u.ac.jp/item/RB00029936) |
| Federica Montseny | 1/1/0 | [91 M](https://www.cultura.gob.es/cultura/areas/archivos/mc/centros/cida/4-difusion-cooperacion/4-1-guias-de-lectura/escritoras/montseny-federica.html) · [92 P](https://digitalrepository.unm.edu/hist_etds/429/) |
| He-Yin Zhen | 2/0/0 | [93 P](https://afe.easia.columbia.edu/ps/cup/hezhen_women_communism.pdf) · [94 P](https://cup.columbia.edu/book/the-birth-of-chinese-feminism/9780231162913) |
| Sam Mbah | 3/0/0 | [95 P](https://theanarchistlibrary.org/library/chuck-morse-african-anarchism-an-interview-with-sam-mbah) · [96 P](https://antidotezine.com/2014/11/19/african-anarchism-an-interview-with-the-late-sam-mbah/) · [97 P](https://www.cwmorse.org/sam-mbah-mini-biography/) |

## Begründete Befunde und Prioritäten

### ERSETZEN

1. **[01](https://beta.nlj.gov.jm/qcontentnational-heroes/)** scheiterte im sichtbaren Browser an `ERR_CERT_COMMON_NAME_INVALID`; das ist ein konkreter HTTPS-Defekt, kein bloßer Crawler-Block. Durch einen funktionierenden kanonischen National-Library-Link ersetzen. [02](https://www.nlj.gov.jm/history-notes/The%20Maroons%20edited%20final.htm) behandelt Nanny bereits substanziell.
2. **[17](https://web.classicistranieri.com/en-women-in-african-history/WAH_EN_Files/FunmilayoRansomeKuti.pdf)** ist ein Drittanbieter-Spiegel, während Publisher und Typ eine UNESCO-Quelle suggerieren. Der Titel ist bereits durch [15](https://digitallibrary.un.org/record/830152/) und [16](https://archive.ids.ac.uk/eldis/document/A74692.html) vertreten. Durch eine offizielle UNESCO-/UN-Datei ersetzen oder ohne Informationsverlust entfernen.
3. **[24](https://www.si.edu/object/siris_sil_160551)** lieferte reproduzierbar `404 Not Found`. Für Blouins Autobiografie einen aktuellen Smithsonian-Katalogdatensatz oder einen Bibliotheks-Permalink einsetzen. [25](https://aflit.arts.uwa.edu.au/blouin10.html) bleibt zusätzlich manuell, weil die Seite bei Geburtsjahr 1921 eine offenkundig unmögliche Altersangabe für die Zeit um 1960 enthält.
4. **[57](https://adb.online.anu.edu.au/biography/mabo-edward-koiki-eddie-16122)** verwendet einen veralteten ADB-Host. Auf den kanonischen Host `https://adb.anu.edu.au/biography/mabo-edward-koiki-eddie-16122` umstellen und dort Titel/Inhalt nochmals bestätigen.
5. **[62](https://data.bnf.fr/11920705/pierre-joseph_proudhon/)** fiel beim Abruf von HTTPS auf eine inhaltsarme HTTP-Zielseite zurück. Für Normdaten ist `https://catalogue.bnf.fr/ark:/12148/cb11920705x` geeigneter; als Beleg der kritischen Aussagen reicht eine Normseite ohnehin nicht.
6. **[63](https://philarchive.org/archive/PROACO-6)** war geblockt; das allein wäre kein Ersatzgrund. Entscheidend ist, dass eine unspezifische Sammlung verstreuter Artikel und Briefe ohne genaue Fundstellen weder die Notizbuchpassage noch Proudhons systematischen Antifeminismus, Sklaverei-/Nationalitätspositionen und Streikambivalenz nachvollziehbar belegt. Ergänzen bzw. ersetzen durch konkret zitierbare Forschung und Primärstellen, etwa [Wiley: *Anarchism and Gender*](https://onlinelibrary.wiley.com/doi/abs/10.1002/9781405198073.wbierp0055), [UVic: Studie zu Proudhons Sexualpolitik](https://dspace.library.uvic.ca/items/22df17ce-f26d-4139-aa7b-d8d20c7638a0) und eine nachgewiesene Ausgabe der *Carnets*; die problematische Passage nicht im Biografietext ausschreiben.

### Besonders sensible Datensätze

- **Pierre-Joseph Proudhon:** Die redaktionelle Kritik ist in der Sache plausibel, aber mit den beiden vorhandenen Referenzen nicht ausreichend auditierbar. Beide stehen deshalb auf **ERSETZEN**. Für jede der vier Kritiklinien sind Seiten-/Kapitelangaben nötig; insbesondere darf die eliminatorische Antisemitismusbewertung nicht nur auf einer unspezifischen Link-Sammlung beruhen.
- **Leonard Peltier:** [44](https://www.ncai.org/news/leonard-peltier-is-going-home-a-step-toward-healing-and-justice) behandelt Strafumwandlung, fortbestehende Verurteilung und indigene Kritik korrekt, ist aber eine Interessenstellungnahme. [45](https://www.amnesty.org/en/wp-content/uploads/2022/02/AMR5152082022ENGLISH.pdf) war vollständig textuell auslesbar und dokumentiert Verurteilung, bestrittene Täterschaft, zurückgehaltene Ballistikunterlagen und die ablehnende gerichtliche Bewertung. [46](https://apnews.com/article/8b7da707f4921e974b53ede7d032cf23) war im direkten Browser nicht renderbar, Titel und Inhalt waren jedoch im Nachrichtendienstindex eindeutig derselben AP-URL zugeordnet; bestätigt werden Entlassungsdatum, Hausarrest statt Begnadigung und die Gegenposition des FBI. Alle drei stehen daher auf **PASS**. Eine zusätzliche Gerichtsquelle wie [8th Cir. 1993](https://law.justia.com/cases/federal/appellate-courts/F2/997/461/382046/) bzw. [8th Cir. 2008 auf GovInfo](https://www.govinfo.gov/content/pkg/USCOURTS-ca8-07-01745/pdf/USCOURTS-ca8-07-01745-0.pdf) würde die Triangulation weiter verbessern. Die aktuelle Formulierung trennt Verurteilung, Unschuldsposition, Verfahrenskritik und Gegenposition angemessen.
- **Annie Mae Aquash:** Alle drei Ziele behandeln die Person und stimmen in den Kernpunkten überein. [47](https://www.canada.ca/en/women-gender-equality/commemorations-celebrations/women-impact/human-rights/anna-mae-aquash.html) bestätigt Mi'kmaq-Zugehörigkeit und Verurteilungen aus dem AIM-Umfeld, [48](https://americanindian.si.edu/collections-search/edan-record/ead_component%3Asova-nmai-ac-449-ref20) ist ein indigener Archivdatensatz, [49](https://canadashistory.ca/explore/women/annie-mae-aquash) erläutert FBI-Infiltration und enthält ein transparent als Update markiertes Urteil. Für die gerichtliche Ebene ist ergänzend die [Mitteilung zum bestätigten Graham-Urteil](https://news.sd.gov/news?id=news_kb_article_view&sys_id=6cd19d4c1b5869506e4aa97ae54bcbb1) sinnvoll. Ungeklärte Auftraggeber-/Motivbehauptungen werden zu Recht nicht wiederholt.
- **Rigoberta Menchú Tum:** [42](https://fundacionrigobertamenchutum.org/biografia/) ist eine Selbstdarstellung und trägt Eigenbezeichnung, Stationen und institutionelle Arbeit, nicht die Kontroverse. [43](https://www.nobelprize.org/prizes/peace/1992/tum/biographical/) war im direkten Browser vollständig erreichbar, behandelt die Stoll-Kontroverse und bestätigt ausdrücklich, dass der Preis nicht ausschließlich oder hauptsächlich auf der Autobiografie beruhte. Die Rollenverteilung der beiden Quellen ist redaktionell sauber; keine Passage aus dem *testimonio* wurde als Zitat übernommen.
- **Nestor Machno:** [74](https://esu.com.ua/article-67136) ist ein aktuelles ukrainisches Fachlexikon. [75](https://encyclopedia.1914-1918-online.net/article/makhno-nestor-ivanovich/) behandelt ausdrücklich militärische Hierarchie, Requisition, Gewalt gegen Juden und Mennoniten, Pogrome sowie die umstrittene Bestrafung bzw. Protektion von Tätern. Damit sind die heiklen Aussagen ungewöhnlich gut direkt gedeckt. Die deutsche Formulierung „vollständige Kontrolle … strittig“ ist vorsichtiger als die Quelle und vertretbar.
- **Lucy Parsons:** [58](https://www.tshaonline.org/handbook/entries/parsons-lucy) ist ein personenspezifischer, namentlich verantworteter Fachbeitrag und technisch erreichbar. [59](https://www.library.illinois.edu/rbx/2019/02/28/lucy-e-parsons/) behauptet dagegen versklavte Eltern als Gewissheit und stellt mehrere Identitätsangaben knapp nebeneinander; das passt nicht ohne Prüfung zur bewusst offenen Datensatzformulierung. Deshalb **MANUELL PRÜFEN** und Herkunfts-/Selbstbezeichnungsbelege einzeln nachweisen.
- **Emma Goldman:** [60](https://www.archives.gov/nhprc/projects/catalog/emma-goldman) und [61](https://digitalcollections.nypl.org/collections/emma-goldman-papers) sind echte institutionelle Archiv-/Editionsziele; die NYPL-Seite behandelt Russland, Spanien, *Mother Earth*, Geburtenkontrolle und Antimilitarismus. Die Landingpages belegen aber nicht präzise Unterstützung für Berkmans Frick-Attentat, den Konflikt mit Parsons oder Goldmans Bewertung der CNT-FAI-Regierungsbeteiligung. Bis konkrete Dokumente oder Forschung mit Fundstellen ergänzt sind, beide **MANUELL PRÜFEN** statt pauschal PASS.

### Indigene Eigenbezeichnungen

Die verwendeten Formen **Lenca, Cherokee Nation, Tongva, Noonuccal, Maya K'iche', Turtle Mountain Band of Chippewa Indians, Mi'kmaq, Aymara, Waorani, Māori/Te Rarawa/Ngāti Te Rēinga/Ngāti Manawa/Te Kaitūtae** und **Meriam** sind als heutige Community-/Institutionsbezeichnungen plausibel und werden nicht durch koloniale Sammelnamen ersetzt. Besonderheiten:

- „Turtle Mountain Band of Chippewa Indians“ ist der offizielle Institutionsname; eine redaktionelle Umbenennung in Ojibwe wäre ohne Selbstbezeichnungsquelle nicht angebracht.
- [38](https://www.nps.gov/places/mission-san-gabriel-archangel.htm) nennt Toypurina noch „Gabrieleno“. Die Datensatzwahl „Tongva“ ist als heutige Eigenbezeichnung plausibel, sollte aber bei einer nächsten Quellenrunde mit einer Tongva-Community-Quelle direkt belegt werden.
- [40](https://aiatsis.gov.au/collection/featured-collections/identity) nennt Oodgeroo ausdrücklich als Noonuccal und dokumentiert ihre Präsidentschaft der Aboriginal Publications Foundation; [41](https://adb.anu.edu.au/biography/noonuccal-oodgeroo-18057) priorisiert den gewählten Namen und enthält den kulturellen Hinweis zu verstorbenen Aboriginal- und Torres-Strait-Islander-Personen.
- Die Schreibweise **Annie Mae** im Personennamen und **Anna Mae** in zwei Quellentiteln ist keine Dublette oder Verwechslung, sondern eine transparent erklärte Namensvariante.

## Weitere manuelle Schwerpunkte

- Die beiden British-Museum-Ziele zu Yaa Asantewaa [10](https://www.britishmuseum.org/collection/term/AUTH227870) und [11](https://www.britishmuseum.org/about-us/british-museum-story/contested-objects-collection/asante-gold-regalia) waren nicht auslesbar; insbesondere die zugeschriebenen Reden und die individuelle Führungsrolle müssen gegen eine personenspezifische Fachquelle geprüft werden.
- [18](https://www.nps.gov/articles/women-in-the-african-american-civil-rights-movement-an-historic-context.htm) ist eine breite Kontextseite, obwohl der eingetragene Titel Ella Baker hervorhebt. Entweder auf den exakten Bericht/Fundort verlinken oder den Metadatentitel anpassen.
- [21](https://www.nationalarchives.gov.uk/education/resources/commonwealth-migration-since-1945/) war `403`-geblockt und ist dem Titel nach nur Kontext. Vor PASS prüfen, ob Claudia Jones tatsächlich behandelt wird.
- Die Nobel-Maathai-Ziele [30](https://www.nobelprize.org/prizes/peace/2004/maathai/), [31](https://www.nobelprize.org/prizes/peace/2004/maathai/biographical/) und [32](https://www.nobelprize.org/prizes/peace/2004/maathai/lecture/) waren im Crawler geblockt. Wegen plausibler offizieller URLs bleiben sie manuell, nicht falsch; [33](https://www.goldmanprize.org/recipient/wangari-maathai/) ist erreichbar und personenspezifisch.
- Die Mabo-Referenz [57](https://adb.online.anu.edu.au/biography/mabo-edward-koiki-eddie-16122) und die Proudhon-Referenz [62](https://data.bnf.fr/11920705/pierre-joseph_proudhon/) zeigen, dass ein `https://`-String allein keine durchgängige HTTPS-Auslieferung bzw. keinen aktuellen kanonischen Host garantiert.

## Redaktionelles Fazit

Der Katalog ist strukturell sauber, vollständig HTTPS-formatiert und frei von exakten URL-Dubletten. Die meisten Quellen sind institutionell, wissenschaftlich, Community-basiert oder als Primärquelle korrekt typisiert. Der größte Qualitätsrest liegt nicht bei erfundenen Zitaten, sondern bei fehlenden punktgenauen Belegen für Kritikabschnitte, technisch geblockten Landingpages und einigen Quellen, deren institutioneller Ruf mehr verspricht als die konkrete Seite trägt. Vor Veröffentlichung 2.9.0 sind die sechs **ERSETZEN**-Fälle zu beheben; Proudhon ist dabei zwingend, Emma Goldman der wichtigste Ergänzungsfall unter **MANUELL PRÜFEN**.

Dieser Auditbericht dokumentiert eine Quellenprüfung und erteilt keine Lizenz oder sonstige Nutzungsrechte.

## Nachbearbeitungsstatus der RC-Runde

Die sechs als **ERSETZEN** markierten Ziele wurden nach dem Audit nachvollziehbar bearbeitet, ohne die ursprüngliche Matrix rückwirkend umzuschreiben:

- Queen Nanny: der TLS-fehlerhafte `beta.nlj.gov.jm`-Verweis wurde entfernt; die NLJ-Geschichtsseite und das UNESCO-Welterbedossier bleiben erhalten.
- Funmilayo Ransome-Kuti: der Drittanbieter-Spiegel wurde entfernt; UN Digital Library und IDS/Eldis bleiben als zwei institutionelle Quellen erhalten.
- Andrée Blouin: der im Audit reproduzierbar mit 404 bewertete Smithsonian-Link wurde durch den bibliografischen WorldCat-Permalink zur Ausgabe von 1983 ersetzt; UWA und das wissenschaftliche Palgrave-Kapitel bleiben erhalten.
- Eddie Koiki Mabo: der veraltete ADB-Host wurde auf `https://adb.anu.edu.au/biography/mabo-edward-koiki-eddie-16122` korrigiert.
- Pierre-Joseph Proudhon: die BnF-Normdaten zeigen nun auf `https://catalogue.bnf.fr/ark:/12148/cb11920705x`; die unspezifische PhilArchive-Sammlung wurde durch die UVic-Dissertation zur Sexualpolitik, den Wiley-Überblick *Anarchism and Gender* und die Persée-Editionsbesprechung der *Carnets* ersetzt. Nicht punktgenau belegte Kritiklinien zu Eigentum/Streik sowie Nationalität/Sklaverei wurden aus dem Kurzdatensatz entfernt; problematische Passagen werden weiterhin nicht ausgeschrieben.

Die ursprünglichen **35 MANUELL PRÜFEN** bleiben offene redaktionelle Release-Gates. Emma Goldman bleibt dabei die höchste Priorität, weil die vorhandenen Archiv-Landingpages mehrere konkrete Aussagen des Kritikabschnitts nicht punktgenau tragen. Dieser Nachbearbeitungsabschnitt ist ein Follow-up und ändert weder die kanonische Ausgangszählung 56/35/6 noch erteilt er Nutzungsrechte.
