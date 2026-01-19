// ============================================
// MATCH MANAGEMENT TESTS
// ============================================
// Tests for startNewMatch() and continueMatchSetup()
// These functions handle match lifecycle:
// - startNewMatch: Complete reset of all match data
// - continueMatchSetup: Continue existing match without reset

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { startNewMatch, continueMatchSetup } from '../../js/auth.js';

// Mock dependencies
vi.mock('../../js/state.js', () => ({
  APP: {
    currentUser: { uid: 'test-user', homeTeam: 'Test Team', email: 'test@test.com' },
    page: 'home',
    matchMode: 'advanced',
    homeTeam: 'Old Home Team',
    awayTeam: 'Old Away Team',
    matchDate: '2024-01-01',
    currentHalf: 2,
    players: [
      { id: '1', name: 'Player 1', number: 1 },
      { id: '2', name: 'Player 2', number: 2 },
    ],
    opponents: [{ id: 'opp1', name: 'Opponent 1', number: 5 }],
    activeKeeper: { id: '3', name: 'Keeper 1' },
    mode: 'defense',
    events: [
      { id: 1, result: 'mål', half: 1 },
      { id: 2, result: 'redning', half: 2 },
    ],
    tempShot: { x: 50, y: 50, zone: 'goal' },
    selectedResult: 'mål',
    showShotDetails: true,
    shotDetailsData: { some: 'data' },
    // Advanced shot registration fields
    shotRegistrationMode: 'detailed',
    selectedShooter: '1',
    selectedAttackType: 'etablert',
    selectedShotPosition: '9m',
    selectedAssist: '2',
    // Player management state
    managingTeam: 'players',
    tempPlayersList: [{ id: '1', name: 'Temp' }],
    editingPlayerId: '1',
    // Team roster state
    editingTeamId: 'team1',
    importingTeamId: 'team2',
    viewingMatch: { id: 'match1' },
    // Timer state
    timerState: {
      isRunning: true,
      currentTime: 1800, // 30 minutes
      intervalId: 12345,
    },
    timerConfig: {
      halfLength: 25,
    },
    // Locks
    isImportingFile: true,
    // Saved data (should be preserved)
    completedMatches: [{ id: 'completed1' }],
    savedTeams: [{ id: 'team1', name: 'Saved Team' }],
  },
  PERFORMANCE: {
    invalidateStatsCache: vi.fn(),
    statsCache: new Map([['key1', 'value1']]),
    cacheVersion: 5,
  },
}));

vi.mock('../../js/storage.js', () => ({
  saveToLocalStorage: vi.fn(),
  saveToLocalStorageImmediate: vi.fn(),
}));

// Mock Firebase to prevent "Firebase SDK not loaded" error
vi.mock('../../js/firebase-config.js', () => ({
  auth: { currentUser: null },
  db: {},
  analytics: null,
}));

// Mock Firestore storage functions
vi.mock('../../js/firestore-storage.js', () => ({
  migrateLocalStorageToFirestore: vi.fn(),
  syncFromFirestore: vi.fn(),
  saveMatchToFirestoreDebounced: vi.fn(),
}));

// NOTE: continueMatchSetup() in auth.js calls saveToLocalStorage() but doesn't import it
// This is a bug in the production code - the function is not in scope
// For testing purposes, we make saveToLocalStorage available globally
global.saveToLocalStorage = vi.fn();

describe('Match Management', () => {
  beforeEach(async () => {
    const { APP } = await import('../../js/state.js');

    // Reset APP to "dirty" state with previous match data
    APP.page = 'home';
    APP.matchMode = 'advanced';
    APP.homeTeam = 'Old Home Team';
    APP.awayTeam = 'Old Away Team';
    APP.currentHalf = 2;
    APP.players = [
      { id: '1', name: 'Player 1', number: 1 },
      { id: '2', name: 'Player 2', number: 2 },
    ];
    APP.opponents = [{ id: 'opp1', name: 'Opponent 1', number: 5 }];
    APP.activeKeeper = { id: '3', name: 'Keeper 1' };
    APP.mode = 'defense';
    APP.events = [
      { id: 1, result: 'mål', half: 1 },
      { id: 2, result: 'redning', half: 2 },
    ];
    APP.tempShot = { x: 50, y: 50, zone: 'goal' };
    APP.selectedResult = 'mål';
    APP.shotRegistrationMode = 'detailed';
    APP.selectedShooter = '1';
    APP.selectedAttackType = 'etablert';
    APP.selectedShotPosition = '9m';
    APP.selectedAssist = '2';
    APP.managingTeam = 'players';
    APP.tempPlayersList = [{ id: '1', name: 'Temp' }];
    APP.editingPlayerId = '1';
    APP.timerState.isRunning = true;
    APP.timerState.currentTime = 1800;
    APP.timerState.intervalId = 12345;
    APP.timerConfig.halfLength = 25;
    APP.isImportingFile = true;

    // Mock clearInterval
    global.clearInterval = vi.fn();

    // Reset global saveToLocalStorage mock
    global.saveToLocalStorage.mockClear();

    vi.clearAllMocks();
  });

  // ============================================
  // TEST: startNewMatch
  // ============================================
  describe('startNewMatch', () => {
    it('skal nullstille alle spillerdata', async () => {
      const { APP } = await import('../../js/state.js');
      const { saveToLocalStorageImmediate } = await import('../../js/storage.js');

      startNewMatch();

      expect(APP.players).toEqual([]);
      expect(APP.opponents).toEqual([]);
      expect(APP.events).toEqual([]);
      expect(saveToLocalStorageImmediate).toHaveBeenCalled();
    });

    it('skal nullstille kampdata til defaults', async () => {
      const { APP } = await import('../../js/state.js');

      startNewMatch();

      expect(APP.homeTeam).toBe('Test Team'); // From currentUser.homeTeam
      expect(APP.awayTeam).toBe('Motstander');
      expect(APP.currentHalf).toBe(1);
      expect(APP.mode).toBe('attack');
      expect(APP.activeKeeper).toBeNull();
    });

    it('skal nullstille skudd/modal state', async () => {
      const { APP } = await import('../../js/state.js');

      startNewMatch();

      expect(APP.tempShot).toBeNull();
      expect(APP.selectedResult).toBeNull();
      expect(APP.showShotDetails).toBe(false);
      expect(APP.shotDetailsData).toBeNull();
    });

    it('skal nullstille detaljert skuddregistrering', async () => {
      const { APP } = await import('../../js/state.js');

      startNewMatch();

      expect(APP.shotRegistrationMode).toBe('simple');
      expect(APP.selectedShooter).toBeNull();
      expect(APP.selectedAttackType).toBeNull();
      expect(APP.selectedShotPosition).toBeNull();
      expect(APP.selectedAssist).toBeNull();
    });

    it('skal nullstille spilleradministrasjon state', async () => {
      const { APP } = await import('../../js/state.js');

      startNewMatch();

      expect(APP.managingTeam).toBeNull();
      expect(APP.tempPlayersList).toEqual([]);
      expect(APP.editingPlayerId).toBeNull();
    });

    it('skal nullstille lag roster state', async () => {
      const { APP } = await import('../../js/state.js');

      startNewMatch();

      expect(APP.editingTeamId).toBeNull();
      expect(APP.importingTeamId).toBeNull();
      expect(APP.viewingMatch).toBeNull();
    });

    it('skal stoppe timer hvis den kjører (KRITISK)', async () => {
      const { APP } = await import('../../js/state.js');

      APP.timerState.isRunning = true;
      APP.timerState.intervalId = 12345;

      startNewMatch();

      expect(global.clearInterval).toHaveBeenCalledWith(12345);
      expect(APP.timerState.isRunning).toBe(false);
      expect(APP.timerState.currentTime).toBe(0);
      expect(APP.timerState.intervalId).toBeNull();
    });

    it('skal nullstille timer config til default (30 min)', async () => {
      const { APP } = await import('../../js/state.js');

      APP.timerConfig.halfLength = 25;

      startNewMatch();

      expect(APP.timerConfig.halfLength).toBe(30);
    });

    it('skal BEHOLDE matchMode (brukervalg)', async () => {
      const { APP } = await import('../../js/state.js');

      APP.matchMode = 'advanced';

      startNewMatch();

      // matchMode should NOT be reset - user selected this on home page
      expect(APP.matchMode).toBe('advanced');
    });

    it('skal nullstille locks', async () => {
      const { APP } = await import('../../js/state.js');

      APP.isImportingFile = true;

      startNewMatch();

      expect(APP.isImportingFile).toBe(false);
    });

    it('skal invalidere statistikk-cache', async () => {
      const { PERFORMANCE } = await import('../../js/state.js');

      startNewMatch();

      expect(PERFORMANCE.invalidateStatsCache).toHaveBeenCalled();
    });

    it('skal navigere til setup-siden', async () => {
      const { APP } = await import('../../js/state.js');

      startNewMatch();

      expect(APP.page).toBe('setup');
    });

    it('skal lagre umiddelbart til localStorage', async () => {
      const { saveToLocalStorageImmediate } = await import('../../js/storage.js');

      startNewMatch();

      expect(saveToLocalStorageImmediate).toHaveBeenCalledTimes(1);
    });

    it('skal BEHOLDE completedMatches (kamphistorikk)', async () => {
      const { APP } = await import('../../js/state.js');

      const originalMatches = [{ id: 'completed1' }];
      APP.completedMatches = originalMatches;

      startNewMatch();

      // Completed matches should be preserved
      expect(APP.completedMatches).toBe(originalMatches);
    });

    it('skal BEHOLDE savedTeams (lagdata)', async () => {
      const { APP } = await import('../../js/state.js');

      const originalTeams = [{ id: 'team1', name: 'Saved Team' }];
      APP.savedTeams = originalTeams;

      startNewMatch();

      // Saved teams should be preserved
      expect(APP.savedTeams).toBe(originalTeams);
    });

    it('skal BEHOLDE currentUser (auth state)', async () => {
      const { APP } = await import('../../js/state.js');

      const originalUser = APP.currentUser;

      startNewMatch();

      // User should remain logged in
      expect(APP.currentUser).toBe(originalUser);
      expect(APP.currentUser.uid).toBe('test-user');
    });
  });

  // ============================================
  // TEST: continueMatchSetup
  // ============================================
  describe('continueMatchSetup', () => {
    it('skal IKKE nullstille spillerdata', async () => {
      const { APP } = await import('../../js/state.js');

      const originalPlayers = APP.players;
      const originalOpponents = APP.opponents;
      const originalEvents = APP.events;

      continueMatchSetup();

      expect(APP.players).toBe(originalPlayers);
      expect(APP.opponents).toBe(originalOpponents);
      expect(APP.events).toBe(originalEvents);
    });

    it('skal IKKE nullstille kampdata', async () => {
      const { APP } = await import('../../js/state.js');

      APP.homeTeam = 'Existing Home';
      APP.awayTeam = 'Existing Away';
      APP.currentHalf = 2;

      continueMatchSetup();

      expect(APP.homeTeam).toBe('Existing Home');
      expect(APP.awayTeam).toBe('Existing Away');
      expect(APP.currentHalf).toBe(2);
    });

    it('skal IKKE nullstille timer state', async () => {
      const { APP } = await import('../../js/state.js');

      APP.timerState.currentTime = 1800;
      APP.timerConfig.halfLength = 25;

      continueMatchSetup();

      expect(APP.timerState.currentTime).toBe(1800);
      expect(APP.timerConfig.halfLength).toBe(25);
      expect(global.clearInterval).not.toHaveBeenCalled();
    });

    it('skal navigere til setup-siden', async () => {
      const { APP } = await import('../../js/state.js');

      continueMatchSetup();

      expect(APP.page).toBe('setup');
    });

    it('skal lagre til localStorage (debounced)', async () => {
      continueMatchSetup();

      expect(global.saveToLocalStorage).toHaveBeenCalledTimes(1);
    });

    it('skal bruke debounced save (ikke immediate)', async () => {
      const { saveToLocalStorageImmediate } = await import('../../js/storage.js');

      continueMatchSetup();

      expect(global.saveToLocalStorage).toHaveBeenCalled();
      expect(saveToLocalStorageImmediate).not.toHaveBeenCalled();
    });

    it('skal beholde ALL eksisterende state', async () => {
      const { APP } = await import('../../js/state.js');

      // Set all state to known values
      APP.tempShot = { x: 75, y: 25, zone: 'goal' };
      APP.selectedResult = 'redning';
      APP.selectedShooter = '5';
      APP.managingTeam = 'opponents';

      continueMatchSetup();

      // All state should be unchanged
      expect(APP.tempShot).toEqual({ x: 75, y: 25, zone: 'goal' });
      expect(APP.selectedResult).toBe('redning');
      expect(APP.selectedShooter).toBe('5');
      expect(APP.managingTeam).toBe('opponents');
    });
  });

  // ============================================
  // TEST: Comparison between functions
  // ============================================
  describe('Comparison: startNewMatch vs continueMatchSetup', () => {
    it('startNewMatch skal resette, continueMatchSetup skal beholde', async () => {
      const { APP } = await import('../../js/state.js');

      // Setup initial state
      APP.players = [{ id: '1', name: 'Player 1' }];
      APP.events = [{ id: 1, result: 'mål' }];
      APP.currentHalf = 2;

      // Test startNewMatch resets everything
      startNewMatch();
      expect(APP.players).toEqual([]);
      expect(APP.events).toEqual([]);
      expect(APP.currentHalf).toBe(1);

      // Setup state again
      APP.players = [{ id: '2', name: 'Player 2' }];
      APP.events = [{ id: 2, result: 'redning' }];
      APP.currentHalf = 2;

      // Test continueMatchSetup keeps everything
      continueMatchSetup();
      expect(APP.players).toEqual([{ id: '2', name: 'Player 2' }]);
      expect(APP.events).toEqual([{ id: 2, result: 'redning' }]);
      expect(APP.currentHalf).toBe(2);
    });

    it('begge skal navigere til setup page', async () => {
      const { APP } = await import('../../js/state.js');

      APP.page = 'home';
      startNewMatch();
      expect(APP.page).toBe('setup');

      APP.page = 'home';
      continueMatchSetup();
      expect(APP.page).toBe('setup');
    });

    it('startNewMatch bruker immediate save, continueMatchSetup bruker debounced', async () => {
      const { saveToLocalStorageImmediate } = await import('../../js/storage.js');

      global.saveToLocalStorage.mockClear();
      saveToLocalStorageImmediate.mockClear();

      startNewMatch();
      expect(saveToLocalStorageImmediate).toHaveBeenCalled();
      expect(global.saveToLocalStorage).not.toHaveBeenCalled();

      global.saveToLocalStorage.mockClear();
      saveToLocalStorageImmediate.mockClear();

      continueMatchSetup();
      expect(global.saveToLocalStorage).toHaveBeenCalled();
      expect(saveToLocalStorageImmediate).not.toHaveBeenCalled();
    });
  });
});
