// ============================================
// EVENT LISTENERS
// ============================================
import { APP } from './state.js';
import { saveToLocalStorage } from './storage.js';
import { handleLogin, handleLogout, handleRegister, handlePasswordReset, startNewMatch, continueMatchSetup } from './auth.js';
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
    selectShooter,
    selectAttackType,
    selectShotPosition,
    selectAssist,
    skipAssist,
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
    updateTeamRosterEditModal,
    updateStatisticsOnly,
    attachModalEventListeners as modalListeners
} from './ui/modals.js';
import {
    loadPlayersFromFile,
    loadOpponentsFromFile,
    handlePlayersFileUpload,
    handleOpponentsFileUpload,
    resetMatch,
    resetSetup,
    exportData,
    finishMatch,
    deleteCompletedMatch,
    viewCompletedMatch
} from './utils.js';
import {
    createNewTeamRoster,
    editTeamRoster,
    deleteTeamRoster,
    saveTeamRoster,
    closeTeamRosterEdit,
    addPlayerToRoster,
    editPlayerInRoster,
    saveRosterPlayer,
    removePlayerFromRoster,
    cancelRosterPlayerEdit,
    importTeamRosterToSetup,
    loadRosterPlayersFile
    // handleRosterPlayersFileUpload is now imported and used in modals.js
} from './team-roster.js';
import { renderStatistics } from './ui/match.js';
import { exportDebugLogs } from './debug-logger.js';
import { startTimer, pauseTimer, resetTimer } from './timer.js';

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
            case 'continueMatchSetup':
                continueMatchSetup();
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
            case 'backToHome':
                APP.page = 'home';
                saveToLocalStorage();
                render();
                break;
            case 'setHalf':
                const newHalf = parseInt(button.dataset.half);

                // Hvis vi bytter til 2. omgang i avansert modus
                if (APP.matchMode === 'advanced' && newHalf === 2 && APP.currentHalf === 1) {
                    const halfLengthSeconds = APP.timerConfig.halfLength * 60;
                    const currentTime = APP.timerState.currentTime;

                    // Sjekk om timer har nådd valgt lengde
                    if (currentTime < halfLengthSeconds) {
                        const minutesRemaining = Math.floor((halfLengthSeconds - currentTime) / 60);
                        const secondsRemaining = (halfLengthSeconds - currentTime) % 60;
                        const timeRemaining = `${minutesRemaining}:${String(secondsRemaining).padStart(2, '0')}`;

                        const confirmSwitch = confirm(
                            `⚠️ Omgangen er ikke ferdig!\n\n` +
                            `Det er ${timeRemaining} igjen av omgangen.\n\n` +
                            `Er du sikker på at du vil gå til 2. omgang?`
                        );

                        if (!confirmSwitch) {
                            break; // Avbryt bytte av omgang
                        }
                    }

                    // Nullstill timer ved bytte til 2. omgang
                    if (APP.timerState.intervalId) {
                        clearInterval(APP.timerState.intervalId);
                        APP.timerState.intervalId = null;
                    }
                    APP.timerState.isRunning = false;
                    APP.timerState.currentTime = 0;
                }

                APP.currentHalf = newHalf;
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
            case 'selectShooter':
                selectShooter(parseInt(button.dataset.playerId), attachModalEventListeners);
                break;
            case 'selectAttackType':
                selectAttackType(button.dataset.type, attachModalEventListeners);
                break;
            case 'selectShotPosition':
                selectShotPosition(button.dataset.position, closeModal,
                    updateGoalVisualization, () => updateStatisticsOnly(renderStatistics, () => {}), attachModalEventListeners);
                break;
            case 'selectAssist':
                selectAssist(parseInt(button.dataset.playerId), closeModal,
                    updateGoalVisualization, () => updateStatisticsOnly(renderStatistics, () => {}));
                break;
            case 'skipAssist':
                skipAssist(closeModal,
                    updateGoalVisualization, () => updateStatisticsOnly(renderStatistics, () => {}));
                break;
            case 'registerShot':
                registerShot(parseInt(button.dataset.playerId), closeModal,
                    updateGoalVisualization, () => updateStatisticsOnly(renderStatistics, () => {}));
                break;
            case 'closeShotPopup':
                closeModal('shotPopup');
                APP.tempShot = null;
                APP.selectedResult = null;
                APP.selectedShooter = null;
                APP.selectedAttackType = null;
                APP.selectedShotPosition = null;
                APP.selectedAssist = null;
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
            case 'resetSetup':
                if (resetSetup()) render();
                break;
            case 'exportData':
                exportData();
                break;
            case 'exportDebugLogs':
                exportDebugLogs();
                break;
            case 'loadPlayersFile':
                loadPlayersFromFile();
                break;
            case 'loadOpponentsFile':
                loadOpponentsFromFile();
                break;
            case 'finishMatch':
                finishMatch().then(success => {
                    if (success) render();
                });
                break;
            case 'viewHistory':
                APP.page = 'history';
                render();
                break;
            case 'viewHelp':
                APP.page = 'help';
                render();
                break;
            case 'viewMatch':
                if (viewCompletedMatch(parseInt(button.dataset.matchId))) render();
                break;
            case 'deleteMatch':
                deleteCompletedMatch(parseInt(button.dataset.matchId)).then(success => {
                    if (success) render();
                });
                break;
            case 'setViewMode':
                APP.mode = button.dataset.mode;
                render();
                break;
            case 'showRegister':
                console.log('🔵 Button clicked: showRegister'); // DEBUG
                APP.page = 'register';
                console.log('→ Set APP.page to:', APP.page); // DEBUG
                render();
                break;
            case 'showLogin':
                console.log('🔵 Button clicked: showLogin'); // DEBUG
                APP.page = 'login';
                render();
                break;
            case 'showPasswordReset':
                console.log('🔵 Button clicked: showPasswordReset'); // DEBUG
                APP.page = 'reset-password';
                render();
                break;
            case 'selectMode':
                APP.matchMode = button.dataset.mode;
                saveToLocalStorage();
                render();
                break;
            case 'startWithMode':
                APP.page = 'setup';
                saveToLocalStorage();
                render();
                break;
            case 'setHalfLength':
                APP.timerConfig.halfLength = parseInt(button.dataset.length);
                saveToLocalStorage();
                render();
                break;
            case 'setShotRegistrationMode':
                APP.shotRegistrationMode = button.dataset.mode;
                saveToLocalStorage();
                render();
                break;
            case 'startTimer':
                startTimer();
                render();
                break;
            case 'pauseTimer':
                pauseTimer();
                render();
                break;
            case 'resetTimer':
                resetTimer();
                render();
                break;
            case 'nextHalf':
                // Only works in advanced mode when currentHalf === 1
                if (APP.matchMode === 'advanced' && APP.currentHalf === 1) {
                    const halfLengthSeconds = APP.timerConfig.halfLength * 60;
                    const currentTime = APP.timerState.currentTime;

                    // Sjekk om timer har nådd valgt lengde
                    if (currentTime < halfLengthSeconds) {
                        const minutesRemaining = Math.floor((halfLengthSeconds - currentTime) / 60);
                        const secondsRemaining = (halfLengthSeconds - currentTime) % 60;
                        const timeRemaining = `${minutesRemaining}:${String(secondsRemaining).padStart(2, '0')}`;

                        const confirmSwitch = confirm(
                            `⚠️ Omgangen er ikke ferdig!\n\n` +
                            `Det er ${timeRemaining} igjen av omgangen.\n\n` +
                            `Er du sikker på at du vil gå til 2. omgang?`
                        );

                        if (!confirmSwitch) {
                            break; // Avbryt bytte av omgang
                        }
                    }

                    // Nullstill timer ved bytte til 2. omgang
                    if (APP.timerState.intervalId) {
                        clearInterval(APP.timerState.intervalId);
                        APP.timerState.intervalId = null;
                    }
                    APP.timerState.isRunning = false;
                    APP.timerState.currentTime = 0;

                    // Gå til 2. omgang
                    APP.currentHalf = 2;
                    saveToLocalStorage();
                    render();
                }
                break;
            case 'manageTeamRosters':
                APP.page = 'teamRoster';
                saveToLocalStorage();
                render();
                break;
            case 'createNewTeamRoster':
                createNewTeamRoster(updateTeamRosterEditModal, showModal);
                break;
            case 'editTeamRoster':
                editTeamRoster(parseInt(button.dataset.teamId), updateTeamRosterEditModal, showModal);
                break;
            case 'deleteTeamRoster':
                if (deleteTeamRoster(parseInt(button.dataset.teamId))) render();
                break;
            case 'saveTeamRoster':
                if (saveTeamRoster(closeModal)) render();
                break;
            case 'closeTeamRosterEdit':
                closeTeamRosterEdit(closeModal);
                break;
            case 'addPlayerToRoster':
                addPlayerToRoster(updateTeamRosterEditModal);
                break;
            case 'editPlayerInRoster':
                editPlayerInRoster(parseInt(button.dataset.playerId), updateTeamRosterEditModal);
                break;
            case 'saveRosterPlayer':
                saveRosterPlayer(updateTeamRosterEditModal);
                break;
            case 'removePlayerFromRoster':
                removePlayerFromRoster(parseInt(button.dataset.playerId), updateTeamRosterEditModal);
                break;
            case 'cancelRosterPlayerEdit':
                cancelRosterPlayerEdit(updateTeamRosterEditModal);
                break;
            case 'loadRosterPlayersFile':
                loadRosterPlayersFile();
                break;
            case 'toggleImportMenu':
                showModal('importTeamMenu');
                break;
            case 'closeImportMenu':
                closeModal('importTeamMenu');
                break;
            case 'selectTeamForImport':
                APP.importingTeamId = parseInt(button.dataset.teamId);
                closeModal('importTeamMenu');
                showModal('importModeDialog');
                break;
            case 'closeImportModeDialog':
                APP.importingTeamId = null;
                closeModal('importModeDialog');
                break;
            case 'confirmImport':
                if (APP.importingTeamId) {
                    const mode = button.dataset.mode; // 'replace' or 'merge'
                    if (importTeamRosterToSetup(APP.importingTeamId, 'players', mode)) {
                        APP.importingTeamId = null;
                        closeModal('importModeDialog');
                        render();
                    }
                }
                break;
        }
    });
}

// Attach listeners to specific elements after each render
export function attachEventListeners(render) {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            if (await handleLogin(e)) {
                render();
            }
        });
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            if (await handleRegister(e)) {
                render();
            }
        });
    }

    // Password reset form
    const passwordResetForm = document.getElementById('passwordResetForm');
    if (passwordResetForm) {
        passwordResetForm.addEventListener('submit', async (e) => {
            if (await handlePasswordReset(e)) {
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

    // Note: rosterPlayersFileInput event listener is attached in updateTeamRosterEditModal()
    // because the file input is inside a modal and doesn't exist in DOM at app startup

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
            if (handleGoalClick(e)) {
                // First render to ensure modal exists in DOM
                render();

                // Then update modal content and show it
                const shotPopup = document.getElementById('shotPopup');
                if (shotPopup) {
                    const modalContent = shotPopup.querySelector('.modal-content');
                    if (modalContent) {
                        modalContent.innerHTML = renderShotPopupContent();
                    }
                }
                showModal('shotPopup');
            }
        });
    }
}
