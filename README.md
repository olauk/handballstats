# Handball Analytics v2.0

## 🎯 Komplett håndballstatistikk-app med innlogging

### Nye funksjoner i v2.0
- ✅ Innloggingsside (Brukernavn: "Ola", Passord: "handball")
- ✅ LocalStorage - data lagres automatisk i nettleseren
- ✅ Fullstendig fungerende skuddregistrering
- ✅ Keeper-statistikk
- ✅ Sesongstatistikk (grunnlag lagt for fase 2)

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
- Legg til spillere for begge lag
- Merk keepere med checkbox
- Klikk "Start kamp"

#### 3. Registrer skudd
- **Angrep-modus:** Klikk på målet → Velg mål/redning → Velg spiller
- **Forsvar-modus:** Velg aktiv keeper → Klikk på målet → Velg mål/redning → Velg motspiller
- **Utenfor:** Klikk i grått område → Velg spiller

#### 4. Se statistikk
- Bytt mellom "Angrep" og "Forsvar" faner
- Klikk "Se skudd" for detaljert visning per spiller

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
