import type { ChangeKind, RspConfig } from '../types.js'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pc from 'picocolors'
import { getDecisionRecordsConfigIssue, normalizeDecisionRecordsPath, validateDecisionRecordsPath } from './decisions.js'
import { parseYamlText } from './helpers.js'
import { inspectManagedFile } from './managed-path.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Package root directory (for reading bundled rules). */
export const PKG_ROOT = join(__dirname, '..')
/** Project-local RSP state directory. */
export const RSP_DIR = '.rsp'
/** Canonical consumer path for the minimal tool-agnostic fallback protocol. */
export const RSP_RULES_PATH = join(RSP_DIR, 'rsp-rules.md')
/** Obsolete generated fallback path recognized only by migration diagnostics. */
export const OBSOLETE_RSP_RULES_PATH = join(RSP_DIR, 'rules', 'rsp-rules.md')
/** Open change storage directory. */
export const CHANGES_DIR = join(RSP_DIR, 'changes')
/** Current focus marker directory (empty marker files, path = change name). */
export const FOCUS_DIR = join(RSP_DIR, 'focus.d')
/** Archived change storage directory. */
export const ARCHIVES_DIR = join(RSP_DIR, 'archives')
/** File lock path (prevents concurrent rsp operations). */
export const LOCK_PATH = join(RSP_DIR, '.lock')
/** Project config file path. */
export const CONFIG_PATH = join(RSP_DIR, 'config.yaml')

/** Re-export picocolors for use in command files. */
export { pc }

/** Built-in valid change kinds. */
export const VALID_KINDS: ChangeKind[] = ['feature', 'fix', 'refactor', 'docs', 'ops', 'research']
/** Built-in required sections in change files. */
export const DEFAULT_REQUIRED_SECTIONS = ['Proposal', 'Spec', 'Design', 'Tasks', 'Verify', 'Blockers']

export interface RspConfigInspection {
  config: RspConfig
  decisionRecordsIssue: string | null
}

/** Cached parsed config inspection to avoid repeated file reads. */
let _configCache: { cwd: string, inspection: RspConfigInspection } | null = null

/**
 * Load and parse .rsp/config.yaml (cached).
 * Returns defaults when no config file exists.
 */
export async function loadRspConfig(): Promise<RspConfig> {
  return (await inspectRspConfig()).config
}

/** Load typed config plus semantic issues needed by routing commands. */
export async function inspectRspConfig(): Promise<RspConfigInspection> {
  const cwd = process.cwd()
  if (_configCache?.cwd === cwd)
    return _configCache.inspection

  const configFile = inspectManagedFile(CONFIG_PATH, 'config file', { allowMissing: true })
  if (configFile.issue)
    throw configFile.issue
  if (!configFile.exists) {
    const inspection = { config: {}, decisionRecordsIssue: null }
    _configCache = { cwd, inspection }
    return inspection
  }

  const raw = await readFile(CONFIG_PATH, 'utf-8')
  const parsed = parseYamlText(raw)
  const decisions = parsed.decisions && typeof parsed.decisions === 'object' && !Array.isArray(parsed.decisions)
    ? parsed.decisions as Record<string, unknown>
    : undefined
  const decisionPath = decisions?.path
  const decisionRecordsIssue = getDecisionRecordsConfigIssue(parsed)

  const inspection: RspConfigInspection = {
    config: {
      kinds: Array.isArray(parsed.kinds) ? parsed.kinds.map(String) : undefined,
      decisions: decisionRecordsIssue === null && validateDecisionRecordsPath(decisionPath) === null
        ? { path: normalizeDecisionRecordsPath(String(decisionPath)) }
        : undefined,
    },
    decisionRecordsIssue,
  }
  _configCache = { cwd, inspection }

  return inspection
}

/** Clear the config cache (for testing). */
export function clearConfigCache(): void {
  _configCache = null
}

/** Resolve effective kind values: config overrides + built-in fallback. */
export function resolveKinds(config: RspConfig): string[] {
  return config.kinds && config.kinds.length > 0 ? config.kinds : [...VALID_KINDS]
}

/** Resolve effective required sections: fixed by the RSP core model. */
export function resolveRequiredSections(_config: RspConfig): string[] {
  return [...DEFAULT_REQUIRED_SECTIONS]
}

/** Read package.json version at runtime. */
export async function getVersion() {
  const { version } = JSON.parse(await readFile(join(PKG_ROOT, 'package.json'), 'utf-8'))
  return version
}
