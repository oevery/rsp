import { defineConfig } from 'tsup'

export default defineConfig([
  {
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
  },
  {
    entry: {
      app: 'web/src/main.tsx',
    },
    platform: 'browser',
    target: 'es2022',
    format: 'esm',
    outDir: 'web/static',
    outExtension: () => ({ js: '.js' }),
    clean: false,
    dts: false,
    sourcemap: false,
    splitting: false,
    noExternal: ['react', 'react-dom'],
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    minify: true,
    treeshake: true,
  },
])
