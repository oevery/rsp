import { lstat, readdir, readFile, realpath } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { capturePath, captureRef, evidenceMetadata, readIndex, timestamp, validateCapture } from './catalog.mjs'
import { withLock } from './locking.mjs'
import { ensureDirectory, fail, portablePath, publishFile, replaceJson, slug } from './storage.mjs'

export { evidenceMetadata }

export async function retain(root, { origin, files }, declarations = {}) {
  return withLock(root, 'index', async () => {
    const index = await readIndex(root)
    const git = origin.kind === 'git'
    const name = slug(git ? origin.source : origin.name)
    let id = `${name}@${git ? origin.revision : timestamp()}`
    if (!git) {
      if (name === 'refresh')
        fail('invalid', 'Choose an import name other than the reserved refresh prefix')
      while (index.captures[id]) {
        await new Promise(resolve => setTimeout(resolve, 1))
        id = `${name}@${timestamp()}`
      }
    }
    captureRef(id)
    const prior = index.captures[id]
    if (prior && prior.repository !== origin.repository)
      fail('invalid', 'Source name belongs to another repository; use a distinct name')
    const capture = git
      ? { repository: origin.repository, paths: [...new Set([...(prior?.paths ?? []), ...origin.paths])].sort() }
      : { origin: origin.origin, ...declarations }
    if (prior?.path)
      capture.path = prior.path
    let width = 12
    while (Object.entries(index.captures).some(([other, record]) => other !== id && capturePath(other, record) === capturePath(id, capture))) {
      width += 4
      capture.path = `research/captures/${name}@${origin.revision.slice(0, width)}`
    }
    validateCapture(id, capture)
    const path = capturePath(id, capture)
    // Matching files are reused; conflicting user bytes are never overwritten.
    for (const file of files)
      await publishFile(root, `${path}/${portablePath(file.path)}`, file.bytes)
    await ensureDirectory(root, path)
    index.captures[id] = capture
    const changed = await replaceJson(root, 'research/index.json', index)
    return { id, created: !prior, changed, capture, path, local: 'present' }
  })
}
export async function importEvidence(root, options) {
  if (typeof options.origin !== 'string' || !options.origin.trim() || typeof options.file !== 'string' || !options.file)
    fail('invalid', 'import requires --file and a declared --origin')
  const suppliedRoot = resolve(root)
  const canonicalRoot = await realpath(suppliedRoot)
  const suppliedInput = resolve(suppliedRoot, options.file)
  // An absolute input may use either spelling of an aliased workspace root.
  // Classify both before resolving parents so internal links cannot disappear.
  const withinRoot = [suppliedRoot, canonicalRoot]
    .map(base => relative(base, suppliedInput))
    .find(path => !path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path))
  const scoped = withinRoot !== undefined
  // External parents are location aliases, not selected material. Resolve only
  // the parent so the selected entry and every imported child still reject links.
  const input = scoped ? resolve(canonicalRoot, withinRoot) : join(await realpath(dirname(suppliedInput)), basename(suppliedInput))
  // Workspace ancestors may be platform aliases (for example /var on macOS).
  // Inside the canonical workspace, reject links along the selected path.
  let current = input
  while (true) {
    if ((await lstat(current)).isSymbolicLink())
      fail('invalid', `Import does not follow symlinks: ${current}`)
    if (!scoped || current === canonicalRoot)
      break
    const parent = resolve(current, '..')
    if (parent === current)
      break
    current = parent
  }
  const files = []
  async function walk(path, name) {
    const info = await lstat(path)
    if (info.isSymbolicLink())
      fail('invalid', `Import does not follow symlinks: ${name}`)
    if (info.isDirectory()) {
      for (const child of (await readdir(path)).sort())
        await walk(join(path, child), name ? `${name}/${child}` : child)
    }
    else if (info.isFile()) {
      portablePath(name)
      files.push({ path: name, mode: info.mode & 0o111 ? '100755' : '100644', bytes: await readFile(path) })
    }
    else {
      fail('invalid', `Import requires regular files: ${name}`)
    }
  }
  await walk(input, (await lstat(input)).isDirectory() ? '' : basename(input))
  if (!files.length)
    fail('invalid', 'Import contains no regular files')
  const declarations = {}
  for (const key of ['license', 'limitations']) {
    if (options[key] !== undefined)
      declarations[key] = options[key]
  }
  return retain(root, { origin: { kind: 'import', origin: options.origin, name: options.name ?? basename(input).replace(/[^a-z0-9-]+/gi, '-').toLowerCase() }, files }, declarations)
}
