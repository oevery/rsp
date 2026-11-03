import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { build } from 'esbuild'

await mkdir('dist/viewer', { recursive: true })
await build({ entryPoints: ['src/viewer/web/app.tsx'], outfile: 'dist/viewer/app.js', bundle: true, minify: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', legalComments: 'inline', alias: { 'react': resolve('node_modules/react'), 'react-dom': resolve('node_modules/react-dom') }, define: { '__RSP_ICON__': JSON.stringify(await readFile('docs/site/public/rsp-icon.svg', 'utf8')), 'process.env.NODE_ENV': '"production"', 'import.meta.env': JSON.stringify({ DEV: false, PROD: true, MODE: 'production' }) } })
execFileSync(process.execPath, ['node_modules/@tailwindcss/cli/dist/index.mjs', '-i', 'src/viewer/web/style.css', '-o', 'dist/viewer/app.css', '--minify'], { stdio: 'inherit' })
await copyFile('src/viewer/web/ui/NOTICE.txt', 'dist/viewer/NOTICE.txt')
const hash = createHash('sha256')
for (const file of (await readdir('dist', { recursive: true })).map(file => file.split(sep).join('/')).sort()) {
  if (/\.(?:mjs|js|css)$/.test(file))
    hash.update(file).update(await readFile(`dist/${file}`))
}
await writeFile('dist/viewer-build.json', JSON.stringify({ identity: hash.digest('hex') }))
