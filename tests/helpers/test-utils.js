// ============================================
// TEST UTILITIES
// ============================================

/**
 * Lag en mock spiller for testing
 */
export function createMockPlayer(overrides = {}) {
  return {
    id: Date.now() + Math.random(),
    name: 'Test Spiller',
    number: 1,
    isKeeper: false,
    ...overrides,
  };
}

/**
 * Lag en mock event for testing
 */
export function createMockEvent(overrides = {}) {
  return {
    id: Date.now(),
    half: 1,
    mode: 'attack',
    player: createMockPlayer(),
    opponent: null,
    keeper: null,
    x: 50,
    y: 50,
    result: 'mål',
    zone: 'goal',
    timestamp: new Date().toLocaleTimeString('no-NO'),
    ...overrides,
  };
}

/**
 * Lag en mock APP state for testing
 */
export function createMockAppState(overrides = {}) {
  return {
    mode: 'attack',
    currentHalf: 1,
    matchMode: 'simple',
    players: [
      createMockPlayer({ id: '1', name: 'Spiller 1', number: 1 }),
      createMockPlayer({ id: '2', name: 'Spiller 2', number: 2 }),
    ],
    opponents: [
      createMockPlayer({ id: 'opp1', name: 'Motstander 1', number: 11 }),
      createMockPlayer({ id: 'opp2', name: 'Motstander 2', number: 12 }),
    ],
    events: [],
    tempShot: null,
    selectedResult: null,
    activeKeeper: null,
    timerConfig: {
      halfLength: 30,
    },
    ...overrides,
  };
}

/**
 * Mock DOM element med getBoundingClientRect
 */
export function createMockElement(rect = {}) {
  const element = document.createElement('div');
  element.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    width: 300,
    height: 200,
    right: 300,
    bottom: 200,
    x: 0,
    y: 0,
    ...rect,
  });
  return element;
}

/**
 * Mock click event
 */
export function createMockClickEvent(overrides = {}) {
  return {
    clientX: 150,
    clientY: 100,
    target: document.createElement('div'),
    preventDefault: () => {},
    stopPropagation: () => {},
    ...overrides,
  };
}

/**
 * Vent på at en async operasjon skal fullføres
 */
export function waitFor(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock performance cache
 */
export function createMockPerformance() {
  const cache = new Map();
  return {
    getCachedStats: (key, calculator) => {
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = calculator();
      cache.set(key, result);
      return result;
    },
    invalidateStatsCache: () => {
      cache.clear();
    },
  };
}
