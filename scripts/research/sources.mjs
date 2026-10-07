import { Buffer } from 'node:buffer'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, rename, rm } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'
import { promisify } from 'node:util'
import { parse } from 'yaml'
import { ensureDirectory, exists, fail, portablePath, readBytes, safePath, slug } from './storage.mjs'

const execute = promisify(execFile)
const OBJECT = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/
// Bind each synchronized candidate atomically to its repository/ref selection.
function candidateRef(source) {
  const key = createHash('sha256').update(JSON.stringify([source.repository, source.ref])).digest('hex')
  return `refs/rsp/research/candidates/${key}`
}

export async function sourceRegistry(root) {
  let registry
  try {
    registry = parse((await readBytes(root, 'research/sources.yaml')).toString('utf8'))
  }
  catch (error) {
    if (error.name === 'YAMLParseError')
      fail('invalid', `Invalid research/sources.yaml: ${error.message}`)
    throw error
  }
  if (registry?.version !== 1 || !registry.sources || typeof registry.sources !== 'object')
    fail('invalid', 'research/sources.yaml must contain version: 1 and a sources mapping')
  return registry.sources
}

export async function sourceConfig(root, id, registry) {
  registry ??= await sourceRegistry(root)
  slug(id)
  const source = registry[id]
  if (!source)
    fail('invalid', `Unknown source ${id}; register repository, ref and paths in research/sources.yaml`)
  if (typeof source.repository !== 'string' || (!source.repository.startsWith('https://') && !isAbsolute(source.repository)))
    fail('invalid', `${id}.repository must be HTTPS or an absolute local path`)
  if (typeof source.ref !== 'string' || !/^\w[\w./-]*$/.test(source.ref) || source.ref.includes('..') || source.ref.includes('@{'))
    fail('invalid', `${id}.ref must be a plain tracked Git ref`)
  const paths = source.paths ?? ['**']
  if (!Array.isArray(paths) || paths.length === 0)
    fail('invalid', `${id}.paths must be a nonempty array of relative patterns`)
  paths.forEach(portablePath)
  return { repository: source.repository, ref: source.ref, paths: [...new Set(paths)].sort() }
}

async function gitOnce(cache, args, { fetch = false, binary = false, input, maxBuffer = 512 * 1024 * 1024 } = {}) {
  const env = { ...process.env }
  for (const key of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_NAMESPACE'])
    delete env[key]
  Object.assign(env, { GIT_NO_LAZY_FETCH: fetch ? '0' : '1', GIT_NO_REPLACE_OBJECTS: '1', GIT_ALLOW_PROTOCOL: fetch ? 'https:file' : '', GIT_TERMINAL_PROMPT: '0', GIT_OPTIONAL_LOCKS: '0', GIT_LFS_SKIP_SMUDGE: '1' })
  try {
    const pending = execute('git', ['-c', 'core.hooksPath=/dev/null', ...args], { cwd: cache, env, encoding: binary ? 'buffer' : 'utf8', maxBuffer, timeout: args[0] === 'clone' ? 300000 : fetch ? 120000 : 60000 })
    let inputError
    if (input !== undefined) {
      pending.child.stdin.on('error', (error) => {
        inputError = error
      })
      pending.child.stdin.end(input)
    }
    const { stdout } = await pending
    if (inputError)
      throw inputError
    return binary ? stdout : stdout.trim()
  }
  catch (error) {
    const message = error.killed ? `Timed out during ${args[0]}` : error.stderr?.toString().trim() || error.message
    if (!fetch && /not a valid object|bad object|could not (?:read|get object)|unable to read|invalid object name|missing blob|not a valid commit|needed a single revision|could not fetch.*promisor|git cat-file .*: bad file/i.test(message))
      fail('unavailable', `Git objects are unavailable locally; explicit sync may recover them: ${message}`)
    fail(error.killed ? 'timeout' : fetch && /TLS|timed out|reset|resolve host|HTTP (?:429|5\d\d)|remote end hung/i.test(message) ? 'network' : 'operational-error', `git ${args[0]} failed: ${message}`)
  }
}

// Fetch is repeat-safe; failed clone destinations require cleanup before retry.
export async function git(cache, args, options = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await gitOnce(cache, args, options)
    }
    catch (error) {
      if (args[0] !== 'fetch' || error.kind !== 'network' || attempt >= 2)
        throw error
      await new Promise(resolve => setTimeout(resolve, 250 * 2 ** attempt))
    }
  }
}

export async function localCache(root, id, source) {
  const cache = await safePath(root, `.cache/research/sources/${id}`)
  if (!await exists(cache))
    fail('unavailable', `No local cache for ${id}; run sync ${id} explicitly`)
  const repository = await git(cache, ['remote', 'get-url', 'origin'])
  if (repository !== source.repository)
    fail('invalid', `Cached repository differs from research/sources.yaml for ${id}; move the old cache before explicit sync`)
  return cache
}

export async function syncSource(root, id, source) {
  source ??= await sourceConfig(root, id)
  const store = await ensureDirectory(root, '.cache/research/sources')
  const destination = await safePath(root, `.cache/research/sources/${id}`)
  let temporary
  try {
    const cache = await exists(destination)
      ? await localCache(root, id, source)
      : (temporary = await mkdtemp(join(store, `.sync-${id}-`)))
    if (temporary) {
      for (let attempt = 0; ; attempt++) {
        try {
          await git(root, ['clone', '--bare', '--no-tags', '--', source.repository, cache], { fetch: true })
          break
        }
        catch (error) {
          if (error.kind !== 'network' || attempt >= 2)
            throw error
          await rm(cache, { recursive: true, force: true })
          await new Promise(resolve => setTimeout(resolve, 250 * 2 ** attempt))
        }
      }
    }
    const candidate = candidateRef(source)
    await git(cache, ['fetch', '--no-tags', '--no-write-fetch-head', 'origin', `+${source.ref}:${candidate}`], { fetch: true })
    const revision = await git(cache, ['rev-parse', '--verify', `${candidate}^{commit}`])
    if (temporary)
      await rename(temporary, destination)
    return { source: id, revision, cache: `.cache/research/sources/${id}`, acquisition: 'explicit-sync' }
  }
  finally {
    if (temporary)
      await rm(temporary, { recursive: true, force: true })
  }
}

export async function currentRevision(root, id, source) {
  if (!await exists(await safePath(root, `.cache/research/sources/${id}`)))
    return null
  const cache = await localCache(root, id, source)
  const candidate = candidateRef(source)
  const found = await git(cache, ['for-each-ref', '--format=%(refname)', candidate])
  return found.split('\n').includes(candidate) ? git(cache, ['rev-parse', '--verify', `${candidate}^{commit}`]) : null
}

export function patternExpression(pattern) {
  portablePath(pattern)
  let expression = ''
  for (let i = 0; i < pattern.length; i++) {
    const character = pattern[i]
    if (character === '*' && pattern[i + 1] === '*') {
      if (pattern[i + 2] === '/') {
        expression += '(?:.*/)?'
        i += 2
      }
      else {
        expression += '.*'
        i++
      }
    }
    else if (character === '*') {
      expression += '[^/]*'
    }
    else if (character === '?') {
      expression += '[^/]'
    }
    else {
      expression += character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
  }
  return new RegExp(`^${expression}$`, 's')
}

async function readBlobs(cache, selected) {
  if (!selected.length)
    return []
  const request = files => `${files.map(file => file.object).join('\n')}\n`
  const headers = (await git(cache, ['cat-file', '--batch-check'], { input: request(selected) })).split('\n')
  if (headers.length !== selected.length)
    fail('operational-error', 'Unexpected Git object inventory length')
  const objects = selected.map((file, index) => {
    const header = headers[index]
    if (header === `${file.object} missing`)
      fail('unavailable', `Git object is unavailable locally; explicit sync may recover it: ${file.object}`)
    const match = /^([a-f0-9]+) blob (\d+)$/.exec(header)
    const size = Number(match?.[2])
    if (!match || match[1] !== file.object || !Number.isSafeInteger(size))
      fail('operational-error', 'Unexpected Git blob inventory')
    return { ...file, size, header: Buffer.from(`${header}\n`) }
  })
  const files = []
  for (let start = 0; start < objects.length;) {
    let end = start
    let length = 0
    // A transfer target, not an evidence/file-size limit: an oversized blob
    // gets its own batch. Retention still owns the complete selected payload.
    while (end < objects.length && (end === start || length + objects[end].size + objects[end].header.length + 1 <= 32 * 1024 * 1024)) {
      length += objects[end].size + objects[end].header.length + 1
      end++
    }
    const batch = objects.slice(start, end)
    const bytes = await git(cache, ['cat-file', '--batch'], { binary: true, input: request(batch), maxBuffer: Math.max(length, 64 * 1024) })
    let offset = 0
    for (const file of batch) {
      const missing = Buffer.from(`${file.object} missing\n`)
      if (bytes.subarray(offset, offset + missing.length).equals(missing))
        fail('unavailable', `Git object is unavailable locally; explicit sync may recover it: ${file.object}`)
      if (!bytes.subarray(offset, offset + file.header.length).equals(file.header))
        fail('operational-error', 'Unexpected Git blob response header')
      offset += file.header.length
      const next = offset + file.size
      if (bytes[next] !== 10)
        fail('operational-error', 'Incomplete Git blob response')
      files.push({ path: file.path, mode: file.mode, object: file.object, bytes: bytes.subarray(offset, next) })
      offset = next + 1
    }
    if (offset !== bytes.length)
      fail('operational-error', 'Unexpected trailing Git blob bytes')
    start = end
  }
  return files
}

export async function captureSource(root, id, options = {}) {
  const source = options.source ?? await sourceConfig(root, id)
  const cache = await localCache(root, id, source)
  const revision = options.revision ?? await git(cache, ['rev-parse', '--verify', `${candidateRef(source)}^{commit}`])
  if (!OBJECT.test(revision))
    fail('invalid', '--revision must be a full Git commit id')
  if (await git(cache, ['cat-file', '-t', revision]) !== 'commit')
    fail('invalid', '--revision must identify a commit')
  const paths = options.paths?.length ? [...new Set(options.paths.map(portablePath))].sort() : source.paths
  const patterns = paths.map(patternExpression)
  const treeBytes = await git(cache, ['ls-tree', '-rz', '--full-tree', revision], { binary: true })
  const treeText = treeBytes.toString('utf8')
  if (!Buffer.from(treeText).equals(treeBytes))
    fail('invalid', 'Capture requires UTF-8 source filenames; select a repository with portable names')
  const tree = treeText.split('\0').filter(Boolean)
  const selected = []
  for (const entry of tree) {
    const match = /^(\d+) (\w+) ([a-f0-9]+)\t([\s\S]+)$/.exec(entry)
    if (!match)
      fail('operational-error', 'Unexpected Git tree inventory')
    const [, mode, type, object, path] = match
    if (!patterns.some(pattern => pattern.test(path)))
      continue
    portablePath(path)
    if (type !== 'blob' || !['100644', '100755'].includes(mode))
      fail('invalid', `Capture scope includes a symlink or submodule: ${path}; select ordinary files explicitly`)
    selected.push({ path, mode, object })
  }
  const files = await readBlobs(cache, selected)
  await git(cache, ['update-ref', `refs/rsp/research/retained/${revision}`, revision])
  const selection = options.revision === undefined ? { ref: source.ref } : { selection: 'explicit-revision' }
  return { origin: { kind: 'git', source: id, repository: source.repository, ...selection, revision, paths }, files }
}
