import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, symlinkSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative } from 'node:path'
import { parse } from 'yaml'
import { hash, treeFiles } from './files.mjs'

// Reconstruct the resolved package graph entirely within the disposable workspace.
// Links connect copied packages only; no link points into the maintainer checkout.
export function copyDependencies(root, destination, { build = false, lockSource } = {}) {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const lock = readFileSync(join(root, 'pnpm-lock.yaml'), 'utf8')
  if (lockSource && lockSource !== lock)
    throw new Error('Fixed project lock differs from installed dependency source')
  const installedLock = readFileSync(join(root, 'node_modules/.pnpm/lock.yaml'), 'utf8')
  const wanted = parse(lock)
  const installed = parse(installedLock)
  if (hash(wanted.importers) !== hash(installed.importers) || hash(wanted.packages) !== hash(installed.packages))
    throw new Error('Installed dependency lock is stale')
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
  function copy(name, from) {
    const source = locate(name, from)
    if (copied.has(source))
      return copied.get(source)
    const manifest = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'))
    if (!wanted.packages[`${manifest.name}@${manifest.version}`])
      throw new Error('Resolved dependency is absent from the frozen lock')
    const target = join(destination, '.snapshot', hash(relative(join(root, 'node_modules'), source)).slice(0, 16), 'node_modules', name)
    copied.set(source, target)
    versions[`${name}@${manifest.version}`] = true
    cpSync(source, target, { recursive: true, dereference: true, filter: p => p === source || !relative(source, p).split('/').includes('node_modules') })
    for (const child of new Set([...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.optionalDependencies ?? {}), ...Object.keys(manifest.peerDependencies ?? {})])) {
      let childSource
      try {
        childSource = locate(child, source)
      }
      catch {
        if (manifest.dependencies?.[child])
          throw new Error('Required dependency missing')
        continue
      }
      const childTarget = copied.get(childSource) ?? copy(child, source)
      const link = join(dirname(target), ...(name.startsWith('@') ? ['..'] : []), child)
      mkdirSync(dirname(link), { recursive: true })
      if (!existsSync(link))
        symlinkSync(relative(dirname(link), childTarget), link, 'dir')
    }
    return target
  }
  mkdirSync(destination, { recursive: true })
  for (const name of new Set([...Object.keys(pkg.dependencies), ...(build ? ['tsup', 'typescript'] : [])])) {
    const source = locate(name, root)
    const actual = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8')).version
    const item = wanted.importers['.'].dependencies?.[name] ?? wanted.importers['.'].devDependencies?.[name]
    if (!item || item.version.split('(')[0] !== actual)
      throw new Error('Installed direct dependency differs from lock')
    const target = copy(name, root)
    const link = join(destination, name)
    mkdirSync(dirname(link), { recursive: true })
    symlinkSync(relative(dirname(link), target), link, 'dir')
  }
  return { lockHash: hash(lock), treeHash: hash(treeFiles(destination)), packages: Object.keys(versions).sort() }
}
