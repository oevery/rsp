import { createHash } from 'node:crypto'
import { lstat, readdir, readFile } from 'node:fs/promises'
import { join, sep } from 'node:path'

export const viewerEntries = { app: 'app.js', style: 'app.css', mermaid: 'mermaid.js' }
const mismatch = () => new Error('Viewer assets do not match the startup build; rebuild or reinstall and retry')

/** @param {unknown} paths */
export function validateAssetPaths(paths) {
  if (!Array.isArray(paths)
    || paths.some(path => typeof path !== 'string' || !/^(?:[\w-]+\/)*[\w-]+\.(?:js|css)$/.test(path))
    || new Set(paths).size !== paths.length
    || Object.values(viewerEntries).some(path => !paths.includes(path))) {
    throw mismatch()
  }
  return /** @type {string[]} */ (paths)
}

/** @param {string} source */
export function parseBuildManifest(source) {
  const manifest = JSON.parse(source)
  if (!manifest || typeof manifest.identity !== 'string' || !/^[a-f0-9]{64}$/.test(manifest.identity))
    throw mismatch()
  return { identity: /** @type {string} */ (manifest.identity), assets: validateAssetPaths(manifest.assets) }
}

/**
 * Hash every executable build input while retaining only explicitly public assets.
 * @param {string} root
 * @param {string[]} paths
 */
export async function readBuildSnapshot(root, paths) {
  const allowed = new Set(validateAssetPaths(paths))
  const hash = createHash('sha256')
  /** @type {Map<string, { content: Buffer, type: string }>} */
  const assets = new Map()
  const directory = join(root, 'dist')
  for (const file of (await readdir(directory, { recursive: true })).map(file => file.split(sep).join('/')).sort()) {
    if (!/\.(?:mjs|js|css)$/.test(file))
      continue
    const path = join(directory, file)
    if (!(await lstat(path)).isFile())
      throw mismatch()
    const content = await readFile(path)
    hash.update(file).update(content)
    if (file.startsWith('viewer/') && allowed.has(file.slice('viewer/'.length))) {
      assets.set(`/${file.slice('viewer/'.length)}`, {
        content,
        type: file.endsWith('.css') ? 'text/css' : 'text/javascript',
      })
    }
  }
  if (assets.size !== allowed.size)
    throw mismatch()
  return { identity: hash.digest('hex'), assets }
}
