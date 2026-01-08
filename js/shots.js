// ============================================
// SHOT REGISTRATION
// ============================================
import { APP, PERFORMANCE } from './state.js';
import { saveToLocalStorage } from './storage.js';
import { logShotEvent, logAppEvent } from './debug-logger.js';

export function handleGoalClick(e) {
    // Validate keeper selection if in defense mode
    if (APP.mode === 'defense') {
        if (!APP.activeKeeper) {
            // Auto-select first keeper if available
            const firstKeeper = APP.players.find(p => p.isKeeper);
            if (firstKeeper) {
                APP.activeKeeper = firstKeeper;
                console.log('🧤 Auto-selected keeper:', firstKeeper.name);
                // Save and re-render to show selected keeper
                saveToLocalStorage();
            } else {
                alert('Du må velge en aktiv keeper før du kan registrere forsvar!\n\nGå til oppsettet og merk minst én spiller som keeper.');
                return false;
            }
        }
    }

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
        return false; // Clicked on something else (like a shot marker)
    }

    APP.selectedResult = null;
    return true; // Signal that a shot position was registered
}

export function selectShotResult(result, attachModalEventListeners) {
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
export function renderShotPopupContent() {
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

export function registerShot(playerId, closeModal, updateGoalVisualization, updateStatisticsOnly) {
    if (!APP.tempShot) return false;

    const player = APP.mode === 'attack'
        ? APP.players.find(p => p.id === playerId)
        : APP.opponents.find(p => p.id === playerId);

    if (!player) return false;

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

    // Log event for debugging
    logShotEvent({
        eventType: event.result === 'mål' ? 'goal' : event.result === 'redning' ? 'save' : 'miss',
        player: player,
        keeper: event.keeper,
        result: event.result,
        position: { x: event.x, y: event.y, zone: event.zone },
        half: event.half
    });

    closeModal('shotPopup');
    saveToLocalStorage();

    // Optimalisert: Oppdater kun målvisualisering og statistikk, ikke hele siden
    updateGoalVisualization();
    updateStatisticsOnly();
    return true;
}

// Optimized function to only update goal area without re-rendering everything
export function updateGoalVisualization() {
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

export function registerTechnicalError(playerId, closeModal, updateStatisticsOnly) {
    const player = APP.players.find(p => p.id === playerId);
    if (!player) return false;

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

    // Log event for debugging
    logShotEvent({
        eventType: 'technical_error',
        player: player,
        keeper: null,
        result: 'teknisk feil',
        position: null,
        half: event.half
    });

    closeModal('technicalPopup');
    saveToLocalStorage();

    // Optimalisert: Oppdater kun statistikk, ikke hele siden
    updateStatisticsOnly();
    return true;
}

export function renderTechnicalPopupContent() {
    return `
        <div class="modal-header">
            <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81;">
                Registrer teknisk feil
            </h2>
            <button class="btn btn-secondary" data-action="closeTechnicalPopup">
                Lukk
            </button>
        </div>

        <p style="color: #4b5563; margin-bottom: 1.5rem;">
            Velg spiller som gjorde teknisk feil
        </p>

        <div class="player-grid">
            ${APP.players.map(player => `
                <button class="player-button" data-action="registerTechnical" data-player-id="${player.id}">
                    <span class="player-number">${player.number}</span>
                    <span class="player-name">${player.name}</span>
                </button>
            `).join('')}
        </div>
    `;
}
