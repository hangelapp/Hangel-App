import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';
import unusedImports from 'eslint-plugin-unused-imports';

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'out/**',
      'node_modules/**',
      'android/**',
      'ios/**',
      'scripts/**',
      '.lh-tmp/**',
      '.worktrees/**',
      'next.config.ts',
      'tailwind.config.ts',
      'postcss.config.mjs',
      'capacitor.config.ts',
      'eslint.config.mjs',
      'next-env.d.ts',
      '**/*.d.ts',
      '.deploy-*.mjs',
      '.list-*.mjs',
      '.check-*.mjs',
      '.wait-*.mjs',
      '.enable-*.mjs',
      '.set-*.mjs',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        React: 'readonly',
        JSX: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        process: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        Blob: 'readonly',
        FileReader: 'readonly',
        Image: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLButtonElement: 'readonly',
        Event: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        TouchEvent: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        AbortController: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        IntersectionObserver: 'readonly',
        ResizeObserver: 'readonly',
        MutationObserver: 'readonly',
        crypto: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        getComputedStyle: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      '@next/next': nextPlugin,
      'unused-imports': unusedImports,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',
      'react/no-unknown-property': ['error', { ignore: ['jsx', 'global'] }],
      // React Compiler / react-hooks v7 advisory rules — flag legitimate
      // patterns (mount-time hydration, carousel ref access, etc.) as warnings.
      // Silenced because this codebase doesn't use the React Compiler.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/component-hook-factories': 'off',
      // Real bug detectors — kept as warnings
      'react-hooks/static-components': 'warn',
      'react-hooks/set-state-in-render': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/purity': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-useless-escape': 'warn',
      'prefer-const': 'warn',
      '@next/next/no-img-element': 'off',
      '@next/next/no-html-link-for-pages': 'off',
      // P2-8 + P2-8b: catch inline non-memoized Firestore refs passed to useDoc/useCollection.
      // Inline collection()/doc() creates a fresh ref every render → useEffect inside
      // the hook cleans up and re-subscribes the snapshot listener on every render
      // (memory leak + wasted reads). Pass a useMemoFirebase(...) result instead.
      // Upgraded from 'warn' to 'error' in P2-8b — current offender count is 0 and
      // the runtime __memo guard (useCollection:111 + useDoc:P2-8g) already throws.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'CallExpression[callee.name=/^(useDoc|useCollection)$/] > CallExpression[callee.name=/^(collection|doc)$/]',
          message:
            'Pass a memoized ref (via useMemoFirebase) to useDoc/useCollection — inline collection()/doc() recreates the listener every render.',
        },
      ],
    },
  }
);
