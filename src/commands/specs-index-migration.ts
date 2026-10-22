import { readFile, unlink } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { requireManagedFile, resolveManagedDirectoryChain } from '../core/managed-path.js'
import { inspectSpecs, isRecognizedGeneratedSpecsIndex, specsInspectionComplete } from '../specs/query.js'

export interface GeneratedSpecsIndexMigrationPlan {
  inspectionComplete: boolean
  removable: string[]
  ownerControlled: string[]
  diagnostics: string[]
}

export async function inspectGeneratedSpecsIndexMigration(cwd = process.cwd()): Promise<GeneratedSpecsIndexMigrationPlan> {
  const inspection = await inspectSpecs({ cwd, allowMissingDecisionRecords: true })
  return {
    inspectionComplete: specsInspectionComplete(inspection),
    removable: inspection.generatedIndexes.filter(index => index.classification === 'safe-removal').map(index => index.path).sort(),
    ownerControlled: inspection.generatedIndexes.filter(index => index.classification === 'owner-controlled').map(index => index.path).sort(),
    diagnostics: inspection.diagnostics.map(diagnostic => `${diagnostic.path}: ${diagnostic.message}`),
  }
}

/** Delete only a currently recognized generated index. Partial deletion is retryable. */
export async function removeGeneratedSpecsIndex(path: string): Promise<boolean> {
  resolveManagedDirectoryChain(process.cwd(), dirname(path).split('/'), 'Specs parent')
  if (!requireManagedFile(path, 'generated Specs index', { allowMissing: true }))
    return false
  if (!isRecognizedGeneratedSpecsIndex(await readFile(resolve(path), 'utf8'), path))
    throw new Error(`Specs index is no longer generated; left untouched: ${path}`)
  await unlink(path)
  return true
}
