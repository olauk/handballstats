// ============================================
// STATE MANAGEMENT TESTS
// ============================================
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PERFORMANCE, APP } from '../../js/state.js';

describe('State - PERFORMANCE Cache Management', () => {
  beforeEach(() => {
    // Reset cache before each test
    PERFORMANCE.statsCache.clear();
    PERFORMANCE.cacheVersion = 0;
  });

  // UT-019: invalidateStatsCache() incrementer cacheVersion
  it('skal incrementere cacheVersion når cache invalideres', () => {
    const initialVersion = PERFORMANCE.cacheVersion;

    PERFORMANCE.invalidateStatsCache();

    expect(PERFORMANCE.cacheVersion).toBe(initialVersion + 1);
  });

  // UT-020: invalidateStatsCache() clearer statsCache
  it('skal cleare statsCache når cache invalideres', () => {
    // Legg til noen cache entries
    PERFORMANCE.statsCache.set('player-1-v0', { goals: 5 });
    PERFORMANCE.statsCache.set('player-2-v0', { goals: 3 });
    PERFORMANCE.statsCache.set('opponent-1-v0', { goals: 2 });

    expect(PERFORMANCE.statsCache.size).toBe(3);

    PERFORMANCE.invalidateStatsCache();

    expect(PERFORMANCE.statsCache.size).toBe(0);
    expect(PERFORMANCE.statsCache.has('player-1-v0')).toBe(false);
  });

  // UT-021: getCachedStats() returnerer cached value hvis exists
  it('skal returnere cached value hvis den eksisterer', () => {
    const mockCalculator = vi.fn(() => ({ goals: 10 }));

    // Første kall - skal kalle calculator
    const result1 = PERFORMANCE.getCachedStats('player-1', mockCalculator);

    expect(result1).toEqual({ goals: 10 });
    expect(mockCalculator).toHaveBeenCalledTimes(1);

    // Andre kall - skal bruke cache, IKKE kalle calculator
    const result2 = PERFORMANCE.getCachedStats('player-1', mockCalculator);

    expect(result2).toEqual({ goals: 10 });
    expect(mockCalculator).toHaveBeenCalledTimes(1); // Fortsatt kun 1 kall!
  });

  // UT-022: getCachedStats() kaller calculator ved cache miss
  it('skal kalle calculator hvis cache miss', () => {
    const mockCalculator1 = vi.fn(() => ({ goals: 5 }));
    const mockCalculator2 = vi.fn(() => ({ goals: 8 }));

    // Cache miss for 'player-1'
    const result1 = PERFORMANCE.getCachedStats('player-1', mockCalculator1);
    expect(result1).toEqual({ goals: 5 });
    expect(mockCalculator1).toHaveBeenCalledTimes(1);

    // Cache miss for 'player-2' (annen key)
    const result2 = PERFORMANCE.getCachedStats('player-2', mockCalculator2);
    expect(result2).toEqual({ goals: 8 });
    expect(mockCalculator2).toHaveBeenCalledTimes(1);

    // player-1 skal fortsatt være cached
    const result1Again = PERFORMANCE.getCachedStats('player-1', mockCalculator1);
    expect(result1Again).toEqual({ goals: 5 });
    expect(mockCalculator1).toHaveBeenCalledTimes(1); // Ingen ny beregning
  });

  // BONUS: Test cache key format med versioning
  it('skal bruke korrekt cache key format med version', () => {
    const mockCalculator = vi.fn(() => ({ goals: 3 }));

    PERFORMANCE.cacheVersion = 5;
    PERFORMANCE.getCachedStats('player-1', mockCalculator);

    // Cache key skal være 'player-1-v5'
    expect(PERFORMANCE.statsCache.has('player-1-v5')).toBe(true);
    expect(PERFORMANCE.statsCache.has('player-1-v4')).toBe(false);
  });

  // BONUS: Test at cache invalidering oppdaterer version og bryter gammel cache
  it('skal bryte gammel cache når version incrementeres', () => {
    const mockCalculator = vi.fn(() => ({ goals: 7 }));

    // Første kall med version 0
    PERFORMANCE.getCachedStats('player-1', mockCalculator);
    expect(mockCalculator).toHaveBeenCalledTimes(1);

    // Invalider cache (version → 1)
    PERFORMANCE.invalidateStatsCache();

    // Nytt kall - skal kalle calculator igjen pga ny version
    const result = PERFORMANCE.getCachedStats('player-1', mockCalculator);
    expect(result).toEqual({ goals: 7 });
    expect(mockCalculator).toHaveBeenCalledTimes(2); // Ny beregning!
  });

  // BONUS: Test memory leak protection (maxCacheSize)
  it('skal cleare cache hvis den når maxCacheSize', () => {
    const originalMaxCacheSize = PERFORMANCE.maxCacheSize;
    PERFORMANCE.maxCacheSize = 5; // Sett lav grense for testing

    const mockCalculator = vi.fn((i) => ({ goals: i }));

    // Fyll cache opp til max
    for (let i = 0; i < 5; i++) {
      PERFORMANCE.getCachedStats(`player-${i}`, () => mockCalculator(i));
    }

    expect(PERFORMANCE.statsCache.size).toBe(5);
    const versionBeforeOverflow = PERFORMANCE.cacheVersion;

    // Legg til én til - skal trigge clearing
    PERFORMANCE.getCachedStats('player-overflow', () => mockCalculator(99));

    // Cache skal være cleared og version incrementert
    expect(PERFORMANCE.statsCache.size).toBeLessThan(5);
    expect(PERFORMANCE.cacheVersion).toBe(versionBeforeOverflow + 1);

    // Restore original max size
    PERFORMANCE.maxCacheSize = originalMaxCacheSize;
  });
});

// ============================================
// NEW: Advanced Shot Registration State
// ============================================
describe('State - Advanced Shot Registration Variables', () => {
  beforeEach(() => {
    // Reset shot registration state
    APP.shotRegistrationMode = 'simple';
    APP.selectedShooter = null;
    APP.selectedAttackType = null;
    APP.selectedShotPosition = null;
    APP.selectedAssist = null;
  });

  it('skal ha shotRegistrationMode som default er "simple"', () => {
    expect(APP.shotRegistrationMode).toBe('simple');
  });

  it('skal støtte shotRegistrationMode "simple" og "detailed"', () => {
    APP.shotRegistrationMode = 'simple';
    expect(APP.shotRegistrationMode).toBe('simple');

    APP.shotRegistrationMode = 'detailed';
    expect(APP.shotRegistrationMode).toBe('detailed');
  });

  it('skal ha selectedShooter som default er null', () => {
    expect(APP.selectedShooter).toBeNull();
  });

  it('skal kunne sette selectedShooter til player ID', () => {
    APP.selectedShooter = 'player-123';
    expect(APP.selectedShooter).toBe('player-123');
  });

  it('skal ha selectedAttackType som default er null', () => {
    expect(APP.selectedAttackType).toBeNull();
  });

  it('skal støtte selectedAttackType "etablert" og "kontring"', () => {
    APP.selectedAttackType = 'etablert';
    expect(APP.selectedAttackType).toBe('etablert');

    APP.selectedAttackType = 'kontring';
    expect(APP.selectedAttackType).toBe('kontring');
  });

  it('skal ha selectedShotPosition som default er null', () => {
    expect(APP.selectedShotPosition).toBeNull();
  });

  it('skal støtte alle skuddposisjoner: 9m, 6m, 7m, ka', () => {
    const positions = ['9m', '6m', '7m', 'ka'];

    for (const position of positions) {
      APP.selectedShotPosition = position;
      expect(APP.selectedShotPosition).toBe(position);
    }
  });

  it('skal ha selectedAssist som default er null', () => {
    expect(APP.selectedAssist).toBeNull();
  });

  it('skal kunne sette selectedAssist til player ID', () => {
    APP.selectedAssist = 'player-456';
    expect(APP.selectedAssist).toBe('player-456');
  });

  it('skal støtte tom string for selectedAssist (skipped)', () => {
    APP.selectedAssist = '';
    expect(APP.selectedAssist).toBe('');
    // Empty string means "skipped", null means "not yet selected"
  });

  it('skal kunne nullstille alle advanced shot registration variabler', () => {
    // Set all to non-null values
    APP.shotRegistrationMode = 'detailed';
    APP.selectedShooter = 'player-1';
    APP.selectedAttackType = 'etablert';
    APP.selectedShotPosition = '9m';
    APP.selectedAssist = 'player-2';

    // Reset all
    APP.shotRegistrationMode = 'simple';
    APP.selectedShooter = null;
    APP.selectedAttackType = null;
    APP.selectedShotPosition = null;
    APP.selectedAssist = null;

    // Verify all reset
    expect(APP.shotRegistrationMode).toBe('simple');
    expect(APP.selectedShooter).toBeNull();
    expect(APP.selectedAttackType).toBeNull();
    expect(APP.selectedShotPosition).toBeNull();
    expect(APP.selectedAssist).toBeNull();
  });

  it('skal kunne spore en komplett detaljert skuddregistrering workflow', () => {
    // Step 1: Enable detailed mode
    APP.shotRegistrationMode = 'detailed';
    expect(APP.shotRegistrationMode).toBe('detailed');

    // Step 2: Select shooter
    APP.selectedShooter = 'player-7';
    expect(APP.selectedShooter).toBe('player-7');

    // Step 3: Select attack type
    APP.selectedAttackType = 'kontring';
    expect(APP.selectedAttackType).toBe('kontring');

    // Step 4: Select shot position
    APP.selectedShotPosition = '6m';
    expect(APP.selectedShotPosition).toBe('6m');

    // Step 5: Select assist (or skip)
    APP.selectedAssist = 'player-3';
    expect(APP.selectedAssist).toBe('player-3');

    // All variables should be set
    expect(APP.selectedShooter).toBe('player-7');
    expect(APP.selectedAttackType).toBe('kontring');
    expect(APP.selectedShotPosition).toBe('6m');
    expect(APP.selectedAssist).toBe('player-3');
  });
});

// ============================================
// NEW: Help Page State
// ============================================
describe('State - Help Page', () => {
  it('skal støtte "help" som page value', () => {
    APP.page = 'help';
    expect(APP.page).toBe('help');
  });

  it('skal ha help som en av de gyldige page values', () => {
    const validPages = [
      'login',
      'register',
      'reset-password',
      'home',
      'setup',
      'match',
      'history',
      'viewMatch',
      'teamRoster',
      'help',
    ];

    for (const page of validPages) {
      APP.page = page;
      expect(APP.page).toBe(page);
    }
  });
});
