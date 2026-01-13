// ============================================
// GAME FLOW INTEGRATION TESTS
// ============================================
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleGoalClick, registerShot } from '../../js/shots.js';
import { getTeamGoals, getPlayerStats } from '../../js/statistics.js';
import {
  createMockAppState,
  createMockElement,
  createMockClickEvent,
  createMockPlayer,
} from '../helpers/test-utils.js';

// Mock dependencies
vi.mock('../../js/state.js', () => {
  const cache = new Map();
  const state = {
    mode: 'attack',
    currentHalf: 1,
    matchMode: 'simple',
    players: [],
    opponents: [],
    events: [],
    tempShot: null,
    selectedResult: null,
    activeKeeper: null,
    timerConfig: { halfLength: 30 },
  };

  return {
    APP: state,
    PERFORMANCE: {
      getCachedStats: vi.fn((key, calculator) => {
        if (cache.has(key)) {
          return cache.get(key);
        }
        const result = calculator();
        cache.set(key, result);
        return result;
      }),
      invalidateStatsCache: vi.fn(() => {
        cache.clear();
      }),
    },
    getCurrentEvents: vi.fn(() => state.events),
  };
});

vi.mock('../../js/storage.js', () => ({
  saveToLocalStorage: vi.fn(),
}));

vi.mock('../../js/debug-logger.js', () => ({
  logShotEvent: vi.fn(),
  logAppEvent: vi.fn(),
}));

vi.mock('../../js/timer.js', () => ({
  getCurrentTimerTime: vi.fn(() => ({ minutes: 0, seconds: 0 })),
}));

vi.mock('../../js/ui/event-feed.js', () => ({
  updateEventFeed: vi.fn(),
}));

describe('Game Flow Integration Tests', () => {
  let mockGoalArea;
  let mockGoalContainer;
  let mockCloseModal;
  let mockUpdateGoalVisualization;
  let mockUpdateStatisticsOnly;

  beforeEach(async () => {
    // Reset APP state
    const { APP, PERFORMANCE } = await import('../../js/state.js');
    Object.assign(APP, createMockAppState());
    PERFORMANCE.invalidateStatsCache();

    // Reset mock functions
    mockCloseModal = vi.fn();
    mockUpdateGoalVisualization = vi.fn();
    mockUpdateStatisticsOnly = vi.fn();

    // Setup DOM
    mockGoalArea = createMockElement({ width: 300, height: 200, left: 50, top: 50 });
    mockGoalArea.id = 'goalArea';
    mockGoalContainer = createMockElement({ width: 400, height: 300, left: 0, top: 0 });
    mockGoalContainer.id = 'goalContainer';

    document.body.innerHTML = '';
    document.body.appendChild(mockGoalContainer);
    mockGoalContainer.appendChild(mockGoalArea);
  });

  it('skal fullføre komplett scoringsflyt: klikk -> registrer -> statistikk', async () => {
    const { APP, getCurrentEvents } = await import('../../js/state.js');

    const player = APP.players[0];
    getCurrentEvents.mockReturnValue(APP.events);

    // Steg 1: Klikk på mål
    const clickEvent = createMockClickEvent({
      clientX: 200,
      clientY: 150,
      target: mockGoalArea,
    });

    const clickResult = handleGoalClick(clickEvent);
    expect(clickResult).toBe(true);
    expect(APP.tempShot).toBeDefined();

    // Steg 2: Velg resultat
    APP.selectedResult = 'mål';

    // Steg 3: Registrer skudd
    const registerResult = registerShot(
      player.id,
      mockCloseModal,
      mockUpdateGoalVisualization,
      mockUpdateStatisticsOnly
    );

    expect(registerResult).toBe(true);
    expect(APP.events).toHaveLength(1);

    // Steg 4: Verifiser statistikk
    const teamGoals = getTeamGoals('home');
    const playerStats = getPlayerStats(player.id);

    expect(teamGoals).toBe(1);
    expect(playerStats.goals).toBe(1);
    expect(playerStats.saved).toBe(0);
  });

  it('skal håndtere flere skudd i samme kamp', async () => {
    const { APP, getCurrentEvents } = await import('../../js/state.js');

    const player1 = APP.players[0];
    const player2 = APP.players[1];
    getCurrentEvents.mockImplementation(() => APP.events);

    // Skudd 1: Player 1 scorer
    APP.tempShot = { x: 50, y: 50, zone: 'goal' };
    APP.selectedResult = 'mål';
    registerShot(player1.id, mockCloseModal, mockUpdateGoalVisualization, mockUpdateStatisticsOnly);

    // Skudd 2: Player 2 reddes
    APP.tempShot = { x: 30, y: 40, zone: 'goal' };
    APP.selectedResult = 'redning';
    registerShot(player2.id, mockCloseModal, mockUpdateGoalVisualization, mockUpdateStatisticsOnly);

    // Skudd 3: Player 1 scorer igjen
    APP.tempShot = { x: 60, y: 60, zone: 'goal' };
    APP.selectedResult = 'mål';
    registerShot(player1.id, mockCloseModal, mockUpdateGoalVisualization, mockUpdateStatisticsOnly);

    // Verifiser
    expect(APP.events).toHaveLength(3);
    expect(getTeamGoals('home')).toBe(2);
    expect(getPlayerStats(player1.id).goals).toBe(2);
    expect(getPlayerStats(player2.id).goals).toBe(0);
    expect(getPlayerStats(player2.id).saved).toBe(1);
  });

  it('skal håndtere angrep og forsvar i samme kamp', async () => {
    const { APP, getCurrentEvents } = await import('../../js/state.js');

    const homePlayer = APP.players[0];
    const opponent = APP.opponents[0];
    const keeper = createMockPlayer({ id: 'keeper1', isKeeper: true });
    getCurrentEvents.mockImplementation(() => APP.events);

    // Hjemmelag scorer
    APP.mode = 'attack';
    APP.tempShot = { x: 50, y: 50, zone: 'goal' };
    APP.selectedResult = 'mål';
    registerShot(homePlayer.id, mockCloseModal, mockUpdateGoalVisualization, mockUpdateStatisticsOnly);

    // Bortelag scorer
    APP.mode = 'defense';
    APP.activeKeeper = keeper;
    APP.tempShot = { x: 30, y: 30, zone: 'goal' };
    APP.selectedResult = 'mål';
    registerShot(opponent.id, mockCloseModal, mockUpdateGoalVisualization, mockUpdateStatisticsOnly);

    // Verifiser
    expect(APP.events).toHaveLength(2);
    expect(getTeamGoals('home')).toBe(1);
    expect(getTeamGoals('away')).toBe(1);
  });

  it('skal invalidere cache når nye events legges til', async () => {
    const { APP, PERFORMANCE, getCurrentEvents } = await import('../../js/state.js');

    const player = APP.players[0];
    getCurrentEvents.mockImplementation(() => APP.events);

    // Første skudd
    APP.tempShot = { x: 50, y: 50, zone: 'goal' };
    APP.selectedResult = 'mål';
    registerShot(player.id, mockCloseModal, mockUpdateGoalVisualization, mockUpdateStatisticsOnly);

    expect(PERFORMANCE.invalidateStatsCache).toHaveBeenCalled();

    // Andre skudd
    vi.clearAllMocks();
    APP.tempShot = { x: 40, y: 40, zone: 'goal' };
    APP.selectedResult = 'mål';
    registerShot(player.id, mockCloseModal, mockUpdateGoalVisualization, mockUpdateStatisticsOnly);

    expect(PERFORMANCE.invalidateStatsCache).toHaveBeenCalled();
  });

  it('skal håndtere omgangsskifte korrekt', async () => {
    const { APP, getCurrentEvents } = await import('../../js/state.js');

    const player = APP.players[0];
    getCurrentEvents.mockImplementation(() => APP.events);

    // Første omgang
    APP.currentHalf = 1;
    APP.tempShot = { x: 50, y: 50, zone: 'goal' };
    APP.selectedResult = 'mål';
    registerShot(player.id, mockCloseModal, mockUpdateGoalVisualization, mockUpdateStatisticsOnly);

    // Andre omgang
    APP.currentHalf = 2;
    APP.tempShot = { x: 60, y: 60, zone: 'goal' };
    APP.selectedResult = 'mål';
    registerShot(player.id, mockCloseModal, mockUpdateGoalVisualization, mockUpdateStatisticsOnly);

    // Verifiser statistikk per omgang
    const statsHalf1 = getPlayerStats(player.id, 1);
    const statsHalf2 = getPlayerStats(player.id, 2);
    const statsTotal = getPlayerStats(player.id);

    expect(statsHalf1.goals).toBe(1);
    expect(statsHalf2.goals).toBe(1);
    expect(statsTotal.goals).toBe(2);
  });

  it('skal håndtere skudd utenfor mål', async () => {
    const { APP, getCurrentEvents } = await import('../../js/state.js');

    const player = APP.players[0];
    getCurrentEvents.mockImplementation(() => APP.events);

    // Klikk utenfor mål
    const clickEvent = createMockClickEvent({
      clientX: 10,
      clientY: 10,
      target: mockGoalContainer,
    });

    handleGoalClick(clickEvent);
    expect(APP.tempShot.zone).toBe('outside');

    // Registrer skudd utenfor (ingen resultat-valg nødvendig)
    const result = registerShot(
      player.id,
      mockCloseModal,
      mockUpdateGoalVisualization,
      mockUpdateStatisticsOnly
    );

    expect(result).toBe(true);
    expect(APP.events[0].result).toBe('utenfor');
    expect(getPlayerStats(player.id).outside).toBe(1);
  });

  it('skal kalle alle callback-funksjoner ved vellykket registrering', async () => {
    const { APP, getCurrentEvents } = await import('../../js/state.js');
    const { saveToLocalStorage } = await import('../../js/storage.js');

    const player = APP.players[0];
    getCurrentEvents.mockImplementation(() => APP.events);

    APP.tempShot = { x: 50, y: 50, zone: 'goal' };
    APP.selectedResult = 'mål';

    registerShot(player.id, mockCloseModal, mockUpdateGoalVisualization, mockUpdateStatisticsOnly);

    expect(mockCloseModal).toHaveBeenCalledWith('shotPopup');
    expect(mockUpdateGoalVisualization).toHaveBeenCalled();
    expect(mockUpdateStatisticsOnly).toHaveBeenCalled();
    expect(saveToLocalStorage).toHaveBeenCalled();
  });
});
