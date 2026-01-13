# Test Guide - Handball Analytics

Dette dokumentet beskriver hvordan du kjører, skriver og tolker tester for Handball Analytics-applikasjonen.

## Innholdsfortegnelse

1. [Kjøre tester](#kjøre-tester)
2. [Skrive nye tester](#skrive-nye-tester)
3. [Tolke test-resultater](#tolke-test-resultater)
4. [Testing før deployment](#testing-før-deployment)
5. [Pre-commit hooks](#pre-commit-hooks)
6. [Test Coverage](#test-coverage)

---

## Kjøre tester

### Grunnleggende kommandoer

```bash
# Kjør alle tester (watch mode - tester kjører automatisk ved endringer)
npm test

# Kjør alle tester én gang
npm run test:run

# Kjør tester med UI (visuell test-runner i nettleser)
npm run test:ui

# Kjør tester med coverage rapportering
npm run test:coverage
```

### Kjøre spesifikke tester

```bash
# Kjør kun en spesifikk testfil
npx vitest run tests/unit/shot-registration.test.js

# Kjør tester som matcher et mønster
npx vitest run --grep "skal registrere skudd"

# Kjør kun unit tests
npx vitest run tests/unit/

# Kjør kun integration tests
npx vitest run tests/integration/
```

---

## Skrive nye tester

### Test-struktur

Tester er organisert i følgende struktur:

```
tests/
├── unit/                    # Unit tests - tester isolerte funksjoner
│   ├── shot-registration.test.js
│   └── statistics.test.js
├── integration/             # Integrasjonstester - tester hele flyten
│   └── game-flow.test.js
└── helpers/                 # Hjelpefunksjoner for testing
    ├── setup.js            # Global test setup
    └── test-utils.js       # Mock-funksjoner og utilities
```

### Eksempel på en enkel test

```javascript
import { describe, it, expect } from 'vitest';
import { getTeamGoals } from '../../js/statistics.js';

describe('Statistics - getTeamGoals', () => {
  it('skal telle hjemmelag mål korrekt', () => {
    // Arrange - Sett opp testdata
    const events = [
      { mode: 'attack', result: 'mål' },
      { mode: 'attack', result: 'mål' },
      { mode: 'attack', result: 'redning' },
    ];

    // Act - Kjør funksjonen som testes
    const goals = getTeamGoals('home', events);

    // Assert - Verifiser resultatet
    expect(goals).toBe(2);
  });
});
```

### Best practices for testing

1. **Følg AAA-mønsteret**: Arrange (setup) → Act (kjør) → Assert (verifiser)
2. **Én ting per test**: Test kun én ting i hver test
3. **Beskrivende navn**: Bruk beskrivende testnavn som forklarer hva som testes
4. **Isolering**: Tester skal være uavhengige av hverandre
5. **Mock eksterne avhengigheter**: Bruk mocks for localStorage, Firebase, etc.

### Bruke test utilities

Vi har laget hjelpefunksjoner for testing i `tests/helpers/test-utils.js`:

```javascript
import { createMockPlayer, createMockEvent, createMockAppState } from '../helpers/test-utils.js';

// Lag en mock spiller
const player = createMockPlayer({ name: 'Test Spiller', number: 7 });

// Lag en mock event
const event = createMockEvent({ result: 'mål', player: player });

// Lag en mock APP state
const mockState = createMockAppState({ currentHalf: 2 });
```

---

## Tolke test-resultater

### Vellykket test-kjøring

```
✓ tests/unit/shot-registration.test.js (8)
  ✓ Shot Registration - handleGoalClick (4)
    ✓ skal registrere skudd innenfor mål med korrekte koordinater
    ✓ skal registrere skudd utenfor mål
    ✓ skal kreve keeper i forsvarsmodus
    ✓ skal auto-velge keeper hvis ingen er valgt

Test Files  3 passed (3)
     Tests  23 passed (23)
```

Dette betyr at alle tester har kjørt vellykket! ✅

### Feilende test

```
✗ Shot Registration - registerShot (1)
  ✗ skal registrere et gyldig skudd med mål
    AssertionError: expected 0 to be 1

      Expected: 1
      Received: 0

      at tests/unit/shot-registration.test.js:123:23
```

Dette betyr at testen forventet verdien `1`, men fikk `0`. Sjekk:
1. Er funksjonen implementert korrekt?
2. Er test-dataene korrekte?
3. Er mockene satt opp riktig?

### Coverage rapportering

Etter å ha kjørt `npm run test:coverage`, vil du se noe slikt:

```
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
All files             |   85.32 |    78.45 |   82.14 |   85.67 |
 shots.js             |   92.15 |    85.71 |   90.00 |   92.50 |
 statistics.js        |   100.0 |   100.0  |   100.0 |   100.0 |
```

- **Stmts** (Statements): Andel av kodelinjer som ble kjørt
- **Branch**: Andel av if/else branches som ble testet
- **Funcs** (Functions): Andel av funksjoner som ble kalt
- **Lines**: Andel av linjer som ble kjørt

**Mål**: Minimum 70% coverage for kritiske filer.

---

## Testing før deployment

Før du deployer til produksjon, kjør følgende sjekkliste:

### 1. Kjør alle tester
```bash
npm run test:run
```
✅ Alle tester må passere

### 2. Kjør linting
```bash
npm run lint
```
✅ Ingen ESLint-feil

### 3. Sjekk formattering
```bash
npm run format:check
```
✅ Koden følger Prettier-reglene

### 4. Kjør coverage
```bash
npm run test:coverage
```
✅ Minimum 70% coverage for kritiske filer

### 5. Test i nettleser
- Åpne applikasjonen i nettleser
- Test grunnleggende funksjonalitet manuelt
- Verifiser at ingen console errors

---

## Pre-commit hooks

Vi bruker **Husky** for å kjøre tester automatisk før hver commit.

### Hva skjer ved commit?

Når du kjører `git commit`, vil følgende skje automatisk:

1. **Lint staged files**: ESLint kjører på alle endrede .js filer
2. **Format files**: Prettier formatterer alle endrede filer
3. **Run tests**: Alle tester kjøres

Hvis noen av disse stegene feiler, vil committen bli blokkert. ❌

### Hvordan fikse en blokkert commit?

```bash
# Hvis linting feiler
npm run lint:fix

# Hvis formattering feiler
npm run format

# Hvis tester feiler
npm test
# Fiks testene basert på feilmeldingene

# Prøv å committe igjen
git commit -m "Din commit-melding"
```

### Omgå pre-commit hooks (IKKE ANBEFALT)

Hvis du virkelig må committe uten å kjøre hooks:
```bash
git commit --no-verify -m "Din commit-melding"
```

⚠️ **ADVARSEL**: Dette bør KUN brukes i nødstilfeller!

---

## Test Coverage

### Se detaljert coverage rapport

Etter å ha kjørt `npm run test:coverage`, åpne:
```
coverage/index.html
```

Dette viser deg:
- Hvilke linjer som er dekket av tester (grønn)
- Hvilke linjer som IKKE er dekket av tester (rød)
- Hvilke branches som mangler tester (gul)

### Forbedre coverage

Hvis coverage er under 70% for en fil:

1. Identifiser linjer som ikke er dekket (se coverage/index.html)
2. Skriv tester for disse linjene
3. Kjør `npm run test:coverage` igjen
4. Gjenta til du når 70%+

---

## Feilsøking

### Tester feiler med "Cannot find module"

**Problem**: Dependencies er ikke installert
**Løsning**:
```bash
npm install
```

### Tester henger seg opp

**Problem**: Watch mode venter på endringer
**Løsning**: Bruk `npm run test:run` i stedet for `npm test`

### Mock-funksjoner fungerer ikke

**Problem**: Mocks blir ikke resatt mellom tester
**Løsning**: Sjekk at `tests/helpers/setup.js` blir kjørt. Den resetter alle mocks i `beforeEach`.

### DOM errors i tester

**Problem**: jsdom environment er ikke satt opp
**Løsning**: Verifiser at `vitest.config.js` har `environment: 'jsdom'`

---

## Videre lesning

- [Vitest dokumentasjon](https://vitest.dev/)
- [ESLint regler](https://eslint.org/docs/rules/)
- [Prettier konfigurasjon](https://prettier.io/docs/en/configuration.html)
- [Husky dokumentasjon](https://typicode.github.io/husky/)

---

**Spørsmål?** Kontakt teamet eller opprett en issue i prosjektets repository.
