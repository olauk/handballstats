// ============================================
// TEAM ROSTER MANAGEMENT PAGE
// ============================================
import { APP } from '../state.js';

export function renderTeamRosterPage() {
    return `
        <div class="container">
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
                    <h1 style="font-size: 2.5rem; font-weight: 800; color: #312e81;">
                        👥 Spillerstall
                    </h1>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="btn btn-secondary" data-action="backToHome" style="padding: 0.5rem 1rem;">
                            ← Tilbake
                        </button>
                        <button class="btn btn-secondary" data-action="logout" style="padding: 0.5rem 1rem;">
                            Logg ut
                        </button>
                    </div>
                </div>

                <p style="color: #6b7280; margin-bottom: 2rem;">
                    Administrer dine lagrede lag med spillerstaller. Disse kan brukes når du setter opp en ny kamp.
                </p>

                ${APP.savedTeams.length > 0 ? `
                    <div style="display: grid; gap: 1.5rem; margin-bottom: 2rem;">
                        ${APP.savedTeams.map(team => `
                            <div style="border: 2px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; background: white;">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                    <div>
                                        <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81; margin-bottom: 0.5rem;">
                                            ${team.name}
                                        </h2>
                                        <p style="color: #6b7280;">
                                            ${team.players.length} spillere
                                            ${team.players.filter(p => p.isKeeper).length > 0 ? `• ${team.players.filter(p => p.isKeeper).length} keeper(e)` : ''}
                                        </p>
                                    </div>
                                    <div style="display: flex; gap: 0.5rem;">
                                        <button class="btn btn-blue" data-action="editTeamRoster" data-team-id="${team.id}" style="padding: 0.5rem 1rem;">
                                            ✏️ Rediger
                                        </button>
                                        <button class="btn btn-danger" data-action="deleteTeamRoster" data-team-id="${team.id}" style="padding: 0.5rem 1rem;">
                                            🗑️ Slett
                                        </button>
                                    </div>
                                </div>

                                ${team.players.length > 0 ? `
                                    <div style="padding: 1rem; background: #eff6ff; border-radius: 0.5rem;">
                                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                                            ${team.players.map(player => `
                                                <span style="padding: 0.5rem 1rem; background: white; border-radius: 0.5rem; border: 2px solid #3b82f6; font-weight: 600;">
                                                    #${player.number} ${player.name}${player.isKeeper ? ' 🧤' : ''}
                                                </span>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : `
                                    <p style="color: #9ca3af; font-style: italic;">Ingen spillere lagt til ennå</p>
                                `}
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div style="text-align: center; padding: 3rem; background: #f9fafb; border-radius: 12px; margin-bottom: 2rem;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">📋</div>
                        <h3 style="font-size: 1.25rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">
                            Ingen lagrede lag ennå
                        </h3>
                        <p style="color: #6b7280;">
                            Opprett ditt første lag med spillerstall for å komme i gang.
                        </p>
                    </div>
                `}

                <button class="btn btn-success" data-action="createNewTeamRoster" style="width: 100%; padding: 1rem; font-size: 1.125rem;">
                    + Opprett nytt lag
                </button>
            </div>
        </div>

        ${renderTeamRosterEditModal()}
    `;
}

export function renderTeamRosterEditModal() {
    return `
        <div id="teamRosterEditModal" class="modal hidden">
            <div class="modal-content"></div>
        </div>
    `;
}

export function renderTeamRosterEditModalContent() {
    const team = APP.editingTeamId
        ? APP.savedTeams.find(t => t.id === APP.editingTeamId)
        : null;

    const teamName = team ? team.name : '';
    const players = APP.tempPlayersList || [];

    return `
        <div class="modal-header">
            <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81;">
                ${team ? 'Rediger lag' : 'Opprett nytt lag'}
            </h2>
            <button class="btn btn-secondary" data-action="closeTeamRosterEdit">
                Lukk
            </button>
        </div>

        <div class="mb-6">
            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">
                Lagnavn
            </label>
            <input type="text"
                   id="teamRosterNameInput"
                   value="${teamName}"
                   placeholder="F.eks. A-lag Damer, Jenter 16, etc."
                   style="width: 100%; padding: 0.75rem; border: 2px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem;">
        </div>

        <div class="mb-6">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="font-size: 1.25rem; font-weight: 700; color: #312e81; margin: 0;">
                    Spillere
                    ${players.length > 0 ? `<span style="font-weight: 400; font-size: 1rem; color: #6b7280;">(${players.length} spillere)</span>` : ''}
                </h3>
            </div>

            ${players.length > 0 ? `
                <div style="padding: 1rem; background: #eff6ff; border-radius: 0.5rem; margin-bottom: 1rem; max-height: 300px; overflow-y: auto;">
                    <div style="display: grid; gap: 0.5rem;">
                        ${players.map(player => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: white; border-radius: 0.5rem; border: 2px solid #3b82f6;">
                                <span style="font-weight: 600;">
                                    #${player.number} ${player.name}${player.isKeeper ? ' 🧤' : ''}
                                </span>
                                <div style="display: flex; gap: 0.5rem;">
                                    <button class="btn btn-sm btn-secondary"
                                            data-action="editPlayerInRoster"
                                            data-player-id="${player.id}"
                                            style="padding: 0.25rem 0.75rem;">
                                        ✏️ Rediger
                                    </button>
                                    <button class="btn btn-sm btn-danger"
                                            data-action="removePlayerFromRoster"
                                            data-player-id="${player.id}"
                                            style="padding: 0.25rem 0.75rem;">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : `
                <p style="color: #6b7280; margin-bottom: 1rem;">Ingen spillere lagt til ennå</p>
            `}

            ${APP.editingPlayerId ? `
                <div style="padding: 1.5rem; background: #fef3c7; border-radius: 0.5rem; border: 2px solid #f59e0b; margin-bottom: 1rem;">
                    <h4 style="font-weight: 700; margin-bottom: 1rem; color: #92400e;">
                        ${APP.editingPlayerId !== -1 ? 'Rediger spiller' : 'Legg til spiller'}
                    </h4>
                    <div class="grid-2 mb-4">
                        <div>
                            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Nummer</label>
                            <input type="number" id="rosterPlayerNumberInput" placeholder="F.eks. 10"
                                   style="width: 100%; padding: 0.75rem; border: 2px solid #d1d5db; border-radius: 0.5rem;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Navn</label>
                            <input type="text" id="rosterPlayerNameInput" placeholder="F.eks. Ola Nordmann"
                                   style="width: 100%; padding: 0.75rem; border: 2px solid #d1d5db; border-radius: 0.5rem;">
                        </div>
                    </div>
                    <div class="mb-4">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" id="rosterPlayerIsKeeperInput"
                                   style="width: 1.25rem; height: 1.25rem; cursor: pointer;">
                            <span style="font-weight: 600;">Keeper</span>
                        </label>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-success" data-action="saveRosterPlayer" style="flex: 1;">
                            ${APP.editingPlayerId !== -1 ? '💾 Lagre endringer' : '+ Legg til'}
                        </button>
                        <button class="btn btn-secondary" data-action="cancelRosterPlayerEdit">
                            Avbryt
                        </button>
                    </div>
                </div>
            ` : `
                <div class="grid-2" style="gap: 0.5rem;">
                    <button class="btn btn-primary" data-action="addPlayerToRoster" style="width: 100%;">
                        + Legg til spiller
                    </button>
                    <button class="btn btn-secondary" data-action="loadRosterPlayersFile" style="width: 100%;">
                        📁 Last fra fil
                    </button>
                </div>
                <input type="file" id="rosterPlayersFileInput" accept=".json,.txt,.csv" style="display: none;">
            `}
        </div>

        <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-secondary" data-action="closeTeamRosterEdit" style="flex: 1;">
                Avbryt
            </button>
            <button class="btn btn-success" data-action="saveTeamRoster" style="flex: 1; font-weight: 700;">
                💾 Lagre lag
            </button>
        </div>
    `;
}
