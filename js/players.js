// ============================================
// PLAYER MANAGEMENT
// ============================================
import { APP, generateUniqueId } from './state.js';
import { saveToLocalStorage } from './storage.js';

export function openPlayersManagement(updatePlayersManagementModal, showModal) {
  APP.managingTeam = 'players';
  APP.tempPlayersList = JSON.parse(JSON.stringify(APP.players));
  APP.editingPlayerId = null;
  updatePlayersManagementModal();
  showModal('playersManagementPopup');
}

export function openOpponentsManagement(updatePlayersManagementModal, showModal) {
  APP.managingTeam = 'opponents';
  APP.tempPlayersList = JSON.parse(JSON.stringify(APP.opponents));
  APP.editingPlayerId = null;
  updatePlayersManagementModal();
  showModal('playersManagementPopup');
}

export function addPlayerToTempList(updatePlayersManagementModal) {
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
    const player = APP.tempPlayersList.find((p) => p.id === APP.editingPlayerId);
    if (player) {
      player.number = number;
      player.name = name;
      if (APP.managingTeam === 'players') {
        player.isKeeper = isKeeper;
      }
    }
    APP.editingPlayerId = null;
  } else {
    // Legg til ny spiller med garantert unik ID
    const newId = generateUniqueId();
    const newPlayer = {
      id: newId,
      number: number,
      name: name,
    };

    if (APP.managingTeam === 'players') {
      newPlayer.isKeeper = isKeeper;
    }

    APP.tempPlayersList.push(newPlayer);
  }

  // Tøm feltene
  if (numberInput) {
    numberInput.value = '';
  }
  if (nameInput) {
    nameInput.value = '';
  }
  if (isKeeperInput) {
    isKeeperInput.checked = false;
  }

  updatePlayersManagementModal();
}

export function editPlayerInTempList(playerId) {
  const player = APP.tempPlayersList.find((p) => p.id === playerId);
  if (!player) {
    return;
  }

  APP.editingPlayerId = playerId;

  // Fyll feltene med spillerdata
  const numberInput = document.getElementById('playerNumberInput');
  const nameInput = document.getElementById('playerNameInput');
  const isKeeperInput = document.getElementById('playerIsKeeperInput');

  if (numberInput) {
    numberInput.value = player.number;
  }
  if (nameInput) {
    nameInput.value = player.name;
  }
  if (isKeeperInput && APP.managingTeam === 'players') {
    isKeeperInput.checked = player.isKeeper || false;
  }
}

export function removePlayerFromTempList(playerId, updatePlayersManagementModal) {
  APP.tempPlayersList = APP.tempPlayersList.filter((p) => p.id !== playerId);
  if (APP.editingPlayerId === playerId) {
    APP.editingPlayerId = null;
    // Tøm feltene
    const numberInput = document.getElementById('playerNumberInput');
    const nameInput = document.getElementById('playerNameInput');
    const isKeeperInput = document.getElementById('playerIsKeeperInput');
    if (numberInput) {
      numberInput.value = '';
    }
    if (nameInput) {
      nameInput.value = '';
    }
    if (isKeeperInput) {
      isKeeperInput.checked = false;
    }
  }
  updatePlayersManagementModal();
}

export function savePlayersList(closeModal) {
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
  return true; // Signal that render should be called
}

export function cancelPlayersManagement(closeModal) {
  APP.tempPlayersList = [];
  APP.managingTeam = null;
  APP.editingPlayerId = null;
  closeModal('playersManagementPopup');
}

export function renderPlayersManagementPopupContent() {
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
            ${
              isPlayers
                ? `
                <div style="margin-bottom: 1rem;">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="checkbox" id="playerIsKeeperInput">
                        <span style="font-weight: 600;">Keeper</span>
                    </label>
                </div>
            `
                : ''
            }
            <button class="btn btn-success" data-action="addPlayerToList" style="width: 100%;">
                ${APP.editingPlayerId ? '✅ Oppdater spiller' : '+ Legg til spiller'}
            </button>
        </div>

        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-weight: 600; margin-bottom: 1rem; font-size: 1.125rem;">
                Spillerliste (${APP.tempPlayersList.length} spillere)
            </h3>
            ${
              APP.tempPlayersList.length === 0
                ? `
                <p style="color: #6b7280; text-align: center; padding: 2rem;">
                    Ingen spillere lagt til ennå
                </p>
            `
                : `
                <div style="max-height: 300px; overflow-y: auto;">
                    ${APP.tempPlayersList
                      .map(
                        (player) => `
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
                    `
                      )
                      .join('')}
                </div>
            `
            }
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
