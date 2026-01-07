// ============================================
// HISTORY PAGE RENDERING
// ============================================
import { APP } from '../state.js';
import { renderStatistics } from './match.js';

export function renderHistoryPage() {
    const sortedMatches = [...APP.completedMatches].sort((a, b) =>
        new Date(b.matchDate) - new Date(a.matchDate)
    );

    return `
        <div class="container">
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
                    <h1 style="font-size: 2.5rem; font-weight: 800; color: #312e81;">
                        Tidligere kamper
                    </h1>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-blue" data-action="backToSetup">
                            ← Tilbake til oppsett
                        </button>
                        <button class="btn btn-secondary" data-action="logout">
                            Logg ut
                        </button>
                    </div>
                </div>

                ${sortedMatches.length === 0 ? `
                    <div style="text-align: center; padding: 4rem 2rem;">
                        <h2 style="font-size: 1.5rem; color: #6b7280; margin-bottom: 1rem;">
                            Ingen kamper registrert ennå
                        </h2>
                        <p style="color: #9ca3af; margin-bottom: 2rem;">
                            Avsluttede kamper vil vises her
                        </p>
                        <button class="btn btn-primary" data-action="backToSetup">
                            Start ny kamp
                        </button>
                    </div>
                ` : `
                    <div style="overflow-x: auto;">
                        <table>
                            <thead>
                                <tr>
                                    <th>Dato</th>
                                    <th>Eget lag</th>
                                    <th>Motstander</th>
                                    <th class="text-center">Skudd</th>
                                    <th class="text-center">Mål</th>
                                    <th class="text-center">Handlinger</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sortedMatches.map(match => {
                                    const totalShots = match.events.filter(e =>
                                        e.mode === 'attack' && e.player
                                    ).length;
                                    const totalGoals = match.events.filter(e =>
                                        e.mode === 'attack' && e.result === 'mål'
                                    ).length;

                                    return `
                                        <tr>
                                            <td>${new Date(match.matchDate).toLocaleDateString('no-NO')}</td>
                                            <td style="font-weight: 600;">${match.homeTeam}</td>
                                            <td style="font-weight: 600;">${match.awayTeam}</td>
                                            <td class="text-center">${totalShots}</td>
                                            <td class="text-center" style="font-weight: 700; color: #059669;">${totalGoals}</td>
                                            <td class="text-center">
                                                <div style="display: flex; gap: 0.5rem; justify-content: center;">
                                                    <button class="btn btn-primary" data-action="viewMatch" data-match-id="${match.id}"
                                                            style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                                                        👁️ Vis
                                                    </button>
                                                    <button class="btn btn-danger" data-action="deleteMatch" data-match-id="${match.id}"
                                                            style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                                                        🗑️ Slett
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        </div>
    `;
}

export function renderViewMatchPage() {
    if (!APP.viewingMatch) {
        return renderHistoryPage();
    }

    const match = APP.viewingMatch;

    // Calculate goals from match events
    const homeGoals = match.events.filter(e => e.mode === 'attack' && e.result === 'mål').length;
    const awayGoals = match.events.filter(e => e.mode === 'defense' && e.result === 'mål').length;

    // Temporarily set APP data to match data for rendering
    const originalData = {
        homeTeam: APP.homeTeam,
        awayTeam: APP.awayTeam,
        players: APP.players,
        opponents: APP.opponents,
        events: APP.events,
        mode: APP.mode
    };

    APP.homeTeam = match.homeTeam;
    APP.awayTeam = match.awayTeam;
    APP.players = match.players;
    APP.opponents = match.opponents;
    APP.events = match.events;

    const statsContent = renderStatistics();

    // Restore original data
    Object.assign(APP, originalData);

    return `
        <div class="container">
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h1 style="font-size: 2rem; font-weight: 800; color: #312e81; margin: 0;">
                            ${match.homeTeam} <span style="color: #3b82f6;">${homeGoals}</span> - <span style="color: #f97316;">${awayGoals}</span> ${match.awayTeam}
                        </h1>
                        <p style="color: #6b7280; margin-top: 0.5rem;">
                            Dato: ${new Date(match.matchDate).toLocaleDateString('no-NO')}
                        </p>
                    </div>
                    <button class="btn btn-blue" data-action="viewHistory">
                        ← Tilbake til oversikt
                    </button>
                </div>

                <div class="mb-4">
                    <div class="flex flex-gap">
                        <button class="btn ${APP.mode === 'attack' ? 'btn-blue' : 'btn-secondary'}"
                                data-action="setViewMode" data-mode="attack" style="flex: 1;">
                            ${match.homeTeam} angrep
                        </button>
                        <button class="btn ${APP.mode === 'defense' ? 'btn-orange' : 'btn-secondary'}"
                                data-action="setViewMode" data-mode="defense" style="flex: 1;">
                            Keeper mot ${match.awayTeam}
                        </button>
                    </div>
                </div>
            </div>

            ${statsContent}
        </div>

        <div id="shotDetailsPopup" class="modal hidden">
            <div class="modal-content"></div>
        </div>
    `;
}
