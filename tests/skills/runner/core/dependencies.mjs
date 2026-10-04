import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, symlinkSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative } from 'node:path'
import { parseYamlDocument } from '../../../../src/core/yaml.mjs'
import { hash, treeFiles } from './files.mjs'

// Reconstruct the selected frozen graph entirely within the disposable workspace.
// The installed source graph must be current; selected package identities and
// every copied dependency edge must match the snapshot's own lock.
export function copyDependencies(root, destination, { build = false, lockSource, packageSource } = {}) {
  const pkg = JSON.parse(packageSource ?? readFileSync(join(root, 'package.json'), 'utf8'))
  const currentLock = readFileSync(join(root, 'pnpm-lock.yaml'), 'utf8')
  const installedLock = readFileSync(join(root, 'node_modules/.pnpm/lock.yaml'), 'utf8')
  const current = parseYamlDocument(currentLock).toJS()
  const installed = parseYamlDocument(installedLock).toJS()
  if (hash(current.importers) !== hash(installed.importers) || hash(current.packages) !== hash(installed.packages))
    throw new Error('Installed dependency lock is stale')
  const lock = lockSource ?? currentLock
  const wanted = parseYamlDocument(lock).toJS()
  const copied = new Map()
  const versions = {}
  const locate = (name, from) => {
    const resolver = createRequire(join(from, 'package.json'))
    for (const base of resolver.resolve.paths(name) ?? []) {
      const candidate = join(base, name)
      if (existsSync(join(candidate, 'package.json')))
        return realpathSync(candidate)
    }
    throw new Error('Installed dependency unavailable')
  }
  function copy(name, from, lockedVersion) {
    const source = locate(name, from)
    const manifest = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'))
    if (manifest.name !== name || manifest.version !== lockedVersion.split('(')[0])
      throw new Error('Installed dependency differs from selected frozen lock')
    const identity = `${manifest.name}@${manifest.version}`
    if (!wanted.packages[identity] || hash(wanted.packages[identity]) !== hash(installed.packages[identity]))
      throw new Error('Resolved dependency provenance differs from selected frozen lock')
    const snapshot = wanted.snapshots[`${manifest.name}@${lockedVersion}`]
    if (!snapshot)
      throw new Error('Resolved dependency snapshot is absent from selected frozen lock')
    const key = `${source}:${lockedVersion}`
    if (copied.has(key))
      return copied.get(key)
    const target = join(destination, '.snapshot', hash(`${relative(join(root, 'node_modules'), source)}:${lockedVersion}`).slice(0, 16), 'node_modules', name)
    copied.set(key, target)
    versions[identity] = true
    cpSync(source, target, { recursive: true, dereference: true, filter: p => p === source || !relative(source, p).split('/').includes('node_modules') })
    for (const child of new Set([...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.optionalDependencies ?? {}), ...Object.keys(manifest.peerDependencies ?? {})])) {
      const lockedChild = snapshot.dependencies?.[child] ?? snapshot.optionalDependencies?.[child]
      if (!lockedChild) {
        if (manifest.dependencies?.[child])
          throw new Error('Required dependency edge is absent from selected frozen lock')
        continue
      }
      try {
        locate(child, source)
      }
      catch {
        if (manifest.dependencies?.[child])
          throw new Error('Required dependency missing')
        continue
      }
      const childTarget = copy(child, source, lockedChild)
      const link = join(dirname(target), ...(name.startsWith('@') ? ['..'] : []), child)
      mkdirSync(dirname(link), { recursive: true })
      if (!existsSync(link))
        symlinkSync(relative(dirname(link), childTarget), link, 'dir')
    }
    return target
  }
  mkdirSync(destination, { recursive: true })
  for (const name of new Set([...Object.keys(pkg.dependencies), ...(build ? ['tsup', 'typescript'] : [])])) {
    const item = wanted.importers['.'].dependencies?.[name] ?? wanted.importers['.'].devDependencies?.[name]
    if (!item)
      throw new Error('Direct dependency is absent from selected frozen lock')
    const target = copy(name, root, item.version)
    const link = join(destination, name)
    mkdirSync(dirname(link), { recursive: true })
    symlinkSync(relative(dirname(link), target), link, 'dir')
  }
  return { lockHash: hash(lock), treeHash: hash(treeFiles(destination)), packages: Object.keys(versions).sort() }
}
