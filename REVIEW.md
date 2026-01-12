# HANDBALL ANALYTICS v3.0 - KODEGJENNOMGANG

**Dato:** 2026-01-12
**Versjon:** v3.0
**Omfang:** 40 filer, ~5,065 linjer JavaScript
**Type:** Vanilla JavaScript SPA med Firebase

---

## EXECUTIVE SUMMARY

### Hovedfunn
- ✅ **Solid arkitektur**: Klar separasjon mellom UI, logikk og lagring
- ✅ **Robust persistering**: Dobbel lagring (localStorage + Firestore) med debouncing
- ⚠️ **Race conditions**: 7 identifiserte områder med potensielle timing-problemer
- ⚠️ **Manglende error handling**: Kritiske funksjoner mangler try-catch
- ⚠️ **Event listener leaks**: Potensielle memory leaks i modal-håndtering
- ⚠️ **Testing**: Ingen tester - kritisk for videre utvikling

### Kodebase Metrics
| Kategori | Antall | Detaljer |
|----------|--------|----------|
| **Total LOC** | 5,065 | Ekskluderer kommentarer |
| **Filer** | 40 | 22 JavaScript, 2 HTML/CSS, resten konfig |
| **Funksjoner over 50 linjer** | 23 | Se liste under |
| **Kritiske funksjoner** | 12 | Shot registration, caching, sync |
| **Firebase operasjoner** | 8 | Auth + Firestore CRUD |

---

## A. ARKITEKTUR OG STRUKTUR

### 1. Mapper og Filorganisering

```
handballstats/
├── js/                          # Forretningslogikk (14 filer)
│   ├── app.js                   # Entry point (22 linjer)
│   ├── state.js                 # Global state + cache (127 linjer)
│   ├── auth.js                  # Firebase Auth (327 linjer)
│   ├── firebase-config.js       # Firebase config (48 linjer)
│   ├── storage.js               # localStorage wrapper (64 linjer)
│   ├── firestore-storage.js     # Firestore CRUD (277 linjer)
│   ├── events.js                # Event delegation (562 linjer) ⚠️ STOR
│   ├── shots.js                 # Skuddregistrering (368 linjer) 🔴 KRITISK
│   ├── statistics.js            # Stats beregning (48 linjer)
│   ├── players.js               # Spilleradministrasjon (229 linjer)
│   ├── timer.js                 # Match timer (204 linjer)
│   ├── team-roster.js           # Laglister persistering (307 linjer)
│   ├── debug-logger.js          # Event logging (245 linjer)
│   └── utils.js                 # Utility funksjoner (264 linjer)
│
├── ui/                          # Presentasjonslag (8 filer)
│   ├── render.js                # Router + layout (354 linjer)
│   ├── match.js                 # Match-side (427 linjer) ⚠️ STOR
│   ├── setup.js                 # Oppsett-side (259 linjer)
│   ├── home.js                  # Hjem-side (101 linjer)
│   ├── history.js               # Historikk (168 linjer)
│   ├── modals.js                # Modal management (255 linjer)
│   ├── event-feed.js            # Live feed (189 linjer)
│   └── team-roster.js           # Roster UI (220 linjer)
│
├── index.html                   # SPA container
├── styles.css                   # Styling
└── firebase.json                # Deployment config
```

### 2. Avhengigheter Mellom Filer

#### Kritiske avhengighetskjeder:

**Initialisering (app.js):**
```
app.js
  → storage.js (loadFromLocalStorage)
  → events.js (setupGlobalEventListeners)
  → auth.js (initAuthStateObserver)
  → ui/render.js (render)
```

**Skuddregistrering (shots.js):**
```
shots.js
  → state.js (APP state, PERFORMANCE cache)
  → statistics.js (stats beregning)
  → debug-logger.js (logging)
  → timer.js (tidsstempling)
  → ui/event-feed.js (live oppdatering)
  → storage.js (lagring)
  → firestore-storage.js (cloud sync)
```

**Firestore sync (firestore-storage.js):**
```
firestore-storage.js
  → firebase-config.js (db connection)
  → state.js (APP state)
  → debug-logger.js (logging)
```

### 3. Arkitektur-svakheter

#### 🔴 KRITISK: Global State Pattern
**Problem:** Hele applikasjonen deler én global `APP` objekt (state.js)
- ✅ **Fordel:** Enkel å debugge, ingen state-fragmentering
- ⚠️ **Ulempe:** Ingen innkapsling, lett å mutere fra hvor som helst
- ⚠️ **Skaleringsrisiko:** Blir uoversiktlig ved > 10,000 LOC

**Eksempel på risiko:**
```javascript
// Fra HVOR SOM HELST i kodebasen:
APP.events.push(newEvent)  // Ingen validering
APP.currentHalf = 3        // Ugyldig verdi aksepteres
```

**Anbefaling:** Introduser setter-funksjoner med validering når kodebasen vokser.

#### ⚠️ Event Listener Strategi
**To motstridende patterns:**
1. **Global delegation** (events.js) - satt opp én gang
2. **Direct attachment** (modals.js, forms) - re-attached ved hver render

**Problem:** Modals kan få multiple listeners hvis `attachEventListeners()` kalles flere ganger.

**Bevis fra koden:**
```javascript
// ui/render.js, linje ~30
export function render(attachEventListeners, renderFunc) {
    // ...
    attachEventListeners();  // Kalles ved hver render!
}

// ui/modals.js, linje ~15
export function attachModalEventListeners() {
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', closeModal);  // LEAK RISK!
    });
}
```

**Anbefaling:** Bruk `addEventListener` med `{ once: true }` eller rens opp ved close.

#### ⚠️ Ingen TypeScript
**Observasjon:** Vanilla JavaScript uten type-sjekking
- Ingen compile-time validering
- Krever omfattende runtime-sjekker
- Vanskelig å refaktorere trygt

**Eksempel på risiko:**
```javascript
// Hva om player.number er undefined?
const number = player.number.toString();  // Crashes!
```

---

## B. KRITISKE FUNKSJONER (PRIORITET 1)

### 1. Skuddregistrering (shots.js)

#### Funksjon: `handleGoalClick(e)` (linje 20-65)
**Formål:** Registrerer museklikk på målområdet

**Dataflyt:**
```
User click på goal area
  ↓
handleGoalClick(e)
  ├─ Beregner x,y koordinater (relativ til målområde)
  ├─ Validerer keeper selection (kun i defense mode)
  ├─ Lagrer i APP.tempShot = { x, y, zone: 'goal'/'outside' }
  └─ Setter APP.selectedResult = null
  ↓
render() → Viser shot popup modal
```

**Kritiske linjer:**
```javascript
// shots.js:35-40
const rect = goalArea.getBoundingClientRect();
const x = ((e.clientX - rect.left) / rect.width) * 100;
const y = ((e.clientY - rect.top) / rect.height) * 100;

APP.tempShot = { x, y, zone: 'goal' };
APP.selectedResult = null;
```

**Potensielle bugs:**
- ❌ Ingen validering av `x` og `y` (kan bli < 0 eller > 100 hvis klikk utenfor)
- ❌ `goalArea` kan være `null` hvis DOM ikke er klar
- ❌ Ingen try-catch rundt `getBoundingClientRect()`

#### Funksjon: `selectShotResult(result)` (linje 68-95)
**Formål:** Oppdaterer valgt resultat (mål/redning) uten full re-render

**Optimalisering:** Partial DOM update
```javascript
// Oppdaterer KUN resultat-knapper, ikke hele siden
document.querySelectorAll('.result-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.result === result);
});
```

**Potensielle bugs:**
- ✅ Robust: Sjekker `APP.tempShot` før oppdatering
- ⚠️ Race condition: Hvis `render()` kalles samtidig, kan DOM være usynkronisert

#### Funksjon: `registerShot(playerId)` (linje 98-220)
**Formål:** Fullfører skuddregistrering og oppdaterer state

**Dataflyt:**
```
registerShot(playerId)
  ├─ Henter player/opponent/keeper objekt
  ├─ Beregner absolutte koordinater (x,y i 0-100%)
  ├─ Henter timer timestamp (hvis avansert modus)
  ├─ Lager event objekt:
  │    {
  │      id: Date.now(),
  │      half: 1|2,
  │      mode: 'attack'|'defense',
  │      player: {...},
  │      opponent: {...},
  │      keeper: {...},
  │      x, y, result, zone, timestamp, timerTimestamp
  │    }
  ├─ APP.events.push(event)
  ├─ PERFORMANCE.invalidateStatsCache()  ← KRITISK
  ├─ saveToLocalStorage()  ← KRITISK (debounced 300ms)
  ├─ updateGoalVisualization()  ← Partial update
  └─ updateStatisticsOnly()  ← Partial update
```

**Kritiske linjer:**
```javascript
// shots.js:180-185
APP.events.push(event);
PERFORMANCE.invalidateStatsCache();  // Gjør alle cached stats ugyldige
saveToLocalStorage();  // Debounced save (300ms + 1s Firestore)
```

**Potensielle bugs:**
- 🔴 **KRITISK RACE CONDITION #1:**
  - Hvis bruker registrerer 5 skudd raskt (< 300ms mellom hver)
  - Kun siste `saveToLocalStorage()` kjører (tidligere avbrutt av debounce)
  - Potensielt tap av data hvis browser crashes før lagring

- 🔴 **KRITISK RACE CONDITION #2:**
  - `invalidateStatsCache()` kjører FØR `saveToLocalStorage()`
  - Hvis render() kalles mellom disse, brukes gammel cache
  - Resulterer i feil statistikk vist til bruker

- ❌ Ingen try-catch rundt `saveToLocalStorage()` (kan feile hvis quota exceeded)
- ❌ Ingen validering av `playerId` eksisterer

**Anbefaling:**
```javascript
// Forslag til forbedring:
try {
    APP.events.push(event);
    saveToLocalStorage();  // Save FØRST
    PERFORMANCE.invalidateStatsCache();  // Invalider ETTER
} catch (error) {
    console.error('Failed to register shot:', error);
    // Rollback event
    APP.events.pop();
    alert('Kunne ikke lagre skudd. Prøv igjen.');
}
```

### 2. Redninger (integrert i shots.js)

**To måter å registrere redninger:**

#### A. Defense mode (motstander skyter)
```javascript
// Keeper registreres som den som redder
if (APP.mode === 'defense') {
    event.keeper = APP.activeKeeper;
    event.result = 'redning';  // Hvis bruker velger "redning"
}
```

#### B. Attack mode (egen spiller skyter)
```javascript
// Spiller får "redning" som resultat
if (APP.mode === 'attack') {
    event.player = {...};
    event.result = 'redning';  // Skudd ble reddet av motstanderkeeper
}
```

**Statistikk-beregning:**
```javascript
// statistics.js:15-25
getPlayerStats(playerId, half) {
    const playerEvents = events.filter(e =>
        e.half === half && e.player?.id === playerId
    );

    return {
        goals: playerEvents.filter(e => e.result === 'mål').length,
        saved: playerEvents.filter(e => e.result === 'redning').length,
        outside: playerEvents.filter(e => e.result === 'utenfor').length,
    };
}
```

**Potensielle bugs:**
- ⚠️ Ingen sjekk av `e.player` kan være `undefined` (Optional chaining brukes, bra!)
- ⚠️ Hvis `half` er ugyldig (3, 4, etc), returneres tom statistikk uten feilmelding

### 3. Statistikk-caching (state.js)

#### Implementering: `PERFORMANCE` object (linje 48-65)
```javascript
export const PERFORMANCE = {
    statsCache: new Map(),        // In-memory cache
    cacheVersion: 0,               // Global cache version
    saveTimeout: null,             // Debounce timer

    invalidateStatsCache() {
        this.cacheVersion++;       // Increment version
        this.statsCache.clear();   // Clear all entries
    },

    getCachedStats(key, calculator) {
        const cacheKey = `${key}-v${this.cacheVersion}`;

        if (!this.statsCache.has(cacheKey)) {
            // Lazy calculation - kun når nødvendig
            this.statsCache.set(cacheKey, calculator());
        }

        return this.statsCache.get(cacheKey);
    }
}
```

**Cache nøkkel format:**
```
player-{playerId}-{half}-v{cacheVersion}
opponent-{opponentId}-{half}-v{cacheVersion}
```

**Cache invalidering triggers:**
| Trigger | Fil | Funksjon |
|---------|-----|----------|
| Nytt skudd | shots.js:185 | `registerShot()` |
| Teknisk feil | players.js:95 | `registerTechnicalError()` |
| Reset match | utils.js:236 | `resetMatch()` |
| Reset setup | utils.js:258 | `resetSetup()` |
| Finish match | utils.js:171 | `finishMatch()` |

**Potensielle bugs:**
- ✅ **Robust:** Version-basert invalidering fjerner race conditions
- ⚠️ **Memory leak:** Cache vokser ubegrenset (ingen TTL eller size limit)
  - Med 20 spillere, 2 omganger, 5 re-renders = 200 cache entries
  - Ikke kritisk for små kamper, men kan bli problem ved langvarig bruk

**Anbefaling:**
```javascript
// Legg til cache size limit:
getCachedStats(key, calculator) {
    if (this.statsCache.size > 500) {  // Max 500 entries
        this.statsCache.clear();
    }
    // ... rest of implementation
}
```

---

## C. POTENSIELLE BUGS

### 🔴 KRITISK: Race Conditions

#### Race Condition #1: Debounced saves
**Fil:** storage.js:20-35
**Problem:** Rask påfølgende saves kan overskrive hverandre

```javascript
export function saveToLocalStorage() {
    clearTimeout(PERFORMANCE.saveTimeout);
    PERFORMANCE.saveTimeout = setTimeout(() => {
        localStorage.setItem('handballApp', JSON.stringify(APP));
        saveMatchToFirestoreDebounced();  // 1 sekund debounce
    }, 300);
}
```

**Scenario:**
1. Bruker registrerer skudd #1 → `saveToLocalStorage()` schedulerer save om 300ms
2. Bruker registrerer skudd #2 om 100ms → `clearTimeout()` AVBRYTER forrige save
3. Skudd #1 aldri lagret!

**Impact:** Lav risiko for enkeltskudd, men høy risiko hvis app crasher mellom debounce-perioden

**Løsning:**
```javascript
// Alternativ: Bruk saveToLocalStorageImmediate() for kritiske operasjoner
export function saveToLocalStorageImmediate() {
    localStorage.setItem('handballApp', JSON.stringify(APP));
    saveMatchToFirestore();  // Ikke debounced
}
```

#### Race Condition #2: Cache invalidering timing
**Fil:** shots.js:180-185
**Problem:** Cache invalideres ETTER save, men render kan skje MELLOM

```javascript
APP.events.push(event);
PERFORMANCE.invalidateStatsCache();  // Hvis render() her...
saveToLocalStorage();                // ...brukes gammel cache
```

#### Race Condition #3: Firestore sync vs localStorage
**Fil:** firestore-storage.js:85-105
**Problem:** localStorage og Firestore synkes separat med forskjellige debounce-tider

```javascript
saveToLocalStorage();                // 300ms debounce
saveMatchToFirestoreDebounced();    // 1000ms debounce
```

**Scenario:**
1. localStorage lagrer om 300ms
2. Firestore lagrer om 1000ms
3. Hvis bruker logger ut etter 500ms, er Firestore ikke oppdatert
4. Data går tapt

**Løsning:** Vent på Firestore-save før logout

#### Race Condition #4: Parallel file imports
**Fil:** utils.js:19-60
**Problem:** Hvis bruker importerer to filer raskt etter hverandre

```javascript
// Første import starter
reader.onload = (e) => {
    APP.tempPlayersList = players1;  // Setter temp list
    showModal('playersManagementPopup');
};

// Andre import overskriver før første modal lukkes
reader2.onload = (e) => {
    APP.tempPlayersList = players2;  // OVERSKRIVER players1!
};
```

#### Race Condition #5: Modal event listeners
**Fil:** ui/modals.js:15-45
**Problem:** Event listeners re-attached ved hver render

```javascript
export function attachModalEventListeners() {
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', closeModal);  // Accumulates!
    });
}
```

**Resultat:** Etter 10 renders, samme knapp har 10 listeners → `closeModal()` kalles 10 ganger

#### Race Condition #6: Timer interval management
**Fil:** timer.js:45-80
**Problem:** Hvis timer startes to ganger raskt

```javascript
export function startTimer() {
    if (APP.timerState.isRunning) return;  // Guard clause

    APP.timerState.intervalId = setInterval(() => {
        APP.timerState.currentTime++;
        updateTimerDisplay();
    }, 1000);
}
```

**Scenario:**
1. Bruker klikker "Start" to ganger raskt (double-click)
2. Første klikk setter `isRunning = false` (ikke atomisk)
3. Andre klikk går gjennom guard clause
4. To intervals kjører samtidig → timer teller dobbelt så raskt

**Løsning:** Bruk atomisk flag eller disable knapp ved klikk

#### Race Condition #7: Auth state observer + sync
**Fil:** auth.js:280-310
**Problem:** `syncFromFirestore()` kan kalles før `migrateLocalStorageToFirestore()` fullføres

```javascript
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        await migrateLocalStorageToFirestore();  // Async
        await syncFromFirestore();               // Kan starte før migrate fullført?
    }
});
```

**Note:** `await` håndterer dette riktig, men hvis noen fjerner `await` i fremtiden, vil det feile.

### ⚠️ Manglende Error Handling

#### Manglende try-catch (12 steder)

| Fil | Funksjon | Linje | Risiko |
|-----|----------|-------|--------|
| shots.js | `registerShot()` | 98-220 | 🔴 Høy - data loss |
| shots.js | `handleGoalClick()` | 20-65 | 🟡 Medium - UI crash |
| storage.js | `saveToLocalStorage()` | 20-35 | 🔴 Høy - quota exceeded |
| firestore-storage.js | `saveMatchToFirestore()` | 85-110 | 🔴 Høy - network failure |
| auth.js | `handleRegister()` | 45-85 | 🟡 Medium - Firebase error |
| utils.js | `handlePlayersFileUpload()` | 19-60 | 🟡 Medium - parse error |
| players.js | `registerTechnicalError()` | 80-105 | 🟡 Medium - data loss |
| timer.js | `startTimer()` | 45-80 | 🟢 Lav - visual only |
| statistics.js | `getPlayerStats()` | 15-30 | 🟢 Lav - returns empty |
| events.js | Event handlers | Multiple | 🟡 Medium - silent failures |
| debug-logger.js | `logAppEvent()` | 30-65 | 🟢 Lav - logging only |
| team-roster.js | `saveTeamRoster()` | 120-150 | 🟡 Medium - data loss |

**Eksempel på sårbar kode:**
```javascript
// shots.js:180 - Ingen error handling
APP.events.push(event);
PERFORMANCE.invalidateStatsCache();
saveToLocalStorage();  // Kan feile!
```

**Anbefalt forbedring:**
```javascript
try {
    APP.events.push(event);
    saveToLocalStorage();
    PERFORMANCE.invalidateStatsCache();
} catch (error) {
    console.error('Failed to register shot:', error);
    APP.events.pop();  // Rollback
    alert('Kunne ikke lagre skudd. Prøv igjen.');
    logAppEvent('error', { function: 'registerShot', error: error.message });
}
```

### ⚠️ localStorage/Firestore Sync-problemer

#### Problem 1: Ingen konfliktløsning
**Scenario:**
1. Bruker arbeider offline (localStorage oppdateres)
2. Bruker logger inn fra annen enhet (Firestore har annen data)
3. `syncFromFirestore()` OVERSKRIVER lokal data uten merge

**Kode:**
```javascript
// firestore-storage.js:175-190
export async function syncFromFirestore() {
    const activeMatch = await loadActiveMatchFromFirestore();

    if (activeMatch) {
        APP.homeTeam = activeMatch.homeTeam;  // Direct overwrite!
        APP.events = activeMatch.events;      // No merge!
        // ...
    }
}
```

**Impact:** Data loss hvis brukeren har gjort endringer offline

#### Problem 2: Ingen "last modified" timestamp
**Observasjon:** Events har ikke `modifiedAt` eller `version` field
- Umulig å implementere optimistic locking
- Umulig å merge conflicts basert på tidsstempel

#### Problem 3: Firestore offline persistence kan feile
**Kode:**
```javascript
// firebase-config.js:40-45
db.enablePersistence().catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn('Offline persistence failed: multiple tabs open');
    } else if (err.code === 'unimplemented') {
        console.warn('Offline persistence not supported');
    }
});
```

**Problem:** Hvis offline persistence feiler, er det ingen fallback-strategi

### ⚠️ Event Listener Leaks

#### Leak #1: Modal listeners
**Fil:** ui/modals.js:15-45
**Problem:** Listeners ikke fjernet ved modal close

```javascript
export function attachModalEventListeners() {
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', closeModal);  // Accumulates!
    });
}

// MANGLER:
export function removeModalEventListeners() {
    // Should remove all attached listeners
}
```

**Impact:** Etter 100 renders, hver modal har 100 listeners → memory leak

#### Leak #2: File input listeners
**Fil:** utils.js:10-20
**Problem:** File input event listeners ikke renset

```javascript
const fileInput = document.getElementById('playersFileInput');
fileInput.addEventListener('change', handlePlayersFileUpload);  // Multiple times?
```

#### Leak #3: Timer interval
**Fil:** timer.js:45-80
**Problem:** Interval ikke alltid cleared ved cleanup

```javascript
export function startTimer() {
    APP.timerState.intervalId = setInterval(() => {
        // ...
    }, 1000);
}

// Interval cleared ved reset, men hva hvis user navigerer bort?
```

**Anbefaling:** Clear interval ved page navigation

---

## D. VEDLIKEHOLDBARHET

### 1. Kodeduplisering

#### Duplisering #1: Player vs Opponent management
**Filer:** players.js, utils.js
**Linjer:** 40-120 vs 62-100

**Duplikert kode:**
```javascript
// Nesten identisk logikk for players og opponents
export function handlePlayersFileUpload(event) {
    // 60 linjer kode
}

export function handleOpponentsFileUpload(event) {
    // 60 linjer nærmest identisk kode
}
```

**Anbefaling:** Refaktorer til generisk `handleTeamFileUpload(event, teamType)`

#### Duplisering #2: Stats beregning
**Filer:** statistics.js, shots.js
**Observasjon:** Samme filter-logikk brukt flere steder

```javascript
// statistics.js:18
const playerEvents = events.filter(e => e.half === half && e.player?.id === playerId);

// shots.js:250
const relevantEvents = APP.events.filter(e => e.half === APP.currentHalf);
```

**Anbefaling:** Opprett utility-funksjon `getEventsForPlayer(playerId, half)`

#### Duplisering #3: Debounce pattern
**Filer:** storage.js, firestore-storage.js

```javascript
// Samme debounce-mønster brukt 2 steder
clearTimeout(PERFORMANCE.saveTimeout);
PERFORMANCE.saveTimeout = setTimeout(() => { ... }, 300);
```

**Anbefaling:** Opprett generic `debounce(fn, delay)` utility

#### Duplisering #4: Modal show/hide
**Filer:** ui/modals.js, ui/match.js

```javascript
// Modal visibility logikk spredt over flere filer
modal.classList.add('active');
modal.classList.remove('active');
```

**Anbefaling:** Sentraliser ALL modal-håndtering i modals.js

### 2. Komplekse Funksjoner (>50 linjer)

| Fil | Funksjon | Linjer | Kompleksitet | Anbefaling |
|-----|----------|--------|--------------|------------|
| events.js | `setupGlobalEventListeners()` | 562 total | 🔴 Ekstremt høy | **Split opp** i moduler per feature |
| shots.js | `registerShot()` | 122 | 🔴 Høy | Split i `createEvent()` + `persistEvent()` |
| ui/match.js | `renderMatchPage()` | 427 total | 🔴 Ekstremt høy | Split i komponenter |
| auth.js | `handleRegister()` | 80 | 🟡 Medium | Extract Firestore-logikk |
| utils.js | `finishMatch()` | 75 | 🟡 Medium | Extract validation |
| firestore-storage.js | `saveMatchToFirestore()` | 65 | 🟡 Medium | OK, men legg til error handling |
| players.js | `openPlayersManagementModal()` | 90 | 🟡 Medium | Extract rendering |
| ui/render.js | `render()` | 354 total | 🔴 Høy | Split router fra rendering |
| ui/setup.js | `renderSetupPage()` | 259 | 🔴 Høy | Split i sections |
| timer.js | `updateTimerDisplay()` | 60 | 🟢 Lav | OK |
| team-roster.js | `saveTeamRoster()` | 55 | 🟢 Lav | OK |
| ui/history.js | `renderHistoryPage()` | 168 | 🟡 Medium | Split i komponenter |
| ui/event-feed.js | `renderEventFeed()` | 189 | 🟡 Medium | Extract event rendering |
| debug-logger.js | `logAppEvent()` | 245 total | 🟡 Medium | OK (logging kan være stort) |

**Mest kritisk å refaktorere:**
1. **events.js** (562 linjer) - Split i feature-baserte moduler
2. **ui/match.js** (427 linjer) - Split i UI-komponenter
3. **shots.js `registerShot()`** (122 linjer) - Split logikk og persistering

### 3. Manglende Kommentarer på Kritisk Logikk

#### Underdokumenterte funksjoner:

**shots.js:180-220** - registerShot()
```javascript
// MANGLER:
// - Forklaring av coordinate system (0-100%)
// - Hvorfor invalidateStatsCache() kalles
// - Hva skjer hvis save feiler
```

**state.js:48-65** - Cache implementation
```javascript
// MANGLER:
// - Forklaring av version-based caching
// - Når cache grows unbounded
// - Memory implications
```

**firestore-storage.js:85-110** - saveMatchToFirestore()
```javascript
// MANGLER:
// - Forklaring av 'active' document pattern
// - Hvorfor debouncing er nødvendig
// - Hva skjer ved merge conflicts
```

**events.js:50-550** - Event delegation
```javascript
// MANGLER:
// - Liste over alle actions
// - Dependency graph mellom actions
// - Hvorfor global delegation vs direct binding
```

### 4. Hardkodede Verdier som Burde Være Konstanter

#### Identifiserte hardkodede verdier:

| Fil | Linje | Hardkodet verdi | Bør være |
|-----|-------|-----------------|----------|
| storage.js | 25 | `300` (debounce ms) | `SAVE_DEBOUNCE_MS` |
| firestore-storage.js | 90 | `1000` (debounce ms) | `FIRESTORE_DEBOUNCE_MS` |
| state.js | 10 | `'Eget lag'` | `DEFAULT_HOME_TEAM` |
| state.js | 11 | `'Motstander'` | `DEFAULT_AWAY_TEAM` |
| shots.js | 180 | `Date.now()` (ID generation) | Bruk `generateUniqueId()` fra state.js |
| timer.js | 15 | `[20, 25, 30]` (timer lengths) | `TIMER_DURATIONS` |
| ui/match.js | 50 | `'goal'`, `'outside'` (zones) | `SHOT_ZONES` enum |
| auth.js | 100 | Feilmeldinger (norsk) | `ERROR_MESSAGES` object |
| utils.js | 134 | `Date.now()` (match ID) | `generateMatchId()` |

**Anbefalt constants.js:**
```javascript
// Opprett ny fil: js/constants.js
export const TIMINGS = {
    SAVE_DEBOUNCE_MS: 300,
    FIRESTORE_DEBOUNCE_MS: 1000,
    TIMER_INTERVAL_MS: 1000
};

export const DEFAULTS = {
    HOME_TEAM: 'Eget lag',
    AWAY_TEAM: 'Motstander',
    TIMER_DURATION: 20
};

export const SHOT_ZONES = {
    GOAL: 'goal',
    OUTSIDE: 'outside'
};

export const SHOT_RESULTS = {
    GOAL: 'mål',
    SAVE: 'redning',
    OUTSIDE: 'utenfor'
};

export const MODES = {
    ATTACK: 'attack',
    DEFENSE: 'defense'
};
```

---

## E. FIREBASE-SIKKERHET

### 1. API-nøkler i Klient-kode

**Fil:** firebase-config.js:10-20

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyAdsBb-RR200g_KVfV4t0dbRhk7dfWseG8",
    authDomain: "handballstats-c80f3.firebaseapp.com",
    projectId: "handballstats-c80f3",
    storageBucket: "handballstats-c80f3.firebasestorage.app",
    messagingSenderId: "748340756980",
    appId: "1:748340756980:web:0d819c771d6bcde824f9a1"
};
```

**Vurdering:**
- ✅ **FORVENTET** - Firebase API-nøkler er designet for å være offentlige
- ✅ API-nøkkelen alene gir ikke tilgang til data
- ⚠️ **KRITISK:** Sikkerhet avhenger 100% av Firestore Security Rules

**Anbefaling:** Verifiser Firestore Security Rules (se neste seksjon)

### 2. Firestore-tilgangskontroll

**Status:** INGEN Security Rules funnet i kodebasen

**Observasjon:** Ingen `firestore.rules` fil i repositoriet

**KRITISK RISIKO:**
Hvis Firestore kjører med default rules (test mode), er ALL data offentlig:
```javascript
// DEFAULT RULES (test mode) - EKSTREMT FARLIG
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // ALLE kan lese/skrive!
    }
  }
}
```

**Anbefalt Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User kan kun lese/skrive egen data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // User kan kun lese/skrive egne kamper
      match /matches/{matchId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Debug logs kun lesbar av admin
    match /debug-logs/{logId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
      // Bør ha admin-sjekk i produksjon
    }
  }
}
```

**AKSJONSPUNKT:**
1. ✅ Sjekk Firebase Console → Firestore → Rules
2. ✅ Implementer rules ovenfor
3. ✅ Test rules med Firebase Emulator

### 3. Auth-flyt (sikker håndtering av tokens?)

**Fil:** auth.js

#### Token Håndtering:
```javascript
// auth.js:280-310
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        // Token håndteres automatisk av Firebase SDK
        await fetchUserProfile(user.uid);
        await syncFromFirestore();
    }
});
```

**Vurdering:**
- ✅ **SIKKER:** Firebase SDK håndterer tokens automatisk
- ✅ Tokens aldri eksponert i kode eller localStorage
- ✅ Auto-refresh av expired tokens

#### Password Reset:
```javascript
// auth.js:180-200
export async function handlePasswordReset(email) {
    await firebase.auth().sendPasswordResetEmail(email);
}
```

**Vurdering:**
- ✅ **SIKKER:** Bruker Firebase's innebygde reset flow
- ⚠️ Ingen rate limiting (kan brukes til spam) - MEN det er Firebase's ansvar

#### Registrering:
```javascript
// auth.js:45-85
export async function handleRegister(email, password, name) {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    await userCredential.user.updateProfile({ displayName: name });
    await createUserProfile(userCredential.user.uid, email, name);
}
```

**Potensielle sårbarheter:**
- ⚠️ Ingen password strength validation på klient-siden
- ⚠️ Ingen email format validation
- ⚠️ Ingen rate limiting på registrering (Firebase håndterer dette server-side)

**Anbefaling:**
```javascript
// Legg til validering:
function validatePassword(password) {
    if (password.length < 8) {
        throw new Error('Passord må være minst 8 tegn');
    }
    if (!/[A-Z]/.test(password)) {
        throw new Error('Passord må inneholde minst én stor bokstav');
    }
    if (!/[0-9]/.test(password)) {
        throw new Error('Passord må inneholde minst ett tall');
    }
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Ugyldig e-postadresse');
    }
}
```

#### Session Management:
- ✅ **SIKKER:** Firebase håndterer session tokens
- ✅ Auto-logout ved token expiration
- ✅ Ingen XSS-risiko (tokens ikke i DOM)

#### CSRF Protection:
- ⚠️ **MANGLER:** Ingen CSRF tokens
- ✅ **MITIGERT:** Firebase SDK bruker CORS og origin-sjekk
- ⚠️ Hvis du implementerer custom endpoints, trenger du CSRF-beskyttelse

---

## F. DEBUGGING OG LOGGING

### Debug Logger Implementation

**Fil:** debug-logger.js

```javascript
export async function logAppEvent(eventType, data) {
    if (!APP.currentUser) return;

    const logEntry = {
        userId: APP.currentUser.uid,
        userEmail: APP.currentUser.email,
        eventType: eventType,
        data: data,
        timestamp: new Date().toISOString(),
        appVersion: '3.0',
        browser: navigator.userAgent
    };

    await db.collection('debug-logs').add(logEntry);
}
```

**Vurdering:**
- ✅ Omfattende logging av alle kritiske events
- ⚠️ **PRIVACY RISK:** Logger user email og browser info
- ⚠️ **COST RISK:** Ingen rate limiting - kan bli dyrt ved høy trafikk
- ⚠️ Ingen log retention policy - logs vokser ubegrenset

**Anbefaling:**
1. Implementer log retention (slett logs > 30 dager)
2. Legg til privacy consent for logging
3. Rate limit logging (max 100 events per minute per user)
4. Anonymiser sensitive data

---

## G. YTELSE OG OPTIMALISERING

### Positive aspekter:
- ✅ Partial DOM updates (ikke full re-render ved hver endring)
- ✅ Debounced saves (reduserer database writes)
- ✅ Versioned caching (effektiv cache invalidering)
- ✅ Event delegation (ikke multiple listeners)

### Forbedringsområder:

#### 1. Bundle Size
**Observasjon:** Firebase compat library er stor (~250KB)
**Anbefaling:** Migrer til modular Firebase SDK (reduserer til ~50KB)

#### 2. Render Performance
**Problem:** `renderMatchPage()` renderer hele siden ved hver endring
**Løsning:** Bruk Virtual DOM eller Web Components

#### 3. Memory Leaks
**Problem:** Cache vokser ubegrenset
**Løsning:** Implementer cache size limit (se seksjon C)

---

## H. OPPSUMMERING AV KRITISKE FUNN

### 🔴 Må fikses før produksjon:
1. **Firestore Security Rules** - KRITISK: Implementer tilgangskontroll
2. **Race Condition #1** - Debounced saves kan miste data
3. **Error Handling** - Legg til try-catch i shots.js, storage.js, firestore-storage.js
4. **Event Listener Leaks** - Rens opp modal listeners

### 🟡 Bør fikses snart:
5. Race Condition #2-7 - Timing issues i forskjellige moduler
6. Cache memory leak - Implementer size limit
7. Konfliktløsning for Firestore sync
8. Password validation på klient-siden

### 🟢 Nice to have:
9. Refaktorer events.js (562 linjer)
10. Opprette constants.js for hardkodede verdier
11. Migrer til modular Firebase SDK
12. Legg til TypeScript

---

## I. NESTE STEG

Se `TEST_PLAN.md` for detaljert testplan med prioritering.
Se `PROTECTION_RULES.md` for regler om hvilke filer som aldri skal endres uten tester.
Se `ARCHITECTURE.md` for visuell arkitektur-dokumentasjon.

---

**Dokument versjon:** 1.0
**Sist oppdatert:** 2026-01-12
**Gjennomgått av:** Claude Code Agent
