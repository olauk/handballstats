// ============================================
// SETUP PAGE RENDERING
// ============================================
import { APP } from '../state.js';

export function renderSetupPage() {
    return `
        <div class="container">
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
                    <h1 style="font-size: 2.5rem; font-weight: 800; color: #312e81;">
                        Oppsett av kamp
                    </h1>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="btn btn-secondary" data-action="backToHome">
                            ← Tilbake
                        </button>
                        <button class="btn btn-blue" data-action="viewHistory">
                            📋 Tidligere kamper
                        </button>
                        <button class="btn btn-secondary" data-action="logout">
                            Logg ut
                        </button>
                    </div>
                </div>

                <div class="grid-2 mb-6">
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Eget lag</label>
                        <input type="text" id="homeTeamInput" value="${APP.homeTeam}"
                               data-field="homeTeam" placeholder="Navn på eget lag">
                    </div>
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Motstander</label>
                        <input type="text" id="awayTeamInput" value="${APP.awayTeam}"
                               data-field="awayTeam" placeholder="Navn på motstander">
                    </div>
                </div>

                <div class="mb-6">
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Kampdato</label>
                    <input type="date" id="matchDateInput" value="${APP.matchDate}"
                           style="width: 100%; padding: 0.75rem; border: 2px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem;">
                </div>

                <div class="mb-6">
                    <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81; margin-bottom: 1rem;">
                        ${APP.homeTeam} - Spillere
                        ${APP.players.length > 0 ? `<span style="font-weight: 400; font-size: 1rem; color: #6b7280;">(${APP.players.length} spillere)</span>` : ''}
                    </h2>
                    ${APP.players.length > 0 ? `
                        <div style="padding: 1rem; background: #eff6ff; border-radius: 0.5rem; margin-bottom: 1rem;">
                            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                                ${APP.players.map(player => `
                                    <span style="padding: 0.5rem 1rem; background: white; border-radius: 0.5rem; border: 2px solid #3b82f6; font-weight: 600;">
                                        #${player.number} ${player.name}${player.isKeeper ? ' 🧤' : ''}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    ` : `
                        <p style="color: #6b7280; margin-bottom: 1rem;">Ingen spillere lagt til ennå</p>
                    `}
                    <div class="grid-2" style="gap: 0.5rem;">
                        <button class="btn btn-blue" data-action="managePlayers" style="width: 100%; font-size: 1.125rem;">
                            ${APP.players.length > 0 ? '✏️ Rediger spillere' : '+ Legg til spillere'}
                        </button>
                        <button class="btn btn-secondary" data-action="loadPlayersFile" style="width: 100%; font-size: 1.125rem;">
                            📁 Last fra fil
                        </button>
                    </div>
                    <input type="file" id="playersFileInput" accept=".json,.txt,.csv" style="display: none;">
                </div>

                <div class="mb-6">
                    <h2 style="font-size: 1.5rem; font-weight: 700; color: #c2410c; margin-bottom: 1rem;">
                        ${APP.awayTeam} - Spillere
                        ${APP.opponents.length > 0 ? `<span style="font-weight: 400; font-size: 1rem; color: #6b7280;">(${APP.opponents.length} spillere)</span>` : ''}
                    </h2>
                    ${APP.opponents.length > 0 ? `
                        <div style="padding: 1rem; background: #ffedd5; border-radius: 0.5rem; margin-bottom: 1rem;">
                            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                                ${APP.opponents.map(opponent => `
                                    <span style="padding: 0.5rem 1rem; background: white; border-radius: 0.5rem; border: 2px solid #f97316; font-weight: 600;">
                                        #${opponent.number} ${opponent.name}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    ` : `
                        <p style="color: #6b7280; margin-bottom: 1rem;">Ingen motstandere lagt til ennå</p>
                    `}
                    <div class="grid-2" style="gap: 0.5rem;">
                        <button class="btn btn-orange" data-action="manageOpponents" style="width: 100%; font-size: 1.125rem;">
                            ${APP.opponents.length > 0 ? '✏️ Rediger motstandere' : '+ Legg til motstandere'}
                        </button>
                        <button class="btn btn-secondary" data-action="loadOpponentsFile" style="width: 100%; font-size: 1.125rem;">
                            📁 Last fra fil
                        </button>
                    </div>
                    <input type="file" id="opponentsFileInput" accept=".json,.txt,.csv" style="display: none;">
                </div>

                <button class="btn btn-success" data-action="startMatch"
                        style="width: 100%; font-size: 1.25rem; padding: 1rem; font-weight: 700;">
                    ▶ Start kamp
                </button>
            </div>
        </div>
        ${renderPlayersManagementPopup()}
    `;
}

export function renderPlayersManagementPopup() {
    return `
        <div id="playersManagementPopup" class="modal hidden">
            <div class="modal-content"></div>
        </div>
    `;
}
