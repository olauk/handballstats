// ============================================
// LOCAL STORAGE + FIRESTORE CLOUD STORAGE
// ============================================
import { APP, PERFORMANCE } from './state.js';
import { saveMatchToFirestoreDebounced } from './firestore-storage.js';

export function saveToLocalStorage() {
    // Debounce: Vent 300ms før lagring for å unngå for mange skriveoperasjoner
    clearTimeout(PERFORMANCE.saveTimeout);
    PERFORMANCE.saveTimeout = setTimeout(() => {
        try {
            localStorage.setItem('handballApp', JSON.stringify(APP));

            // Also save to Firestore (debounced)
            saveMatchToFirestoreDebounced();
        } catch (e) {
            console.error('Kunne ikke lagre til localStorage:', e);
        }
    }, 300);
}

export function saveToLocalStorageImmediate() {
    // For kritiske operasjoner som krever umiddelbar lagring
    clearTimeout(PERFORMANCE.saveTimeout);
    try {
        localStorage.setItem('handballApp', JSON.stringify(APP));

        // Also save to Firestore (debounced - will save after 1 second)
        saveMatchToFirestoreDebounced();
    } catch (e) {
        console.error('Kunne ikke lagre til localStorage:', e);
    }
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
