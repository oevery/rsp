import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import * as projectOutcome from './project-outcome.mjs'

// Shared observable task contract for report-only cases. Report quality and
// routing are deliberately left to independent semantic review, not prose regexes.
const readOnly = {
  async check({ case: spec }) {
    return { status: spec.hard.workspace_unchanged && spec.hard.allowed_paths.length === 0 ? 'passed' : 'failed' }
  },
  async verify({ observation, result }) {
    return { status: observation.changedPaths.length === 0 && result.finalOutput?.trim() ? 'passed' : 'failed' }
  },
}

export function loadTaskOracle(entry) {
  if (entry.manifest.oracle === 'project-outcome')
    return Promise.resolve(projectOutcome)
  return entry.manifest.oracle === 'read-only' ? Promise.resolve(readOnly) : import(pathToFileURL(join(entry.directory, entry.manifest.oracle)).href)
}
