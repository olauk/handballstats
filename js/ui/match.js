// ============================================
// MATCH PAGE RENDERING
// ============================================
import { APP, getCurrentPlayers, getCurrentOpponents, getCurrentEvents } from '../state.js';
import { getTeamGoals, getPlayerStats, getOpponentStats } from '../statistics.js';
import { renderTimerControls } from '../timer.js';

export function renderMatchPage() {
    const keeperOptions = APP.players.filter(p => p.isKeeper).map(k =>
        `<option value="${k.id}" ${APP.activeKeeper?.id === k.id ? 'selected' : ''}>
            #${k.number} - ${k.name}
        </option>`
    ).join('');

    const homeGoals = getTeamGoals('home');
    const awayGoals = getTeamGoals('away');

    return `
        <div class="container">
            <div class="card">
                <div class="flex flex-between flex-wrap mb-4" style="gap: 1rem; align-items: center;">
                    <div class="flex" style="gap: 1rem; align-items: center;">
                        <button class="btn btn-secondary" data-action="backToSetup">
                            ← Tilbake til oppsett
                        </button>
                        <h1 style="font-size: 1.75rem; font-weight: 800; color: #312e81; margin: 0;">
                            ${APP.homeTeam} <span style="color: #3b82f6;">${homeGoals}</span> - <span style="color: #f97316;">${awayGoals}</span> ${APP.awayTeam}
                        </h1>
                    </div>
                    <div class="flex" style="gap: 0.5rem; flex-wrap: wrap;">
                        <button class="btn btn-warning" data-action="finishMatch">
                            ✅ Avslutt kamp
                        </button>
                        <button class="btn btn-success" data-action="exportData">
                            💾 Eksporter
                        </button>
                        <button class="btn btn-danger" data-action="resetMatch">
                            🔄 Nullstill
                        </button>
                        <button class="btn btn-secondary" data-action="logout">
                            Logg ut
                        </button>
                    </div>
                </div>

                <div class="flex flex-gap mb-4">
                    <button class="btn ${APP.currentHalf === 1 ? 'btn-primary' : 'btn-secondary'}"
                            data-action="setHalf" data-half="1">
                        1. omgang
                    </button>
                    <button class="btn ${APP.currentHalf === 2 ? 'btn-primary' : 'btn-secondary'}"
                            data-action="setHalf" data-half="2">
                        2. omgang
                    </button>
                </div>
            </div>

            ${APP.matchMode === 'advanced' ? `
                <div class="card">
                    ${renderTimerControls()}
                </div>
            ` : ''}

            <div class="card">
                <div class="flex flex-gap mb-4">
                    <button class="btn ${APP.mode === 'attack' ? 'btn-blue' : 'btn-secondary'}"
                            data-action="setMode" data-mode="attack" style="flex: 1;">
                        Angrep (${APP.homeTeam})
                    </button>
                    <button class="btn ${APP.mode === 'defense' ? 'btn-orange' : 'btn-secondary'}"
                            data-action="setMode" data-mode="defense" style="flex: 1;">
                        Forsvar (Keeper mot ${APP.awayTeam})
                    </button>
                </div>

                ${APP.mode === 'defense' ? `
                    <div class="mb-4">
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">
                            Velg aktiv keeper:
                        </label>
                        <select id="keeperSelect">
                            <option value="">Ingen keeper valgt</option>
                            ${keeperOptions}
                        </select>
                    </div>
                ` : ''}

                ${APP.mode === 'attack' ? `
                    <button class="btn btn-warning" data-action="showTechnicalPopup"
                            style="width: 100%; font-size: 1.125rem;">
                        Registrer teknisk feil
                    </button>
                ` : ''}
            </div>

            ${renderGoalVisualization()}
            ${renderStatistics()}
        </div>

        ${renderTechnicalPopup()}
        ${renderShotPopup()}
        ${renderShotDetailsPopup()}
    `;
}

export function renderGoalVisualization() {
    const shots = APP.events.filter(e =>
        e.mode === APP.mode && (e.player || e.opponent) && e.zone === 'goal'
    ).map(event => {
        const playerNumber = APP.mode === 'attack' ? event.player?.number : event.opponent?.number;
        const className = event.result === 'mål' ? 'goal' : 'save';

        // Include timer timestamp if available (advanced mode)
        let title = event.result;
        if (event.timerTimestamp) {
            const min = String(event.timerTimestamp.minutes).padStart(2, '0');
            const sec = String(event.timerTimestamp.seconds).padStart(2, '0');
            title = `[${min}:${sec}] ${title}`;
        }
        title += ` - ${event.timestamp}`;

        return `
            <div class="shot-marker ${className}"
                 style="left: ${event.x}%; top: ${event.y}%;"
                 title="${title}">
                ${playerNumber}
            </div>
        `;
    }).join('');

    const outsideShots = APP.events.filter(e =>
        e.mode === APP.mode && (e.player || e.opponent) && e.zone === 'outside'
    ).map(event => {
        const playerNumber = APP.mode === 'attack' ? event.player?.number : event.opponent?.number;

        // Include timer timestamp if available (advanced mode)
        let title = event.result + ' utenfor';
        if (event.timerTimestamp) {
            const min = String(event.timerTimestamp.minutes).padStart(2, '0');
            const sec = String(event.timerTimestamp.seconds).padStart(2, '0');
            title = `[${min}:${sec}] ${title}`;
        }
        title += ` - ${event.timestamp}`;

        return `
            <div class="shot-marker outside"
                 style="left: ${event.x}%; top: ${event.y}%; position: absolute;"
                 title="${title}">
                ${playerNumber}
            </div>
        `;
    }).join('');

    const tempShotMarker = APP.tempShot && APP.tempShot.zone === 'goal' ? `
        <div class="shot-marker temp"
             style="left: ${APP.tempShot.x}%; top: ${APP.tempShot.y}%;">
            ⚽
        </div>
    ` : '';

    const tempOutsideMarker = APP.tempShot && APP.tempShot.zone === 'outside' ? `
        <div class="shot-marker temp"
             style="left: ${APP.tempShot.x}%; top: ${APP.tempShot.y}%; position: absolute;">
            ⚽
        </div>
    ` : '';

    return `
        <div class="card">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #312e81; margin-bottom: 1rem;">
                ${APP.mode === 'attack' ? 'Registrer skudd' : 'Registrer motstanderskudd'}
            </h2>
            <div class="goal-container" id="goalContainer">
                <div class="goal" id="goalArea">
                    <div class="goal-grid">
                        ${[...Array(6)].map(() => '<div class="goal-grid-cell"></div>').join('')}
                    </div>
                    ${shots}
                    ${tempShotMarker}
                </div>
                ${outsideShots}
                ${tempOutsideMarker}
            </div>
            <p style="text-align: center; color: #4b5563; font-size: 0.875rem; margin-top: 1rem;">
                Klikk på målet der skuddet gikk, eller i det grå området hvis skuddet gikk utenfor
            </p>
            <div class="legend">
                <div class="legend-item">
                    <div class="legend-color green"></div>
                    <span style="font-weight: 500;">Mål</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color amber"></div>
                    <span style="font-weight: 500;">Redning</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color gray"></div>
                    <span style="font-weight: 500;">Utenfor</span>
                </div>
            </div>
        </div>
    `;
}

export function renderStatistics() {
    // Use helper functions to get correct data for both live and archived matches
    const players = getCurrentPlayers();
    const opponents = getCurrentOpponents();
    const events = getCurrentEvents();

    if (APP.mode === 'attack') {
        return `
            <div class="card">
                <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81; margin-bottom: 1rem;">
                    Statistikk
                </h2>
                <div class="grid-2 mb-6">
                    <button class="btn btn-blue" data-action="setMode" data-mode="attack">
                        Se ${APP.homeTeam} angrep
                    </button>
                    <button class="btn btn-orange" data-action="setMode" data-mode="defense">
                        Se keeper mot ${APP.awayTeam}
                    </button>
                </div>
                <div style="overflow-x: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>Nr</th>
                                <th>Spiller</th>
                                <th class="text-center">1. omg Mål</th>
                                <th class="text-center">1. omg Redn.</th>
                                <th class="text-center">1. omg Utenfor</th>
                                <th class="text-center">1. omg Tekn.feil</th>
                                <th class="text-center">2. omg Mål</th>
                                <th class="text-center">2. omg Redn.</th>
                                <th class="text-center">2. omg Utenfor</th>
                                <th class="text-center">2. omg Tekn.feil</th>
                                <th class="text-center" style="font-weight: 700;">Tot. Mål</th>
                                <th class="text-center" style="font-weight: 700;">Tot. Skudd</th>
                                <th class="text-center" style="font-weight: 700;">Uttelling %</th>
                                <th class="text-center">Detaljer</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${players.map(player => {
                                const half1 = getPlayerStats(player.id, 1);
                                const half2 = getPlayerStats(player.id, 2);
                                const total = getPlayerStats(player.id);
                                const totalShots = total.goals + total.saved + total.outside;
                                const shootingPercent = totalShots > 0 ? ((total.goals / totalShots) * 100).toFixed(1) : 0;
                                return `
                                    <tr>
                                        <td>${player.number}</td>
                                        <td style="font-weight: 600;">${player.name}</td>
                                        <td class="text-center">${half1.goals}</td>
                                        <td class="text-center">${half1.saved}</td>
                                        <td class="text-center">${half1.outside}</td>
                                        <td class="text-center">${half1.technical}</td>
                                        <td class="text-center">${half2.goals}</td>
                                        <td class="text-center">${half2.saved}</td>
                                        <td class="text-center">${half2.outside}</td>
                                        <td class="text-center">${half2.technical}</td>
                                        <td class="text-center" style="font-weight: 700; color: #059669;">${total.goals}</td>
                                        <td class="text-center" style="font-weight: 700;">${totalShots}</td>
                                        <td class="text-center" style="font-weight: 700; color: #2563eb;">${shootingPercent}%</td>
                                        <td class="text-center">
                                            <button class="btn btn-primary"
                                                    data-action="showPlayerDetails" data-player-id="${player.id}"
                                                    style="padding: 0.25rem 0.75rem; font-size: 0.875rem;">
                                                Se skudd
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else {
        // Defense mode statistics
        const keeperStats = players.filter(p => p.isKeeper).map(keeper => {
            const keeperShots = events.filter(e =>
                e.mode === 'defense' && e.keeper?.id === keeper.id
            );
            const totalShots = keeperShots.length;
            const saves = keeperShots.filter(e => e.result === 'redning').length;
            const savePercent = totalShots > 0 ? ((saves / totalShots) * 100).toFixed(1) : 0;

            return `
                <tr>
                    <td>${keeper.number}</td>
                    <td style="font-weight: 600;">${keeper.name}</td>
                    <td class="text-center">${totalShots}</td>
                    <td class="text-center">${saves}</td>
                    <td class="text-center" style="font-weight: 700; color: #059669;">${savePercent}%</td>
                    <td class="text-center">
                        <button class="btn btn-success"
                                data-action="showKeeperDetails" data-keeper-id="${keeper.id}"
                                style="padding: 0.25rem 0.75rem; font-size: 0.875rem;">
                            Se skudd
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        const opponentStats = opponents.map(opponent => {
            const total = getOpponentStats(opponent.id);
            const totalShots = total.shots.length;
            const shootingPercent = totalShots > 0 ? ((total.goals / totalShots) * 100).toFixed(1) : 0;
            return {
                opponent,
                totalShots,
                goals: total.goals,
                shootingPercent: parseFloat(shootingPercent)
            };
        }).sort((a, b) => b.goals - a.goals).map(({ opponent, totalShots, goals, shootingPercent }) => `
            <tr>
                <td>${opponent.number}</td>
                <td style="font-weight: 600;">${opponent.name}</td>
                <td class="text-center">${totalShots}</td>
                <td class="text-center" style="font-weight: 700; color: #dc2626;">${goals}</td>
                <td class="text-center" style="font-weight: 700; color: #ea580c;">${shootingPercent}%</td>
                <td class="text-center">
                    <button class="btn btn-orange"
                            data-action="showOpponentDetails" data-opponent-id="${opponent.id}"
                            style="padding: 0.25rem 0.75rem; font-size: 0.875rem;">
                        Se skudd
                    </button>
                </td>
            </tr>
        `).join('');

        return `
            <div class="card">
                <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81; margin-bottom: 1rem;">
                    Statistikk
                </h2>
                <div class="grid-2 mb-6">
                    <button class="btn btn-blue" data-action="setMode" data-mode="attack">
                        Se ${APP.homeTeam} angrep
                    </button>
                    <button class="btn btn-orange" data-action="setMode" data-mode="defense">
                        Se keeper mot ${APP.awayTeam}
                    </button>
                </div>

                <div class="mb-6">
                    <h3 style="font-size: 1.25rem; font-weight: 700; color: #312e81; margin-bottom: 1rem;">
                        Våre keepere
                    </h3>
                    <div style="overflow-x: auto;">
                        <table>
                            <thead class="keeper-head">
                                <tr>
                                    <th>Nr</th>
                                    <th>Keeper</th>
                                    <th class="text-center">Mottatte skudd</th>
                                    <th class="text-center">Redninger</th>
                                    <th class="text-center" style="font-weight: 700;">Redningsprosent</th>
                                    <th class="text-center">Detaljer</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${keeperStats}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <h3 style="font-size: 1.25rem; font-weight: 700; color: #c2410c; margin-bottom: 1rem;">
                        Motstanderstatistikk
                    </h3>
                    <div style="overflow-x: auto;">
                        <table>
                            <thead class="opponent-head">
                                <tr>
                                    <th>Nr</th>
                                    <th>Motstander</th>
                                    <th class="text-center">Avfyrte skudd</th>
                                    <th class="text-center">Mål</th>
                                    <th class="text-center" style="font-weight: 700;">Uttelling %</th>
                                    <th class="text-center">Detaljer</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${opponentStats}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
}

// Popup rendering functions
export function renderTechnicalPopup() {
    return `
        <div id="technicalPopup" class="modal hidden">
            <div class="modal-content"></div>
        </div>
    `;
}

export function renderShotPopup() {
    return `
        <div id="shotPopup" class="modal hidden">
            <div class="modal-content"></div>
        </div>
    `;
}

export function renderShotDetailsPopup() {
    return `
        <div id="shotDetailsPopup" class="modal hidden">
            <div class="modal-content"></div>
        </div>
    `;
}
