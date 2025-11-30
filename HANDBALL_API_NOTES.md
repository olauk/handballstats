# Handball.no API-analyse

## Oversikt
Denne dokumentasjonen beskriver hvordan handball.no henter og viser spillerdata for kamper.

## Datastruktur

### Server-Side Rendering
Handball.no bruker **server-side rendering** - all kampdata er inkludert direkte i HTML-koden når siden lastes. Dette betyr:
- Ingen synlige AJAX/fetch API-kall for spillerdata
- Data er rendret på serveren før siden sendes til nettleseren
- Muligens ASP.NET-basert backend (basert på ViewState og form-struktur)

## Identifikatorer

### Kamp-ID
- **Eksempel:** `8208565`
- **Bruk:** Identifiserer en spesifikk kamp

### Lag-ID
- **Byåsen 2:** `697703`
- **Charlottenlund 3:** `560014`
- **Bruk:** Identifiserer lag i systemet

### Kampnummer
- **Format:** `11131404002`
- **Bruk:** Administrativt kampnummer

### Turnering-ID
- **Eksempel:** `440583`
- **Bruk:** Identifiserer turneringen kampen tilhører

## URL-struktur

### Kampside
```
https://www.handball.no/system/kamper/?matchid=8208565
```

### Lagside
```
https://www.handball.no/system/kamper/lag/?lagid=697703
```

### Kamprapport
```
https://www.handball.no/system/kamper/kamprapport/?matchid=8208565
```

## Spillerdata-format

### HTML-struktur for spillere

Spillerdata vises i HTML-tabeller med følgende kolonner:

```html
<table class="full-width player-table">
    <colgroup>
        <col class="small-1" />  <!-- Nr -->
        <col class="small-5" />  <!-- Spiller -->
        <col class="small-1" />  <!-- M (Mål) -->
        <col class="small-1" />  <!-- 7M (7-meter) -->
        <col class="small-1" />  <!-- A (Advarsel) -->
        <col class="small-1" />  <!-- 2 (2 minutter) -->
        <col class="small-1" />  <!-- D (Diskvalifikasjon) -->
        <col class="small-1" />  <!-- R (Disk m/rapport) -->
    </colgroup>
    <tr>
        <td>24</td>
        <td style="text-align:left">Noh Afom Kifle</td>
        <td>9</td>
        <td>1</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
    </tr>
</table>
```

### Datafelter per spiller
- **Nr:** Spillernummer (1-99)
- **Spiller:** Fullt navn
- **M:** Spillemål (totalt)
- **7M:** 7-meter mål
- **A:** Advarsler (gult kort)
- **2:** 2-minutters utvisninger
- **D:** Diskvalifikasjoner (rødt kort)
- **R:** Diskvalifikasjon med rapport

## Hendelser (Events)

### Hendelsestabellen

Kamphendelser vises i en tabell med:

```html
<tr>
    <td>1 / 01:12</td>  <!-- Omgang / Tid -->
    <td class="hometeam-event"><b>Mål!</b></td>  <!-- Type -->
    <td>Bjørnar Hetling Værnes</td>  <!-- Spiller -->
    <td nowrap="nowrap"><b>1</b> - 0</td>  <!-- Stilling -->
</tr>
```

### Hendelsestyper
- Mål
- Redning
- 2 minutter
- Timeout
- Diskvalifikasjon

## Mulig web scraping-tilnærming

### 1. Hent kampdata
```javascript
// Pseudo-kode
const matchId = 8208565;
const url = `https://www.handball.no/system/kamper/?matchid=${matchId}`;

const response = await fetch(url);
const html = await response.text();

// Parse HTML med en HTML-parser (f.eks. cheerio, jsdom, eller DOMParser)
const parser = new DOMParser();
const doc = parser.parseFromString(html, 'text/html');
```

### 2. Ekstraher spillerdata
```javascript
// Finn spillertabellen
const playerRows = doc.querySelectorAll('.player-table tbody tr');

const players = Array.from(playerRows).map(row => {
    const cells = row.querySelectorAll('td');
    return {
        number: parseInt(cells[0].textContent),
        name: cells[1].textContent.trim(),
        goals: parseInt(cells[2].textContent) || 0,
        penaltyGoals: parseInt(cells[3].textContent) || 0,
        warnings: parseInt(cells[4].textContent) || 0,
        suspensions: parseInt(cells[5].textContent) || 0,
        disqualifications: parseInt(cells[6].textContent) || 0,
        reports: parseInt(cells[7].textContent) || 0
    };
});
```

### 3. Ekstraher kampinfo
```javascript
// Finn kampinformasjon
const matchInfo = {
    homeTeam: doc.querySelector('a[href*="lagid=697703"]').textContent.trim(),
    awayTeam: doc.querySelector('a[href*="lagid=560014"]').textContent.trim(),
    date: doc.querySelector('td:contains("Dato / Tid:")').nextElementSibling.textContent,
    venue: doc.querySelector('a[href*="anlegg"]').textContent.trim()
};
```

## Viktige merknader

### CORS-problemer
- Handball.no har sannsynligvis CORS-restriksjoner
- Direkte fetching fra nettleser vil trolig feile
- Løsninger:
  - Bruk en backend-proxy
  - Bruk CORS-proxy for testing
  - Kontakt NHF for offisiell API-tilgang

### Rate limiting
- Vær forsiktig med for mange forespørsler
- Implementer caching
- Respekter robots.txt

### Juridiske aspekter
- Web scraping kan være i gråsone juridisk
- Best praksis: Kontakt NHF og spør om offisielt API
- Alternativt: Bruk kun egne testdata

## Anbefaling for din app

### Kort sikt
1. Bruk manuell innlegging av spillere (som du allerede har)
2. Tillat import fra fil (JSON/CSV) - allerede implementert ✅
3. Lagre data lokalt (LocalStorage) - allerede implementert ✅

### Lang sikt
1. **Kontakt NHF** og spør om de har et offisielt API
2. Hvis API finnes:
   - Implementer integrasjon med offisiell API
   - Bruk deres autentiseringssystem
   - Respekter rate limits
3. Hvis ikke:
   - Bygg egen backend som kan scrape data
   - Cache data for å redusere forespørsler
   - Vurder å samarbeide med NHF

## Nyttige lenker

- Handball.no: https://www.handball.no
- Kampsøk: https://www.handball.no/system/kamper/
- Klubbsøk: https://www.handball.no/system/finnklubb/

## Eksempel: Komplett datafetching

```javascript
async function fetchMatchData(matchId) {
    try {
        // Dette vil trolig feile pga CORS - trenger backend proxy
        const response = await fetch(
            `https://www.handball.no/system/kamper/?matchid=${matchId}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Ekstraher data
        const matchData = {
            matchId: matchId,
            homeTeam: extractHomeTeam(doc),
            awayTeam: extractAwayTeam(doc),
            players: extractPlayers(doc, 'home'),
            opponents: extractPlayers(doc, 'away'),
            events: extractEvents(doc)
        };

        return matchData;
    } catch (error) {
        console.error('Feil ved henting av kampdata:', error);
        throw error;
    }
}

function extractPlayers(doc, team) {
    // Finn riktig tabell (første for hjemmelag, andre for bortelag)
    const tables = doc.querySelectorAll('.player-table tbody');
    const table = team === 'home' ? tables[0] : tables[1];

    if (!table) return [];

    const rows = Array.from(table.querySelectorAll('tr'));
    return rows
        .filter(row => row.querySelectorAll('td').length >= 8)
        .map(row => {
            const cells = row.querySelectorAll('td');
            return {
                id: Date.now() + Math.random(),
                number: parseInt(cells[0].textContent.trim()),
                name: cells[1].textContent.trim(),
                goals: parseInt(cells[2].textContent.trim()) || 0,
                penaltyGoals: parseInt(cells[3].textContent.trim()) || 0,
                isKeeper: cells[1].textContent.includes('🧤')
            };
        });
}

function extractEvents(doc) {
    const eventRows = doc.querySelectorAll('.events-table tbody tr');
    return Array.from(eventRows).map(row => {
        const cells = row.querySelectorAll('td');
        const [half, time] = cells[0].textContent.split('/').map(s => s.trim());

        return {
            half: parseInt(half),
            time: time,
            type: cells[1].textContent.trim(),
            player: cells[2]?.textContent.trim() || '',
            score: cells[3]?.textContent.trim() || ''
        };
    });
}
```

## Konklusjon

Handball.no bruker server-side rendering og har ikke et åpent API. For å hente data programmatisk vil du måtte:

1. Web scrape HTML-sidene (krever backend-proxy)
2. Parse HTML-strukturen
3. Ekstraher relevant data

**Anbefaling:** Kontakt NHF først for å høre om de har planer for et offisielt API, eller om de kan gi tilgang til eksisterende API-er.
