# Testdata for Handball Analytics

Disse filene inneholder testdata for å gjøre det enklere å teste applikasjonen.

## Filer

### JSON-format
- `testdata-hjemmelag.json` - 6 spillere for hjemmelaget (2 keepere)
- `testdata-bortelag.json` - 6 spillere for bortelaget

### CSV-format
- `testdata-hjemmelag.csv` - Samme spillere som JSON, men i CSV-format
- `testdata-bortelag.csv` - Samme spillere som JSON, men i CSV-format

## Hvordan bruke

### JSON-import
1. Gå til "Oppsett av kamp"
2. Klikk "📁 Last fra fil" under spillerseksjonen
3. Velg `testdata-hjemmelag.json` for hjemmelaget eller `testdata-bortelag.json` for bortelaget
4. Spillerlisten vil åpnes automatisk i popup-vinduet
5. Klikk "💾 Lagre spillertropp" for å lagre

### CSV-import
Format: `nummer,navn,isKeeper` (for hjemmelag) eller `nummer,navn` (for bortelag)

Eksempel:
```
1,Lars Hansen,true
7,Erik Olsen,false
```

## Spillerliste

### Hjemmelag
1. **#1 Lars Hansen** 🧤 (Keeper)
2. **#7 Erik Olsen**
3. **#12 Magnus Berg** 🧤 (Keeper)
4. **#15 Jonas Eriksen**
5. **#22 Martin Johansen**
6. **#33 Kristian Andersen**

### Bortelag
1. **#5 Thomas Nilsen**
2. **#9 Alexander Larsen**
3. **#11 Mathias Pedersen**
4. **#18 Sebastian Kristiansen**
5. **#24 Oliver Svendsen**
6. **#29 William Jakobsen**

## Test-scenario

For å teste en komplett kamp:

1. **Oppsett:**
   - Last inn hjemmelag fra `testdata-hjemmelag.json`
   - Last inn bortelag fra `testdata-bortelag.json`
   - Sett lagnavn (f.eks. "Viking" vs "Molde")
   - Sett kampdato

2. **1. omgang - Angrep:**
   - Registrer 3 mål: Erik Olsen (#7), Jonas Eriksen (#15), Martin Johansen (#22)
   - Registrer 2 redninger: Erik Olsen (#7), Kristian Andersen (#33)
   - Registrer 1 teknisk feil: Jonas Eriksen (#15)

3. **1. omgang - Forsvar:**
   - Velg Lars Hansen (#1) som aktiv keeper
   - Registrer 2 mål fra motstandere: Thomas Nilsen (#5), Alexander Larsen (#9)
   - Registrer 3 redninger fra motstandere: Mathias Pedersen (#11), Sebastian Kristiansen (#18), Oliver Svendsen (#24)

4. **2. omgang - Bytt keeper:**
   - Velg Magnus Berg (#12) som aktiv keeper
   - Fortsett registrering av skudd

5. **Avslutt kamp:**
   - Klikk "✅ Avslutt kamp"
   - Bekreft at alle data lagres
   - Sjekk at velkomstsiden vises
   - Verifiser at alle felt er nullstilt for neste kamp

## Forventet resultat

Etter å ha kjørt test-scenarioet skal du kunne:
- Se detaljert statistikk for hver spiller
- Se skuddkart med alle registrerte skudd
- Finne kampen i "Tidligere kamper"
- Starte en ny kamp med blanke felter
