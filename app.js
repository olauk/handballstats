// ============================================
// GLOBAL STATE
// ============================================
const APP = {
    currentUser: null,
    page: 'login', // 'login', 'setup', 'match', 'history'
    homeTeam: 'Hjemmelag',
    awayTeam: 'Bortelag',
    matchDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    currentHalf: 1,
    players: [],
    opponents: [],
    activeKeeper: null,
    mode: 'attack',
    events: [],
    tempShot: null,
    selectedResult: null,
    showShotDetails: false,
    shotDetailsData: null,
    completedMatches: [], // Array of completed matches
    viewingMatch: null, // For viewing a specific completed match
    // Player management popup state
    managingTeam: null, // 'players' or 'opponents'
    tempPlayersList: [], // Temporary list while editing
    editingPlayerId: null // ID of player being edited
};

// ============================================
// PERFORMANCE OPTIMIZATIONS
// ============================================
const PERFORMANCE = {
    statsCache: new Map(),
    cacheVersion: 0,
    saveTimeout: null,

    invalidateStatsCache() {
        this.cacheVersion++;
        this.statsCache.clear();
    },

    getCachedStats(key, calculator) {
        const cacheKey = `${key}-v${this.cacheVersion}`;
        if (!this.statsCache.has(cacheKey)) {
            this.statsCache.set(cacheKey, calculator());
        }
        return this.statsCache.get(cacheKey);
    }
};

// ============================================
// HELPER FUNCTIONS FOR VIEWING MATCHES
// ============================================
// These functions return the correct data whether we're viewing a live match
// or a completed match from history
function getCurrentEvents() {
    return APP.page === 'viewMatch' && APP.viewingMatch
        ? APP.viewingMatch.events
        : APP.events;
}

function getCurrentPlayers() {
    return APP.page === 'viewMatch' && APP.viewingMatch
        ? APP.viewingMatch.players
        : APP.players;
}

function getCurrentOpponents() {
    return APP.page === 'viewMatch' && APP.viewingMatch
        ? APP.viewingMatch.opponents
        : APP.opponents;
}

// ============================================
// LOGIN & AUTH
// ============================================
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Dummy authentication
    if (username === 'Ola' && password === 'handball') {
        APP.currentUser = username;
        APP.page = 'welcome';
        saveToLocalStorageImmediate(); // Bruk umiddelbar lagring for kritiske operasjoner
        render();
    } else {
        alert('Feil brukernavn eller passord. Prøv: Ola / handball');
    }
}

function handleLogout() {
    if (confirm('Er du sikker på at du vil logge ut?')) {
        APP.currentUser = null;
        APP.page = 'login';
        render();
    }
}

function startNewMatch() {
    // Nullstill spillerdata, men behold kamphistorikk
    APP.players = [];
    APP.opponents = [];
    APP.homeTeam = 'Hjemmelag';
    APP.awayTeam = 'Bortelag';
    APP.matchDate = new Date().toISOString().split('T')[0];
    APP.events = [];
    APP.currentHalf = 1;
    APP.activeKeeper = null;
    APP.mode = 'attack';
    APP.tempShot = null;
    APP.selectedResult = null;

    // Invalider cache
    PERFORMANCE.invalidateStatsCache();

    APP.page = 'setup';
    saveToLocalStorageImmediate();
    render();
}

// ============================================
// LOCAL STORAGE
// ============================================
function saveToLocalStorage() {
    // Debounce: Vent 300ms før lagring for å unngå for mange skriveoperasjoner
    clearTimeout(PERFORMANCE.saveTimeout);
    PERFORMANCE.saveTimeout = setTimeout(() => {
        try {
            localStorage.setItem('handballApp', JSON.stringify(APP));
        } catch (e) {
            console.error('Kunne ikke lagre til localStorage:', e);
        }
    }, 300);
}

function saveToLocalStorageImmediate() {
    // For kritiske operasjoner som krever umiddelbar lagring
    clearTimeout(PERFORMANCE.saveTimeout);
    try {
        localStorage.setItem('handballApp', JSON.stringify(APP));
    } catch (e) {
        console.error('Kunne ikke lagre til localStorage:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('handballApp');
        if (saved) {
            const data = JSON.parse(saved);
            // Restore everything except functions
            Object.assign(APP, data);
        }
    } catch (e) {
        console.error('Kunne ikke laste fra localStorage:', e);
    }
}

// ============================================
// STATISTICS FUNCTIONS
// ============================================
function getTeamGoals(team = 'home') {
    const events = getCurrentEvents();
    if (team === 'home') {
        return events.filter(e => e.mode === 'attack' && e.result === 'mål').length;
    } else {
        return events.filter(e => e.mode === 'defense' && e.result === 'mål').length;
    }
}

function getPlayerStats(playerId, half = null) {
    // Bruk cache for å unngå å re-kalkulere statistikk ved hver render
    return PERFORMANCE.getCachedStats(`player-${playerId}-${half}`, () => {
        const events = getCurrentEvents();
        const playerEvents = events.filter(e =>
            e.player?.id === playerId &&
            (half === null || e.half === half) &&
            e.mode === 'attack'
        );
        return {
            goals: playerEvents.filter(e => e.result === 'mål').length,
            saved: playerEvents.filter(e => e.result === 'redning').length,
            outside: playerEvents.filter(e => e.result === 'utenfor').length,
            technical: events.filter(e => e.player?.id === playerId && e.mode === 'technical' && (half === null || e.half === half)).length
        };
    });
}

function getOpponentStats(opponentId, half = null) {
    // Bruk cache for å unngå å re-kalkulere statistikk ved hver render
    return PERFORMANCE.getCachedStats(`opponent-${opponentId}-${half}`, () => {
        const events = getCurrentEvents();
        const opponentEvents = events.filter(e =>
            e.opponent?.id === opponentId &&
            (half === null || e.half === half) &&
            e.mode === 'defense'
        );
        return {
            goals: opponentEvents.filter(e => e.result === 'mål').length,
            saved: opponentEvents.filter(e => e.result === 'redning').length,
            shots: opponentEvents
        };
    });
}

// ============================================
// PLAYER MANAGEMENT
// ============================================
function openPlayersManagement() {
    APP.managingTeam = 'players';
    APP.tempPlayersList = JSON.parse(JSON.stringify(APP.players));
    APP.editingPlayerId = null;
    updatePlayersManagementModal();
    showModal('playersManagementPopup');
}

function openOpponentsManagement() {
    APP.managingTeam = 'opponents';
    APP.tempPlayersList = JSON.parse(JSON.stringify(APP.opponents));
    APP.editingPlayerId = null;
    updatePlayersManagementModal();
    showModal('playersManagementPopup');
}

function addPlayerToTempList() {
    const numberInput = document.getElementById('playerNumberInput');
    const nameInput = document.getElementById('playerNameInput');
    const isKeeperInput = document.getElementById('playerIsKeeperInput');

    const numberValue = numberInput?.value?.trim();
    const nameValue = nameInput?.value?.trim();
    const number = parseInt(numberValue);
    const name = nameValue;
    const isKeeper = isKeeperInput?.checked || false;

    // Validering
    if (!numberValue || !nameValue) {
        alert('Vennligst fyll ut både nummer og navn');
        return;
    }

    if (isNaN(number) || number <= 0) {
        alert('Spillernummer må være et positivt tall');
        return;
    }

    if (APP.editingPlayerId) {
        // Rediger eksisterende spiller
        const player = APP.tempPlayersList.find(p => p.id === APP.editingPlayerId);
        if (player) {
            player.number = number;
            player.name = name;
            if (APP.managingTeam === 'players') {
                player.isKeeper = isKeeper;
            }
        }
        APP.editingPlayerId = null;
    } else {
        // Legg til ny spiller
        const newId = Date.now() + Math.floor(Math.random() * 1000);
        const newPlayer = {
            id: newId,
            number: number,
            name: name
        };

        if (APP.managingTeam === 'players') {
            newPlayer.isKeeper = isKeeper;
        }

        APP.tempPlayersList.push(newPlayer);
    }

    // Tøm feltene
    if (numberInput) numberInput.value = '';
    if (nameInput) nameInput.value = '';
    if (isKeeperInput) isKeeperInput.checked = false;

    updatePlayersManagementModal();
}

function editPlayerInTempList(playerId) {
    const player = APP.tempPlayersList.find(p => p.id === playerId);
    if (!player) return;

    APP.editingPlayerId = playerId;

    // Fyll feltene med spillerdata
    const numberInput = document.getElementById('playerNumberInput');
    const nameInput = document.getElementById('playerNameInput');
    const isKeeperInput = document.getElementById('playerIsKeeperInput');

    if (numberInput) numberInput.value = player.number;
    if (nameInput) nameInput.value = player.name;
    if (isKeeperInput && APP.managingTeam === 'players') {
        isKeeperInput.checked = player.isKeeper || false;
    }
}

function removePlayerFromTempList(playerId) {
    APP.tempPlayersList = APP.tempPlayersList.filter(p => p.id !== playerId);
    if (APP.editingPlayerId === playerId) {
        APP.editingPlayerId = null;
        // Tøm feltene
        const numberInput = document.getElementById('playerNumberInput');
        const nameInput = document.getElementById('playerNameInput');
        const isKeeperInput = document.getElementById('playerIsKeeperInput');
        if (numberInput) numberInput.value = '';
        if (nameInput) nameInput.value = '';
        if (isKeeperInput) isKeeperInput.checked = false;
    }
    updatePlayersManagementModal();
}

function savePlayersList() {
    if (APP.managingTeam === 'players') {
        APP.players = JSON.parse(JSON.stringify(APP.tempPlayersList));
    } else {
        APP.opponents = JSON.parse(JSON.stringify(APP.tempPlayersList));
    }

    APP.tempPlayersList = [];
    APP.managingTeam = null;
    APP.editingPlayerId = null;

    closeModal('playersManagementPopup');
    saveToLocalStorage();
    render();
}

function cancelPlayersManagement() {
    APP.tempPlayersList = [];
    APP.managingTeam = null;
    APP.editingPlayerId = null;
    closeModal('playersManagementPopup');
}

function updatePlayersManagementModal() {
    const modal = document.getElementById('playersManagementPopup');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.innerHTML = renderPlayersManagementPopupContent();
    }
}

function renderPlayersManagementPopupContent() {
    const isPlayers = APP.managingTeam === 'players';
    const teamName = isPlayers ? APP.homeTeam : APP.awayTeam;
    const teamColor = isPlayers ? '#3b82f6' : '#f97316';
    const bgColor = isPlayers ? '#eff6ff' : '#ffedd5';

    return `
        <div class="modal-header">
            <h2 style="font-size: 1.5rem; font-weight: 700; color: ${teamColor};">
                ${isPlayers ? '⚽' : '🏐'} Håndter ${teamName} spillere
            </h2>
            <button class="btn btn-secondary" data-action="cancelPlayers">
                Lukk
            </button>
        </div>

        <div style="margin-bottom: 1.5rem; padding: 1rem; background: ${bgColor}; border-radius: 0.5rem;">
            <h3 style="font-weight: 600; margin-bottom: 1rem; font-size: 1.125rem;">
                ${APP.editingPlayerId ? 'Rediger spiller' : 'Legg til ny spiller'}
            </h3>
            <div class="grid-2 mb-4" style="gap: 0.5rem;">
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem;">
                        Nummer *
                    </label>
                    <input type="number" id="playerNumberInput"
                           placeholder="Spillernummer"
                           style="width: 100%; padding: 0.75rem; border: 2px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem;">
                </div>
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem;">
                        Navn *
                    </label>
                    <input type="text" id="playerNameInput"
                           placeholder="Spillernavn"
                           style="width: 100%; padding: 0.75rem; border: 2px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem;">
                </div>
            </div>
            ${isPlayers ? `
                <div style="margin-bottom: 1rem;">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="checkbox" id="playerIsKeeperInput">
                        <span style="font-weight: 600;">Keeper</span>
                    </label>
                </div>
            ` : ''}
            <button class="btn btn-success" data-action="addPlayerToList" style="width: 100%;">
                ${APP.editingPlayerId ? '✅ Oppdater spiller' : '+ Legg til spiller'}
            </button>
        </div>

        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-weight: 600; margin-bottom: 1rem; font-size: 1.125rem;">
                Spillerliste (${APP.tempPlayersList.length} spillere)
            </h3>
            ${APP.tempPlayersList.length === 0 ? `
                <p style="color: #6b7280; text-align: center; padding: 2rem;">
                    Ingen spillere lagt til ennå
                </p>
            ` : `
                <div style="max-height: 300px; overflow-y: auto;">
                    ${APP.tempPlayersList.map(player => `
                        <div class="player-item ${isPlayers ? '' : 'opponent-item'}" style="margin-bottom: 0.5rem;">
                            <span style="font-weight: 700; font-size: 1.25rem; min-width: 3rem; text-align: center; color: ${teamColor};">
                                #${player.number}
                            </span>
                            <span style="flex: 1; font-weight: 600;">
                                ${player.name}
                                ${player.isKeeper ? ' 🧤' : ''}
                            </span>
                            <button class="btn btn-blue" data-action="editPlayerInList" data-player-id="${player.id}"
                                    style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
                                ✏️ Rediger
                            </button>
                            <button class="btn btn-danger" data-action="removePlayerFromList" data-player-id="${player.id}"
                                    style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
                                🗑️ Fjern
                            </button>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>

        <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
            <button class="btn btn-secondary" data-action="cancelPlayers">
                Avbryt
            </button>
            <button class="btn btn-success" data-action="savePlayers" style="font-weight: 700;">
                💾 Lagre spillertropp
            </button>
        </div>
    `;
}

// ============================================
// SHOT REGISTRATION - THE KEY FIX!
// ============================================
function handleGoalClick(e) {
    const goalArea = document.getElementById('goalArea');
    const goalContainer = document.getElementById('goalContainer');
    
    let zone = 'outside';
    let rect;
    
    // Check if click was on goal area
    if (e.target === goalArea || goalArea.contains(e.target)) {
        zone = 'goal';
        rect = goalArea.getBoundingClientRect();
        
        // Adjust for 12px borders
        const x = (((e.clientX - rect.left - 12) / (rect.width - 24)) * 100).toFixed(1);
        const y = (((e.clientY - rect.top - 12) / (rect.height - 12)) * 100).toFixed(1);
        
        APP.tempShot = {
            x: parseFloat(x),
            y: parseFloat(y),
            zone: 'goal'
        };
    } else if (e.target === goalContainer || e.target.classList.contains('goal-container')) {
        // Click on gray area
        rect = goalContainer.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
        const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
        
        APP.tempShot = {
            x: parseFloat(x),
            y: parseFloat(y),
            zone: 'outside'
        };
    } else {
        return; // Clicked on something else (like a shot marker)
    }
    
    APP.selectedResult = null;
    render();
    showModal('shotPopup');
}

function selectShotResult(result) {
    APP.selectedResult = result;
    
    // Don't re-render everything - just update the modal content
    const shotPopup = document.getElementById('shotPopup');
    if (shotPopup) {
        const modalContent = shotPopup.querySelector('.modal-content');
        if (modalContent) {
            // Update only the modal content
            modalContent.innerHTML = renderShotPopupContent();
            attachModalEventListeners();
        }
    }
}

// Separate function for modal content only
function renderShotPopupContent() {
    const isOutside = APP.tempShot?.zone === 'outside';
    const needsResult = !isOutside && !APP.selectedResult;
    const playersList = APP.mode === 'attack' ? APP.players : APP.opponents;
    
    return `
        <div class="modal-header">
            <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81;">
                ${APP.mode === 'attack' ? 'Registrer skudd' : 'Registrer motstanderskudd'}
            </h2>
            <button class="btn btn-secondary" data-action="closeShotPopup">
                Lukk
            </button>
        </div>
        
        <p style="color: #4b5563; margin-bottom: 1.5rem;">
            ${isOutside 
                ? 'Skudd utenfor mål - velg spiller'
                : APP.selectedResult 
                    ? 'Velg spiller som avfyrte skuddet'
                    : 'Velg resultat av skuddet'}
        </p>
        
        ${needsResult ? `
            <div class="mb-6">
                <h3 style="font-weight: 600; font-size: 1.125rem; margin-bottom: 1rem;">Velg resultat:</h3>
                <div class="grid-2">
                    <button class="btn btn-success" data-action="selectResult" data-result="mål"
                            style="padding: 1rem; font-size: 1.125rem;">
                        ⚽ Mål
                    </button>
                    <button class="btn btn-warning" data-action="selectResult" data-result="redning"
                            style="padding: 1rem; font-size: 1.125rem;">
                        🧤 Redning
                    </button>
                </div>
            </div>
        ` : ''}

        ${(APP.selectedResult || isOutside) ? `
            <div>
                <h3 style="font-weight: 600; font-size: 1.125rem; margin-bottom: 1rem;">
                    Velg spiller:
                    ${APP.selectedResult ? `
                        <span style="font-weight: 400; font-size: 0.875rem; color: #4b5563;">
                            (Resultat: ${APP.selectedResult === 'mål' ? '⚽ Mål' : '🧤 Redning'})
                        </span>
                    ` : ''}
                </h3>
                <div class="player-grid">
                    ${playersList.map(player => `
                        <button class="player-button" data-action="registerShot" data-player-id="${player.id}">
                            <span class="player-number">${player.number}</span>
                            <span class="player-name">${player.name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
}

function registerShot(playerId) {
    if (!APP.tempShot) return;

    const player = APP.mode === 'attack'
        ? APP.players.find(p => p.id === playerId)
        : APP.opponents.find(p => p.id === playerId);

    if (!player) return;

    const event = {
        id: Date.now(),
        half: APP.currentHalf,
        mode: APP.mode,
        player: APP.mode === 'attack' ? player : null,
        opponent: APP.mode === 'defense' ? player : null,
        keeper: APP.mode === 'defense' ? APP.activeKeeper : null,
        x: APP.tempShot.x,
        y: APP.tempShot.y,
        result: APP.tempShot.zone === 'outside' ? 'utenfor' : APP.selectedResult,
        zone: APP.tempShot.zone,
        timestamp: new Date().toLocaleTimeString('no-NO')
    };

    APP.events.push(event);
    APP.tempShot = null;
    APP.selectedResult = null;

    // Invalider statistikk-cache siden vi har lagt til et nytt event
    PERFORMANCE.invalidateStatsCache();

    closeModal('shotPopup');
    saveToLocalStorage();

    // Optimalisert: Oppdater kun målvisualisering og statistikk, ikke hele siden
    updateGoalVisualization();
    updateStatisticsOnly();
}

// Optimized function to only update goal area without re-rendering everything
function updateGoalVisualization() {
    const goalContainer = document.getElementById('goalContainer');
    if (!goalContainer) {
        // If we're not on match page, do nothing
        return;
    }

    const goalArea = document.getElementById('goalArea');
    if (!goalArea) return;

    // Get all current shot markers
    const shots = APP.events.filter(e =>
        e.mode === APP.mode && (e.player || e.opponent) && e.zone === 'goal'
    );

    const outsideShots = APP.events.filter(e =>
        e.mode === APP.mode && (e.player || e.opponent) && e.zone === 'outside'
    );

    // Remove old markers
    goalArea.querySelectorAll('.shot-marker').forEach(el => el.remove());
    goalContainer.querySelectorAll('.shot-marker.outside').forEach(el => el.remove());

    // Add new goal markers
    shots.forEach(event => {
        const playerNumber = APP.mode === 'attack' ? event.player?.number : event.opponent?.number;
        const marker = document.createElement('div');
        marker.className = `shot-marker ${event.result === 'mål' ? 'goal' : 'save'}`;
        marker.style.left = `${event.x}%`;
        marker.style.top = `${event.y}%`;
        marker.textContent = playerNumber;
        marker.title = `${event.result} - ${event.timestamp}`;
        goalArea.appendChild(marker);
    });

    // Add outside markers
    outsideShots.forEach((event, index) => {
        const leftPosition = 10 + (index % 10) * 9;
        const marker = document.createElement('div');
        marker.className = 'shot-marker outside';
        marker.style.left = `${leftPosition}%`;
        marker.style.top = '12px';
        marker.style.position = 'absolute';
        marker.textContent = '⚽';
        marker.title = `${event.result} utenfor - ${event.timestamp}`;
        goalContainer.appendChild(marker);
    });
}

// Optimalisert funksjon for å kun oppdatere statistikk-seksjonen
function updateStatisticsOnly() {
    // Finn statistikk-kortet (siste .card element som inneholder statistikk)
    const allCards = document.querySelectorAll('.card');
    let statsCard = null;

    // Finn kortet med "Statistikk" overskrift
    allCards.forEach(card => {
        const heading = card.querySelector('h2');
        if (heading && heading.textContent.includes('Statistikk')) {
            statsCard = card;
        }
    });

    if (!statsCard) return;

    // Opprett nytt statistikk-innhold
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = renderStatistics();
    const newStatsCard = tempDiv.firstElementChild;

    // Erstatt gammelt kort med nytt
    statsCard.parentNode.replaceChild(newStatsCard, statsCard);

    // Re-attach event listeners for knappene i statistikk-tabellen
    attachStatisticsEventListeners();
}

// Funksjon for å kun re-attachе event listeners for statistikk-seksjonen
function attachStatisticsEventListeners() {
    // Event delegation håndterer allerede klikk, så denne er minimal
    // Men vi kan legge til spesifikke listeners her om nødvendig
}

function registerTechnicalError(playerId) {
    const player = APP.players.find(p => p.id === playerId);
    if (!player) return;

    const event = {
        id: Date.now(),
        half: APP.currentHalf,
        mode: 'technical',
        player: player,
        result: 'teknisk feil',
        timestamp: new Date().toLocaleTimeString('no-NO')
    };

    APP.events.push(event);

    // Invalider statistikk-cache siden vi har lagt til et nytt event
    PERFORMANCE.invalidateStatsCache();

    closeModal('technicalPopup');
    saveToLocalStorage();

    // Optimalisert: Oppdater kun statistikk, ikke hele siden
    updateStatisticsOnly();
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
    if (modal) {
        modal.classList.add('hidden');
    }
}

function showPlayerShotDetails(playerId, isOpponent = false) {
    const players = isOpponent ? getCurrentOpponents() : getCurrentPlayers();
    const player = players.find(p => p.id === playerId);

    if (!player) return;

    const events = getCurrentEvents();
    const playerShots = events.filter(e => {
        if (isOpponent) {
            return e.opponent?.id === playerId && e.zone === 'goal';
        } else {
            return e.player?.id === playerId && e.zone === 'goal';
        }
    });

    APP.shotDetailsData = {
        player,
        shots: playerShots,
        isOpponent
    };

    // Optimalisert: Oppdater kun modal-innholdet, ikke hele siden
    updateShotDetailsModal();
    showModal('shotDetailsPopup');
}

function showKeeperShotDetails(keeperId) {
    const players = getCurrentPlayers();
    const keeper = players.find(p => p.id === keeperId);
    if (!keeper) return;

    const events = getCurrentEvents();
    const keeperShots = events.filter(e =>
        e.keeper?.id === keeperId && e.zone === 'goal'
    );

    APP.shotDetailsData = {
        player: keeper,
        shots: keeperShots,
        isKeeper: true
    };

    // Optimalisert: Oppdater kun modal-innholdet, ikke hele siden
    updateShotDetailsModal();
    showModal('shotDetailsPopup');
}

// Ny funksjon for å oppdatere shotDetails modal uten full re-render
function updateShotDetailsModal() {
    const modal = document.getElementById('shotDetailsPopup');
    if (!modal) {
        // Modal eksisterer ikke ennå, la render() ta seg av det
        return;
    }

    const modalContent = modal.querySelector('.modal-content');
    if (modalContent && APP.shotDetailsData) {
        modalContent.innerHTML = renderShotDetailsPopupContent();
    }
}

// Separer innholdet i shotDetails modal
function renderShotDetailsPopupContent() {
    if (!APP.shotDetailsData) return '';

    const { player, shots, isOpponent, isKeeper } = APP.shotDetailsData;
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
        <div class="modal-header" style="position: sticky; top: 0; background: white; z-index: 10;">
            <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81;">
                ${isKeeper
                    ? `Keeper ${player.name} (#${player.number}) - Mottatte skudd`
                    : `${player.name} (#${player.number}) - Skudd`}
            </h2>
            <button class="btn btn-secondary" data-action="closeShotDetails">
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
    `;
}

// ============================================
// DATA MANAGEMENT
// ============================================
function loadPlayersFromFile() {
    const fileInput = document.getElementById('playersFileInput');
    fileInput.click();
}

function loadOpponentsFromFile() {
    const fileInput = document.getElementById('opponentsFileInput');
    fileInput.click();
}

function handlePlayersFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target.result;
            let players = [];

            if (file.name.endsWith('.json')) {
                // JSON format: [{id, name, number, isKeeper}, ...]
                players = JSON.parse(content);
            } else if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
                // CSV/TXT format: number,name,isKeeper (one per line)
                const lines = content.split('\n').filter(line => line.trim());
                players = lines.map((line, index) => {
                    const [number, name, isKeeper] = line.split(',').map(s => s.trim());
                    return {
                        id: Date.now() + index + Math.floor(Math.random() * 100),
                        name: name || `Spiller ${index + 1}`,
                        number: parseInt(number) || index + 1,
                        isKeeper: isKeeper === 'true' || isKeeper === '1'
                    };
                });
            }

            if (players.length > 0) {
                // Åpne popup med importerte spillere
                APP.managingTeam = 'players';
                APP.tempPlayersList = players;
                APP.editingPlayerId = null;
                updatePlayersManagementModal();
                showModal('playersManagementPopup');
            }
        } catch (error) {
            alert('Feil ved lasting av fil. Sjekk formatet og prøv igjen.\n\nFormat JSON: [{"id":1,"name":"Navn","number":1,"isKeeper":false}]\nFormat CSV/TXT: nummer,navn,isKeeper');
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
}

function handleOpponentsFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target.result;
            let opponents = [];

            if (file.name.endsWith('.json')) {
                opponents = JSON.parse(content);
            } else if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
                const lines = content.split('\n').filter(line => line.trim());
                opponents = lines.map((line, index) => {
                    const [number, name] = line.split(',').map(s => s.trim());
                    return {
                        id: Date.now() + index + Math.floor(Math.random() * 100),
                        name: name || `Motstander ${index + 1}`,
                        number: parseInt(number) || index + 1
                    };
                });
            }

            if (opponents.length > 0) {
                // Åpne popup med importerte motstandere
                APP.managingTeam = 'opponents';
                APP.tempPlayersList = opponents;
                APP.editingPlayerId = null;
                updatePlayersManagementModal();
                showModal('playersManagementPopup');
            }
        } catch (error) {
            alert('Feil ved lasting av fil. Sjekk formatet og prøv igjen.\n\nFormat JSON: [{"id":1,"name":"Navn","number":1}]\nFormat CSV/TXT: nummer,navn');
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
}

function finishMatch() {
    // Bekreft at brukeren vil avslutte kampen
    const confirmMessage = APP.events.length === 0
        ? 'Ingen skudd er registrert. Vil du fortsatt avslutte kampen?'
        : 'Er du sikker på at du vil avslutte kampen? Kampen vil bli lagret.';

    if (!confirm(confirmMessage)) {
        return;
    }

    const matchData = {
        id: Date.now(),
        matchDate: APP.matchDate,
        homeTeam: APP.homeTeam,
        awayTeam: APP.awayTeam,
        players: JSON.parse(JSON.stringify(APP.players)),
        opponents: JSON.parse(JSON.stringify(APP.opponents)),
        events: JSON.parse(JSON.stringify(APP.events)),
        completedAt: new Date().toISOString()
    };

    APP.completedMatches.push(matchData);

    // Reset match data
    APP.events = [];
    APP.currentHalf = 1;
    APP.activeKeeper = null;
    APP.tempShot = null;
    APP.selectedResult = null;
    APP.mode = 'attack';

    // Invalider cache
    PERFORMANCE.invalidateStatsCache();

    saveToLocalStorageImmediate();

    alert('Kampen er avsluttet og lagret!');
    APP.page = 'welcome';
    render();
}

function exportData() {
    const data = {
        players: APP.players,
        opponents: APP.opponents,
        events: APP.events,
        homeTeam: APP.homeTeam,
        awayTeam: APP.awayTeam,
        matchDate: APP.matchDate,
        timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `handball-stats-${APP.homeTeam}-${APP.matchDate}.json`;
    a.click();
}

function deleteCompletedMatch(matchId) {
    if (confirm('Er du sikker på at du vil slette denne kampen?')) {
        APP.completedMatches = APP.completedMatches.filter(m => m.id !== matchId);
        saveToLocalStorageImmediate();
        render();
    }
}

function viewCompletedMatch(matchId) {
    const match = APP.completedMatches.find(m => m.id === matchId);
    if (match) {
        APP.viewingMatch = match;
        APP.page = 'viewMatch';
        render();
    }
}

function resetMatch() {
    if (confirm('Er du sikker på at du vil nullstille kampen?')) {
        APP.events = [];
        APP.currentHalf = 1;

        // Invalider cache siden alle events er slettet
        PERFORMANCE.invalidateStatsCache();

        saveToLocalStorageImmediate(); // Bruk umiddelbar lagring for kritiske operasjoner
        render();
    }
}

// ============================================
// RENDER FUNCTIONS
// ============================================
function render() {
    const app = document.getElementById('app');
    if (!app) return;

    if (APP.page === 'login') {
        app.innerHTML = renderLoginPage();
    } else if (APP.page === 'welcome') {
        app.innerHTML = renderWelcomePage();
    } else if (APP.page === 'setup') {
        app.innerHTML = renderSetupPage();
    } else if (APP.page === 'history') {
        app.innerHTML = renderHistoryPage();
    } else if (APP.page === 'viewMatch') {
        app.innerHTML = renderViewMatchPage();
    } else {
        app.innerHTML = renderMatchPage();
    }

    attachEventListeners();
}

function renderLoginPage() {
    return `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem;">
            <div class="card" style="max-width: 28rem; width: 100%;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h1 style="font-size: 3rem; font-weight: 800; color: #312e81; margin-bottom: 0.5rem;">
                        Handball Analytics
                    </h1>
                    <p style="font-size: 1.125rem; color: #4b5563;">
                        Før skuddstatistikk, redninger og tekniske feil på dine spillere
                    </p>
                </div>

                <form id="loginForm" style="space-y: 1rem;">
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #374151;">
                            Brukernavn
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            placeholder="Skriv inn brukernavn"
                            required
                            style="width: 100%; padding: 0.75rem; border: 2px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem;"
                        >
                    </div>

                    <div style="margin-top: 1rem;">
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #374151;">
                            Passord
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Skriv inn passord"
                            required
                            style="width: 100%; padding: 0.75rem; border: 2px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem;"
                        >
                    </div>

                    <button
                        type="submit"
                        class="btn btn-primary"
                        style="width: 100%; margin-top: 1.5rem; padding: 1rem; font-size: 1.125rem; font-weight: 700;">
                        Logg inn
                    </button>
                </form>

                <div style="margin-top: 1.5rem; padding: 1rem; background: #eff6ff; border-radius: 0.5rem; border: 1px solid #bfdbfe;">
                    <p style="font-size: 0.875rem; color: #1e40af; text-align: center;">
                        <strong>Demo:</strong> Bruk "Ola" / "handball"
                    </p>
                </div>
            </div>
        </div>
    `;
}

function renderWelcomePage() {
    const hasCompletedMatches = APP.completedMatches && APP.completedMatches.length > 0;

    return `
        <div class="container" style="max-width: 56rem; margin-top: 2rem;">
            <div class="card">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h1 style="font-size: 2.5rem; font-weight: 800; color: #312e81; margin-bottom: 0.5rem;">
                        Velkommen til Handball Analytics
                    </h1>
                    <p style="font-size: 1.125rem; color: #6b7280;">
                        Profesjonell kampstatistikk for håndball
                    </p>
                </div>

                <div style="margin-bottom: 2rem; padding: 1.5rem; background: #f3f4f6; border-radius: 0.5rem;">
                    <h2 style="font-size: 1.25rem; font-weight: 700; color: #312e81; margin-bottom: 1rem;">
                        Hva kan du gjøre med denne appen?
                    </h2>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        <li style="margin-bottom: 0.75rem; display: flex; align-items: start; gap: 0.5rem;">
                            <span style="color: #059669; font-size: 1.25rem;">⚽</span>
                            <span><strong>Registrer skudd:</strong> Klikk på målet der skuddet gikk, velg om det ble mål eller redning, og velg hvilken spiller som skjøt</span>
                        </li>
                        <li style="margin-bottom: 0.75rem; display: flex; align-items: start; gap: 0.5rem;">
                            <span style="color: #2563eb; font-size: 1.25rem;">🧤</span>
                            <span><strong>Keeperstatistikk:</strong> Registrer motstanderskudd og følg keepernes redningsprosent i sanntid</span>
                        </li>
                        <li style="margin-bottom: 0.75rem; display: flex; align-items: start; gap: 0.5rem;">
                            <span style="color: #dc2626; font-size: 1.25rem;">⚠️</span>
                            <span><strong>Tekniske feil:</strong> Registrer tekniske feil på dine spillere</span>
                        </li>
                        <li style="margin-bottom: 0.75rem; display: flex; align-items: start; gap: 0.5rem;">
                            <span style="color: #7c3aed; font-size: 1.25rem;">📊</span>
                            <span><strong>Detaljert statistikk:</strong> Se uttelling, mål per omgang, skuddkart og fullstendig kampstatistikk</span>
                        </li>
                        <li style="margin-bottom: 0.75rem; display: flex; align-items: start; gap: 0.5rem;">
                            <span style="color: #ea580c; font-size: 1.25rem;">💾</span>
                            <span><strong>Lagre kamper:</strong> Alle kamper lagres automatisk og kan ses på senere</span>
                        </li>
                        <li style="display: flex; align-items: start; gap: 0.5rem;">
                            <span style="color: #0891b2; font-size: 1.25rem;">📁</span>
                            <span><strong>Import/eksport:</strong> Last inn spillere fra fil eller eksporter kampdata til JSON</span>
                        </li>
                    </ul>
                </div>

                <div style="margin-bottom: 2rem; padding: 1.5rem; background: #eff6ff; border-radius: 0.5rem; border: 2px solid #3b82f6;">
                    <h2 style="font-size: 1.25rem; font-weight: 700; color: #1e40af; margin-bottom: 1rem;">
                        Slik kommer du i gang:
                    </h2>
                    <ol style="margin: 0; padding-left: 1.5rem; color: #1e40af;">
                        <li style="margin-bottom: 0.5rem;">Velg om du vil starte en ny kamp eller se tidligere kamper</li>
                        <li style="margin-bottom: 0.5rem;">For ny kamp: Legg inn lagnavn, dato og spillere</li>
                        <li style="margin-bottom: 0.5rem;">Start kampen og registrer skudd ved å klikke på målet</li>
                        <li style="margin-bottom: 0.5rem;">Bytt mellom angrep og forsvar etter behov</li>
                        <li>Avslutt kampen når den er ferdig - all data lagres automatisk</li>
                    </ol>
                </div>

                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    <button class="btn btn-success" data-action="startNewMatch"
                            style="flex: 1; min-width: 250px; padding: 1.5rem; font-size: 1.25rem; font-weight: 700;">
                        ⚽ Start ny kamp
                    </button>
                    ${hasCompletedMatches ? `
                        <button class="btn btn-blue" data-action="viewHistory"
                                style="flex: 1; min-width: 250px; padding: 1.5rem; font-size: 1.25rem; font-weight: 700;">
                            📋 Se tidligere kamper (${APP.completedMatches.length})
                        </button>
                    ` : `
                        <button class="btn btn-secondary" data-action="viewHistory"
                                style="flex: 1; min-width: 250px; padding: 1.5rem; font-size: 1.25rem; font-weight: 700;">
                            📋 Tidligere kamper
                        </button>
                    `}
                </div>

                <div style="margin-top: 2rem; text-align: center;">
                    <button class="btn btn-secondary" data-action="logout">
                        Logg ut
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderPlayersManagementPopup() {
    return `
        <div id="playersManagementPopup" class="modal hidden">
            <div class="modal-content">
                ${renderPlayersManagementPopupContent()}
            </div>
        </div>
    `;
}

function renderSetupPage() {
    return `
        <div class="container">
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
                    <h1 style="font-size: 2.5rem; font-weight: 800; color: #312e81;">
                        Oppsett av kamp
                    </h1>
                    <div style="display: flex; gap: 0.5rem;">
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
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Hjemmelag</label>
                        <input type="text" id="homeTeamInput" value="${APP.homeTeam}"
                               data-field="homeTeam" placeholder="Navn på hjemmelag">
                    </div>
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Bortelag</label>
                        <input type="text" id="awayTeamInput" value="${APP.awayTeam}"
                               data-field="awayTeam" placeholder="Navn på bortelag">
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

function renderMatchPage() {
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

function renderGoalVisualization() {
    const shots = APP.events.filter(e => 
        e.mode === APP.mode && (e.player || e.opponent) && e.zone === 'goal'
    ).map(event => {
        const playerNumber = APP.mode === 'attack' ? event.player?.number : event.opponent?.number;
        const className = event.result === 'mål' ? 'goal' : 'save';
        return `
            <div class="shot-marker ${className}" 
                 style="left: ${event.x}%; top: ${event.y}%;"
                 title="${event.result} - ${event.timestamp}">
                ${playerNumber}
            </div>
        `;
    }).join('');

    const outsideShots = APP.events.filter(e => 
        e.mode === APP.mode && (e.player || e.opponent) && e.zone === 'outside'
    ).map((event, index) => {
        const leftPosition = 10 + (index % 10) * 9;
        return `
            <div class="shot-marker outside" 
                 style="left: ${leftPosition}%; top: 12px; position: absolute;"
                 title="${event.result} utenfor - ${event.timestamp}">
                ⚽
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
             style="left: 50%; top: 12px; margin-left: -16px; position: absolute;">
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

function renderStatistics() {
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


function renderTechnicalPopup() {
    return `
        <div id="technicalPopup" class="modal hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81;">
                        Velg spiller som begikk teknisk feil
                    </h2>
                    <button class="btn btn-secondary" data-action="closeTechnicalPopup">
                        Lukk
                    </button>
                </div>
                <div class="player-grid">
                    ${APP.players.map(player => `
                        <button class="player-button" data-action="registerTechnical" data-player-id="${player.id}">
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
    return `
        <div id="shotPopup" class="modal hidden">
            <div class="modal-content">
                ${renderShotPopupContent()}
            </div>
        </div>
    `;
}

function renderShotDetailsPopup() {
    return `
        <div id="shotDetailsPopup" class="modal hidden">
            <div class="modal-content" style="max-height: 90vh; overflow-y: auto;">
                ${renderShotDetailsPopupContent()}
            </div>
        </div>
    `;
}

function renderHistoryPage() {
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
                                    <th>Hjemmelag</th>
                                    <th>Bortelag</th>
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

function renderViewMatchPage() {
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
    `;
}


// ============================================
// EVENT LISTENERS - THE CRITICAL PART!
// ============================================

// Lightweight function for modal buttons only - prevents re-attaching all listeners
function attachModalEventListeners() {
    // This is called after updating modal content
    // Event delegation handles the rest, so this is just a placeholder
    // The main event delegation in setupGlobalEventListeners() will catch modal clicks
}

// Setup global event listeners - ONLY CALLED ONCE on page load
function setupGlobalEventListeners() {
    // Button actions using event delegation
    // This is attached to document ONCE and never removed
    document.addEventListener('click', (e) => {
        const button = e.target.closest('[data-action]');
        if (!button) return;

        const action = button.dataset.action;

        switch(action) {
            case 'logout':
                handleLogout();
                break;
            case 'startNewMatch':
                startNewMatch();
                break;
            case 'managePlayers':
                openPlayersManagement();
                break;
            case 'manageOpponents':
                openOpponentsManagement();
                break;
            case 'addPlayerToList':
                addPlayerToTempList();
                break;
            case 'editPlayerInList':
                editPlayerInTempList(parseInt(button.dataset.playerId));
                break;
            case 'removePlayerFromList':
                removePlayerFromTempList(parseInt(button.dataset.playerId));
                break;
            case 'savePlayers':
                savePlayersList();
                break;
            case 'cancelPlayers':
                cancelPlayersManagement();
                break;
            case 'startMatch':
                APP.page = 'match';
                saveToLocalStorage();
                render();
                break;
            case 'backToSetup':
                APP.page = 'setup';
                saveToLocalStorage();
                render();
                break;
            case 'setHalf':
                APP.currentHalf = parseInt(button.dataset.half);
                saveToLocalStorage();
                render();
                break;
            case 'setMode':
                APP.mode = button.dataset.mode;
                saveToLocalStorage();
                render();
                break;
            case 'showTechnicalPopup':
                showModal('technicalPopup');
                break;
            case 'closeTechnicalPopup':
                closeModal('technicalPopup');
                break;
            case 'registerTechnical':
                registerTechnicalError(parseInt(button.dataset.playerId));
                break;
            case 'selectResult':
                selectShotResult(button.dataset.result);
                break;
            case 'registerShot':
                registerShot(parseInt(button.dataset.playerId));
                break;
            case 'closeShotPopup':
                closeModal('shotPopup');
                APP.tempShot = null;
                APP.selectedResult = null;
                // Optimalisert: Oppdater kun målvisualisering for å fjerne temp marker
                updateGoalVisualization();
                break;
            case 'showPlayerDetails':
                showPlayerShotDetails(parseInt(button.dataset.playerId), false);
                break;
            case 'showOpponentDetails':
                showPlayerShotDetails(parseInt(button.dataset.opponentId), true);
                break;
            case 'showKeeperDetails':
                showKeeperShotDetails(parseInt(button.dataset.keeperId));
                break;
            case 'closeShotDetails':
                closeModal('shotDetailsPopup');
                APP.shotDetailsData = null;
                // Optimalisert: Ikke re-render hele siden ved lukking av modal
                break;
            case 'resetMatch':
                resetMatch();
                break;
            case 'exportData':
                exportData();
                break;
            case 'loadPlayersFile':
                loadPlayersFromFile();
                break;
            case 'loadOpponentsFile':
                loadOpponentsFromFile();
                break;
            case 'finishMatch':
                finishMatch();
                break;
            case 'viewHistory':
                APP.page = 'history';
                render();
                break;
            case 'viewMatch':
                viewCompletedMatch(parseInt(button.dataset.matchId));
                break;
            case 'deleteMatch':
                deleteCompletedMatch(parseInt(button.dataset.matchId));
                break;
            case 'setViewMode':
                APP.mode = button.dataset.mode;
                render();
                break;
        }
    });
}

// Attach listeners to specific elements after each render
function attachEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Team name inputs
    const homeTeamInput = document.getElementById('homeTeamInput');
    if (homeTeamInput) {
        homeTeamInput.addEventListener('change', (e) => {
            APP.homeTeam = e.target.value;
            saveToLocalStorage();
        });
    }
    
    const awayTeamInput = document.getElementById('awayTeamInput');
    if (awayTeamInput) {
        awayTeamInput.addEventListener('change', (e) => {
            APP.awayTeam = e.target.value;
            saveToLocalStorage();
        });
    }

    // Match date input
    const matchDateInput = document.getElementById('matchDateInput');
    if (matchDateInput) {
        matchDateInput.addEventListener('change', (e) => {
            APP.matchDate = e.target.value;
            saveToLocalStorage();
        });
    }

    // File upload inputs
    const playersFileInput = document.getElementById('playersFileInput');
    if (playersFileInput) {
        playersFileInput.addEventListener('change', handlePlayersFileUpload);
    }

    const opponentsFileInput = document.getElementById('opponentsFileInput');
    if (opponentsFileInput) {
        opponentsFileInput.addEventListener('change', handleOpponentsFileUpload);
    }

    // Keeper select
    const keeperSelect = document.getElementById('keeperSelect');
    if (keeperSelect) {
        keeperSelect.addEventListener('change', (e) => {
            const keeperId = parseInt(e.target.value);
            APP.activeKeeper = APP.players.find(p => p.id === keeperId) || null;
            saveToLocalStorage();
        });
    }
    
    // Player/Opponent field updates
    document.querySelectorAll('[data-player-id]').forEach(input => {
        const playerId = parseInt(input.dataset.playerId);
        const field = input.dataset.field;
        
        if (field === 'number') {
            input.addEventListener('change', (e) => {
                const player = APP.players.find(p => p.id === playerId);
                if (player) {
                    player.number = parseInt(e.target.value) || 0;
                    saveToLocalStorage();
                }
            });
        } else if (field === 'name') {
            input.addEventListener('change', (e) => {
                const player = APP.players.find(p => p.id === playerId);
                if (player) {
                    player.name = e.target.value;
                    saveToLocalStorage();
                }
            });
        } else if (field === 'keeper') {
            input.addEventListener('change', (e) => {
                const player = APP.players.find(p => p.id === playerId);
                if (player) {
                    player.isKeeper = e.target.checked;
                    saveToLocalStorage();
                    render();
                }
            });
        }
    });
    
    document.querySelectorAll('[data-opponent-id]').forEach(input => {
        const opponentId = parseInt(input.dataset.opponentId);
        const field = input.dataset.field;
        
        if (field === 'number') {
            input.addEventListener('change', (e) => {
                const opponent = APP.opponents.find(o => o.id === opponentId);
                if (opponent) {
                    opponent.number = parseInt(e.target.value) || 0;
                    saveToLocalStorage();
                }
            });
        } else if (field === 'name') {
            input.addEventListener('change', (e) => {
                const opponent = APP.opponents.find(o => o.id === opponentId);
                if (opponent) {
                    opponent.name = e.target.value;
                    saveToLocalStorage();
                }
            });
        }
    });
    
    // Goal area click - THE MOST IMPORTANT!
    const goalContainer = document.getElementById('goalContainer');
    if (goalContainer) {
        goalContainer.addEventListener('click', handleGoalClick);
    }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    setupGlobalEventListeners(); // Setup global event delegation ONCE
    render();
});

