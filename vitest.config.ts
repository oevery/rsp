import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    maxWorkers: 2,
    include: ['test/**/*.test.ts'],
    exclude: [
      '**/.cache/**',
      '**/node_modules/**',
      '**/.git/**',
      'test/daily-workflow-depth/holdout/**',
      'test/skill-behavior/fixtures/**',
    ],
  },
})
