// ============================================
// SEASON STATISTICS TESTS
// ============================================
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateSeasonStats } from '../../js/season-statistics.js';

// Mock state module with inline mock object
vi.mock('../../js/state.js', () => ({
  APP: {
    seasons: [],
    completedMatches: [],
  },
}));

describe('Season Statistics - calculateSeasonStats', () => {
  let APP;

  beforeEach(async () => {
    // Import mocked APP and reset state
    const stateModule = await import('../../js/state.js');
    APP = stateModule.APP;
    APP.seasons = [];
    APP.completedMatches = [];
  });

  it('skal returnere null hvis sesong ikke finnes', () => {
    const stats = calculateSeasonStats('non-existent-season');
    expect(stats).toBeNull();
  });

  it('skal returnere tom statistikk for sesong uten kamper', () => {
    APP.seasons = [
      {
        id: 'season_1',
        name: 'Sesong 2024',
        matches: [],
      },
    ];

    const stats = calculateSeasonStats('season_1');

    expect(stats).toEqual({
      seasonId: 'season_1',
      seasonName: 'Sesong 2024',
      matchCount: 0,
      totalGoals: 0,
      totalGoalsAgainst: 0,
      goalDifference: 0,
      averageGoalsPerMatch: 0,
      averageGoalsAgainstPerMatch: 0,
      totalShots: 0,
      totalShotsAgainst: 0,
      shootingEfficiency: 0,
      topScorers: [],
      keeperStats: [],
      attackTypes: {
        etablert: { goals: 0, shots: 0, efficiency: 0 },
        kontring: { goals: 0, shots: 0, efficiency: 0 },
      },
      shotPositions: {
        '9m': { goals: 0, shots: 0, efficiency: 0 },
        '6m': { goals: 0, shots: 0, efficiency: 0 },
        '7m': { goals: 0, shots: 0, efficiency: 0 },
        ka: { goals: 0, shots: 0, efficiency: 0 },
      },
      topAssisters: [],
      totalTechnicalErrors: 0,
      bestMatch: null,
      worstMatch: null,
    });
  });

  it('skal beregne grunnleggende kampstatistikk korrekt', () => {
    APP.seasons = [
      {
        id: 'season_1',
        name: 'Sesong 2024',
        matches: [1, 2],
      },
    ];

    APP.completedMatches = [
      {
        id: 1,
        matchDate: '2024-01-15',
        homeTeam: 'Lag A',
        awayTeam: 'Lag B',
        events: [
          { mode: 'attack', result: 'mål', player: { id: 1, name: 'Spiller 1' } },
          { mode: 'attack', result: 'mål', player: { id: 1, name: 'Spiller 1' } },
          { mode: 'attack', result: 'redning', player: { id: 2, name: 'Spiller 2' } },
          { mode: 'defense', result: 'mål', opponent: { id: 10 } },
        ],
      },
      {
        id: 2,
        matchDate: '2024-01-20',
        homeTeam: 'Lag A',
        awayTeam: 'Lag C',
        events: [
          { mode: 'attack', result: 'mål', player: { id: 1, name: 'Spiller 1' } },
          { mode: 'defense', result: 'mål', opponent: { id: 11 } },
          { mode: 'defense', result: 'mål', opponent: { id: 11 } },
        ],
      },
    ];

    const stats = calculateSeasonStats('season_1');

    expect(stats.matchCount).toBe(2);
    expect(stats.totalGoals).toBe(3);
    expect(stats.totalGoalsAgainst).toBe(3);
    expect(stats.goalDifference).toBe(0);
    expect(stats.averageGoalsPerMatch).toBe(1.5);
    expect(stats.averageGoalsAgainstPerMatch).toBe(1.5);
  });

  it('skal beregne skuddeffektivitet korrekt', () => {
    APP.seasons = [
      {
        id: 'season_1',
        name: 'Sesong 2024',
        matches: [1],
      },
    ];

    APP.completedMatches = [
      {
        id: 1,
        matchDate: '2024-01-15',
        homeTeam: 'Lag A',
        awayTeam: 'Lag B',
        events: [
          { mode: 'attack', result: 'mål', player: { id: 1 } },
          { mode: 'attack', result: 'mål', player: { id: 1 } },
          { mode: 'attack', result: 'redning', player: { id: 1 } },
          { mode: 'attack', result: 'utenfor', player: { id: 1 } },
        ],
      },
    ];

    const stats = calculateSeasonStats('season_1');

    expect(stats.totalShots).toBe(4);
    expect(stats.shootingEfficiency).toBe(50); // 2 mål av 4 skudd = 50%
  });

  it('skal finne toppscorere korrekt', () => {
    APP.seasons = [
      {
        id: 'season_1',
        name: 'Sesong 2024',
        matches: [1],
      },
    ];

    APP.completedMatches = [
      {
        id: 1,
        matchDate: '2024-01-15',
        events: [
          { mode: 'attack', result: 'mål', player: { id: 1, name: 'Spiller 1' } },
          { mode: 'attack', result: 'mål', player: { id: 1, name: 'Spiller 1' } },
          { mode: 'attack', result: 'mål', player: { id: 1, name: 'Spiller 1' } },
          { mode: 'attack', result: 'mål', player: { id: 2, name: 'Spiller 2' } },
          { mode: 'attack', result: 'mål', player: { id: 3, name: 'Spiller 3' } },
          { mode: 'attack', result: 'mål', player: { id: 3, name: 'Spiller 3' } },
        ],
      },
    ];

    const stats = calculateSeasonStats('season_1');

    expect(stats.topScorers).toHaveLength(3);
    expect(stats.topScorers[0]).toEqual({
      playerId: 1,
      playerName: 'Spiller 1',
      goals: 3,
      matches: 1,
      goalsPerMatch: 3,
    });
    expect(stats.topScorers[1]).toEqual({
      playerId: 3,
      playerName: 'Spiller 3',
      goals: 2,
      matches: 1,
      goalsPerMatch: 2,
    });
    expect(stats.topScorers[2]).toEqual({
      playerId: 2,
      playerName: 'Spiller 2',
      goals: 1,
      matches: 1,
      goalsPerMatch: 1,
    });
  });

  it('skal begrense toppscorere til topp 5', () => {
    APP.seasons = [
      {
        id: 'season_1',
        name: 'Sesong 2024',
        matches: [1],
      },
    ];

    APP.completedMatches = [
      {
        id: 1,
        matchDate: '2024-01-15',
        events: [
          { mode: 'attack', result: 'mål', player: { id: 1, name: 'Spiller 1' } },
          { mode: 'attack', result: 'mål', player: { id: 2, name: 'Spiller 2' } },
          { mode: 'attack', result: 'mål', player: { id: 3, name: 'Spiller 3' } },
          { mode: 'attack', result: 'mål', player: { id: 4, name: 'Spiller 4' } },
          { mode: 'attack', result: 'mål', player: { id: 5, name: 'Spiller 5' } },
          { mode: 'attack', result: 'mål', player: { id: 6, name: 'Spiller 6' } },
          { mode: 'attack', result: 'mål', player: { id: 7, name: 'Spiller 7' } },
        ],
      },
    ];

    const stats = calculateSeasonStats('season_1');

    expect(stats.topScorers).toHaveLength(5);
  });

  it('skal beregne keeperstatistikk korrekt', () => {
    APP.seasons = [
      {
        id: 'season_1',
        name: 'Sesong 2024',
        matches: [1],
      },
    ];

    APP.completedMatches = [
      {
        id: 1,
        matchDate: '2024-01-15',
        events: [
          { mode: 'defense', result: 'redning', keeper: { id: 1, name: 'Keeper 1' } },
          { mode: 'defense', result: 'redning', keeper: { id: 1, name: 'Keeper 1' } },
          { mode: 'defense', result: 'mål', keeper: { id: 1, name: 'Keeper 1' } },
          { mode: 'defense', result: 'mål', keeper: { id: 1, name: 'Keeper 1' } },
        ],
      },
    ];

    const stats = calculateSeasonStats('season_1');

    expect(stats.keeperStats).toHaveLength(1);
    expect(stats.keeperStats[0]).toEqual({
      keeperId: 1,
      keeperName: 'Keeper 1',
      saves: 2,
      shots: 4,
      savePercentage: 50,
      matches: 1,
    });
  });

  it('skal beregne angrepstypeeffektivitet korrekt', () => {
    APP.seasons = [
      {
        id: 'season_1',
        name: 'Sesong 2024',
        matches: [1],
      },
    ];

    APP.completedMatches = [
      {
        id: 1,
        matchDate: '2024-01-15',
        events: [
          {
            mode: 'attack',
            result: 'mål',
            attackType: 'etablert',
            player: { id: 1 },
          },
          {
            mode: 'attack',
            result: 'redning',
            attackType: 'etablert',
            player: { id: 1 },
          },
          {
            mode: 'attack',
            result: 'mål',
            attackType: 'kontring',
            player: { id: 1 },
          },
          {
            mode: 'attack',
            result: 'mål',
            attackType: 'kontring',
            player: { id: 1 },
          },
        ],
      },
    ];

    const stats = calculateSeasonStats('season_1');

    expect(stats.attackTypes.etablert).toEqual({
      goals: 1,
      shots: 2,
      efficiency: 50,
    });
    expect(stats.attackTypes.kontring).toEqual({
      goals: 2,
      shots: 2,
      efficiency: 100,
    });
  });

  it('skal beregne skuddposisjonseffektivitet korrekt', () => {
    APP.seasons = [
      {
        id: 'season_1',
        name: 'Sesong 2024',
        matches: [1],
      },
    ];

    APP.completedMatches = [
      {
        id: 1,
        matchDate: '2024-01-15',
        events: [
          { mode: 'attack', result: 'mål', position: '9m', player: { id: 1 } },
          { mode: 'attack', result: 'redning', position: '9m', player: { id: 1 } },
          { mode: 'attack', result: 'mål', position: '6m', player: { id: 1 } },
          { mode: 'attack', result: 'mål', position: '7m', player: { id: 1 } },
        ],
      },
    ];

    const stats = calculateSeasonStats('season_1');

    expect(stats.shotPositions['9m']).toEqual({
      goals: 1,
      shots: 2,
      efficiency: 50,
    });
    expect(stats.shotPositions['6m']).toEqual({
      goals: 1,
      shots: 1,
      efficiency: 100,
    });
    expect(stats.shotPositions['7m']).toEqual({
      goals: 1,
      shots: 1,
      efficiency: 100,
    });
    expect(stats.shotPositions['ka']).toEqual({
      goals: 0,
      shots: 0,
      efficiency: 0,
    });
  });

  it('skal finne topp assistere korrekt', () => {
    APP.seasons = [
      {
        id: 'season_1',
        name: 'Sesong 2024',
        matches: [1],
      },
    ];

    APP.completedMatches = [
      {
        id: 1,
        matchDate: '2024-01-15',
        events: [
          {
            mode: 'attack',
            result: 'mål',
            player: { id: 1 },
            assist: { id: 2, name: 'Assist 1' },
          },
          {
            mode: 'attack',
            result: 'mål',
            player: { id: 1 },
            assist: { id: 2, name: 'Assist 1' },
          },
          {
            mode: 'attack',
            result: 'mål',
            player: { id: 1 },
            assist: { id: 3, name: 'Assist 2' },
          },
        ],
      },
    ];

    const stats = calculateSeasonStats('season_1');

    expect(stats.topAssisters).toHaveLength(2);
    expect(stats.topAssisters[0]).toEqual({
      playerId: 2,
      playerName: 'Assist 1',
      assists: 2,
      matches: 1,
      assistsPerMatch: 2,
    });
    expect(stats.topAssisters[1]).toEqual({
      playerId: 3,
      playerName: 'Assist 2',
      assists: 1,
      matches: 1,
      assistsPerMatch: 1,
    });
  });

  it('skal begrense topp assistere til topp 5', () => {
    APP.seasons = [
      {
        id: 'season_1',
        name: 'Sesong 2024',
        matches: [1],
      },
    ];

    APP.completedMatches = [
      {
        id: 1,
        matchDate: '2024-01-15',
        events: [
          { mode: 'attack', result: 'mål', player: { id: 1 }, assist: { id: 2, name: 'A1' } },
          { mode: 'attack', result: 'mål', player: { id: 1 }, assist: { id: 3, name: 'A2' } },
          { mode: 'attack', result: 'mål', player: { id: 1 }, assist: { id: 4, name: 'A3' } },
          { mode: 'attack', result: 'mål', player: { id: 1 }, assist: { id: 5, name: 'A4' } },
          { mode: 'attack', result: 'mål', player: { id: 1 }, assist: { id: 6, name: 'A5' } },
          { mode: 'attack', result: 'mål', player: { id: 1 }, assist: { id: 7, name: 'A6' } },
        ],
      },
    ];

    const stats = calculateSeasonStats('season_1');

    expect(stats.topAssisters).toHaveLength(5);
  });

  it('skal telle tekniske feil korrekt', () => {
    APP.seasons = [
      {
        id: 'season_1',
        name: 'Sesong 2024',
        matches: [1],
      },
    ];

    APP.completedMatches = [
      {
        id: 1,
        matchDate: '2024-01-15',
        events: [
          { mode: 'technical', player: { id: 1 } },
          { mode: 'technical', player: { id: 2 } },
          { mode: 'attack', result: 'mål', player: { id: 1 } },
        ],
      },
    ];

    const stats = calculateSeasonStats('season_1');

    expect(stats.totalTechnicalErrors).toBe(2);
  });

  it('skal finne beste kamp (flest mål) korrekt', () => {
    APP.seasons = [
      {
        id: 'season_1',
        name: 'Sesong 2024',
        matches: [1, 2, 3],
      },
    ];

    APP.completedMatches = [
      {
        id: 1,
        matchDate: '2024-01-15',
        awayTeam: 'Lag B',
        events: [
          { mode: 'attack', result: 'mål', player: { id: 1 } },
          { mode: 'attack', result: 'mål', player: { id: 1 } },
        ],
      },
      {
        id: 2,
        matchDate: '2024-01-20',
        awayTeam: 'Lag C',
        events: [
          { mode: 'attack', result: 'mål', player: { id: 1 } },
          { mode: 'attack', result: 'mål', player: { id: 1 } },
          { mode: 'attack', result: 'mål', player: { id: 1 } },
          { mode: 'attack', result: 'mål', player: { id: 1 } },
          { mode: 'attack', result: 'mål', player: { id: 1 } },
        ],
      },
      {
        id: 3,
        matchDate: '2024-01-25',
        awayTeam: 'Lag D',
        events: [{ mode: 'attack', result: 'mål', player: { id: 1 } }],
      },
    ];

    const stats = calculateSeasonStats('season_1');

    expect(stats.bestMatch).toEqual({
      matchId: 2,
      date: '2024-01-20',
      opponent: 'Lag C',
      goalsFor: 5,
      goalsAgainst: 0,
    });
  });

  it('skal finne verste kamp (størst tap) korrekt', () => {
    APP.seasons = [
      {
        id: 'season_1',
        name: 'Sesong 2024',
        matches: [1, 2, 3],
      },
    ];

    APP.completedMatches = [
      {
        id: 1,
        matchDate: '2024-01-15',
        awayTeam: 'Lag B',
        events: [
          { mode: 'attack', result: 'mål', player: { id: 1 } },
          { mode: 'defense', result: 'mål', opponent: { id: 10 } },
        ],
      },
      {
        id: 2,
        matchDate: '2024-01-20',
        awayTeam: 'Lag C',
        events: [
          { mode: 'attack', result: 'mål', player: { id: 1 } },
          { mode: 'defense', result: 'mål', opponent: { id: 10 } },
          { mode: 'defense', result: 'mål', opponent: { id: 10 } },
          { mode: 'defense', result: 'mål', opponent: { id: 10 } },
        ],
      },
      {
        id: 3,
        matchDate: '2024-01-25',
        awayTeam: 'Lag D',
        events: [
          { mode: 'attack', result: 'mål', player: { id: 1 } },
          { mode: 'attack', result: 'mål', player: { id: 1 } },
          { mode: 'defense', result: 'mål', opponent: { id: 10 } },
        ],
      },
    ];

    const stats = calculateSeasonStats('season_1');

    expect(stats.worstMatch).toEqual({
      matchId: 2,
      date: '2024-01-20',
      opponent: 'Lag C',
      goalsFor: 1,
      goalsAgainst: 3,
    });
  });

  it('skal håndtere sesong med kamper som mangler i completedMatches', () => {
    APP.seasons = [
      {
        id: 'season_1',
        name: 'Sesong 2024',
        matches: [1, 2, 999], // 999 finnes ikke
      },
    ];

    APP.completedMatches = [
      {
        id: 1,
        matchDate: '2024-01-15',
        events: [{ mode: 'attack', result: 'mål', player: { id: 1 } }],
      },
      {
        id: 2,
        matchDate: '2024-01-20',
        events: [{ mode: 'attack', result: 'mål', player: { id: 1 } }],
      },
    ];

    const stats = calculateSeasonStats('season_1');

    expect(stats.matchCount).toBe(2); // Skal kun telle kamper som finnes
    expect(stats.totalGoals).toBe(2);
  });

  it('skal beregne mål per kamp over flere kamper korrekt', () => {
    APP.seasons = [
      {
        id: 'season_1',
        name: 'Sesong 2024',
        matches: [1, 2],
      },
    ];

    APP.completedMatches = [
      {
        id: 1,
        matchDate: '2024-01-15',
        events: [
          { mode: 'attack', result: 'mål', player: { id: 1, name: 'Spiller 1' } },
          { mode: 'attack', result: 'mål', player: { id: 1, name: 'Spiller 1' } },
          { mode: 'attack', result: 'mål', player: { id: 1, name: 'Spiller 1' } },
        ],
      },
      {
        id: 2,
        matchDate: '2024-01-20',
        events: [
          { mode: 'attack', result: 'mål', player: { id: 1, name: 'Spiller 1' } },
          { mode: 'attack', result: 'mål', player: { id: 2, name: 'Spiller 2' } },
        ],
      },
    ];

    const stats = calculateSeasonStats('season_1');

    expect(stats.topScorers[0].goalsPerMatch).toBe(2); // 4 mål / 2 kamper
    expect(stats.topScorers[1].goalsPerMatch).toBe(1); // 1 mål / 1 kamp
  });
});
