import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Enable benchmarks
    benchmark: {
      include: ['**/*.bench.{ts,js}'],
      exclude: ['node_modules/**'],
    },
    // Test configuration
    include: ['src/**/*.{test,spec,bench}.{js,ts}'],
    environment: 'node',
    // Increase timeout for slow puzzle generation
    testTimeout: 120000, // 2 minutes
    // Allow long-running benchmarks
    hookTimeout: 300000, // 5 minutes
  },
})
