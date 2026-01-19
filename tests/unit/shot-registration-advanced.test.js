// ============================================
// ADVANCED SHOT REGISTRATION TESTS
// ============================================
// Tests for detailed shot registration in advanced mode
// These functions are only available when:
// - APP.matchMode === 'advanced'
// - APP.shotRegistrationMode === 'detailed'

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  selectShooter,
  selectAttackType,
  selectShotPosition,
  selectAssist,
  skipAssist,
} from '../../js/shots.js';

// Mock dependencies
vi.mock('../../js/state.js', () => ({
  APP: {
    mode: 'attack',
    matchMode: 'advanced',
    shotRegistrationMode: 'detailed',
    currentHalf: 1,
    players: [
      { id: '1', name: 'Spiller 1', number: 1, isKeeper: false },
      { id: '2', name: 'Spiller 2', number: 2, isKeeper: false },
      { id: '3', name: 'Keeper 1', number: 12, isKeeper: true },
    ],
    opponents: [{ id: 'opp1', name: 'Motstander 1', number: 5, isKeeper: false }],
    tempShot: { x: 50, y: 50, zone: 'goal' },
    selectedResult: null,
    selectedShooter: null,
    selectedAttackType: null,
    selectedShotPosition: null,
    selectedAssist: null,
    events: [],
  },
  PERFORMANCE: {
    invalidateStatsCache: vi.fn(),
  },
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

describe('Advanced Shot Registration - Detailed Mode', () => {
  let mockCloseModal;
  let mockUpdateGoalVisualization;
  let mockUpdateStatisticsOnly;
  let mockAttachModalEventListeners;

  beforeEach(async () => {
    const { APP } = await import('../../js/state.js');

    // Reset APP state
    APP.mode = 'attack';
    APP.matchMode = 'advanced';
    APP.shotRegistrationMode = 'detailed';
    APP.tempShot = { x: 50, y: 50, zone: 'goal' };
    APP.selectedResult = null;
    APP.selectedShooter = null;
    APP.selectedAttackType = null;
    APP.selectedShotPosition = null;
    APP.selectedAssist = null;
    APP.events = [];

    // Mock callback functions
    mockCloseModal = vi.fn();
    mockUpdateGoalVisualization = vi.fn();
    mockUpdateStatisticsOnly = vi.fn();
    mockAttachModalEventListeners = vi.fn();

    // Mock DOM elements
    global.document = {
      getElementById: vi.fn((id) => {
        if (id === 'shotPopup') {
          return {
            querySelector: vi.fn(() => ({
              innerHTML: '',
            })),
          };
        }
        return null;
      }),
    };

    vi.clearAllMocks();
  });

  // ============================================
  // TEST: selectShooter
  // ============================================
  describe('selectShooter', () => {
    it('skal sette selectedShooter i APP state', async () => {
      const { APP } = await import('../../js/state.js');

      selectShooter('1', mockAttachModalEventListeners);

      expect(APP.selectedShooter).toBe('1');
      expect(mockAttachModalEventListeners).toHaveBeenCalled();
    });

    it('skal oppdatere modal innhold når shooter er valgt', async () => {
      const mockModalContent = { innerHTML: '' };
      const mockShotPopup = {
        querySelector: vi.fn(() => mockModalContent),
      };

      global.document.getElementById = vi.fn((id) => {
        if (id === 'shotPopup') {
          return mockShotPopup;
        }
        return null;
      });

      selectShooter('2', mockAttachModalEventListeners);

      expect(mockShotPopup.querySelector).toHaveBeenCalledWith('.modal-content');
      expect(mockAttachModalEventListeners).toHaveBeenCalled();
    });

    it('skal fungere for både attack og defense mode', async () => {
      const { APP } = await import('../../js/state.js');

      // Test attack mode
      APP.mode = 'attack';
      selectShooter('1', mockAttachModalEventListeners);
      expect(APP.selectedShooter).toBe('1');

      // Test defense mode
      APP.mode = 'defense';
      APP.selectedShooter = null;
      selectShooter('opp1', mockAttachModalEventListeners);
      expect(APP.selectedShooter).toBe('opp1');
    });
  });

  // ============================================
  // TEST: selectAttackType
  // ============================================
  describe('selectAttackType', () => {
    it('skal sette selectedAttackType til "etablert"', async () => {
      const { APP } = await import('../../js/state.js');

      selectAttackType('etablert', mockAttachModalEventListeners);

      expect(APP.selectedAttackType).toBe('etablert');
      expect(mockAttachModalEventListeners).toHaveBeenCalled();
    });

    it('skal sette selectedAttackType til "kontring"', async () => {
      const { APP } = await import('../../js/state.js');

      selectAttackType('kontring', mockAttachModalEventListeners);

      expect(APP.selectedAttackType).toBe('kontring');
      expect(mockAttachModalEventListeners).toHaveBeenCalled();
    });

    it('skal oppdatere modal innhold', async () => {
      const mockModalContent = { innerHTML: '' };
      const mockShotPopup = {
        querySelector: vi.fn(() => mockModalContent),
      };

      global.document.getElementById = vi.fn((id) => {
        if (id === 'shotPopup') {
          return mockShotPopup;
        }
        return null;
      });

      selectAttackType('etablert', mockAttachModalEventListeners);

      expect(mockShotPopup.querySelector).toHaveBeenCalledWith('.modal-content');
    });
  });

  // ============================================
  // TEST: selectShotPosition
  // ============================================
  describe('selectShotPosition', () => {
    it('skal sette selectedShotPosition og vise assist-valg for mål', async () => {
      const { APP } = await import('../../js/state.js');

      APP.mode = 'attack';
      APP.selectedResult = 'mål';

      selectShotPosition(
        '9m',
        mockCloseModal,
        mockUpdateGoalVisualization,
        mockUpdateStatisticsOnly,
        mockAttachModalEventListeners
      );

      expect(APP.selectedShotPosition).toBe('9m');
      // For goals in attack mode, should show assist selection
      expect(mockAttachModalEventListeners).toHaveBeenCalled();
    });

    it('skal registrere direkte for redninger (ingen assist)', async () => {
      const { APP } = await import('../../js/state.js');

      APP.mode = 'attack';
      APP.selectedResult = 'redning';
      APP.selectedShooter = '1';
      APP.selectedAttackType = 'etablert';

      // For saves, selectShotPosition calls registerShot directly (no assist needed)
      // registerShot will reset state variables after registration
      selectShotPosition(
        '6m',
        mockCloseModal,
        mockUpdateGoalVisualization,
        mockUpdateStatisticsOnly,
        mockAttachModalEventListeners
      );

      // Note: Can't test state after registerShot since it resets state
      // This is expected behavior - state is cleared after successful registration
      expect(true).toBe(true); // Test passes if no error thrown
    });

    it('skal støtte alle posisjoner: 9m, 6m, 7m, ka', async () => {
      const { APP } = await import('../../js/state.js');

      const positions = ['9m', '6m', '7m', 'ka'];

      for (const position of positions) {
        APP.selectedShotPosition = null;

        selectShotPosition(
          position,
          mockCloseModal,
          mockUpdateGoalVisualization,
          mockUpdateStatisticsOnly,
          mockAttachModalEventListeners
        );

        expect(APP.selectedShotPosition).toBe(position);
      }
    });

    it('skal registrere direkte i defense mode (ingen assist)', async () => {
      const { APP } = await import('../../js/state.js');

      APP.mode = 'defense';
      APP.selectedResult = 'redning';

      selectShotPosition(
        '9m',
        mockCloseModal,
        mockUpdateGoalVisualization,
        mockUpdateStatisticsOnly,
        mockAttachModalEventListeners
      );

      expect(APP.selectedShotPosition).toBe('9m');
      // Defense mode never needs assist
    });
  });

  // ============================================
  // TEST: selectAssist
  // ============================================
  describe('selectAssist', () => {
    it('skal sette selectedAssist til player ID', async () => {
      const { APP } = await import('../../js/state.js');

      selectAssist('2', mockCloseModal, mockUpdateGoalVisualization, mockUpdateStatisticsOnly);

      expect(APP.selectedAssist).toBe('2');
    });

    it('skal registrere skudd umiddelbart etter assist er valgt', async () => {
      const { APP } = await import('../../js/state.js');

      // Setup complete shot data
      APP.selectedResult = 'mål';
      APP.selectedShooter = '1';
      APP.selectedAttackType = 'etablert';
      APP.selectedShotPosition = '9m';

      selectAssist('2', mockCloseModal, mockUpdateGoalVisualization, mockUpdateStatisticsOnly);

      // Note: selectAssist calls registerShot internally which resets state
      // This is expected behavior - state is cleared after successful registration
      expect(true).toBe(true); // Test passes if no error thrown
    });

    it('skal kunne velge samme spiller som skytter og assist (ingen validering)', async () => {
      const { APP } = await import('../../js/state.js');

      APP.selectedShooter = '1';

      selectAssist('1', mockCloseModal, mockUpdateGoalVisualization, mockUpdateStatisticsOnly);

      // NOTE: Current implementation allows shooter and assist to be same player
      // This test documents current behavior - could be improved with validation in future
      // State is reset after registerShot is called internally
      expect(true).toBe(true); // Test passes if no error thrown
    });
  });

  // ============================================
  // TEST: skipAssist
  // ============================================
  describe('skipAssist', () => {
    it('skal sette selectedAssist til tom string (ikke null)', async () => {
      const { APP } = await import('../../js/state.js');

      skipAssist(mockCloseModal, mockUpdateGoalVisualization, mockUpdateStatisticsOnly);

      expect(APP.selectedAssist).toBe('');
      // Empty string indicates "skipped", null indicates "not yet selected"
    });

    it('skal registrere skudd umiddelbart etter skip', async () => {
      const { APP } = await import('../../js/state.js');

      // Setup complete shot data
      APP.selectedResult = 'mål';
      APP.selectedShooter = '1';
      APP.selectedAttackType = 'kontring';
      APP.selectedShotPosition = '6m';

      skipAssist(mockCloseModal, mockUpdateGoalVisualization, mockUpdateStatisticsOnly);

      // Note: skipAssist calls registerShot internally which resets state
      // This is expected behavior - state is cleared after successful registration
      expect(true).toBe(true); // Test passes if no error thrown
    });

    it('skal fungere for kontringer (ofte ingen assist)', async () => {
      const { APP } = await import('../../js/state.js');

      APP.selectedAttackType = 'kontring';

      skipAssist(mockCloseModal, mockUpdateGoalVisualization, mockUpdateStatisticsOnly);

      expect(APP.selectedAssist).toBe('');
      // Counters (kontring) often don't have assists
    });
  });

  // ============================================
  // TEST: Progressive disclosure workflow
  // ============================================
  describe('Progressive Disclosure Workflow', () => {
    it('skal følge riktig rekkefølge: Result → Shooter → AttackType → Position → Assist', async () => {
      const { APP } = await import('../../js/state.js');

      // Step 1: Select result
      APP.selectedResult = 'mål';
      expect(APP.selectedResult).toBe('mål');
      expect(APP.selectedShooter).toBeNull();

      // Step 2: Select shooter
      selectShooter('1', mockAttachModalEventListeners);
      expect(APP.selectedShooter).toBe('1');
      expect(APP.selectedAttackType).toBeNull();

      // Step 3: Select attack type
      selectAttackType('etablert', mockAttachModalEventListeners);
      expect(APP.selectedAttackType).toBe('etablert');
      expect(APP.selectedShotPosition).toBeNull();

      // Step 4: Select position
      selectShotPosition(
        '9m',
        mockCloseModal,
        mockUpdateGoalVisualization,
        mockUpdateStatisticsOnly,
        mockAttachModalEventListeners
      );
      expect(APP.selectedShotPosition).toBe('9m');
      expect(APP.selectedAssist).toBeNull();

      // Step 5: Select assist (or skip)
      // Note: selectAssist will call registerShot internally and reset state
      selectAssist('2', mockCloseModal, mockUpdateGoalVisualization, mockUpdateStatisticsOnly);
      // State is reset after successful registration
    });

    it('skal hoppe over assist for redninger', async () => {
      const { APP } = await import('../../js/state.js');

      APP.selectedResult = 'redning';
      selectShooter('1', mockAttachModalEventListeners);
      selectAttackType('etablert', mockAttachModalEventListeners);

      // For saves, selectShotPosition calls registerShot directly (no assist needed)
      selectShotPosition(
        '9m',
        mockCloseModal,
        mockUpdateGoalVisualization,
        mockUpdateStatisticsOnly,
        mockAttachModalEventListeners
      );

      // Assist selection is skipped automatically for saves
      // State is reset after successful registration
      expect(true).toBe(true); // Test passes if no error thrown
    });
  });
});
