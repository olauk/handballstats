// ============================================
// GLOBAL STATE
// ============================================
export const APP = {
  currentUser: null,
  page: 'login', // 'login', 'register', 'reset-password', 'home', 'setup', 'match', 'history', 'viewMatch', 'teamRoster', 'help'
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
  // Advanced shot registration (only in advanced mode + detailed shot registration)
  shotRegistrationMode: 'simple', // 'simple' or 'detailed'
  selectedShooter: null, // Player ID who took the shot (selected before attack type/position in detailed mode)
  selectedAttackType: null, // 'etablert' or 'kontring'
  selectedShotPosition: null, // '9m', '6m', '7m', 'ka'
  selectedAssist: null, // Player ID who made the assist (optional, only for goals)
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
    halfLength: 30, // Half length in minutes: 20, 25, or 30
  },
  timerState: {
    isRunning: false,
    currentTime: 0, // Time in seconds
    intervalId: null, // For setInterval
  },
  // ID generator state - ensures unique IDs across all players and opponents
  _idCounter: 0, // Internal counter for generating unique IDs
  // Saved teams/rosters - allows user to save multiple teams with player rosters
  savedTeams: [], // [{id, name, players: [{id, number, name, isKeeper}]}]
  editingTeamId: null, // ID of team currently being edited
  // Import team state - tracks which team is being imported
  importingTeamId: null, // ID of team being imported to setup
  // File import lock - prevents race condition when importing multiple files rapidly
  isImportingFile: false, // Lock to prevent parallel file imports
};

// ============================================
// PERFORMANCE OPTIMIZATIONS
// ============================================
export const PERFORMANCE = {
  statsCache: new Map(),
  cacheVersion: 0,
  saveTimeout: null,
  maxCacheSize: 500, // Maximum number of cache entries before clearing

  invalidateStatsCache() {
    this.cacheVersion++;
    this.statsCache.clear();
  },

  getCachedStats(key, calculator) {
    // Memory Leak Fix: Clear cache if it grows too large
    if (this.statsCache.size >= this.maxCacheSize) {
      console.warn(`⚠️ Stats cache reached max size (${this.maxCacheSize}), clearing...`);
      this.statsCache.clear();
      // Increment version to invalidate any external references
      this.cacheVersion++;
    }

    const cacheKey = `${key}-v${this.cacheVersion}`;
    if (!this.statsCache.has(cacheKey)) {
      this.statsCache.set(cacheKey, calculator());
    }
    return this.statsCache.get(cacheKey);
  },
};

// ============================================
// HELPER FUNCTIONS FOR VIEWING MATCHES
// ============================================
// These functions return the correct data whether we're viewing a live match
// or a completed match from history
export function getCurrentEvents() {
  return APP.page === 'viewMatch' && APP.viewingMatch ? APP.viewingMatch.events : APP.events;
}

export function getCurrentPlayers() {
  return APP.page === 'viewMatch' && APP.viewingMatch ? APP.viewingMatch.players : APP.players;
}

export function getCurrentOpponents() {
  return APP.page === 'viewMatch' && APP.viewingMatch ? APP.viewingMatch.opponents : APP.opponents;
}

// ============================================
// UNIQUE ID GENERATOR
// ============================================
/**
 * Generates a guaranteed unique ID for players and opponents.
 * Combines timestamp, counter, and validation to prevent duplicates.
 *
 * @returns {number} A unique ID
 */
export function generateUniqueId() {
  // Get all existing IDs from players, opponents, and tempPlayersList
  const existingIds = new Set([
    ...APP.players.map((p) => p.id),
    ...APP.opponents.map((p) => p.id),
    ...APP.tempPlayersList.map((p) => p.id),
  ]);

  // Generate ID using timestamp + counter
  let newId;
  let attempts = 0;
  const maxAttempts = 1000;

  do {
    // Use timestamp + counter for uniqueness
    newId = Date.now() + APP._idCounter++;
    attempts++;

    // Safety check to prevent infinite loop
    if (attempts > maxAttempts) {
      console.error('⚠️ Failed to generate unique ID after 1000 attempts');
      // Fallback: use timestamp + large random number
      newId = Date.now() + Math.floor(Math.random() * 1000000);
      break;
    }
  } while (existingIds.has(newId));

  return newId;
}
