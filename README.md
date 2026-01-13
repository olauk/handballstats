# Handball Analytics v3.1

## 🎯 Komplett håndballstatistikk-app med Firebase-autentisering

### Nye funksjoner i v3.1 🔥
- 🐛 **Smart debug logging** - Automatisk deaktivert i produksjon for kostnad og personvern
- 📊 **Error tracking** - Kritiske feil logges alltid for feilsøking
- 🔧 **Debug mode toggle** - Aktiver detaljert logging ved behov

### Funksjoner fra v3.0 🔥🔥🔥
- 🔐 **Firebase-autentisering** - Ekte brukerregistrering og innlogging
- ☁️ **Firebase Hosting** - Profesjonell hosting med gratis SSL
- 👤 **Brukerprofiler** - Lagret i Firestore med navn, e-post og hjemmelag
- 📧 **Passordtilbakestilling** - E-post-basert passordgjenoppretting
- 🔒 **Sikker autentisering** - Firebase Auth med offline persistence

### Funksjoner fra v2.3 🚀🚀🚀
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

#### Firebase Hosting (Anbefalt) 🔥
Firebase Hosting er nå satt opp for dette prosjektet!

**Første gang:**
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only hosting
```

**Påfølgende deployments:**
```bash
firebase deploy --only hosting
```

Se `DEPLOY.md` for detaljert guide!

**Din URL:** https://handballstats-c80f3.web.app

#### Teste lokalt
```bash
firebase serve
```
Eller åpne `index.html` direkte i nettleseren.

### Bruk av appen

#### 1. Opprett bruker og logg inn
- **Første gang:** Klikk "Opprett ny bruker"
  - Fyll inn navn, e-post og passord (min 6 tegn)
  - Valgfritt: Legg til hjemmelag
  - Du blir automatisk logget inn
- **Senere:** Bruk e-post og passord for å logge inn
- **Glemt passord?** Klikk "Glemt passord?" for å få tilbakestillings-e-post

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

**Autentisering (Firebase Auth):**
- Sikker brukerautentisering med Firebase
- Brukerprofiler lagret i Firestore
- Offline persistence aktivert
- Passordtilbakestilling via e-post

**Kampdata (Nåværende - LocalStorage):**
- Data lagres automatisk i nettleseren
- Fungerer på én enhet
- Data forblir selv om du lukker nettleseren
- **MERK:** Kun på samme enhet og nettleser

**Fase 2 (Kommer snart):**
- Kampdata migreres til Firestore
- Tilgang til kamper fra flere enheter
- Deling av kamper med trenerteam
- Backup i skyen

### Debug Logging & Feilsøking

**Logging-system:**
- **Production mode** (standard): Kun kritiske feil logges for å spare kostnader og beskytte personvern
- **Development mode**: Full detaljert logging av alle events (automatisk på localhost)

**Aktivere debug mode i production:**

1. Via URL parameter:
   ```
   https://handballstats-c80f3.web.app/?debug=true
   ```

2. Via browser console:
   ```javascript
   // Aktiver debug logging
   localStorage.setItem('debugMode', 'true')

   // Deaktiver debug logging
   localStorage.removeItem('debugMode')
   ```

3. Via importerte funksjoner:
   ```javascript
   import { enableDebugMode, disableDebugMode, isDebugModeEnabled } from './js/debug-logger.js';

   enableDebugMode();   // Aktiverer debug logging
   disableDebugMode();  // Deaktiverer debug logging
   isDebugModeEnabled(); // Sjekker om debug mode er på
   ```

**Eksportere debug data:**
- Debug logs lagres i Firestore under `users/{userId}/debug_logs`
- Bruk konsoll-funksjon for å eksportere data til JSON-fil
- Kritiske feil logges alltid i `users/{userId}/errors` (selv i production)

**Beste praksis:**
- La debug mode være AV i normal produksjonsbruk
- Aktiver kun når du trenger å feilsøke et spesifikt problem
- Debug logs slettes automatisk etter 30 dager

### Neste steg

**✅ Fase 1 - Autentisering (FULLFØRT):**
- Firebase-autentisering
- Brukerregistrering og innlogging
- Passordtilbakestilling
- Brukerprofiler i Firestore

**⏳ Fase 2 - Cloud-lagring (Neste):**
- Migrer kampdata til Firestore
- Synkronisering mellom enheter
- Deling av kamper med trenerteam
- Automatisk backup

**🔮 Fase 3 - Analytics:**
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
