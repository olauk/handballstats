# Handball Analytics - Protection and Security Rules

**Version:** 3.1
**Dato:** 2026-01-20
**Status:** Production

---

## 📋 Innholdsfortegnelse

1. [Oversikt](#oversikt)
2. [Firebase Security Rules](#firebase-security-rules)
3. [Autentiseringsregler](#autentiseringsregler)
4. [Data Access Control](#data-access-control)
5. [Input Validation](#input-validation)
6. [XSS og Injection Protection](#xss-og-injection-protection)
7. [Data Privacy](#data-privacy)
8. [Debug Logging og Personvern](#debug-logging-og-personvern)
9. [Rate Limiting](#rate-limiting)
10. [Beste Praksis](#beste-praksis)
11. [Kjente Sårbarheter og Mitigering](#kjente-sårbarheter-og-mitigering)

---

## Oversikt

Dette dokumentet definerer sikkerhetsregler, beskyttelsesmekanismer og beste praksis for Handball Analytics. Alle regler må følges for å sikre brukersikkerhet og dataintegritet.

### Sikkerhetsprinsipper

1. **Defense in Depth** - Multiple lag med sikkerhet
2. **Least Privilege** - Minimal nødvendig tilgang
3. **Privacy by Design** - Personvern innebygd fra starten
4. **Secure by Default** - Sikre standardinnstillinger
5. **Fail Securely** - Feil skal ikke kompromittere sikkerhet

---

## Firebase Security Rules

### Firestore Security Rules

**Fil:** `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - kun egen bruker
    match /users/{userId} {
      // Kun autentisert bruker kan lese/skrive egen profil
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // User settings - kun egen bruker
      match /settings {
        allow read, write: if request.auth.uid == userId;
      }

      // Team rosters - kun egen bruker (FUTURE)
      match /teamRosters/{rosterId} {
        allow read, write: if request.auth.uid == userId;
      }

      // Matches collection - kun egen bruker
      match /matches/{matchId} {
        allow read: if request.auth.uid == userId;
        allow write: if request.auth.uid == userId
                     && request.resource.data.ownerId == userId;
        allow delete: if request.auth.uid == userId
                      && resource.data.ownerId == userId;
      }

      // Debug logs - kun egen bruker (development mode)
      match /debug_logs/{logId} {
        allow read: if request.auth.uid == userId;
        allow write: if request.auth.uid == userId
                     && request.resource.data.userId == userId;
        // Auto-delete after 30 days (configured in Firestore)
      }

      // Error logs - kun egen bruker (critical errors)
      match /errors/{errorId} {
        allow read: if request.auth.uid == userId;
        allow write: if request.auth.uid == userId
                     && request.resource.data.userId == userId;
      }
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Nøkkelregler

1. **Ingen public data** - All data krever autentisering
2. **User isolation** - Brukere kan kun se egne data
3. **Owner verification** - `ownerId` må matche `userId`
4. **Delete protection** - Kan kun slette egen data
5. **Default deny** - Alt som ikke eksplisitt tillates, nektes

---

## Autentiseringsregler

### Passordkrav

**Definert i:** `js/auth.js:validatePassword()`

```javascript
const passwordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  // Future: requireSpecialChar: true
};
```

**Implementering:**
```javascript
export function validatePassword(password) {
  const errors = [];

  if (!password || password.length === 0) {
    errors.push('Passord er påkrevd');
    return errors;
  }

  if (password.length < 8) {
    errors.push('Passordet må være minst 8 tegn');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Passordet må inneholde minst én stor bokstav');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Passordet må inneholde minst én liten bokstav');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Passordet må inneholde minst ett tall');
  }

  return errors;
}
```

**Fremtidige forbedringer:**
- [ ] Sjekk mot common passwords list
- [ ] Sjekk mot brukerens e-post/navn
- [ ] Spesialtegn krav
- [ ] Password strength meter i UI

### E-post Validering

**Definert i:** `js/auth.js:validateEmail()`

```javascript
export function validateEmail(email) {
  if (!email || email.trim().length === 0) {
    return 'E-postadresse er påkrevd';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Ugyldig e-postadresse';
  }

  return null;
}
```

**Sikkerhet:**
- ✅ Ingen whitespace tillatt
- ✅ Må ha @ og domene
- ✅ Firebase validerer ekstra på server-side

### Session Management

**Firebase Auth Persistence:**
```javascript
// Default: LOCAL persistence
// Session overlever:
// ✅ Page refresh
// ✅ Browser close/reopen
// ✅ System restart

// Session invalideres ved:
// ❌ Explicit logout
// ❌ Token expiration (Firebase managed)
// ❌ Password change
```

**Auth State Observer:**
```javascript
auth.onAuthStateChanged(async (user) => {
  if (user) {
    // User signed in - load profile
    // Verify token validity (Firebase automatic)
  } else {
    // User signed out - redirect to login
    APP.currentUser = null;
    APP.page = 'login';
  }
});
```

---

## Data Access Control

### Principle: User Data Isolation

**Regel:** En bruker kan KUN lese/skrive sine egne data

**Implementering:**

#### Frontend Check (Defensive Programming)
```javascript
// Before any Firestore operation
if (!auth.currentUser) {
  console.error('⛔ Unauthorized: No user signed in');
  return;
}

const userId = auth.currentUser.uid;
```

#### Backend Enforcement (Firestore Rules)
```
allow read, write: if request.auth.uid == userId;
```

**Consequence:** Selv om frontend er kompromittert, kan ikke angriper lese/skrive andres data.

### Document Ownership

**Regel:** Alle dokumenter må ha `ownerId` felt

**Implementering:**
```javascript
// When creating document
await db.collection('users').doc(userId).collection('matches').add({
  ...matchData,
  ownerId: userId, // REQUIRED
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
});
```

**Firestore Rule:**
```
allow write: if request.resource.data.ownerId == userId;
```

### Cross-Document References

**Regel:** Ingen cross-user references tillatt

**Forbudt:**
```javascript
// ❌ BAD: Reference to other user's data
{
  matchId: 'abc123',
  sharedWith: ['otherUserId'] // NOT ALLOWED
}
```

**Tillatt (Future):**
```javascript
// ✅ GOOD: Explicit sharing with permission
{
  matchId: 'abc123',
  ownerId: userId,
  shares: [
    {userId: 'otherUserId', role: 'viewer', acceptedAt: timestamp}
  ]
}
// Requires: New security rules for shared access
```

---

## Input Validation

### Player Input Validation

**Definert i:** `js/players.js`

```javascript
function validatePlayerInput(number, name) {
  const errors = [];

  // Number validation
  const num = parseInt(number);
  if (isNaN(num) || num < 1 || num > 99) {
    errors.push('Draktnummer må være mellom 1 og 99');
  }

  // Name validation
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    errors.push('Spillernavn er påkrevd');
  }
  if (trimmedName.length > 50) {
    errors.push('Spillernavn må være under 50 tegn');
  }

  // Duplicate number check
  const existingPlayer = APP.players.find(p =>
    p.number === num && p.id !== editingPlayerId
  );
  if (existingPlayer) {
    errors.push(`Draktnummer ${num} er allerede i bruk`);
  }

  return errors;
}
```

**Regel:**
- Draktnummer: 1-99 (integer)
- Navn: 1-50 tegn, trimmet
- Ingen duplikate nummer per lag
- isKeeper: boolean only

### Team Name Validation

```javascript
function validateTeamName(name) {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return 'Lagnavn er påkrevd';
  }

  if (trimmed.length > 50) {
    return 'Lagnavn må være under 50 tegn';
  }

  // Sanitize HTML special chars
  const sanitized = trimmed
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  return null;
}
```

### Date Validation

```javascript
function validateMatchDate(dateString) {
  // Format: YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateRegex.test(dateString)) {
    return 'Ugyldig datoformat (bruk YYYY-MM-DD)';
  }

  const date = new Date(dateString);
  const today = new Date();
  const maxFutureDate = new Date();
  maxFutureDate.setFullYear(today.getFullYear() + 1);

  if (date > maxFutureDate) {
    return 'Dato kan ikke være mer enn 1 år frem i tid';
  }

  return null;
}
```

---

## XSS og Injection Protection

### HTML Injection Prevention

**Regel:** ALDRI bruk `innerHTML` med user input uten sanitering

**Sikker praksis:**

```javascript
// ❌ USIKKER
element.innerHTML = `<div>${userName}</div>`;

// ✅ SIKKER
element.textContent = userName;

// ✅ SIKKER (hvis HTML må brukes)
element.innerHTML = `<div>${escapeHtml(userName)}</div>`;

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
```

### SQL Injection

**Status:** Ikke relevant - Firestore er NoSQL og parametrisert

**Firestore sikkerhet:**
```javascript
// ✅ Automatisk sikker - Firestore escaper all input
db.collection('users').doc(userId).set({
  name: userInput // Safely handled by Firestore
});
```

### JavaScript Injection

**Regel:** ALDRI bruk `eval()` eller `Function()` med user input

**Forbudt:**
```javascript
// ❌ FARLIG
eval(userInput);
new Function(userInput)();
setTimeout(userInput, 1000);
```

**Tillatt:**
```javascript
// ✅ TRYGT
const value = JSON.parse(userInput); // Try-catch required
```

### File Upload Validation

**Definert i:** `js/players.js:loadPlayersFromFile()`, `js/team-roster.js:loadTeamRosterFromFile()`

```javascript
function validateFileUpload(file) {
  // File type check
  const allowedTypes = [
    'application/json',
    'text/plain',
    'text/csv'
  ];

  const allowedExtensions = ['.json', '.txt', '.csv'];
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

  if (!allowedExtensions.includes(extension)) {
    throw new Error('Kun .json, .txt og .csv filer er tillatt');
  }

  // File size check (max 1MB)
  const maxSize = 1024 * 1024; // 1MB
  if (file.size > maxSize) {
    throw new Error('Filen er for stor (maks 1MB)');
  }

  return true;
}
```

**File Parsing:**
```javascript
// JSON parsing with error handling
try {
  const data = JSON.parse(fileContent);
  // Validate structure
  if (!Array.isArray(data)) {
    throw new Error('Ugyldig format: må være array');
  }
  // Validate each item
  data.forEach(validatePlayerStructure);
} catch (error) {
  console.error('❌ File parsing error:', error);
  alert('Kunne ikke lese filen: ' + error.message);
  return;
}
```

### Race Condition Protection

**File Import Lock:**
```javascript
// Prevent parallel file imports
if (APP.isImportingFile) {
  alert('Vennligst vent til forrige import er ferdig');
  return;
}

APP.isImportingFile = true;
try {
  // Import logic
} finally {
  APP.isImportingFile = false;
}
```

---

## Data Privacy

### Personopplysninger

**Data som lagres:**
- ✅ **Bruker:** Navn, e-post, hjemmelag
- ✅ **Spillere:** Navn, draktnummer (IKKE fødselsdato, adresse, etc.)
- ✅ **Kamper:** Lagnavn, dato, statistikk

**Data som IKKE lagres:**
- ❌ Fødselsnummer
- ❌ Adresse
- ❌ Telefonnummer
- ❌ Betalingsinformasjon
- ❌ IP-adresser (utover Firebase standard logging)

### GDPR Compliance

**Brukerrettigheter:**

1. **Rett til innsyn:**
   - Bruker kan se alle sine data i appen
   - Export funksjon: 💾 Eksporter (JSON format)

2. **Rett til sletting:**
   - Bruker kan slette egne kamper
   - Bruker kan slette egne spillerstall
   - Future: "Slett konto" funksjon

3. **Rett til dataportabilitet:**
   - Export funksjon gir JSON-format
   - Kan importeres til andre systemer

4. **Rett til korrigering:**
   - Bruker kan redigere spillere
   - Bruker kan redigere lagnavn, dato
   - Bruker kan slette feil events

### Data Retention

**Aktiv data:**
- Lagres så lenge bruker har konto
- Bruker kan slette når de vil

**Debug logs:**
- Auto-slettes etter 30 dager
- Firestore TTL policy (Time To Live)

**Error logs:**
- Lagres permanent for feilsøking
- Bruker kan be om sletting

**Future:**
- Inaktive kontoer (>2 år): Send varsel før sletting
- "Eksporter alle mine data" funksjon
- "Slett konto" funksjon

---

## Debug Logging og Personvern

### Logging Modes

**Production Mode (Default):**
- ✅ Kun kritiske feil logges
- ❌ Ingen detaljert user activity logging
- ✅ Minimalt data footprint
- ✅ Spart Firestore kostnader

**Development Mode:**
- ✅ Full detaljert logging
- ✅ All user actions tracked
- ⚠️ Høyere Firestore kostnader
- ⚠️ Mer persondata lagret midlertidig

### Debug Mode Aktivering

**Automatisk aktivert:**
- `localhost` - Development environment

**Manuell aktivering:**
```javascript
// URL parameter
https://handballstats-c80f3.web.app/?debug=true

// localStorage
localStorage.setItem('debugMode', 'true');
```

### PII (Personally Identifiable Information) i Logs

**Regel:** ALDRI logg sensitive personopplysninger

**Tillatt å logge:**
- ✅ User ID (anonymisert)
- ✅ Action type (e.g., "shotRegistered")
- ✅ Timestamps
- ✅ Error messages (sanitized)

**FORBUDT å logge:**
- ❌ Passord
- ❌ E-postadresser i full text (bruk hash)
- ❌ Fødselsnumre
- ❌ Betalingsinformasjon

**Implementering:**
```javascript
// ✅ GOOD
debugLog('Shot registered', {
  userId: hashUserId(auth.currentUser.uid),
  action: 'registerShot',
  timestamp: Date.now()
});

// ❌ BAD
debugLog('Shot registered', {
  email: user.email, // FORBUDT
  password: user.password, // FARLIG
});
```

---

## Rate Limiting

### Firebase Rate Limits

**Firestore:**
- Write operations: 1 per second per document (recommended)
- Read operations: No hard limit, men kostnad per read

**Implementering:**
- ✅ Debounced saves (300ms localStorage, 1000ms Firestore)
- ✅ Batch operations when possible
- ✅ Cache reads to avoid redundant queries

### Auth Rate Limits

**Firebase Auth:**
- Login attempts: ~100 per hour per IP (Firebase managed)
- Password reset: ~5 per hour per email (Firebase managed)

**Brukergrensesnitt:**
- Vis loading state during operations
- Disable buttons during processing
- User-friendly error for rate limit exceeded

### Client-Side Throttling

**Debounced Functions:**
```javascript
// localStorage: 300ms debounce
let saveTimeout = null;
export function saveToLocalStorage() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    localStorage.setItem('handballApp', JSON.stringify(APP));
  }, 300);
}

// Firestore: 1000ms debounce
let firestoreTimeout = null;
export function saveMatchToFirestoreDebounced() {
  clearTimeout(firestoreTimeout);
  firestoreTimeout = setTimeout(() => {
    saveMatchToFirestore();
  }, 1000);
}
```

---

## Beste Praksis

### Sikker Kodeskriving

**1. Input Validation:**
```javascript
// Alltid valider user input
function processUserInput(input) {
  // Validate
  if (!isValid(input)) {
    console.error('Invalid input');
    return;
  }

  // Sanitize
  const sanitized = sanitize(input);

  // Process
  processData(sanitized);
}
```

**2. Error Handling:**
```javascript
// Alltid bruk try-catch for async operations
try {
  await riskyOperation();
} catch (error) {
  console.error('Operation failed:', error);
  // Log error (without sensitive data)
  logError(sanitizeError(error));
  // Show user-friendly message
  alert('Noe gikk galt. Prøv igjen.');
}
```

**3. State Management:**
```javascript
// ALDRI mutate state directly
// ❌ BAD
APP.players.push(newPlayer);

// ✅ GOOD
function addPlayer(player) {
  // Validate
  if (!validatePlayer(player)) return;

  // Update state
  APP.players.push(player);

  // Invalidate cache
  PERFORMANCE.invalidateStatsCache();

  // Save
  saveToLocalStorage();

  // Re-render
  render();
}
```

### Testing Sikkerhet

**Manuell Testing Checklist:**

- [ ] Prøv å registrere med svakt passord
- [ ] Prøv å registrere med ugyldig e-post
- [ ] Prøv å laste opp stor fil (>1MB)
- [ ] Prøv å laste opp feil filtype (.exe, .php)
- [ ] Prøv å injisere HTML i navn-felter
- [ ] Prøv å legge inn negative draktnummer
- [ ] Prøv å legge inn draktnummer >99
- [ ] Prøv å laste inn malformed JSON
- [ ] Prøv å få tilgang til annen brukers data (via console)

**Future: Automated Security Tests**
- [ ] Unit tests for validation functions
- [ ] Integration tests for auth flow
- [ ] E2E tests for security scenarios

---

## Kjente Sårbarheter og Mitigering

### 1. localStorage Data Exposure

**Sårbarhet:**
- localStorage er ikke kryptert
- Kan leses av JavaScript i samme origin
- Kan leses hvis bruker har fysisk tilgang til device

**Mitigering:**
- ✅ Lagrer kun ikke-sensitive data
- ✅ Passord lagres ALDRI lokalt
- ✅ Auth tokens managed av Firebase (httpOnly cookies)
- ⚠️ Future: Krypter sensitive felt i localStorage

**Anbefaling:**
```javascript
// Future implementation
function saveToLocalStorage() {
  const encryptedData = encrypt(JSON.stringify(APP), getEncryptionKey());
  localStorage.setItem('handballApp', encryptedData);
}
```

### 2. XSS via Player Names

**Sårbarhet:**
- Spillernavn kan inneholde HTML/JavaScript
- Hvis renderet med innerHTML: XSS mulig

**Mitigering:**
- ✅ Bruker textContent for user data
- ✅ Escaper HTML special characters
- ✅ Input validation (max length)

**Status:** ✅ Mitigert

### 3. File Upload Attacks

**Sårbarhet:**
- Malicious fil kan crashes app
- Very large files kan DoS browser

**Mitigering:**
- ✅ File type whitelist (.json, .txt, .csv)
- ✅ File size limit (1MB)
- ✅ Try-catch around parsing
- ✅ Validate structure after parsing

**Status:** ✅ Mitigert

### 4. Race Conditions

**Sårbarhet:**
- Rapid file imports kan cause duplicate IDs
- Parallel state updates kan corrupt data

**Mitigering:**
- ✅ File import lock (`APP.isImportingFile`)
- ✅ Unique ID generator with collision detection
- ✅ Debounced saves to avoid conflicts

**Status:** ✅ Mitigert

### 5. Firestore Cost Explosion

**Sårbarhet:**
- Malicious user kan spam writes
- Debug mode kan cost mye i production

**Mitigering:**
- ✅ Debounced Firestore writes (1000ms)
- ✅ Debug mode default OFF in production
- ✅ Manual activation required
- ⚠️ Future: Rate limiting per user

**Status:** ⚠️ Delvis mitigert (trenger server-side rate limiting)

### 6. Team Roster Data Loss

**Sårbarhet:**
- savedTeams[] ikke synkronisert til Firestore
- Data tapt ved device switch eller cache clear

**Mitigering:**
- ⚠️ Warning til bruker om backup
- ⚠️ Export funksjon for manual backup
- 🔜 Future: Sync til Firestore (se STORAGE-ANALYSIS-REPORT.md)

**Status:** ⚠️ Kjent issue - fix planlagt i Fase 2

---

## Konklusjon

Handball Analytics følger moderne sikkerhetsprinsipper med flere lag av beskyttelse:

**Implementerte Beskyttelser:**
- ✅ Firebase Auth med sterke passordkrav
- ✅ Firestore security rules (user isolation)
- ✅ Input validation på client-side
- ✅ XSS prevention (escaping, textContent)
- ✅ File upload validation
- ✅ Race condition protection
- ✅ Debounced saves (cost optimization)
- ✅ Privacy-conscious logging

**Kjente Begrensninger:**
- ⚠️ localStorage ikke kryptert (lav risiko: ingen sensitive data)
- ⚠️ Ingen server-side rate limiting (Firebase managed for auth)
- ⚠️ Team rosters ikke synkronisert til cloud (data loss risk)

**Neste Steg:**
1. Implementer team roster sync til Firestore (Fase 2)
2. Legg til automated security tests
3. Implementer "Slett konto" funksjon (GDPR)
4. Vurder localStorage encryption for ekstra sikkerhet
5. Implementer server-side rate limiting (Firebase Functions)

**Ansvar:**
- **Utvikler:** Følg disse reglene i all ny kode
- **Code Review:** Verifiser at security rules følges
- **Testing:** Test sikkerhet ved hver release
- **Brukere:** Hold passord hemmelig, ikke del konto

---

**🔒 Sikkerhet er alles ansvar**

**Se også:**
- **DEVELOPMENT_RULES.md** - Regler for kodeendringer (RED/YELLOW/GREEN zones)
- **ARCHITECTURE.md** - System architecture and implementation details
- **TEST_GUIDE.md** - Testing guide and best practices
