// ============================================
// SEASON STATISTICS FUNCTIONS
// ============================================
import { APP } from './state.js';

/**
 * Calculate comprehensive statistics for a season
 * @param {string} seasonId - The ID of the season
 * @returns {Object|null} Season statistics object or null if season not found
 */
export function calculateSeasonStats(seasonId) {
  const season = APP.seasons.find((s) => s.id === seasonId);
  if (!season) {
    return null;
  }

  const seasonMatchIds = season.matches || [];
  if (seasonMatchIds.length === 0) {
    return createEmptyStats(season);
  }

  // Get all matches for this season
  const seasonMatches = APP.completedMatches.filter((m) => seasonMatchIds.includes(m.id));

  if (seasonMatches.length === 0) {
    return createEmptyStats(season);
  }

  // Aggregate all events from all matches
  const allEvents = seasonMatches.flatMap((match) => match.events || []);

  // Calculate core stats
  const totalGoals = allEvents.filter((e) => e.mode === 'attack' && e.result === 'mål').length;
  const totalGoalsAgainst = allEvents.filter((e) => e.mode === 'defense' && e.result === 'mål')
    .length;
  const totalShots = allEvents.filter((e) => e.mode === 'attack').length;
  const totalShotsAgainst = allEvents.filter((e) => e.mode === 'defense').length;

  return {
    seasonId: season.id,
    seasonName: season.name,
    matchCount: seasonMatches.length,

    // Team stats
    totalGoals,
    totalGoalsAgainst,
    goalDifference: totalGoals - totalGoalsAgainst,
    averageGoalsPerMatch: totalGoals / seasonMatches.length,
    averageGoalsAgainstPerMatch: totalGoalsAgainst / seasonMatches.length,

    // Shooting efficiency
    totalShots,
    totalShotsAgainst,
    shootingEfficiency: totalShots > 0 ? (totalGoals / totalShots) * 100 : 0,

    // Top scorers
    topScorers: calculateTopScorers(seasonMatches, allEvents),

    // Keeper stats
    keeperStats: calculateKeeperStats(seasonMatches, allEvents),

    // Attack type efficiency
    attackTypes: calculateAttackTypeEfficiency(allEvents),

    // Shot position efficiency
    shotPositions: calculateShotPositionEfficiency(allEvents),

    // Top assisters
    topAssisters: calculateTopAssisters(seasonMatches, allEvents),

    // Technical errors
    totalTechnicalErrors: allEvents.filter((e) => e.mode === 'technical').length,

    // Best and worst matches
    bestMatch: findBestMatch(seasonMatches),
    worstMatch: findWorstMatch(seasonMatches),
  };
}

/**
 * Create empty stats object for a season with no matches
 */
function createEmptyStats(season) {
  return {
    seasonId: season.id,
    seasonName: season.name,
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
  };
}

/**
 * Calculate top scorers across all matches in season
 */
function calculateTopScorers(seasonMatches, allEvents) {
  const playerGoalMap = new Map();
  const playerMatchCount = new Map();
  const playerNames = new Map();

  // Aggregate goals per player across all matches
  seasonMatches.forEach((match) => {
    const matchEvents = match.events || [];
    const playersInMatch = new Set();

    matchEvents.forEach((event) => {
      if (event.mode === 'attack' && event.player) {
        const playerId = event.player.id;
        playersInMatch.add(playerId);

        if (!playerNames.has(playerId)) {
          playerNames.set(playerId, event.player.name || `Spiller ${playerId}`);
        }

        if (event.result === 'mål') {
          playerGoalMap.set(playerId, (playerGoalMap.get(playerId) || 0) + 1);
        }
      }
    });

    // Count matches per player
    playersInMatch.forEach((playerId) => {
      playerMatchCount.set(playerId, (playerMatchCount.get(playerId) || 0) + 1);
    });
  });

  // Convert to array and sort by goals
  const scorers = Array.from(playerGoalMap.entries())
    .map(([playerId, goals]) => ({
      playerId,
      playerName: playerNames.get(playerId),
      goals,
      matches: playerMatchCount.get(playerId) || 0,
      goalsPerMatch: goals / (playerMatchCount.get(playerId) || 1),
    }))
    .sort((a, b) => b.goals - a.goals);

  return scorers.slice(0, 5); // Top 5 scorers
}

/**
 * Calculate keeper statistics
 */
function calculateKeeperStats(seasonMatches, allEvents) {
  const keeperSaveMap = new Map();
  const keeperShotMap = new Map();
  const keeperMatchCount = new Map();
  const keeperNames = new Map();

  // Aggregate saves per keeper across all matches
  seasonMatches.forEach((match) => {
    const matchEvents = match.events || [];
    const keepersInMatch = new Set();

    matchEvents.forEach((event) => {
      if (event.mode === 'defense' && event.keeper) {
        const keeperId = event.keeper.id;
        keepersInMatch.add(keeperId);

        if (!keeperNames.has(keeperId)) {
          keeperNames.set(keeperId, event.keeper.name || `Keeper ${keeperId}`);
        }

        // Count all shots against
        keeperShotMap.set(keeperId, (keeperShotMap.get(keeperId) || 0) + 1);

        // Count saves
        if (event.result === 'redning') {
          keeperSaveMap.set(keeperId, (keeperSaveMap.get(keeperId) || 0) + 1);
        }
      }
    });

    // Count matches per keeper
    keepersInMatch.forEach((keeperId) => {
      keeperMatchCount.set(keeperId, (keeperMatchCount.get(keeperId) || 0) + 1);
    });
  });

  // Convert to array and calculate percentages
  const keepers = Array.from(keeperShotMap.entries())
    .map(([keeperId, shots]) => {
      const saves = keeperSaveMap.get(keeperId) || 0;
      return {
        keeperId,
        keeperName: keeperNames.get(keeperId),
        saves,
        shots,
        savePercentage: shots > 0 ? (saves / shots) * 100 : 0,
        matches: keeperMatchCount.get(keeperId) || 0,
      };
    })
    .sort((a, b) => b.savePercentage - a.savePercentage);

  return keepers;
}

/**
 * Calculate attack type efficiency
 */
function calculateAttackTypeEfficiency(allEvents) {
  const attackEvents = allEvents.filter((e) => e.mode === 'attack');

  const etablertEvents = attackEvents.filter((e) => e.attackType === 'etablert');
  const kontringEvents = attackEvents.filter((e) => e.attackType === 'kontring');

  const etablertGoals = etablertEvents.filter((e) => e.result === 'mål').length;
  const kontringGoals = kontringEvents.filter((e) => e.result === 'mål').length;

  return {
    etablert: {
      goals: etablertGoals,
      shots: etablertEvents.length,
      efficiency: etablertEvents.length > 0 ? (etablertGoals / etablertEvents.length) * 100 : 0,
    },
    kontring: {
      goals: kontringGoals,
      shots: kontringEvents.length,
      efficiency: kontringEvents.length > 0 ? (kontringGoals / kontringEvents.length) * 100 : 0,
    },
  };
}

/**
 * Calculate shot position efficiency
 */
function calculateShotPositionEfficiency(allEvents) {
  const attackEvents = allEvents.filter((e) => e.mode === 'attack');

  const positions = ['9m', '6m', '7m', 'ka'];
  const result = {};

  positions.forEach((position) => {
    const positionEvents = attackEvents.filter((e) => e.position === position);
    const goals = positionEvents.filter((e) => e.result === 'mål').length;

    result[position] = {
      goals,
      shots: positionEvents.length,
      efficiency: positionEvents.length > 0 ? (goals / positionEvents.length) * 100 : 0,
    };
  });

  return result;
}

/**
 * Calculate top assisters
 */
function calculateTopAssisters(seasonMatches, allEvents) {
  const assistMap = new Map();
  const assistMatchCount = new Map();
  const assistNames = new Map();

  // Aggregate assists per player across all matches
  seasonMatches.forEach((match) => {
    const matchEvents = match.events || [];
    const assistersInMatch = new Set();

    matchEvents.forEach((event) => {
      if (event.mode === 'attack' && event.result === 'mål' && event.assist) {
        const assisterId = event.assist.id;
        assistersInMatch.add(assisterId);

        if (!assistNames.has(assisterId)) {
          assistNames.set(assisterId, event.assist.name || `Spiller ${assisterId}`);
        }

        assistMap.set(assisterId, (assistMap.get(assisterId) || 0) + 1);
      }
    });

    // Count matches per assister
    assistersInMatch.forEach((assisterId) => {
      assistMatchCount.set(assisterId, (assistMatchCount.get(assisterId) || 0) + 1);
    });
  });

  // Convert to array and sort by assists
  const assisters = Array.from(assistMap.entries())
    .map(([playerId, assists]) => ({
      playerId,
      playerName: assistNames.get(playerId),
      assists,
      matches: assistMatchCount.get(playerId) || 0,
      assistsPerMatch: assists / (assistMatchCount.get(playerId) || 1),
    }))
    .sort((a, b) => b.assists - a.assists);

  return assisters.slice(0, 5); // Top 5 assisters
}

/**
 * Find the best match (highest goals scored)
 */
function findBestMatch(seasonMatches) {
  if (seasonMatches.length === 0) {
    return null;
  }

  let bestMatch = null;
  let maxGoals = -1;

  seasonMatches.forEach((match) => {
    const events = match.events || [];
    const goalsFor = events.filter((e) => e.mode === 'attack' && e.result === 'mål').length;
    const goalsAgainst = events.filter((e) => e.mode === 'defense' && e.result === 'mål').length;

    if (goalsFor > maxGoals) {
      maxGoals = goalsFor;
      bestMatch = {
        matchId: match.id,
        date: match.matchDate,
        opponent: match.awayTeam,
        goalsFor,
        goalsAgainst,
      };
    }
  });

  return bestMatch;
}

/**
 * Find the worst match (lowest goals scored or biggest loss)
 */
function findWorstMatch(seasonMatches) {
  if (seasonMatches.length === 0) {
    return null;
  }

  let worstMatch = null;
  let minGoalDiff = Infinity;

  seasonMatches.forEach((match) => {
    const events = match.events || [];
    const goalsFor = events.filter((e) => e.mode === 'attack' && e.result === 'mål').length;
    const goalsAgainst = events.filter((e) => e.mode === 'defense' && e.result === 'mål').length;
    const goalDiff = goalsFor - goalsAgainst;

    if (goalDiff < minGoalDiff) {
      minGoalDiff = goalDiff;
      worstMatch = {
        matchId: match.id,
        date: match.matchDate,
        opponent: match.awayTeam,
        goalsFor,
        goalsAgainst,
      };
    }
  });

  return worstMatch;
}
