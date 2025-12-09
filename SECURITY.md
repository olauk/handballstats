# Firebase Sikkerhet

## 🔒 Er det trygt å ha Firebase API-nøkkel i public repo?

**JA!** Firebase API-nøkler er designet for å være offentlige. De fungerer annerledes enn tradisjonelle API-nøkler:

### Firebase API-nøkkel:
- ✅ Identifiserer bare hvilket Firebase-prosjekt du bruker
- ✅ Gir IKKE tilgang til data
- ✅ Må være offentlig for at frontend-appen skal fungere
- ✅ Brukes i alle produksjonsapper (React, Vue, Angular, etc.)

### Ekte sikkerhet kommer fra:
1. **Firestore Security Rules** (serversiden)
2. **Firebase Authentication** (kun innloggede brukere)
3. **Authorized Domains** (kun tillatte nettsteder)

## 🛡️ Sette opp Firestore Security Rules

### Steg 1: Gå til Firebase Console

1. Åpne [Firebase Console](https://console.firebase.google.com)
2. Velg prosjektet ditt: `handballstats-c80f3`

### Steg 2: Oppdater Firestore Rules

1. Klikk på **"Firestore Database"** i menyen til venstre
2. Gå til **"Rules"**-fanen
3. Erstatt innholdet med rules fra `firestore.rules`-filen
4. Klikk **"Publiser"**

Eller deploy direkte fra kommandolinjen:
```bash
firebase deploy --only firestore:rules
```

### Steg 3: Konfigurer Authorized Domains

1. Gå til **Authentication** i Firebase Console
2. Velg **Settings** → **Authorized domains**
3. Legg til disse domenene:
   - ✅ `localhost` (for lokal utvikling)
   - ✅ `handballstats-c80f3.web.app` (Firebase Hosting)
   - ✅ `handballstats-c80f3.firebaseapp.com` (alternativ URL)

Dette forhindrer at andre nettsteder kan bruke din Firebase-konfigurasjon.

## 📋 Hva Security Rules gjør

```
users/{userId}
  → Kun brukeren selv kan lese/skrive sin egen profil

matches/{matchId}
  → Kun eieren kan lese/skrive sine egne kamper
  → Andre brukere kan IKKE se dine kamper

sharedMatches/{shareId}
  → Kun brukere som er eksplisitt delt med kan lese
  → Kun eieren kan oppdatere/slette
```

## 🚫 Hva Security Rules blokkerer

- ❌ Uinnloggede brukere kan IKKE lese data
- ❌ Brukere kan IKKE se andre brukeres kamper
- ❌ Brukere kan IKKE endre andre brukeres data
- ❌ Ingen kan slette data de ikke eier

## ✅ Test Security Rules

Etter at du har deployet rules, kan du teste dem:

```bash
firebase emulators:start
```

Eller test direkte i Firebase Console:
1. Gå til **Firestore Database** → **Rules**
2. Klikk på **"Rules Playground"**
3. Test forskjellige scenarioer

## 🔐 Ekstra sikkerhetstiltak (valgfritt)

### 1. Firebase App Check
Beskytter mot misbruk fra bots og automatiserte angrep:

```bash
firebase apps:create web --display-name "Handball Analytics"
firebase appcheck:configure
```

### 2. Aktivere reCAPTCHA
I Firebase Console:
- Authentication → Settings → App verification
- Aktiver reCAPTCHA Enterprise

### 3. Rate Limiting
Firebase har innebygd rate limiting, men du kan også:
- Bruke Cloud Functions for ekstra validering
- Sette opp Firestore quotas

## 🎯 Oppsummering

**Trygt å dele:**
- ✅ Firebase API-nøkkel
- ✅ Firebase konfigurasjon
- ✅ Hele `firebase-config.js`-filen

**ALDRI del:**
- ❌ Service Account private keys (`.json`-filer)
- ❌ Firebase Admin SDK credentials
- ❌ Cloud Function secrets
- ❌ Database passwords (hvis du bruker andre databaser)

## 📚 Les mer

- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/basics)
- [Understanding Firebase API Keys](https://firebase.google.com/docs/projects/api-keys)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)

---

**Konklusjon:** Ditt prosjekt er trygt å ha på GitHub! Bare sørg for å deploye Security Rules. 🔒✅
