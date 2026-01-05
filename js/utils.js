// ============================================
// DATA MANAGEMENT & UTILITY FUNCTIONS
// ============================================
import { APP, PERFORMANCE } from './state.js';
import { saveToLocalStorageImmediate } from './storage.js';
import { saveCompletedMatchToFirestore, deleteCompletedMatchFromFirestore } from './firestore-storage.js';

export function loadPlayersFromFile() {
    const fileInput = document.getElementById('playersFileInput');
    fileInput.click();
}

export function loadOpponentsFromFile() {
    const fileInput = document.getElementById('opponentsFileInput');
    fileInput.click();
}

export function handlePlayersFileUpload(event, updatePlayersManagementModal, showModal) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target.result;
            let players = [];

            if (file.name.endsWith('.json')) {
                // JSON format: [{id, name, number, isKeeper}, ...]
                players = JSON.parse(content);
            } else if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
                // CSV/TXT format: number,name,isKeeper (one per line)
                const lines = content.split('\n').filter(line => line.trim());
                players = lines.map((line, index) => {
                    const [number, name, isKeeper] = line.split(',').map(s => s.trim());
                    return {
                        id: Date.now() + index + Math.floor(Math.random() * 100),
                        name: name || `Spiller ${index + 1}`,
                        number: parseInt(number) || index + 1,
                        isKeeper: isKeeper === 'true' || isKeeper === '1'
                    };
                });
            }

            if (players.length > 0) {
                // Åpne popup med importerte spillere
                APP.managingTeam = 'players';
                APP.tempPlayersList = players;
                APP.editingPlayerId = null;
                updatePlayersManagementModal();
                showModal('playersManagementPopup');
            }
        } catch (error) {
            alert('Feil ved lasting av fil. Sjekk formatet og prøv igjen.\n\nFormat JSON: [{"id":1,"name":"Navn","number":1,"isKeeper":false}]\nFormat CSV/TXT: nummer,navn,isKeeper');
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
}

export function handleOpponentsFileUpload(event, updatePlayersManagementModal, showModal) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target.result;
            let opponents = [];

            if (file.name.endsWith('.json')) {
                opponents = JSON.parse(content);
            } else if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
                const lines = content.split('\n').filter(line => line.trim());
                opponents = lines.map((line, index) => {
                    const [number, name] = line.split(',').map(s => s.trim());
                    return {
                        id: Date.now() + index + Math.floor(Math.random() * 100),
                        name: name || `Motstander ${index + 1}`,
                        number: parseInt(number) || index + 1
                    };
                });
            }

            if (opponents.length > 0) {
                // Åpne popup med importerte motstandere
                APP.managingTeam = 'opponents';
                APP.tempPlayersList = opponents;
                APP.editingPlayerId = null;
                updatePlayersManagementModal();
                showModal('playersManagementPopup');
            }
        } catch (error) {
            alert('Feil ved lasting av fil. Sjekk formatet og prøv igjen.\n\nFormat JSON: [{"id":1,"name":"Navn","number":1}]\nFormat CSV/TXT: nummer,navn');
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
}

export async function finishMatch() {
    // Bekreft at brukeren vil avslutte kampen
    const confirmMessage = APP.events.length === 0
        ? 'Ingen skudd er registrert. Vil du fortsatt avslutte kampen?'
        : 'Er du sikker på at du vil avslutte kampen? Kampen vil bli lagret.';

    if (!confirm(confirmMessage)) {
        return false;
    }

    const matchData = {
        id: Date.now(),
        matchDate: APP.matchDate,
        homeTeam: APP.homeTeam,
        awayTeam: APP.awayTeam,
        players: JSON.parse(JSON.stringify(APP.players)),
        opponents: JSON.parse(JSON.stringify(APP.opponents)),
        events: JSON.parse(JSON.stringify(APP.events)),
        completedAt: new Date().toISOString()
    };

    APP.completedMatches.push(matchData);

    // Save to both localStorage and Firestore
    saveToLocalStorageImmediate();
    await saveCompletedMatchToFirestore(matchData);

    // Reset match data
    APP.events = [];
    APP.currentHalf = 1;
    APP.activeKeeper = null;
    APP.tempShot = null;
    APP.selectedResult = null;
    APP.mode = 'attack';

    // Invalider cache
    PERFORMANCE.invalidateStatsCache();

    alert('Kampen er avsluttet og lagret!');
    APP.page = 'welcome';
    return true;
}

export function exportData() {
    const data = {
        players: APP.players,
        opponents: APP.opponents,
        events: APP.events,
        homeTeam: APP.homeTeam,
        awayTeam: APP.awayTeam,
        matchDate: APP.matchDate,
        timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `handball-stats-${APP.homeTeam}-${APP.matchDate}.json`;
    a.click();
}

export async function deleteCompletedMatch(matchId) {
    if (confirm('Er du sikker på at du vil slette denne kampen?')) {
        APP.completedMatches = APP.completedMatches.filter(m => m.id !== matchId);

        // Delete from both localStorage and Firestore
        saveToLocalStorageImmediate();
        await deleteCompletedMatchFromFirestore(matchId);

        return true;
    }
    return false;
}

export function viewCompletedMatch(matchId) {
    const match = APP.completedMatches.find(m => m.id === matchId);
    if (match) {
        APP.viewingMatch = match;
        APP.page = 'viewMatch';
        return true;
    }
    return false;
}

export function resetMatch() {
    if (confirm('Er du sikker på at du vil nullstille kampen?')) {
        APP.events = [];
        APP.currentHalf = 1;

        // Invalider cache siden alle events er slettet
        PERFORMANCE.invalidateStatsCache();

        saveToLocalStorageImmediate(); // Bruk umiddelbar lagring for kritiske operasjoner
        return true;
    }
    return false;
}
