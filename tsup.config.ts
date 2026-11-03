import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'cli': 'src/cli.ts',
    'viewer-service': 'src/viewer/service.ts',
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
