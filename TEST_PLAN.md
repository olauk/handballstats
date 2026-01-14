# HANDBALL ANALYTICS v3.0 - TESTPLAN

**Dato:** 2026-01-12
**Versjon:** v3.0
**Status:** Ingen tester eksisterer per i dag

---

## INNHOLDSFORTEGNELSE

1. [Test Strategy Overview](#1-test-strategy-overview)
2. [Unit Tests (Prioritert)](#2-unit-tests-prioritert)
3. [Integration Tests](#3-integration-tests)
4. [End-to-End Tests](#4-end-to-end-tests)
5. [Test Infrastructure](#5-test-infrastructure)
6. [Testing Roadmap](#6-testing-roadmap)

---

## 1. TEST STRATEGY OVERVIEW

### Current Status
- ⚠️ **Ingen tester eksisterer**
- ⚠️ Ingen test framework installert
- ⚠️ Ingen CI/CD pipeline for testing

### Recommended Test Stack

```
Unit Tests:        Jest + @testing-library/dom
Integration Tests: Jest + Firebase Emulator
E2E Tests:         Playwright eller Cypress
Mocking:           Jest mocks + Mock Service Worker (MSW)
Coverage Target:   80% for kritiske funksjoner
```

### Test Pyramid

```
        /\
       /E2E\        10% - End-to-end (5-10 tests)
      /------\
     / Integ  \     30% - Integration (20-30 tests)
    /----------\
   /   Unit     \   60% - Unit (50-100 tests)
  /--------------\
```

### Priority Levels

| Prioritet | Beskrivelse | Tidslinje |
|-----------|-------------|-----------|
| **1 - KRITISK** | MÅ testes før noen kodeendring | Umiddelbart |
| **2 - VIKTIG** | Bør testes innen 2 uker | Snart |
| **3 - NICE TO HAVE** | Kan vente til refactoring | Senere |

---

## 2. UNIT TESTS (PRIORITERT)

### 2.1 PRIORITET 1 - KRITISKE FUNKSJONER (MUST HAVE)

Disse funksjonene håndterer data-integritet og MÅ testes før noen endringer gjøres.

#### shots.js - Skuddregistrering (18 tests)

| Test Case | Funksjon | Hva Testes | Hvorfor Kritisk |
|-----------|----------|------------|-----------------|
| **UT-001** | `handleGoalClick()` | Beregner korrekte x,y koordinater for klikk innenfor mål | Data corruption hvis feil |
| **UT-002** | `handleGoalClick()` | Beregner korrekte koordinater for klikk utenfor mål | Data corruption hvis feil |
| **UT-003** | `handleGoalClick()` | Validerer at keeper er valgt i defense mode | Blokkerer ugyldige skudd |
| **UT-004** | `handleGoalClick()` | Setter APP.tempShot korrekt | Data loss hvis feil |
| **UT-005** | `handleGoalClick()` | Håndterer edge case: Klikk på grense (x=0, y=0) | Boundary condition |
| **UT-006** | `handleGoalClick()` | Håndterer edge case: Klikk på grense (x=100, y=100) | Boundary condition |
| **UT-007** | `selectShotResult()` | Oppdaterer APP.selectedResult korrekt | Data integrity |
| **UT-008** | `selectShotResult()` | Håndterer ugyldig result gracefully | Error prevention |
| **UT-009** | `registerShot()` | Lager komplett event objekt med alle påkrevde felt | Data completeness |
| **UT-010** | `registerShot()` | Legger event til APP.events array | Data persistence |
| **UT-011** | `registerShot()` | Invaliderer stats cache etter registrering | Cache consistency |
| **UT-012** | `registerShot()` | Kaller saveToLocalStorage() | Data persistence |
| **UT-013** | `registerShot()` | Håndterer attack mode korrekt | Mode-specific logic |
| **UT-014** | `registerShot()` | Håndterer defense mode korrekt | Mode-specific logic |
| **UT-015** | `registerShot()` | Inkluderer timer timestamp i advanced mode | Feature consistency |
| **UT-016** | `registerShot()` | Håndterer manglende player gracefully | Error prevention |
| **UT-017** | `registerShot()` | Rollbacker ved save feil (trengs implementering) | Data integrity |
| **UT-018** | `registerShot()` | Genererer unikt ID for event | ID collision prevention |

**Eksempel test:**
```javascript
describe('shots.js - handleGoalClick', () => {
  test('UT-001: Beregner korrekte koordinater for klikk innenfor mål', () => {
    // Setup
    const mockGoalArea = {
      getBoundingClientRect: () => ({ left: 100, top: 100, width: 400, height: 300 })
    };
    const mockEvent = { clientX: 300, clientY: 250 }; // 50% x, 50% y

    // Execute
    handleGoalClick(mockEvent, mockGoalArea);

    // Assert
    expect(APP.tempShot.x).toBe(50);
    expect(APP.tempShot.y).toBe(50);
    expect(APP.tempShot.zone).toBe('goal');
  });
});
```

#### state.js - Cache Management (8 tests)

| Test Case | Funksjon | Hva Testes | Hvorfor Kritisk |
|-----------|----------|------------|-----------------|
| **UT-019** | `invalidateStatsCache()` | Incrementer cacheVersion | Cache invalidation |
| **UT-020** | `invalidateStatsCache()` | Clearer statsCache Map | Memory management |
| **UT-021** | `getCachedStats()` | Returnerer cached value hvis exists | Performance |
| **UT-022** | `getCachedStats()` | Kaller calculator hvis cache miss | Lazy evaluation |
| **UT-023** | `getCachedStats()` | Bruker korrekt cache key med version | Versioning |
| **UT-024** | `generateUniqueId()` | Genererer unike IDer ved rask påfølgende calls | ID collision |
| **UT-025** | `generateUniqueId()` | Håndterer collision detection | ID uniqueness |
| **UT-026** | Cache | Håndterer cache size over 1000 entries | Memory leak prevention |

#### storage.js - Persistence (10 tests)

| Test Case | Funksjon | Hva Testes | Hvorfor Kritisk |
|-----------|----------|------------|-----------------|
| **UT-027** | `saveToLocalStorage()` | Debouncer saves korrekt (300ms) | Prevents excessive saves |
| **UT-028** | `saveToLocalStorage()` | Cancels previous timeout ved ny save | Debounce correctness |
| **UT-029** | `saveToLocalStorage()` | Serialiserer APP objekt korrekt | Data integrity |
| **UT-030** | `saveToLocalStorage()` | Håndterer localStorage QuotaExceededError | Error handling |
| **UT-031** | `saveToLocalStorageImmediate()` | Lagrer umiddelbart uten debounce | Critical operations |
| **UT-032** | `loadFromLocalStorage()` | Laster data korrekt ved app start | Data restoration |
| **UT-033** | `loadFromLocalStorage()` | Håndterer corrupt localStorage data | Error resilience |
| **UT-034** | `loadFromLocalStorage()` | Håndterer manglende localStorage | First-time users |
| **UT-035** | Debounce | Kun lagrer én gang ved 5 raske endringer | Debounce effectiveness |
| **UT-036** | Debounce | Lagrer begge hvis > 300ms mellom | Timing correctness |

#### statistics.js - Stats Calculation (12 tests)

| Test Case | Funksjon | Hva Testes | Hvorfor Kritisk |
|-----------|----------|------------|-----------------|
| **UT-037** | `getPlayerStats()` | Beregner goals korrekt | Core feature |
| **UT-038** | `getPlayerStats()` | Beregner saved (redninger mot spiller) korrekt | Core feature |
| **UT-039** | `getPlayerStats()` | Beregner outside korrekt | Core feature |
| **UT-040** | `getPlayerStats()` | Filtrerer på korrekt half | Data accuracy |
| **UT-041** | `getPlayerStats()` | Håndterer player uten events | Edge case |
| **UT-042** | `getPlayerStats()` | Håndterer ugyldig playerId | Error prevention |
| **UT-043** | `getOpponentStats()` | Beregner opponent goals korrekt | Core feature |
| **UT-044** | `getOpponentStats()` | Beregner opponent saves korrekt | Core feature |
| **UT-045** | `getOpponentStats()` | Returnerer alle opponent shots | Data completeness |
| **UT-046** | `getMatchStats()` | Beregner total score korrekt | Core feature |
| **UT-047** | `getMatchStats()` | Aggregerer stats for begge lag | Data aggregation |
| **UT-048** | Caching | Bruker cache ved gjentatte kall | Performance |

#### firestore-storage.js - Cloud Sync (15 tests)

| Test Case | Funksjon | Hva Testes | Hvorfor Kritisk |
|-----------|----------|------------|-----------------|
| **UT-049** | `saveMatchToFirestore()` | Lagrer til 'active' document | Data persistence |
| **UT-050** | `saveMatchToFirestore()` | Debouncer saves korrekt (1000ms) | Rate limiting |
| **UT-051** | `saveMatchToFirestore()` | Håndterer network failure | Error resilience |
| **UT-052** | `saveMatchToFirestore()` | Håndterer auth error | Security |
| **UT-053** | `loadActiveMatchFromFirestore()` | Laster active match korrekt | Data restoration |
| **UT-054** | `loadActiveMatchFromFirestore()` | Håndterer manglende active match | First-time users |
| **UT-055** | `saveCompletedMatchToFirestore()` | Lagrer completed match med riktig ID | Data archiving |
| **UT-056** | `saveCompletedMatchToFirestore()` | Setter completedAt timestamp | Data tracking |
| **UT-057** | `loadCompletedMatchesFromFirestore()` | Laster alle completed matches | Data retrieval |
| **UT-058** | `deleteCompletedMatchFromFirestore()` | Sletter match korrekt | Data management |
| **UT-059** | `migrateLocalStorageToFirestore()` | Migrerer data kun én gang | Migration safety |
| **UT-060** | `migrateLocalStorageToFirestore()` | Setter migrated flag | Migration tracking |
| **UT-061** | `syncFromFirestore()` | Overskriver lokal data med Firestore | Sync correctness |
| **UT-062** | `syncFromFirestore()` | Invaliderer cache etter sync | Cache consistency |
| **UT-063** | Debounce | Kun lagrer én gang ved raske changes | Rate limiting |

**TOTALT PRIORITET 1: 63 tests**

---

### 2.2 PRIORITET 2 - VIKTIGE FUNKSJONER (SHOULD HAVE)

Disse funksjonene er viktige for brukeropplevelsen, men ikke kritiske for data-integritet.

#### auth.js - Authentication (10 tests)

| Test Case | Funksjon | Hva Testes | Prioritet |
|-----------|----------|------------|-----------|
| **UT-064** | `handleRegister()` | Registrerer ny bruker korrekt | 2 |
| **UT-065** | `handleRegister()` | Oppretter Firestore user profile | 2 |
| **UT-066** | `handleRegister()` | Håndterer duplicate email error | 2 |
| **UT-067** | `handleRegister()` | Validerer password strength (må implementeres) | 2 |
| **UT-068** | `handleLogin()` | Logger inn bruker korrekt | 2 |
| **UT-069** | `handleLogin()` | Fetcher user profile fra Firestore | 2 |
| **UT-070** | `handleLogin()` | Håndterer feil passord | 2 |
| **UT-071** | `handleLogout()` | Logger ut bruker korrekt | 2 |
| **UT-072** | `handleLogout()` | Clearer APP.currentUser | 2 |
| **UT-073** | `handlePasswordReset()` | Sender reset email | 2 |

#### players.js - Player Management (8 tests)

| Test Case | Funksjon | Hva Testes | Prioritet |
|-----------|----------|------------|-----------|
| **UT-074** | `addPlayer()` | Legger til spiller korrekt | 2 |
| **UT-075** | `addPlayer()` | Genererer unikt ID | 2 |
| **UT-076** | `addPlayer()` | Validerer required fields | 2 |
| **UT-077** | `removePlayer()` | Fjerner spiller korrekt | 2 |
| **UT-078** | `registerTechnicalError()` | Registrerer teknisk feil | 2 |
| **UT-079** | `registerTechnicalError()` | Invaliderer cache | 2 |
| **UT-080** | `selectKeeper()` | Setter activeKeeper korrekt | 2 |
| **UT-081** | `selectKeeper()` | Validerer at keeper exists | 2 |

#### utils.js - Utility Functions (12 tests)

| Test Case | Funksjon | Hva Testes | Prioritet |
|-----------|----------|------------|-----------|
| **UT-082** | `finishMatch()` | Arkiverer match korrekt | 2 |
| **UT-083** | `finishMatch()` | Resetter current match state | 2 |
| **UT-084** | `finishMatch()` | Lagrer til både localStorage og Firestore | 2 |
| **UT-085** | `finishMatch()` | Warns hvis ingen events i 2. omgang | 2 |
| **UT-086** | `resetMatch()` | Resetter events array | 2 |
| **UT-087** | `resetMatch()` | Resetter timer i advanced mode | 2 |
| **UT-088** | `resetMatch()` | Invaliderer cache | 2 |
| **UT-089** | `resetSetup()` | Resetter team names | 2 |
| **UT-090** | `resetSetup()` | Fjerner alle players/opponents | 2 |
| **UT-091** | `exportData()` | Lager JSON blob korrekt | 2 |
| **UT-092** | `handlePlayersFileUpload()` | Parser JSON file korrekt | 2 |
| **UT-093** | `handlePlayersFileUpload()` | Parser CSV file korrekt | 2 |

#### timer.js - Match Timer (8 tests)

| Test Case | Funksjon | Hva Testes | Prioritet |
|-----------|----------|------------|-----------|
| **UT-094** | `startTimer()` | Starter timer korrekt | 2 |
| **UT-095** | `startTimer()` | Preventer dobbel-start | 2 |
| **UT-096** | `pauseTimer()` | Pauser timer korrekt | 2 |
| **UT-097** | `resetTimer()` | Resetter timer til 0 | 2 |
| **UT-098** | `updateTimerDisplay()` | Formatterer tid korrekt (MM:SS) | 2 |
| **UT-099** | `getTimerTimestamp()` | Returnerer korrekt timestamp | 2 |
| **UT-100** | Timer interval | Incrementer currentTime hvert sekund | 2 |
| **UT-101** | Timer cleanup | Clearer interval ved pause/reset | 2 |

#### team-roster.js - Roster Management (6 tests)

| Test Case | Funksjon | Hva Testes | Prioritet |
|-----------|----------|------------|-----------|
| **UT-102** | `saveTeamRoster()` | Lagrer roster til Firestore | 2 |
| **UT-103** | `saveTeamRoster()` | Validerer roster name | 2 |
| **UT-104** | `loadTeamRoster()` | Laster roster korrekt | 2 |
| **UT-105** | `deleteTeamRoster()` | Sletter roster fra Firestore | 2 |
| **UT-106** | `applyTeamRoster()` | Applier roster til current match | 2 |
| **UT-107** | Roster | Håndterer duplicate roster names | 2 |

**TOTALT PRIORITET 2: 44 tests**

---

### 2.3 PRIORITET 3 - NICE TO HAVE (CAN WAIT)

Disse testene kan vente til refactoring eller nye features.

#### UI Components (20 tests)

| Test Case | Fil | Hva Testes | Prioritet |
|-----------|-----|------------|-----------|
| **UT-108** | ui/render.js | Ruter til riktig page basert på APP.page | 3 |
| **UT-109** | ui/match.js | Renderer match page korrekt | 3 |
| **UT-110** | ui/match.js | Viser korrekt score | 3 |
| **UT-111** | ui/match.js | Viser goal markers på riktig posisjon | 3 |
| **UT-112** | ui/setup.js | Renderer setup page korrekt | 3 |
| **UT-113** | ui/home.js | Renderer home page korrekt | 3 |
| **UT-114** | ui/history.js | Viser completed matches | 3 |
| **UT-115** | ui/modals.js | Åpner modal korrekt | 3 |
| **UT-116** | ui/modals.js | Lukker modal korrekt | 3 |
| **UT-117** | ui/modals.js | Preventer body scroll når modal åpen | 3 |
| **UT-118** | ui/event-feed.js | Renderer events i riktig rekkefølge | 3 |
| **UT-119** | ui/event-feed.js | Viser korrekt score etter hvert event | 3 |
| **UT-120-127** | Various UI | Snapshot tests for alle pages | 3 |

#### debug-logger.js (5 tests)

| Test Case | Funksjon | Hva Testes | Prioritet |
|-----------|----------|------------|-----------|
| **UT-128** | `logAppEvent()` | Logger event til Firestore | 3 |
| **UT-129** | `logAppEvent()` | Inkluderer user info | 3 |
| **UT-130** | `logAppEvent()` | Inkluderer browser info | 3 |
| **UT-131** | `logAppEvent()` | Skippes hvis ingen currentUser | 3 |
| **UT-132** | Logging | Rate limits logging (må implementeres) | 3 |

**TOTALT PRIORITET 3: 25 tests**

---

**TOTALT UNIT TESTS: 132 tests**

---

## 3. INTEGRATION TESTS

Integration tests verifiserer at moduler fungerer sammen korrekt.

### 3.1 PRIORITET 1 - KRITISKE INTEGRASJONER (10 tests)

| Test ID | Beskrivelse | Moduler Involvert | Hva Testes |
|---------|-------------|-------------------|------------|
| **IT-001** | Shot registration til lagring | shots.js → state.js → storage.js | End-to-end skudd lagring |
| **IT-002** | Shot registration til Firestore | shots.js → firestore-storage.js | Cloud sync fungerer |
| **IT-003** | Stats beregning med caching | statistics.js → state.js → PERFORMANCE | Cache invalidering fungerer |
| **IT-004** | Load fra localStorage ved start | app.js → storage.js → state.js | Data restoration |
| **IT-005** | Login til Firestore sync | auth.js → firestore-storage.js → state.js | Auth + data sync |
| **IT-006** | Logout cleardown | auth.js → state.js → UI | State cleanup |
| **IT-007** | Finish match workflow | utils.js → firestore-storage.js → state.js | Match archiving |
| **IT-008** | Reset match cleanup | utils.js → state.js → timer.js | State reset + timer cleanup |
| **IT-009** | File import to players list | utils.js → players.js → state.js | Import workflow |
| **IT-010** | Migration workflow | auth.js → firestore-storage.js | localStorage → Firestore |

### 3.2 PRIORITET 2 - VIKTIGE INTEGRASJONER (8 tests)

| Test ID | Beskrivelse | Moduler Involvert |
|---------|-------------|-------------------|
| **IT-011** | Timer integration med events | timer.js → shots.js → state.js |
| **IT-012** | Modal open → render → attach listeners | modals.js → render.js → events.js |
| **IT-013** | Team roster save → load | team-roster.js → firestore-storage.js |
| **IT-014** | Player add → stats update | players.js → statistics.js |
| **IT-015** | Debug logging workflow | Alle moduler → debug-logger.js |
| **IT-016** | Event feed rendering | shots.js → event-feed.js |
| **IT-017** | Setup changes → match page | setup.js → match.js |
| **IT-018** | History view → completed match | history.js → utils.js |

**TOTALT INTEGRATION TESTS: 18 tests**

---

## 4. END-TO-END TESTS

E2E tests simulerer reelle brukerscenarier fra start til slutt.

### 4.1 KRITISKE BRUKERFLYTER (5 tests)

| Test ID | Scenario | Steg | Estimert Tid |
|---------|----------|------|--------------|
| **E2E-001** | Komplett kamp-registrering | 1. Registrer bruker<br/>2. Sett opp lag<br/>3. Registrer 10 skudd (5 i hver omgang)<br/>4. Sjekk statistikk<br/>5. Avslutt kamp<br/>6. Verifiser historikk | 5 min |
| **E2E-002** | Login og fortsett eksisterende kamp | 1. Logg inn<br/>2. Verifiser data synces fra Firestore<br/>3. Registrer nytt skudd<br/>4. Logg ut<br/>5. Logg inn igjen<br/>6. Verifiser data persistent | 3 min |
| **E2E-003** | Offline → Online sync | 1. Logg inn<br/>2. Gå offline<br/>3. Registrer skudd (localStorage)<br/>4. Gå online<br/>5. Verifiser Firestore sync | 4 min |
| **E2E-004** | Multi-device sync | 1. Registrer kamp på device 1<br/>2. Logg inn på device 2<br/>3. Verifiser data synces<br/>4. Registrer skudd på device 2<br/>5. Reload device 1<br/>6. Verifiser sync | 5 min |
| **E2E-005** | File import til kamp-registrering | 1. Last opp spillerliste (CSV)<br/>2. Last opp motstanderliste (JSON)<br/>3. Start kamp<br/>4. Registrer skudd<br/>5. Verifiser spillernavn vises korrekt | 3 min |

### 4.2 VIKTIGE BRUKERFLYTER (5 tests)

| Test ID | Scenario | Estimert Tid |
|---------|----------|--------------|
| **E2E-006** | Advanced mode med timer | 3 min |
| **E2E-007** | Team roster save og load | 2 min |
| **E2E-008** | Reset match mid-game | 2 min |
| **E2E-009** | Password reset flow | 3 min |
| **E2E-010** | View og delete completed match | 2 min |

**TOTALT E2E TESTS: 10 tests**

---

## 5. TEST INFRASTRUCTURE

### 5.1 Setup Instructions

#### Install Dependencies

```bash
# Unit testing framework
npm install --save-dev jest @testing-library/dom @testing-library/jest-dom

# Firebase mocking
npm install --save-dev @firebase/rules-unit-testing

# E2E testing
npm install --save-dev playwright

# Coverage reporting
npm install --save-dev jest-coverage
```

#### Jest Configuration (jest.config.js)

```javascript
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/js/$1'
  },
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/firebase-config.js',  // Exclude config
    '!js/ui/**/*.js'           // UI tests later
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ]
};
```

#### Test Folder Structure

```
handballstats/
├── tests/
│   ├── setup.js                    # Global test setup
│   ├── mocks/
│   │   ├── firebase.mock.js        # Firebase mocks
│   │   ├── localStorage.mock.js    # localStorage mock
│   │   └── dom.mock.js            # DOM mocks
│   ├── unit/
│   │   ├── shots.test.js          # 18 tests
│   │   ├── state.test.js          # 8 tests
│   │   ├── storage.test.js        # 10 tests
│   │   ├── statistics.test.js     # 12 tests
│   │   ├── firestore-storage.test.js  # 15 tests
│   │   ├── auth.test.js           # 10 tests
│   │   ├── players.test.js        # 8 tests
│   │   ├── utils.test.js          # 12 tests
│   │   ├── timer.test.js          # 8 tests
│   │   └── team-roster.test.js    # 6 tests
│   ├── integration/
│   │   ├── shot-registration.test.js   # IT-001, IT-002, IT-003
│   │   ├── auth-sync.test.js          # IT-005, IT-006, IT-010
│   │   ├── match-lifecycle.test.js    # IT-007, IT-008
│   │   └── ui-workflow.test.js        # IT-011-018
│   └── e2e/
│       ├── complete-match.spec.js     # E2E-001
│       ├── multi-device-sync.spec.js  # E2E-002, E2E-004
│       ├── offline-sync.spec.js       # E2E-003
│       └── file-import.spec.js        # E2E-005
```

### 5.2 Mock Examples

#### Firebase Mock (tests/mocks/firebase.mock.js)

```javascript
export const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      set: jest.fn(() => Promise.resolve()),
      get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
      update: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve())
    })),
    add: jest.fn(() => Promise.resolve({ id: 'mock-id' })),
    where: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ docs: [] }))
    }))
  }))
};

export const mockAuth = {
  createUserWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({ user: { uid: 'test-uid' } })
  ),
  signInWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({ user: { uid: 'test-uid' } })
  ),
  signOut: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn()
};
```

#### localStorage Mock (tests/mocks/localStorage.mock.js)

```javascript
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

global.localStorage = new LocalStorageMock();
```

### 5.3 Example Unit Test

**tests/unit/shots.test.js**

```javascript
import { handleGoalClick, registerShot } from '../../js/shots.js';
import { APP, PERFORMANCE } from '../../js/state.js';

describe('shots.js - handleGoalClick', () => {
  beforeEach(() => {
    // Reset state before each test
    APP.tempShot = null;
    APP.selectedResult = null;
    APP.events = [];
  });

  test('UT-001: Beregner korrekte koordinater for klikk innenfor mål', () => {
    // Mock DOM element
    const mockGoalArea = {
      getBoundingClientRect: () => ({
        left: 100,
        top: 100,
        width: 400,
        height: 300
      })
    };

    // Mock event (klikk midt i målområdet)
    const mockEvent = {
      clientX: 300,  // 100 + 200 (50% av 400)
      clientY: 250   // 100 + 150 (50% av 300)
    };

    // Execute
    handleGoalClick(mockEvent, mockGoalArea);

    // Assert
    expect(APP.tempShot).not.toBeNull();
    expect(APP.tempShot.x).toBeCloseTo(50, 1);
    expect(APP.tempShot.y).toBeCloseTo(50, 1);
    expect(APP.tempShot.zone).toBe('goal');
    expect(APP.selectedResult).toBeNull();
  });

  test('UT-005: Håndterer edge case - Klikk på øvre venstre hjørne', () => {
    const mockGoalArea = {
      getBoundingClientRect: () => ({
        left: 100,
        top: 100,
        width: 400,
        height: 300
      })
    };

    const mockEvent = {
      clientX: 100,  // Helt til venstre
      clientY: 100   // Helt øverst
    };

    handleGoalClick(mockEvent, mockGoalArea);

    expect(APP.tempShot.x).toBe(0);
    expect(APP.tempShot.y).toBe(0);
  });
});

describe('shots.js - registerShot', () => {
  beforeEach(() => {
    APP.events = [];
    APP.players = [{ id: 1, name: 'Test Player', number: 10, isKeeper: false }];
    APP.tempShot = { x: 50, y: 50, zone: 'goal' };
    APP.selectedResult = 'mål';
    APP.currentHalf = 1;
    APP.mode = 'attack';
    PERFORMANCE.cacheVersion = 0;
  });

  test('UT-009: Lager komplett event objekt', () => {
    registerShot(1);

    expect(APP.events).toHaveLength(1);

    const event = APP.events[0];
    expect(event).toHaveProperty('id');
    expect(event).toHaveProperty('half', 1);
    expect(event).toHaveProperty('mode', 'attack');
    expect(event).toHaveProperty('player');
    expect(event.player.id).toBe(1);
    expect(event).toHaveProperty('x', 50);
    expect(event).toHaveProperty('y', 50);
    expect(event).toHaveProperty('result', 'mål');
    expect(event).toHaveProperty('zone', 'goal');
    expect(event).toHaveProperty('timestamp');
  });

  test('UT-011: Invaliderer cache etter registrering', () => {
    const initialVersion = PERFORMANCE.cacheVersion;

    registerShot(1);

    expect(PERFORMANCE.cacheVersion).toBe(initialVersion + 1);
    expect(PERFORMANCE.statsCache.size).toBe(0);
  });
});
```

### 5.4 Example Integration Test

**tests/integration/shot-registration.test.js**

```javascript
import { registerShot } from '../../js/shots.js';
import { saveToLocalStorage } from '../../js/storage.js';
import { APP } from '../../js/state.js';
import { getPlayerStats } from '../../js/statistics.js';

describe('IT-001: Shot registration til lagring', () => {
  beforeEach(() => {
    localStorage.clear();
    APP.events = [];
    APP.players = [{ id: 1, name: 'Player 1', number: 10 }];
    APP.tempShot = { x: 50, y: 50, zone: 'goal' };
    APP.selectedResult = 'mål';
    APP.currentHalf = 1;
  });

  test('End-to-end: Register shot → Save → Load → Stats', async () => {
    // 1. Register shot
    registerShot(1);
    expect(APP.events).toHaveLength(1);

    // 2. Save to localStorage (sync)
    saveToLocalStorage();

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 350));

    // 3. Verify localStorage
    const saved = JSON.parse(localStorage.getItem('handballApp'));
    expect(saved.events).toHaveLength(1);
    expect(saved.events[0].result).toBe('mål');

    // 4. Calculate stats
    const stats = getPlayerStats(1, 1);
    expect(stats.goals).toBe(1);
  });
});
```

### 5.5 Example E2E Test

**tests/e2e/complete-match.spec.js**

```javascript
import { test, expect } from '@playwright/test';

test('E2E-001: Komplett kamp-registrering', async ({ page }) => {
  // 1. Gå til login-siden
  await page.goto('http://localhost:5000');

  // 2. Registrer ny bruker
  await page.click('text=Registrer ny bruker');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'Password123');
  await page.fill('input[name="name"]', 'Test User');
  await page.click('button:has-text("Registrer")');

  // 3. Verifiser vi er på home-siden
  await expect(page.locator('h1')).toContainText('Handball Analytics');

  // 4. Gå til setup-siden
  await page.click('text=Oppsett');

  // 5. Sett opp lag
  await page.fill('input[name="homeTeam"]', 'Eget Lag');
  await page.fill('input[name="awayTeam"]', 'Motstander');

  // 6. Legg til spillere
  await page.click('text=Legg til spiller');
  await page.fill('input[name="playerNumber"]', '10');
  await page.fill('input[name="playerName"]', 'Spiller 1');
  await page.click('button:has-text("Lagre")');

  // 7. Start kamp
  await page.click('text=Til kamp');

  // 8. Registrer skudd (1. omgang)
  for (let i = 0; i < 5; i++) {
    // Klikk på målområdet
    await page.click('#goalArea', { position: { x: 200, y: 150 } });

    // Velg resultat
    await page.click('button:has-text("Mål")');

    // Velg spiller
    await page.click('text=Spiller 1');

    // Vent på lagring
    await page.waitForTimeout(500);
  }

  // 9. Bytt til 2. omgang
  await page.click('button:has-text("2. omgang")');

  // 10. Registrer flere skudd
  for (let i = 0; i < 5; i++) {
    await page.click('#goalArea', { position: { x: 200, y: 150 } });
    await page.click('button:has-text("Mål")');
    await page.click('text=Spiller 1');
    await page.waitForTimeout(500);
  }

  // 11. Sjekk statistikk
  const stats = await page.locator('.player-stats').textContent();
  expect(stats).toContain('10 mål');

  // 12. Avslutt kamp
  await page.click('text=Avslutt kamp');
  await page.click('button:has-text("OK")'); // Bekreft

  // 13. Verifiser historikk
  await page.click('text=Historikk');
  const matches = await page.locator('.completed-match');
  expect(await matches.count()).toBe(1);
});
```

---

## 6. TESTING ROADMAP

### Fase 1: Setup & Kritiske Tests (Uke 1-2)
**Mål:** Etabler test infrastructure og test kritiske funksjoner

- [ ] Installer test frameworks (Jest, Playwright)
- [ ] Sett opp test folder structure
- [ ] Lag Firebase og localStorage mocks
- [ ] Skriv 63 Prioritet 1 unit tests
- [ ] Skriv 10 Prioritet 1 integration tests
- [ ] Skriv 5 kritiske E2E tests
- [ ] Sett opp CI/CD pipeline (GitHub Actions)

**Target Coverage:** 70% av kritiske filer

### Fase 2: Viktige Tests (Uke 3-4)
**Mål:** Dekk viktige funksjoner og workflows

- [ ] Skriv 44 Prioritet 2 unit tests
- [ ] Skriv 8 Prioritet 2 integration tests
- [ ] Skriv 5 viktige E2E tests
- [ ] Refaktorer basert på test findings
- [ ] Dokumenter test patterns

**Target Coverage:** 80% av alle filer

### Fase 3: UI & Nice-to-have (Uke 5-6)
**Mål:** Komplettere test coverage

- [ ] Skriv 25 Prioritet 3 unit tests
- [ ] Snapshot tests for UI components
- [ ] Performance tests
- [ ] Accessibility tests
- [ ] Security tests

**Target Coverage:** 85%+ total coverage

### Fase 4: Maintenance & Monitoring (Kontinuerlig)
**Mål:** Vedlikehold og forbedring

- [ ] Opprett test-running regimer
- [ ] Monitor flaky tests
- [ ] Oppdater tests ved refactoring
- [ ] Peer review av nye tests
- [ ] Quarterly test audit

---

## 7. CONTINUOUS INTEGRATION

### GitHub Actions Workflow

**`.github/workflows/test.yml`**

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Run unit tests
      run: npm run test:unit

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/coverage-final.json

  integration-tests:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Start Firebase Emulator
      run: npm run emulator:start

    - name: Run integration tests
      run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Install Playwright
      run: npx playwright install --with-deps

    - name: Start dev server
      run: npm run serve &

    - name: Run E2E tests
      run: npm run test:e2e

    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: playwright-report
        path: playwright-report/
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test:e2e": "playwright test",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "emulator:start": "firebase emulators:start --only firestore,auth"
  }
}
```

---

## 8. SUCCESS METRICS

### Coverage Targets

| Fase | Unit Coverage | Integration Coverage | E2E Coverage | Timeline |
|------|---------------|---------------------|--------------|----------|
| Fase 1 | 70% | 60% | 50% | Uke 2 |
| Fase 2 | 80% | 80% | 80% | Uke 4 |
| Fase 3 | 85% | 90% | 90% | Uke 6 |

### Quality Metrics

- **Flaky Test Rate:** < 2%
- **Test Execution Time:** < 5 min for unit, < 10 min for integration, < 15 min for E2E
- **Mean Time to Fix Failed Test:** < 1 hour
- **Code Review Coverage:** 100% (all tests reviewed)

---

**Dokument versjon:** 1.0
**Sist oppdatert:** 2026-01-12
**Total antall tests planlagt:** 160 tests (132 unit + 18 integration + 10 E2E)
