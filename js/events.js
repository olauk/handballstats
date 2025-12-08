// ============================================
// EVENT LISTENERS
// ============================================
import { APP } from './state.js';
import { saveToLocalStorage } from './storage.js';
import { handleLogin, handleLogout, startNewMatch } from './auth.js';
import {
    openPlayersManagement,
    openOpponentsManagement,
    addPlayerToTempList,
    editPlayerInTempList,
    removePlayerFromTempList,
    savePlayersList,
    cancelPlayersManagement
} from './players.js';
import {
    handleGoalClick,
    selectShotResult,
    registerShot,
    registerTechnicalError,
    updateGoalVisualization,
    renderTechnicalPopupContent,
    renderShotPopupContent
} from './shots.js';
import {
    showModal,
    closeModal,
    showPlayerShotDetails,
    showKeeperShotDetails,
    updatePlayersManagementModal,
    updateStatisticsOnly,
    attachModalEventListeners as modalListeners
} from './ui/modals.js';
import {
    loadPlayersFromFile,
    loadOpponentsFromFile,
    handlePlayersFileUpload,
    handleOpponentsFileUpload,
    resetMatch,
    exportData,
    finishMatch,
    deleteCompletedMatch,
    viewCompletedMatch
} from './utils.js';
import { renderStatistics } from './ui/match.js';

// Lightweight function for modal buttons only - prevents re-attaching all listeners
export function attachModalEventListeners() {
    modalListeners();
}

// Setup global event listeners - ONLY CALLED ONCE on page load
export function setupGlobalEventListeners(render) {
    // Button actions using event delegation
    // This is attached to document ONCE and never removed
    document.addEventListener('click', (e) => {
        const button = e.target.closest('[data-action]');
        if (!button) return;

        const action = button.dataset.action;

        switch(action) {
            case 'logout':
                if (handleLogout()) render();
                break;
            case 'startNewMatch':
                startNewMatch();
                render();
                break;
            case 'managePlayers':
                openPlayersManagement(updatePlayersManagementModal, showModal);
                break;
            case 'manageOpponents':
                openOpponentsManagement(updatePlayersManagementModal, showModal);
                break;
            case 'addPlayerToList':
                addPlayerToTempList(updatePlayersManagementModal);
                break;
            case 'editPlayerInList':
                editPlayerInTempList(parseInt(button.dataset.playerId));
                break;
            case 'removePlayerFromList':
                removePlayerFromTempList(parseInt(button.dataset.playerId), updatePlayersManagementModal);
                break;
            case 'savePlayers':
                if (savePlayersList(closeModal)) render();
                break;
            case 'cancelPlayers':
                cancelPlayersManagement(closeModal);
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
                const technicalModal = document.getElementById('technicalPopup');
                if (technicalModal) {
                    const modalContent = technicalModal.querySelector('.modal-content');
                    if (modalContent) {
                        modalContent.innerHTML = renderTechnicalPopupContent();
                    }
                }
                showModal('technicalPopup');
                break;
            case 'closeTechnicalPopup':
                closeModal('technicalPopup');
                break;
            case 'registerTechnical':
                registerTechnicalError(parseInt(button.dataset.playerId), closeModal,
                    () => updateStatisticsOnly(renderStatistics, () => {}));
                break;
            case 'selectResult':
                selectShotResult(button.dataset.result, attachModalEventListeners);
                break;
            case 'registerShot':
                registerShot(parseInt(button.dataset.playerId), closeModal,
                    updateGoalVisualization, () => updateStatisticsOnly(renderStatistics, () => {}));
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
                if (resetMatch()) render();
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
                if (finishMatch()) render();
                break;
            case 'viewHistory':
                APP.page = 'history';
                render();
                break;
            case 'viewMatch':
                if (viewCompletedMatch(parseInt(button.dataset.matchId))) render();
                break;
            case 'deleteMatch':
                if (deleteCompletedMatch(parseInt(button.dataset.matchId))) render();
                break;
            case 'setViewMode':
                APP.mode = button.dataset.mode;
                render();
                break;
        }
    });
}

// Attach listeners to specific elements after each render
export function attachEventListeners(render) {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            if (handleLogin(e)) {
                render();
            }
        });
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
        playersFileInput.addEventListener('change', (e) =>
            handlePlayersFileUpload(e, updatePlayersManagementModal, showModal));
    }

    const opponentsFileInput = document.getElementById('opponentsFileInput');
    if (opponentsFileInput) {
        opponentsFileInput.addEventListener('change', (e) =>
            handleOpponentsFileUpload(e, updatePlayersManagementModal, showModal));
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
        goalContainer.addEventListener('click', (e) => {
            if (handleGoalClick(e, showModal)) {
                // Update shot popup content
                const shotPopup = document.getElementById('shotPopup');
                if (shotPopup) {
                    const modalContent = shotPopup.querySelector('.modal-content');
                    if (modalContent) {
                        modalContent.innerHTML = renderShotPopupContent();
                    }
                }
                render();
            }
        });
    }
}
