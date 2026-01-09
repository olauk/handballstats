// ============================================
// GLOBAL STATE
// ============================================
export const APP = {
    currentUser: null,
    page: 'login', // 'login', 'register', 'reset-password', 'home', 'setup', 'match', 'history', 'viewMatch'
    matchMode: 'simple', // 'simple' or 'advanced' - controls which features are enabled
    homeTeam: 'Eget lag',
    awayTeam: 'Motstander',
    matchDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    currentHalf: 1,
    players: [],
    opponents: [],
    activeKeeper: null,
    mode: 'attack',
    events: [],
    tempShot: null,
    selectedResult: null,
    showShotDetails: false,
    shotDetailsData: null,
    completedMatches: [], // Array of completed matches
    viewingMatch: null, // For viewing a specific completed match
    // Player management popup state
    managingTeam: null, // 'players' or 'opponents'
    tempPlayersList: [], // Temporary list while editing
    editingPlayerId: null, // ID of player being edited
    // Timer state (advanced mode only)
    timerConfig: {
        halfLength: 30 // Half length in minutes: 20, 25, or 30
    },
    timerState: {
        isRunning: false,
        currentTime: 0, // Time in seconds
        intervalId: null // For setInterval
    }
};

// ============================================
// PERFORMANCE OPTIMIZATIONS
// ============================================
export const PERFORMANCE = {
    statsCache: new Map(),
    cacheVersion: 0,
    saveTimeout: null,

    invalidateStatsCache() {
        this.cacheVersion++;
        this.statsCache.clear();
    },

    getCachedStats(key, calculator) {
        const cacheKey = `${key}-v${this.cacheVersion}`;
        if (!this.statsCache.has(cacheKey)) {
            this.statsCache.set(cacheKey, calculator());
        }
        return this.statsCache.get(cacheKey);
    }
};

// ============================================
// HELPER FUNCTIONS FOR VIEWING MATCHES
// ============================================
// These functions return the correct data whether we're viewing a live match
// or a completed match from history
export function getCurrentEvents() {
    return APP.page === 'viewMatch' && APP.viewingMatch
        ? APP.viewingMatch.events
        : APP.events;
}

export function getCurrentPlayers() {
    return APP.page === 'viewMatch' && APP.viewingMatch
        ? APP.viewingMatch.players
        : APP.players;
}

export function getCurrentOpponents() {
    return APP.page === 'viewMatch' && APP.viewingMatch
        ? APP.viewingMatch.opponents
        : APP.opponents;
}
