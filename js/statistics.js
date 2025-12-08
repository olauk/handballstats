// ============================================
// STATISTICS FUNCTIONS
// ============================================
import { PERFORMANCE, getCurrentEvents } from './state.js';

export function getTeamGoals(team = 'home') {
    const events = getCurrentEvents();
    if (team === 'home') {
        return events.filter(e => e.mode === 'attack' && e.result === 'mål').length;
    } else {
        return events.filter(e => e.mode === 'defense' && e.result === 'mål').length;
    }
}

export function getPlayerStats(playerId, half = null) {
    // Bruk cache for å unngå å re-kalkulere statistikk ved hver render
    return PERFORMANCE.getCachedStats(`player-${playerId}-${half}`, () => {
        const events = getCurrentEvents();
        const playerEvents = events.filter(e =>
            e.player?.id === playerId &&
            (half === null || e.half === half) &&
            e.mode === 'attack'
        );
        return {
            goals: playerEvents.filter(e => e.result === 'mål').length,
            saved: playerEvents.filter(e => e.result === 'redning').length,
            outside: playerEvents.filter(e => e.result === 'utenfor').length,
            technical: events.filter(e => e.player?.id === playerId && e.mode === 'technical' && (half === null || e.half === half)).length
        };
    });
}

export function getOpponentStats(opponentId, half = null) {
    // Bruk cache for å unngå å re-kalkulere statistikk ved hver render
    return PERFORMANCE.getCachedStats(`opponent-${opponentId}-${half}`, () => {
        const events = getCurrentEvents();
        const opponentEvents = events.filter(e =>
            e.opponent?.id === opponentId &&
            (half === null || e.half === half) &&
            e.mode === 'defense'
        );
        return {
            goals: opponentEvents.filter(e => e.result === 'mål').length,
            saved: opponentEvents.filter(e => e.result === 'redning').length,
            shots: opponentEvents
        };
    });
}
