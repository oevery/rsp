import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/cli.ts'],
  format: 'esm',
  outDir: 'dist',
  outExtension: () => ({ js: '.mjs' }),
  clean: true,
  dts: false,
  sourcemap: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
})
