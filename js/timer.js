// ============================================
// TIMER FUNCTIONALITY (ADVANCED MODE ONLY)
// ============================================
import { APP } from './state.js';
import { saveToLocalStorage } from './storage.js';

/**
 * Starts the match timer
 */
export function startTimer() {
    if (APP.timerState.isRunning) {
        console.warn('⚠️ Timer is already running');
        return;
    }

    APP.timerState.isRunning = true;

    // Start interval - update every second
    APP.timerState.intervalId = setInterval(() => {
        APP.timerState.currentTime++;

        // Check if half is over
        const halfLengthSeconds = APP.timerConfig.halfLength * 60;
        if (APP.timerState.currentTime >= halfLengthSeconds) {
            pauseTimer();
            alert(`⏱️ Tid er ute for ${APP.currentHalf}. omgang!\n\nKlikk OK for å fortsette.`);
        }

        updateTimerDisplay();
        saveToLocalStorage();
    }, 1000);

    console.log('▶️ Timer started');
    saveToLocalStorage();
}

/**
 * Pauses the match timer
 */
export function pauseTimer() {
    if (!APP.timerState.isRunning) {
        console.warn('⚠️ Timer is not running');
        return;
    }

    APP.timerState.isRunning = false;

    if (APP.timerState.intervalId) {
        clearInterval(APP.timerState.intervalId);
        APP.timerState.intervalId = null;
    }

    console.log('⏸️ Timer paused');
    saveToLocalStorage();
}

/**
 * Resets the timer to 0
 */
export function resetTimer() {
    pauseTimer();
    APP.timerState.currentTime = 0;
    updateTimerDisplay();
    console.log('🔄 Timer reset');
    saveToLocalStorage();
}

/**
 * Formats seconds into MM:SS format
 * @param {number} totalSeconds - Total seconds to format
 * @returns {string} Formatted time string
 */
export function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Gets current timer time in {minutes, seconds} format
 * @returns {{minutes: number, seconds: number}}
 */
export function getCurrentTimerTime() {
    const totalSeconds = APP.timerState.currentTime;
    return {
        minutes: Math.floor(totalSeconds / 60),
        seconds: totalSeconds % 60
    };
}

/**
 * Updates timer display in the UI
 */
export function updateTimerDisplay() {
    const timerElement = document.getElementById('timerDisplay');
    if (!timerElement) return;

    const formattedTime = formatTime(APP.timerState.currentTime);
    const halfLengthSeconds = APP.timerConfig.halfLength * 60;
    const remainingTime = halfLengthSeconds - APP.timerState.currentTime;

    timerElement.textContent = formattedTime;

    // Change color based on time remaining
    if (remainingTime <= 60 && remainingTime > 0) {
        // Last minute - red
        timerElement.style.color = '#dc2626';
    } else if (remainingTime <= 300) {
        // Last 5 minutes - orange
        timerElement.style.color = '#ea580c';
    } else {
        // Normal - blue
        timerElement.style.color = '#2563eb';
    }
}

/**
 * Renders timer controls for match page
 * @returns {string} HTML string
 */
export function renderTimerControls() {
    const isRunning = APP.timerState.isRunning;
    const formattedTime = formatTime(APP.timerState.currentTime);
    const halfLength = APP.timerConfig.halfLength;

    // Get current score for display
    const events = APP.events;
    const homeGoals = events.filter(e => e.mode === 'attack' && e.result === 'mål').length;
    const awayGoals = events.filter(e => e.mode === 'defense' && e.result === 'mål').length;

    return `
        <div class="timer-container" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 1.5rem; text-align: center; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Team names and score - centered above timer -->
            <div style="display: flex; justify-content: center; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                <div style="color: white; font-size: 1.5rem; font-weight: 700;">
                    ${APP.homeTeam}
                </div>
                <div style="color: white; font-size: 1.5rem; font-weight: 800; font-family: 'Courier New', monospace;">
                    ${homeGoals} - ${awayGoals}
                </div>
                <div style="color: white; font-size: 1.5rem; font-weight: 700;">
                    ${APP.awayTeam}
                </div>
            </div>

            <!-- Current half and length info -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div style="color: white; font-size: 0.875rem; font-weight: 600;">
                    ${APP.currentHalf}. OMGANG
                </div>
                <div style="color: rgba(255, 255, 255, 0.8); font-size: 0.875rem;">
                    Lengde: ${halfLength} min
                </div>
            </div>

            <!-- Timer display -->
            <div id="timerDisplay" style="font-size: 4rem; font-weight: 800; color: white; font-family: 'Courier New', monospace; letter-spacing: 0.1em; margin-bottom: 1rem; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                ${formattedTime}
            </div>

            <!-- Timer controls -->
            <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
                ${isRunning ? `
                    <button class="btn"
                            data-action="pauseTimer"
                            style="background: #fbbf24; color: #78350f; font-weight: 700; padding: 0.5rem 1rem; border: none;">
                        ⏸️ Pause
                    </button>
                ` : `
                    <button class="btn"
                            data-action="startTimer"
                            style="background: #10b981; color: white; font-weight: 700; padding: 0.5rem 1rem; border: none;">
                        ▶️ ${APP.timerState.currentTime > 0 ? 'Fortsett' : 'Start'}
                    </button>
                `}

                <button class="btn"
                        data-action="resetTimer"
                        style="background: rgba(255, 255, 255, 0.2); color: white; font-weight: 700; padding: 0.5rem 1rem; border: 2px solid rgba(255, 255, 255, 0.5);">
                    🔄 Nullstill
                </button>

                ${APP.currentHalf === 1 ? `
                    <button class="btn"
                            data-action="nextHalf"
                            style="background: #3b82f6; color: white; font-weight: 700; padding: 0.5rem 1rem; border: none;">
                        ⏭️ Ny omgang
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Cleans up timer interval when leaving match page
 */
export function cleanupTimer() {
    if (APP.timerState.intervalId) {
        clearInterval(APP.timerState.intervalId);
        APP.timerState.intervalId = null;
        APP.timerState.isRunning = false;
    }
}
