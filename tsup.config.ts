import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'broker-daemon': 'src/broker/daemon-entry.ts',
    'cli': 'src/cli.ts',
    'manage-runtime': 'src/runtime/manage-entry.ts',
    'runtime-store': 'src/runtime/index.ts',
    'web-projector': 'src/web/projector-entry.ts',
  },
  format: 'esm',
  external: ['node:sqlite'],
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
