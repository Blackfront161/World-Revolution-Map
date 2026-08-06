# Atlas in eine andere App integrieren

Der Atlas bleibt eine statische Webanwendung und kann deshalb als iframe, als eigener WebView-Screen oder als separat bereitgestelltes Mikro-Frontend eingebunden werden. Er benötigt keinen Build-Schritt und keine Schreibberechtigung auf der Datenbank.

## Schnellstart per iframe

    <iframe
      title="Atlas des Widerstands"
      src="https://blackfront161.github.io/World-Revolution-Map/?embed=1&welcome=0&parentOrigin=https%3A%2F%2Fapp.example.org"
      loading="lazy"
      sandbox="allow-scripts allow-same-origin allow-popups"
      referrerpolicy="strict-origin-when-cross-origin"
    ></iframe>

parentOrigin ist optional. Wird es gesetzt, muss es eine konkrete HTTPS-Origin sein. Der Platzhalter *, unsichere HTTP-Origins und javascript:-URLs werden verworfen. Für lokale Entwicklung sind http://localhost und http://127.0.0.1 erlaubt.

Unterstützte Parameter:

- embed=1 – kompaktere Abstände und keine automatische Einführung
- welcome=0 – Einführung nicht automatisch öffnen
- supabase=0 – ausschließlich die mitgelieferten JSON-Daten verwenden
- accent=%2365f3a6 – sechsstellige Akzentfarbe
- parentOrigin=https%3A%2F%2Fapp.example.org – exakt erlaubte Empfänger-Origin für postMessage

## JavaScript-API bei gleicher Origin

Nach dem Laden steht window.ResistanceAtlas zur Verfügung:

    window.addEventListener('resistance-atlas:ready', () => {
      window.ResistanceAtlas.setFilters({ category: 'Indigener Widerstand', from: 1900 });
      window.ResistanceAtlas.focusEvent('standing-rock');
    });

    const progress = window.ResistanceAtlas.exportProgress();
    window.ResistanceAtlas.importProgress(progress);

Methoden: getState, setFilters, focusEvent, randomEvent, openPanel, exportProgress, importProgress, resetProgress.

Ereignisse: resistance-atlas:ready, resistance-atlas:event-discovered, resistance-atlas:connection-created, resistance-atlas:filters-changed, resistance-atlas:progress-imported, resistance-atlas:progress-reset.

## Kommunikation über Origins hinweg

Im iframe lauscht die Host-App auf strikt geprüfte Nachrichten:

    window.addEventListener('message', event => {
      if (event.origin !== 'https://blackfront161.github.io') return;
      if (event.data?.source !== 'resistance-atlas') return;
      console.log(event.data.type, event.data.detail);
    });

Der Atlas sendet nur dann Nachrichten, wenn parentOrigin explizit gesetzt ist, und niemals mit targetOrigin=*.

## Fortschritt und Backend

Der Spielstand liegt standardmäßig im localStorage der Atlas-Origin. Für Konten, Synchronisierung oder native Apps kann die Host-App den validierten Spielstand exportieren und im eigenen Backend speichern. XP und Erfolge sind rein spielerisch und dürfen serverseitig nicht als vertrauenswürdige Berechtigungs- oder Belohnungsdaten behandelt werden.
