import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // P2-1: API route unit tests under tests/api/** import the routes, which in
  // turn reference `@/...` paths. Mirror the tsconfig alias so vitest resolves
  // them without adding a new plugin dependency.
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
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
