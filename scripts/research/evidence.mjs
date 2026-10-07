import { lstat, readdir, readFile, realpath } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { errorDetails, fail, hash, ID, inventory, jsonBytes, portablePath, publishBundle, readBytes, readJson } from './storage.mjs'

function validateManifest(manifest) {
  if (!manifest || manifest.version !== 1 || !manifest.origin || !['git', 'import'].includes(manifest.origin.kind) || !Array.isArray(manifest.files) || !manifest.files.length)
    fail('corrupt', 'Evidence manifest must contain version, origin and a nonempty inventory')
  const seen = new Set()
  for (const file of manifest.files) {
    if (!file || typeof file !== 'object')
      fail('corrupt', 'Evidence inventory entries must be file records')
    portablePath(file.path)
    if (seen.has(file.path) || !ID.test(file.sha256) || !Number.isSafeInteger(file.size) || file.size < 0 || !['100644', '100755'].includes(file.mode))
      fail('corrupt', `Invalid or duplicate evidence inventory entry: ${file.path}`)
    seen.add(file.path)
  }
  if (manifest.origin.kind === 'git') {
    if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(manifest.origin.revision) || typeof manifest.origin.repository !== 'string' || !manifest.origin.repository || !Array.isArray(manifest.origin.paths))
      fail('corrupt', 'Git evidence origin lacks repository, commit or scope')
    manifest.origin.paths.forEach(portablePath)
  }
  else if (typeof manifest.origin.origin !== 'string' || !manifest.origin.origin.trim()) {
    fail('corrupt', 'Imported evidence requires its declared origin')
  }
}

export async function evidenceMetadata(root, id) {
  if (!ID.test(id))
    fail('invalid', 'Evidence identity must be a full SHA-256 hash')
  const { value: manifest } = await readJson(root, `research/evidence/${id}/manifest.json`)
  return { id, manifest, integrity: 'not-checked' }
}

export async function verifyEvidence(root, id) {
  if (!ID.test(id))
    fail('invalid', 'Evidence identity must be a full SHA-256 hash')
  const prefix = `research/evidence/${id}`
  const { bytes, value: manifest } = await readJson(root, `${prefix}/manifest.json`)
  if (hash(bytes) !== id)
    fail('corrupt', `Evidence manifest hash differs from identity: ${id}`)
  try {
    validateManifest(manifest)
  }
  catch (error) {
    if (errorDetails(error).kind === 'invalid')
      fail('corrupt', error.message)
    throw error
  }
  for (const file of manifest.files) {
    const payload = await readBytes(root, `${prefix}/files/${file.path}`)
    if (payload.length !== file.size || hash(payload) !== file.sha256)
      fail('corrupt', `Evidence payload hash/size differs: ${id}/${file.path}`)
  }
  const expected = manifest.files.map(file => file.path).sort()
  if (JSON.stringify(await inventory(root, `${prefix}/files`)) !== JSON.stringify(expected))
    fail('corrupt', `Evidence contains unrecorded payloads: ${id}`)
  return { id, integrity: 'valid', manifest }
}

export async function retain(root, { origin, files }, declarations = {}) {
  files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)
  const manifest = {
    version: 1,
    origin,
    ...declarations,
    files: files.map(file => ({ path: file.path, mode: file.mode, size: file.bytes.length, sha256: hash(file.bytes) })),
  }
  validateManifest(manifest)
  const bytes = jsonBytes(manifest)
  const id = hash(bytes)
  const created = await publishBundle(root, id, bytes, files, () => verifyEvidence(root, id))
  return { id, created, path: `research/evidence/${id}`, manifest, integrity: 'valid' }
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
  return retain(root, { origin: { kind: 'import', origin: options.origin }, files }, declarations)
}

export async function checkEvidence(root, id) {
  try {
    return await verifyEvidence(root, id)
  }
  catch (error) {
    return { id, integrity: errorDetails(error).kind, error: errorDetails(error) }
  }
}
