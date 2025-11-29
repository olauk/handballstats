// ============================================
// STATE MANAGEMENT
// ============================================
const state = {
    page: 'setup', // 'setup' or 'match'
    homeTeam: 'Hjemmelag',
    awayTeam: 'Bortelag',
    currentHalf: 1,
    players: [{ id: 1, name: 'Spiller 1', number: 1, isKeeper: false }],
    opponents: [{ id: 1, name: 'Motstander 1', number: 1 }],
    activeKeeper: null,
    mode: 'attack', // 'attack' or 'defense'
    events: [],
    tempShot: null,
    selectedResult: null,
    showShotDetails: false,
    shotDetailsData: null
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
function generateId(array) {
    return array.length > 0 ? Math.max(...array.map(item => item.id)) + 1 : 1;
}

function getPlayerStats(playerId, half = null) {
    const playerEvents = state.events.filter(e => 
        e.player?.id === playerId && 
        (half === null || e.half === half) &&
        e.mode === 'attack'
    );
    return {
        goals: playerEvents.filter(e => e.result === 'mål').length,
        saved: playerEvents.filter(e => e.result === 'redning').length,
        outside: playerEvents.filter(e => e.result === 'utenfor').length,
        technical: state.events.filter(e => e.player?.id === playerId && e.mode === 'technical' && (half === null || e.half === half)).length
    };
}

function getOpponentStats(opponentId, half = null) {
    const opponentEvents = state.events.filter(e => 
        e.opponent?.id === opponentId && 
        (half === null || e.half === half) &&
        e.mode === 'defense'
    );
    return {
        goals: opponentEvents.filter(e => e.result === 'mål').length,
        saved: opponentEvents.filter(e => e.result === 'redning').length,
        shots: opponentEvents
    };
}

// ============================================
// PLAYER MANAGEMENT
// ============================================
function addPlayer() {
    const newPlayer = {
        id: generateId(state.players),
        name: `Spiller ${generateId(state.players)}`,
        number: generateId(state.players),
        isKeeper: false
    };
    state.players.push(newPlayer);
    render();
}

function removePlayer(id) {
    if (state.players.length > 1) {
        state.players = state.players.filter(p => p.id !== id);
        render();
    }
}

function updatePlayerName(id, name) {
    const player = state.players.find(p => p.id === id);
    if (player) player.name = name;
}

function updatePlayerNumber(id, number) {
    const player = state.players.find(p => p.id === id);
    if (player) player.number = parseInt(number) || 0;
}

function toggleKeeper(id) {
    const player = state.players.find(p => p.id === id);
    if (player) {
        player.isKeeper = !player.isKeeper;
        render();
    }
}

function addOpponent() {
    const newOpponent = {
        id: generateId(state.opponents),
        name: `Motstander ${generateId(state.opponents)}`,
        number: generateId(state.opponents)
    };
    state.opponents.push(newOpponent);
    render();
}

function removeOpponent(id) {
    if (state.opponents.length > 1) {
        state.opponents = state.opponents.filter(o => o.id !== id);
        render();
    }
}

function updateOpponentName(id, name) {
    const opponent = state.opponents.find(o => o.id === id);
    if (opponent) opponent.name = name;
}

function updateOpponentNumber(id, number) {
    const opponent = state.opponents.find(o => o.id === id);
    if (opponent) opponent.number = parseInt(number) || 0;
}

// ============================================
// SHOT REGISTRATION
// ============================================
function handleGoalClick(e, zone) {
    e.stopPropagation();
    
    if (zone === 'outside') {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
        const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
        
        state.tempShot = {
            x: parseFloat(x),
            y: parseFloat(y),
            zone: 'outside'
        };
    } else {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (((e.clientX - rect.left - 12) / (rect.width - 24)) * 100).toFixed(1);
        const y = (((e.clientY - rect.top - 12) / (rect.height - 12)) * 100).toFixed(1);
        
        state.tempShot = {
            x: parseFloat(x),
            y: parseFloat(y),
            zone: 'goal'
        };
    }
    
    state.selectedResult = null;
    render(); // Re-render to show the popup
    
    // Show modal after render
    setTimeout(() => {
        const modal = document.getElementById('shotPopup');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }, 0);
}

function registerShot(player, result) {
    if (!state.tempShot) return;

    const event = {
        id: Date.now(),
        half: state.currentHalf,
        mode: state.mode,
        player: state.mode === 'attack' ? player : null,
        opponent: state.mode === 'defense' ? player : null,
        keeper: state.mode === 'defense' ? state.activeKeeper : null,
        x: state.tempShot.x,
        y: state.tempShot.y,
        result: state.tempShot.zone === 'outside' ? 'utenfor' : result,
        zone: state.tempShot.zone,
        timestamp: new Date().toLocaleTimeString('no-NO')
    };
    
    state.events.push(event);
    closeModal('shotPopup');
    state.tempShot = null;
    state.selectedResult = null;
    render();
}

function registerTechnicalError(player) {
    const event = {
        id: Date.now(),
        half: state.currentHalf,
        mode: 'technical',
        player: player,
        result: 'teknisk feil',
        timestamp: new Date().toLocaleTimeString('no-NO')
    };
    state.events.push(event);
    closeModal('technicalPopup');
    render();
}

// ============================================
// MODAL MANAGEMENT
// ============================================
function showModal(modalId) {
    setTimeout(() => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    }, 0);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
}

function showPlayerShotDetails(player, isOpponent = false) {
    const playerShots = state.events.filter(e => {
        if (isOpponent) {
            return e.opponent?.id === player.id && e.zone === 'goal';
        } else {
            return e.player?.id === player.id && e.zone === 'goal';
        }
    });
    
    state.shotDetailsData = {
        player,
        shots: playerShots,
        isOpponent
    };
    showModal('shotDetailsPopup');
    render();
}

function showKeeperShotDetails(keeper) {
    const keeperShots = state.events.filter(e => 
        e.keeper?.id === keeper.id && e.zone === 'goal'
    );
    
    state.shotDetailsData = {
        player: keeper,
        shots: keeperShots,
        isKeeper: true
    };
    showModal('shotDetailsPopup');
    render();
}

// ============================================
// DATA MANAGEMENT
// ============================================
function exportData() {
    const data = {
        players: state.players,
        opponents: state.opponents,
        events: state.events,
        homeTeam: state.homeTeam,
        awayTeam: state.awayTeam,
        timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `handball-stats-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

function resetMatch() {
    if (confirm('Er du sikker på at du vil nullstille kampen?')) {
        state.events = [];
        state.currentHalf = 1;
        render();
    }
}

// ============================================
// RENDER FUNCTIONS
// ============================================
function render() {
    const app = document.getElementById('app');
    if (!app) return;
    
    if (state.page === 'setup') {
        app.innerHTML = renderSetupPage();
    } else {
        app.innerHTML = renderMatchPage();
    }
    
    attachEventListeners();
}

function renderSetupPage() {
    return `
        <div class="container">
            <div class="card">
                <h1 style="text-align: center; font-size: 2.5rem; font-weight: 800; color: #312e81; margin-bottom: 2rem;">
                    Oppsett av kamp
                </h1>
                
                <div class="grid-2 mb-6">
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Hjemmelag</label>
                        <input type="text" id="homeTeamInput" value="${state.homeTeam}" 
                               onchange="state.homeTeam = this.value" placeholder="Navn på hjemmelag">
                    </div>
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Bortelag</label>
                        <input type="text" id="awayTeamInput" value="${state.awayTeam}"
                               onchange="state.awayTeam = this.value" placeholder="Navn på bortelag">
                    </div>
                </div>

                <div class="mb-6">
                    <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81; margin-bottom: 1rem;">
                        ${state.homeTeam} - Spillere
                    </h2>
                    <div style="max-height: 400px; overflow-y: auto; margin-bottom: 1rem;">
                        ${state.players.map(player => `
                            <div class="player-item">
                                <input type="number" value="${player.number}" 
                                       onchange="updatePlayerNumber(${player.id}, this.value)"
                                       style="width: 80px;" placeholder="Nr">
                                <input type="text" value="${player.name}"
                                       onchange="updatePlayerName(${player.id}, this.value)"
                                       style="flex: 1;" placeholder="Spillernavn">
                                <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: white; border-radius: 0.5rem; border: 2px solid #d1d5db; cursor: pointer;">
                                    <input type="checkbox" ${player.isKeeper ? 'checked' : ''}
                                           onchange="toggleKeeper(${player.id})">
                                    <span style="font-weight: 600; white-space: nowrap;">Keeper</span>
                                </label>
                                <button class="btn btn-danger" onclick="removePlayer(${player.id})" 
                                        style="padding: 0.5rem; font-size: 1.25rem;">×</button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-blue" onclick="addPlayer()" style="width: 100%; font-size: 1.125rem;">
                        + Legg til spiller
                    </button>
                </div>

                <div class="mb-6">
                    <h2 style="font-size: 1.5rem; font-weight: 700; color: #c2410c; margin-bottom: 1rem;">
                        ${state.awayTeam} - Spillere
                    </h2>
                    <div style="max-height: 400px; overflow-y: auto; margin-bottom: 1rem;">
                        ${state.opponents.map(opponent => `
                            <div class="player-item opponent-item">
                                <input type="number" value="${opponent.number}"
                                       onchange="updateOpponentNumber(${opponent.id}, this.value)"
                                       style="width: 80px;" placeholder="Nr">
                                <input type="text" value="${opponent.name}"
                                       onchange="updateOpponentName(${opponent.id}, this.value)"
                                       style="flex: 1;" placeholder="Spillernavn">
                                <button class="btn btn-danger" onclick="removeOpponent(${opponent.id})"
                                        style="padding: 0.5rem; font-size: 1.25rem;">×</button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-orange" onclick="addOpponent()" style="width: 100%; font-size: 1.125rem;">
                        + Legg til spiller
                    </button>
                </div>

                <button class="btn btn-success" onclick="state.page = 'match'; render();" 
                        style="width: 100%; font-size: 1.25rem; padding: 1rem; font-weight: 700;">
                    ▶ Start kamp
                </button>
            </div>
        </div>
    `;
}

function renderMatchPage() {
    const keeperOptions = state.players.filter(p => p.isKeeper).map(k => 
        `<option value="${k.id}" ${state.activeKeeper?.id === k.id ? 'selected' : ''}>
            #${k.number} - ${k.name}
        </option>`
    ).join('');

    return `
        <div class="container">
            <div class="card">
                <div class="flex flex-between flex-wrap mb-4" style="gap: 1rem; align-items: center;">
                    <div class="flex" style="gap: 1rem; align-items: center;">
                        <button class="btn btn-secondary" onclick="state.page = 'setup'; render();">
                            ← Tilbake til oppsett
                        </button>
                        <h1 style="font-size: 1.5rem; font-weight: 700; color: #312e81;">
                            ${state.homeTeam} vs ${state.awayTeam}
                        </h1>
                    </div>
                    <div class="flex" style="gap: 0.5rem;">
                        <button class="btn btn-danger" onclick="resetMatch()">
                            🔄 Nullstill
                        </button>
                        <button class="btn btn-success" onclick="exportData()">
                            💾 Eksporter
                        </button>
                    </div>
                </div>

                <div class="flex flex-gap mb-4">
                    <button class="btn ${state.currentHalf === 1 ? 'btn-primary' : 'btn-secondary'}"
                            onclick="state.currentHalf = 1; render();">
                        1. omgang
                    </button>
                    <button class="btn ${state.currentHalf === 2 ? 'btn-primary' : 'btn-secondary'}"
                            onclick="state.currentHalf = 2; render();">
                        2. omgang
                    </button>
                </div>

                <div class="flex flex-gap mb-4">
                    <button class="btn ${state.mode === 'attack' ? 'btn-blue' : 'btn-secondary'}"
                            onclick="state.mode = 'attack'; render();" style="flex: 1;">
                        Angrep (${state.homeTeam})
                    </button>
                    <button class="btn ${state.mode === 'defense' ? 'btn-orange' : 'btn-secondary'}"
                            onclick="state.mode = 'defense'; render();" style="flex: 1;">
                        Forsvar (Keeper mot ${state.awayTeam})
                    </button>
                </div>

                ${state.mode === 'defense' ? `
                    <div class="mb-4">
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">
                            Velg aktiv keeper:
                        </label>
                        <select onchange="state.activeKeeper = state.players.find(p => p.id === parseInt(this.value)); render();">
                            <option value="">Ingen keeper valgt</option>
                            ${keeperOptions}
                        </select>
                    </div>
                ` : ''}

                ${state.mode === 'attack' ? `
                    <button class="btn btn-warning" onclick="showModal('technicalPopup')" 
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

function renderGoalVisualization() {
    const shots = state.events.filter(e => 
        e.mode === state.mode && (e.player || e.opponent) && e.zone === 'goal'
    ).map(event => {
        const playerNumber = state.mode === 'attack' ? event.player?.number : event.opponent?.number;
        const className = event.result === 'mål' ? 'goal' : 'save';
        return `
            <div class="shot-marker ${className}" 
                 style="left: ${event.x}%; top: ${event.y}%;"
                 title="${event.result} - ${event.timestamp}">
                ${playerNumber}
            </div>
        `;
    }).join('');

    const tempShotMarker = state.tempShot && state.tempShot.zone === 'goal' ? `
        <div class="shot-marker temp" 
             style="left: ${state.tempShot.x}%; top: ${state.tempShot.y}%;">
            ⚽
        </div>
    ` : '';

    return `
        <div class="card">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #312e81; margin-bottom: 1rem;">
                ${state.mode === 'attack' ? 'Registrer skudd' : 'Registrer motstanderskudd'}
            </h2>
            <div class="goal-container" id="goalContainer">
                <div class="goal" id="goalArea">
                    <div class="goal-grid">
                        ${[...Array(6)].map(() => '<div class="goal-grid-cell"></div>').join('')}
                    </div>
                    ${shots}
                    ${tempShotMarker}
                </div>
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

function renderStatistics() {
    if (state.mode === 'attack') {
        return `
            <div class="card">
                <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81; margin-bottom: 1rem;">
                    Statistikk
                </h2>
                <div class="grid-2 mb-6">
                    <button class="btn btn-blue" onclick="state.mode = 'attack'; render();">
                        Se ${state.homeTeam} angrep
                    </button>
                    <button class="btn btn-orange" onclick="state.mode = 'defense'; render();">
                        Se keeper mot ${state.awayTeam}
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
                            ${state.players.map(player => {
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
                                                    onclick="showPlayerShotDetails(state.players[${state.players.findIndex(p => p.id === player.id)}], false)"
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
        const keeperStats = state.players.filter(p => p.isKeeper).map(keeper => {
            const keeperShots = state.events.filter(e => 
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
                                onclick="showKeeperShotDetails(state.players[${state.players.findIndex(p => p.id === keeper.id)}])"
                                style="padding: 0.25rem 0.75rem; font-size: 0.875rem;">
                            Se skudd
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        const opponentStats = state.opponents.map(opponent => {
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
                            onclick="showPlayerShotDetails(state.opponents[${state.opponents.findIndex(o => o.id === opponent.id)}], true)"
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
                    <button class="btn btn-blue" onclick="state.mode = 'attack'; render();">
                        Se ${state.homeTeam} angrep
                    </button>
                    <button class="btn btn-orange" onclick="state.mode = 'defense'; render();">
                        Se keeper mot ${state.awayTeam}
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

function renderTechnicalPopup() {
    return `
        <div id="technicalPopup" class="modal hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81;">
                        Velg spiller som begikk teknisk feil
                    </h2>
                    <button class="btn btn-secondary" onclick="closeModal('technicalPopup')">
                        Lukk
                    </button>
                </div>
                <div class="player-grid">
                    ${state.players.map((player, index) => `
                        <button class="player-button" onclick="registerTechnicalError(state.players[${index}])">
                            <span class="player-number">${player.number}</span>
                            <span class="player-name">${player.name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderShotPopup() {
    const isOutside = state.tempShot?.zone === 'outside';
    const needsResult = !isOutside && !state.selectedResult;
    
    const playersList = state.mode === 'attack' ? state.players : state.opponents;
    
    return `
        <div id="shotPopup" class="modal hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81;">
                        ${state.mode === 'attack' ? 'Registrer skudd' : 'Registrer motstanderskudd'}
                    </h2>
                    <button class="btn btn-secondary" onclick="closeModal('shotPopup'); state.tempShot = null; state.selectedResult = null; render();">
                        Lukk
                    </button>
                </div>
                
                <p style="color: #4b5563; margin-bottom: 1.5rem;">
                    ${isOutside 
                        ? 'Skudd utenfor mål - velg spiller'
                        : state.selectedResult 
                            ? 'Velg spiller som avfyrte skuddet'
                            : 'Velg resultat av skuddet'}
                </p>
                
                ${needsResult ? `
                    <div class="mb-6">
                        <h3 style="font-weight: 600; font-size: 1.125rem; margin-bottom: 1rem;">Velg resultat:</h3>
                        <div class="grid-2">
                            <button class="btn btn-success" onclick="state.selectedResult = 'mål'; render(); setTimeout(() => showModal('shotPopup'), 0);"
                                    style="padding: 1rem; font-size: 1.125rem;">
                                ⚽ Mål
                            </button>
                            <button class="btn btn-warning" onclick="state.selectedResult = 'redning'; render(); setTimeout(() => showModal('shotPopup'), 0);"
                                    style="padding: 1rem; font-size: 1.125rem;">
                                🧤 Redning
                            </button>
                        </div>
                    </div>
                ` : ''}

                ${(state.selectedResult || isOutside) ? `
                    <div>
                        <h3 style="font-weight: 600; font-size: 1.125rem; margin-bottom: 1rem;">
                            Velg spiller:
                            ${state.selectedResult ? `
                                <span style="font-weight: 400; font-size: 0.875rem; color: #4b5563;">
                                    (Resultat: ${state.selectedResult === 'mål' ? '⚽ Mål' : '🧤 Redning'})
                                </span>
                            ` : ''}
                        </h3>
                        <div class="player-grid">
                            ${playersList.map((player, index) => `
                                <button class="player-button" 
                                        onclick="registerShot((state.mode === 'attack' ? state.players : state.opponents)[${index}], '${isOutside ? 'utenfor' : state.selectedResult}')">
                                    <span class="player-number">${player.number}</span>
                                    <span class="player-name">${player.name}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function renderShotDetailsPopup() {
    if (!state.shotDetailsData) return '';
    
    const { player, shots, isOpponent, isKeeper } = state.shotDetailsData;
    const goals = shots.filter(s => s.result === 'mål').length;
    const saves = shots.filter(s => s.result === 'redning').length;
    const shootingPercent = shots.length > 0 ? ((goals / shots.length) * 100).toFixed(1) : 0;

    const shotMarkers = shots.map(shot => {
        const playerNumber = isKeeper ? shot.opponent?.number : isOpponent ? shot.opponent?.number : shot.player?.number;
        const className = shot.result === 'mål' ? 'goal' : 'save';
        return `
            <div class="shot-marker ${className}" 
                 style="left: ${shot.x}%; top: ${shot.y}%;"
                 title="${shot.result} - ${shot.timestamp}">
                ${playerNumber}
            </div>
        `;
    }).join('');

    return `
        <div id="shotDetailsPopup" class="modal hidden">
            <div class="modal-content" style="max-height: 90vh; overflow-y: auto;">
                <div class="modal-header" style="position: sticky; top: 0; background: white; z-index: 10;">
                    <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81;">
                        ${isKeeper 
                            ? `Keeper ${player.name} (#${player.number}) - Mottatte skudd`
                            : `${player.name} (#${player.number}) - Skudd`}
                    </h2>
                    <button class="btn btn-secondary" onclick="closeModal('shotDetailsPopup'); state.shotDetailsData = null; render();">
                        Lukk
                    </button>
                </div>

                ${shots.length === 0 ? `
                    <p style="text-align: center; color: #4b5563; padding: 2rem;">Ingen skudd registrert</p>
                ` : `
                    <div class="stats-grid mb-6">
                        <div class="stat-card green">
                            <div class="stat-value green">${goals}</div>
                            <div class="stat-label">Mål</div>
                        </div>
                        <div class="stat-card amber">
                            <div class="stat-value amber">${saves}</div>
                            <div class="stat-label">Redninger</div>
                        </div>
                        <div class="stat-card blue">
                            <div class="stat-value blue">${shots.length}</div>
                            <div class="stat-label">Totalt skudd</div>
                        </div>
                        <div class="stat-card purple">
                            <div class="stat-value purple">${shootingPercent}%</div>
                            <div class="stat-label">${isKeeper ? 'Innsluppsprosent' : 'Uttelling'}</div>
                        </div>
                    </div>

                    <div class="goal-container" style="padding-top: 3rem; padding-left: 3rem; padding-right: 3rem; cursor: default;">
                        <div class="goal" style="cursor: default;">
                            <div class="goal-grid">
                                ${[...Array(6)].map(() => '<div class="goal-grid-cell"></div>').join('')}
                            </div>
                            ${shotMarkers}
                        </div>
                    </div>

                    <div class="legend mt-4">
                        <div class="legend-item">
                            <div class="legend-color green"></div>
                            <span style="font-weight: 500;">Mål</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color amber"></div>
                            <span style="font-weight: 500;">Redning</span>
                        </div>
                    </div>
                `}
            </div>
        </div>
    `;
}

// ============================================
// EVENT LISTENERS
// ============================================
function attachEventListeners() {
    // Goal area click handler
    const goalArea = document.getElementById('goalArea');
    if (goalArea) {
        goalArea.addEventListener('click', (e) => handleGoalClick(e, 'goal'));
    }

    // Goal container (outside area) click handler
    const goalContainer = document.getElementById('goalContainer');
    if (goalContainer) {
        goalContainer.addEventListener('click', (e) => {
            if (e.target === goalContainer) {
                handleGoalClick(e, 'outside');
            }
        });
    }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    render();
});
