import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    maxWorkers: 2,
    include: ['test/**/*.test.{ts,tsx}'],
    exclude: [
      '**/.cache/**',
      '**/node_modules/**',
      '**/.git/**',
      'test/**/fixtures/**',
      'test/**/holdout/**',
    ],
  },
})
