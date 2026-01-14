# HANDBALL ANALYTICS v3.0 - BESKYTTELSESREGLER

**Dato:** 2026-01-12
**Versjon:** v3.0
**Formål:** Regler for å beskytte kritisk kode mot utilsiktede endringer

---

## ⚠️ VIKTIG ADVARSEL

Denne filen definerer **ABSOLUTTE REGLER** for kodeendringer i Handball Analytics.
**ALLE utviklere og AI-agenter MÅ følge disse reglene.**

Ved brudd på reglene kan kritiske funksjoner slutte å virke, og brukerdata kan gå tapt.

---

## INNHOLDSFORTEGNELSE

1. [Filosofi](#1-filosofi)
2. [Red Zone - Aldri Endre Uten Tester](#2-red-zone---aldri-endre-uten-tester)
3. [Yellow Zone - Krever Eksplisitt Bekreftelse](#3-yellow-zone---krever-eksplisitt-bekreftelse)
4. [Green Zone - Trygt å Endre](#4-green-zone---trygt-å-endre)
5. [Commit-regler](#5-commit-regler)
6. [Refactoring-protokoll](#6-refactoring-protokoll)
7. [Godkjenningsprosess](#7-godkjenningsprosess)
8. [Rollback-prosedyre](#8-rollback-prosedyre)

---

## 1. FILOSOFI

### Grunnprinsipper

1. **Data Integrity First**
   - Brukerdata er hellig - aldri risker data loss
   - Alle endringer som påvirker persistering må testes grundig

2. **Progressive Enhancement**
   - Legg til nye features, men endre ikke eksisterende funksjonalitet
   - Hvis du må endre, lag tester først

3. **Test-Driven Changes**
   - Kritiske funksjoner: Skriv tester FØRST, deretter endre
   - Viktige funksjoner: Skriv tester SAMTIDIG som endring
   - Nice-to-have: Tester kan komme etter

4. **Explicit Over Implicit**
   - Spør brukeren hvis du er usikker
   - Dokumenter alle breaking changes
   - Aldri gjør "stille" endringer i kritisk kode

---

## 2. RED ZONE - ALDRI ENDRE UTEN TESTER

### 🔴 Regel: ABSOLUTT FORBUD mot endringer uten comprehensive tests

Disse filene/funksjonene inneholder **KRITISK LOGIKK** for data-integritet.
**ALDRI gjør endringer uten at 100% av relaterte tester passerer.**

---

### 2.1 KRITISKE FILER - ABSOLUTT BESKYTTELSE

| Fil | Hvorfor Kritisk | Minimum Tester Påkrevd |
|-----|----------------|------------------------|
| **js/shots.js** | Skuddregistrering - kjernen i appen | 18 unit + 3 integration |
| **js/state.js** | Global state + cache management | 8 unit + alle integration |
| **js/storage.js** | localStorage persistering | 10 unit + 5 integration |
| **js/firestore-storage.js** | Cloud sync - data backup | 15 unit + 5 integration |
| **js/statistics.js** | Stats beregning - brukerens primære behov | 12 unit + 3 integration |

#### Spesifikke Regler for shots.js

```javascript
// ❌ ALDRI endre disse funksjonene uten tester:

function handleGoalClick(e) { ... }
// Tests required: UT-001 til UT-006

function selectShotResult(result) { ... }
// Tests required: UT-007, UT-008

function registerShot(playerId) { ... }
// Tests required: UT-009 til UT-018
// Integration tests: IT-001, IT-002, IT-003
```

**Hva kreves:**
- [ ] Alle 18 unit tests må passere
- [ ] 3 integration tests (IT-001, IT-002, IT-003) må passere
- [ ] Minst én E2E test (E2E-001) må passere
- [ ] Code review av minst én senior developer
- [ ] Manual testing på staging environment

**Eksempler på FORBUDTE endringer uten tester:**

```javascript
// ❌ FORBUDT - Endrer koordinat-beregning
const x = ((e.clientX - rect.left) / rect.width) * 100;
// til:
const x = e.clientX / rect.width * 100;  // Feil! Glemmer offset

// ❌ FORBUDT - Endrer event structure
event = { id, half, mode, player, x, y, result };
// til:
event = { id, half, player, coords: {x, y}, result };  // Breaking change!

// ❌ FORBUDT - Endrer cache invalidering timing
APP.events.push(event);
PERFORMANCE.invalidateStatsCache();
// til:
PERFORMANCE.invalidateStatsCache();
APP.events.push(event);  // Race condition!
```

#### Spesifikke Regler for state.js

```javascript
// ❌ ALDRI endre PERFORMANCE object uten tester:

export const PERFORMANCE = {
    statsCache: new Map(),
    cacheVersion: 0,
    // ...
};

function invalidateStatsCache() { ... }
// Tests required: UT-019, UT-020

function getCachedStats(key, calculator) { ... }
// Tests required: UT-021, UT-022, UT-023
```

**Hva kreves:**
- [ ] Alle 8 unit tests må passere
- [ ] Alle integration tests som bruker cache må passere
- [ ] Performance benchmarks må vise ingen regresjon
- [ ] Memory leak tests må passere

**Eksempler på FORBUDTE endringer:**

```javascript
// ❌ FORBUDT - Endrer cache key format
const cacheKey = `${key}-v${this.cacheVersion}`;
// til:
const cacheKey = `${this.cacheVersion}-${key}`;  // Breaking change!

// ❌ FORBUDT - Endrer invalidering logikk
invalidateStatsCache() {
    this.cacheVersion++;
    this.statsCache.clear();
}
// til:
invalidateStatsCache() {
    this.statsCache.clear();  // Glemmer version increment!
}
```

#### Spesifikke Regler for storage.js

```javascript
// ❌ ALDRI endre debounce timing uten tester:

export function saveToLocalStorage() {
    clearTimeout(PERFORMANCE.saveTimeout);
    PERFORMANCE.saveTimeout = setTimeout(() => {
        // ...
    }, 300);  // ← IKKE endre dette tallet!
}
```

**Hva kreves:**
- [ ] Alle 10 unit tests må passere
- [ ] IT-001, IT-004 må passere
- [ ] E2E-001, E2E-003 må passere
- [ ] Performance testing: Verifiser at debounce fungerer

**Eksempler på FORBUDTE endringer:**

```javascript
// ❌ FORBUDT - Endre debounce timing
setTimeout(() => { ... }, 300);
// til:
setTimeout(() => { ... }, 100);  // Kan overvelde Firestore!

// ❌ FORBUDT - Fjerne debounce
saveToLocalStorage() {
    localStorage.setItem(...);  // Direkte save - ingen debounce!
}

// ❌ FORBUDT - Endre serialisering
JSON.stringify(APP);
// til:
JSON.stringify(APP, null, 2);  // Endrer format!
```

#### Spesifikke Regler for firestore-storage.js

```javascript
// ❌ ALDRI endre 'active' document pattern:

export async function saveMatchToFirestore() {
    const matchRef = db
        .collection('users')
        .doc(APP.currentUser.uid)
        .collection('matches')
        .doc('active');  // ← HARDKODET 'active' - IKKE endre!
}
```

**Hva kreves:**
- [ ] Alle 15 unit tests må passere
- [ ] IT-002, IT-005, IT-007, IT-010 må passere
- [ ] E2E-002, E2E-004 (multi-device sync) må passere
- [ ] Firebase Emulator tests må passere

**Eksempler på FORBUDTE endringer:**

```javascript
// ❌ FORBUDT - Endre document ID pattern
.doc('active')
// til:
.doc('current')  // Breaking change for existing users!

// ❌ FORBUDT - Endre field names
matchData.homeTeam = APP.homeTeam;
// til:
matchData.home = APP.homeTeam;  // Breaking change!

// ❌ FORBUDT - Endre debounce timing
setTimeout(() => { ... }, 1000);
// til:
setTimeout(() => { ... }, 500);  // Kan overvelde Firestore!
```

#### Spesifikke Regler for statistics.js

```javascript
// ❌ ALDRI endre stats beregning logikk:

export function getPlayerStats(playerId, half) {
    const events = APP.events.filter(e =>
        e.half === half && e.player?.id === playerId
    );

    return {
        goals: events.filter(e => e.result === 'mål').length,
        saved: events.filter(e => e.result === 'redning').length,
        outside: events.filter(e => e.result === 'utenfor').length
    };
}
```

**Hva kreves:**
- [ ] Alle 12 unit tests må passere
- [ ] IT-003 må passere
- [ ] Stats må matche expected results i E2E-001

**Eksempler på FORBUDTE endringer:**

```javascript
// ❌ FORBUDT - Endre filter logikk
e.half === half
// til:
e.half == half  // Kan gi feil med string vs number!

// ❌ FORBUDT - Endre stats structure
return { goals, saved, outside };
// til:
return { goals, saves: saved, outside };  // Breaking change!

// ❌ FORBUDT - Fjerne optional chaining
e.player?.id
// til:
e.player.id  // Kan crashe hvis player er undefined!
```

---

### 2.2 KRITISKE FUNKSJONER - SPESIFIKKE FORBUD

#### Funksjon: registerShot() (shots.js:98-220)

**ABSOLUTT FORBUDT:**
- ❌ Endre rekkefølgen av operasjoner
- ❌ Fjerne cache invalidering
- ❌ Endre event object structure
- ❌ Fjerne eller endre ID generation
- ❌ Endre timing av saveToLocalStorage()

**TILLATT (med tester):**
- ✅ Legge til error handling (try-catch)
- ✅ Legge til logging
- ✅ Legge til validering av input

#### Funksjon: invalidateStatsCache() (state.js:48-53)

**ABSOLUTT FORBUDT:**
- ❌ Fjerne `cacheVersion++`
- ❌ Fjerne `statsCache.clear()`
- ❌ Endre rekkefølgen av operasjoner

**TILLATT:**
- ✅ Legge til logging (må ikke påvirke funksjonalitet)

#### Funksjon: saveToLocalStorage() (storage.js:20-35)

**ABSOLUTT FORBUDT:**
- ❌ Endre debounce timing uten performance testing
- ❌ Fjerne `clearTimeout()` call
- ❌ Endre `JSON.stringify()` format

**TILLATT (med tester):**
- ✅ Legge til error handling for QuotaExceeded
- ✅ Legge til retry logic

---

### 2.3 DATASTRUKTURER - IMMUTABLE

Disse datastrukturene er **IMMUTABLE** - kan ikke endres uten migrasjon.

#### Event Object Structure

```javascript
// ✅ GODKJENT STRUKTUR - IKKE ENDRE
const event = {
    id: number,              // Date.now() eller generateUniqueId()
    half: 1 | 2,
    mode: 'attack' | 'defense',
    player: { id, number, name, isKeeper },
    opponent: { id, number, name },
    keeper: { id, number, name, isKeeper },
    x: number,               // 0-100
    y: number,               // 0-100
    result: 'mål' | 'redning' | 'utenfor',
    zone: 'goal' | 'outside',
    timestamp: string,       // HH:MM:SS
    timerTimestamp: { minutes, seconds }  // Optional (advanced mode)
};
```

**Hvis du MÅ endre:**
1. Lag ny version: `event_v2`
2. Skriv migrasjon: `migrateEventV1ToV2()`
3. Test migrering på ALLE eksisterende kamper
4. Deploy med backward compatibility

#### APP State Structure

```javascript
// ✅ GODKJENT STRUKTUR - KUN additive changes tillatt
export const APP = {
    // Eksisterende felt - IKKE endre!
    currentUser: Object | null,
    page: string,
    homeTeam: string,
    awayTeam: string,
    matchDate: string,
    currentHalf: 1 | 2,
    players: Array,
    opponents: Array,
    events: Array,
    // ... resten

    // NYE felt må legges til på slutten med default verdi
    // newFeature: defaultValue
};
```

---

## 3. YELLOW ZONE - KREVER EKSPLISITT BEKREFTELSE

### 🟡 Regel: Spør brukeren før endring

Disse filene/funksjonene er **VIKTIGE**, men ikke direkte kritiske for data.
**MÅ ha eksplisitt bekreftelse fra bruker/product owner før endring.**

---

### 3.1 VIKTIGE FILER

| Fil | Hvorfor Viktig | Hva Kreves |
|-----|----------------|------------|
| **js/auth.js** | Authentication - brukertilgang | 10 unit tests + brukerbekreftelse |
| **js/players.js** | Player management | 8 unit tests + brukerbekreftelse |
| **js/utils.js** | Utility functions inkl. finishMatch | 12 unit tests + brukerbekreftelse |
| **js/events.js** | Global event delegation | Code review + smoke tests |
| **js/timer.js** | Match timer (advanced mode) | 8 unit tests + feature testing |

### 3.2 BEKREFTELSESPROSESS

**Før endring:**
1. Skriv detaljert beskrivelse av endringen
2. List opp potensielle breaking changes
3. Spør bruker: "Kan jeg endre [fil/funksjon] på denne måten?"
4. Vent på eksplisitt "JA" før du fortsetter

**Eksempel:**
```
Agent: "Jeg ser at finishMatch() i utils.js ikke håndterer timer cleanup
       korrekt. Kan jeg legge til følgende endring:

       if (APP.matchMode === 'advanced' && APP.timerState.intervalId) {
           clearInterval(APP.timerState.intervalId);
       }

       Denne endringen påvirker:
       - utils.js (4 linjer)
       - Krever testing av timer cleanup

       Kan jeg gjøre denne endringen?"

Bruker: "Ja, men skriv test først."

Agent: "Bekreftet. Skriver test UT-087 først..."
```

### 3.3 SPESIELLE REGLER for events.js

**Problem:** events.js er 562 linjer - vanskelig å vedlikeholde

**Regel:**
- ✅ Kan legge til NYE event handlers
- 🟡 Må spørre før ENDRING av eksisterende handlers
- ❌ IKKE refaktorer uten comprehensive tests (minimum 30 tests)

**Tillatt uten bekreftelse:**
```javascript
// ✅ TILLATT - Ny handler
case 'newFeature':
    handleNewFeature(e);
    break;
```

**Krever bekreftelse:**
```javascript
// 🟡 KREVER BEKREFTELSE - Endrer eksisterende
case 'registerShot':
    // Endring av eksisterende logikk
    const playerId = parseInt(e.target.dataset.playerId);
    if (!playerId) return;  // ← NY validering
    registerShot(playerId);
    break;
```

---

## 4. GREEN ZONE - TRYGT Å ENDRE

### 🟢 Regel: Kan endres fritt (med sunt fornuft)

Disse filene/funksjonene kan endres **uten tester eller bekreftelse**.

---

### 4.1 TRYGGE FILER

| Fil | Hvorfor Trygt | Begrensninger |
|-----|---------------|---------------|
| **ui/home.js** | Kun visning - ingen logikk | Ikke endre data-attributes |
| **ui/history.js** | Kun visning | Ikke endre data-attributes |
| **ui/modals.js** | Modal håndtering | Ikke endre modal IDs |
| **ui/event-feed.js** | Visuell event display | Ikke endre event struktur |
| **styles.css** | Styling | Ikke endre kritiske klasser (`.goal-marker`, etc) |

### 4.2 TILLATTE ENDRINGER

**Eksempler:**
```javascript
// ✅ TILLATT - Endre tekst
<h1>Handball Analytics</h1>
// til:
<h1>Håndball Analyse</h1>

// ✅ TILLATT - Endre styling
.goal-marker { background: green; }
// til:
.goal-marker { background: #00ff00; }

// ✅ TILLATT - Legge til ny CSS klasse
.new-feature { ... }

// ✅ TILLATT - Endre layout
<div class="stats">...</div>
// til:
<div class="stats new-layout">...</div>
```

**Men IKKE:**
```javascript
// ❌ IKKE TILLATT - Endre data-attributes
<button data-action="registerShot">
// til:
<button data-action="register-shot">  // Breaking change!

// ❌ IKKE TILLATT - Fjerne kritiske CSS klasser
<div class="goal-marker">
// til:
<div class="shot-marker">  // Breaking change!
```

---

## 5. COMMIT-REGLER

### 5.1 Commit Message Format

**PÅKREVD FORMAT:**
```
<type>(<scope>): <subject>

<body>

Tests: <test status>
Breaking: <yes/no>
```

**Types:**
- `feat`: Ny feature
- `fix`: Bug fix
- `refactor`: Code refactoring (ingen funksjonell endring)
- `test`: Legger til tester
- `docs`: Dokumentasjon
- `style`: Formatting, CSS
- `chore`: Maintenance

**Eksempler:**

✅ **GOD COMMIT:**
```
fix(shots): Add error handling to registerShot

- Added try-catch around APP.events.push()
- Rollback event on save failure
- Show error message to user

Tests: UT-017 passing
Breaking: no
```

✅ **GOD COMMIT:**
```
feat(timer): Add pause timer functionality

- Added pauseTimer() function
- Updated UI with pause button
- Tested in advanced mode

Tests: UT-096, IT-011 passing
Breaking: no
```

❌ **DÅRLIG COMMIT:**
```
fixed stuff
```

❌ **DÅRLIG COMMIT:**
```
refactor shots.js

Breaking: yes
Tests: none
```

### 5.2 Pre-Commit Checklist

**FØR HVER COMMIT:**

#### For RED ZONE changes:
- [ ] Alle relaterte unit tests passerer
- [ ] Relevante integration tests passerer
- [ ] Minst én E2E test passerer
- [ ] Code review godkjent
- [ ] Manual testing på staging

#### For YELLOW ZONE changes:
- [ ] Brukerbekreftelse mottatt
- [ ] Relaterte tests passerer
- [ ] Breaking changes dokumentert

#### For GREEN ZONE changes:
- [ ] Endringene er kun visuelt/tekstlig
- [ ] Ingen data-attributes endret
- [ ] Smoke test kjørt

#### For ALLE changes:
- [ ] Commit message følger format
- [ ] Ingen `console.log()` igjen
- [ ] Ingen commented-out code
- [ ] ESLint warnings fikset

---

## 6. REFACTORING-PROTOKOLL

### 6.1 Når Refactoring er Tillatt

**✅ TILLATT REFACTORING:**
- Endre variabelnavn for klarhet
- Ekstrahere små utility-funksjoner (<10 linjer)
- Legge til kommentarer
- Forbedre error messages

**🟡 KREVER PLAN + TESTER:**
- Splitte store funksjoner (>50 linjer)
- Endre arkitektur
- Flytte funksjoner mellom filer
- Endre dataflyt

**❌ FORBUDT UTEN COMPREHENSIVE TESTS:**
- Refaktorere events.js (562 linjer)
- Refaktorere shots.js kritiske funksjoner
- Endre cache implementation
- Endre persistence layer

### 6.2 Refactoring Plan Template

**Bruk denne template før refactoring:**

```markdown
# Refactoring Plan: [Fil/Funksjon]

## Motivasjon
Hvorfor må dette refaktoreres?

## Current State
- Fil: [filnavn]
- Funksjoner påvirket: [liste]
- Avhengigheter: [liste]

## Proposed Changes
1. [Endring 1]
2. [Endring 2]
...

## Impact Analysis
- Breaking changes: [ja/nei]
- Affected tests: [liste]
- Risk level: [lav/medium/høy]

## Testing Strategy
- [ ] Unit tests: [antall]
- [ ] Integration tests: [antall]
- [ ] E2E tests: [antall]

## Rollback Plan
Hvis noe går galt:
1. [Steg 1]
2. [Steg 2]

## Approval
- [ ] Product owner: [navn]
- [ ] Tech lead: [navn]
- [ ] QA: [navn]
```

### 6.3 Refactoring Faser

**FASE 1: Skriv Tester**
```
1. Identifiser all funksjonalitet som skal bevares
2. Skriv comprehensive tests (100% coverage av berørte funksjoner)
3. Verifiser at alle tester passerer
4. Commit: "test(scope): Add tests before refactoring"
```

**FASE 2: Refaktorer**
```
1. Gjør minste mulige endring
2. Kjør tester - ALLE må passere
3. Hvis tester feiler, reverter umiddelbart
4. Commit: "refactor(scope): [beskrivelse]"
5. Gjenta til ferdig
```

**FASE 3: Rydd Opp**
```
1. Fjern gammel code (dead code)
2. Oppdater dokumentasjon
3. Oppdater REVIEW.md hvis nødvendig
4. Commit: "chore(scope): Cleanup after refactoring"
```

---

## 7. GODKJENNINGSPROSESS

### 7.1 Hvem Kan Godkjenne Hva

| Zone | Godkjenning Påkrevd | Hvem Kan Godkjenne |
|------|--------------------|--------------------|
| **RED ZONE** | ✅ Ja | Product Owner + Tech Lead + Full test suite |
| **YELLOW ZONE** | ✅ Ja | Product Owner ELLER Tech Lead |
| **GREEN ZONE** | ❌ Nei | Ingen godkjenning nødvendig |

### 7.2 Pull Request Template

**Bruk denne template for PRs:**

```markdown
## Summary
[Kort beskrivelse av endringen]

## Zone Classification
- [ ] RED ZONE - Kritisk
- [ ] YELLOW ZONE - Viktig
- [ ] GREEN ZONE - Trygt

## Files Changed
- [fil1] - [type endring]
- [fil2] - [type endring]

## Tests
- [ ] Unit tests: [X/Y passing]
- [ ] Integration tests: [X/Y passing]
- [ ] E2E tests: [X/Y passing]
- [ ] Manual testing completed

## Breaking Changes
- [ ] Yes - [beskrivelse]
- [x] No

## Checklist
- [ ] Følger PROTECTION_RULES.md
- [ ] Commit messages følger format
- [ ] Tests passerer
- [ ] Dokumentasjon oppdatert
- [ ] Code review requested

## Rollback Plan
[Hvis noe går galt, hvordan ruller vi tilbake?]
```

---

## 8. ROLLBACK-PROSEDYRE

### 8.1 Når Skal Man Rollback?

**UMIDDELBAR ROLLBACK hvis:**
- ❌ Tester feiler i produksjon
- ❌ Brukerdata går tapt
- ❌ App crasher for brukere
- ❌ Firestore sync feiler
- ❌ Authentication slutter å virke

**PLANLAGT ROLLBACK hvis:**
- ⚠️ Performance degradering > 20%
- ⚠️ Brukere rapporterer bugs
- ⚠️ Error rate øker > 5%

### 8.2 Rollback Commands

**Git Rollback:**
```bash
# Finn commit hash for siste stabile versjon
git log --oneline

# Rollback til specifik commit
git revert <commit-hash>

# ELLER hard reset (FARLIG - mister commits)
git reset --hard <commit-hash>
git push --force
```

**Firebase Rollback:**
```bash
# List previous deploys
firebase hosting:versions:list

# Rollback til specific version
firebase hosting:rollback <version>
```

### 8.3 Post-Rollback Checklist

- [ ] Verifiser app fungerer i produksjon
- [ ] Sjekk at brukere kan logge inn
- [ ] Verifiser data integrity (sjekk random bruker)
- [ ] Notify stakeholders om rollback
- [ ] Analyser root cause
- [ ] Fikse issue i separate branch
- [ ] Skriv post-mortem

---

## 9. EXCEPTION HANDLING

### 9.1 Når Regler Kan Brytes

**UNNTAKSTILFELLER:**

1. **Critical Security Vulnerability**
   - Kan fikse umiddelbart selv i RED ZONE
   - Men: Skriv tester etterpå ASAP

2. **Data Loss Bug in Production**
   - Kan hotfix umiddelbart
   - Men: Full test suite etterpå

3. **Firebase API Changes (breaking)**
   - Må tilpasse koden
   - Men: Test grundig før deploy

**PROSESS FOR UNNTAK:**
1. Dokumenter hvorfor regelen brytes
2. Gjør minimal endring
3. Deploy hotfix
4. Skriv tester umiddelbart etter
5. Skriv post-mortem

---

## 10. EDUCATION & ONBOARDING

### 10.1 For Nye Utviklere

**Før du begynner å kode:**
1. Les REVIEW.md (30 min)
2. Les ARCHITECTURE.md (20 min)
3. Les TEST_PLAN.md (15 min)
4. Les PROTECTION_RULES.md (denne filen) (20 min)
5. Kjør `npm test` og se at alle tester passerer
6. Gjør en "safe" endring i GREEN ZONE som øvelse

**Første uke:**
- Kun GREEN ZONE endringer
- Observer hvordan andre jobber
- Stille spørsmål

**Etter én uke:**
- Kan gjøre YELLOW ZONE endringer med godkjenning
- Må pair med senior developer på RED ZONE

### 10.2 For AI-Agenter

**ABSOLUTTE REGLER:**

1. **LES PROTECTION_RULES.md først**
   Før du gjør NOEN kodeendring

2. **KLASSIFISER endringen**
   RED / YELLOW / GREEN?

3. **SPØ hvis usikker**
   Aldri "gå utifra at det er ok"

4. **SKRIV TESTER først for RED ZONE**
   Ikke engang foreslå endring før tester eksisterer

5. **DOKUMENTER alt**
   Commit messages, kommentarer, reasoning

**Eksempel på GOD AI-agent behavior:**
```
Agent: "Jeg ser en bug i registerShot() (shots.js:180).
       Dette er en RED ZONE funksjon.

       Før jeg foreslår en fix, må jeg:
       1. Skrive test som reproduserer buggen
       2. Verifisere at test feiler
       3. Fikse buggen
       4. Verifisere at test passerer
       5. Kjøre ALLE relaterte tester

       Skal jeg fortsette med denne prosessen?"

User: "Ja"

Agent: "Perfekt. Skriver test UT-017..."
```

---

## 11. ENFORCEMENT

### 11.1 Automated Checks

**Git Hooks (husky):**
```javascript
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Check commit message format
npx commitlint --edit $1

# Run linter
npm run lint

# Check for console.logs
if git diff --cached | grep -i "console.log"; then
    echo "❌ Remove console.log before committing"
    exit 1
fi

# For RED ZONE files, ensure tests exist
CHANGED_FILES=$(git diff --cached --name-only)
if echo "$CHANGED_FILES" | grep -E "shots.js|state.js|storage.js|firestore-storage.js|statistics.js"; then
    echo "⚠️  RED ZONE file changed. Running tests..."
    npm run test:unit
    if [ $? -ne 0 ]; then
        echo "❌ Tests failed. Cannot commit RED ZONE changes without passing tests."
        exit 1
    fi
fi
```

### 11.2 Code Review Checklist

**For Reviewers:**
```markdown
## Code Review Checklist

### Classification
- [ ] Zone identified: RED / YELLOW / GREEN

### If RED ZONE:
- [ ] All required tests exist and pass
- [ ] No breaking changes to data structures
- [ ] Error handling implemented
- [ ] Manual testing completed

### If YELLOW ZONE:
- [ ] User/owner approval documented
- [ ] Tests cover changes
- [ ] Breaking changes documented

### If GREEN ZONE:
- [ ] No data-attributes changed
- [ ] Smoke tests passed

### General:
- [ ] Commit message follows format
- [ ] No console.logs
- [ ] Documentation updated if needed
- [ ] PROTECTION_RULES.md followed
```

---

## 12. KONTAKT

### Spørsmål om Beskyttelsesregler

**Hvis du er usikker:**
1. Les denne filen på nytt
2. Sjekk REVIEW.md for kontekst
3. Still spørsmål til product owner
4. Når i tvil: SPØ før du gjør endring

**Hvis du finner en feil i reglene:**
1. Opprett issue: "PROTECTION_RULES: [beskrivelse]"
2. Foreslå endring
3. Diskuter med teamet

---

## APPENDIX A: QUICK REFERENCE

### Kan jeg endre...?

| Fil/Funksjon | Kan Jeg? | Hva Kreves? |
|--------------|----------|-------------|
| shots.js: registerShot() | ❌ Ikke uten tester | 18 unit + 3 integration tests |
| shots.js: handleGoalClick() | ❌ Ikke uten tester | 6 unit tests |
| state.js: invalidateStatsCache() | ❌ Ikke uten tester | 2 unit tests + all integration |
| storage.js: saveToLocalStorage() | ❌ Ikke uten tester | 10 unit + 5 integration tests |
| firestore-storage.js: * | ❌ Ikke uten tester | 15 unit + 5 integration tests |
| statistics.js: * | ❌ Ikke uten tester | 12 unit + 3 integration tests |
| auth.js: * | 🟡 Spør først | User approval + 10 tests |
| players.js: * | 🟡 Spør først | User approval + 8 tests |
| utils.js: * | 🟡 Spør først | User approval + 12 tests |
| events.js: nye handlers | ✅ Ja | Smoke test |
| events.js: eksisterende | 🟡 Spør først | Code review |
| ui/*.js (visning) | ✅ Ja | Ikke endre data-attrs |
| styles.css | ✅ Ja | Ikke endre kritiske klasser |

---

## APPENDIX B: EXAMPLES OF VIOLATIONS

### Violation #1: Endret RED ZONE uten tester

```javascript
// BEFORE (WORKING)
function registerShot(playerId) {
    APP.events.push(event);
    PERFORMANCE.invalidateStatsCache();
    saveToLocalStorage();
}

// AFTER (BROKEN - No tests written first!)
function registerShot(playerId) {
    saveToLocalStorage();  // Moved before events.push!
    APP.events.push(event);
    PERFORMANCE.invalidateStatsCache();
}

// RESULT: Race condition - stats cached before event added
// CONSEQUENCE: Wrong statistics shown to users
// PROPER FIX: Revert, write test, then make change
```

### Violation #2: Endret datastruktur uten migrasjon

```javascript
// BEFORE (WORKING)
const event = {
    x: 50,
    y: 50,
    result: 'mål'
};

// AFTER (BROKEN - Breaking change!)
const event = {
    coords: { x: 50, y: 50 },  // Changed structure!
    result: 'goal'  // Changed value!
};

// RESULT: All old events fail to render
// CONSEQUENCE: Data loss for existing users
// PROPER FIX: Implement migration OR keep backward compatibility
```

---

**Dokument versjon:** 1.0
**Sist oppdatert:** 2026-01-12
**Laget av:** Claude Code Agent

**HUSK:** Disse reglene eksisterer for å beskytte brukerdata. Når i tvil: SPØ FØRST!
