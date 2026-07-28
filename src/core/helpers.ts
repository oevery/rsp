import type { CheckboxCount, DeltaSections, Frontmatter, RuntimeDiagnostic, ScenarioBlock } from '../types.js'
import { existsSync } from 'node:fs'
import { readdir, readFile, rmdir } from 'node:fs/promises'

import { basename, dirname, join, relative, sep } from 'node:path'
import { parse } from 'yaml'
import { OBSOLETE_RSP_RULES_PATH, pc, RSP_DIR, RSP_RULES_PATH } from './config.js'
import { CHANGE_DOCUMENT_SCHEMA, getDocumentSectionBody, parseRspDocument, renderDocumentSectionHeading, renderDocumentTitle } from './document-model.js'
import { inspectManagedFile } from './managed-path.js'
import { toErrorMessage } from './output.js'

const RSP_AGENTS_BEGIN = '<!-- rsp:begin -->'
const RSP_AGENTS_END = '<!-- rsp:end -->'

/** Parse a YAML document into a plain object. */
export function parseYamlText(text: string): Record<string, unknown> {
  const parsed = parse(text)
  if (parsed === null || parsed === undefined)
    return {}
  if (typeof parsed !== 'object' || Array.isArray(parsed))
    throw new Error('YAML document must be a mapping/object')
  return parsed as Record<string, unknown>
}

/**
 * Parse YAML from a list of lines.
 * Kept as a thin wrapper because tests and callers already use this helper.
 */
export function parseYamlLines(lines: string[]): Record<string, unknown> {
  return parseYamlText(lines.join('\n'))
}

/**
 * Parse YAML frontmatter (between `---` delimiters) from change file content.
 * Returns null if no frontmatter block is found.
 */
export function parseFrontmatter(content: string): Frontmatter | null {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)\r?\n/)
  if (!m)
    return null
  return parseYamlText(m[1]) as Frontmatter
}

/** Count semantic checkboxes ([ ], [/], [x], [-]) in content. */
export function countCheckboxes(content: string): CheckboxCount {
  const todo = (content.match(/\[ \]/g) || []).length
  const progress = (content.match(/\[\/\]/g) || []).length
  const done = (content.match(/\[x\]/g) || []).length
  const dropped = (content.match(/\[-\]/g) || []).length
  return { todo, progress, done, dropped, total: todo + progress + done + dropped }
}

interface WalkOptions {
  onError?: (diagnostic: RuntimeDiagnostic) => void
}

/** Recursively walk a directory, returning paths to all .md files. */
export async function walkMarkdownFiles(dir: string, options: WalkOptions = {}): Promise<string[]> {
  const all = await walkFiles(dir, options)
  return all.filter(f => f.endsWith('.md'))
}

export interface UnsupportedRulesEntry {
  path: string
  kind: 'file' | 'directory'
}

export interface UnsupportedRulesInspection {
  entries: UnsupportedRulesEntry[]
  diagnostics: RuntimeDiagnostic[]
  directoryRemaining: boolean
}

/** Inspect obsolete custom rules that require manual semantic migration. */
export async function inspectUnsupportedRules(): Promise<UnsupportedRulesInspection> {
  const rulesDir = join(RSP_DIR, 'rules')
  const diagnostics: RuntimeDiagnostic[] = []
  const rawEntries = await walkAllEntries(rulesDir, diagnostics)
  const entries = rawEntries
    .filter(entry => entry.path !== OBSOLETE_RSP_RULES_PATH)
    .map(entry => ({
      path: normalizeLogicalPath(relative(rulesDir, entry.path)),
      kind: entry.kind,
    }))
  const obsoleteFallbackPresent = existsSync(OBSOLETE_RSP_RULES_PATH)

  return {
    entries,
    diagnostics,
    directoryRemaining: existsSync(rulesDir) && (!obsoleteFallbackPresent || entries.length > 0),
  }
}

async function walkAllEntries(dir: string, diagnostics: RuntimeDiagnostic[]): Promise<Array<{ path: string, kind: 'file' | 'directory' }>> {
  const entries: Array<{ path: string, kind: 'file' | 'directory' }> = []
  try {
    const items = await readdir(dir, { withFileTypes: true })
    for (const item of items) {
      const path = join(dir, item.name)
      const kind = item.isDirectory() ? 'directory' : 'file'
      entries.push({ path, kind })
      if (kind === 'directory')
        entries.push(...await walkAllEntries(path, diagnostics))
    }
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      diagnostics.push({
        code: 'walk_failed',
        operation: 'readdir',
        path: dir,
        message: toErrorMessage(error),
      })
    }
  }
  return entries
}

/** Recursively walk a directory, returning all entry paths (no file type filter). */
export async function walkFiles(dir: string, options: WalkOptions = {}): Promise<string[]> {
  const files: string[] = []
  try {
    const items = await readdir(dir, { withFileTypes: true })
    for (const item of items) {
      if (item.name.startsWith('.'))
        continue
      const filePath = join(dir, item.name)
      if (item.isDirectory())
        files.push(...await walkFiles(filePath, options))
      else
        files.push(filePath)
    }
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      options.onError?.({
        code: 'walk_failed',
        operation: 'readdir',
        path: dir,
        message: toErrorMessage(error),
      })
    }
  }
  return files
}

/** Normalize a relative path into the logical RSP name format using `/`. */
export function normalizeLogicalPath(pathValue: string): string {
  return pathValue.split(sep).join('/').replace(/\\/g, '/')
}

/** Generate a change file content from the built-in single-file template. */
export function generateChangeContent(name: string, summary = '', kind?: string, options: { lite?: boolean } = {}): string {
  const placeholder = '<…>'
  const proposalSummary = summary || placeholder

  if (name === 'project-setup') {
    return `---
kind: ops
---

${renderDocumentTitle(CHANGE_DOCUMENT_SCHEMA, 'project-setup')}

${changeSectionHeading('proposal')}
- Outcome: ${proposalSummary}
- Why:
  - ${placeholder}
- Scope:
  - ${placeholder}
- Non-goals:
  - ${placeholder}

${changeSectionHeading('spec')}
### ADDED
- Requirement: ${placeholder}
  - ${placeholder}

### Acceptance
#### Scenario: ${placeholder}
- GIVEN ${placeholder}
- WHEN ${placeholder}
- THEN ${placeholder}

${changeSectionHeading('design')}
- Approach:
  - ${placeholder}
- Boundaries:
  - ${placeholder}
- Affected areas:
  - .rsp/specs/design.md
  - CONTEXT.md
  - AGENTS.md
- Durable outcome targets:
  - Current facts: ${placeholder}
  - Lasting rationale: ${placeholder}
- Constraints:
  - ${placeholder}

${changeSectionHeading('tasks')}
- [ ] .rsp/specs/design.md: ${placeholder}
- [ ] CONTEXT.md: ${placeholder}
- [ ] AGENTS.md: ${placeholder}

${changeSectionHeading('verify')}
- Automated:
  - [ ] rsp doctor — proves: ${placeholder}
- Manual or environment:
  - [ ] ${placeholder}
- Coverage:
  - ${placeholder}

${changeSectionHeading('blockers')}
- none
`
  }

  const frontmatterKind = kind ?? '<choose: feature | fix | refactor | docs | ops | research>'
  if (options.lite)
    return generateLiteChangeContent(name, proposalSummary, frontmatterKind)

  const template = getChangeTemplateByKind(kind)

  return `---
kind: "${frontmatterKind}"
---

${renderDocumentTitle(CHANGE_DOCUMENT_SCHEMA, name)}

${changeSectionHeading('proposal')}
- Outcome: ${proposalSummary}
- Why:
  - ${template.why}
- Scope:
  - ${template.scope}
- Non-goals:
  - ${template.nonGoals}

${changeSectionHeading('spec')}
${template.specSection}

### Acceptance
${template.acceptanceSection}

${changeSectionHeading('design')}
- Approach:
  - ${template.approach}
- Boundaries:
  - ${placeholder}
- Affected areas:
  - ${template.affectedArea1}
  - ${template.affectedArea2}
- Constraints:
  - ${template.constraints}

${changeSectionHeading('tasks')}
- [ ] ${template.task}

${changeSectionHeading('verify')}
- Automated:
  - [ ] ${template.automatedVerify} — proves: ${placeholder}
- Manual or environment:
  - [ ] ${template.manualVerify}
- Coverage:
  - ${placeholder}

${changeSectionHeading('blockers')}
- none
`
}

function generateLiteChangeContent(name: string, proposalSummary: string, frontmatterKind: string): string {
  const placeholder = '<…>'
  return `---
kind: "${frontmatterKind}"
---

${renderDocumentTitle(CHANGE_DOCUMENT_SCHEMA, name)}

${changeSectionHeading('proposal')}
- Outcome: ${proposalSummary}
- Why:
  - ${placeholder}
- Scope:
  - ${placeholder}
- Non-goals:
  - none

${changeSectionHeading('spec')}
### MODIFIED
- Requirement: ${placeholder}
  - ${placeholder}

### Acceptance
#### Scenario: ${placeholder}
- GIVEN ${placeholder}
- WHEN ${placeholder}
- THEN ${placeholder}

${changeSectionHeading('design')}
- Approach:
  - ${placeholder}
- Boundaries:
  - ${placeholder}
- Affected areas:
  - ${placeholder}
- Constraints:
  - ${placeholder}

${changeSectionHeading('tasks')}
- [ ] ${placeholder}

${changeSectionHeading('verify')}
- Automated:
  - [ ] ${placeholder} — proves: ${placeholder}
- Manual or environment:
  - [ ] ${placeholder}
- Coverage:
  - ${placeholder}

${changeSectionHeading('blockers')}
- none
`
}

function getChangeTemplateByKind(kind?: string) {
  const placeholder = '<…>'
  const delta = kind === 'feature' || kind === 'research' || kind === undefined ? 'ADDED' : 'MODIFIED'
  return {
    why: placeholder,
    scope: placeholder,
    nonGoals: placeholder,
    specSection: `<!-- ${placeholder} -->\n### ${delta}\n- Requirement: ${placeholder}\n  - ${placeholder}`,
    acceptanceSection: `#### Scenario: ${placeholder}\n- GIVEN ${placeholder}\n- WHEN ${placeholder}\n- THEN ${placeholder}`,
    approach: placeholder,
    affectedArea1: placeholder,
    affectedArea2: placeholder,
    constraints: placeholder,
    task: placeholder,
    automatedVerify: placeholder,
    manualVerify: placeholder,
  }
}

function changeSectionHeading(sectionId: typeof CHANGE_DOCUMENT_SCHEMA.sections[number]['id']): string {
  return renderDocumentSectionHeading(CHANGE_DOCUMENT_SCHEMA, sectionId)
}

/** Render the managed RSP block for AGENTS.md. */
export function renderRspAgentsBlock(): string {
  return `${RSP_AGENTS_BEGIN}
## RSP Entry

RSP tracks current work, stable specs, and archives under \`.rsp/\`.

Read in order:
1. Nearest \`AGENTS.md\` for project or module instructions.
2. Root \`CONTEXT-MAP.md\` if present, then the relevant nearest \`CONTEXT.md\`.
3. The \`rsp\` skill; if unavailable, read \`.rsp/rsp-rules.md\` as the fallback protocol.
4. \`.rsp/focus.d/\`; for grouped work read the sibling Group Brief, then the explicitly selected focused Change.
5. Only the relevant Specs and Decision Records under the configured authoritative path.

If \`.rsp/focus.d/\` is empty and the user has not provided a concrete task, ask what to work on or suggest \`npx -y @oevery/rsp create <name>\` for tracked work.
Do not treat \`.rsp/specs/\` or \`.rsp/changes/\` as replacements for nearest \`AGENTS.md\` or \`CONTEXT.md\`.
${RSP_AGENTS_END}`
}

/** Update AGENTS.md with the managed RSP block while preserving user content. */
export function upsertRspAgentsBlock(content: string): { content: string, changed: boolean } {
  const block = renderRspAgentsBlock()
  const managedRe = /<!-- rsp:begin -->[\s\S]*?<!-- rsp:end -->/
  if (managedRe.test(content)) {
    const next = content.replace(managedRe, block)
    return { content: next, changed: next !== content }
  }

  const trimmed = content.trimStart()
  const next = trimmed ? `${block}\n\n${trimmed}` : `${block}\n`
  return { content: next, changed: true }
}

/** Check whether AGENTS.md already contains a managed RSP block. */
export function hasRspAgentsBlock(content: string): boolean {
  return content.includes(RSP_AGENTS_BEGIN) && content.includes(RSP_AGENTS_END)
}

/** Valid additional Spec name pattern (kebab-case with optional subdirectories). */
export const SPEC_NAME_RE = /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/

/** Validate an additional Spec name against the kebab-case pattern. */
export function isValidSpecName(name: string): boolean {
  return SPEC_NAME_RE.test(name)
}

/** Guard: ensure RSP is initialized. Exits with error if not. */
export function guardRspInitialized(): void {
  const designPath = join(RSP_DIR, 'specs', 'design.md')
  const rules = inspectManagedFile(RSP_RULES_PATH, 'fallback protocol', { allowMissing: true })
  const design = inspectManagedFile(designPath, 'design Spec', { allowMissing: true })
  if (rules.issue || design.issue || !rules.exists || !design.exists) {
    const initialized = existsSync(RSP_DIR)
    console.error(`  ${pc.red('Error:')} ${initialized ? 'RSP project requires an update' : 'RSP is not initialized in this project'}`)
    console.error(`  ${pc.dim(initialized ? 'Run: rsp update' : 'Run: rsp init')}`)
    process.exit(1)
  }
}

/** Filter checkbox todo lines from a section body. */
export function getOpenCheckboxes(sectionText: string): string[] {
  return sectionText
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^- \[[ /]\]/.test(line))
}

/** Remove empty parent directories up to (but not including) stopDir. */
export async function cleanupEmptyParentDirs(path: string, stopDir: string) {
  let parent = dirname(path)
  while (parent !== stopDir) {
    try {
      const remaining = await readdir(parent)
      if (remaining.length === 0)
        await rmdir(parent)
      else
        break
    }
    catch {
      break
    }
    parent = dirname(parent)
  }
}

/** Detect project name from package.json or fall back to directory name. */
export async function detectProjectName(): Promise<string> {
  try {
    if (existsSync('package.json')) {
      const raw = await readFile('package.json', 'utf-8')
      const pkg = JSON.parse(raw)
      if (pkg.name && pkg.name !== '')
        return pkg.name
    }
  }
  catch { /* fall through */ }
  return basename(process.cwd())
}

/** Generate the default project design spec template. */
export function generateDesignContent(projectName: string): string {
  const placeholder = '<…>'
  return `# Project Design: ${projectName}

## Purpose
- ${placeholder}

## Stable Facts
- ${placeholder}

## Boundaries
- In scope:
  - ${placeholder}
- Out of scope:
  - ${placeholder}

## Structure
- ${placeholder}

## Constraints
- ${placeholder}
`
}

/** Generate a generic project spec template. */
export function generateSpecContent(name: string): string {
  const title = toTitleCase(name)
  const placeholder = '<…>'
  return `# ${title}

## Purpose
- ${placeholder}

## Stable Facts
- ${placeholder}

## Boundaries
- In scope:
  - ${placeholder}
- Out of scope:
  - ${placeholder}

## Constraints
- ${placeholder}
`
}

function toTitleCase(value: string): string {
  return value
    .split(/[-/]/g)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/** Extract normalized semantic lines from Blockers, excluding well-formed Markdown HTML comments. */
export function extractBlockerLines(content: string): string[] {
  const document = parseRspDocument(content, CHANGE_DOCUMENT_SCHEMA)
  return normalizeBlockerBody(getDocumentSectionBody(document, 'blockers'))
}

/** Return true when one already-indexed Blockers body contains a real blocker entry. */
export function hasMeaningfulBlockerBody(body: string): boolean {
  return hasMeaningfulBlockerLines(normalizeBlockerBody(body))
}

function normalizeBlockerBody(body: string): string[] {
  return body.replace(/<!--[\s\S]*?-->/g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

/** Return true when the Blockers section contains a real blocker entry. */
export function hasMeaningfulBlockers(content: string): boolean {
  return hasMeaningfulBlockerLines(extractBlockerLines(content))
}

/** Return true when normalized Blockers-section lines contain a real blocker entry. */
export function hasMeaningfulBlockerLines(lines: string[]): boolean {
  if (lines.length === 0)
    return false

  return lines.some(line => !/^[-*]\s*(?:none)?$/i.test(line) && !/^none$/i.test(line))
}

/**
 * Detect if the Spec section contains lightweight delta markers (ADDED/MODIFIED/REMOVED).
 * Matches `### ADDED`, `### MODIFIED`, `### REMOVED` sub-headings under `## Spec`.
 */
export function detectDeltaSections(content: string): DeltaSections {
  const document = parseRspDocument(content, CHANGE_DOCUMENT_SCHEMA)
  const body = getDocumentSectionBody(document, 'spec')
  return {
    added: /^###\s*ADDED/im.test(body),
    modified: /^###\s*MODIFIED/im.test(body),
    removed: /^###\s*REMOVED/im.test(body),
  }
}

export interface ArchiveReadiness {
  taskTodos: string[]
  verifyTodos: string[]
  activeBlockers: boolean
  scenarioCount: number
  missingScenarios: boolean
  deterministic: 'pass' | 'warnings'
  semantic: 'needs-review'
  archiveReady: 'yes' | 'judgment' | 'no'
  warnings: string[]
}

export interface DurableReviewGuidance {
  required: true
  factDecisions: string[]
  rationaleDecisions: string[]
  factCandidateTargets: string[]
  decisionRecordsPath: string
  note: string
}

/**
 * Collect deterministic archive readiness details for a change file.
 * Used by both `rsp archive` and `rsp ready`.
 */
export function collectArchiveReadiness(content: string, options: { activeBlockers?: boolean } = {}): ArchiveReadiness {
  const warnings: string[] = []
  const document = parseRspDocument(content, CHANGE_DOCUMENT_SCHEMA)
  const tasksSection = getDocumentSectionBody(document, 'tasks')
  const verifySection = getDocumentSectionBody(document, 'verify')

  const taskTodos = getOpenCheckboxes(tasksSection)
  if (taskTodos.length > 0)
    warnings.push(`${taskTodos.length} task item(s) still incomplete`)

  const verifyTodos = getOpenCheckboxes(verifySection)
  if (verifyTodos.length > 0)
    warnings.push(`${verifyTodos.length} Verify checklist item(s) are still incomplete`)

  const activeBlockers = options.activeBlockers ?? hasMeaningfulBlockers(content)
  if (activeBlockers)
    warnings.push('active blockers are present in the change file')

  const scenarios = parseScenarios(content)
  const missingScenarios = scenarios.length === 0
  if (missingScenarios)
    warnings.push('no Scenario blocks found (some changes do not need them)')

  const archiveReady = activeBlockers
    ? 'no'
    : warnings.length === 0
      ? 'yes'
      : 'judgment'

  return {
    taskTodos,
    verifyTodos,
    activeBlockers,
    scenarioCount: scenarios.length,
    missingScenarios,
    deterministic: warnings.length === 0 ? 'pass' : 'warnings',
    semantic: 'needs-review',
    archiveReady,
    warnings,
  }
}

export function buildDurableReviewGuidance(factCandidateTargets: string[], decisionRecordsPath: string): DurableReviewGuidance {
  return {
    required: true,
    factDecisions: [
      'No current-fact update needed',
      'Update existing spec or scoped instruction',
      'Create a new durable spec',
    ],
    rationaleDecisions: [
      'No Decision Record needed',
      'Create or update a Decision Record',
    ],
    factCandidateTargets,
    decisionRecordsPath,
    note: 'Semantic review decides current-fact and lasting-rationale updates independently. The CLI never infers scoped instruction or Decision Record filenames and never promotes Change content automatically.',
  }
}

export function getDurableReviewCandidateTargets(): string[] {
  return ['.rsp/specs/design.md']
}

/** Collect deterministic archive checklist item strings for a change file. */
export function collectArchiveChecklist(content: string, options: { activeBlockers?: boolean } = {}): string[] {
  return collectArchiveReadiness(content, options).warnings
}

/**
 * Parse structured Given/When/Then scenario blocks from change content.
 * Matches `### Scenario: Name` or `#### Scenario: Name` followed by bullet steps.
 */
export function parseScenarios(content: string): ScenarioBlock[] {
  const scenarios: ScenarioBlock[] = []
  // eslint-disable-next-line regexp/no-super-linear-backtracking
  const regex = /^#{3,4}\s*Scenario:\s*(.+)$/gim
  let match

  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(content)) !== null) {
    const heading = match[1].trim()
    const startPos = match.index + match[0].length
    const restContent = content.slice(startPos)
    const nextSection = restContent.match(/^#{3,4}\s/m)
    const block = nextSection ? restContent.slice(0, nextSection.index) : restContent
    const steps = block
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.startsWith('-') && /GIVEN|WHEN|THEN|AND|BUT/i.test(s))
      .map(s => s.replace(/^[-*]\s*/, ''))
    if (steps.length > 0)
      scenarios.push({ heading, steps })
  }

  return scenarios
}
