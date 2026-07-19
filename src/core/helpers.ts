import type { CheckboxCount, DeltaSections, Frontmatter, RuntimeDiagnostic, ScenarioBlock } from '../types.js'
import { existsSync } from 'node:fs'
import { readdir, readFile, rmdir } from 'node:fs/promises'

import { basename, dirname, join, relative, sep } from 'node:path'
import { parse } from 'yaml'
import { OBSOLETE_RSP_RULES_PATH, pc, RSP_DIR, RSP_RULES_PATH } from './config.js'
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
  const proposalSummary = summary || (name === 'project-setup'
    ? 'Capture the project model, boundaries, and stable local constraints'
    : '<one-line summary>')

  if (name === 'project-setup') {
    return `---
kind: ops
---

# Change: project-setup

## Proposal
- Summary: ${proposalSummary}
- Why:
  - Establish a durable project model before normal implementation work starts
- Scope:
  - Review the repository structure, entrypoints, and primary outputs
  - Fill .rsp/specs/design.md with durable architecture facts
  - Add stable local instructions or validation steps to the nearest project-owned AGENTS.md when needed
- Non-goals:
  - Do not duplicate durable project facts across this change, specs, and AGENTS.md

## Spec
### ADDED
- Requirement: project bootstrap capture
  - The repository's purpose, scope, and structure are reflected in .rsp/specs/design.md

### MODIFIED
- Requirement: stable local operating constraints
  - Stable validation or workflow constraints are reflected in the nearest project-owned AGENTS.md when needed

### Acceptance
#### Scenario: project model captured
- GIVEN an initialized RSP project
- WHEN project setup is completed
- THEN .rsp/specs/design.md reflects durable project facts
- AND the nearest project-owned AGENTS.md contains only the stable local instructions that agents must follow

## Design
- Approach:
  - Keep bootstrap knowledge in this single change while moving durable facts into specs and scoped instructions into AGENTS.md
- Affected areas:
  - .rsp/specs/design.md
  - AGENTS.md
- Constraints:
  - Keep the setup lightweight and avoid duplicating durable project facts

## Tasks
- [ ] Review the repository structure, entrypoints, and primary outputs
- [ ] Review AGENTS.md and confirm the RSP entry points to the right project files
- [ ] Fill .rsp/specs/design.md with durable architecture facts
- [ ] Add stable local rules or validation steps to the nearest project-owned AGENTS.md if needed

## Verify
- Automated:
  - [ ] Run rsp doctor
- Manual:
  - [ ] Review .rsp/specs/design.md and the nearest project-owned AGENTS.md and confirm they match the repository
- Durable updates:
  - [ ] Decide whether this change produced durable knowledge that belongs in \`.rsp/specs/\` or stable instructions that belong in the nearest project-owned \`AGENTS.md\`
  - [ ] If yes, write only stable facts to the smallest correct target file before archive; do not promote task history, debugging notes, or one-off implementation context

## Blockers
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

# Change: ${name}

## Proposal
- Summary: ${proposalSummary}
- Why:
  - ${template.why}
- Scope:
  - ${template.scope}
- Non-goals:
  - ${template.nonGoals}

## Spec
${template.specSection}

### Acceptance
${template.acceptanceSection}

## Design
- Approach:
  - ${template.approach}
- Affected areas:
  - ${template.affectedArea1}
  - ${template.affectedArea2}
- Constraints:
  - ${template.constraints}

## Tasks
- [ ] Finalize the proposal, spec, and design details for this change
- [ ] ${template.task}
- [ ] Verify the result and update any required durable specs or scoped instructions

## Verify
- Automated:
  - [ ] ${template.automatedVerify}
- Manual:
  - [ ] ${template.manualVerify}
- Durable updates:
  - [ ] Decide whether this change produced durable knowledge that belongs in \`.rsp/specs/\` or stable instructions that belong in the nearest project-owned \`AGENTS.md\`
  - [ ] If yes, write only stable facts to the smallest correct target file before archive; do not promote task history, debugging notes, or one-off implementation context

## Blockers
- none
`
}

function generateLiteChangeContent(name: string, proposalSummary: string, frontmatterKind: string): string {
  return `---
kind: "${frontmatterKind}"
---

# Change: ${name}

## Proposal
- Summary: ${proposalSummary}
- Why:
  - <why this small change matters>
- Scope:
  - <what will change>
- Non-goals:
  - none

## Spec
### MODIFIED
- Requirement: <observable outcome>
  - <what should be true after this change>

### Acceptance
#### Scenario: change is complete
- GIVEN <current context>
- WHEN <the change is applied>
- THEN <expected outcome>

## Design
- Approach:
  - <minimal implementation approach>
- Affected areas:
  - <primary file, directory, or doc path>
- Constraints:
  - <important constraint, or none>

## Tasks
- [ ] Implement the small change
- [ ] Verify the result

## Verify
- Automated:
  - [ ] <exact command, or not needed: reason>
- Manual:
  - [ ] <exact scenario, or not needed: reason>
- Durable updates:
  - [ ] Decide whether this change produced durable knowledge that belongs in ".rsp/specs/" or stable instructions that belong in the nearest project-owned "AGENTS.md"
  - [ ] If yes, write only stable facts to the smallest correct target file before archive

## Blockers
- none
`
}

function getChangeTemplateByKind(kind?: string) {
  switch (kind) {
    case 'feature':
      return {
        why: '<what user need or capability gap this addresses>',
        scope: '<what new behavior or capability will be delivered>',
        nonGoals: '<what related capabilities are explicitly out of scope>',
        specSection: '<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->\n### ADDED\n- Requirement: <new user-facing behavior>\n  - <verifiable requirement for the new capability>',
        acceptanceSection: '#### Scenario: user exercises the new capability\n- GIVEN <context>\n- WHEN <user action>\n- THEN <expected new behavior>',
        approach: '<how the new capability will be implemented>',
        affectedArea1: '<concrete file path, directory, module, or subsystem 1>',
        affectedArea2: '<concrete file path, directory, module, or subsystem 2 if needed>',
        constraints: '<behavior, compatibility, performance, safety, or scope constraint that must hold>',
        task: '<implement the new behavior and its acceptance scenario in the affected areas>',
        automatedVerify: '<exact test, lint, build, or check command for the new behavior>',
        manualVerify: '<exact end-to-end user scenario to validate the new capability>',
      }
    case 'fix':
      return {
        why: '<what current behavior is wrong or broken>',
        scope: '<what specific defect is being corrected>',
        nonGoals: '<what related but separate issues are out of scope>',
        specSection: '<!-- Describe expected correct behavior. Implementation notes belong in ## Design. -->\n### MODIFIED\n- Requirement: correct behavior\n  - <expected correct behavior after the fix>',
        acceptanceSection: '#### Scenario: defect is resolved\n- GIVEN <conditions that trigger the defect>\n- WHEN <action that previously failed>\n- THEN <expected correct outcome>\n- AND the original broken outcome no longer occurs',
        approach: '<root cause analysis and fix strategy>',
        affectedArea1: '<concrete file path, directory, module, or subsystem containing the defect>',
        affectedArea2: '<secondary path, dependency, or test file if needed>',
        constraints: '<regression, backward-compatibility, safety, or scope constraint that must hold>',
        task: '<identify the root cause and apply the minimal fix>',
        automatedVerify: '<exact regression test, lint, build, or check command that proves the fix>',
        manualVerify: '<exact steps to reproduce the original issue and confirm it no longer occurs>',
      }
    case 'refactor':
      return {
        why: '<what maintainability, readability, or structural issue motivates this>',
        scope: '<what code areas are being restructured>',
        nonGoals: '<no behavior change is expected or intended>',
        specSection: '<!-- Describe the desired structural outcome. Implementation notes belong in ## Design. -->\n### MODIFIED\n- Requirement: internal structure improvement\n  - <desired structural outcome without observable behavior change>',
        acceptanceSection: '#### Scenario: behavior is preserved after restructuring\n- GIVEN the existing codebase before the refactor\n- WHEN the refactored code runs against existing tests\n- THEN all existing tests pass unchanged',
        approach: '<how the code will be restructured (rename, extract, move, etc.)>',
        affectedArea1: '<concrete file path, directory, module, or subsystem being refactored>',
        affectedArea2: '<secondary path, dependency, or test file if needed>',
        constraints: '<observable behavior must remain unchanged; compatibility, performance, and safety constraints must still hold>',
        task: '<restructure the code while keeping behavior identical>',
        automatedVerify: '<exact existing test, lint, build, or check command that must continue to pass>',
        manualVerify: '<exact scenario to spot-check that behavior is unchanged after the refactor>',
      }
    case 'docs':
      return {
        why: '<why the documentation change matters>',
        scope: '<which docs, readers, or workflows will be updated>',
        nonGoals: '<what documentation behavior or audience is out of scope>',
        specSection: '<!-- Describe what the reader should see or experience. Implementation notes belong in ## Design. -->\n### MODIFIED\n- Requirement: documentation accuracy\n  - <what durable reader-facing behavior or explanation changes>',
        acceptanceSection: '#### Scenario: reader follows the updated guidance\n- GIVEN the updated documentation\n- WHEN a reader follows the documented workflow\n- THEN the steps are accurate and sufficient',
        approach: '<how the documentation will be updated and organized>',
        affectedArea1: '<concrete doc path, directory, module doc, or documentation surface 1>',
        affectedArea2: '<secondary doc path or reference file if needed>',
        constraints: '<durable wording, consistency, scope, or audience constraint that must hold>',
        task: '<update the target documentation and supporting references>',
        automatedVerify: '<exact markdown, docs, link, lint, build, or check command if applicable>',
        manualVerify: '<exact reader or operator scenario to confirm the updated guidance is accurate>',
      }
    case 'research':
      return {
        why: '<what question or uncertainty this research resolves>',
        scope: '<what system area, option set, or hypothesis is being examined>',
        nonGoals: '<what implementation work is explicitly out of scope>',
        specSection: '<!-- Describe what finding or decision must be captured. Implementation notes belong in ## Design. -->\n### ADDED\n- Requirement: research outcome recording\n  - <what finding, option, or decision must be captured clearly>',
        acceptanceSection: '#### Scenario: research question is resolved\n- GIVEN the current uncertainty or open question\n- WHEN the investigation is completed\n- THEN the result is recorded clearly enough to guide follow-up work',
        approach: '<how the investigation will be performed and what evidence will be gathered>',
        affectedArea1: '<concrete file path, directory, module, subsystem, or source under investigation>',
        affectedArea2: '<secondary path, dependency, environment, or evidence source if needed>',
        constraints: '<time, evidence, safety, or scope constraint for the investigation>',
        task: '<gather evidence, record the recommendation or finding, and note any follow-up implementation work if needed>',
        automatedVerify: '<exact command, script, query, or check used to confirm the observed behavior>',
        manualVerify: '<exact review of the findings to confirm they answer the original question and identify follow-up work if needed>',
      }
    case 'ops':
      return {
        why: '<why this operational or environment change matters>',
        scope: '<what environment, workflow, or operational path changes>',
        nonGoals: '<what product or feature behavior will not change>',
        specSection: '<!-- Describe the reliable operational outcome. Implementation notes belong in ## Design. -->\n### MODIFIED\n- Requirement: operational behavior\n  - <what reliable operational outcome should change or stay true>',
        acceptanceSection: '#### Scenario: operational path succeeds\n- GIVEN the target environment or workflow\n- WHEN the operational change is applied\n- THEN the expected operational outcome is reliable',
        approach: '<how the operational change will be applied safely>',
        affectedArea1: '<concrete script, config path, workflow, environment path, or operational surface 1>',
        affectedArea2: '<secondary script, config path, dependency, or environment surface if needed>',
        constraints: '<rollback, safety, reliability, environment, or scope constraint that must hold>',
        task: '<apply and verify the operational change>',
        automatedVerify: '<exact operational validation, lint, build, deploy, or check command>',
        manualVerify: '<exact operator workflow or environment scenario to confirm the operational result>',
      }
    default:
      return {
        why: '<why this change matters>',
        scope: '<what this change will do>',
        nonGoals: '<what this change will not do>',
        specSection: '<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->\n### ADDED\n- Requirement: <new or updated behavior>\n  - <verifiable requirement>',
        acceptanceSection: '#### Scenario: <name>\n- GIVEN <context>\n- WHEN <action>\n- THEN <expected outcome>',
        approach: '<how the change will be implemented>',
        affectedArea1: '<concrete file path, directory, module, or subsystem 1>',
        affectedArea2: '<concrete file path, directory, module, or subsystem 2 if needed>',
        constraints: '<behavior, compatibility, performance, safety, or scope constraint that must hold>',
        task: '<implement the core change in the affected areas>',
        automatedVerify: '<exact test, lint, build, or check command>',
        manualVerify: '<exact end-to-end scenario to validate>',
      }
  }
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
4. \`.rsp/focus.d/\` and the explicitly selected focused Change.
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
  return `# Project Design: ${projectName}

## Purpose
- <what this project is responsible for>
- <who or what it serves>

## Stable Facts
- <durable fact that future agents or developers must know>
- <key architectural invariant>

## Boundaries
- In scope:
  - <major capability or boundary>
- Out of scope:
  - <intentional non-goal>

## Structure
- <important directory or subsystem> — <responsibility>

## Constraints
- <cross-cutting technical or operational constraint, when it affects architecture>
`
}

/** Generate a generic project spec template. */
export function generateSpecContent(name: string): string {
  const title = toTitleCase(name)
  return `# ${title}

## Purpose
- <why this project-level spec exists>

## Stable Facts
- <durable fact that future work must know>

## Boundaries
- In scope:
  - <what this spec covers>
- Out of scope:
  - <what this spec does not cover>

## Constraints
- <stable constraint, if any>
`
}

function toTitleCase(value: string): string {
  return value
    .split(/[-/]/g)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/** Extract the raw body of a `## <heading>` section. */
export function extractSection(content: string, heading: string): string {
  const lines = content.split('\n')
  const start = lines.findIndex(line => line.trim() === `## ${heading}`)
  if (start === -1)
    return ''

  const body: string[] = []
  for (let index = start + 1; index < lines.length; index++) {
    const line = lines[index]
    if (line.startsWith('## '))
      break
    body.push(line)
  }

  return body.join('\n').trim()
}

/** Return true when the Blockers section contains a real blocker entry. */
export function hasMeaningfulBlockers(content: string): boolean {
  const blockers = extractSection(content, 'Blockers')
  if (!blockers)
    return false

  const lines = blockers
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

  if (lines.length === 0)
    return false

  return lines.some(line => !/^[-*]\s*(?:none)?$/i.test(line) && !/^none$/i.test(line))
}

/**
 * Detect if the Spec section contains lightweight delta markers (ADDED/MODIFIED/REMOVED).
 * Matches `### ADDED`, `### MODIFIED`, `### REMOVED` sub-headings under `## Spec`.
 */
export function detectDeltaSections(content: string): DeltaSections {
  const body = extractSection(content, 'Spec')
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
export function collectArchiveReadiness(content: string): ArchiveReadiness {
  const warnings: string[] = []
  const tasksSection = extractSection(content, 'Tasks')
  const verifySection = extractSection(content, 'Verify')

  const taskTodos = getOpenCheckboxes(tasksSection)
  if (taskTodos.length > 0)
    warnings.push(`${taskTodos.length} task item(s) still incomplete`)

  const verifyTodos = getOpenCheckboxes(verifySection)
  if (verifyTodos.length > 0)
    warnings.push(`${verifyTodos.length} Verify checklist item(s) are still incomplete`)

  const activeBlockers = hasMeaningfulBlockers(content)
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
export function collectArchiveChecklist(content: string): string[] {
  return collectArchiveReadiness(content).warnings
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
