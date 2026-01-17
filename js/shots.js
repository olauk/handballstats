// ============================================
// SHOT REGISTRATION
// ============================================
import { APP, PERFORMANCE } from './state.js';
import { saveToLocalStorage } from './storage.js';
import { logShotEvent, logAppEvent } from './debug-logger.js';
import { getCurrentTimerTime } from './timer.js';
import { updateEventFeed } from './ui/event-feed.js';

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

export function selectShooter(playerId, attachModalEventListeners) {
    APP.selectedShooter = playerId;

    // Update modal content to show next step
    const shotPopup = document.getElementById('shotPopup');
    if (shotPopup) {
        const modalContent = shotPopup.querySelector('.modal-content');
        if (modalContent) {
            modalContent.innerHTML = renderShotPopupContent();
            attachModalEventListeners();
        }
    }
}

export function selectAttackType(type, attachModalEventListeners) {
    APP.selectedAttackType = type;

    // Update modal content to show next step
    const shotPopup = document.getElementById('shotPopup');
    if (shotPopup) {
        const modalContent = shotPopup.querySelector('.modal-content');
        if (modalContent) {
            modalContent.innerHTML = renderShotPopupContent();
            attachModalEventListeners();
        }
    }
}

export function selectShotPosition(position, attachModalEventListeners) {
    APP.selectedShotPosition = position;

    // Update modal content to show next step
    const shotPopup = document.getElementById('shotPopup');
    if (shotPopup) {
        const modalContent = shotPopup.querySelector('.modal-content');
        if (modalContent) {
            modalContent.innerHTML = renderShotPopupContent();
            attachModalEventListeners();
        }
    }
}

export function selectAssist(playerId, attachModalEventListeners) {
    APP.selectedAssist = playerId;

    // Update modal content to show next step
    const shotPopup = document.getElementById('shotPopup');
    if (shotPopup) {
        const modalContent = shotPopup.querySelector('.modal-content');
        if (modalContent) {
            modalContent.innerHTML = renderShotPopupContent();
            attachModalEventListeners();
        }
    }
}

export function skipAssist(attachModalEventListeners) {
    // Set to empty string to indicate "skipped" - different from null which means "not yet selected"
    APP.selectedAssist = '';

    // Update modal content to show player selection
    const shotPopup = document.getElementById('shotPopup');
    if (shotPopup) {
        const modalContent = shotPopup.querySelector('.modal-content');
        if (modalContent) {
            modalContent.innerHTML = renderShotPopupContent();
            attachModalEventListeners();
        }
    }
}

// Separate function for modal content only
export function renderShotPopupContent() {
    const isOutside = APP.tempShot?.zone === 'outside';
    const playersList = APP.mode === 'attack' ? APP.players : APP.opponents;

    // Check if we're in detailed shot registration mode
    const isDetailedMode = APP.matchMode === 'advanced' && APP.shotRegistrationMode === 'detailed';

    // Progressive disclosure steps - ONLY ONE STEP SHOWN AT A TIME
    // New order: Result → Shooter → Attack Type → Shot Position → Assist
    const needsResult = !isOutside && !APP.selectedResult;
    const needsShooter = (APP.selectedResult || isOutside) && !APP.selectedShooter;
    const needsAttackType = isDetailedMode && APP.selectedShooter && !APP.selectedAttackType;
    const needsShotPosition = isDetailedMode && APP.selectedShooter && APP.selectedAttackType && !APP.selectedShotPosition;
    const needsAssist = isDetailedMode && APP.mode === 'attack' && APP.selectedResult === 'mål' && APP.selectedShooter && APP.selectedAttackType && APP.selectedShotPosition && !APP.selectedAssist;
    const readyToRegister = APP.selectedShooter && (!isDetailedMode || (APP.selectedAttackType && APP.selectedShotPosition && (APP.selectedAssist || APP.selectedResult !== 'mål' || APP.mode !== 'attack')));

    // Build summary of selections for detailed mode
    let selectionSummary = '';
    if (APP.selectedResult || APP.selectedShooter || APP.selectedAttackType || APP.selectedShotPosition || APP.selectedAssist) {
        const parts = [];
        if (APP.selectedResult) parts.push(`Resultat: ${APP.selectedResult === 'mål' ? '⚽ Mål' : '🧤 Redning'}`);
        if (APP.selectedShooter) {
            const shooter = playersList.find(p => p.id === APP.selectedShooter);
            parts.push(`Skytter: #${shooter?.number} ${shooter?.name}`);
        }
        if (APP.selectedAttackType) parts.push(`Angrep: ${APP.selectedAttackType === 'etablert' ? '🏃 Etablert' : '⚡ Kontring'}`);
        if (APP.selectedShotPosition) {
            const posLabels = { '9m': '9m', '6m': '6m', '7m': '7m', 'ka': 'KA' };
            parts.push(`Posisjon: ${posLabels[APP.selectedShotPosition]}`);
        }
        if (APP.selectedAssist) {
            const assistPlayer = APP.players.find(p => p.id === APP.selectedAssist);
            parts.push(`Assist: #${assistPlayer?.number} ${assistPlayer?.name}`);
        }
        selectionSummary = `<p style="color: #4b5563; font-size: 0.875rem; margin-bottom: 1rem; padding: 0.75rem; background: #f3f4f6; border-radius: 0.5rem;">${parts.join(' • ')}</p>`;
    }

    // Determine current step for UI
    let currentStep = '';
    let stepNumber = 1;
    if (needsResult) {
        currentStep = `Steg ${stepNumber}: Velg resultat av skuddet`;
    } else if (needsShooter) {
        stepNumber = isOutside ? 1 : 2;
        currentStep = `Steg ${stepNumber}: Velg spiller som avfyrte skuddet`;
    } else if (needsAttackType) {
        currentStep = `Steg 3: Velg angrepstype`;
    } else if (needsShotPosition) {
        currentStep = `Steg 4: Velg skuddposisjon`;
    } else if (needsAssist) {
        currentStep = `Steg 5 (valgfritt): Velg assist, eller fortsett uten assist`;
    } else if (readyToRegister) {
        currentStep = `Klar til å registrere skudd`;
    }

    return `
        <div class="modal-header">
            <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81;">
                ${APP.mode === 'attack' ? 'Registrer skudd' : 'Registrer motstanderskudd'}
                ${isDetailedMode ? '<span style="font-size: 0.875rem; font-weight: 600; color: #10b981; margin-left: 0.5rem;">DETALJERT</span>' : ''}
            </h2>
            <button class="btn btn-secondary" data-action="closeShotPopup">
                Lukk
            </button>
        </div>

        ${selectionSummary}

        <p style="color: #4b5563; margin-bottom: 1.5rem; font-weight: 600;">
            ${currentStep}
        </p>

        ${needsResult ? `
            <div>
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
        ` : needsShooter ? `
            <div>
                <div class="player-grid">
                    ${playersList.map(player => `
                        <button class="player-button" data-action="selectShooter" data-player-id="${player.id}">
                            <span class="player-number">${player.number}</span>
                            <span class="player-name">${player.name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        ` : needsAttackType ? `
            <div>
                <div class="grid-2">
                    <button class="btn btn-blue" data-action="selectAttackType" data-type="etablert"
                            style="padding: 1rem; font-size: 1.125rem;">
                        🏃 Etablert angrep
                    </button>
                    <button class="btn btn-purple" data-action="selectAttackType" data-type="kontring"
                            style="padding: 1rem; font-size: 1.125rem;">
                        ⚡ Kontring
                    </button>
                </div>
            </div>
        ` : needsShotPosition ? `
            <div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
                    <button class="btn btn-blue" data-action="selectShotPosition" data-position="9m"
                            style="padding: 1rem; font-size: 1.125rem;">
                        9m
                    </button>
                    <button class="btn btn-blue" data-action="selectShotPosition" data-position="6m"
                            style="padding: 1rem; font-size: 1.125rem;">
                        6m
                    </button>
                    <button class="btn btn-blue" data-action="selectShotPosition" data-position="7m"
                            style="padding: 1rem; font-size: 1.125rem;">
                        7m
                    </button>
                    <button class="btn btn-blue" data-action="selectShotPosition" data-position="ka"
                            style="padding: 1rem; font-size: 1.125rem;">
                        KA (Kantangrep)
                    </button>
                </div>
            </div>
        ` : needsAssist ? `
            <div>
                <div style="margin-bottom: 1rem;">
                    <button class="btn btn-secondary" data-action="skipAssist" style="width: 100%; padding: 0.75rem;">
                        Hopp over assist →
                    </button>
                </div>
                <div class="player-grid">
                    ${APP.players.filter(p => p.id !== APP.selectedShooter).map(player => `
                        <button class="player-button" data-action="selectAssist" data-player-id="${player.id}">
                            <span class="player-number">${player.number}</span>
                            <span class="player-name">${player.name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        ` : readyToRegister ? `
            <div>
                <button class="btn btn-success" data-action="registerShotFinal"
                        style="width: 100%; padding: 1.5rem; font-size: 1.25rem; font-weight: 700;">
                    ✅ Registrer skudd
                </button>
            </div>
        ` : ''}
    `;
}

export function registerShot(playerId, closeModal, updateGoalVisualization, updateStatisticsOnly) {
    // ============================================
    // VALIDATION
    // ============================================

    if (!APP.tempShot) {
        console.error('❌ registerShot: No tempShot data');
        return false;
    }

    // Use selectedShooter if available (detailed mode), otherwise use playerId parameter (simple mode)
    const shooterId = APP.selectedShooter || playerId;

    if (!shooterId) {
        console.error('❌ registerShot: No shooter selected');
        alert('Feil: Ingen spiller valgt. Vennligst velg en spiller.');
        return false;
    }

    const player = APP.mode === 'attack'
        ? APP.players.find(p => p.id === shooterId)
        : APP.opponents.find(p => p.id === shooterId);

    if (!player) {
        console.error('❌ registerShot: Player not found', { playerId, mode: APP.mode });
        alert('Feil: Spiller ikke funnet. Vennligst prøv igjen.');
        return false;
    }

    // Validate keeper in defense mode
    if (APP.mode === 'defense' && !APP.activeKeeper) {
        console.warn('⚠️ registerShot: No active keeper in defense mode');
        // Not critical - continue without keeper
    }

    // ============================================
    // CREATE EVENT OBJECT
    // ============================================

    let event;
    try {
        event = {
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

        // Add advanced shot registration fields (only in detailed mode)
        if (APP.matchMode === 'advanced' && APP.shotRegistrationMode === 'detailed') {
            if (APP.selectedAttackType) {
                event.attackType = APP.selectedAttackType;
            }
            if (APP.selectedShotPosition) {
                event.shotPosition = APP.selectedShotPosition;
            }
            // Assist only for goals and only for own team (attack mode)
            if (APP.selectedAssist && APP.mode === 'attack' && event.result === 'mål') {
                const assistPlayer = APP.players.find(p => p.id === APP.selectedAssist);
                event.assist = assistPlayer ? {
                    id: assistPlayer.id,
                    number: assistPlayer.number,
                    name: assistPlayer.name
                } : null;
            }
        }

        // Add timer timestamp in advanced mode
        if (APP.matchMode === 'advanced') {
            const timerTime = getCurrentTimerTime();

            // Beregn total kamptid (legg til 1. omgangs lengde for 2. omgang)
            let totalMinutes = timerTime.minutes;
            let totalSeconds = timerTime.seconds;

            if (APP.currentHalf === 2) {
                totalMinutes += APP.timerConfig.halfLength;
            }

            event.timerTimestamp = {
                minutes: totalMinutes,
                seconds: totalSeconds
            };
        }
    } catch (error) {
        console.error('❌ Failed to create event object:', error);
        alert('Feil ved opprettelse av hendelse. Vennligst prøv igjen.');
        logAppEvent('error', { function: 'registerShot_createEvent', error: error.message });
        return false;
    }

    // ============================================
    // SAVE EVENT TO STATE AND STORAGE
    // ============================================

    try {
        // Add event to state
        APP.events.push(event);

        // Save to localStorage (queued save - will execute after 300ms)
        saveToLocalStorage();

        // Clear temporary shot data AFTER successful save
        APP.tempShot = null;
        APP.selectedResult = null;
        APP.selectedShooter = null;
        APP.selectedAttackType = null;
        APP.selectedShotPosition = null;
        APP.selectedAssist = null;

        // Invalider statistikk-cache AFTER save
        PERFORMANCE.invalidateStatsCache();

        // Log event for debugging (non-critical, don't fail if this errors)
        try {
            logShotEvent({
                eventType: event.result === 'mål' ? 'goal' : event.result === 'redning' ? 'save' : 'miss',
                player: player,
                keeper: event.keeper,
                result: event.result,
                position: { x: event.x, y: event.y, zone: event.zone },
                half: event.half
            });
        } catch (logError) {
            console.warn('⚠️ Failed to log shot event (non-critical):', logError);
        }

        // Close modal and update UI
        closeModal('shotPopup');

        // Optimalisert: Oppdater kun målvisualisering og statistikk, ikke hele siden
        updateGoalVisualization();
        updateStatisticsOnly();

        // Update event feed if in advanced mode
        try {
            updateEventFeed();
        } catch (feedError) {
            console.warn('⚠️ Failed to update event feed (non-critical):', feedError);
        }

        return true;

    } catch (error) {
        // ============================================
        // ERROR HANDLING WITH ROLLBACK
        // ============================================

        console.error('❌ CRITICAL: Failed to register shot:', error);

        // Rollback: Remove event from state if it was added
        const eventIndex = APP.events.findIndex(e => e.id === event.id);
        if (eventIndex !== -1) {
            APP.events.splice(eventIndex, 1);
            console.log('✅ Rolled back event from state');
        }

        // Log error
        try {
            logAppEvent('error', {
                function: 'registerShot',
                error: error.message,
                errorName: error.name,
                playerId: playerId,
                mode: APP.mode
            });
        } catch (logError) {
            console.error('Failed to log error:', logError);
        }

        // Handle specific error types
        if (error.name === 'QuotaExceededError') {
            showRetryDialog(
                'Lagringsplass full!',
                'Enheten din har ikke mer lagringsplass. Vennligst avslutt noen gamle kamper eller slett noe data.',
                () => {
                    // Retry callback
                    registerShot(playerId, closeModal, updateGoalVisualization, updateStatisticsOnly);
                }
            );
        } else {
            // Generic error with retry option
            showRetryDialog(
                'Kunne ikke lagre skudd',
                `En feil oppstod: ${error.message}\n\nData er IKKE lagret. Vennligst prøv igjen.`,
                () => {
                    // Retry callback
                    registerShot(playerId, closeModal, updateGoalVisualization, updateStatisticsOnly);
                }
            );
        }

        return false;
    }
}

/**
 * Show error dialog with retry option
 * Only shown for critical errors
 */
function showRetryDialog(title, message, retryCallback) {
    const retry = confirm(`${title}\n\n${message}\n\nTrykk OK for å prøve igjen, eller Avbryt for å fortsette uten å lagre.`);

    if (retry && retryCallback) {
        console.log('🔄 User requested retry');
        retryCallback();
    } else {
        console.log('⚠️ User chose to continue without saving');
    }
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

        // Include timer timestamp if available (advanced mode)
        let title = event.result;
        if (event.timerTimestamp) {
            const min = String(event.timerTimestamp.minutes).padStart(2, '0');
            const sec = String(event.timerTimestamp.seconds).padStart(2, '0');
            title = `[${min}:${sec}] ${title}`;
        }
        title += ` - ${event.timestamp}`;
        marker.title = title;

        goalArea.appendChild(marker);
    });

    // Add outside markers - using actual click position
    outsideShots.forEach(event => {
        const playerNumber = APP.mode === 'attack' ? event.player?.number : event.opponent?.number;
        const marker = document.createElement('div');
        marker.className = 'shot-marker outside';
        marker.style.left = `${event.x}%`;
        marker.style.top = `${event.y}%`;
        marker.style.position = 'absolute';
        marker.textContent = playerNumber;

        // Include timer timestamp if available (advanced mode)
        let title = event.result + ' utenfor';
        if (event.timerTimestamp) {
            const min = String(event.timerTimestamp.minutes).padStart(2, '0');
            const sec = String(event.timerTimestamp.seconds).padStart(2, '0');
            title = `[${min}:${sec}] ${title}`;
        }
        title += ` - ${event.timestamp}`;
        marker.title = title;

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

    // Add timer timestamp in advanced mode
    if (APP.matchMode === 'advanced') {
        const timerTime = getCurrentTimerTime();

        // Beregn total kamptid (legg til 1. omgangs lengde for 2. omgang)
        let totalMinutes = timerTime.minutes;
        let totalSeconds = timerTime.seconds;

        if (APP.currentHalf === 2) {
            totalMinutes += APP.timerConfig.halfLength;
        }

        event.timerTimestamp = {
            minutes: totalMinutes,
            seconds: totalSeconds
        };
    }

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

    // Update event feed if in advanced mode
    updateEventFeed();

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
