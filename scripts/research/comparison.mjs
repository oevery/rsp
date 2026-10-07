import { captureRef, COMMIT, evidenceMetadata } from './catalog.mjs'
import { git, localCache, patternExpression } from './sources.mjs'
import { errorDetails, fail } from './storage.mjs'

// Git owns version differences. Materialized payloads and the registry may be absent.
export async function compareRevisions(root, source, repository, before, after) {
  if (!COMMIT.test(before) || !COMMIT.test(after))
    fail('invalid', 'Comparison needs full Git commit IDs')
  const cache = await localCache(root, source, { repository })
  const bytes = await git(cache, ['diff', '--no-ext-diff', '--no-textconv', '--no-renames', '--name-status', '-z', before, after, '--'], { binary: true })
  const fields = bytes.toString('utf8').split('\0')
  fields.pop()
  const changes = []
  for (let i = 0; i < fields.length; i += 2)
    changes.push({ path: fields[i + 1], kind: ({ A: 'added', D: 'deleted', M: 'modified', T: 'type-changed' })[fields[i]] ?? fields[i] })
  return changes
}

export async function compareEvidence(root, before, after) {
  const a = captureRef(before)
  const b = captureRef(after)
  const left = (await evidenceMetadata(root, before)).capture
  const right = (await evidenceMetadata(root, after)).capture
  if (!a.git || !b.git || left.repository !== right.repository)
    return { before, after, comparable: false, reason: 'Select two Git captures from the same repository' }
  return { before, after, comparable: true, changes: await compareRevisions(root, b.source, right.repository, a.revision, b.revision) }
}

export async function compareRefreshRecords(root, before, after) {
  const comparison = []
  for (const entry of after.sources) {
    const prior = before?.sources.find(item => item.source === entry.source)
    const baseline = before ? prior?.revision : entry.before
    if (entry.status !== 'captured' || (before && prior?.status !== 'captured') || !baseline) {
      comparison.push({ source: entry.source, status: entry.status === 'failed' ? 'acquisition-failed' : 'no-baseline' })
      continue
    }
    if (before && prior.config.repository !== entry.config.repository) {
      comparison.push({ source: entry.source, status: 'different-repository' })
      continue
    }
    try {
      const changes = await compareRevisions(root, entry.source, entry.config.repository, baseline, entry.revision)
      const patterns = entry.config.paths.map(patternExpression)
      const inside = path => patterns.some(pattern => pattern.test(path))
      comparison.push({ source: entry.source, status: 'compared', before: baseline, after: entry.revision, changes, selectedChanges: changes.filter(item => inside(item.path)), outsideSelectionChanges: changes.filter(item => !inside(item.path)), ...(before ? { selectionChanged: JSON.stringify(prior.config.paths) !== JSON.stringify(entry.config.paths) } : {}) })
    }
    catch (error) {
      comparison.push({ source: entry.source, status: 'unavailable', error: errorDetails(error) })
    }
  }
  return comparison
}
