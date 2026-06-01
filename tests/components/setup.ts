/**
 * Global test setup for component snapshot tests.
 *
 * Loaded by vitest.config.ts `setupFiles`. Active for ALL test files (the
 * cost is minimal for node-env tests). React Testing Library matchers
 * (`toBeInTheDocument`, `toHaveClass`, …) are registered globally so any
 * tests/components/*.test.tsx can use them without re-importing.
 *
 * Auto-cleanup between tests: vitest 4 no longer mounts an auto-cleanup
 * hook for RTL (jest used to via the global setup). We do it here so each
 * `render()` starts from a fresh DOM and `getByRole` doesn't trip on
 * elements left behind by earlier tests.
 */
import { afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
