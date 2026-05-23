import type { FeaturePriority, FeatureStatus, RspConfig } from '../types.js'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pc from 'picocolors'
import { parseYamlLines } from './helpers.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Package root directory (for reading bundled rules) */
export const PKG_ROOT = join(__dirname, '..')
/** Project-local RSP state directory */
export const RSP_DIR = '.rsp'
/** Feature tracking via active.d/ directory (empty marker files, path = feature name) */
export const ACTIVE_DIR = join(RSP_DIR, 'active.d')
/** Archived feature storage directory */
export const ARCHIVES_DIR = join(RSP_DIR, 'archives')
/** File lock path (prevents concurrent rsp operations) */
export const LOCK_PATH = join(RSP_DIR, '.lock')
/** Project config file path */
export const CONFIG_PATH = join(RSP_DIR, 'config.yaml')

/** Re-export picocolors for use in command files */
export { pc }

/** Built-in valid feature statuses */
export const VALID_STATUSES: FeatureStatus[] = ['draft', 'ready', 'in-progress', 'blocked', 'done']
/** Built-in valid feature priorities */
export const VALID_PRIORITIES: FeaturePriority[] = ['low', 'medium', 'high', 'critical']
/** Built-in required sections in feature files (Tests is optional by default) */
export const DEFAULT_REQUIRED_SECTIONS = ['Spec', 'Plan']

/** Cached parsed config to avoid repeated file reads */
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
  const parsed = parseYamlLines(raw.split('\n'))

  _configCache = {
    statuses: Array.isArray(parsed.statuses) ? parsed.statuses.map(String) : undefined,
    priorities: Array.isArray(parsed.priorities) ? parsed.priorities.map(String) : undefined,
    required_sections: Array.isArray(parsed.required_sections) ? parsed.required_sections.map(String) : undefined,
  }

  return _configCache
}

/** Clear the config cache (for testing) */
export function clearConfigCache(): void {
  _configCache = null
}

/** Resolve effective status values: config overrides + built-in fallback */
export function resolveStatuses(config: RspConfig): string[] {
  return config.statuses && config.statuses.length > 0 ? config.statuses : [...VALID_STATUSES]
}

/** Resolve effective priority values: config overrides + built-in fallback */
export function resolvePriorities(config: RspConfig): string[] {
  return config.priorities && config.priorities.length > 0 ? config.priorities : [...VALID_PRIORITIES]
}

/** Resolve effective required sections: config overrides + built-in fallback */
export function resolveRequiredSections(config: RspConfig): string[] {
  return config.required_sections && config.required_sections.length > 0 ? config.required_sections : [...DEFAULT_REQUIRED_SECTIONS]
}

/** Read package.json version at runtime */
export async function getVersion() {
  const { version } = JSON.parse(await readFile(join(PKG_ROOT, 'package.json'), 'utf-8'))
  return version
}
