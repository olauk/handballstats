# Deploy til Firebase Hosting

Denne guiden viser hvordan du deployer Handball Analytics til Firebase Hosting.

## Forutsetninger

Firebase CLI må være installert. Hvis du ikke har det installert:

```bash
npm install -g firebase-tools
```

## Steg-for-steg Deploy

### 1. Logg inn på Firebase

Første gang må du logge inn på Firebase med din Google-konto:

```bash
firebase login
```

Dette vil åpne en nettleser hvor du logger inn med Google-kontoen du brukte til å opprette Firebase-prosjektet.

### 2. Verifiser prosjekt-tilkobling

Sjekk at du er koblet til riktig Firebase-prosjekt:

```bash
firebase projects:list
```

Du skal se `handballstats-c80f3` i listen.

### 3. Deploy appen og sikkerhet

**VIKTIG:** Første gang må du deploye både hosting og Firestore security rules!

```bash
firebase deploy
```

Dette deployer:
- ✅ Hosting (nettsiden)
- ✅ Firestore Security Rules (databse-sikkerhet)

**Påfølgende deployments** (kun nettside):

```bash
firebase deploy --only hosting
```

**Kun oppdatere security rules:**

```bash
firebase deploy --only firestore:rules
```

### 4. Åpne appen

Etter vellykket deploy vil du få en hosting URL, f.eks:

```
https://handballstats-c80f3.web.app
```

Du kan også åpne appen direkte med:

```bash
firebase open hosting:site
```

## Vanlige kommandoer

- **Lokal testing**: `firebase serve` (kjører lokal server på http://localhost:5000)
- **Se deploy-historikk**: `firebase hosting:channel:list`
- **Logg ut**: `firebase logout`

## Automatisk deploy ved endringer

Hver gang du gjør endringer i koden og vil oppdatere nettsiden:

```bash
git add .
git commit -m "Beskrivelse av endringer"
git push
firebase deploy --only hosting
```

## Feilsøking

### "Project not found"
Kjør: `firebase use handballstats-c80f3`

### "Permission denied"
Sørg for at du er logget inn med riktig Google-konto: `firebase login --reauth`

### Caching-problemer
Firebase bruker CDN-caching. Hvis endringer ikke vises umiddelbart:
- Hard refresh i nettleseren (Ctrl+Shift+R / Cmd+Shift+R)
- Vent noen minutter på at CDN oppdateres

## Din Firebase Hosting URL

Appen vil være tilgjengelig på:
- **Produksjon**: https://handballstats-c80f3.web.app
- **Alternativ URL**: https://handballstats-c80f3.firebaseapp.com

## Sikkerhet 🔒

### Firebase Hosting inkluderer automatisk:
- ✅ HTTPS/SSL-sertifikat
- ✅ Globalt CDN (Content Delivery Network)
- ✅ DDoS-beskyttelse
- ✅ Gratis for opp til 10 GB lagring og 360 MB/dag trafikk

### Firestore Security Rules:
Prosjektet inkluderer `firestore.rules` som sikrer at:
- ✅ Kun innloggede brukere kan se data
- ✅ Brukere kan bare se sine egne kamper
- ✅ Ingen kan endre andres data
- ✅ Beskyttelse mot uautorisert tilgang

**Les mer:** Se `SECURITY.md` for detaljert sikkerhetsinformasjon og beste praksis.

### Er det trygt å ha Firebase API-nøkkel i GitHub?
**JA!** Firebase API-nøkler er designet for å være offentlige. Sikkerheten kommer fra Firestore Security Rules og Authentication, ikke fra å skjule API-nøkkelen. Les mer i `SECURITY.md`.

---

**Neste steg**: Etter første deploy, kan du dele lenken med trenerteamet ditt! 🎉
