import type { ChangeKind, RspConfig } from '../types.js'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pc from 'picocolors'
import { parseYamlText } from './helpers.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Package root directory (for reading bundled rules). */
export const PKG_ROOT = join(__dirname, '..')
/** Project-local RSP state directory. */
export const RSP_DIR = '.rsp'
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

/** Cached parsed config to avoid repeated file reads. */
let _configCache: RspConfig | null = null

/**
 * Load and parse .rsp/config.yaml (cached).
 * Returns defaults when no config file exists.
 */
export async function loadRspConfig(): Promise<RspConfig> {
  if (_configCache)
    return _configCache

  if (!existsSync(CONFIG_PATH)) {
    _configCache = {}
    return _configCache
  }

  const raw = await readFile(CONFIG_PATH, 'utf-8')
  const parsed = parseYamlText(raw)

  _configCache = {
    kinds: Array.isArray(parsed.kinds) ? parsed.kinds.map(String) : undefined,
  }

  return _configCache
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
