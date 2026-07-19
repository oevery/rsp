import type { RspConfig } from '../types.js'
import { existsSync } from 'node:fs'
import { mkdir, readdir, realpath, stat, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, posix, relative, resolve, sep } from 'node:path'

export const DEFAULT_DECISION_RECORDS_PATH = '.rsp/specs/decisions'

export function normalizeDecisionRecordsPath(pathValue: string): string {
  return posix.normalize(pathValue.trim().replace(/\\/g, '/')).replace(/^\.\//, '').replace(/\/$/, '')
}

export function validateDecisionRecordsPath(pathValue: unknown): string | null {
  if (typeof pathValue !== 'string' || pathValue.trim() === '')
    return 'config.yaml field "decisions.path" must be a non-empty string'

  const raw = pathValue.trim()
  const portable = raw.replace(/\\/g, '/')
  if (isAbsolute(raw) || posix.isAbsolute(portable) || /^[a-z]:[\\/]/i.test(raw))
    return 'config.yaml field "decisions.path" must be project-relative'

  const normalized = normalizeDecisionRecordsPath(raw)
  if (normalized === '.' || normalized === '..' || normalized.startsWith('../'))
    return 'config.yaml field "decisions.path" must stay inside the Host Project'

  if ((normalized === '.rsp' || normalized.startsWith('.rsp/')) && normalized !== DEFAULT_DECISION_RECORDS_PATH)
    return `config.yaml field "decisions.path" must use ${DEFAULT_DECISION_RECORDS_PATH} or a path outside .rsp/`

  return null
}

export function getDecisionRecordsConfigIssue(config: Record<string, unknown>): string | null {
  if (!('decisions' in config))
    return null

  const decisions = config.decisions
  if (!decisions || typeof decisions !== 'object' || Array.isArray(decisions))
    return 'config.yaml field "decisions" must be a mapping with one path'

  const keys = Object.keys(decisions)
  if (keys.length !== 1 || keys[0] !== 'path')
    return 'config.yaml field "decisions" supports only "path"'

  return validateDecisionRecordsPath((decisions as Record<string, unknown>).path)
}

export function resolveDecisionRecordsPath(config: RspConfig): string {
  const configured = config.decisions?.path
  return configured && validateDecisionRecordsPath(configured) === null
    ? normalizeDecisionRecordsPath(configured)
    : DEFAULT_DECISION_RECORDS_PATH
}

export async function ensureDecisionRecordsDirectory(pathValue: string): Promise<boolean> {
  const filesystemError = await validateDecisionRecordsFilesystemPath(pathValue)
  if (filesystemError)
    throw new Error(filesystemError)

  const existed = existsSync(pathValue)
  await mkdir(pathValue, { recursive: true })

  const entries = await readdir(pathValue)
  if (entries.length === 0) {
    await writeFile(join(pathValue, '.gitkeep'), '')
    return true
  }

  return !existed
}

export async function validateDecisionRecordsFilesystemPath(pathValue: string): Promise<string | null> {
  const projectRoot = await realpath('.')
  let existingAncestor = resolve(pathValue)

  while (!existsSync(existingAncestor)) {
    const parent = dirname(existingAncestor)
    if (parent === existingAncestor)
      return `Decision Record path "${pathValue}" has no accessible Host Project ancestor`
    existingAncestor = parent
  }

  const resolvedAncestor = await realpath(existingAncestor)
  const rel = relative(projectRoot, resolvedAncestor)
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel))
    return `Decision Record path "${pathValue}" resolves outside the Host Project through ${existingAncestor}`

  if (existsSync(resolve(pathValue)) && !(await stat(resolve(pathValue))).isDirectory())
    return `Decision Record path "${pathValue}" must be a directory`

  return null
}
