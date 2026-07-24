import { spawnSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { mkdirSync, renameSync, rmSync, symlinkSync, utimesSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export interface StatusCliCapture {
  name: string
  argv: string[]
  status: number | null
  stdout: string
  stderr: string
  json?: unknown
}

interface MatrixCase {
  name: string
  argv: string[]
  setup: (root: string) => Promise<(() => void) | void>
}

const DAY_MS = 24 * 60 * 60 * 1000

export function hashText(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function hashJson(value: unknown): string {
  return hashText(JSON.stringify(value))
}

export async function captureStatusCliMatrix(cliPath: string): Promise<StatusCliCapture[]> {
  const captures: StatusCliCapture[] = []
  for (const matrixCase of matrixCases()) {
    const root = join(tmpdir(), `rsp-status-oracle-${matrixCase.name}-${randomUUID()}`)
    let cleanupFixture: (() => void) | undefined
    try {
      await createBase(root)
      const setupCleanup = await matrixCase.setup(root)
      cleanupFixture = typeof setupCleanup === 'function' ? setupCleanup : undefined
      const result = spawnSync('node', [cliPath, 'status', ...matrixCase.argv], {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1', TZ: 'UTC' },
      })
      const capture: StatusCliCapture = {
        name: matrixCase.name,
        argv: matrixCase.argv,
        status: result.status,
        stdout: result.stdout,
        stderr: result.stderr,
      }
      if (matrixCase.argv.includes('--json') && result.stdout.trim())
        capture.json = JSON.parse(result.stdout)
      captures.push(capture)
    }
    finally {
      cleanupFixture?.()
      rmSync(root, { force: true, recursive: true })
    }
  }
  return captures
}

function matrixCases(): MatrixCase[] {
  return [
    { name: 'empty-human', argv: [], setup: async () => {} },
    { name: 'focused-human', argv: [], setup: focusedFixture },
    { name: 'focused-json-success', argv: ['--json'], setup: focusedFixture },
    { name: 'grouped-human', argv: [], setup: groupedFixture },
    { name: 'grouped-json', argv: ['--json'], setup: groupedFixture },
    { name: 'filtered-blocked-human', argv: ['--blocked'], setup: richFixture },
    { name: 'filtered-stale-human', argv: ['--stale', '14'], setup: richFixture },
    { name: 'completed-long-workref-human', argv: [], setup: completedLongFixture },
    { name: 'archive-trend-human', argv: [], setup: archiveTrendFixture },
    { name: 'compact-json', argv: ['--json', '--compact'], setup: richFixture },
    { name: 'verbose-runtime-human', argv: ['--verbose'], setup: malformedFrontmatterFixture },
    { name: 'diagnostic-human', argv: [], setup: missingFocusedFixture },
    { name: 'diagnostic-json', argv: ['--json'], setup: missingFocusedFixture },
    { name: 'invalid-filter-human', argv: ['--stale', 'nope'], setup: async () => {} },
    { name: 'invalid-filter-json', argv: ['--json', '--stale', 'nope'], setup: async () => {} },
    { name: 'invalid-work-tree-human', argv: [], setup: invalidWorkTreeFixture },
    { name: 'invalid-work-tree-json', argv: ['--json'], setup: invalidWorkTreeFixture },
  ]
}

async function createBase(root: string): Promise<void> {
  for (const directory of ['specs', 'changes', 'archives', 'focus.d'])
    await mkdir(join(root, '.rsp', directory), { recursive: true })
}

async function focusedFixture(root: string): Promise<void> {
  await writeChange(root, 'focused-one')
  await writeChange(root, 'unfocused-one')
  await writeFile(join(root, '.rsp', 'focus.d', 'focused-one'), '')
}

async function groupedFixture(root: string): Promise<void> {
  const groupRoot = join(root, '.rsp', 'changes', 'delivery')
  await mkdir(groupRoot, { recursive: true })
  await writeFile(join(groupRoot, '00-brief.md'), renderGroupBrief())
  await writeFile(join(groupRoot, 'api.md'), renderChange('delivery/api', { blocker: 'waiting for API approval' }))
  await writeFile(join(groupRoot, 'ui.md'), renderChange('delivery/ui'))
}

async function richFixture(root: string): Promise<void> {
  const stalePath = await writeChange(root, 'stale-ready')
  await writeChange(root, 'blocked-one', { blocker: 'waiting for API approval' })
  await writeChange(root, 'fresh-ready')
  const oldDate = new Date(Date.now() - (20.5 * DAY_MS))
  utimesSync(stalePath, oldDate, oldDate)
}

async function completedLongFixture(root: string): Promise<void> {
  await writeChange(root, 'completed-change-with-a-deliberately-long-workref-name', { completed: true })
}

async function archiveTrendFixture(root: string): Promise<void> {
  await writeChange(root, 'current')
  await writeFile(join(root, '.rsp', 'archives', 'INDEX.md'), `| Archived | Kind | Summary |\n| --- | --- | --- |\n| 2026-05-01 | feature | one |\n| 2026-05-03 | fix | two |\n| 2026-06-01 | docs | three |\n`)
}

async function malformedFrontmatterFixture(root: string): Promise<void> {
  await writeFile(join(root, '.rsp', 'changes', 'broken.md'), `---\nkind: [broken\n---\n\n# Change: broken\n\n## Blockers\n- none\n`)
}

async function missingFocusedFixture(root: string): Promise<void> {
  await writeFile(join(root, '.rsp', 'focus.d', 'missing-change'), '')
}

async function invalidWorkTreeFixture(root: string): Promise<() => void> {
  const external = join(tmpdir(), `rsp-status-oracle-external-${randomUUID()}`)
  try {
    mkdirSync(external, { recursive: true })
    const changes = join(root, '.rsp', 'changes')
    const replacement = `${changes}-replacement`
    symlinkSync(external, replacement)
    rmSync(changes, { recursive: true })
    renameSync(replacement, changes)
    return () => rmSync(external, { force: true, recursive: true })
  }
  catch (error) {
    rmSync(external, { force: true, recursive: true })
    throw error
  }
}

async function writeChange(root: string, name: string, options: { blocker?: string, completed?: boolean } = {}): Promise<string> {
  const path = join(root, '.rsp', 'changes', `${name}.md`)
  await writeFile(path, renderChange(name, options))
  return path
}

function renderChange(name: string, options: { blocker?: string, completed?: boolean } = {}): string {
  const checkbox = options.completed ? 'x' : ' '
  return `---
kind: feature
---

# Change: ${name}

## Proposal
- Outcome: ${name}

## Spec
### ADDED
- Requirement: ${name}

### Acceptance
#### Scenario: ${name}
- GIVEN a project
- WHEN status runs
- THEN ${name} is shown

## Design
- Approach: keep it fixed

## Tasks
- [${checkbox}] implement ${name}

## Verify
- [${checkbox}] verify ${name}

## Blockers
- ${options.blocker ?? 'none'}
`
}

function renderGroupBrief(): string {
  return `---
kind: feature
---

# Change Group: delivery

## Goal
- Deliver API and UI slices.

## Scope
- delivery group

## Shared Constraints
- Keep slices independent.

## Slices
- \`delivery/api\`: API slice.
- \`delivery/ui\`: UI slice.

## Completion Conditions
- [ ] both slices archived

## Durable Outcomes
- Current facts: none
- Lasting rationale: none

## Blockers
- none
`
}
