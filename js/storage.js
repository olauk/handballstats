// ============================================
// LOCAL STORAGE
// ============================================
import { APP, PERFORMANCE } from './state.js';

export function saveToLocalStorage() {
    // Debounce: Vent 300ms før lagring for å unngå for mange skriveoperasjoner
    clearTimeout(PERFORMANCE.saveTimeout);
    PERFORMANCE.saveTimeout = setTimeout(() => {
        try {
            localStorage.setItem('handballApp', JSON.stringify(APP));
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
    } catch (e) {
        console.error('Kunne ikke lagre til localStorage:', e);
    }
}

export function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('handballApp');
        if (saved) {
            const data = JSON.parse(saved);
            // Restore everything except functions
            Object.assign(APP, data);
        }
    } catch (e) {
        console.error('Kunne ikke laste fra localStorage:', e);
    }
}
