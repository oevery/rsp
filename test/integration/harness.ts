import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll } from 'vitest'
import { CHANGES_DIR, clearConfigCache, RSP_DIR } from '../../src/core/config.js'

let testDir: string
let origCwd: string
const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

export function rspPath(...parts: string[]) {
  return join(testDir, RSP_DIR, ...parts)
}

export function changesPath(...parts: string[]) {
  return join(testDir, CHANGES_DIR, ...parts)
}

export function focusDPath(...parts: string[]) {
  return rspPath('focus.d', ...parts)
}

export function archivePath(...parts: string[]) {
  return rspPath('archives', ...parts)
}

export function specPath(...parts: string[]) {
  return rspPath('specs', ...parts)
}

export function cliPath() {
  return join(repoRoot, 'dist', 'cli.mjs')
}

export function renderChange(name: string, extra = '') {
  return `---
kind: feature
---

# Change: ${name}

## Proposal
- Summary: ${name} summary
- Why:
  - because
- Scope:
  - ship ${name}
- Non-goals:
  - none

## Spec
### ADDED
- Requirement: ${name}
  - ${name} behavior

### Acceptance
#### Scenario: ${name}
- GIVEN a project
- WHEN ${name} runs
- THEN it works

## Design
- Approach:
  - implementation details
- Affected areas:
  - src/${name}.ts
- Constraints:
  - keep it small

## Tasks
- [ ] implement ${name}

## Verify
- Automated:
  - [ ] run tests
- Manual:
  - [ ] smoke test ${name}
- Durable updates:
  - [ ] decide whether this change produced durable knowledge for .rsp/specs/ or stable instructions for the nearest project-owned AGENTS.md
  - [ ] if yes, update the smallest correct target before archive

## Blockers
- none
${extra}`
}

export function renderGeneratedIndexMetadata(indexType: 'specs' | 'archives') {
  const title = indexType === 'specs' ? 'Specs Index' : 'Archive Index'
  const sourceDir = indexType === 'specs' ? '.rsp/specs' : '.rsp/archives'

  return `---
title: ${title}
summary: ${indexType === 'specs' ? 'Additional project-level specs beyond design.md.' : 'Completed RSP changes.'}
kind: generated-index
index_type: ${indexType}
source_dir: ${sourceDir}
entry_count: 0
---

# ${title}
`
}

export function renderGroupBrief(group: string, slices: string[], options: { complete?: boolean, blockers?: string } = {}) {
  const sliceLines = slices.map(name => `- \`${name}\`: independently executable ${name.split('/').at(-1)} slice`).join('\n')
  return `---
kind: group
---

# Change Group: ${group}

## Goal
- Ship ${group}

## Scope
- Coordinate the declared slices

## Shared Constraints
- Keep every slice independently verifiable

## Slices
${sliceLines}

## Completion Conditions
- [${options.complete ? 'x' : ' '}] End-to-end behavior is verified

## Durable Outcomes
- none

## Blockers
- ${options.blockers ?? 'none'}
`
}

export async function copyFixture(name: string): Promise<string> {
  const src = join(fileURLToPath(new URL('../', import.meta.url)), 'fixtures', name)
  const dest = join(tmpdir(), `rsp-fixture-${name}`, randomUUID())
  await cp(src, dest, { recursive: true })
  return dest
}

export async function createRspFixture(prefix: string, directories: string[] = ['specs', 'changes']): Promise<string> {
  const root = join(tmpdir(), prefix, randomUUID())
  for (const directory of directories)
    await mkdir(join(root, RSP_DIR, directory), { recursive: true })
  await writeFile(join(root, RSP_DIR, 'rsp-rules.md'), '# RSP\n')
  if (directories.includes('specs'))
    await writeFile(join(root, RSP_DIR, 'specs', 'design.md'), '# Design\n')
  return root
}

export async function completeOpenChange(root: string, name: string): Promise<void> {
  const path = join(root, '.rsp', 'changes', `${name}.md`)
  await writeFile(path, completeReopenChange(await readFile(path, 'utf-8')))
}

export function completeReopenChange(content: string): string {
  return content
    .replace('kind: "<choose: feature | fix | refactor | docs | ops | research>"', 'kind: feature')
    .replaceAll('- [ ]', '- [x]')
}

export async function createClosedGroupProject(prefix: string): Promise<string> {
  const root = join(tmpdir(), prefix, randomUUID())
  await mkdir(root, { recursive: true })
  execSync(`node ${cliPath()} init`, { cwd: root })
  execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: root })
  await writeFile(join(root, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui'], { complete: true }))
  execSync(`node ${cliPath()} create release/api`, { cwd: root })
  execSync(`node ${cliPath()} create release/ui`, { cwd: root })
  await completeOpenChange(root, 'release/api')
  await completeOpenChange(root, 'release/ui')
  execSync(`node ${cliPath()} archive release/api`, { cwd: root })
  execSync(`node ${cliPath()} archive release/ui`, { cwd: root })
  execSync(`node ${cliPath()} group close release`, { cwd: root })
  return root
}

beforeAll(async () => {
  testDir = join(tmpdir(), 'rsp-int-test', randomUUID())
  await mkdir(testDir, { recursive: true })
  origCwd = process.cwd()
  process.chdir(testDir)

  const dirs = ['specs', 'changes', 'archives', 'focus.d']
  for (const d of dirs)
    await mkdir(rspPath(d), { recursive: true })

  await writeFile(rspPath('rsp-rules.md'), '# RSP Rules\n')
  await writeFile(specPath('design.md'), '# Project Design: Integration Test\n')
})

afterAll(() => {
  process.chdir(origCwd)
  clearConfigCache()
})
