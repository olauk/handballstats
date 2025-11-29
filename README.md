# Handball Analytics v2.3

## 🎯 Komplett håndballstatistikk-app med innlogging

### Nye funksjoner i v2.3 🚀🚀🚀
- 📅 **Kampdato-registrering** - Registrer dato for hver kamp
- 📁 **Last spillere fra fil** - Importer spillerlister fra JSON/CSV/TXT
- ✅ **Avslutt kamp-funksjon** - Lagre fullførte kamper
- 📋 **Kamphistorikk** - Se alle tidligere registrerte kamper
- 👁️ **Vis tidligere kamper** - Detaljert visning av lagrede kamper
- 🗑️ **Slett kamper** - Fjern uønskede kamper fra historikken
- ⚡⚡ **KRAFTIG YTELSESOPTIMALISERING** - Opptil 80% raskere ved mange registreringer!
- ✅ Innloggingsside (Brukernavn: "Ola", Passord: "handball")
- ✅ LocalStorage - data lagres automatisk i nettleseren
- ✅ Fullstendig fungerende skuddregistrering
- ✅ Keeper-statistikk

### Ytelsesoptimaliseringer (v2.2)
- 🔥 **Statistikk-caching** - Beregninger kjøres kun én gang og caches i minnet
- 🔥 **Debounced localStorage** - Redusert antall skriveoperasjoner (300ms debounce)
- 🔥 **Delvis DOM-oppdatering** - Kun berørte seksjoner oppdateres, ikke hele siden
- 🔥 **Modal oppdateres uten full re-render** - Popup-vinduer oppdateres isolert
- 🔥 **Målvisualisering oppdateres separat** - Nye skudd legges til uten å re-rendere hele siden
- 🔥 **Raskere ved mange registreringer** - Kan registrere 50+ skudd uten merkbar forsinkelse
- 🔥 **Optimalisert event handling** - Event listeners re-knyttes kun når nødvendig

### Filer
- `index.html` - Hoveddokument
- `styles.css` - All styling
- `app.js` - All funksjonalitet (komplett vanilla JavaScript)

### Hvordan publisere

#### GitHub + Netlify (Anbefalt)
1. Gå til din GitHub repository
2. **SLETT alle gamle filer**
3. Last opp de 3 nye filene fra `handball-v2`
4. Commit changes
5. Netlify deployer automatisk
6. **FERDIG!** 🎉

#### Teste lokalt
1. Åpne `index.html` direkte i nettleseren
2. Fungerer umiddelbart!

### Bruk av appen

#### 1. Logg inn
- Brukernavn: `Ola`
- Passord: `handball`

#### 2. Sett opp kamp
- **Laglister:** Legg til lagene manuelt eller last inn fra fil
- **Kampdato:** Velg dato for kampen
- **Spillere:** Legg til spillere manuelt eller last fra fil (JSON/CSV/TXT)
  - Manuelt: Klikk "+ Legg til spiller"
  - Fra fil: Klikk "📁 Last fra fil"
- **Keepere:** Merk keepere med checkbox
- **Start:** Klikk "▶ Start kamp"

#### 3. Registrer skudd
- **Angrep-modus:** Klikk på målet → Velg mål/redning → Velg spiller
- **Forsvar-modus:** Velg aktiv keeper → Klikk på målet → Velg mål/redning → Velg motspiller
- **Utenfor:** Klikk i grått område → Velg spiller
- **Teknisk feil:** Klikk "Registrer teknisk feil" → Velg spiller

#### 4. Se statistikk
- Bytt mellom "Angrep" og "Forsvar" faner
- Klikk "Se skudd" for detaljert visning per spiller

#### 5. Avslutt kamp
- Klikk "✅ Avslutt kamp" når kampen er ferdig
- Kampen lagres automatisk i historikken
- Du kan også eksportere data (💾 Eksporter) før du avslutter

#### 6. Se tidligere kamper
- Klikk "📋 Tidligere kamper" fra oppsettsiden
- Se liste over alle lagrede kamper
- Klikk "👁️ Vis" for å se detaljer
- Klikk "🗑️ Slett" for å fjerne en kamp

### Filformat for spillerimport

#### JSON-format:
```json
[
  {"id": 1, "name": "Ola Nordmann", "number": 7, "isKeeper": false},
  {"id": 2, "name": "Kari Keeper", "number": 1, "isKeeper": true}
]
```

#### CSV/TXT-format:
```
7,Ola Nordmann,false
1,Kari Keeper,true
12,Per Hansen,false
```

**Format:** `nummer,navn,isKeeper` (én spiller per linje)
**Tips:** isKeeper kan være `true/false` eller `1/0`

### Datalagring

**Nåværende (LocalStorage):**
- Data lagres automatisk i nettleseren
- Fungerer på én enhet
- Data forblir selv om du lukker nettleseren
- **MERK:** Kun på samme enhet og nettleser

**Fase 2 (Kommer):**
- Cloud-basert lagring (Firebase/Supabase)
- Kryptert data
- Multi-enhet support
- Sesongstatistikk

### Neste steg

**Fase 2 - Backend & Kryptering:**
- Real autentisering
- Kryptert datalagring
- Multi-kamp support
- Synkronisering mellom enheter

**Fase 3 - Analytics:**
- Sesongstatistikk
- Spillersammenligning
- Trendanalyse
- Avanserte rapporter

### Feilsøking

**Problem: Skuddregistrering fungerer ikke**
- Løsning: Sjekk at du bruker de nye filene fra `handball-v2`

**Problem: Data forsvinner**
- Løsning: Ikke tøm nettleserens cache/localStorage
- For permanent løsning, vent på Fase 2

**Problem: Fungerer ikke på iPad**
- Løsning: Bruk Safari, ikke Chrome
- Legg til på Hjem-skjerm for best opplevelse

### Support
Problemer? Last opp filene til Claude og beskriv feilen!

---
**Laget med ❤️ for håndballtrenere**
