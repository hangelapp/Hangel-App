import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // React plugin is required so component snapshot tests under
  // tests/components/** can render JSX/TSX components (Next.js
  // tsconfig has `jsx: preserve` which vite cannot transform alone).
  plugins: [react()],
  // P2-1: API route unit tests under tests/api/** import the routes, which in
  // turn reference `@/...` paths. Mirror the tsconfig alias so vitest resolves
  // them without adding a new plugin dependency.
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Per-file environment selection: components/snapshot tests opt-in to
    // `jsdom` via `// @vitest-environment jsdom` annotation at the top of
    // each file. Rules + API + lib tests use node (the default).
    environment: 'node',
    globals: false,
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**', 'out/**', 'android/**', 'ios/**'],
    testTimeout: 15000,
    hookTimeout: 30000,
    // Run rules tests serially to avoid emulator contention.
    pool: 'forks',
    fileParallelism: false,
    setupFiles: ['tests/components/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['firestore.rules'],
    },
  },
});
