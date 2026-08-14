import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    cli: 'src/cli.ts',
  },
  format: 'esm',
  outDir: 'dist',
  outExtension: () => ({ js: '.mjs' }),
  clean: true,
  dts: false,
  sourcemap: false,
  splitting: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
})
