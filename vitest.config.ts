import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    maxWorkers: 2,
    include: ['tests/**/*.test.{ts,tsx,js}'],
    exclude: [
      '**/.cache/**',
      '**/node_modules/**',
      '**/.git/**',
      'tests/**/fixtures/**',
      'tests/**/holdout/**',
    ],
  },
})
