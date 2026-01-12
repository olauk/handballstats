// ============================================
// LOCAL STORAGE + FIRESTORE CLOUD STORAGE
// ============================================
import { APP, PERFORMANCE } from './state.js';
import { saveMatchToFirestoreDebounced } from './firestore-storage.js';

// ============================================
// SAVE QUEUE SYSTEM
// ============================================
// This queue system ensures no data is lost during rapid successive saves
// All save requests are queued and processed in batches every 300ms

let saveQueue = {
    pending: false,          // Is there a pending save request?
    isProcessing: false,     // Is a save currently being processed?
    lastError: null          // Last error that occurred during save
};

export function saveToLocalStorage() {
    // Mark that a save is pending
    saveQueue.pending = true;

    // If we're not already processing saves, start the debounce timer
    if (!saveQueue.isProcessing) {
        saveQueue.isProcessing = true;

        clearTimeout(PERFORMANCE.saveTimeout);
        PERFORMANCE.saveTimeout = setTimeout(() => {
            processSaveQueue();
        }, 300);
    }
    // If timer is already running, the pending flag ensures we'll save when it fires
}

function processSaveQueue() {
    // Check if there's actually a pending save
    if (!saveQueue.pending) {
        saveQueue.isProcessing = false;
        return;
    }

    try {
        // Save current state to localStorage
        localStorage.setItem('handballApp', JSON.stringify(APP));

        // Clear pending flag and error
        saveQueue.pending = false;
        saveQueue.lastError = null;

        // Also save to Firestore (debounced)
        saveMatchToFirestoreDebounced();

        // Check if any new saves came in while we were processing
        if (saveQueue.pending) {
            // New saves arrived, schedule another batch
            clearTimeout(PERFORMANCE.saveTimeout);
            PERFORMANCE.saveTimeout = setTimeout(() => {
                processSaveQueue();
            }, 300);
        } else {
            // No more pending saves
            saveQueue.isProcessing = false;
        }
    } catch (error) {
        console.error('❌ Failed to save to localStorage:', error);
        saveQueue.lastError = error;
        saveQueue.isProcessing = false;

        // Handle quota exceeded error
        if (error.name === 'QuotaExceededError') {
            // Will be handled by error handling system
            throw error;
        }
    }
}

export function saveToLocalStorageImmediate() {
    // For kritiske operasjoner som krever umiddelbar lagring
    // This bypasses the queue and saves immediately
    clearTimeout(PERFORMANCE.saveTimeout);
    saveQueue.isProcessing = false;
    saveQueue.pending = false;

    try {
        localStorage.setItem('handballApp', JSON.stringify(APP));
        saveQueue.lastError = null;

        // Also save to Firestore (debounced - will save after 1 second)
        saveMatchToFirestoreDebounced();

        return true;
    } catch (error) {
        console.error('❌ Failed to save immediately to localStorage:', error);
        saveQueue.lastError = error;

        // Handle quota exceeded error
        if (error.name === 'QuotaExceededError') {
            throw error;
        }

        return false;
    }
}

// Export queue status for error handling
export function getSaveQueueStatus() {
    return {
        pending: saveQueue.pending,
        isProcessing: saveQueue.isProcessing,
        lastError: saveQueue.lastError
    };
}

export function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('handballApp');
        if (saved) {
            const data = JSON.parse(saved);

            // IMPORTANT: Don't load auth-related state from localStorage
            // Firebase Auth is the single source of truth for authentication
            delete data.currentUser;
            delete data.page; // Always start on login page, Firebase Auth will update if user is logged in

            // Restore everything else (match data, player data, completed matches, etc.)
            Object.assign(APP, data);

            // Initialize or update _idCounter to prevent ID collisions
            // Set it to be higher than all existing IDs
            const allIds = [
                ...APP.players.map(p => p.id),
                ...APP.opponents.map(p => p.id)
            ];
            if (allIds.length > 0) {
                const maxId = Math.max(...allIds);
                // Set counter to ensure next ID will be higher than any existing ID
                APP._idCounter = Math.max(APP._idCounter || 0, maxId - Date.now() + 1000);
            }
        }
    } catch (e) {
        console.error('Kunne ikke laste fra localStorage:', e);
    }
}
