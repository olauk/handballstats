// ============================================
// TEAM ROSTER MANAGEMENT
// ============================================
import { APP, generateUniqueId } from './state.js';
import { saveToLocalStorage, saveToLocalStorageImmediate } from './storage.js';

/**
 * Create a new team roster
 */
export function createNewTeamRoster(updateModal, showModal) {
    APP.editingTeamId = null;
    APP.tempPlayersList = [];
    APP.editingPlayerId = null;
    updateModal();
    showModal('teamRosterEditModal');
}

/**
 * Edit an existing team roster
 */
export function editTeamRoster(teamId, updateModal, showModal) {
    const team = APP.savedTeams.find(t => t.id === teamId);
    if (!team) return;

    APP.editingTeamId = teamId;
    APP.tempPlayersList = JSON.parse(JSON.stringify(team.players));
    APP.editingPlayerId = null;
    updateModal();
    showModal('teamRosterEditModal');
}

/**
 * Delete a team roster
 */
export function deleteTeamRoster(teamId) {
    const team = APP.savedTeams.find(t => t.id === teamId);
    if (!team) return false;

    if (confirm(`Er du sikker på at du vil slette laget "${team.name}"?\n\nDette vil fjerne laget og alle spillere permanent.`)) {
        APP.savedTeams = APP.savedTeams.filter(t => t.id !== teamId);
        saveToLocalStorageImmediate();
        return true;
    }
    return false;
}

/**
 * Save team roster (new or edit)
 */
export function saveTeamRoster(closeModal) {
    const nameInput = document.getElementById('teamRosterNameInput');
    if (!nameInput) return false;

    const teamName = nameInput.value.trim();
    if (!teamName) {
        alert('Du må angi et lagnavn');
        return false;
    }

    if (APP.editingTeamId) {
        // Update existing team
        const team = APP.savedTeams.find(t => t.id === APP.editingTeamId);
        if (team) {
            team.name = teamName;
            team.players = JSON.parse(JSON.stringify(APP.tempPlayersList));
        }
    } else {
        // Create new team
        const newTeam = {
            id: generateUniqueId(),
            name: teamName,
            players: JSON.parse(JSON.stringify(APP.tempPlayersList))
        };
        APP.savedTeams.push(newTeam);
    }

    // Reset state
    APP.editingTeamId = null;
    APP.tempPlayersList = [];
    APP.editingPlayerId = null;

    saveToLocalStorageImmediate();
    closeModal('teamRosterEditModal');
    return true;
}

/**
 * Close team roster edit modal
 */
export function closeTeamRosterEdit(closeModal) {
    APP.editingTeamId = null;
    APP.tempPlayersList = [];
    APP.editingPlayerId = null;
    closeModal('teamRosterEditModal');
}

/**
 * Add player to roster (show input form)
 */
export function addPlayerToRoster(updateModal) {
    APP.editingPlayerId = -1; // Use -1 to indicate "new player"
    updateModal();
}

/**
 * Edit player in roster
 */
export function editPlayerInRoster(playerId, updateModal) {
    const player = APP.tempPlayersList.find(p => p.id === playerId);
    if (!player) return;

    APP.editingPlayerId = playerId;
    updateModal();

    // Pre-fill form
    setTimeout(() => {
        const numberInput = document.getElementById('rosterPlayerNumberInput');
        const nameInput = document.getElementById('rosterPlayerNameInput');
        const isKeeperInput = document.getElementById('rosterPlayerIsKeeperInput');

        if (numberInput) numberInput.value = player.number;
        if (nameInput) nameInput.value = player.name;
        if (isKeeperInput) isKeeperInput.checked = player.isKeeper || false;
    }, 0);
}

/**
 * Save player in roster
 */
export function saveRosterPlayer(updateModal) {
    const numberInput = document.getElementById('rosterPlayerNumberInput');
    const nameInput = document.getElementById('rosterPlayerNameInput');
    const isKeeperInput = document.getElementById('rosterPlayerIsKeeperInput');

    if (!numberInput || !nameInput || !isKeeperInput) return false;

    const number = parseInt(numberInput.value);
    const name = nameInput.value.trim();
    const isKeeper = isKeeperInput.checked;

    if (!name || isNaN(number)) {
        alert('Du må fylle ut både nummer og navn');
        return false;
    }

    if (APP.editingPlayerId === -1) {
        // Add new player
        const newPlayer = {
            id: generateUniqueId(),
            number: number,
            name: name,
            isKeeper: isKeeper
        };
        APP.tempPlayersList.push(newPlayer);
    } else {
        // Update existing player
        const player = APP.tempPlayersList.find(p => p.id === APP.editingPlayerId);
        if (player) {
            player.number = number;
            player.name = name;
            player.isKeeper = isKeeper;
        }
    }

    APP.editingPlayerId = null;
    updateModal();
    return true;
}

/**
 * Remove player from roster
 */
export function removePlayerFromRoster(playerId, updateModal) {
    APP.tempPlayersList = APP.tempPlayersList.filter(p => p.id !== playerId);
    updateModal();
}

/**
 * Cancel player edit
 */
export function cancelRosterPlayerEdit(updateModal) {
    APP.editingPlayerId = null;
    updateModal();
}

/**
 * Import team roster to setup (players or opponents)
 */
export function importTeamRosterToSetup(teamId, target, mergeMode) {
    const team = APP.savedTeams.find(t => t.id === teamId);
    if (!team) return false;

    // Clone players to avoid reference issues
    const clonedPlayers = JSON.parse(JSON.stringify(team.players)).map(p => ({
        ...p,
        id: generateUniqueId() // Generate new IDs to avoid conflicts
    }));

    if (target === 'players') {
        if (mergeMode === 'replace') {
            APP.players = clonedPlayers;
        } else {
            // Merge - add to existing
            APP.players = [...APP.players, ...clonedPlayers];
        }
        // Copy team name to homeTeam
        APP.homeTeam = team.name;
    } else if (target === 'opponents') {
        if (mergeMode === 'replace') {
            APP.opponents = clonedPlayers;
        } else {
            APP.opponents = [...APP.opponents, ...clonedPlayers];
        }
        APP.awayTeam = team.name;
    }

    saveToLocalStorage();
    return true;
}
