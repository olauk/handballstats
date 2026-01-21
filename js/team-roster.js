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
  const team = APP.savedTeams.find((t) => t.id === teamId);
  if (!team) {
    return;
  }

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
  const team = APP.savedTeams.find((t) => t.id === teamId);
  if (!team) {
    return false;
  }

  if (
    confirm(
      `Er du sikker på at du vil slette laget "${team.name}"?\n\nDette vil fjerne laget og alle spillere permanent.`
    )
  ) {
    APP.savedTeams = APP.savedTeams.filter((t) => t.id !== teamId);
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
  if (!nameInput) {
    return false;
  }

  const teamName = nameInput.value.trim();
  if (!teamName) {
    alert('Du må angi et lagnavn');
    return false;
  }

  if (APP.editingTeamId) {
    // Update existing team
    const team = APP.savedTeams.find((t) => t.id === APP.editingTeamId);
    if (team) {
      team.name = teamName;
      team.players = JSON.parse(JSON.stringify(APP.tempPlayersList));
    }
  } else {
    // Create new team
    const newTeam = {
      id: generateUniqueId(),
      name: teamName,
      players: JSON.parse(JSON.stringify(APP.tempPlayersList)),
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
  const player = APP.tempPlayersList.find((p) => p.id === playerId);
  if (!player) {
    return;
  }

  APP.editingPlayerId = playerId;
  updateModal();

  // Pre-fill form
  setTimeout(() => {
    const numberInput = document.getElementById('rosterPlayerNumberInput');
    const nameInput = document.getElementById('rosterPlayerNameInput');
    const isKeeperInput = document.getElementById('rosterPlayerIsKeeperInput');

    if (numberInput) {
      numberInput.value = player.number;
    }
    if (nameInput) {
      nameInput.value = player.name;
    }
    if (isKeeperInput) {
      isKeeperInput.checked = player.isKeeper || false;
    }
  }, 0);
}

/**
 * Save player in roster
 */
export function saveRosterPlayer(updateModal) {
  const numberInput = document.getElementById('rosterPlayerNumberInput');
  const nameInput = document.getElementById('rosterPlayerNameInput');
  const isKeeperInput = document.getElementById('rosterPlayerIsKeeperInput');

  if (!numberInput || !nameInput || !isKeeperInput) {
    return false;
  }

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
      isKeeper: isKeeper,
    };
    APP.tempPlayersList.push(newPlayer);
  } else {
    // Update existing player
    const player = APP.tempPlayersList.find((p) => p.id === APP.editingPlayerId);
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
  APP.tempPlayersList = APP.tempPlayersList.filter((p) => p.id !== playerId);
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
 * Trigger file input for roster players
 */
export function loadRosterPlayersFile() {
  const fileInput = document.getElementById('rosterPlayersFileInput');
  if (fileInput) {
    fileInput.click();
  }
}

/**
 * Handle roster players file upload
 */
export function handleRosterPlayersFileUpload(event, updateModal) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  // Race Condition Fix: Block parallel file imports
  if (APP.isImportingFile) {
    alert('Vennligst vent til forrige filimport er fullført.');
    event.target.value = ''; // Reset input
    return;
  }

  APP.isImportingFile = true;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target.result;
      let players = [];

      if (file.name.endsWith('.json')) {
        // JSON format: [{id, name, number, isKeeper}, ...]
        const rawPlayers = JSON.parse(content);
        // Ensure all players have unique IDs
        players = rawPlayers.map((p) => ({
          id: generateUniqueId(), // Always generate new unique ID
          name: p.name || 'Ukjent spiller',
          number: p.number || 0,
          isKeeper: p.isKeeper || false,
        }));
      } else if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        // CSV/TXT format: number,name,isKeeper (one per line)
        const lines = content.split('\n').filter((line) => line.trim());
        players = lines.map((line, index) => {
          const [number, name, isKeeper] = line.split(',').map((s) => s.trim());
          return {
            id: generateUniqueId(),
            name: name || `Spiller ${index + 1}`,
            number: parseInt(number) || index + 1,
            isKeeper: isKeeper === 'true' || isKeeper === '1',
          };
        });
      }

      if (players.length > 0) {
        // Ask user if they want to replace or merge
        const hasExistingPlayers = APP.tempPlayersList.length > 0;
        let shouldReplace = true;

        if (hasExistingPlayers) {
          shouldReplace = confirm(
            `Du har allerede ${APP.tempPlayersList.length} spiller(e) i listen.\n\n` +
              `Trykk OK for å ERSTATTE alle spillere med ${players.length} spillere fra filen.\n` +
              `Trykk Avbryt for å LEGGE TIL de ${players.length} spillerne fra filen.`
          );
        }

        if (shouldReplace) {
          APP.tempPlayersList = players;
        } else {
          APP.tempPlayersList = [...APP.tempPlayersList, ...players];
        }

        APP.editingPlayerId = null;
        updateModal();

        const totalPlayers = APP.tempPlayersList.length;
        alert(
          `✓ Lastet inn ${players.length} spiller(e) fra filen.\n\nTotalt ${totalPlayers} spiller(e) i listen.`
        );
      } else {
        alert('Filen inneholder ingen gyldige spillere.');
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert(
        'Feil ved lasting av fil. Sjekk formatet og prøv igjen.\n\n' +
          'Format JSON: [{"name":"Navn","number":1,"isKeeper":false}]\n' +
          'Format CSV/TXT: nummer,navn,isKeeper\n\n' +
          'Eksempel CSV:\n' +
          '1,Ola Nordmann,false\n' +
          '12,Keeper Hansen,true'
      );
    } finally {
      // Always release lock, even on error
      APP.isImportingFile = false;
    }
  };

  reader.onerror = () => {
    alert('Feil ved lesing av fil. Vennligst prøv igjen.');
    APP.isImportingFile = false;
  };

  reader.readAsText(file);
  event.target.value = ''; // Reset input
}

/**
 * Import team roster to setup (players or opponents)
 */
export function importTeamRosterToSetup(teamId, target, mergeMode) {
  const team = APP.savedTeams.find((t) => t.id === teamId);
  if (!team) {
    return false;
  }

  // Clone players to avoid reference issues
  const clonedPlayers = JSON.parse(JSON.stringify(team.players)).map((p) => ({
    ...p,
    id: generateUniqueId(), // Generate new IDs to avoid conflicts
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
