import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src/'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Every source module under src/ is part of the coverage scope. Only files
      // that contain no runtime application logic are excluded (see below).
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        // Test suites contain no application logic.
        'src/**/*.{test,spec}.{ts,tsx}',
        // Type declarations are erased at build time and emit no runtime code.
        'src/**/*.d.ts',
        // Type-only module: declares interfaces/types, compiles to an empty module.
        'src/utils/type.ts',
        // Bootstrap entry point: mounts the root and starts the app by delegating to
        // the router and auth modules, which are themselves covered.
        'src/app/index.ts',
      ],
    },
  },
});
