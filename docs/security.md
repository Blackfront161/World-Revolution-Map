# Sicherheitsmodell

## Geschützte Werte

Der Atlas verwaltet öffentliche Geschichtsdaten und einen lokalen, nicht vertrauenswürdigen Spielstand. Er verarbeitet keine Passwörter, Zahlungen oder privaten Profile. XP, Erfolge und Missionen sind Komfortdaten und dürfen niemals als Berechtigung, Rang mit Geldwert oder serverseitiger Nachweis verwendet werden.

## Bereits umgesetzte Grenzen

- Keine Datenbanktexte werden als HTML interpretiert.
- Quellenlinks sind auf HTTPS beschränkt.
- Wikipedia-Bild-APIs sind auf de.wikipedia.org und en.wikipedia.org begrenzt; geladene Bilder müssen von upload.wikimedia.org stammen.
- Live-Daten und alle Textfelder besitzen clientseitige Obergrenzen.
- Lokale oder importierte Spielstände werden validiert, gekürzt und mit bekannten Ereignis-IDs abgeglichen.
- Die CSP sperrt fremde Skriptquellen, Plugins, Formulare und unbekannte Netzwerkziele.
- CDN-Dateien sind fest versioniert und über SHA-384 Subresource Integrity gebunden.
- Cross-Origin-Nachrichten werden nur an eine explizite HTTPS-Origin gesendet. Wildcards werden verworfen.
- Der anonyme Supabase-Zugriff ist im Referenzschema ausschließlich lesend.
- Alle neun Sprachfassungen der Oberfläche liegen lokal im Repository; Ereignistexte werden nicht an externe Übersetzungsdienste gesendet.

## Verantwortung beim Deployment

1. Das Schema aus docs/supabase-schema.sql in der produktiven Instanz anwenden und die aktiven Policies im Supabase-Dashboard kontrollieren.
2. Niemals einen Service-Role-Key oder andere geheime Schlüssel in Browsercode eintragen.
3. Redaktionelle Schreibzugriffe nur über authentifizierte Rollen oder ein separates Admin-Backend erlauben.
4. Bei CDN-Versionsupdates die drei SRI-Werte neu berechnen; alte Integritätswerte dürfen nicht einfach entfernt werden.
5. Bei eigener Domain die CSP zusätzlich als HTTP-Header ausliefern. frame-ancestors muss dort passend zur vorgesehenen Host-App gesetzt werden, da diese Direktive in einem Meta-Element nicht wirksam ist.
6. Für iframe-Einbettungen eine möglichst enge sandbox-Konfiguration verwenden und Nachrichten auf beiden Seiten anhand event.origin und event.data.source prüfen.
7. Regelmäßig Abhängigkeiten, Quellenlinks und Browserkonsole prüfen.

## Bewusste Restrisiken

- Externe Kartenkacheln und Wikimedia sehen technisch die IP-Adresse des Browsers.
- GitHub Pages erlaubt nur begrenzte Kontrolle über HTTP-Sicherheitsheader.
- Inhalte externer Quellen können sich nach der redaktionellen Prüfung verändern.
- Eine Person kann ihren lokalen Spielstand manipulieren. Das ist akzeptiert, solange der Spielstand keine Autorität außerhalb des Browsers erhält.
