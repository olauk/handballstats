// ============================================
// HELP PAGE
// ============================================
import { APP } from '../state.js';

export function renderHelpPage() {
  return `
        <div class="container">
            <div class="card" style="max-width: 900px; margin: 2rem auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h1 style="font-size: 2.5rem; font-weight: 800; color: #312e81;">
                        ❓ Hjelp
                    </h1>
                    <button class="btn btn-secondary" data-action="backToHome">
                        ← Tilbake til hjem
                    </button>
                </div>

                <!-- INNLEDNING -->
                <div style="background: #eff6ff; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
                    <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81; margin-bottom: 1rem;">
                        Velkommen til Håndballstatistikk!
                    </h2>
                    <p style="color: #4b5563; line-height: 1.6;">
                        Dette systemet lar deg registrere detaljert statistikk under håndballkamper.
                        Du kan velge mellom <strong>Enkel modus</strong> for rask registrering eller
                        <strong>Avansert modus</strong> med tidtaker og detaljert skuddregistrering.
                    </p>
                </div>

                <!-- KOMME I GANG -->
                <div style="margin-bottom: 3rem;">
                    <h2 style="font-size: 1.75rem; font-weight: 700; color: #312e81; margin-bottom: 1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">
                        🚀 Kom i gang
                    </h2>

                    <div style="margin-bottom: 2rem;">
                        <h3 style="font-size: 1.25rem; font-weight: 600; color: #312e81; margin-bottom: 0.75rem;">
                            1. Velg modus
                        </h3>
                        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 1rem;">
                            På forsiden kan du velge mellom to moduser:
                        </p>
                        <ul style="color: #4b5563; line-height: 1.8; margin-left: 1.5rem;">
                            <li><strong>Enkel modus:</strong> Rask skuddregistrering uten tidtaker</li>
                            <li><strong>Avansert modus:</strong> Inkluderer tidtaker, hendelsesliste og detaljert skuddregistrering</li>
                        </ul>
                    </div>

                    <div style="margin-bottom: 2rem;">
                        <h3 style="font-size: 1.25rem; font-weight: 600; color: #312e81; margin-bottom: 0.75rem;">
                            2. Start kamp
                        </h3>
                        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 1rem;">
                            Du har to valg:
                        </p>
                        <ul style="color: #4b5563; line-height: 1.8; margin-left: 1.5rem;">
                            <li><strong>Start ny kamp:</strong> Nullstiller alt og starter helt på nytt</li>
                            <li><strong>Fortsett kamp:</strong> Fortsetter med eksisterende oppsett (vises kun hvis du har data)</li>
                        </ul>
                    </div>

                    <div style="margin-bottom: 2rem;">
                        <h3 style="font-size: 1.25rem; font-weight: 600; color: #312e81; margin-bottom: 0.75rem;">
                            3. Sett opp kamp
                        </h3>
                        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 1rem;">
                            I oppsettet må du:
                        </p>
                        <ul style="color: #4b5563; line-height: 1.8; margin-left: 1.5rem;">
                            <li>Angi navn på eget lag og motstander</li>
                            <li>Velge kampdato</li>
                            <li>Legge til spillere for eget lag (marker keeper med 🧤)</li>
                            <li>Legge til motstandere (valgfritt, men anbefalt)</li>
                        </ul>
                        <p style="color: #6b7280; font-style: italic; margin-top: 1rem;">
                            💡 Tips: Du kan importere spillere fra fil eller fra lagrede spillerstall
                        </p>
                    </div>
                </div>

                <!-- ENKEL MODUS -->
                <div style="margin-bottom: 3rem;">
                    <h2 style="font-size: 1.75rem; font-weight: 700; color: #312e81; margin-bottom: 1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">
                        📊 Enkel modus
                    </h2>

                    <div style="margin-bottom: 2rem;">
                        <h3 style="font-size: 1.25rem; font-weight: 600; color: #059669; margin-bottom: 0.75rem;">
                            Angrep - Registrer skudd
                        </h3>
                        <ol style="color: #4b5563; line-height: 1.8; margin-left: 1.5rem;">
                            <li>Klikk på målet der skuddet traff (hvit/grønn = mål, hvit/gul = redning)</li>
                            <li>Klikk utenfor målet for skudd som gikk utenfor</li>
                            <li>Velg resultat (mål eller redning)</li>
                            <li>Velg hvilken spiller som skjøt</li>
                        </ol>
                    </div>

                    <div style="margin-bottom: 2rem;">
                        <h3 style="font-size: 1.25rem; font-weight: 600; color: #c2410c; margin-bottom: 0.75rem;">
                            Forsvar - Registrer motstanderskudd
                        </h3>
                        <ol style="color: #4b5563; line-height: 1.8; margin-left: 1.5rem;">
                            <li>Bytt til "Forsvar" modus øverst</li>
                            <li>Velg aktiv keeper (markert med 🧤)</li>
                            <li>Klikk på målet der motstanderen skjøt</li>
                            <li>Velg resultat (mål eller redning)</li>
                            <li>Velg hvilken motstander som skjøt</li>
                        </ol>
                    </div>

                    <div style="margin-bottom: 2rem;">
                        <h3 style="font-size: 1.25rem; font-weight: 600; color: #7c3aed; margin-bottom: 0.75rem;">
                            Tekniske feil
                        </h3>
                        <p style="color: #4b5563; line-height: 1.6;">
                            Klikk på "Registrer teknisk feil" og velg spilleren som gjorde feilen.
                        </p>
                    </div>

                    <div style="background: #fef3c7; padding: 1rem; border-radius: 8px; border-left: 4px solid #f59e0b;">
                        <p style="color: #92400e; font-weight: 600; margin-bottom: 0.5rem;">
                            ⚠️ Viktig å huske:
                        </p>
                        <ul style="color: #92400e; line-height: 1.6; margin-left: 1.5rem;">
                            <li>Marker alltid minst én spiller som keeper (🧤) for å bruke forsvarsmodus</li>
                            <li>Bytt keeper underveis hvis nødvendig ved å velge ny keeper fra listen</li>
                        </ul>
                    </div>
                </div>

                <!-- AVANSERT MODUS -->
                <div style="margin-bottom: 3rem;">
                    <h2 style="font-size: 1.75rem; font-weight: 700; color: #312e81; margin-bottom: 1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">
                        ⏱️ Avansert modus
                    </h2>

                    <p style="color: #4b5563; line-height: 1.6; margin-bottom: 1.5rem;">
                        Avansert modus inkluderer alt fra enkel modus, pluss:
                    </p>

                    <div style="margin-bottom: 2rem;">
                        <h3 style="font-size: 1.25rem; font-weight: 600; color: #3b82f6; margin-bottom: 0.75rem;">
                            Tidtaker
                        </h3>
                        <ul style="color: #4b5563; line-height: 1.8; margin-left: 1.5rem;">
                            <li><strong>Velg omgangslengde:</strong> 20, 25 eller 30 minutter (standard: 30 min)</li>
                            <li><strong>Start tidtaker:</strong> Klikk "▶ Start" når kampen begynner</li>
                            <li><strong>Pause:</strong> Klikk "⏸ Pause" for å stoppe midlertidig</li>
                            <li><strong>Nullstill:</strong> Klikk "↻ Nullstill" for å starte omgangen på nytt</li>
                            <li><strong>Neste omgang:</strong> Klikk "→ 2. omgang" når første omgang er ferdig</li>
                        </ul>
                        <p style="color: #6b7280; font-style: italic; margin-top: 1rem;">
                            💡 Tips: Alle hendelser får automatisk tidsstempel når tidtakeren er aktiv
                        </p>
                    </div>

                    <div style="margin-bottom: 2rem;">
                        <h3 style="font-size: 1.25rem; font-weight: 600; color: #10b981; margin-bottom: 0.75rem;">
                            Detaljert skuddregistrering
                        </h3>
                        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 1rem;">
                            I oppsettet kan du velge mellom "Enkel" og "Detaljert" skuddregistrering.
                            Detaljert modus gir deg ekstra informasjon om hvert skudd:
                        </p>
                        <ol style="color: #4b5563; line-height: 1.8; margin-left: 1.5rem;">
                            <li><strong>Steg 1:</strong> Klikk på målet → Velg resultat (mål/redning)</li>
                            <li><strong>Steg 2:</strong> Velg spilleren som skjøt</li>
                            <li><strong>Steg 3:</strong> Velg angrepstype (Etablert angrep eller Kontring)</li>
                            <li><strong>Steg 4:</strong> Velg skuddposisjon (9m, 6m, 7m eller KA)</li>
                            <li><strong>Steg 5:</strong> Velg assist (valgfritt, kun ved mål)</li>
                        </ol>
                        <p style="color: #6b7280; font-style: italic; margin-top: 1rem;">
                            💡 Tips: Assist vises kun ved mål og kun for eget lag. Du kan hoppe over assist-valg.
                        </p>
                    </div>

                    <div style="margin-bottom: 2rem;">
                        <h3 style="font-size: 1.25rem; font-weight: 600; color: #8b5cf6; margin-bottom: 0.75rem;">
                            Hendelsesliste
                        </h3>
                        <p style="color: #4b5563; line-height: 1.6;">
                            Alle hendelser vises i en live feed med tidsstempler. Du kan se:
                        </p>
                        <ul style="color: #4b5563; line-height: 1.8; margin-left: 1.5rem;">
                            <li>Mål, redninger og bom med spillernummer</li>
                            <li>Tekniske feil</li>
                            <li>Tidspunkt for hver hendelse</li>
                            <li>Angrepstype og posisjon (i detaljert modus)</li>
                        </ul>
                    </div>
                </div>

                <!-- STATISTIKK -->
                <div style="margin-bottom: 3rem;">
                    <h2 style="font-size: 1.75rem; font-weight: 700; color: #312e81; margin-bottom: 1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">
                        📈 Statistikk
                    </h2>

                    <p style="color: #4b5563; line-height: 1.6; margin-bottom: 1.5rem;">
                        Statistikken oppdateres automatisk og viser:
                    </p>

                    <div style="margin-bottom: 2rem;">
                        <h3 style="font-size: 1.25rem; font-weight: 600; color: #059669; margin-bottom: 0.75rem;">
                            For egne spillere (Angrep)
                        </h3>
                        <ul style="color: #4b5563; line-height: 1.8; margin-left: 1.5rem;">
                            <li>Mål per omgang og totalt</li>
                            <li>Redninger per omgang</li>
                            <li>Skudd utenfor per omgang</li>
                            <li>Tekniske feil per omgang</li>
                            <li>Totalt antall skudd</li>
                            <li>Uttelling % (mål / skudd)</li>
                            <li><strong>Detaljert modus:</strong> Etablert angrep, kontring, posisjoner (9m/6m/7m/KA), assists</li>
                        </ul>
                    </div>

                    <div style="margin-bottom: 2rem;">
                        <h3 style="font-size: 1.25rem; font-weight: 600; color: #c2410c; margin-bottom: 0.75rem;">
                            For keepere (Forsvar)
                        </h3>
                        <ul style="color: #4b5563; line-height: 1.8; margin-left: 1.5rem;">
                            <li>Antall mottatte skudd</li>
                            <li>Antall redninger</li>
                            <li>Redningsprosent</li>
                        </ul>
                    </div>

                    <div style="margin-bottom: 2rem;">
                        <h3 style="font-size: 1.25rem; font-weight: 600; color: #f59e0b; margin-bottom: 0.75rem;">
                            For motstandere
                        </h3>
                        <ul style="color: #4b5563; line-height: 1.8; margin-left: 1.5rem;">
                            <li>Avfyrte skudd</li>
                            <li>Mål</li>
                            <li>Uttelling %</li>
                            <li><strong>Detaljert modus:</strong> Angrepstype og posisjoner</li>
                        </ul>
                    </div>

                    <div style="background: #eff6ff; padding: 1rem; border-radius: 8px; border-left: 4px solid #3b82f6;">
                        <p style="color: #1e40af; font-weight: 600; margin-bottom: 0.5rem;">
                            💡 Visste du at:
                        </p>
                        <p style="color: #1e40af; line-height: 1.6;">
                            Du kan klikke på "Se skudd" for å se detaljert plassering av alle skudd for en spiller,
                            inkludert skuddkart på målet!
                        </p>
                    </div>
                </div>

                <!-- SPILLERSTALL -->
                <div style="margin-bottom: 3rem;">
                    <h2 style="font-size: 1.75rem; font-weight: 700; color: #312e81; margin-bottom: 1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">
                        👥 Spillerstall
                    </h2>

                    <p style="color: #4b5563; line-height: 1.6; margin-bottom: 1rem;">
                        Du kan lagre spillerstall for å gjøre oppsettet raskere neste gang:
                    </p>

                    <ol style="color: #4b5563; line-height: 1.8; margin-left: 1.5rem; margin-bottom: 1rem;">
                        <li>Klikk på "👥 Spillerstall" fra forsiden</li>
                        <li>Klikk "Opprett nytt spillerstall"</li>
                        <li>Gi laget et navn</li>
                        <li>Legg til spillere manuelt eller importer fra fil</li>
                        <li>Lagre spillerstallet</li>
                    </ol>

                    <p style="color: #6b7280; font-style: italic;">
                        💡 Tips: Neste gang du setter opp en kamp, kan du importere hele spillerstallet
                        ved å klikke "☰ Importer lag" i oppsettet.
                    </p>
                </div>

                <!-- TIDLIGERE KAMPER -->
                <div style="margin-bottom: 3rem;">
                    <h2 style="font-size: 1.75rem; font-weight: 700; color: #312e81; margin-bottom: 1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">
                        📚 Tidligere kamper
                    </h2>

                    <p style="color: #4b5563; line-height: 1.6; margin-bottom: 1rem;">
                        Alle avsluttede kamper lagres automatisk:
                    </p>

                    <ul style="color: #4b5563; line-height: 1.8; margin-left: 1.5rem; margin-bottom: 1rem;">
                        <li>Se fullstendig statistikk fra tidligere kamper</li>
                        <li>Se skuddplassering og hendelsesforløp</li>
                        <li>Sammenlign prestasjoner over tid</li>
                        <li>Slett gamle kamper du ikke trenger lenger</li>
                    </ul>

                    <p style="color: #6b7280; font-style: italic;">
                        💡 Tips: Du kan eksportere kampdata ved å klikke "📥 Eksporter data" i kampen.
                    </p>
                </div>

                <!-- TIPS OG TRIKS -->
                <div style="margin-bottom: 2rem;">
                    <h2 style="font-size: 1.75rem; font-weight: 700; color: #312e81; margin-bottom: 1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">
                        💡 Tips og triks
                    </h2>

                    <div style="display: grid; gap: 1rem;">
                        <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px;">
                            <h4 style="color: #312e81; font-weight: 600; margin-bottom: 0.5rem;">
                                📱 Bruk mobil eller nettbrett
                            </h4>
                            <p style="color: #4b5563; line-height: 1.6;">
                                Systemet er optimalisert for touch-skjermer, perfekt for registrering fra sidelinjen.
                            </p>
                        </div>

                        <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px;">
                            <h4 style="color: #312e81; font-weight: 600; margin-bottom: 0.5rem;">
                                🔄 Synkronisering
                            </h4>
                            <p style="color: #4b5563; line-height: 1.6;">
                                Data lagres automatisk både lokalt og i skyen. Du kan fortsette kampen fra en annen enhet.
                            </p>
                        </div>

                        <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px;">
                            <h4 style="color: #312e81; font-weight: 600; margin-bottom: 0.5rem;">
                                🎯 Nøyaktig registrering
                            </h4>
                            <p style="color: #4b5563; line-height: 1.6;">
                                Klikk så nøyaktig som mulig på målet - systemet lagrer eksakt posisjon for hvert skudd.
                            </p>
                        </div>

                        <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px;">
                            <h4 style="color: #312e81; font-weight: 600; margin-bottom: 0.5rem;">
                                ⚡ Rask registrering
                            </h4>
                            <p style="color: #4b5563; line-height: 1.6;">
                                Bruk enkel modus eller enkel skuddregistrering hvis du vil registrere raskt under kamp.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- KONTAKT -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; border-radius: 12px; text-align: center;">
                    <h3 style="color: white; font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem;">
                        Trenger du mer hjelp?
                    </h3>
                    <p style="color: rgba(255, 255, 255, 0.9); line-height: 1.6;">
                        Hvis du har spørsmål eller opplever problemer, ta kontakt med support
                        eller sjekk dokumentasjonen på vår nettside.
                    </p>
                </div>
            </div>
        </div>
    `;
}
