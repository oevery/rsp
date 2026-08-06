import type { ChangeKind, EffectiveLanguagePolicy, ManageActivation, ManageCloseout, ManagePolicy, ProjectLanguageConfig, RspConfig } from '../types.js'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pc from 'picocolors'
import { parseDocument, stringify, visit } from 'yaml'
import { getDecisionRecordsConfigIssue, normalizeDecisionRecordsPath, validateDecisionRecordsPath } from './decisions.js'
import { CHANGE_DOCUMENT_SCHEMA, getCanonicalSectionHeadings } from './document-model.js'
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
export const DEFAULT_REQUIRED_SECTIONS = getCanonicalSectionHeadings(CHANGE_DOCUMENT_SCHEMA)
export const LEGACY_MISSING_CONFIG_MANAGE_POLICY: ManagePolicy = { activation: 'explicit', closeout: 'local' }
export const INVALID_CONFIG_MANAGE_POLICY: ManagePolicy = { activation: 'explicit', closeout: 'manual' }
export const CONFIG_DEFAULTS = {
  kinds: [] as string[],
  decisions: { path: '.rsp/specs/decisions' },
  language: { default: 'en' },
  manage: { activation: 'auto' as const, closeout: 'local' as const },
}

export function generateConfigTemplate(config: RspConfig = {}): string {
  const kinds = config.kinds ?? CONFIG_DEFAULTS.kinds
  const decisions = { ...CONFIG_DEFAULTS.decisions, ...config.decisions }
  const manage = { ...CONFIG_DEFAULTS.manage, ...config.manage }
  const language = { ...CONFIG_DEFAULTS.language, ...config.language }
  const kindsYaml = stringify(kinds).trimEnd()
  const renderedKinds = kinds.length === 0
    ? `kinds: ${kindsYaml}`
    : `kinds:\n${kindsYaml.split('\n').map(line => `  ${line}`).join('\n')}`
  const artifactsLine = language.artifacts
    ? `  artifacts: ${stringify(language.artifacts).trim()}`
    : '  # artifacts: zh-CN'
  const commitLine = language.commit
    ? `  commit: ${stringify(language.commit).trim()}`
    : '  # commit: zh-CN'

  return `# RSP project configuration
# An empty kinds list retains the built-in defaults.
# A non-empty kinds list replaces the built-in defaults; it does not extend them.
# Every entry must be a unique non-empty string.
#
# Built-in defaults:
#   kinds:               ${VALID_KINDS.join(', ')}
#
${renderedKinds}

# Decision Records default to .rsp/specs/decisions.
decisions:
  path: ${stringify(decisions.path).trim()}

# New projects default to automatic Manage routing with local closeout.
# Use activation: explicit to require a named managed request.
# closeout accepts manual, lifecycle, or local; local routes a qualified clean terminal non-small boundary to one local commit but never push or publication.
manage:
  activation: ${manage.activation}
  closeout: ${manage.closeout}

# Set one shared project default for durable artifact and commit prose.
# Response language remains user/session-owned and is never read from this project mapping.
language:
  default: ${stringify(language.default).trim()}
${artifactsLine}
${commitLine}
`
}

const MANAGE_ACTIVATIONS: ManageActivation[] = ['explicit', 'auto']
const MANAGE_CLOSEOUTS: ManageCloseout[] = ['manual', 'lifecycle', 'local']

export interface RspConfigInspection {
  config: RspConfig
  issues: string[]
}

export interface ConfigDefaultsReconciliation {
  content: string
  added: string[]
  changed: boolean
}

/**
 * Reconcile a valid config against the canonical template.
 * Generated comments are refreshed; custom comments use conservative append-only repair.
 */
export function reconcileRspConfigDefaults(raw: string): ConfigDefaultsReconciliation {
  const document = parseDocument(raw)
  if (document.errors.length > 0)
    throw new Error(document.errors.map(error => error.message).join('; '))

  const parsed = parseYamlText(raw)
  const issues = validateRspConfig(parsed)
  if (issues.length > 0)
    throw new Error(issues.join('; '))

  const added = collectMissingConfigDefaults(parsed)
  const customComments = hasCustomConfigComments(document, parsed)
  if (customComments) {
    backfillConfigDocument(document, parsed)
  }

  if (customComments && added.length === 0)
    return { content: raw, added, changed: false }

  const content = customComments
    ? String(document)
    : generateConfigTemplate(parsed as RspConfig)
  return { content, added, changed: content !== raw }
}

function collectMissingConfigDefaults(parsed: Record<string, unknown>): string[] {
  const added: string[] = []
  if (!('kinds' in parsed))
    added.push('kinds')
  if (!('decisions' in parsed) || !hasNestedKey(parsed.decisions, 'path'))
    added.push('decisions.path')
  if (!('language' in parsed))
    added.push('language.default')
  if (!('manage' in parsed)) {
    added.push('manage.activation', 'manage.closeout')
  }
  else {
    if (!hasNestedKey(parsed.manage, 'activation'))
      added.push('manage.activation')
    if (!hasNestedKey(parsed.manage, 'closeout'))
      added.push('manage.closeout')
  }
  return added
}

function backfillConfigDocument(document: ReturnType<typeof parseDocument>, parsed: Record<string, unknown>): void {
  if (!('kinds' in parsed))
    document.set('kinds', [...CONFIG_DEFAULTS.kinds])
  if (!('decisions' in parsed))
    document.set('decisions', { path: CONFIG_DEFAULTS.decisions.path })
  else if (!hasNestedKey(parsed.decisions, 'path'))
    document.setIn(['decisions', 'path'], CONFIG_DEFAULTS.decisions.path)
  if (!('language' in parsed))
    document.set('language', { default: CONFIG_DEFAULTS.language.default })
  if (!('manage' in parsed)) {
    document.set('manage', { ...CONFIG_DEFAULTS.manage })
  }
  else {
    if (!hasNestedKey(parsed.manage, 'activation'))
      document.setIn(['manage', 'activation'], CONFIG_DEFAULTS.manage.activation)
    if (!hasNestedKey(parsed.manage, 'closeout'))
      document.setIn(['manage', 'closeout'], CONFIG_DEFAULTS.manage.closeout)
  }
}

function hasNestedKey(value: unknown, key: string): boolean {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) && key in value)
}

const LEGACY_GENERATED_CONFIG_COMMENTS = new Set([
  'Omit kinds or use [] to retain the built-in defaults.',
  'New projects default to automatic Manage routing with lifecycle-only closeout.',
  'Self-host automatic Manage routing with bounded deterministic local commits; push and publication stay explicit.',
  'Set exactly one project-relative authoritative directory when the Host Project already owns Decision Records elsewhere.',
  'kinds:',
  'decisions:',
  'path: docs/adr',
  ...VALID_KINDS.map(kind => `- ${kind}`),
])

function hasCustomConfigComments(document: ReturnType<typeof parseDocument>, parsed: Record<string, unknown>): boolean {
  const generated = new Set(collectConfigComments(parseDocument(generateConfigTemplate(parsed as RspConfig))))
  for (const comment of LEGACY_GENERATED_CONFIG_COMMENTS)
    generated.add(comment)
  return collectConfigComments(document).some(comment => !generated.has(comment))
}

function collectConfigComments(document: ReturnType<typeof parseDocument>): string[] {
  const comments: string[] = []
  const append = (value: string | null | undefined) => {
    if (!value)
      return
    for (const line of value.split('\n')) {
      const comment = line.trim()
      if (comment)
        comments.push(comment)
    }
  }

  append(document.commentBefore)
  append(document.comment)
  visit(document, {
    Node(_key, node) {
      append(node.commentBefore)
      append(node.comment)
    },
  })
  return comments
}

/** Cached parsed config inspection to avoid repeated file reads. */
let _configCache: { cwd: string, inspection: RspConfigInspection } | null = null

/**
 * Load and parse .rsp/config.yaml (cached).
 * Returns defaults when no config file exists.
 */
export async function loadRspConfig(): Promise<RspConfig> {
  const inspection = await inspectRspConfig()
  if (inspection.issues.length > 0)
    throw new Error(inspection.issues.join('; '))
  return inspection.config
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
    const inspection = { config: {}, issues: [] }
    _configCache = { cwd, inspection }
    return inspection
  }

  const raw = await readFile(CONFIG_PATH, 'utf-8')
  const parsed = parseYamlText(raw)
  const issues = validateRspConfig(parsed)
  const decisions = parsed.decisions && typeof parsed.decisions === 'object' && !Array.isArray(parsed.decisions)
    ? parsed.decisions as Record<string, unknown>
    : undefined
  const decisionPath = decisions?.path
  const manageValue = parsed.manage && typeof parsed.manage === 'object' && !Array.isArray(parsed.manage)
    ? parsed.manage as Record<string, unknown>
    : undefined
  const languageValue = parsed.language && typeof parsed.language === 'object' && !Array.isArray(parsed.language)
    ? parsed.language as Record<string, unknown>
    : undefined
  const activation = MANAGE_ACTIVATIONS.includes(manageValue?.activation as ManageActivation)
    ? manageValue?.activation as ManageActivation
    : undefined
  const closeout = MANAGE_CLOSEOUTS.includes(manageValue?.closeout as ManageCloseout)
    ? manageValue?.closeout as ManageCloseout
    : undefined
  const kinds = Array.isArray(parsed.kinds) && parsed.kinds.every(value => typeof value === 'string' && value.trim() !== '')
    ? parsed.kinds.map(value => value.trim())
    : undefined
  const decisionRecordsIssue = getDecisionRecordsConfigIssue(parsed)

  const inspection: RspConfigInspection = {
    config: {
      kinds,
      decisions: decisionRecordsIssue === null && validateDecisionRecordsPath(decisionPath) === null
        ? { path: normalizeDecisionRecordsPath(String(decisionPath)) }
        : undefined,
      manage: manageValue ? { activation, closeout } : undefined,
      language: parseLanguageConfig(languageValue),
    },
    issues,
  }
  _configCache = { cwd, inspection }

  return inspection
}

/** Validate the complete supported .rsp/config.yaml contract without coercing invalid input. */
export function validateRspConfig(parsed: Record<string, unknown>): string[] {
  const issues: string[] = []
  const supported = new Set(['kinds', 'decisions', 'manage', 'language'])

  for (const key of Object.keys(parsed)) {
    if (key === 'required_sections') {
      issues.push('config.yaml field "required_sections" is no longer supported')
    }
    else if (!supported.has(key)) {
      issues.push(`config.yaml field "${key}" is not supported`)
    }
  }

  if ('kinds' in parsed) {
    if (!Array.isArray(parsed.kinds)) {
      issues.push('config.yaml field "kinds" must be a YAML list')
    }
    else if (!parsed.kinds.every(value => typeof value === 'string' && value.trim() !== '')) {
      issues.push('config.yaml field "kinds" must contain only non-empty strings')
    }
    else {
      const kinds = parsed.kinds.map(value => value.trim())
      const duplicates = [...new Set(kinds.filter((value, index) => kinds.indexOf(value) !== index))]
      if (duplicates.length > 0)
        issues.push(`config.yaml field "kinds" contains duplicate entries: ${duplicates.join(', ')}`)
    }
  }

  const decisionRecordsIssue = getDecisionRecordsConfigIssue(parsed)
  if (decisionRecordsIssue)
    issues.push(decisionRecordsIssue)

  if ('manage' in parsed) {
    if (!parsed.manage || typeof parsed.manage !== 'object' || Array.isArray(parsed.manage)) {
      issues.push('config.yaml field "manage" must be a YAML mapping')
    }
    else {
      const manage = parsed.manage as Record<string, unknown>
      const supportedManageFields = new Set(['activation', 'closeout'])
      for (const key of Object.keys(manage)) {
        if (!supportedManageFields.has(key))
          issues.push(`config.yaml field "manage.${key}" is not supported`)
      }
      if ('activation' in manage && !MANAGE_ACTIVATIONS.includes(manage.activation as ManageActivation))
        issues.push('config.yaml field "manage.activation" must be one of: explicit, auto')
      if ('closeout' in manage && !MANAGE_CLOSEOUTS.includes(manage.closeout as ManageCloseout))
        issues.push('config.yaml field "manage.closeout" must be one of: manual, lifecycle, local')
    }
  }

  if ('language' in parsed) {
    if (!parsed.language || typeof parsed.language !== 'object' || Array.isArray(parsed.language)) {
      issues.push('config.yaml field "language" must be a YAML mapping')
    }
    else {
      const language = parsed.language as Record<string, unknown>
      const supportedLanguageFields = new Set(['default', 'artifacts', 'commit'])
      for (const key of Object.keys(language)) {
        if (!supportedLanguageFields.has(key))
          issues.push(`config.yaml field "language.${key}" is not supported`)
      }
      if (!('default' in language))
        issues.push('config.yaml field "language.default" is required when language is configured')
      for (const key of supportedLanguageFields) {
        if (key in language && canonicalizeLanguageTag(language[key]) === null)
          issues.push(`config.yaml field "language.${key}" must be a non-empty valid BCP 47 language tag`)
      }
    }
  }

  return issues
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

/** Resolve effective Manage policy, using the strict fail-closed policy for invalid config. */
export function resolveManagePolicy(config: RspConfig, options: { configValid?: boolean } = {}): ManagePolicy {
  if (options.configValid === false)
    return { ...INVALID_CONFIG_MANAGE_POLICY }
  return {
    activation: config.manage?.activation ?? LEGACY_MISSING_CONFIG_MANAGE_POLICY.activation,
    closeout: config.manage?.closeout ?? LEGACY_MISSING_CONFIG_MANAGE_POLICY.closeout,
  }
}

/** Resolve configured durable artifact and commit languages without selecting conversation language. */
export function resolveLanguagePolicy(config: RspConfig, options: { configValid?: boolean } = {}): EffectiveLanguagePolicy {
  if (options.configValid === false || !config.language)
    return { artifacts: null, commit: null }
  return {
    artifacts: config.language.artifacts ?? config.language.default,
    commit: config.language.commit ?? config.language.default,
  }
}

function parseLanguageConfig(value: Record<string, unknown> | undefined): ProjectLanguageConfig | undefined {
  if (!value)
    return undefined
  const defaultLanguage = canonicalizeLanguageTag(value.default)
  if (defaultLanguage === null)
    return undefined
  const artifacts = canonicalizeLanguageTag(value.artifacts)
  const commit = canonicalizeLanguageTag(value.commit)
  return {
    default: defaultLanguage,
    artifacts: artifacts ?? undefined,
    commit: commit ?? undefined,
  }
}

function canonicalizeLanguageTag(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '')
    return null
  try {
    return Intl.getCanonicalLocales(value.trim())[0] ?? null
  }
  catch {
    return null
  }
}

/** Read package.json version at runtime. */
export async function getVersion() {
  const { version } = JSON.parse(await readFile(join(PKG_ROOT, 'package.json'), 'utf-8'))
  return version
}
