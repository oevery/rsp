import { STAMP, timestamp } from './catalog.mjs'
import { compareRefreshRecords } from './comparison.mjs'
import { evidenceMetadata, retain } from './evidence.mjs'
import { withLock } from './locking.mjs'
import { captureSource, currentRevision, sourceConfig, sourceRegistry, syncSource } from './sources.mjs'
import { entries, errorDetails, exists, fail, jsonBytes, publishFile, readJson, replaceJson, safePath } from './storage.mjs'

export function refreshPath(ref) {
  if (typeof ref !== 'string' || !ref.startsWith('refresh@') || !STAMP.test(ref.slice(8)))
    fail('invalid', 'Expected refresh@UTC-timestamp')
  return `research/refreshes/${ref.slice(8)}.json`
}

export async function readRefresh(root, ref) {
  const { value: record } = await readJson(root, refreshPath(ref))
  if (record?.version !== 3 || record.id !== ref || !Array.isArray(record.sources) || !record.sources.length
    || new Set(record.sources.map(item => item.source)).size !== record.sources.length
    || record.sources.some(item => !Array.isArray(item.attempts) || !['pending', 'running', 'captured', 'failed'].includes(item.status))) {
    fail('invalid', `Invalid refresh task: ${ref}`)
  }
  return { ref, record }
}

export async function listRefreshes(root) {
  return (await entries(root, 'research/refreshes')).filter(name => name.endsWith('.json') && STAMP.test(name.slice(0, -5))).map(name => `refresh@${name.slice(0, -5)}`)
}

export async function compareRefreshes(root, before, after) {
  const a = (await readRefresh(root, before)).record
  const b = (await readRefresh(root, after)).record
  return { before, after, comparison: await compareRefreshRecords(root, a, b) }
}

export async function refreshSources(root, { all, source = [], from, resume, updateConfig = false, progress = () => {} }) {
  if (resume && (all || source.length || from))
    fail('invalid', 'resume cannot select new sources or a comparison baseline')
  if (!resume && (Boolean(all) === Boolean(source.length) || updateConfig))
    fail('invalid', 'refresh requires --all or --source; --update-config requires --resume')
  let ref = resume
  if (!resume) {
    if (from)
      await readRefresh(root, from)
    const registry = await sourceRegistry(root)
    const selected = [...new Set(all ? Object.keys(registry) : source)].sort()
    if (!selected.length)
      fail('invalid', 'No sources selected')
    const sources = []
    for (const id of selected)
      sources.push({ source: id, config: await sourceConfig(root, id, registry), status: 'pending', attempts: [] })
    while (true) {
      ref = `refresh@${timestamp()}`
      if (await exists(await safePath(root, refreshPath(ref)))) {
        await new Promise(resolve => setTimeout(resolve, 1))
        continue
      }
      try {
        await publishFile(root, refreshPath(ref), jsonBytes({ version: 3, id: ref, startedAt: new Date().toISOString(), from: from ?? null, sources }))
        break
      }
      catch (error) {
        if (error.kind !== 'corrupt')
          throw error
      }
    }
  }
  return withLock(root, `refresh-${ref.slice(8).toLowerCase()}`, async () => {
    const { record } = await readRefresh(root, ref)
    const registry = updateConfig ? await sourceRegistry(root) : null
    progress({ ref, status: 'started', total: record.sources.length })
    for (const entry of record.sources) {
      if (entry.status === 'running') {
        Object.assign(entry.attempts.at(-1), { status: 'interrupted', finishedAt: new Date().toISOString() })
        entry.status = 'pending'
      }
      if (updateConfig) {
        const config = await sourceConfig(root, entry.source, registry)
        if (!jsonBytes(config).equals(jsonBytes(entry.config))) {
          if (config.repository !== entry.config.repository || config.ref !== entry.config.ref)
            delete entry.before
          entry.configurationChanges ??= []
          entry.configurationChanges.push({ at: new Date().toISOString(), previous: entry.config })
          entry.config = config
          entry.status = 'pending'
        }
      }
      if (entry.status === 'captured') {
        if ((await evidenceMetadata(root, entry.evidence)).local === 'missing')
          fail('unavailable', `Retained material is missing; recover ${entry.evidence} before resuming`)
        progress({ source: entry.source, status: 'reused', ref })
        continue
      }
      const attempt = { startedAt: new Date().toISOString(), status: 'running' }
      entry.attempts.push(attempt)
      entry.status = 'running'
      record.acquisition = 'running'
      delete record.finishedAt
      delete entry.evidence
      delete entry.revision
      delete entry.error
      await replaceJson(root, refreshPath(ref), record)
      try {
        // Persist the old version before fetch, so a killed/failed attempt cannot advance it.
        if (!Object.hasOwn(entry, 'before')) {
          entry.before = await currentRevision(root, entry.source, entry.config)
          await replaceJson(root, refreshPath(ref), record)
        }
        const synced = await syncSource(root, entry.source, entry.config)
        const captured = await captureSource(root, entry.source, { source: entry.config, revision: synced.revision })
        const retained = await retain(root, captured)
        Object.assign(entry, { status: 'captured', revision: synced.revision, evidence: retained.id })
        attempt.status = 'captured'
      }
      catch (error) {
        Object.assign(entry, { status: 'failed', error: errorDetails(error) })
        Object.assign(attempt, { status: 'failed', error: entry.error })
      }
      attempt.finishedAt = new Date().toISOString()
      await replaceJson(root, refreshPath(ref), record)
      progress({ ref, source: entry.source, status: entry.status, error: entry.error })
    }
    record.finishedAt ??= new Date().toISOString()
    record.acquisition = record.sources.every(item => item.status === 'captured') ? 'complete' : 'partial'
    await replaceJson(root, refreshPath(ref), record)
    let comparison
    try {
      const before = record.from ? (await readRefresh(root, record.from)).record : null
      comparison = await compareRefreshRecords(root, before, record)
    }
    catch (error) { comparison = [{ status: 'unavailable', error: errorDetails(error) }] }
    return { ref, path: refreshPath(ref), acquisition: record.acquisition, record, comparison }
  })
}
