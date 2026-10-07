import { exists, fail, portablePath, readJson, safePath } from './storage.mjs'

export const STAMP = /^\d{8}T\d{9}Z$/
export const COMMIT = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/
export function timestamp(date = new Date()) {
  return date.toISOString().replace(/[-:.]/g, '')
}

export function captureRef(value) {
  const match = typeof value === 'string' && /^([a-z0-9][a-z0-9-]*)@([a-f0-9]{40}|[a-f0-9]{64}|\d{8}T\d{9}Z)$/.exec(value)
  if (!match)
    fail('invalid', 'Expected source@full-commit or name@UTC-timestamp')
  return { source: match[1], revision: match[2], git: COMMIT.test(match[2]) }
}

export function capturePath(id, record = {}) {
  const { source, revision, git } = captureRef(id)
  const path = record.path ?? `research/captures/${source}@${git ? revision.slice(0, 12) : revision}`
  portablePath(path)
  const suffix = path.slice('research/captures/'.length)
  const matches = git ? id.startsWith(suffix) && suffix.split('@')[1]?.length >= 12 : suffix === id
  if (!path.startsWith('research/captures/') || path.split('/').length !== 3 || !matches)
    fail('invalid', 'Invalid capture directory')
  return path
}

export function validateCapture(id, record) {
  const { git } = captureRef(id)
  if (!record || typeof record !== 'object' || Array.isArray(record))
    fail('invalid', 'Invalid capture record')
  capturePath(id, record)
  if (git) {
    if (typeof record.repository !== 'string' || !record.repository || !Array.isArray(record.paths) || !record.paths.length)
      fail('invalid', 'Git capture needs repository and selection')
    record.paths.forEach(portablePath)
  }
  else if (typeof record.origin !== 'string' || !record.origin.trim()) {
    fail('invalid', 'Imported capture needs a declared origin')
  }
}

export async function readIndex(root) {
  if (!await exists(await safePath(root, 'research/index.json')))
    return { version: 3, captures: {} }
  const { value } = await readJson(root, 'research/index.json')
  if (value?.version !== 3 || !value.captures || typeof value.captures !== 'object' || Array.isArray(value.captures))
    fail('invalid', 'Invalid research/index.json')
  const paths = new Set()
  for (const [id, record] of Object.entries(value.captures)) {
    validateCapture(id, record)
    const path = capturePath(id, record)
    if (paths.has(path))
      fail('invalid', 'Capture directories overlap')
    paths.add(path)
  }
  return value
}

export async function evidenceMetadata(root, id) {
  captureRef(id)
  const capture = (await readIndex(root)).captures[id]
  if (!capture)
    fail('unavailable', `Capture is not in research/index.json: ${id}`)
  const path = capturePath(id, capture)
  return { id, capture, path, local: await exists(await safePath(root, path)) ? 'present' : 'missing' }
}
