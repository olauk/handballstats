// ============================================
// SHOT REGISTRATION TESTS
// ============================================
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleGoalClick, registerShot } from '../../js/shots.js';
import {
  createMockAppState,
  createMockElement,
  createMockClickEvent,
  createMockPlayer,
} from '../helpers/test-utils.js';

// Mock dependencies
vi.mock('../../js/state.js', () => ({
  APP: {
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
  },
  PERFORMANCE: {
    getCachedStats: vi.fn((key, calculator) => calculator()),
    invalidateStatsCache: vi.fn(),
  },
  getCurrentEvents: vi.fn(() => []),
}));

vi.mock('../../js/storage.js', () => ({
  saveToLocalStorage: vi.fn(),
}));

vi.mock('../../js/debug-logger.js', () => ({
  logShotEvent: vi.fn(),
  logAppEvent: vi.fn(),
}));

vi.mock('../../js/timer.js', () => ({
  getCurrentTimerTime: vi.fn(() => ({ minutes: 5, seconds: 30 })),
}));

vi.mock('../../js/ui/event-feed.js', () => ({
  updateEventFeed: vi.fn(),
}));

describe('Shot Registration - handleGoalClick', () => {
  let mockGoalArea;
  let mockGoalContainer;

  beforeEach(async () => {
    // Reset APP state
    const { APP } = await import('../../js/state.js');
    Object.assign(APP, createMockAppState());

    // Create mock DOM elements
    mockGoalArea = createMockElement({ width: 300, height: 200, left: 50, top: 50 });
    mockGoalArea.id = 'goalArea';
    mockGoalContainer = createMockElement({ width: 400, height: 300, left: 0, top: 0 });
    mockGoalContainer.id = 'goalContainer';

    document.body.innerHTML = '';
    document.body.appendChild(mockGoalContainer);
    mockGoalContainer.appendChild(mockGoalArea);
  });

  it('skal registrere skudd innenfor mål med korrekte koordinater', async () => {
    const { APP } = await import('../../js/state.js');

    const clickEvent = createMockClickEvent({
      clientX: 200, // 150px fra venstre kant av goalArea (50 + 150)
      clientY: 150, // 100px fra topp kant av goalArea (50 + 100)
      target: mockGoalArea,
    });

    const result = handleGoalClick(clickEvent);

    expect(result).toBe(true);
    expect(APP.tempShot).toBeDefined();
    expect(APP.tempShot.zone).toBe('goal');
    expect(APP.tempShot.x).toBeGreaterThanOrEqual(0);
    expect(APP.tempShot.x).toBeLessThanOrEqual(100);
    expect(APP.tempShot.y).toBeGreaterThanOrEqual(0);
    expect(APP.tempShot.y).toBeLessThanOrEqual(100);
  });

  it('skal registrere skudd utenfor mål', async () => {
    const { APP } = await import('../../js/state.js');

    const clickEvent = createMockClickEvent({
      clientX: 50,
      clientY: 50,
      target: mockGoalContainer,
    });

    const result = handleGoalClick(clickEvent);

    expect(result).toBe(true);
    expect(APP.tempShot).toBeDefined();
    expect(APP.tempShot.zone).toBe('outside');
  });

  it('skal kreve keeper i forsvarsmodus', async () => {
    const { APP } = await import('../../js/state.js');
    APP.mode = 'defense';
    APP.activeKeeper = null;
    APP.players = [];

    const clickEvent = createMockClickEvent({ target: mockGoalArea });

    const result = handleGoalClick(clickEvent);

    expect(result).toBe(false);
    expect(global.alert).toHaveBeenCalled();
  });

  it('skal auto-velge keeper hvis ingen er valgt', async () => {
    const { APP } = await import('../../js/state.js');
    const { saveToLocalStorage } = await import('../../js/storage.js');

    APP.mode = 'defense';
    APP.activeKeeper = null;
    const keeper = createMockPlayer({ id: 'keeper1', isKeeper: true, name: 'Keeper' });
    APP.players = [keeper];

    const clickEvent = createMockClickEvent({ target: mockGoalArea });

    const result = handleGoalClick(clickEvent);

    expect(result).toBe(true);
    expect(APP.activeKeeper).toBe(keeper);
    expect(saveToLocalStorage).toHaveBeenCalled();
  });
});

describe('Shot Registration - registerShot', () => {
  let mockCloseModal;
  let mockUpdateGoalVisualization;
  let mockUpdateStatisticsOnly;

  beforeEach(async () => {
    const { APP } = await import('../../js/state.js');
    Object.assign(APP, createMockAppState());

    mockCloseModal = vi.fn();
    mockUpdateGoalVisualization = vi.fn();
    mockUpdateStatisticsOnly = vi.fn();
  });

  it('skal registrere et gyldig skudd med mål', async () => {
    const { APP } = await import('../../js/state.js');
    const { saveToLocalStorage } = await import('../../js/storage.js');
    const { PERFORMANCE } = await import('../../js/state.js');

    const player = APP.players[0];
    APP.tempShot = { x: 50, y: 50, zone: 'goal' };
    APP.selectedResult = 'mål';

    const result = registerShot(
      player.id,
      mockCloseModal,
      mockUpdateGoalVisualization,
      mockUpdateStatisticsOnly
    );

    expect(result).toBe(true);
    expect(APP.events).toHaveLength(1);
    expect(APP.events[0].result).toBe('mål');
    expect(APP.events[0].player).toBe(player);
    expect(APP.tempShot).toBe(null);
    expect(APP.selectedResult).toBe(null);
    expect(saveToLocalStorage).toHaveBeenCalled();
    expect(PERFORMANCE.invalidateStatsCache).toHaveBeenCalled();
    expect(mockCloseModal).toHaveBeenCalledWith('shotPopup');
    expect(mockUpdateGoalVisualization).toHaveBeenCalled();
    expect(mockUpdateStatisticsOnly).toHaveBeenCalled();
  });

  it('skal registrere redning i forsvarsmodus', async () => {
    const { APP } = await import('../../js/state.js');

    APP.mode = 'defense';
    const opponent = APP.opponents[0];
    const keeper = createMockPlayer({ id: 'keeper1', isKeeper: true });
    APP.activeKeeper = keeper;
    APP.tempShot = { x: 30, y: 40, zone: 'goal' };
    APP.selectedResult = 'redning';

    const result = registerShot(
      opponent.id,
      mockCloseModal,
      mockUpdateGoalVisualization,
      mockUpdateStatisticsOnly
    );

    expect(result).toBe(true);
    expect(APP.events[0].result).toBe('redning');
    expect(APP.events[0].opponent).toBe(opponent);
    expect(APP.events[0].keeper).toBe(keeper);
  });

  it('skal registrere skudd utenfor', async () => {
    const { APP } = await import('../../js/state.js');

    const player = APP.players[0];
    APP.tempShot = { x: 10, y: 10, zone: 'outside' };

    const result = registerShot(
      player.id,
      mockCloseModal,
      mockUpdateGoalVisualization,
      mockUpdateStatisticsOnly
    );

    expect(result).toBe(true);
    expect(APP.events[0].result).toBe('utenfor');
    expect(APP.events[0].zone).toBe('outside');
  });

  it('skal feile hvis tempShot mangler', async () => {
    const { APP } = await import('../../js/state.js');
    APP.tempShot = null;

    const result = registerShot(
      'player1',
      mockCloseModal,
      mockUpdateGoalVisualization,
      mockUpdateStatisticsOnly
    );

    expect(result).toBe(false);
    expect(APP.events).toHaveLength(0);
  });

  it('skal feile hvis playerId mangler', async () => {
    const { APP } = await import('../../js/state.js');
    APP.tempShot = { x: 50, y: 50, zone: 'goal' };

    const result = registerShot(
      null,
      mockCloseModal,
      mockUpdateGoalVisualization,
      mockUpdateStatisticsOnly
    );

    expect(result).toBe(false);
    expect(global.alert).toHaveBeenCalled();
  });

  it('skal feile hvis spiller ikke finnes', async () => {
    const { APP } = await import('../../js/state.js');
    APP.tempShot = { x: 50, y: 50, zone: 'goal' };

    const result = registerShot(
      'invalid-player-id',
      mockCloseModal,
      mockUpdateGoalVisualization,
      mockUpdateStatisticsOnly
    );

    expect(result).toBe(false);
    expect(global.alert).toHaveBeenCalled();
  });

  it('skal inkludere timer timestamp i advanced mode', async () => {
    const { APP } = await import('../../js/state.js');

    APP.matchMode = 'advanced';
    APP.currentHalf = 2;
    const player = APP.players[0];
    APP.tempShot = { x: 50, y: 50, zone: 'goal' };
    APP.selectedResult = 'mål';

    const result = registerShot(
      player.id,
      mockCloseModal,
      mockUpdateGoalVisualization,
      mockUpdateStatisticsOnly
    );

    expect(result).toBe(true);
    expect(APP.events[0].timerTimestamp).toBeDefined();
    expect(APP.events[0].timerTimestamp.minutes).toBe(35); // 5 + 30 (halfLength)
    expect(APP.events[0].timerTimestamp.seconds).toBe(30);
  });
});
