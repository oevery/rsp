import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from './vitest.config.js'

export default mergeConfig(baseConfig, defineConfig({
  test: {
    globalSetup: ['./tests/support/watch-build-setup.ts'],
    forceRerunTriggers: [...configDefaults.forceRerunTriggers, '**/src/**', '**/bin/**', '**/rules/**', '**/skills/**', '**/tsup.config.*'],
  },
}))
