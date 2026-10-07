import { compareEvidence, compareRepositoryEntries, scopeMatcher } from './comparison.mjs'
import { verifyEvidence } from './evidence.mjs'
import { readRefresh } from './refresh.mjs'
import { errorDetails } from './storage.mjs'
import { studyRecord } from './studies.mjs'

// Study declarations select the research baseline; acquisition never advances it.
export async function researchCoverage(root, study, refresh) {
  const { metadata } = await studyRecord(root, study)
  const { record } = await readRefresh(root, refresh)
  const covered = new Map()
  const diagnostics = []
  const refreshes = []
  for (const ref of metadata.refreshes) {
    try {
      refreshes.push(await readRefresh(root, ref))
    }
    catch (error) {
      diagnostics.push({ refresh: ref, ...errorDetails(error) })
    }
  }
  for (const id of metadata.coverage) {
    try {
      const { manifest } = await verifyEvidence(root, id)
      const ids = covered.get(manifest.origin.source) ?? []
      ids.push({ id, origin: manifest.origin })
      covered.set(manifest.origin.source, ids)
    }
    catch (error) {
      diagnostics.push({ evidence: id, ...errorDetails(error) })
    }
  }
  const sources = []
  for (const entry of record.sources) {
    const baselines = covered.get(entry.source)
    if (entry.status !== 'captured') {
      sources.push({ source: entry.source, status: 'acquisition-failed', error: entry.error })
      continue
    }
    if (!baselines) {
      sources.push({ source: entry.source, status: diagnostics.length ? 'coverage-unresolved' : 'not-reviewed', evidence: entry.evidence })
      continue
    }
    for (const { id: before, origin } of baselines) {
      // Match the reviewed version, never the most recently cited observation.
      const observation = refreshes.find(item => item.record.sources.some(prior => matchesObservation(prior, origin)))
      let repository = { status: 'no-baseline' }
      if (observation) {
        const prior = observation.record.sources.find(item => matchesObservation(item, origin))
        const delta = compareRepositoryEntries(prior, entry)
        const inScope = scopeMatcher(origin)
        repository = {
          status: delta.comparable ? 'compared' : 'baseline-mismatch',
          before: observation.ref,
          after: refresh,
          reviewedScopeChanges: delta.changes.filter(change => inScope(change.path)),
          outsideReviewedScopeChanges: delta.changes.filter(change => !inScope(change.path)),
        }
      }
      try {
        const delta = await compareEvidence(root, before, entry.evidence)
        sources.push({ source: entry.source, status: !delta.comparable ? 'baseline-mismatch' : delta.scopeChanged ? 'scope-changed' : delta.changes.length ? 'changed' : 'unchanged-in-scope', ...delta, repository })
      }
      catch (error) {
        sources.push({ source: entry.source, before, status: 'comparison-unavailable', error: errorDetails(error), repository })
      }
    }
  }
  const notSelected = [...covered.keys()].filter(source => !record.sources.some(entry => entry.source === source))
  const baseline = []
  for (const id of metadata.baseline) {
    try {
      const { manifest } = await verifyEvidence(root, id)
      baseline.push({ evidence: id, origin: manifest.origin, integrity: 'valid' })
    }
    catch (error) {
      baseline.push({ evidence: id, integrity: errorDetails(error).kind, error: errorDetails(error) })
    }
  }
  return { study, refresh, sources, notSelected, diagnostics, baseline, semanticApproval: false, localFreshness: 'not-checked' }
}

function matchesObservation(entry, origin) {
  return entry.status === 'captured' && entry.source === origin.source
    && entry.revision === origin.revision && entry.config.repository === origin.repository && entry.config.ref === origin.ref
}
