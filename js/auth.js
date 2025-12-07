// ============================================
// LOGIN & AUTH
// ============================================
import { APP, PERFORMANCE } from './state.js';
import { saveToLocalStorageImmediate } from './storage.js';

export function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Dummy authentication
    if (username === 'Ola' && password === 'handball') {
        APP.currentUser = username;
        APP.page = 'welcome';
        saveToLocalStorageImmediate(); // Bruk umiddelbar lagring for kritiske operasjoner
        // render() will be called from events.js
        return true;
    } else {
        alert('Feil brukernavn eller passord. Prøv: Ola / handball');
        return false;
    }
}

export function handleLogout() {
    if (confirm('Er du sikker på at du vil logge ut?')) {
        APP.currentUser = null;
        APP.page = 'login';
        return true;
    }
    return false;
}

export function startNewMatch() {
    // Nullstill spillerdata, men behold kamphistorikk
    APP.players = [];
    APP.opponents = [];
    APP.homeTeam = 'Hjemmelag';
    APP.awayTeam = 'Bortelag';
    APP.matchDate = new Date().toISOString().split('T')[0];
    APP.events = [];
    APP.currentHalf = 1;
    APP.activeKeeper = null;
    APP.mode = 'attack';
    APP.tempShot = null;
    APP.selectedResult = null;

    // Invalider cache
    PERFORMANCE.invalidateStatsCache();

    APP.page = 'setup';
    saveToLocalStorageImmediate();
}
