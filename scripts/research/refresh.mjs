import { compareRefreshRecords } from './comparison.mjs'
import { retain, verifyEvidence } from './evidence.mjs'
import { captureSource, sourceConfig, sourceRegistry, syncSource } from './sources.mjs'
import { entries, errorDetails, fail, hash, ID, jsonBytes, publishFile, readJson } from './storage.mjs'

function refreshPath(ref) {
  if (typeof ref !== 'string' || !ref.startsWith('refresh@') || !ID.test(ref.slice(8)))
    fail('invalid', 'Expected refresh@SHA-256')
  return `research/refreshes/${ref.slice(8)}.json`
}

export async function readRefresh(root, ref) {
  const { bytes, value: record } = await readJson(root, refreshPath(ref))
  if (hash(bytes) !== ref.slice(8))
    fail('corrupt', `Refresh bytes differ from identity: ${ref}`)
  if (record?.version !== 1 || !Array.isArray(record.sources) || !record.sources.length
    || new Set(record.sources.map(entry => entry.source)).size !== record.sources.length
    || record.sources.some(entry => typeof entry.source !== 'string' || !['captured', 'failed'].includes(entry.status)
      || (entry.status === 'captured' && (!ID.test(entry.evidence) || !Array.isArray(entry.inventory)))
      || (entry.status === 'failed' && typeof entry.error?.message !== 'string'))) {
    fail('corrupt', 'Invalid refresh record')
  }
  return { ref, record, recordIntegrity: 'valid', evidenceIntegrity: 'not-checked' }
}

export async function checkRefresh(root, ref) {
  try {
    const result = await readRefresh(root, ref)
    for (const entry of result.record.sources) {
      if (entry.status === 'captured')
        await verifyEvidence(root, entry.evidence)
    }
    return { ...result, integrity: 'valid', evidenceIntegrity: 'valid' }
  }
  catch (error) {
    return { ref, integrity: errorDetails(error).kind, error: errorDetails(error) }
  }
}

export async function listRefreshes(root) {
  return (await entries(root, 'research/refreshes'))
    .filter(name => name.endsWith('.json') && ID.test(name.slice(0, -5)))
    .map(name => `refresh@${name.slice(0, -5)}`)
}

export async function compareRefreshes(root, before, after) {
  const left = await readRefresh(root, before)
  const right = await readRefresh(root, after)
  return {
    before,
    after,
    recordIntegrity: 'valid',
    comparison: await compareRefreshRecords(root, left.record, right.record),
    notSelected: left.record.sources.filter(entry => !right.record.sources.some(current => current.source === entry.source)).map(entry => entry.source),
    semanticApproval: false,
  }
}

export async function refreshSources(root, { all, source = [], from }) {
  if (Boolean(all) === Boolean(source.length))
    fail('invalid', 'refresh requires either --all or repeated --source names')
  // Freeze registry selection before acquisition. Subsequent edits cannot relabel it.
  const registry = await sourceRegistry(root)
  const selected = [...new Set(all ? Object.keys(registry) : source)].sort()
  if (!selected.length)
    fail('invalid', 'No sources selected')
  const previous = from ? (await readRefresh(root, from)).record : null
  const startedAt = new Date().toISOString()
  const results = []
  for (const id of selected) {
    const entry = { source: id }
    try {
      entry.config = await sourceConfig(root, id, registry)
      const synced = await syncSource(root, id, entry.config)
      entry.revision = synced.revision
      const captured = await captureSource(root, id, { source: entry.config, revision: synced.revision })
      // The refresh itself resolved this ref to this commit, before any later fetch.
      captured.origin.ref = entry.config.ref
      delete captured.origin.selection
      entry.evidence = (await retain(root, captured)).id
      entry.inventory = captured.inventory
      entry.status = 'captured'
    }
    catch (error) {
      entry.status = 'failed'
      entry.error = errorDetails(error)
    }
    results.push(entry)
  }
  const record = { version: 1, startedAt, finishedAt: new Date().toISOString(), from: from ?? null, sources: results }
  const bytes = jsonBytes(record)
  const ref = `refresh@${hash(bytes)}`
  await publishFile(root, refreshPath(ref), bytes)
  // Publication precedes optional comparison: old missing evidence never discards acquisition.
  const comparison = await compareRefreshRecords(root, previous, record)
  return { ref, path: refreshPath(ref), acquisition: results.some(entry => entry.status === 'failed') ? 'partial' : 'complete', record, comparison, semanticApproval: false }
}
