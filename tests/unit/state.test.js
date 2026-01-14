// ============================================
// STATE MANAGEMENT TESTS
// ============================================
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PERFORMANCE } from '../../js/state.js';

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
