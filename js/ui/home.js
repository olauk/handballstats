// ============================================
// HOME PAGE - MODE SELECTION
// ============================================
import { APP } from '../state.js';

export function renderHomePage() {
    return `
        <div class="container">
            <div class="card" style="max-width: 800px; margin: 2rem auto;">
                <div style="text-align: center; margin-bottom: 3rem;">
                    <h1 style="font-size: 3rem; font-weight: 800; color: #312e81; margin-bottom: 0.5rem;">
                        🤾 Håndballstatistikk
                    </h1>
                    <p style="color: #6b7280; font-size: 1.125rem;">
                        Velg modus for å starte en ny kamp
                    </p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                    <!-- Enkel modus -->
                    <div class="mode-card ${APP.matchMode === 'simple' ? 'selected' : ''}"
                         data-action="selectMode"
                         data-mode="simple"
                         style="cursor: pointer; border: 3px solid ${APP.matchMode === 'simple' ? '#3b82f6' : '#e5e7eb'}; border-radius: 12px; padding: 2rem; background: ${APP.matchMode === 'simple' ? '#eff6ff' : 'white'}; transition: all 0.2s;">
                        <div style="text-align: center;">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                            <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81; margin-bottom: 1rem;">
                                Enkel modus
                            </h2>
                            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 1.5rem;">
                                Rask og enkel registrering av skudd og statistikk uten tidtaking.
                            </p>
                            <ul style="text-align: left; color: #6b7280; line-height: 2; list-style: none; padding: 0;">
                                <li>✓ Skuddregistrering med posisjon</li>
                                <li>✓ Spillerstatistikk</li>
                                <li>✓ Keeperstatistikk</li>
                                <li>✓ Tidligere kamper</li>
                            </ul>
                        </div>
                    </div>

                    <!-- Avansert modus -->
                    <div class="mode-card ${APP.matchMode === 'advanced' ? 'selected' : ''}"
                         data-action="selectMode"
                         data-mode="advanced"
                         style="cursor: pointer; border: 3px solid ${APP.matchMode === 'advanced' ? '#3b82f6' : '#e5e7eb'}; border-radius: 12px; padding: 2rem; background: ${APP.matchMode === 'advanced' ? '#eff6ff' : 'white'}; transition: all 0.2s; position: relative;">
                        <div style="position: absolute; top: 1rem; right: 1rem; background: #f59e0b; color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700;">
                            BETA
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">⏱️</div>
                            <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81; margin-bottom: 1rem;">
                                Avansert modus
                            </h2>
                            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 1.5rem;">
                                Alt fra enkel modus + tidtaker og live hendelsesliste.
                            </p>
                            <ul style="text-align: left; color: #6b7280; line-height: 2; list-style: none; padding: 0;">
                                <li>✓ Alt fra enkel modus</li>
                                <li>✓ Tidtaker (20/25/30 min)</li>
                                <li>✓ Tidsstempling av hendelser</li>
                                <li>✓ Live hendelsesliste</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn-success btn-lg"
                            data-action="startNewMatch"
                            style="padding: 1rem 2rem; font-size: 1.125rem; font-weight: 700;">
                        ▶ Start ny kamp
                    </button>
                    ${APP.players.length > 0 || APP.opponents.length > 0 || APP.events.length > 0 ? `
                        <button class="btn btn-primary btn-lg"
                                data-action="continueMatchSetup"
                                style="padding: 1rem 2rem; font-size: 1.125rem; font-weight: 700;">
                            📝 Fortsett oppsett av kamp
                        </button>
                    ` : ''}
                    <button class="btn btn-blue btn-lg"
                            data-action="manageTeamRosters"
                            style="padding: 0.5rem 1rem; font-size: 1.125rem;">
                        👥 Spillerstall
                    </button>
                    <button class="btn btn-secondary btn-lg"
                            data-action="viewHistory"
                            style="padding: 0.5rem 1rem; font-size: 1.125rem;">
                        📚 Tidligere kamper
                    </button>
                </div>

                <div style="text-align: center; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e5e7eb;">
                    <button class="btn btn-secondary" data-action="logout">
                        Logg ut
                    </button>
                </div>
            </div>
        </div>

        <style>
            .mode-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            }
        </style>
    `;
}
