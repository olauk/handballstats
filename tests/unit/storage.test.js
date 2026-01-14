// ============================================
// STORAGE PERSISTENCE TESTS
// ============================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveToLocalStorage,
  saveToLocalStorageImmediate,
  loadFromLocalStorage,
} from '../../js/storage.js';
import { APP, PERFORMANCE } from '../../js/state.js';

// Mock firestore-storage
vi.mock('../../js/firestore-storage.js', () => ({
  saveMatchToFirestoreDebounced: vi.fn(),
}));

describe('Storage - Debounce & Error Handling', () => {
  beforeEach(() => {
    // Reset APP state
    APP.events = [];
    APP.homeTeam = 'Test Team';
    APP.awayTeam = 'Opponent Team';

    // Clear any pending timeouts
    if (PERFORMANCE.saveTimeout) {
      clearTimeout(PERFORMANCE.saveTimeout);
      PERFORMANCE.saveTimeout = null;
    }

    // Clear localStorage
    localStorage.clear();

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
    if (PERFORMANCE.saveTimeout) {
      clearTimeout(PERFORMANCE.saveTimeout);
    }
  });

  // UT-027: Debouncer saves korrekt (300ms)
  it('skal debounce saves og lagre etter 300ms', async () => {
    // Spy on localStorage.setItem
    const setItemSpy = vi.spyOn(localStorage, 'setItem');

    // Første save request
    saveToLocalStorage();

    // Umiddelbart etter: localStorage skal IKKE være kalt ennå
    expect(setItemSpy).not.toHaveBeenCalled();

    // Vent 150ms (mindre enn 300ms)
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(setItemSpy).not.toHaveBeenCalled(); // Fortsatt ikke kalt

    // Vent ytterligere 200ms (totalt 350ms)
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Nå skal localStorage være kalt
    expect(setItemSpy).toHaveBeenCalledTimes(1);
    expect(setItemSpy).toHaveBeenCalledWith('handballApp', expect.any(String));

    setItemSpy.mockRestore();
  });

  // UT-028: Cancels previous timeout ved ny save
  it('skal cancelle previous timeout og kun lagre én gang ved raske saves', async () => {
    const setItemSpy = vi.spyOn(localStorage, 'setItem');

    // Simuler 5 raske saves (alle innen 300ms window)
    saveToLocalStorage();
    await new Promise((resolve) => setTimeout(resolve, 50));
    saveToLocalStorage();
    await new Promise((resolve) => setTimeout(resolve, 50));
    saveToLocalStorage();
    await new Promise((resolve) => setTimeout(resolve, 50));
    saveToLocalStorage();
    await new Promise((resolve) => setTimeout(resolve, 50));
    saveToLocalStorage();

    // Total tid: 200ms (innenfor debounce window)
    // localStorage skal IKKE være kalt ennå
    expect(setItemSpy).not.toHaveBeenCalled();

    // Vent til etter debounce (350ms totalt fra siste save)
    await new Promise((resolve) => setTimeout(resolve, 350));

    // localStorage skal være kalt NØY_AKTIG én gang
    expect(setItemSpy).toHaveBeenCalledTimes(1);

    setItemSpy.mockRestore();
  });

  // UT-030: QuotaExceededError handling
  it('skal håndtere QuotaExceededError og rethrow', async () => {
    // Mock localStorage.setItem to throw QuotaExceededError
    const mockError = new Error('QuotaExceededError');
    mockError.name = 'QuotaExceededError';
    const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw mockError;
    });

    // Forsøk å lagre umiddelbart
    expect(() => {
      saveToLocalStorageImmediate();
    }).toThrow('QuotaExceededError');

    // Verifiser at error ble logget
    expect(setItemSpy).toHaveBeenCalled();

    setItemSpy.mockRestore();
  });

  // BONUS: Test saveToLocalStorageImmediate
  it('skal lagre umiddelbart uten debounce ved immediate save', () => {
    let savedData = null;
    const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      savedData = value;
    });
    const getItemSpy = vi.spyOn(localStorage, 'getItem').mockImplementation(() => savedData);

    APP.homeTeam = 'Immediate Team';

    // Immediate save
    const result = saveToLocalStorageImmediate();

    // Skal være lagret UMIDDELBART
    expect(result).toBe(true);
    expect(setItemSpy).toHaveBeenCalledTimes(1);

    // Verifiser at data ble lagret
    const saved = localStorage.getItem('handballApp');
    expect(saved).toBeDefined();
    const parsed = JSON.parse(saved);
    expect(parsed.homeTeam).toBe('Immediate Team');

    setItemSpy.mockRestore();
    getItemSpy.mockRestore();
  });

  // BONUS: Test loadFromLocalStorage
  it('skal laste data fra localStorage', () => {
    // Setup: Lagre noen data
    const testData = {
      homeTeam: 'Loaded Team',
      awayTeam: 'Loaded Opponent',
      events: [{ id: 1, result: 'mål' }],
      currentUser: { uid: 'test-user' }, // Skal IKKE lastes
      page: 'match', // Skal IKKE lastes
    };

    // Mock localStorage to return our test data
    vi.spyOn(localStorage, 'getItem').mockReturnValue(JSON.stringify(testData));

    // Reset APP state
    APP.homeTeam = '';
    APP.awayTeam = '';
    APP.events = [];

    // Load from localStorage
    loadFromLocalStorage();

    // Verifiser at data ble lastet
    expect(APP.homeTeam).toBe('Loaded Team');
    expect(APP.awayTeam).toBe('Loaded Opponent');
    expect(APP.events).toHaveLength(1);

    // Verifiser at auth-data IKKE ble lastet
    expect(APP.currentUser).toBeNull(); // Reset til default
    expect(APP.page).not.toBe('match'); // Reset til default 'login'
  });

  // BONUS: Test corrupt localStorage data
  it('skal håndtere corrupt localStorage data gracefully', () => {
    // Setup: Lagre invalid JSON
    localStorage.setItem('handballApp', 'NOT VALID JSON {{{');

    // Reset APP state
    APP.homeTeam = 'Original';

    // Load should not crash
    expect(() => {
      loadFromLocalStorage();
    }).not.toThrow();

    // APP state skal være uendret
    expect(APP.homeTeam).toBe('Original');
  });

  // BONUS: Test serialisering av APP object
  it('skal serialisere APP object korrekt', async () => {
    const setItemSpy = vi.spyOn(localStorage, 'setItem');

    APP.homeTeam = 'Serialize Test';
    APP.events = [
      { id: 1, result: 'mål', x: 50, y: 50 },
      { id: 2, result: 'redning', x: 30, y: 40 },
    ];

    saveToLocalStorage();

    // Vent til lagring
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Verifiser at JSON er gyldig
    expect(setItemSpy).toHaveBeenCalled();
    const savedJSON = setItemSpy.mock.calls[0][1];
    expect(() => JSON.parse(savedJSON)).not.toThrow();

    // Verifiser innholdet
    const parsed = JSON.parse(savedJSON);
    expect(parsed.homeTeam).toBe('Serialize Test');
    expect(parsed.events).toHaveLength(2);
    expect(parsed.events[0].result).toBe('mål');

    setItemSpy.mockRestore();
  });

  // BONUS: Test multiple saves over longer time (> 300ms apart)
  it('skal lagre hver gang hvis saves er > 300ms apart', async () => {
    let savedData = null;
    const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      savedData = value;
    });
    const getItemSpy = vi.spyOn(localStorage, 'getItem').mockImplementation(() => savedData);

    // Save 1
    APP.homeTeam = 'Team 1';
    saveToLocalStorage();
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(setItemSpy).toHaveBeenCalledTimes(1);

    // Save 2 (etter 350ms)
    APP.homeTeam = 'Team 2';
    saveToLocalStorage();
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(setItemSpy).toHaveBeenCalledTimes(2);

    // Verifiser siste verdi
    const saved = localStorage.getItem('handballApp');
    const parsed = JSON.parse(saved);
    expect(parsed.homeTeam).toBe('Team 2');

    setItemSpy.mockRestore();
    getItemSpy.mockRestore();
  });
});
