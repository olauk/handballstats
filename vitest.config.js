import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Bruk jsdom for browser-simulering (DOM API)
    environment: 'jsdom',

    // Coverage rapportering
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.js',
        'js/firebase-config.js', // Ekskluder Firebase config fra coverage
      ],
      // Krev minst 70% coverage for kritiske filer
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },

    // Test filer
    include: ['tests/**/*.test.js'],

    // Globals (ikke nødvendig å importere describe, it, expect)
    globals: true,

    // Test timeout (standard er 5000ms)
    testTimeout: 10000,

    // Mock modules
    mockReset: true,
    restoreMocks: true,

    // Setup filer som kjøres før hver test
    setupFiles: ['./tests/helpers/setup.js'],
  },
});
