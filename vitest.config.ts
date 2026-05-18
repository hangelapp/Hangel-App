import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**', 'out/**', 'android/**', 'ios/**'],
    testTimeout: 15000,
    hookTimeout: 30000,
    // Run rules tests serially to avoid emulator contention.
    pool: 'forks',
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['firestore.rules'],
    },
  },
});
