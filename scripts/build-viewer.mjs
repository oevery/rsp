import { copyFile, mkdir, readFile } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'
import { build } from 'esbuild'
import { viewerEntries } from '../src/viewer/build-assets.mjs'

/** @param {(args: string[]) => Promise<void>} runTool */
export async function buildViewer(runTool) {
  await mkdir('dist/viewer', { recursive: true })
  const common = { bundle: true, minify: true, format: 'esm', platform: 'browser', target: 'es2022', legalComments: 'inline', metafile: true }
  const builds = await Promise.allSettled([
    build({
      ...common,
      entryPoints: ['src/viewer/web/app.tsx'],
      outfile: `dist/viewer/${viewerEntries.app}`,
      jsx: 'automatic',
      alias: { 'react': resolve('node_modules/react'), 'react-dom': resolve('node_modules/react-dom') },
      define: { '__RSP_ICON__': JSON.stringify(await readFile('docs/site/public/rsp-icon.svg', 'utf8')), 'process.env.NODE_ENV': '"production"', 'import.meta.env': JSON.stringify({ DEV: false, PROD: true, MODE: 'production' }) },
    }),
    build({
      ...common,
      entryPoints: { [viewerEntries.mermaid.slice(0, -3)]: 'src/viewer/web/mermaid.ts' },
      outdir: 'dist/viewer',
      chunkNames: 'chunks/[name]-[hash]',
      splitting: true,
    }),
  ])
  const results = builds.map((result) => {
    if (result.status === 'rejected')
      throw result.reason
    return result.value
  })
  await runTool(['node_modules/@tailwindcss/cli/dist/index.mjs', '-i', 'src/viewer/web/style.css', '-o', `dist/viewer/${viewerEntries.style}`, '--minify'])
  await copyFile('src/viewer/web/ui/NOTICE.txt', 'dist/viewer/NOTICE.txt')
  return [...results.flatMap(result => Object.keys(result.metafile.outputs).map(path => relative('dist/viewer', path).split(sep).join('/'))), viewerEntries.style].sort()
}
