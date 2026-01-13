// ============================================
// TEST SETUP - Kjøres før hver test
// ============================================

import { beforeEach, afterEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};

global.localStorage = localStorageMock;

// Mock alert, confirm, prompt
global.alert = vi.fn();
global.confirm = vi.fn(() => true);
global.prompt = vi.fn();

// Mock console metoder for å redusere støy i testene
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Reset mocks før hver test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  localStorageMock.length = 0;
});

// Cleanup etter hver test
afterEach(() => {
  vi.restoreAllMocks();
});
