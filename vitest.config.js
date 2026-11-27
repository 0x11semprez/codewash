import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
    // Process CSS modules for real, with their plain class names, so tests can check the classes
    // a component applies, and a class missing from its module shows up as undefined.
    css: {
      include: [/\.module\.css$/],
      modules: { classNameStrategy: 'non-scoped' },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/__tests__/**',
        // Bootstraps React into the page, no logic to test.
        'src/main.jsx',
        // Static placeholder paths that nothing imports.
        'src/constants/assets.js',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
})
