import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    maxWorkers: 2,
    include: ['verification/tests/**/*.test.{ts,tsx}'],
    exclude: [
      '**/.cache/**',
      '**/node_modules/**',
      '**/.git/**',
      'verification/tests/**/fixtures/**',
      'verification/tests/**/holdout/**',
    ],
  },
})
