// ============================================
// STATISTICS TESTS
// ============================================
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTeamGoals, getPlayerStats, getOpponentStats } from '../../js/statistics.js';
import { createMockEvent, createMockPlayer } from '../helpers/test-utils.js';

// Mock state module
const mockCache = new Map();
vi.mock('../../js/state.js', () => ({
  getCurrentEvents: vi.fn(() => []),
  PERFORMANCE: {
    getCachedStats: vi.fn((key, calculator) => {
      if (mockCache.has(key)) {
        return mockCache.get(key);
      }
      const result = calculator();
      mockCache.set(key, result);
      return result;
    }),
    invalidateStatsCache: vi.fn(() => {
      mockCache.clear();
    }),
  },
}));

describe('Statistics - getTeamGoals', () => {
  beforeEach(async () => {
    const { getCurrentEvents } = await import('../../js/state.js');
    getCurrentEvents.mockReturnValue([]);
    mockCache.clear();
  });

  it('skal telle hjemmelag mål korrekt', async () => {
    const { getCurrentEvents } = await import('../../js/state.js');
    getCurrentEvents.mockReturnValue([
      createMockEvent({ mode: 'attack', result: 'mål' }),
      createMockEvent({ mode: 'attack', result: 'mål' }),
      createMockEvent({ mode: 'attack', result: 'redning' }),
      createMockEvent({ mode: 'defense', result: 'mål' }),
    ]);

    const goals = getTeamGoals('home');

    expect(goals).toBe(2);
  });

  it('skal telle bortelag mål korrekt', async () => {
    const { getCurrentEvents } = await import('../../js/state.js');
    getCurrentEvents.mockReturnValue([
      createMockEvent({ mode: 'defense', result: 'mål' }),
      createMockEvent({ mode: 'defense', result: 'mål' }),
      createMockEvent({ mode: 'defense', result: 'mål' }),
      createMockEvent({ mode: 'attack', result: 'mål' }),
    ]);

    const goals = getTeamGoals('away');

    expect(goals).toBe(3);
  });

  it('skal returnere 0 hvis ingen mål', async () => {
    const { getCurrentEvents } = await import('../../js/state.js');
    getCurrentEvents.mockReturnValue([
      createMockEvent({ mode: 'attack', result: 'redning' }),
      createMockEvent({ mode: 'attack', result: 'utenfor' }),
    ]);

    const homeGoals = getTeamGoals('home');
    const awayGoals = getTeamGoals('away');

    expect(homeGoals).toBe(0);
    expect(awayGoals).toBe(0);
  });

  it('skal returnere 0 hvis ingen events', () => {
    const goals = getTeamGoals('home');
    expect(goals).toBe(0);
  });
});

describe('Statistics - getPlayerStats', () => {
  let player;

  beforeEach(async () => {
    const { getCurrentEvents } = await import('../../js/state.js');
    getCurrentEvents.mockReturnValue([]);
    mockCache.clear();
    player = createMockPlayer({ id: 'player1' });
  });

  it('skal beregne spillerstatistikk korrekt', async () => {
    const { getCurrentEvents } = await import('../../js/state.js');
    getCurrentEvents.mockReturnValue([
      createMockEvent({ player: player, result: 'mål', mode: 'attack', half: 1 }),
      createMockEvent({ player: player, result: 'mål', mode: 'attack', half: 1 }),
      createMockEvent({ player: player, result: 'redning', mode: 'attack', half: 1 }),
      createMockEvent({ player: player, result: 'utenfor', mode: 'attack', half: 1 }),
    ]);

    const stats = getPlayerStats(player.id);

    expect(stats.goals).toBe(2);
    expect(stats.saved).toBe(1);
    expect(stats.outside).toBe(1);
    expect(stats.technical).toBe(0);
  });

  it('skal filtrere på omgang', async () => {
    const { getCurrentEvents } = await import('../../js/state.js');
    getCurrentEvents.mockReturnValue([
      createMockEvent({ player: player, result: 'mål', mode: 'attack', half: 1 }),
      createMockEvent({ player: player, result: 'mål', mode: 'attack', half: 2 }),
      createMockEvent({ player: player, result: 'mål', mode: 'attack', half: 2 }),
    ]);

    const statsHalf1 = getPlayerStats(player.id, 1);
    const statsHalf2 = getPlayerStats(player.id, 2);

    expect(statsHalf1.goals).toBe(1);
    expect(statsHalf2.goals).toBe(2);
  });

  it('skal telle tekniske feil', async () => {
    const { getCurrentEvents } = await import('../../js/state.js');
    getCurrentEvents.mockReturnValue([
      createMockEvent({ player: player, mode: 'technical', result: 'teknisk feil', half: 1 }),
      createMockEvent({ player: player, mode: 'technical', result: 'teknisk feil', half: 1 }),
    ]);

    const stats = getPlayerStats(player.id);

    expect(stats.technical).toBe(2);
  });

  it('skal returnere 0 for alle stats hvis spiller ikke har events', async () => {
    const { getCurrentEvents } = await import('../../js/state.js');
    getCurrentEvents.mockReturnValue([
      createMockEvent({ player: createMockPlayer({ id: 'other' }), result: 'mål', mode: 'attack' }),
    ]);

    const stats = getPlayerStats(player.id);

    expect(stats.goals).toBe(0);
    expect(stats.saved).toBe(0);
    expect(stats.outside).toBe(0);
    expect(stats.technical).toBe(0);
  });

  it('skal kun telle attack events, ikke defense', async () => {
    const { getCurrentEvents } = await import('../../js/state.js');
    getCurrentEvents.mockReturnValue([
      createMockEvent({ player: player, result: 'mål', mode: 'attack' }),
      createMockEvent({ player: player, result: 'mål', mode: 'defense' }), // Skal ikke telles
    ]);

    const stats = getPlayerStats(player.id);

    expect(stats.goals).toBe(1);
  });

  it('skal bruke cache for å unngå re-kalkulering', async () => {
    const { getCurrentEvents } = await import('../../js/state.js');
    getCurrentEvents.mockReturnValue([
      createMockEvent({ player: player, result: 'mål', mode: 'attack' }),
    ]);

    // First call
    const stats1 = getPlayerStats(player.id);
    // Second call - should use cache
    const stats2 = getPlayerStats(player.id);

    expect(stats1).toEqual(stats2);
    expect(stats1.goals).toBe(1);
  });
});

describe('Statistics - getOpponentStats', () => {
  let opponent;

  beforeEach(async () => {
    const { getCurrentEvents } = await import('../../js/state.js');
    getCurrentEvents.mockReturnValue([]);
    mockCache.clear();
    opponent = createMockPlayer({ id: 'opp1' });
  });

  it('skal beregne motstanderstatistikk korrekt', async () => {
    const { getCurrentEvents } = await import('../../js/state.js');
    getCurrentEvents.mockReturnValue([
      createMockEvent({ opponent: opponent, result: 'mål', mode: 'defense', half: 1 }),
      createMockEvent({ opponent: opponent, result: 'mål', mode: 'defense', half: 1 }),
      createMockEvent({ opponent: opponent, result: 'redning', mode: 'defense', half: 1 }),
    ]);

    const stats = getOpponentStats(opponent.id);

    expect(stats.goals).toBe(2);
    expect(stats.saved).toBe(1);
    expect(stats.shots).toHaveLength(3);
  });

  it('skal filtrere på omgang', async () => {
    const { getCurrentEvents } = await import('../../js/state.js');
    getCurrentEvents.mockReturnValue([
      createMockEvent({ opponent: opponent, result: 'mål', mode: 'defense', half: 1 }),
      createMockEvent({ opponent: opponent, result: 'mål', mode: 'defense', half: 2 }),
    ]);

    const statsHalf1 = getOpponentStats(opponent.id, 1);
    const statsHalf2 = getOpponentStats(opponent.id, 2);

    expect(statsHalf1.goals).toBe(1);
    expect(statsHalf2.goals).toBe(1);
  });

  it('skal kun telle defense events, ikke attack', async () => {
    const { getCurrentEvents } = await import('../../js/state.js');
    getCurrentEvents.mockReturnValue([
      createMockEvent({ opponent: opponent, result: 'mål', mode: 'defense' }),
      createMockEvent({ opponent: opponent, result: 'mål', mode: 'attack' }), // Skal ikke telles
    ]);

    const stats = getOpponentStats(opponent.id);

    expect(stats.goals).toBe(1);
  });

  it('skal returnere 0 hvis motstander ikke har events', () => {
    const stats = getOpponentStats(opponent.id);

    expect(stats.goals).toBe(0);
    expect(stats.saved).toBe(0);
    expect(stats.shots).toHaveLength(0);
  });

  it('skal bruke cache for ytelse', async () => {
    const { getCurrentEvents } = await import('../../js/state.js');
    getCurrentEvents.mockReturnValue([
      createMockEvent({ opponent: opponent, result: 'mål', mode: 'defense' }),
    ]);

    const stats1 = getOpponentStats(opponent.id);
    const stats2 = getOpponentStats(opponent.id);

    expect(stats1).toEqual(stats2);
    expect(stats1.goals).toBe(1);
  });
});
