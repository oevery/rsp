import { readFileSync, realpathSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parseCase } from './cases.mjs'
import { hash, treeFiles } from './files.mjs'

export function loadHoldout(root, registryPath, privateRoot) {
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'))
  if (registry.schema !== 'rsp-holdout-v1' || !Array.isArray(registry.cases) || !registry.cases.length)
    throw new Error('Holdout registry must contain versioned case hashes')
  const location = realpathSync(privateRoot)
  const rel = relative(realpathSync(root), location)
  if (rel !== '..' && !rel.startsWith('../'))
    throw new Error('Private holdout inputs must be outside the repository')
  if (new Set(registry.cases.map(item => item.id)).size !== registry.cases.length)
    throw new Error('Duplicate holdout case IDs')
  return registry.cases.map((item) => {
    if (!/^[a-z0-9][a-z0-9-]*$/u.test(item.id) || typeof item.version !== 'string' || !item.version || !/^[a-f0-9]{64}$/u.test(item.sha256) || !Array.isArray(item.tags))
      throw new Error('Invalid holdout identity')
    const directory = join(location, item.id)
    const inputHash = hash(treeFiles(directory, { rejectLinks: true }))
    if (inputHash !== item.sha256)
      throw new Error(`Holdout hash mismatch: ${item.id}`)
    const manifestPath = join(directory, 'case.yaml')
    const manifest = parseCase(manifestPath, directory)
    if (manifest.id !== item.id)
      throw new Error('Holdout ID mismatch')
    return { directory, manifestPath, id: item.id, manifest, inputHash, visibility: 'holdout', version: item.version, provenance: registry.provenance ?? null }
  })
}
