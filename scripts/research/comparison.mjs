import { verifyEvidence } from './evidence.mjs'
import { patternExpression } from './sources.mjs'
import { errorDetails } from './storage.mjs'

export function scopeMatcher(origin) {
  if (origin.selectedFiles) {
    const files = new Set(origin.selectedFiles)
    return path => files.has(path)
  }
  const patterns = origin.paths.map(patternExpression)
  return path => patterns.some(pattern => pattern.test(path))
}

// Compare retained inventories, never acquisition caches or inferred Git history.
export function compareManifests(before, after) {
  const a = before.origin
  const b = after.origin
  if (a.kind !== 'git' || b.kind !== 'git' || a.repository !== b.repository || a.ref !== b.ref)
    return { comparable: false, reason: 'Different origin, repository or tracked ref; select a matching baseline', changes: [] }
  const beforeScope = scopeMatcher(a)
  const afterScope = scopeMatcher(b)
  const left = new Map(before.files.map(file => [file.path, file]))
  const right = new Map(after.files.map(file => [file.path, file]))
  const changes = []
  for (const path of [...new Set([...left.keys(), ...right.keys()])].sort()) {
    const old = left.get(path)
    const current = right.get(path)
    let kind
    if (!old)
      kind = beforeScope(path) ? 'added' : 'entered-scope'
    else if (!current)
      kind = afterScope(path) ? 'deleted' : 'left-scope'
    else if (old.sha256 !== current.sha256 || old.mode !== current.mode)
      kind = 'modified'
    if (kind)
      changes.push({ path, kind, before: old ?? null, after: current ?? null })
  }
  return {
    comparable: true,
    revisionChanged: a.revision !== b.revision,
    scopeChanged: JSON.stringify(a.selectedFiles ?? [...a.paths].sort()) !== JSON.stringify(b.selectedFiles ?? [...b.paths].sort()) || Boolean(a.selectedFiles) !== Boolean(b.selectedFiles),
    changes,
  }
}

export async function compareEvidence(root, before, after) {
  const left = await verifyEvidence(root, before)
  const right = await verifyEvidence(root, after)
  return { before, after, integrity: 'valid', ...compareManifests(left.manifest, right.manifest) }
}

export function compareRepositoryEntries(before, after) {
  if (before.config.repository !== after.config.repository || before.config.ref !== after.config.ref)
    return { comparable: false, changes: [] }
  const left = new Map(before.inventory.map(file => [file.path, file]))
  const right = new Map(after.inventory.map(file => [file.path, file]))
  const changes = []
  for (const path of [...new Set([...left.keys(), ...right.keys()])].sort()) {
    const old = left.get(path)
    const current = right.get(path)
    if (!old || !current || old.object !== current.object || old.mode !== current.mode || old.type !== current.type)
      changes.push({ path, kind: !old ? 'added' : !current ? 'deleted' : 'modified' })
  }
  return { comparable: true, changes }
}

// Repository discovery depends only on batch records, not selected evidence payloads.
export async function compareRefreshRecords(root, before, after) {
  const comparison = []
  for (const entry of after.sources) {
    const prior = before?.sources.find(item => item.source === entry.source)
    if (entry.status !== 'captured' || prior?.status !== 'captured') {
      comparison.push({ source: entry.source, status: entry.status === 'failed' ? 'acquisition-failed' : 'no-baseline' })
      continue
    }
    const repository = compareRepositoryEntries(prior, entry)
    let scoped
    try {
      scoped = { status: 'compared', ...await compareEvidence(root, prior.evidence, entry.evidence) }
    }
    catch (error) {
      scoped = { status: 'comparison-unavailable', error: errorDetails(error) }
    }
    comparison.push({ source: entry.source, ...scoped, repository, repositoryChanges: repository.comparable ? repository.changes.map(change => change.path) : null })
  }
  return comparison
}
