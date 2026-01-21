# IMPLEMENTATION PLAN - FASE 2 OG FASE 3

**Dokument:** PHASE_IMPLEMENTATION_PLAN.md
**Versjon:** 1.0
**Dato:** 2026-01-21
**Laget av:** Claude Code Agent
**Formål:** Detaljert plan for implementering av Fase 2 (fullføring) og Fase 3 (Advanced Analytics)

---

## INNHOLDSFORTEGNELSE

1. [Status Fase 2](#status-fase-2)
2. [Plan: Fullføre Fase 2 - Brukerpreferanser](#plan-fullføre-fase-2---brukerpreferanser)
3. [Plan: Fase 3 - Advanced Analytics](#plan-fase-3---advanced-analytics)
4. [Estimert tidslinje](#estimert-tidslinje)
5. [Avhengigheter og risiko](#avhengigheter-og-risiko)

---

## STATUS FASE 2

### Hva er fullført:

✅ **Team Rosters Cloud Sync** (Implementert 2026-01-21)
- Firestore collection: `/users/{userId}/teamRosters/{rosterId}`
- CRUD-operasjoner: save, load, delete
- Automatisk synkronisering ved innlogging
- Migrering av eksisterende data
- Security rules implementert
- **Resultat:** Spillerstall synkroniseres nå sømløst på tvers av enheter

### Hva gjenstår:

❌ **User Preferences Cloud Sync**
- `matchMode` (simple/advanced)
- `shotRegistrationMode` (simple/detailed)
- `timerConfig.halfLength` (20/25/30 min)

**Problem:**
- Brukere må sette opp preferanser på nytt på hver enhet
- Inkonsistent brukeropplevelse på tvers av enheter
- Tap av innstillinger ved enhetsskifte

**Progresjon:** Fase 2 er 50% fullført

---

## PLAN: FULLFØRE FASE 2 - BRUKERPREFERANSER

### Oversikt

**Mål:** Synkronisere brukerpreferanser til Firestore for sømløs opplevelse på tvers av enheter.

**Database struktur:**
```
/users/{userId}/settings (Document)
{
  preferences: {
    matchMode: 'simple' | 'advanced',
    shotRegistrationMode: 'simple' | 'detailed',
    timerConfig: {
      halfLength: 20 | 25 | 30
    }
  },
  updatedAt: timestamp,
  ownerId: string
}
```

---

### TASK 1: Utvide firestore-storage.js

**Zone:** 🔴 RED ZONE
**Filnavn:** `js/firestore-storage.js`
**Estimat:** 2-3 timer

**Oppgaver:**

1. **Implementer `saveUserPreferencesToFirestore()`**
   ```javascript
   export async function saveUserPreferencesToFirestore() {
     if (!auth.currentUser) return false;

     const userId = auth.currentUser.uid;
     const preferences = {
       matchMode: APP.matchMode,
       shotRegistrationMode: APP.shotRegistrationMode,
       timerConfig: {
         halfLength: APP.timerConfig.halfLength
       }
     };

     await db.collection('users').doc(userId).set({
       preferences,
       updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
       ownerId: userId
     }, { merge: true });

     return true;
   }
   ```

2. **Implementer `loadUserPreferencesFromFirestore()`**
   ```javascript
   export async function loadUserPreferencesFromFirestore() {
     if (!auth.currentUser) return null;

     const userId = auth.currentUser.uid;
     const doc = await db.collection('users').doc(userId).get();

     if (!doc.exists || !doc.data().preferences) {
       return null;
     }

     return doc.data().preferences;
   }
   ```

3. **Oppdater `syncFromFirestore()` for å laste preferanser**
   - Kall `loadUserPreferencesFromFirestore()`
   - Merge med lokale preferanser (Firestore er source of truth)
   - Oppdater APP state

4. **Oppdater `migrateLocalStorageToFirestore()` for å migrere preferanser**
   - Lagre nåværende preferanser til Firestore ved første innlogging

**Testing:**
- Oppdater eksisterende tester i `tests/unit/storage.test.js`
- Minst 5 nye tester for preferences-funksjoner
- Integration test for full sync-flow

**Filer som må endres:**
- ✏️ `js/firestore-storage.js` (RED ZONE - krever tester)

---

### TASK 2: Integrere automatisk lagring

**Zone:** 🟡 YELLOW ZONE
**Filnavn:** `js/events.js`, `js/timer.js`
**Estimat:** 1-2 timer

**Oppgaver:**

1. **Identifiser alle steder hvor preferanser endres:**
   - `events.js`: Mode-switching (simple/advanced, detailed/simple shot registration)
   - `timer.js`: Timer config changes (halfLength)
   - Andre steder?

2. **Legg til Firestore-synkronisering ved hver endring:**
   ```javascript
   // Eksempel fra events.js
   case 'toggleMatchMode':
     APP.matchMode = APP.matchMode === 'simple' ? 'advanced' : 'simple';
     saveToLocalStorage();

     // Legg til:
     saveUserPreferencesToFirestore().catch(error => {
       console.error('Failed to sync preferences:', error);
     });

     render();
     break;
   ```

3. **Debounce-strategi:**
   - Preferanser endres sjelden, så ingen debounce nødvendig
   - Immediate save til Firestore (non-blocking)

**Testing:**
- Manual testing: Endre preferanser på enhet A, logg inn på enhet B
- Verifiser at preferanser synkroniseres korrekt

**Filer som må endres:**
- ✏️ `js/events.js` (YELLOW ZONE - krever bekreftelse fra bruker)
- ✏️ `js/timer.js` (YELLOW ZONE - krever bekreftelse fra bruker)

---

### TASK 3: Oppdatere Security Rules

**Zone:** 🟢 GREEN ZONE
**Filnavn:** `firestore.rules`
**Estimat:** 15 min

**Oppgaver:**

1. **Oppdater bruker-document rules**
   - Eksisterende rules tillater allerede `allow read, write: if isOwner(userId)`
   - `settings`-feltet ligger i `/users/{userId}`, så ingen nye rules nødvendig
   - Men legg til kommentar for klarhet

**Testing:**
- Verifiser at brukere kun kan lese/skrive egne preferanser
- Verifiser at uautentiserte brukere ikke har tilgang

**Filer som må endres:**
- ✏️ `firestore.rules` (GREEN ZONE - kan endres fritt)

---

### TASK 4: Oppdatere dokumentasjon

**Zone:** 🟢 GREEN ZONE
**Estimat:** 30 min

**Oppgaver:**

1. **Oppdater ARCHITECTURE.md**
   - Marker Fase 2 som 100% fullført
   - Oppdater "Hva lagres" seksjon
   - Oppdater "Kjente begrensninger"

2. **Oppdater README.md**
   - Oppdater feature-liste
   - Nevn full cross-device sync

3. **Oppdater STORAGE-ANALYSIS-REPORT.md (hvis eksisterer)**
   - Marker brukerpreferanser som synkronisert

**Filer som må endres:**
- ✏️ `ARCHITECTURE.md` (GREEN ZONE)
- ✏️ `README.md` (GREEN ZONE)
- ✏️ `STORAGE-ANALYSIS-REPORT.md` (GREEN ZONE)

---

### TASK 5: Testing og validering

**Zone:** N/A
**Estimat:** 1-2 timer

**Oppgaver:**

1. **Unit tests:**
   - Test `saveUserPreferencesToFirestore()`
   - Test `loadUserPreferencesFromFirestore()`
   - Test merge-logikk i `syncFromFirestore()`

2. **Integration tests:**
   - Test full sync-flow ved innlogging
   - Test migrering av preferanser
   - Test cross-device sync

3. **Manual testing:**
   - Scenario 1: Endre preferanser på enhet A → logg inn på enhet B → verifiser
   - Scenario 2: Ny bruker → sett preferanser → logg inn på annen enhet
   - Scenario 3: Offline → endre preferanser → online → verifiser sync

4. **Pre-commit sjekkliste (DEVELOPMENT_RULES.md):**
   - [ ] Kjør `npm run lint` - ingen errors
   - [ ] Kjør `npm run test:run` - alle tester passerer
   - [ ] Sjekk for `console.log` i endrede filer
   - [ ] Verifiser commit message format
   - [ ] Verifiser at ingen data-attributes er endret

---

### Fase 2 Fullføring - Sjekkliste

**FØR START:**
- [ ] Les DEVELOPMENT_RULES.md (seksjon 2 og 3)
- [ ] Les ARCHITECTURE.md (seksjon 14 og 17)
- [ ] Forstå eksisterende Firestore-struktur

**UNDER IMPLEMENTERING:**
- [ ] Task 1: Utvide firestore-storage.js (RED ZONE)
- [ ] Task 2: Integrere automatisk lagring (YELLOW ZONE - spør bruker)
- [ ] Task 3: Oppdatere Security Rules (GREEN ZONE)
- [ ] Task 4: Oppdatere dokumentasjon (GREEN ZONE)
- [ ] Task 5: Testing og validering

**ETTER FULLFØRING:**
- [ ] Alle tester passerer (`npm run test:run`)
- [ ] Linter kjører uten errors (`npm run lint`)
- [ ] Manual testing fullført
- [ ] Dokumentasjon oppdatert
- [ ] Commit og push til feature branch
- [ ] Opprett PR med detaljert beskrivelse
- [ ] Marker Fase 2 som 100% fullført i ARCHITECTURE.md

**Estimert total tid:** 5-8 timer

---

## PLAN: FASE 3 - ADVANCED ANALYTICS

### Oversikt

**Mål:** Implementere avanserte statistikk- og analysefunksjoner for å gi trenere og analytikere dypere innsikt i lagets og spillernes prestasjoner.

**Status:** Ikke startet
**Avhengigheter:** Fase 2 fullført (anbefalt, men ikke påkrevd)

---

### Feature-kategorier

#### Kategori A: Sesongstatistikk (Prioritet: HØY)
#### Kategori B: Spillersammenligning (Prioritet: MEDIUM)
#### Kategori C: Trendanalyse (Prioritet: MEDIUM)
#### Kategori D: Varmekart / Heatmaps (Prioritet: HØY)
#### Kategori E: Shot Efficiency (Prioritet: HØY)
#### Kategori F: Defensive Patterns (Prioritet: LAV)

---

### KATEGORI A: SESONGSTATISTIKK

**Mål:** Aggregere statistikk på tvers av flere kamper for å se sesongutvikling.

**Features:**

1. **Sesong-dashboard**
   - Totale mål, redninger, utenfor
   - Snitt per kamp
   - Beste/dårligste kamp
   - Spillefordeling (minutter/kamper)

2. **Lagstatistikk over tid**
   - Mål scoret per kamp (linjediagram)
   - Skuddeffektivitet per kamp
   - Trendlinjer (forbedring/forverring)

3. **Spillerstatistikk over sesong**
   - Top scorers (totalt + per kamp)
   - Mest aktive spillere (antall skudd)
   - Keeper-statistikk (redningsprosent)

**Database-endringer:**
```
/users/{userId}/seasons/{seasonId}
{
  id: string,
  name: string,
  startDate: timestamp,
  endDate: timestamp | null,
  matches: [matchId1, matchId2, ...],
  createdAt: timestamp
}
```

**Implementering:**

**TASK A1: Database-struktur**
- Zone: 🔴 RED ZONE (firestore-storage.js)
- Estimat: 2-3 timer
- Oppgaver:
  1. Legg til `seasons` collection i Firestore
  2. Implementer CRUD for seasons:
     - `createSeasonInFirestore(seasonName)`
     - `loadSeasonsFromFirestore()`
     - `addMatchToSeason(seasonId, matchId)`
     - `deleteSeasonFromFirestore(seasonId)`
  3. Oppdater `APP` state med `seasons[]` array
  4. Security rules for seasons collection

**TASK A2: UI for sesongadministrasjon**
- Zone: 🟢 GREEN ZONE (nye UI-filer)
- Estimat: 3-4 timer
- Oppgaver:
  1. Opprett `ui/seasons.js` for sesongvisning
  2. Legg til "Sesonger" side i navigasjon
  3. UI for å opprette/slette sesonger
  4. UI for å legge kamper til sesonger (fra history)
  5. Liste over aktive sesonger

**TASK A3: Sesongstatistikk-beregninger**
- Zone: 🔴 RED ZONE (ny fil: `js/season-statistics.js`)
- Estimat: 4-5 timer
- Oppgaver:
  1. Implementer `calculateSeasonStats(seasonId)`
  2. Aggreger data fra alle kamper i sesongen
  3. Beregn nøkkeltall:
     - Total goals, saves, outside
     - Average per match
     - Top scorer(s)
     - Best/worst match
  4. Cache season stats (performance)
  5. Unit tests (minimum 15 tester)

**TASK A4: Sesongstatistikk-visning**
- Zone: 🟢 GREEN ZONE (ui/seasons.js)
- Estimat: 3-4 timer
- Oppgaver:
  1. Dashboard med nøkkeltall
  2. Linjediagram (mål per kamp)
  3. Top 5 scorers tabell
  4. Beste/dårligste kamp highlight
  5. Export til CSV/PDF (optional)

**Estimat Kategori A:** 12-16 timer

---

### KATEGORI B: SPILLERSAMMENLIGNING

**Mål:** Sammenligne spillere direkte for å identifisere styrker og svakheter.

**Features:**

1. **Side-by-side sammenligning**
   - Velg 2-4 spillere
   - Vis statistikk side-ved-side
   - Highlight forskjeller

2. **Radar chart / Spider chart**
   - Visualiser spillerprofil (mål, skudd, effektivitet, posisjon)
   - Sammenlign flere spillere i samme diagram

3. **Spillerranking**
   - Rank spillere basert på ulike kriterier
   - Filter: sesong, posisjon, alder

**Implementering:**

**TASK B1: Sammenligningslogikk**
- Zone: 🔴 RED ZONE (ny fil: `js/player-comparison.js`)
- Estimat: 2-3 timer
- Oppgaver:
  1. Implementer `comparePlayersStats(playerIds, seasonId?)`
  2. Normalisere data (per kamp, prosent, etc.)
  3. Identifiser utmerker ("Best at...")
  4. Unit tests (minimum 10 tester)

**TASK B2: UI for spillersammenligning**
- Zone: 🟢 GREEN ZONE (ny fil: `ui/player-comparison.js`)
- Estimat: 4-5 timer
- Oppgaver:
  1. Ny side: "Sammenlign spillere"
  2. Multi-select dropdown for spillervalg
  3. Tabell med sammenligning
  4. Radar chart (krever chart library - Chart.js?)
  5. Export til bilde/PDF

**TASK B3: Integrasjon med Chart.js**
- Zone: 🟡 YELLOW ZONE (ny dependency)
- Estimat: 2-3 timer
- Oppgaver:
  1. Installer Chart.js via npm
  2. Implementer wrapper for radar charts
  3. Styling og responsivitet
  4. Test på mobile enheter

**Estimat Kategori B:** 8-11 timer

---

### KATEGORI C: TRENDANALYSE

**Mål:** Identifisere mønstre og trender i lagets/spillernes prestasjon over tid.

**Features:**

1. **Trendlinjer**
   - Skuddeffektivitet over siste 5/10/20 kamper
   - Mål per kamp (stigende/fallende trend)
   - Form-kurve for individuelle spillere

2. **Streak-tracking**
   - Gjeldende streak (vinn/tap)
   - Longest winning/losing streak
   - Player hot streaks (mål i X kamper på rad)

3. **Prediktiv analyse (avansert)**
   - Forutsi forventet prestasjon i neste kamp
   - Basert på historiske data og trender

**Implementering:**

**TASK C1: Trendberegninger**
- Zone: 🔴 RED ZONE (ny fil: `js/trend-analysis.js`)
- Estimat: 3-4 timer
- Oppgaver:
  1. Implementer `calculateTrend(metric, matches, window)`
  2. Linear regression for trendlinjer
  3. Streak detection
  4. Moving average calculations
  5. Unit tests (minimum 12 tester)

**TASK C2: Trend-visualisering**
- Zone: 🟢 GREEN ZONE (utvid `ui/seasons.js`)
- Estimat: 3-4 timer
- Oppgaver:
  1. Linjediagram med trendlinje
  2. Streak-badges ("🔥 5 kamper med mål!")
  3. Form-indicator (🟢/🟡/🔴)
  4. Responsive design

**Estimat Kategori C:** 6-8 timer

---

### KATEGORI D: VARMEKART / HEATMAPS

**Mål:** Visualisere skuddplassering på baneplan for å identifisere mønstre.

**Features:**

1. **Skudd-heatmap**
   - Vis tetthet av skudd på ulike baneområder
   - Filter: spiller, resultat (mål/redning/utenfor), periode

2. **Effektivitets-heatmap**
   - Fargekode: Grønn = høy scoring%, Rød = lav scoring%
   - Identifiser "hot zones" og "cold zones"

3. **Keeper-heatmap**
   - Vis hvor keeperen redder mest/minst
   - Identifiser svakheter i keeper-posisjonering

**Implementering:**

**TASK D1: Heatmap-beregninger**
- Zone: 🔴 RED ZONE (ny fil: `js/heatmap.js`)
- Estimat: 4-5 timer
- Oppgaver:
  1. Grid-basert tilnærming (dele bane i 10x10 grid)
  2. Aggreger skudd per grid-celle
  3. Beregn effektivitet per grid-celle
  4. Normalize data for visualisering
  5. Unit tests (minimum 10 tester)

**TASK D2: Heatmap-visualisering**
- Zone: 🟢 GREEN ZONE (ny fil: `ui/heatmap.js`)
- Estimat: 5-6 timer
- Oppgaver:
  1. Canvas-based heatmap rendering
  2. Gradient color mapping (blue → yellow → red)
  3. Overlay på baneplan-bakgrunn
  4. Interaktiv: hover for detaljer
  5. Filter-controls (spiller, periode, resultat)
  6. Responsive design for mobile

**TASK D3: Integrasjon med eksisterende UI**
- Zone: 🟡 YELLOW ZONE (`ui/match.js`, `ui/history.js`)
- Estimat: 2-3 timer
- Oppgaver:
  1. Legg til "Vis heatmap" knapp i match view
  2. Legg til "Heatmap" fane i history view
  3. Modal for fullscreen heatmap
  4. Export heatmap som bilde

**Estimat Kategori D:** 11-14 timer

---

### KATEGORI E: SHOT EFFICIENCY

**Mål:** Dybdeanalyse av skuddeffektivitet basert på posisjon, type, spiller.

**Features:**

1. **Effektivitet per skuddposisjon**
   - 9m: X% scoring
   - 6m: Y% scoring
   - 7m: Z% scoring
   - Kontring: W% scoring

2. **Effektivitet per angreptype**
   - Etablert angrep vs. Kontring
   - Sammenlign effektivitet

3. **Best/worst shot positions**
   - Identifiser hvor laget scorer mest/minst
   - Heatmap-integrering

4. **Individual shot profiles**
   - Per spiller: "Best from 9m, weak from 6m"
   - Recommendations: "Focus on X"

**Implementering:**

**TASK E1: Shot efficiency beregninger**
- Zone: 🔴 RED ZONE (utvid `js/statistics.js`)
- Estimat: 3-4 timer
- Oppgaver:
  1. Implementer `calculateShotEfficiency(filters)`
  2. Group by: position, attackType, player
  3. Calculate success rate (%)
  4. Confidence intervals (for små sample sizes)
  5. Unit tests (minimum 15 tester)

**TASK E2: Shot efficiency visning**
- Zone: 🟢 GREEN ZONE (ny seksjon i `ui/match.js`)
- Estimat: 3-4 timer
- Oppgaver:
  1. Bar chart: Effektivitet per posisjon
  2. Tabell: Breakdown per spiller
  3. Highlight beste/dårligste områder
  4. Integration med heatmap (klikk for detaljer)

**Estimat Kategori E:** 6-8 timer

---

### KATEGORI F: DEFENSIVE PATTERNS

**Mål:** Analysere motstanderens skudd og lagets forsvar.

**Features:**

1. **Motstanderens skuddmønster**
   - Hvor scorer motstanderen mest?
   - Heatmap for motstander-skudd
   - Identifiser defensive svakheter

2. **Keeper-analyse**
   - Redningsprosent per zone
   - Redningsprosent per skuddtype
   - Sammenligning: keeper A vs B

3. **Defensive streaks**
   - Longest period without conceding
   - Best defensive half
   - Penalty save rate

**Implementering:**

**TASK F1: Defensive statistics**
- Zone: 🔴 RED ZONE (utvid `js/statistics.js`)
- Estimat: 3-4 timer
- Oppgaver:
  1. Filter events: mode === 'defense'
  2. Calculate opponent shooting patterns
  3. Calculate keeper save rates
  4. Defensive streaks detection
  5. Unit tests (minimum 10 tester)

**TASK F2: Defensive analytics UI**
- Zone: 🟢 GREEN ZONE (ny fil: `ui/defense-analytics.js`)
- Estimat: 4-5 timer
- Oppgaver:
  1. Opponent heatmap (hvor de scorer)
  2. Keeper stats dashboard
  3. Defensive highlights ("🛡️ 10 min uten baklengsmål")
  4. Recommendations ("Fokus på å forsvare 9m-soner")

**Estimat Kategori F:** 7-9 timer

---

### Fase 3 - Prioritering og Roadmap

**Anbefalt implementeringsrekkefølge:**

1. **Sprint 1 (Uke 1-2): Foundation**
   - Kategori A: Sesongstatistikk (12-16t)
   - Kategori E: Shot Efficiency (6-8t)
   - **Total:** 18-24 timer

2. **Sprint 2 (Uke 3-4): Visualisering**
   - Kategori D: Varmekart/Heatmaps (11-14t)
   - Kategori B: Spillersammenligning (8-11t)
   - **Total:** 19-25 timer

3. **Sprint 3 (Uke 5-6): Analytics**
   - Kategori C: Trendanalyse (6-8t)
   - Kategori F: Defensive Patterns (7-9t)
   - **Total:** 13-17 timer

**Total estimat for Fase 3:** 50-66 timer (ca. 6-8 uker)

---

### Fase 3 - Tekniske avgjørelser

**1. Chart Library:**
- **Anbefaling:** Chart.js v4
- **Alternativ:** D3.js (mer fleksibel, men steiler læringskurve)
- **Begrunnelse:** Chart.js er enklere, har god dokumentasjon, og dekker behovene

**2. Heatmap Implementation:**
- **Anbefaling:** Canvas-based custom implementation
- **Alternativ:** H337 Heatmap.js library
- **Begrunnelse:** Full kontroll, ingen ekstra dependency

**3. Data aggregation:**
- **Anbefaling:** Client-side aggregation (all data lastes, beregnes i browser)
- **Alternativ:** Server-side aggregation (Firestore functions)
- **Begrunnelse:** Enklere implementering, ingen server-side kode nødvendig (enda)

**4. Caching strategy:**
- **Anbefaling:** Utvid eksisterende `PERFORMANCE.statsCache`
- Legg til cache for season stats, heatmaps
- Invalidate ved nye kamper/events

**5. Export functionality:**
- **Anbefaling:** HTML5 Canvas → PNG (for heatmaps)
- CSV export for tabeller (simple, universell)
- PDF export (optional, krever jsPDF library)

---

### Fase 3 - Zone-klassifisering (DEVELOPMENT_RULES.md)

**RED ZONE (Krever tester FØRST):**
- `js/season-statistics.js` (ny fil)
- `js/player-comparison.js` (ny fil)
- `js/trend-analysis.js` (ny fil)
- `js/heatmap.js` (ny fil)
- Utvidelse av `js/statistics.js`
- Utvidelse av `js/firestore-storage.js`

**YELLOW ZONE (Krever brukerbekreftelse):**
- Integrasjon i `js/events.js` (hvis nødvendig)
- Nye dependencies (Chart.js, jsPDF)
- Endringer i `js/state.js` (hvis ny state må legges til)

**GREEN ZONE (Trygt å endre):**
- Alle nye UI-filer (`ui/seasons.js`, `ui/heatmap.js`, etc.)
- CSS-endringer for nye features
- README og dokumentasjon

---

### Fase 3 - Testing-strategi

**Unit Tests (minimum):**
- Season statistics: 15 tester
- Player comparison: 10 tester
- Trend analysis: 12 tester
- Heatmap calculations: 10 tester
- Shot efficiency: 15 tester
- Defensive patterns: 10 tester
- **Total:** Minimum 72 nye tester

**Integration Tests:**
- Full season workflow (opprett → legg til kamper → vis stats)
- Heatmap rendering med real data
- Cross-device sync for seasons

**Manual Testing:**
- Test alle nye UI-komponenter på mobile/desktop
- Performance testing med store datasett (100+ kamper)
- Edge cases (sesonger uten kamper, spillere uten skudd)

---

### Fase 3 - Fullførings-sjekkliste

**FØR START:**
- [ ] Fullfør Fase 2 (anbefalt, ikke påkrevd)
- [ ] Les DEVELOPMENT_RULES.md
- [ ] Opprett feature branch: `claude/phase-3-analytics`
- [ ] Installer nødvendige dependencies (Chart.js)

**Sprint 1 (Sesongstatistikk + Shot Efficiency):**
- [ ] Task A1: Database-struktur for sesonger
- [ ] Task A2: UI for sesongadministrasjon
- [ ] Task A3: Sesongstatistikk-beregninger
- [ ] Task A4: Sesongstatistikk-visning
- [ ] Task E1: Shot efficiency beregninger
- [ ] Task E2: Shot efficiency visning
- [ ] Testing: Minimum 30 nye tester
- [ ] Commit og push Sprint 1

**Sprint 2 (Heatmaps + Spillersammenligning):**
- [ ] Task D1: Heatmap-beregninger
- [ ] Task D2: Heatmap-visualisering
- [ ] Task D3: Integrasjon med eksisterende UI
- [ ] Task B1: Sammenligningslogikk
- [ ] Task B2: UI for spillersammenligning
- [ ] Task B3: Integrasjon med Chart.js
- [ ] Testing: Minimum 20 nye tester
- [ ] Commit og push Sprint 2

**Sprint 3 (Trendanalyse + Defensive Patterns):**
- [ ] Task C1: Trendberegninger
- [ ] Task C2: Trend-visualisering
- [ ] Task F1: Defensive statistics
- [ ] Task F2: Defensive analytics UI
- [ ] Testing: Minimum 22 nye tester
- [ ] Commit og push Sprint 3

**ETTER FULLFØRING:**
- [ ] Alle tester passerer (72+ nye tester)
- [ ] Linter kjører uten errors
- [ ] Manual testing fullført
- [ ] Performance testing (100+ kamper)
- [ ] Dokumentasjon oppdatert (ARCHITECTURE.md, README.md)
- [ ] Opprett PR med detaljert beskrivelse
- [ ] Marker Fase 3 som fullført

---

## ESTIMERT TIDSLINJE

### Fase 2 - Fullføring (Brukerpreferanser)

**Estimat:** 5-8 timer (ca. 1 arbeidsdag)

| Task | Estimat | Zone |
|------|---------|------|
| Task 1: Utvide firestore-storage.js | 2-3t | RED |
| Task 2: Integrere automatisk lagring | 1-2t | YELLOW |
| Task 3: Oppdatere Security Rules | 15m | GREEN |
| Task 4: Oppdatere dokumentasjon | 30m | GREEN |
| Task 5: Testing og validering | 1-2t | N/A |

**Milepæl:** Fase 2 100% fullført

---

### Fase 3 - Advanced Analytics

**Estimat:** 50-66 timer (ca. 6-8 uker med 1-2 timer/dag)

| Sprint | Features | Estimat | Uke |
|--------|----------|---------|-----|
| Sprint 1 | Sesongstatistikk + Shot Efficiency | 18-24t | 1-2 |
| Sprint 2 | Heatmaps + Spillersammenligning | 19-25t | 3-4 |
| Sprint 3 | Trendanalyse + Defensive Patterns | 13-17t | 5-6 |

**Milepæl:** Fase 3 fullført, klar for Fase 4

---

## AVHENGIGHETER OG RISIKO

### Avhengigheter

**Fase 2:**
- ✅ Fase 1 fullført (Active match + Match history sync) - **FULLFØRT**
- ✅ Firebase Authentication fungerer - **FULLFØRT**
- ✅ Firestore security rules på plass - **FULLFØRT**

**Fase 3:**
- 🟡 Fase 2 fullført (anbefalt, men ikke påkrevd)
- ✅ Eksisterende statistikk-moduler (`statistics.js`) - **FULLFØRT**
- ✅ Match history med flere kamper - **FULLFØRT**
- ❌ Chart.js dependency - **MÅ INSTALLERES**

### Risiko og mitigering

**Risiko 1: Performance med store datasett**
- **Problem:** Aggregering av 100+ kamper kan være treg
- **Mitigering:**
  - Implementer caching aggressivt
  - Lazy loading av data
  - Vurder pagination for store sesonger

**Risiko 2: Kompleksitet i heatmap-rendering**
- **Problem:** Canvas-rendering kan være komplisert
- **Mitigering:**
  - Start med enkel grid-basert tilnærming
  - Iterativ utvikling
  - Fallback til enklere visualisering hvis nødvendig

**Risiko 3: Cross-browser kompatibilitet**
- **Problem:** Chart.js og Canvas kan ha browser-quirks
- **Mitigering:**
  - Test tidlig på alle target browsers
  - Bruk polyfills hvis nødvendig
  - Graceful degradation

**Risiko 4: Scope creep**
- **Problem:** Fase 3 er stor, lett å legge til mer
- **Mitigering:**
  - Streng prioritering (MVP features først)
  - Dokumenter "Future enhancements" separat
  - Fokus på core value først

---

## KONKLUSJON

**Fase 2 - Status:**
- 🟡 50% fullført (Team rosters implementert 2026-01-21)
- ⏰ 5-8 timer gjenstår (brukerpreferanser)
- 🎯 Klar for implementering umiddelbart

**Fase 3 - Status:**
- ❌ Ikke startet
- ⏰ 50-66 timer estimert (6-8 uker)
- 🎯 Anbefales å fullføre Fase 2 først

**Anbefaling:**
1. Fullfør Fase 2 (brukerpreferanser) først - kun 1 arbeidsdag
2. Start Fase 3 Sprint 1 (Sesongstatistikk + Shot Efficiency)
3. Iterativ utvikling med sprints på 2 uker
4. Kontinuerlig testing og validering

**Neste steg:**
- Få brukerbekreftelse på Fase 2-implementering
- Få brukerbekreftelse på Fase 3-prioritering
- Opprett feature branch for Fase 2
- Start implementering

---

**Dokument versjon:** 1.0
**Sist oppdatert:** 2026-01-21
**Laget av:** Claude Code Agent

**Se også:**
- **ARCHITECTURE.md** - System architecture and implementation details
- **DEVELOPMENT_RULES.md** - Regler for kodeendringer (RED/YELLOW/GREEN zones)
- **TEST_GUIDE.md** - Testing guide and best practices
