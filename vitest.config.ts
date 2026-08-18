import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: ['./test/global-setup.ts'],
    maxWorkers: 2,
    include: ['test/**/*.test.{ts,tsx}'],
    exclude: [
      '**/.cache/**',
      '**/node_modules/**',
      '**/.git/**',
      'test/daily-workflow-depth/holdout/**',
      'test/skill-behavior/fixtures/**',
    ],
  },
})
