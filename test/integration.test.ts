import { Buffer } from 'node:buffer'
import { execFileSync, execSync, spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync, utimesSync } from 'node:fs'
import { chmod, cp, mkdir, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { CHANGES_DIR, clearConfigCache, RSP_DIR } from '../src/core/config.js'
import { parseFrontmatter } from '../src/core/helpers.js'

let testDir: string
let origCwd: string
const repoRoot = fileURLToPath(new URL('..', import.meta.url))

function rspPath(...parts: string[]) {
  return join(testDir, RSP_DIR, ...parts)
}

function changesPath(...parts: string[]) {
  return join(testDir, CHANGES_DIR, ...parts)
}

function focusDPath(...parts: string[]) {
  return rspPath('focus.d', ...parts)
}

function archivePath(...parts: string[]) {
  return rspPath('archives', ...parts)
}

function specPath(...parts: string[]) {
  return rspPath('specs', ...parts)
}

function cliPath() {
  return join(repoRoot, 'dist', 'cli.mjs')
}

function renderChange(name: string, extra = '') {
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

function renderGeneratedIndexMetadata(indexType: 'specs' | 'archives') {
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

function renderGroupBrief(group: string, slices: string[], options: { complete?: boolean, blockers?: string } = {}) {
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

async function copyFixture(name: string): Promise<string> {
  const src = join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures', name)
  const dest = join(tmpdir(), `rsp-fixture-${name}`, randomUUID())
  await cp(src, dest, { recursive: true })
  return dest
}

async function createRspFixture(prefix: string, directories: string[] = ['specs', 'changes']): Promise<string> {
  const root = join(tmpdir(), prefix, randomUUID())
  for (const directory of directories)
    await mkdir(join(root, RSP_DIR, directory), { recursive: true })
  await writeFile(join(root, RSP_DIR, 'rsp-rules.md'), '# RSP\n')
  if (directories.includes('specs'))
    await writeFile(join(root, RSP_DIR, 'specs', 'design.md'), '# Design\n')
  return root
}

async function createClosedGroupProject(prefix: string): Promise<string> {
  const root = join(tmpdir(), prefix, randomUUID())
  await mkdir(root, { recursive: true })
  execSync(`node ${cliPath()} init`, { cwd: root })
  execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: root })
  await writeFile(join(root, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui'], { complete: true }))
  execSync(`node ${cliPath()} create release/api`, { cwd: root })
  execSync(`node ${cliPath()} create release/ui`, { cwd: root })
  execSync(`node ${cliPath()} archive release/api`, { cwd: root })
  execSync(`node ${cliPath()} archive release/ui`, { cwd: root })
  execSync(`node ${cliPath()} group close release`, { cwd: root })
  return root
}

beforeAll(async () => {
  execSync('pnpm build', { cwd: repoRoot, stdio: 'pipe' })
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

describe('change lifecycle integration', () => {
  it('creates a change file', async () => {
    const { createChange } = await import('../src/commands/create.js')
    await createChange('test-change', 'A test change')

    const content = await readFile(changesPath('test-change.md'), 'utf-8')
    expect(content).toContain('# Change: test-change')
    expect(content).toContain('- Outcome: A test change')
    expect(existsSync(focusDPath('test-change'))).toBe(true)
  })

  it('prints next-step guidance aligned with the richer change template', () => {
    const createDir = join(tmpdir(), 'rsp-create-next-steps-test', randomUUID())
    return (async () => {
      await mkdir(createDir, { recursive: true })
      execSync(`node ${cliPath()} init`, { cwd: createDir })

      const output = execSync(`node ${cliPath()} create guided-change "Improve guidance"`, { cwd: createDir, encoding: 'utf-8' })
      expect(output).toContain('Next: fill proposal/spec/design first, then implement and complete the tasks')
    })()
  })

  it('supports subdirectory changes', async () => {
    const { createChange } = await import('../src/commands/create.js')
    await mkdir(changesPath('auth'), { recursive: true })
    await writeFile(changesPath('auth', '00-brief.md'), renderGroupBrief('auth', ['auth/login', 'auth/session']))
    await createChange('auth/login', 'Login change')
    await writeFile(changesPath('auth', 'session.md'), renderChange('auth/session'))

    expect(existsSync(changesPath('auth', 'login.md'))).toBe(true)
    expect(existsSync(focusDPath('auth', 'login'))).toBe(true)
  })

  it('supports one direct grouped Change across the CLI lifecycle', async () => {
    const groupDir = join(tmpdir(), 'rsp-grouped-change-lifecycle-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui']))

    execSync(`node ${cliPath()} create release/api --kind feature "Ship release API"`, { cwd: groupDir })
    const shown = JSON.parse(execSync(`node ${cliPath()} show release/api --json`, { cwd: groupDir, encoding: 'utf-8' }))
    const ready = JSON.parse(execSync(`node ${cliPath()} ready release/api --json`, { cwd: groupDir, encoding: 'utf-8' }))
    execSync(`node ${cliPath()} archive release/api`, { cwd: groupDir })

    expect(shown.change.name).toBe('release/api')
    expect(ready.change).toBe('release/api')
    expect(existsSync(join(groupDir, '.rsp', 'archives', 'release'))).toBe(true)
    expect((await readdir(join(groupDir, '.rsp', 'archives', 'release'))).some(name => name.endsWith('_api.md'))).toBe(true)
    expect(existsSync(join(groupDir, '.rsp', 'focus.d', 'release', 'api'))).toBe(false)
  })

  it('preserves one flat Chinese WorkRef across create, focus, archive, history, and reopen', async () => {
    const root = join(tmpdir(), 'rsp-unicode-flat-lifecycle-test', randomUUID())
    const workRef = '中文标题'
    await mkdir(root, { recursive: true })
    execFileSync('node', [cliPath(), 'init'], { cwd: root })
    execFileSync('node', [cliPath(), 'create', workRef, '保留中文文件名'], { cwd: root })
    const changePath = join(root, '.rsp', 'changes', `${workRef}.md`)
    expect(existsSync(changePath)).toBe(true)
    expect(existsSync(join(root, '.rsp', 'focus.d', workRef))).toBe(true)

    await writeFile(changePath, completeReopenChange(await readFile(changePath, 'utf-8')))
    execFileSync('node', [cliPath(), 'archive', workRef], { cwd: root })
    const history = JSON.parse(execFileSync('node', [cliPath(), 'history', workRef, '--json'], { cwd: root, encoding: 'utf-8' }))
    expect(history.record).toEqual(expect.objectContaining({ workRef, group: null }))
    expect(history.record.path).toMatch(/_中文标题\.md$/)

    execFileSync('node', [cliPath(), 'reopen', workRef, '--reason', '需要补充验证'], { cwd: root })
    expect(existsSync(changePath)).toBe(true)
    expect(await readFile(changePath, 'utf-8')).toContain('需要补充验证')
  })

  it('preserves Chinese grouped WorkRefs across dependency, archive, history, and reopen', async () => {
    const groupDir = join(tmpdir(), 'rsp-unicode-grouped-lifecycle-test', randomUUID())
    const group = '听说训练'
    const foundation = `${group}/基础`
    const simulation = `${group}/模拟朗读`
    await mkdir(groupDir, { recursive: true })
    execFileSync('node', [cliPath(), 'init'], { cwd: groupDir })
    execFileSync('node', [cliPath(), 'group', 'create', group, '提供听说训练'], { cwd: groupDir })
    await writeFile(
      join(groupDir, '.rsp', 'changes', group, '00-brief.md'),
      renderGroupBrief(group, [foundation, simulation]),
    )

    execFileSync('node', [cliPath(), 'create', foundation, '完成基础训练'], { cwd: groupDir })
    execFileSync('node', [cliPath(), 'create', simulation, '完成模拟朗读'], { cwd: groupDir })
    const foundationPath = join(groupDir, '.rsp', 'changes', group, '基础.md')
    const simulationPath = join(groupDir, '.rsp', 'changes', group, '模拟朗读.md')
    await writeFile(simulationPath, (await readFile(simulationPath, 'utf-8')).replace(
      '## Blockers\n- none',
      `## Blockers\n- requires \`${foundation}\`: 需要先完成基础训练`,
    ))

    const blocked = JSON.parse(execFileSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' }))
    expect(blocked.plan.edges).toContainEqual({
      change: simulation,
      requires: foundation,
      reason: '需要先完成基础训练',
      state: 'open',
    })

    await writeFile(foundationPath, completeReopenChange(await readFile(foundationPath, 'utf-8')))
    execFileSync('node', [cliPath(), 'archive', foundation], { cwd: groupDir })
    const unblocked = JSON.parse(execFileSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' }))
    expect(unblocked.plan.edges).toContainEqual(expect.objectContaining({ change: simulation, requires: foundation, state: 'archived' }))

    await writeFile(simulationPath, completeReopenChange(await readFile(simulationPath, 'utf-8')))
    execFileSync('node', [cliPath(), 'archive', simulation], { cwd: groupDir })
    const history = JSON.parse(execFileSync('node', [cliPath(), 'history', simulation, '--json'], { cwd: groupDir, encoding: 'utf-8' }))
    expect(history.record).toEqual(expect.objectContaining({ workRef: simulation, group }))

    execFileSync('node', [cliPath(), 'reopen', simulation, '--reason', '需要补充一次人工验证'], { cwd: groupDir })
    expect(existsSync(simulationPath)).toBe(true)
    expect(existsSync(join(groupDir, '.rsp', 'focus.d', group, '模拟朗读'))).toBe(true)
    expect(await readFile(simulationPath, 'utf-8')).toContain('需要补充一次人工验证')
  })

  it('releases the mutation lock when an unfocus marker is missing', async () => {
    const focusDir = join(tmpdir(), 'rsp-unfocus-missing-marker-lock-test', randomUUID())
    await mkdir(focusDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: focusDir })
    execSync(`node ${cliPath()} create missing-marker`, { cwd: focusDir })
    await rm(join(focusDir, '.rsp', 'focus.d', 'missing-marker'))

    const result = spawnSync('node', [cliPath(), 'unfocus', 'missing-marker'], { cwd: focusDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Focus marker not found')
    expect(existsSync(join(focusDir, '.rsp', '.lock'))).toBe(false)
  })

  it('does not focus through a symlinked marker file', async () => {
    const focusDir = join(tmpdir(), 'rsp-focus-marker-symlink-test', randomUUID())
    const externalDir = join(tmpdir(), 'rsp-focus-marker-external-test', randomUUID())
    await mkdir(focusDir, { recursive: true })
    await mkdir(externalDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: focusDir })
    execSync(`node ${cliPath()} create focus-target`, { cwd: focusDir })
    await rm(join(focusDir, '.rsp', 'focus.d', 'focus-target'))
    await writeFile(join(externalDir, 'marker'), 'do-not-touch\n')
    await symlink(join(externalDir, 'marker'), join(focusDir, '.rsp', 'focus.d', 'focus-target'))

    const result = spawnSync('node', [cliPath(), 'focus', 'focus-target'], { cwd: focusDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('focus marker must be a regular file')
    expect(await readFile(join(externalDir, 'marker'), 'utf-8')).toBe('do-not-touch\n')
    expect(existsSync(join(focusDir, '.rsp', '.lock'))).toBe(false)
  })

  it('rejects recursive change identities before mutating the workspace', () => {
    const createDir = join(tmpdir(), 'rsp-create-depth-test', randomUUID())
    return (async () => {
      await mkdir(createDir, { recursive: true })
      execSync(`node ${cliPath()} init`, { cwd: createDir })

      const result = spawnSync('node', [cliPath(), 'create', 'release/backend/api'], { cwd: createDir, encoding: 'utf-8' })

      expect(result.status).toBe(1)
      expect(result.stderr).toContain('exceeds the supported one-level Change Group depth')
      expect(existsSync(join(createDir, '.rsp', 'changes', 'release'))).toBe(false)
    })()
  })

  it('rejects file and directory work identity collisions before mutation', () => {
    const createDir = join(tmpdir(), 'rsp-create-collision-test', randomUUID())
    return (async () => {
      await mkdir(createDir, { recursive: true })
      execSync(`node ${cliPath()} init`, { cwd: createDir })
      await writeFile(join(createDir, '.rsp', 'changes', 'release.md'), renderChange('release'))

      const result = spawnSync('node', [cliPath(), 'create', 'release/api'], { cwd: createDir, encoding: 'utf-8' })

      expect(result.status).toBe(1)
      expect(result.stderr).toContain('claimed by both a file and a directory')
      expect(existsSync(join(createDir, '.rsp', 'changes', 'release'))).toBe(false)
      expect(existsSync(join(createDir, '.rsp', '.lock'))).toBe(false)
    })()
  })

  it('rejects a non-directory grouped prefix without leaking a raw filesystem error', async () => {
    const createDir = join(tmpdir(), 'rsp-create-prefix-type-test', randomUUID())
    await mkdir(createDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: createDir })
    await writeFile(join(createDir, '.rsp', 'changes', 'release'), 'not a directory')

    const result = spawnSync('node', [cliPath(), 'create', 'release/api'], { cwd: createDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('open work path must be a real directory')
    expect(result.stderr).not.toContain('EEXIST')
    expect(existsSync(join(createDir, '.rsp', '.lock'))).toBe(false)
  })

  it('does not create a Change or external marker through a symlinked focus root', async () => {
    const createDir = join(tmpdir(), 'rsp-create-focus-root-symlink-test', randomUUID())
    const externalDir = join(tmpdir(), 'rsp-create-focus-root-external-test', randomUUID())
    await mkdir(createDir, { recursive: true })
    await mkdir(externalDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: createDir })
    await rm(join(createDir, '.rsp', 'focus.d'), { recursive: true })
    await symlink(externalDir, join(createDir, '.rsp', 'focus.d'))

    const result = spawnSync('node', [cliPath(), 'create', 'escaped'], { cwd: createDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('focus root must be a real directory')
    expect(existsSync(join(createDir, '.rsp', 'changes', 'escaped.md'))).toBe(false)
    expect(existsSync(join(externalDir, 'escaped'))).toBe(false)
    expect(existsSync(join(createDir, '.rsp', '.lock'))).toBe(false)
  })

  it('creates a kind-aware neutral docs scaffold when requested', () => {
    const createDir = join(tmpdir(), 'rsp-create-kind-test', randomUUID())
    return (async () => {
      await mkdir(createDir, { recursive: true })
      execSync(`node ${cliPath()} init`, { cwd: createDir })
      execSync(`node ${cliPath()} create docs-guide --kind docs "Improve docs"`, { cwd: createDir })

      const content = await readFile(join(createDir, '.rsp', 'changes', 'docs-guide.md'), 'utf-8')
      expect(content).toContain('kind: "docs"')
      expect(content).toContain('### MODIFIED')
      expect(content).toContain('- Requirement: <…>')
      expect(content).not.toContain('documentation accuracy')
      expect(content).not.toContain('Exact prerequisite:')
    })()
  })

  it('creates a lite change template when requested', () => {
    const createDir = join(tmpdir(), 'rsp-create-lite-test', randomUUID())
    return (async () => {
      await mkdir(createDir, { recursive: true })
      execSync(`node ${cliPath()} init`, { cwd: createDir })
      const output = execSync(`node ${cliPath()} create tiny-fix --kind fix --lite "Fix tiny issue"`, { cwd: createDir, encoding: 'utf-8' })

      const content = await readFile(join(createDir, '.rsp', 'changes', 'tiny-fix.md'), 'utf-8')
      expect(output).toContain('fill the lite change details')
      expect(content).toContain('kind: "fix"')
      expect(content).toContain('- Outcome: Fix tiny issue')
      expect(content).toContain('- [ ] <…>')
      expect(content).not.toContain('Finalize the proposal, spec, and design details')
      expect(content).not.toContain('Exact prerequisite:')
    })()
  })

  it('keeps every CLI-created artifact scaffold neutral under a non-English artifact policy', async () => {
    const scaffoldDir = join(tmpdir(), 'rsp-neutral-scaffold-test', randomUUID())
    await mkdir(scaffoldDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: scaffoldDir })
    await writeFile(join(scaffoldDir, '.rsp', 'config.yaml'), `language:
  default: zh-CN
manage:
  activation: auto
  closeout: lifecycle
`)

    execFileSync('node', [cliPath(), 'create', 'language-policy', '中文摘要', '--kind', 'feature'], { cwd: scaffoldDir })
    execFileSync('node', [cliPath(), 'group', 'create', 'delivery', '中文目标'], { cwd: scaffoldDir })
    execFileSync('node', [cliPath(), 'add', 'spec', 'language-surface'], { cwd: scaffoldDir })
    execFileSync('node', [cliPath(), 'init', '--with-project-setup'], { cwd: scaffoldDir })

    const artifacts = await Promise.all([
      readFile(join(scaffoldDir, '.rsp', 'changes', 'language-policy.md'), 'utf-8'),
      readFile(join(scaffoldDir, '.rsp', 'changes', 'delivery', '00-brief.md'), 'utf-8'),
      readFile(join(scaffoldDir, '.rsp', 'changes', 'project-setup.md'), 'utf-8'),
      readFile(join(scaffoldDir, '.rsp', 'specs', 'language-surface.md'), 'utf-8'),
    ])

    expect(artifacts[0]).toContain('- Outcome: 中文摘要')
    expect(artifacts[0]).not.toContain('<!--')
    expect(artifacts[1]).toContain('## Goal\n- 中文目标')
    for (const content of artifacts) {
      expect(content).toContain('<…>')
      expect(content).not.toMatch(/Capture the project model|what shared outcome|why this project-level spec exists|Describe observable behavior/)
    }
  })

  it('does not change focus when reusing an existing change', async () => {
    const { createChange } = await import('../src/commands/create.js')
    const { unfocusChange } = await import('../src/commands/focus.js')

    await unfocusChange('auth/login')
    expect(existsSync(focusDPath('auth', 'login'))).toBe(false)

    await createChange('auth/login', 'Login change again')
    expect(existsSync(focusDPath('auth', 'login'))).toBe(false)
  })

  it('archives a change and clears its marker', async () => {
    const { archiveChange } = await import('../src/commands/archive.js')
    await archiveChange('test-change')

    expect(existsSync(changesPath('test-change.md'))).toBe(false)
    expect(existsSync(focusDPath('test-change'))).toBe(false)

    const archiveFiles = await readdir(archivePath())
    expect(archiveFiles.some(f => f.endsWith('_test-change.md'))).toBe(true)
    expect(existsSync(archivePath('INDEX.md'))).toBe(false)
  })

  it('keeps post-archive Git delivery advisory and lifecycle-complete', async () => {
    const gitDir = await createRspFixture('rsp-archive-git-guidance-test', ['specs', 'changes', 'archives', 'focus.d'])
    await mkdir(join(gitDir, '.git'))
    await writeFile(join(gitDir, '.rsp', 'changes', 'complete.md'), renderChange('complete').replaceAll('- [ ]', '- [x]'))
    await writeFile(join(gitDir, '.rsp', 'focus.d', 'complete'), '')

    const output = execSync(`node ${cliPath()} archive complete`, { cwd: gitDir, encoding: 'utf-8' })

    expect(output).toContain('git status --short')
    expect(output).toContain('separate Git authority')
    expect(output).not.toContain('git add .rsp/archives/')
    expect(output).not.toContain('git commit -m')
  })

  it('archive warns when verify checklist or durable updates are still incomplete', async () => {
    const archiveWarnDir = await createRspFixture('rsp-archive-warn-test', ['specs', 'changes', 'archives', 'focus.d'])
    await writeFile(join(archiveWarnDir, '.rsp', 'changes', 'warn-me.md'), renderChange('warn-me'))
    await writeFile(join(archiveWarnDir, '.rsp', 'focus.d', 'warn-me'), '')

    let output = ''
    try {
      output = execSync(`node ${cliPath()} archive warn-me 2>&1`, { cwd: archiveWarnDir, encoding: 'utf-8' })
    }
    catch (error) {
      output = String((error as { stdout?: string }).stdout || '')
    }
    expect(output).toContain('Verify checklist item(s) are still incomplete')
    expect(output).not.toContain('durable updates decision still appears open')
  })

  it('treats archive follow-up failures as warnings after the archive move succeeds', async () => {
    const archiveWarnDir = await createRspFixture('rsp-archive-followup-warning-test', ['specs', 'changes', 'archives', 'focus.d'])
    await writeFile(join(archiveWarnDir, '.rsp', 'changes', 'warn-followup.md'), renderChange('warn-followup'))
    await writeFile(join(archiveWarnDir, '.rsp', 'focus.d', 'warn-followup'), '')
    await mkdir(join(archiveWarnDir, '.git'), { recursive: true })
    await chmod(join(archiveWarnDir, '.rsp', 'focus.d'), 0o555)

    let output = ''
    try {
      output = execSync(`node ${cliPath()} archive warn-followup`, { cwd: archiveWarnDir, encoding: 'utf-8' })
    }
    finally {
      await chmod(join(archiveWarnDir, '.rsp', 'focus.d'), 0o755)
    }

    expect(output).toContain('Archived:')
    expect(output).toContain('Archive completed, but follow-up cleanup was only partially successful.')
    expect(existsSync(join(archiveWarnDir, '.rsp', 'archives'))).toBe(true)
  })

  it('can focus and unfocus an existing open change', async () => {
    const { focusChange, unfocusChange } = await import('../src/commands/focus.js')

    await focusChange('auth/login')
    await unfocusChange('auth/login')
    expect(existsSync(focusDPath('auth', 'login'))).toBe(false)

    await focusChange('auth/login')
    expect(existsSync(focusDPath('auth', 'login'))).toBe(true)
  })
})

describe('compact JSON output', () => {
  it('emits equivalent LF-terminated compact JSON for every JSON inspection command', async () => {
    const compactDir = join(tmpdir(), 'rsp-compact-json-test', randomUUID())
    await mkdir(compactDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: compactDir, stdio: 'pipe' })
    await writeFile(join(compactDir, '.rsp', 'changes', 'compact-me.md'), renderChange('compact-me'))

    const commands = [
      ['status'],
      ['show', 'compact-me'],
      ['ready', 'compact-me'],
      ['check'],
      ['doctor'],
      ['history'],
    ]

    for (const command of commands) {
      const pretty = execFileSync('node', [cliPath(), ...command, '--json'], { cwd: compactDir, encoding: 'utf-8' })
      const compact = execFileSync('node', [cliPath(), ...command, '--json', '--compact'], { cwd: compactDir, encoding: 'utf-8' })

      expect(JSON.parse(compact)).toEqual(JSON.parse(pretty))
      expect(compact).toBe(`${JSON.stringify(JSON.parse(pretty))}\n`)
    }
  })

  it('uses compact serialization for existing structured JSON errors', async () => {
    const compactDir = await createRspFixture('rsp-compact-json-error-test', ['specs', 'changes', 'focus.d'])
    const pretty = spawnSync('node', [cliPath(), 'status', '--json', '--stale', 'nope'], { cwd: compactDir, encoding: 'utf-8' })
    const compact = spawnSync('node', [cliPath(), 'status', '--json', '--compact', '--stale', 'nope'], { cwd: compactDir, encoding: 'utf-8' })

    expect(pretty.status).toBe(1)
    expect(compact.status).toBe(1)
    expect(compact.stderr).toBe('')
    expect(JSON.parse(compact.stdout)).toEqual(JSON.parse(pretty.stdout))
    expect(compact.stdout).toBe(`${JSON.stringify(JSON.parse(pretty.stdout))}\n`)
  })

  it('rejects compact on JSON commands when JSON mode is absent', async () => {
    const compactDir = await createRspFixture('rsp-compact-requires-json-test', ['specs', 'changes', 'focus.d'])
    const result = spawnSync('node', [cliPath(), 'status', '--compact'], { cwd: compactDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stdout).toBe('')
    expect(result.stderr).toContain('--compact requires --json')
  })

  it('rejects compact on other commands before command behavior runs', async () => {
    const compactDir = await createRspFixture('rsp-compact-unsupported-command-test', ['specs', 'changes', 'focus.d'])
    const result = spawnSync('node', [cliPath(), 'create', 'must-not-exist', '--compact'], { cwd: compactDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stdout).toBe('')
    expect(result.stderr).toContain('--compact is unsupported for rsp create')
    expect(existsSync(join(compactDir, '.rsp', 'changes', 'must-not-exist.md'))).toBe(false)
  })

  it('documents compact only on JSON inspection command help', () => {
    for (const command of ['status', 'show', 'ready', 'check', 'doctor', 'history']) {
      const output = execFileSync('node', [cliPath(), command, '--help'], { encoding: 'utf-8' })
      expect(output).toContain('--compact')
    }

    const createHelp = execFileSync('node', [cliPath(), 'create', '--help'], { encoding: 'utf-8' })
    expect(createHelp).not.toContain('--compact')
  })

  it('states the update and archive compatibility boundaries in command help', () => {
    const rootHelp = execFileSync('node', [cliPath(), '--help'], { encoding: 'utf-8' })
    const archiveHelp = execFileSync('node', [cliPath(), 'archive', '--help'], { encoding: 'utf-8' })

    expect(rootHelp).toContain('Refresh RSP-managed project files after upgrade; does not update packaged Skills')
    expect(archiveHelp).toContain('Deprecated compatibility route to rsp ready; never moves the Change')
  })
})

describe('history command', () => {
  it('lists bounded deterministic archive summaries with inclusive filters', async () => {
    const historyDir = await createRspFixture('rsp-history-list-test', ['specs', 'changes', 'archives', 'focus.d'])
    await mkdir(join(historyDir, '.rsp', 'archives', 'release'), { recursive: true })
    await writeFile(join(historyDir, '.rsp', 'archives', '2026-07-21_flat.md'), renderChange('flat').replace('kind: feature', 'kind: docs'))
    await writeFile(join(historyDir, '.rsp', 'archives', 'release', '2026-07-24_api.md'), renderChange('release/api'))
    await writeFile(join(historyDir, '.rsp', 'archives', 'release', '2026-07-23_ui.md'), renderChange('release/ui').replace('kind: feature', 'kind: fix'))
    await writeFile(join(historyDir, '.rsp', 'archives', 'release', '2026-07-24_brief.md'), renderGroupBrief('release', ['release/api', 'release/ui']))

    const output = execFileSync('node', [cliPath(), 'history', '--group', 'release', '--since', '2026-07-23', '--until', '2026-07-24', '--limit', '1', '--json'], { cwd: historyDir, encoding: 'utf-8' })
    const result = JSON.parse(output)

    expect(result).toEqual(expect.objectContaining({
      command: 'history',
      ok: true,
      mode: 'list',
      query: { limit: 1, since: '2026-07-23', until: '2026-07-24', kind: null, group: 'release', search: null },
      summary: { matched: 2, returned: 1, hasMore: true },
      diagnostics: [],
      runtime: [],
    }))
    expect(result.records).toEqual([expect.objectContaining({
      date: '2026-07-24',
      workRef: 'release/api',
      group: 'release',
      kind: 'feature',
      summary: 'release/api summary',
      path: '.rsp/archives/release/2026-07-24_api.md',
    })])

    const kindOutput = execFileSync('node', [cliPath(), 'history', '--kind', 'fix', '--json'], { cwd: historyDir, encoding: 'utf-8' })
    expect(JSON.parse(kindOutput).records.map((record: { workRef: string }) => record.workRef)).toEqual(['release/ui'])

    const searchOutput = execFileSync('node', [cliPath(), 'history', '--search', 'RELEASE/', '--limit', '1', '--json'], { cwd: historyDir, encoding: 'utf-8' })
    expect(JSON.parse(searchOutput)).toEqual(expect.objectContaining({
      query: expect.objectContaining({ search: 'RELEASE/' }),
      summary: { matched: 2, returned: 1, hasMore: true },
      records: [expect.objectContaining({ workRef: 'release/api' })],
    }))
  })

  it('returns bounded detail for one exact WorkRef without unrelated archive bodies', async () => {
    const historyDir = await createRspFixture('rsp-history-detail-test', ['specs', 'changes', 'archives', 'focus.d'])
    await writeFile(join(historyDir, '.rsp', 'archives', '2026-07-24_target.md'), renderChange('target'))
    await writeFile(join(historyDir, '.rsp', 'archives', '2026-07-23_other.md'), renderChange('other', 'UNRELATED_MARKER'))

    const output = execFileSync('node', [cliPath(), 'history', 'target', '--json'], { cwd: historyDir, encoding: 'utf-8' })
    const result = JSON.parse(output)

    expect(result.command).toBe('history')
    expect(result.ok).toBe(true)
    expect(result.mode).toBe('detail')
    expect(result.record).toEqual(expect.objectContaining({
      workRef: 'target',
      scenarioCount: 1,
      checkboxes: expect.objectContaining({ tasks: expect.objectContaining({ todo: 1 }) }),
      evidence: expect.objectContaining({ tasks: expect.objectContaining({ items: expect.any(Array), truncated: false }) }),
    }))
    expect(output).not.toContain('UNRELATED_MARKER')
  })

  it('returns structured not-found, ambiguous, invalid-filter, and incomplete-inspection failures', async () => {
    const historyDir = await createRspFixture('rsp-history-errors-test', ['specs', 'changes', 'archives', 'focus.d'])
    await writeFile(join(historyDir, '.rsp', 'archives', '2026-07-24_repeat.md'), renderChange('repeat'))
    await writeFile(join(historyDir, '.rsp', 'archives', '2026-07-24_repeat-2.md'), renderChange('repeat'))

    const ambiguous = spawnSync('node', [cliPath(), 'history', 'repeat', '--json'], { cwd: historyDir, encoding: 'utf-8' })
    const missing = spawnSync('node', [cliPath(), 'history', 'missing', '--json'], { cwd: historyDir, encoding: 'utf-8' })
    const invalid = spawnSync('node', [cliPath(), 'history', '--limit', '101', '--json'], { cwd: historyDir, encoding: 'utf-8' })
    const invalidDate = spawnSync('node', [cliPath(), 'history', '--since', '2026-02-30', '--json'], { cwd: historyDir, encoding: 'utf-8' })
    const invalidSearch = spawnSync('node', [cliPath(), 'history', '--search', '', '--json'], { cwd: historyDir, encoding: 'utf-8' })
    const reservedWorkRef = spawnSync('node', [cliPath(), 'history', 'release/00-brief', '--json'], { cwd: historyDir, encoding: 'utf-8' })
    const detailFilter = spawnSync('node', [cliPath(), 'history', 'repeat', '--kind', 'feature', '--json'], { cwd: historyDir, encoding: 'utf-8' })

    expect(ambiguous.status).toBe(1)
    expect(ambiguous.stderr).toBe('')
    expect(JSON.parse(ambiguous.stdout).error).toEqual(expect.objectContaining({ code: 'archive_ambiguous', candidates: expect.any(Array) }))
    expect(JSON.parse(missing.stdout).error.code).toBe('archive_not_found')
    expect(JSON.parse(invalid.stdout).error.code).toBe('invalid_history_limit')
    expect(JSON.parse(invalidDate.stdout).error.code).toBe('invalid_history_since')
    expect(JSON.parse(invalidSearch.stdout).error.code).toBe('invalid_history_search')
    expect(JSON.parse(reservedWorkRef.stdout).error.code).toBe('invalid_history_work_ref')
    expect(JSON.parse(detailFilter.stdout).error.code).toBe('history_detail_filters_unsupported')

    await writeFile(join(historyDir, '.rsp', 'archives', '2026-07-20_wrong.md'), renderChange('different'))
    const incomplete = spawnSync('node', [cliPath(), 'history', '--kind', 'does-not-match', '--json'], { cwd: historyDir, encoding: 'utf-8' })
    const incompleteResult = JSON.parse(incomplete.stdout)
    expect(incomplete.status).toBe(1)
    expect(incompleteResult.ok).toBe(false)
    expect(incompleteResult.diagnostics).toContainEqual(expect.objectContaining({ code: 'archive_identity_mismatch' }))
  })

  it('fails closed for a missing archive root and rejects extra positional arguments in every output mode', async () => {
    const missingRootDir = await createRspFixture('rsp-history-missing-root-test', ['specs', 'changes', 'focus.d'])
    const missingRoot = spawnSync('node', [cliPath(), 'history', '--json'], { cwd: missingRootDir, encoding: 'utf-8' })
    expect(missingRoot.status).toBe(1)
    expect(JSON.parse(missingRoot.stdout)).toEqual(expect.objectContaining({
      ok: false,
      error: expect.objectContaining({ code: 'archive_inspection_incomplete' }),
      diagnostics: [expect.objectContaining({ code: 'archive_root_missing' })],
      diagnosticSummary: { total: 1, returned: 1, hasMore: false },
    }))

    const human = spawnSync('node', [cliPath(), 'history', 'one', 'two'], { cwd: missingRootDir, encoding: 'utf-8' })
    const json = spawnSync('node', [cliPath(), 'history', 'one', 'two', '--json'], { cwd: missingRootDir, encoding: 'utf-8' })
    const compact = spawnSync('node', [cliPath(), 'history', 'one', 'two', '--json', '--compact'], { cwd: missingRootDir, encoding: 'utf-8' })

    expect(human.status).toBe(1)
    expect(human.stderr).toContain('history accepts at most one positional WorkRef')
    expect(json.status).toBe(1)
    expect(json.stderr).toBe('')
    expect(JSON.parse(json.stdout).error.code).toBe('history_positional_args_unsupported')
    expect(compact.status).toBe(1)
    expect(compact.stderr).toBe('')
    expect(compact.stdout).toBe(`${JSON.stringify(JSON.parse(compact.stdout))}\n`)
  })

  it('bounds human diagnostics and ambiguity candidates', async () => {
    const diagnosticsDir = await createRspFixture('rsp-history-bounded-errors-test', ['specs', 'changes', 'archives', 'focus.d'])
    for (let index = 0; index < 25; index++)
      await writeFile(join(diagnosticsDir, '.rsp', 'archives', `2026-07-20_bad-${index}.md`), renderChange(`different-${index}`))

    const diagnostics = spawnSync('node', [cliPath(), 'history'], { cwd: diagnosticsDir, encoding: 'utf-8' })
    const diagnosticsJson = spawnSync('node', [cliPath(), 'history', '--json'], { cwd: diagnosticsDir, encoding: 'utf-8' })
    expect(diagnostics.status).toBe(1)
    expect(diagnostics.stderr.match(/\.rsp\/archives\/2026-07-20_bad-/g)).toHaveLength(20)
    expect(diagnostics.stderr).toContain('5 additional diagnostic(s) omitted')
    expect(JSON.parse(diagnosticsJson.stdout)).toEqual(expect.objectContaining({
      diagnostics: expect.any(Array),
      diagnosticSummary: { total: 25, returned: 20, hasMore: true },
    }))
    expect(JSON.parse(diagnosticsJson.stdout).diagnostics).toHaveLength(20)

    const candidatesDir = await createRspFixture('rsp-history-bounded-candidates-test', ['specs', 'changes', 'archives', 'focus.d'])
    for (let index = 0; index < 25; index++) {
      const suffix = index === 0 ? '' : `-${index + 1}`
      await writeFile(join(candidatesDir, '.rsp', 'archives', `2026-07-20_repeat${suffix}.md`), renderChange('repeat'))
    }
    const candidates = spawnSync('node', [cliPath(), 'history', 'repeat'], { cwd: candidatesDir, encoding: 'utf-8' })
    const candidatesJson = spawnSync('node', [cliPath(), 'history', 'repeat', '--json'], { cwd: candidatesDir, encoding: 'utf-8' })
    expect(candidates.status).toBe(1)
    expect(candidates.stderr.match(/\.rsp\/archives\/2026-07-20_repeat/g)).toHaveLength(20)
    expect(candidates.stderr).toContain('5 additional candidate(s) omitted')
    expect(JSON.parse(candidatesJson.stdout).error).toEqual(expect.objectContaining({
      candidates: expect.any(Array),
      candidateSummary: { total: 25, returned: 20, hasMore: true },
    }))
    expect(JSON.parse(candidatesJson.stdout).error.candidates).toHaveLength(20)
  })

  it('renders an empty human list without reading the generated index', async () => {
    const historyDir = await createRspFixture('rsp-history-empty-test', ['specs', 'changes', 'archives', 'focus.d'])
    await writeFile(join(historyDir, '.rsp', 'archives', 'INDEX.md'), '# stale generated index\n| 2020-01-01 | stale | fix | stale |\n')

    const output = execFileSync('node', [cliPath(), 'history'], { cwd: historyDir, encoding: 'utf-8' })
    expect(output).toContain('No archived Changes match the query.')
    expect(output).not.toContain('stale')
  })
})

describe('specs index behavior', () => {
  it('creates root direct-child navigation with design.md on init', async () => {
    const initDir = join(tmpdir(), 'rsp-specs-index-init-test', randomUUID())
    await mkdir(initDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: initDir })

    const index = await readFile(join(initDir, '.rsp', 'specs', '00-index.md'), 'utf-8')
    const metadata = parseFrontmatter(index)
    expect(metadata?.kind).toBe('generated-index')
    expect(metadata?.index_type).toBe('specs')
    expect(metadata?.entry_count).toBe(1)
    expect(index).toContain('[design.md](design.md)')
    expect(existsSync(join(initDir, '.rsp', 'specs', 'INDEX.md'))).toBe(false)
  })

  it('creates direct-child indexes and keeps unrelated indexes byte-identical', async () => {
    const specDir = join(tmpdir(), 'rsp-specs-index-add-spec-test', randomUUID())
    await mkdir(specDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: specDir })
    execSync(`node ${cliPath()} add spec cli/base`, { cwd: specDir })
    execSync(`node ${cliPath()} add spec skill-system/base`, { cwd: specDir })
    const rootBefore = await readFile(join(specDir, '.rsp', 'specs', '00-index.md'), 'utf-8')
    const skillBefore = await readFile(join(specDir, '.rsp', 'specs', 'skill-system', '00-index.md'), 'utf-8')

    execSync(`node ${cliPath()} add spec cli/history-output`, { cwd: specDir })

    const index = await readFile(join(specDir, '.rsp', 'specs', 'cli', '00-index.md'), 'utf-8')
    const metadata = parseFrontmatter(index)
    expect(metadata?.kind).toBe('generated-index')
    expect(metadata?.index_type).toBe('specs')
    expect(metadata?.entry_count).toBe(2)
    expect(index).toContain('[base.md](base.md)')
    expect(index).toContain('[history-output.md](history-output.md)')
    expect(await readFile(join(specDir, '.rsp', 'specs', '00-index.md'), 'utf-8')).toBe(rootBefore)
    expect(await readFile(join(specDir, '.rsp', 'specs', 'skill-system', '00-index.md'), 'utf-8')).toBe(skillBefore)
  })

  it('adds a new domain to its local index and the root index', async () => {
    const specDir = join(tmpdir(), 'rsp-specs-index-new-domain-test', randomUUID())
    await mkdir(specDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: specDir })

    execSync(`node ${cliPath()} add spec runtime/lifecycle`, { cwd: specDir })

    const root = await readFile(join(specDir, '.rsp', 'specs', '00-index.md'), 'utf-8')
    const runtime = await readFile(join(specDir, '.rsp', 'specs', 'runtime', '00-index.md'), 'utf-8')
    expect(root).toContain('[runtime/](runtime/00-index.md)')
    expect(runtime).toContain('[lifecycle.md](lifecycle.md)')
  })

  it('fully reconciles nested direct-child navigation without flattening descendants', async () => {
    const specDir = join(tmpdir(), 'rsp-specs-index-full-reconcile-test', randomUUID())
    await mkdir(specDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: specDir })
    await mkdir(join(specDir, '.rsp', 'specs', 'platform', 'api'), { recursive: true })
    await writeFile(join(specDir, '.rsp', 'specs', 'platform', 'api', 'endpoint.md'), '# Endpoint contract\n\nStable endpoint facts.\n')

    execSync(`node ${cliPath()} update`, { cwd: specDir })

    const root = await readFile(join(specDir, '.rsp', 'specs', '00-index.md'), 'utf-8')
    const platform = await readFile(join(specDir, '.rsp', 'specs', 'platform', '00-index.md'), 'utf-8')
    const api = await readFile(join(specDir, '.rsp', 'specs', 'platform', 'api', '00-index.md'), 'utf-8')
    expect(root).toContain('[platform/](platform/00-index.md)')
    expect(root).not.toContain('endpoint.md')
    expect(platform).toContain('[api/](api/00-index.md)')
    expect(platform).not.toContain('endpoint.md')
    expect(api).toContain('[endpoint.md](endpoint.md)')
  })

  it('migrates only a recognized legacy root Specs index', async () => {
    const recognizedDir = join(tmpdir(), 'rsp-specs-index-legacy-recognized-test', randomUUID())
    const customDir = join(tmpdir(), 'rsp-specs-index-legacy-custom-test', randomUUID())
    await mkdir(recognizedDir, { recursive: true })
    await mkdir(customDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: recognizedDir })
    execSync(`node ${cliPath()} init`, { cwd: customDir })
    await writeFile(join(recognizedDir, '.rsp', 'specs', 'INDEX.md'), renderGeneratedIndexMetadata('specs'))
    await writeFile(join(customDir, '.rsp', 'specs', 'INDEX.md'), '# Project-owned notes\n')

    execSync(`node ${cliPath()} update`, { cwd: recognizedDir })
    const custom = spawnSync('node', [cliPath(), 'update'], { cwd: customDir, encoding: 'utf-8' })

    expect(existsSync(join(recognizedDir, '.rsp', 'specs', 'INDEX.md'))).toBe(false)
    expect(existsSync(join(recognizedDir, '.rsp', 'specs', '00-index.md'))).toBe(true)
    expect(custom.status).not.toBe(0)
    expect(`${custom.stdout}${custom.stderr}`).toContain('reserved Specs index is not recognized generated content')
    expect(await readFile(join(customDir, '.rsp', 'specs', 'INDEX.md'), 'utf-8')).toBe('# Project-owned notes\n')
  })

  it('removes only recognized obsolete local indexes during full update', async () => {
    const specDir = join(tmpdir(), 'rsp-specs-index-obsolete-test', randomUUID())
    await mkdir(specDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: specDir })
    const emptyDir = join(specDir, '.rsp', 'specs', 'empty')
    await mkdir(emptyDir)
    await writeFile(join(emptyDir, '00-index.md'), renderGeneratedIndexMetadata('specs').replace('source_dir: .rsp/specs', 'source_dir: .rsp/specs/empty'))

    execSync(`node ${cliPath()} update`, { cwd: specDir })

    expect(existsSync(join(emptyDir, '00-index.md'))).toBe(false)
  })

  it('reserves local index identities from add spec', async () => {
    const specDir = join(tmpdir(), 'rsp-specs-index-reserved-name-test', randomUUID())
    await mkdir(specDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: specDir })

    for (const name of ['index', 'cli/index', '00-index', 'cli/00-index']) {
      const result = spawnSync('node', [cliPath(), 'add', 'spec', name], { cwd: specDir, encoding: 'utf-8' })
      expect(result.status).not.toBe(0)
      expect(result.stderr).toContain('reserved for generated local navigation')
    }
  })

  it('does not add a Spec through a symlinked parent directory', async () => {
    const specDir = join(tmpdir(), 'rsp-add-spec-parent-symlink-test', randomUUID())
    const externalDir = join(tmpdir(), 'rsp-add-spec-parent-external-test', randomUUID())
    await mkdir(specDir, { recursive: true })
    await mkdir(externalDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: specDir })
    await symlink(externalDir, join(specDir, '.rsp', 'specs', 'group'))

    const result = spawnSync('node', [cliPath(), 'add', 'spec', 'group/escaped'], { cwd: specDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(`${result.stdout}${result.stderr}`).toContain('spec path must be a real directory')
    expect(existsSync(join(externalDir, 'escaped.md'))).toBe(false)
    expect(existsSync(join(specDir, '.rsp', '.lock'))).toBe(false)
  })

  it('does not index a symlinked Markdown Spec', async () => {
    const specDir = join(tmpdir(), 'rsp-specs-index-file-symlink-test', randomUUID())
    const externalDir = join(tmpdir(), 'rsp-specs-index-file-external-test', randomUUID())
    await mkdir(specDir, { recursive: true })
    await mkdir(externalDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: specDir })
    await writeFile(join(externalDir, 'secret.md'), '---\ntitle: External Secret Title\n---\n')
    await symlink(join(externalDir, 'secret.md'), join(specDir, '.rsp', 'specs', 'leak.md'))

    const result = spawnSync('node', [cliPath(), 'update'], { cwd: specDir, encoding: 'utf-8' })
    const index = await readFile(join(specDir, '.rsp', 'specs', '00-index.md'), 'utf-8')

    expect(result.status).toBe(1)
    expect(`${result.stdout}${result.stderr}`).toContain('unsupported entry in the Specs tree')
    expect(index).not.toContain('External Secret Title')
    expect(existsSync(join(specDir, '.rsp', '.lock'))).toBe(false)
  })
})

describe('check command', () => {
  it('passes on valid changes', async () => {
    const changePath = changesPath('auth', 'login.md')
    const content = await readFile(changePath, 'utf-8')
    await writeFile(changePath, content.replace('kind: "<choose: feature | fix | refactor | docs | ops | research>"', 'kind: feature'))

    const { runCheck } = await import('../src/commands/check.js')
    const result = await runCheck()
    expect(result.ok).toBe(true)
    expect(result.summary.errors).toBe(0)
  })

  it('reports missing required sections in changes', async () => {
    await writeFile(changesPath('orphan.md'), `---
kind: fix
---

# Change: orphan

## Proposal
- Summary: orphan
- Why:
  - because
- Scope:
  - work
- Non-goals:
  - none

## Design
- Approach:
  - details
- Affected areas:
  - src/orphan.ts
- Constraints:
  - none

## Tasks
- [ ] implement orphan

## Verify
- Automated:
  - [ ] run tests
- Manual:
  - [ ] verify orphan
- Durable updates:
  - [ ] update docs if needed

## Blockers
- none
`)

    const { runCheck } = await import('../src/commands/check.js')
    const result = await runCheck()
    expect(result.ok).toBe(false)
    expect(result.summary.errors).toBeGreaterThan(0)
  })

  it('fails when focus markers exist without matching change files', () => {
    const brokenDir = join(tmpdir(), 'rsp-check-dangling-focus-test', randomUUID())
    return (async () => {
      await mkdir(join(brokenDir, '.rsp', 'focus.d'), { recursive: true })
      await mkdir(join(brokenDir, '.rsp', 'changes'), { recursive: true })
      await writeFile(join(brokenDir, '.rsp', 'focus.d', 'dangling'), '')

      let output = ''
      let failed = false
      try {
        output = execSync(`node ${cliPath()} check`, { cwd: brokenDir, encoding: 'utf-8' })
      }
      catch (error) {
        failed = true
        output = String((error as { stdout?: string }).stdout || '')
      }

      expect(failed).toBe(true)
      expect(output).toContain('changes/dangling.md not found')
    })()
  })

  it('fails when kind still uses the template placeholder', () => {
    const placeholderDir = join(tmpdir(), 'rsp-check-kind-placeholder-test', randomUUID())
    return (async () => {
      await mkdir(join(placeholderDir, '.rsp', 'changes'), { recursive: true })
      await writeFile(join(placeholderDir, '.rsp', 'changes', 'placeholder.md'), `---
kind: "<choose: feature | fix | refactor | docs | ops | research>"
---

# Change: placeholder

## Proposal
- Summary: placeholder
- Why:
  - because
- Scope:
  - work
- Non-goals:
  - none

## Spec
### ADDED
- Requirement: placeholder
  - behavior

### Acceptance
#### Scenario: placeholder
- GIVEN x
- WHEN y
- THEN z

## Design
- Approach:
  - details
- Affected areas:
  - src/placeholder.ts
- Constraints:
  - none

## Tasks
- [ ] implement placeholder

## Verify
- Automated:
  - [ ] run tests
- Manual:
  - [ ] verify placeholder
- Durable updates:
  - [ ] update docs if needed

## Blockers
- none
`)

      let output = ''
      let failed = false
      try {
        output = execSync(`node ${cliPath()} check`, { cwd: placeholderDir, encoding: 'utf-8' })
      }
      catch (error) {
        failed = true
        output = String((error as { stdout?: string }).stdout || '')
      }

      expect(failed).toBe(true)
      expect(output).toContain('kind still uses the template placeholder')
    })()
  })

  it('warns when change content still contains template placeholders', () => {
    const placeholderDir = join(tmpdir(), 'rsp-check-template-placeholder-test', randomUUID())
    return (async () => {
      await mkdir(join(placeholderDir, '.rsp', 'changes'), { recursive: true })
      await writeFile(join(placeholderDir, '.rsp', 'changes', 'placeholder-body.md'), `---
kind: feature
---

# Change: placeholder-body

## Proposal
- Summary: placeholder body
- Why:
  - <what user need or capability gap this addresses>
- Scope:
  - ship placeholder lint
- Non-goals:
  - none

## Spec
### ADDED
- Requirement: placeholder lint
  - warn on unfinished placeholders

### Acceptance
#### Scenario: placeholder is detected
- GIVEN <context>
- WHEN rsp check runs
- THEN a warning is reported

## Design
- Approach:
  - check text lines deterministically
- Affected areas:
  - src/commands/check.ts
- Constraints:
  - warnings only

## Tasks
- [ ] implement placeholder lint

## Verify
- Automated:
  - [ ] run tests
- Manual:
  - [ ] review output
- Durable updates:
  - [ ] update docs if needed

## Blockers
- none
`)

      const output = execSync(`node ${cliPath()} check --json`, { cwd: placeholderDir, encoding: 'utf-8' })
      const result = JSON.parse(output)

      expect(result.ok).toBe(true)
      expect(result.summary.warnings).toBeGreaterThan(0)
      expect(result.diagnostics).toEqual(expect.arrayContaining([
        expect.objectContaining({ severity: 'warning', code: 'unfinished_template_placeholders' }),
      ]))
    })()
  })

  it('warns when change content contains unresolved clarification markers', () => {
    const clarificationDir = join(tmpdir(), 'rsp-check-clarification-test', randomUUID())
    return (async () => {
      await mkdir(join(clarificationDir, '.rsp', 'changes'), { recursive: true })
      await writeFile(join(clarificationDir, '.rsp', 'changes', 'clarify-me.md'), renderChange('clarify-me').replace(
        '- clarify-me behavior',
        '- [NEEDS CLARIFICATION: confirm exact behavior before implementation]',
      ))

      const output = execSync(`node ${cliPath()} check --json`, { cwd: clarificationDir, encoding: 'utf-8' })
      const result = JSON.parse(output)

      expect(result.ok).toBe(true)
      expect(result.summary.warnings).toBeGreaterThan(0)
      expect(result.diagnostics).toEqual(expect.arrayContaining([
        expect.objectContaining({ severity: 'warning', code: 'unresolved_clarifications' }),
      ]))
    })()
  })

  it('rejects legacy required_sections before validating Change content', () => {
    const configDir = join(tmpdir(), 'rsp-check-required-sections-test', randomUUID())
    return (async () => {
      await mkdir(join(configDir, '.rsp', 'changes'), { recursive: true })
      await writeFile(join(configDir, '.rsp', 'config.yaml'), 'required_sections:\n  - Proposal\n  - Spec\n')
      await writeFile(join(configDir, '.rsp', 'changes', 'orphan.md'), `---
kind: fix
---

# Change: orphan

## Proposal
- Summary: orphan
- Why:
  - because
- Scope:
  - work
- Non-goals:
  - none

## Design
- not needed: trivial example

## Tasks
- [ ] implement orphan

## Verify
- none

## Blockers
- none
`)

      const result = spawnSync('node', [cliPath(), 'check'], { cwd: configDir, encoding: 'utf-8' })

      expect(result.status).not.toBe(0)
      expect(result.stderr).toContain('config.yaml field "required_sections" is no longer supported')
      expect(result.stdout).not.toContain('missing "## Spec" section')
    })()
  })
})

describe('status commands', () => {
  it('shows focused changes separately from unfocused open changes', async () => {
    const statusDir = await createRspFixture('rsp-status-focused-test', ['specs', 'changes', 'focus.d'])
    await writeFile(join(statusDir, '.rsp', 'changes', 'focused-one.md'), renderChange('focused-one'))
    await writeFile(join(statusDir, '.rsp', 'changes', 'unfocused-one.md'), renderChange('unfocused-one'))
    await writeFile(join(statusDir, '.rsp', 'focus.d', 'focused-one'), '')

    const output = execSync(`node ${cliPath()} status`, { cwd: statusDir, encoding: 'utf-8' })
    expect(output).toContain('Focused: focused-one')
    expect(output).toContain('2 change(s), 1 focused')
  })

  it('prints next actions when status has open changes but no focus', async () => {
    const statusDir = await createRspFixture('rsp-status-no-focus-test', ['specs', 'changes', 'focus.d'])
    await writeFile(join(statusDir, '.rsp', 'changes', 'unfocused-one.md'), renderChange('unfocused-one'))

    const output = execSync(`node ${cliPath()} status`, { cwd: statusDir, encoding: 'utf-8' })
    expect(output).toContain('No focused change.')
    expect(output).toContain('Open changes: unfocused-one')
    expect(output).toContain('Run: rsp focus unfocused-one')
  })

  it('recommends the first declared open unblocked slice from an eligible Group', async () => {
    const statusDir = await createRspFixture('rsp-status-group-navigation-test', ['specs', 'changes', 'focus.d'])
    const groupDir = join(statusDir, '.rsp', 'changes', 'delivery')
    await mkdir(groupDir, { recursive: true })
    await writeFile(join(groupDir, '00-brief.md'), renderGroupBrief('delivery', [
      'delivery/blocked-first',
      'delivery/z-ready-second',
      'delivery/a-ready-third',
    ]))
    await writeFile(join(groupDir, 'blocked-first.md'), renderChange('delivery/blocked-first').replace('## Blockers\n- none', '## Blockers\n- waiting on authority'))
    await writeFile(join(groupDir, 'z-ready-second.md'), renderChange('delivery/z-ready-second'))
    await writeFile(join(groupDir, 'a-ready-third.md'), renderChange('delivery/a-ready-third'))

    const output = JSON.parse(execSync(`node ${cliPath()} status --json`, { cwd: statusDir, encoding: 'utf-8' }))

    expect(output.nextActions).toContain('Run: rsp focus delivery/z-ready-second')
    expect(output.nextActions).not.toContain('Run: rsp focus delivery/blocked-first')
    expect(output.nextActions).not.toContain('Run: rsp focus delivery/a-ready-third')
    expect(output.plan.ready).toEqual(['delivery/z-ready-second', 'delivery/a-ready-third'])
  })

  it('inherits a Group Brief blocker into the derived child execution plan', async () => {
    const statusDir = await createRspFixture('rsp-status-group-blocker-plan-test', ['specs', 'changes', 'archives', 'focus.d'])
    const groupDir = join(statusDir, '.rsp', 'changes', 'delivery')
    await mkdir(groupDir, { recursive: true })
    await writeFile(join(groupDir, '00-brief.md'), renderGroupBrief('delivery', [
      'delivery/api',
      'delivery/ui',
    ], { blockers: 'waiting for release authority' }))
    await writeFile(join(groupDir, 'api.md'), renderChange('delivery/api'))
    await writeFile(join(groupDir, 'ui.md'), renderChange('delivery/ui'))

    const output = JSON.parse(execSync(`node ${cliPath()} status --json`, { cwd: statusDir, encoding: 'utf-8' }))

    expect(output.plan.ready).toEqual([])
    expect(output.plan.waves).toEqual([])
    expect(output.plan.blocked).toEqual([
      { change: 'delivery/api', requires: [], external: true },
      { change: 'delivery/ui', requires: [], external: true },
    ])
    expect(output.records.every((record: { isBlocked: boolean }) => record.isBlocked)).toBe(true)
  })

  it('filters blocked changes by blockers section', async () => {
    const statusDir = await createRspFixture('rsp-status-blocked-test')
    await writeFile(join(statusDir, '.rsp', 'changes', 'blocked-one.md'), renderChange('blocked-one').replace('## Blockers\n- none', '## Blockers\n- waiting on api'))
    await writeFile(join(statusDir, '.rsp', 'changes', 'ready-one.md'), renderChange('ready-one'))

    const output = execSync(`node ${cliPath()} status --blocked`, { cwd: statusDir, encoding: 'utf-8' })
    expect(output).toContain('blocked-one')
    expect(output).not.toContain('ready-one')
  })

  it('filters stale changes by age', async () => {
    const statusDir = await createRspFixture('rsp-status-stale-test')

    const stalePath = join(statusDir, '.rsp', 'changes', 'stale-one.md')
    const freshPath = join(statusDir, '.rsp', 'changes', 'fresh-one.md')
    await writeFile(stalePath, renderChange('stale-one'))
    await writeFile(freshPath, renderChange('fresh-one'))

    const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
    utimesSync(stalePath, oldDate, oldDate)

    const output = execSync(`node ${cliPath()} status --stale 14`, { cwd: statusDir, encoding: 'utf-8' })
    expect(output).toContain('stale-one')
    expect(output).not.toContain('fresh-one')
  })

  it('treats recently updated older files as fresh', async () => {
    const statusDir = await createRspFixture('rsp-status-revived-test')

    const stalePath = join(statusDir, '.rsp', 'changes', 'stale-one.md')
    const revivedPath = join(statusDir, '.rsp', 'changes', 'revived-one.md')
    await writeFile(stalePath, renderChange('stale-one'))
    await writeFile(revivedPath, renderChange('revived-one'))

    const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
    utimesSync(stalePath, oldDate, oldDate)
    utimesSync(revivedPath, oldDate, oldDate)

    const now = new Date()
    utimesSync(revivedPath, now, now)

    const output = execSync(`node ${cliPath()} status --stale 14`, { cwd: statusDir, encoding: 'utf-8' })
    expect(output).toContain('stale-one')
    expect(output).not.toContain('revived-one')
  })

  it('prints machine-readable JSON for status', async () => {
    const statusDir = await createRspFixture('rsp-status-json-test', ['specs', 'changes', 'focus.d'])
    await writeFile(join(statusDir, '.rsp', 'changes', 'focused-one.md'), renderChange('focused-one'))
    await writeFile(join(statusDir, '.rsp', 'focus.d', 'focused-one'), '')

    const output = execSync(`node ${cliPath()} status --json`, { cwd: statusDir, encoding: 'utf-8' })
    const result = JSON.parse(output)

    expect(result.command).toBe('status')
    expect(result.ok).toBe(true)
    expect(result).toHaveProperty('runtime')
    expect(result).toHaveProperty('summary')
    expect(result.focused).toEqual(['focused-one'])
    expect(result.records[0].name).toBe('focused-one')
    expect(result.records[0].path).toBe('.rsp/changes/focused-one.md')
    expect(result.records[0].path).not.toContain('\\')
    expect(result.records[0].progress.total).toBeGreaterThan(0)
    expect(Array.isArray(result.runtime)).toBe(true)
  })

  it('derives a deterministic dependency plan from exact Change blockers', async () => {
    const statusDir = await createRspFixture('rsp-status-dependency-plan-test', ['specs', 'changes', 'archives', 'focus.d'])
    await writeFile(join(statusDir, '.rsp', 'changes', 'research.md'), renderChange('research'))
    await writeFile(join(statusDir, '.rsp', 'changes', 'implement.md'), renderChange('implement').replace(
      '## Blockers\n- none',
      '## Blockers\n- requires `research`: needs the accepted research model',
    ))
    await writeFile(join(statusDir, '.rsp', 'changes', 'release.md'), renderChange('release').replace(
      '## Blockers\n- none',
      '## Blockers\n- requires `implement`: needs the promoted implementation',
    ))
    await writeFile(join(statusDir, '.rsp', 'changes', 'approval.md'), renderChange('approval').replace(
      '## Blockers\n- none',
      '## Blockers\n- waiting for maintainer authority',
    ))
    await writeFile(join(statusDir, '.rsp', 'focus.d', 'implement'), '')

    const output = JSON.parse(execSync(`node ${cliPath()} status --json`, { cwd: statusDir, encoding: 'utf-8' }))
    const focused = JSON.parse(execSync(`node ${cliPath()} status --focused --json`, { cwd: statusDir, encoding: 'utf-8' }))

    expect(output.plan).toEqual({
      nodes: [
        { name: 'approval', selection: 'selected', state: 'blocked' },
        { name: 'implement', selection: 'selected', state: 'waiting' },
        { name: 'release', selection: 'selected', state: 'waiting' },
        { name: 'research', selection: 'selected', state: 'ready' },
      ],
      ready: ['research'],
      edges: [
        { change: 'implement', requires: 'research', reason: 'needs the accepted research model', state: 'open' },
        { change: 'release', requires: 'implement', reason: 'needs the promoted implementation', state: 'open' },
      ],
      blocked: [
        { change: 'approval', requires: [], external: true },
        { change: 'implement', requires: ['research'], external: false },
        { change: 'release', requires: ['implement'], external: false },
      ],
      waves: [['research'], ['implement'], ['release']],
    })
    expect(output.records.find((record: { name: string }) => record.name === 'research').isBlocked).toBe(false)
    expect(output.records.find((record: { name: string }) => record.name === 'implement').isBlocked).toBe(true)
    expect(focused.records.map((record: { name: string }) => record.name)).toEqual(['implement'])
    expect(focused.plan.edges).toEqual([
      { change: 'implement', requires: 'research', reason: 'needs the accepted research model', state: 'open' },
    ])
    expect(focused.plan.nodes).toEqual([
      { name: 'implement', selection: 'selected', state: 'waiting' },
      { name: 'research', selection: 'prerequisite', state: 'ready' },
    ])
    expect(focused.plan.blocked).toEqual([
      { change: 'implement', requires: ['research'], external: false },
    ])
    expect(focused.plan.ready).toEqual(['research'])
    expect(focused.plan.waves).toEqual([['research'], ['implement']])

    const human = execSync(`node ${cliPath()} status --focused`, { cwd: statusDir, encoding: 'utf-8' })
    expect(human).toContain('Dependency graph')
    expect(human).toContain('(parent requires children)')
    expect(human).toMatch(/◎ implement\s+focused · waiting/)
    expect(human).toMatch(/└── ● research\s+prerequisite · ready/)
    expect(human).toContain('needs the accepted research model')
    expect(human).toContain('Next action: research')
  })

  it('resolves an exact dependency when its prerequisite is archived', async () => {
    const statusDir = await createRspFixture('rsp-status-archived-dependency-test', ['specs', 'changes', 'archives', 'focus.d'])
    await writeFile(join(statusDir, '.rsp', 'changes', 'implement.md'), renderChange('implement').replace(
      '## Blockers\n- none',
      '## Blockers\n- requires `research`: needs the accepted research model',
    ))
    await writeFile(join(statusDir, '.rsp', 'archives', '2026-07-20_research.md'), renderChange('research'))

    const status = JSON.parse(execSync(`node ${cliPath()} status --json`, { cwd: statusDir, encoding: 'utf-8' }))
    const ready = JSON.parse(execSync(`node ${cliPath()} ready implement --json`, { cwd: statusDir, encoding: 'utf-8' }))

    expect(status.plan.edges).toEqual([
      { change: 'implement', requires: 'research', reason: 'needs the accepted research model', state: 'archived' },
    ])
    expect(status.plan.nodes).toEqual([
      { name: 'implement', selection: 'selected', state: 'ready' },
      { name: 'research', selection: 'prerequisite', state: 'archived' },
    ])
    expect(status.plan.ready).toEqual(['implement'])
    expect(status.plan.blocked).toEqual([])
    expect(status.records[0].isBlocked).toBe(false)
    expect(ready.readiness.activeBlockers).toBe(false)
  })

  it('does not resolve a dependency from an archive whose path and WorkRef disagree', async () => {
    const statusDir = await createRspFixture('rsp-status-invalid-archived-dependency-test', ['specs', 'changes', 'archives', 'focus.d'])
    await writeFile(join(statusDir, '.rsp', 'changes', 'implement.md'), renderChange('implement').replace(
      '## Blockers\n- none',
      '## Blockers\n- requires `research`: needs the accepted research model',
    ))
    await writeFile(join(statusDir, '.rsp', 'archives', '2026-07-20_wrong-name.md'), renderChange('research'))

    const result = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const status = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(status.diagnostics).toContainEqual(expect.objectContaining({ code: 'archive_identity_mismatch' }))
    expect(status.plan.edges).toContainEqual(expect.objectContaining({ change: 'implement', requires: 'research', state: 'missing' }))
    expect(status.plan.ready).toEqual([])
    expect(status.records[0].isBlocked).toBe(true)
  })

  it('renders a shared prerequisite once and references repeated graph nodes', async () => {
    const statusDir = await createRspFixture('rsp-status-shared-prerequisite-test', ['specs', 'changes', 'archives', 'focus.d'])
    await writeFile(join(statusDir, '.rsp', 'changes', 'research.md'), renderChange('research'))
    for (const name of ['implement-a', 'implement-b']) {
      await writeFile(join(statusDir, '.rsp', 'changes', `${name}.md`), renderChange(name).replace(
        '## Blockers\n- none',
        '## Blockers\n- requires `research`: needs the shared research model',
      ))
      await writeFile(join(statusDir, '.rsp', 'focus.d', name), '')
    }

    const json = JSON.parse(execSync(`node ${cliPath()} status --focused --json`, { cwd: statusDir, encoding: 'utf-8' }))
    expect(json.plan.nodes).toEqual([
      { name: 'implement-a', selection: 'selected', state: 'waiting' },
      { name: 'implement-b', selection: 'selected', state: 'waiting' },
      { name: 'research', selection: 'prerequisite', state: 'ready' },
    ])
    expect(json.plan.ready).toEqual(['research'])
    expect(json.plan.waves).toEqual([['research'], ['implement-a', 'implement-b']])

    const human = execSync(`node ${cliPath()} status --focused`, { cwd: statusDir, encoding: 'utf-8' })
    expect(human.match(/● research/g)).toHaveLength(2)
    expect(human.match(/↩ shared/g)).toHaveLength(1)
    expect(human).toContain('Next action: research')
  })

  it('fails check and doctor on invalid structured dependency graphs', async () => {
    const statusDir = await createRspFixture('rsp-invalid-dependency-plan-test', ['specs', 'changes', 'archives', 'focus.d'])
    const blockerChange = (name: string, blocker: string) => renderChange(name).replace('## Blockers\n- none', `## Blockers\n- ${blocker}`)
    await writeFile(join(statusDir, '.rsp', 'changes', 'missing.md'), blockerChange('missing', 'requires `ghost`: target does not exist'))
    await writeFile(join(statusDir, '.rsp', 'changes', 'self.md'), blockerChange('self', 'requires `self`: invalid self dependency'))
    await writeFile(join(statusDir, '.rsp', 'changes', 'cycle-a.md'), blockerChange('cycle-a', 'requires `cycle-b`: cycle'))
    await writeFile(join(statusDir, '.rsp', 'changes', 'cycle-b.md'), blockerChange('cycle-b', 'requires `cycle-a`: cycle'))
    await writeFile(join(statusDir, '.rsp', 'changes', 'malformed.md'), blockerChange('malformed', 'requires ghost: missing exact WorkRef ticks'))
    await writeFile(join(statusDir, '.rsp', 'changes', 'aggregate.md'), blockerChange('aggregate', 'requires `delivery/brief`: Group Briefs are not executable dependencies'))
    await writeFile(join(statusDir, '.rsp', 'focus.d', 'cycle-b'), '')

    const checkResult = spawnSync('node', [cliPath(), 'check', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const focusedCheckResult = spawnSync('node', [cliPath(), 'check', '--focused', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const doctorResult = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const statusResult = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const check = JSON.parse(checkResult.stdout)
    const focusedCheck = JSON.parse(focusedCheckResult.stdout)
    const doctor = JSON.parse(doctorResult.stdout)
    const status = JSON.parse(statusResult.stdout)

    expect(checkResult.status).toBe(1)
    expect(check.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'dependency_syntax_invalid', change: 'malformed' }),
      expect.objectContaining({ code: 'dependency_target_invalid', change: 'aggregate' }),
      expect.objectContaining({ code: 'dependency_target_missing', change: 'missing' }),
      expect.objectContaining({ code: 'dependency_self_reference', change: 'self' }),
      expect.objectContaining({ code: 'dependency_cycle' }),
    ]))
    expect(focusedCheckResult.status).toBe(1)
    expect(focusedCheck.diagnostics).toContainEqual(expect.objectContaining({ code: 'dependency_cycle', change: 'cycle-b' }))
    expect(doctorResult.status).toBe(1)
    expect(doctor.checks).toContainEqual(expect.objectContaining({
      status: 'issue',
      label: 'Change dependency graph is valid',
    }))
    expect(statusResult.status).toBe(1)
    expect(status.plan.ready).toEqual([])
    expect(status.plan.waves).toEqual([])
    expect(status.nextActions).toEqual(['Run: rsp doctor'])
  })

  it('renders the dependency plan and shares resolved blocker truth across read commands', async () => {
    const statusDir = await createRspFixture('rsp-dependency-read-commands-test', ['specs', 'changes', 'archives', 'focus.d'])
    await writeFile(join(statusDir, '.rsp', 'changes', 'implement.md'), renderChange('implement').replace(
      '## Blockers\n- none',
      '## Blockers\n- requires `research`: needs the accepted research model',
    ))
    await writeFile(join(statusDir, '.rsp', 'archives', '2026-07-20_research.md'), renderChange('research'))

    const status = execSync(`node ${cliPath()} status`, { cwd: statusDir, encoding: 'utf-8' })
    const show = JSON.parse(execSync(`node ${cliPath()} show implement --json`, { cwd: statusDir, encoding: 'utf-8' }))
    const archive = execSync(`node ${cliPath()} archive implement --dry-run`, { cwd: statusDir, encoding: 'utf-8' })

    expect(status).toContain('Dependency graph')
    expect(status).toMatch(/◎ implement\s+open · ready/)
    expect(status).toMatch(/└── ✓ research\s+prerequisite · resolved — needs the accepted research model/)
    expect(status).toContain('Next action: implement')
    expect(show.change.blockers).toBe(false)
    expect(show.change.readiness.activeBlockers).toBe(false)
    expect(archive).not.toContain('active blockers are present')
  })

  it('ignores Blockers comments across dependency and readiness consumers', async () => {
    const statusDir = await createRspFixture('rsp-commented-blockers-test', ['specs', 'changes', 'archives', 'focus.d'])
    await writeFile(join(statusDir, '.rsp', 'changes', 'commented.md'), renderChange('commented', `<!--
- requires \`ignored\`: example only
operator guidance
-->`))

    const status = JSON.parse(execSync(`node ${cliPath()} status --json`, { cwd: statusDir, encoding: 'utf-8' }))
    const show = JSON.parse(execSync(`node ${cliPath()} show commented --json`, { cwd: statusDir, encoding: 'utf-8' }))
    const ready = JSON.parse(execSync(`node ${cliPath()} ready commented --json`, { cwd: statusDir, encoding: 'utf-8' }))
    const archive = execSync(`node ${cliPath()} archive commented --dry-run`, { cwd: statusDir, encoding: 'utf-8' })

    expect(status.records[0].isBlocked).toBe(false)
    expect(status.plan.edges).toEqual([])
    expect(show.change.blockers).toBe(false)
    expect(show.change.readiness.activeBlockers).toBe(false)
    expect(ready.readiness.activeBlockers).toBe(false)
    expect(archive).not.toContain('active blockers are present')
  })

  it('prints status JSON next actions when no focus exists', async () => {
    const statusDir = await createRspFixture('rsp-status-json-no-focus-test')
    await writeFile(join(statusDir, '.rsp', 'changes', 'unfocused-json.md'), renderChange('unfocused-json'))

    const output = execSync(`node ${cliPath()} status --json`, { cwd: statusDir, encoding: 'utf-8' })
    const result = JSON.parse(output)
    expect(result.focused).toEqual([])
    expect(result.nextActions).toContain('Run: rsp focus unfocused-json')
  })

  it('fails closed instead of following a symlinked changes root', async () => {
    const statusDir = await createRspFixture('rsp-status-symlinked-changes-test', ['specs', 'changes', 'focus.d'])
    const externalDir = join(tmpdir(), 'rsp-status-external-changes-test', randomUUID())
    await mkdir(externalDir, { recursive: true })
    await writeFile(join(externalDir, 'external.md'), renderChange('external'))
    await rm(join(statusDir, '.rsp', 'changes'), { recursive: true })
    await symlink(externalDir, join(statusDir, '.rsp', 'changes'))

    const result = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(output.ok).toBe(false)
    expect(output.records).toEqual([])
    expect(output.diagnostics).toContainEqual(expect.objectContaining({ code: 'invalid_work_root' }))
  })

  it('fails status and check when dependency archive inspection is incomplete', async () => {
    const statusDir = await createRspFixture('rsp-status-symlinked-archives-test', ['specs', 'changes', 'archives', 'focus.d'])
    const externalDir = join(tmpdir(), 'rsp-status-external-archives-test', randomUUID())
    await mkdir(externalDir, { recursive: true })
    await writeFile(join(statusDir, '.rsp', 'changes', 'current.md'), renderChange('current'))
    await rm(join(statusDir, '.rsp', 'archives'), { recursive: true })
    await symlink(externalDir, join(statusDir, '.rsp', 'archives'))

    const statusResult = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const checkResult = spawnSync('node', [cliPath(), 'check', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const ready = JSON.parse(execSync(`node ${cliPath()} ready current --json`, { cwd: statusDir, encoding: 'utf-8' }))
    const show = JSON.parse(execSync(`node ${cliPath()} show current --json`, { cwd: statusDir, encoding: 'utf-8' }))
    const archiveResult = spawnSync('node', [cliPath(), 'archive', 'current', '--dry-run'], { cwd: statusDir, encoding: 'utf-8' })
    const status = JSON.parse(statusResult.stdout)
    const check = JSON.parse(checkResult.stdout)

    expect(statusResult.status).toBe(1)
    expect(status.ok).toBe(false)
    expect(status.diagnostics).toContainEqual(expect.objectContaining({ code: 'invalid_archive_root' }))
    expect(status.plan.ready).toEqual([])
    expect(checkResult.status).toBe(1)
    expect(check.diagnostics).toContainEqual(expect.objectContaining({ code: 'invalid_archive_root' }))
    expect(ready.readiness.activeBlockers).toBe(true)
    expect(ready.readiness.archiveReady).toBe('no')
    expect(show.change.blockers).toBe(true)
    expect(archiveResult.status).toBe(0)
    expect(archiveResult.stderr).toContain('Deprecated: use `rsp ready <name>`')
    expect(archiveResult.stdout).toContain('Archive ready: no')
    expect(archiveResult.stdout).toContain('active blockers are present in the change file')
  })

  it('fails closed when the changes root is missing', async () => {
    const statusDir = join(tmpdir(), 'rsp-status-missing-changes-root-test', randomUUID())
    await mkdir(statusDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: statusDir })
    await rm(join(statusDir, '.rsp', 'changes'), { recursive: true })

    const statusResult = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const doctorResult = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const status = JSON.parse(statusResult.stdout)
    const doctor = JSON.parse(doctorResult.stdout)

    expect(statusResult.status).toBe(1)
    expect(status.ok).toBe(false)
    expect(status.diagnostics).toContainEqual(expect.objectContaining({ code: 'invalid_work_root' }))
    expect(doctorResult.status).toBe(1)
    expect(doctor.checks).toContainEqual(expect.objectContaining({
      status: 'issue',
      label: 'open work uses supported WorkRef shapes',
    }))

    const repairedOutput = execSync(`node ${cliPath()} doctor --fix --json`, { cwd: statusDir, encoding: 'utf-8' })
    const repaired = JSON.parse(repairedOutput)
    expect(repaired.ok).toBe(true)
    expect(repaired.fixed).toContain('changes/ directory restored')
    expect(existsSync(join(statusDir, '.rsp', 'changes', '.gitkeep'))).toBe(true)
  })

  it('fails status when a focus marker points to a missing Change', async () => {
    const statusDir = await createRspFixture('rsp-status-missing-focused-change-test', ['specs', 'changes', 'focus.d'])
    await writeFile(join(statusDir, '.rsp', 'focus.d', 'ghost'), '')

    const result = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(output.ok).toBe(false)
    expect(output.diagnostics).toContainEqual(expect.objectContaining({ code: 'focused_change_missing', change: 'ghost' }))
    expect(output.nextActions).toEqual(['Run: rsp doctor'])
  })

  it('does not interpret a symlinked focus group as a marker', async () => {
    const statusDir = await createRspFixture('rsp-status-symlinked-focus-group-test', ['specs', 'changes', 'focus.d'])
    const externalDir = join(tmpdir(), 'rsp-status-symlinked-focus-group-external-test', randomUUID())
    await mkdir(externalDir, { recursive: true })
    await writeFile(join(statusDir, '.rsp', 'changes', 'release.md'), renderChange('release'))
    await symlink(externalDir, join(statusDir, '.rsp', 'focus.d', 'release'))

    const result = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(output.ok).toBe(false)
    expect(output.focused).toEqual([])
    expect(output.diagnostics).toContainEqual(expect.objectContaining({ code: 'invalid_focus_path', change: 'release' }))
  })

  it('fails status when an open Change cannot be read', async () => {
    const statusDir = await createRspFixture('rsp-status-unreadable-change-test', ['specs', 'changes', 'focus.d'])
    const changePath = join(statusDir, '.rsp', 'changes', 'unreadable.md')
    await writeFile(changePath, renderChange('unreadable'))
    await chmod(changePath, 0o000)

    try {
      const result = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: statusDir, encoding: 'utf-8' })
      const output = JSON.parse(result.stdout)

      expect(result.status).toBe(1)
      expect(output.ok).toBe(false)
      expect(output.diagnostics).toContainEqual(expect.objectContaining({ code: 'change_read_failed', change: 'unreadable' }))
    }
    finally {
      await chmod(changePath, 0o600)
    }
  })

  it('keeps status JSON error shape compatible on invalid stale filter', () => {
    const statusDir = join(tmpdir(), 'rsp-status-json-error-test', randomUUID())
    return (async () => {
      await mkdir(statusDir, { recursive: true })

      let output = ''
      let failed = false
      try {
        output = execSync(`node ${cliPath()} status --json --stale nope`, { cwd: statusDir, encoding: 'utf-8' })
      }
      catch (error) {
        failed = true
        output = String((error as { stdout?: string }).stdout || '')
      }

      const result = JSON.parse(output)
      expect(failed).toBe(true)
      expect(result.command).toBe('status')
      expect(result.ok).toBe(false)
      expect(result).toHaveProperty('runtime')
      expect(result).toHaveProperty('summary')
      expect(result.diagnostics).toEqual([])
      expect(result.nextActions).toEqual([])
      expect(result.error.code).toBe('invalid_stale_filter')
    })()
  })

  it('prints verbose diagnostics for malformed frontmatter in status', async () => {
    const statusDir = await createRspFixture('rsp-status-verbose-test')
    await writeFile(join(statusDir, '.rsp', 'changes', 'broken.md'), `---\nkind: [broken\n---\n\n# Change: broken\n`)

    const output = execSync(`node ${cliPath()} status --verbose 2>&1`, { cwd: statusDir, encoding: 'utf-8', shell: '/bin/zsh' })
    expect(output).toContain('[verbose] parseFrontmatter')
    expect(output).toContain('RSP status')
  })
})

describe('init and doctor', () => {
  it('does not initialize through a symlinked AGENTS.md file', async () => {
    const initDir = join(tmpdir(), 'rsp-init-agents-symlink-test', randomUUID())
    const externalDir = join(tmpdir(), 'rsp-init-agents-symlink-external-test', randomUUID())
    await mkdir(initDir, { recursive: true })
    await mkdir(externalDir, { recursive: true })
    await writeFile(join(externalDir, 'AGENTS.md'), 'external sentinel\n')
    await symlink(join(externalDir, 'AGENTS.md'), join(initDir, 'AGENTS.md'))

    const result = spawnSync('node', [cliPath(), 'init'], { cwd: initDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(`${result.stdout}${result.stderr}`).toContain('AGENTS.md must be a regular file')
    expect(await readFile(join(externalDir, 'AGENTS.md'), 'utf-8')).toBe('external sentinel\n')
    expect(existsSync(join(initDir, '.rsp'))).toBe(false)
  })

  it('reports and preserves a symlinked AGENTS.md file', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-agents-symlink-test', randomUUID())
    const externalDir = join(tmpdir(), 'rsp-update-agents-symlink-external-test', randomUUID())
    await mkdir(updateDir, { recursive: true })
    await mkdir(externalDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: updateDir })
    await writeFile(join(updateDir, '.rsp', 'rsp-rules.md'), 'stale local rules\n')
    await rm(join(updateDir, 'AGENTS.md'))
    await writeFile(join(externalDir, 'AGENTS.md'), 'external sentinel\n')
    await symlink(join(externalDir, 'AGENTS.md'), join(updateDir, 'AGENTS.md'))

    const doctorResult = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: updateDir, encoding: 'utf-8' })
    const updateResult = spawnSync('node', [cliPath(), 'update'], { cwd: updateDir, encoding: 'utf-8' })
    const doctor = JSON.parse(doctorResult.stdout)

    expect(doctorResult.status).toBe(1)
    expect(doctor.checks).toContainEqual(expect.objectContaining({
      status: 'issue',
      label: 'AGENTS.md is a regular managed file',
    }))
    expect(updateResult.status).toBe(1)
    expect(`${updateResult.stdout}${updateResult.stderr}`).toContain('AGENTS.md must be a regular file')
    expect(await readFile(join(externalDir, 'AGENTS.md'), 'utf-8')).toBe('external sentinel\n')
    expect(await readFile(join(updateDir, '.rsp', 'rsp-rules.md'), 'utf-8')).toBe('stale local rules\n')
  })

  it('reports and preserves a symlinked fallback protocol file', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-fallback-file-symlink-test', randomUUID())
    const externalDir = join(tmpdir(), 'rsp-update-fallback-file-external-test', randomUUID())
    await mkdir(updateDir, { recursive: true })
    await mkdir(externalDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: updateDir })
    await rm(join(updateDir, '.rsp', 'rsp-rules.md'))
    await writeFile(join(externalDir, 'rules.md'), 'external sentinel\n')
    await symlink(join(externalDir, 'rules.md'), join(updateDir, '.rsp', 'rsp-rules.md'))

    const doctorResult = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: updateDir, encoding: 'utf-8' })
    const updateResult = spawnSync('node', [cliPath(), 'update'], { cwd: updateDir, encoding: 'utf-8' })
    const doctor = JSON.parse(doctorResult.stdout)

    expect(doctorResult.status).toBe(1)
    expect(doctor.checks).toContainEqual(expect.objectContaining({
      status: 'issue',
      label: 'rsp-rules.md is a regular managed file',
    }))
    expect(updateResult.status).toBe(1)
    expect(`${updateResult.stdout}${updateResult.stderr}`).toContain('fallback protocol must be a regular file')
    expect(await readFile(join(externalDir, 'rules.md'), 'utf-8')).toBe('external sentinel\n')
    expect(existsSync(join(updateDir, '.rsp', '.lock'))).toBe(false)
  })

  it('does not reinitialize through a symlinked managed directory', async () => {
    const initDir = join(tmpdir(), 'rsp-init-managed-root-symlink-test', randomUUID())
    const externalDir = join(tmpdir(), 'rsp-init-managed-root-external-test', randomUUID())
    await mkdir(initDir, { recursive: true })
    await mkdir(externalDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: initDir })
    await rm(join(initDir, '.rsp', 'focus.d'), { recursive: true })
    await symlink(externalDir, join(initDir, '.rsp', 'focus.d'))

    const result = spawnSync('node', [cliPath(), 'init'], { cwd: initDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(`${result.stdout}${result.stderr}`).toContain('focus root must be a real directory')
    expect(existsSync(join(externalDir, '.gitkeep'))).toBe(false)
    expect(existsSync(join(initDir, '.rsp', '.lock'))).toBe(false)
  })

  it('does not expose removed project-rules CLI surfaces', () => {
    const initHelp = execSync(`node ${cliPath()} init --help`, { encoding: 'utf-8' })
    const removedCommand = spawnSync('node', [cliPath(), 'add', 'rules', 'project-rules'], { encoding: 'utf-8' })

    expect(initHelp).not.toContain('with-project-rules')
    expect(removedCommand.status).toBe(1)
    expect(`${removedCommand.stdout}${removedCommand.stderr}`).toContain('Unknown command rules')
  })

  it('creates the canonical fallback protocol without a rules directory by default', async () => {
    const initDir = join(tmpdir(), 'rsp-init-canonical-fallback-test', randomUUID())
    await mkdir(initDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: initDir })

    expect(existsSync(join(initDir, '.rsp', 'rsp-rules.md'))).toBe(true)
    expect(existsSync(join(initDir, '.rsp', 'rules'))).toBe(false)
  })

  it('removes a recognized legacy generated Archive Index when init repairs an existing project', async () => {
    const initDir = join(tmpdir(), 'rsp-init-recognized-archive-index-test', randomUUID())
    await mkdir(initDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: initDir })
    const indexPath = join(initDir, '.rsp', 'archives', 'INDEX.md')
    await writeFile(indexPath, renderGeneratedIndexMetadata('archives'))

    execSync(`node ${cliPath()} init`, { cwd: initDir })

    expect(existsSync(indexPath)).toBe(false)
  })

  it('preserves a project-owned Archive INDEX byte-for-byte when init repairs an existing project', async () => {
    const initDir = join(tmpdir(), 'rsp-init-project-owned-archive-index-test', randomUUID())
    await mkdir(initDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: initDir })
    const indexPath = join(initDir, '.rsp', 'archives', 'INDEX.md')
    const projectOwned = Buffer.from('# Project-owned archive notes\r\n\r\nKeep this exact spacing.  \r\n')
    await writeFile(indexPath, projectOwned)

    execSync(`node ${cliPath()} init`, { cwd: initDir })

    expect(await readFile(indexPath)).toEqual(projectOwned)
  })

  it('scaffolds changes/ and project setup output', async () => {
    const initDir = join(tmpdir(), 'rsp-init-test', randomUUID())
    await mkdir(initDir, { recursive: true })

    const output = execSync(`node ${cliPath()} init --with-project-setup`, { cwd: initDir, encoding: 'utf-8' })
    expect(existsSync(join(initDir, '.rsp', 'changes', '.gitkeep'))).toBe(true)
    expect(existsSync(join(initDir, '.rsp', 'changes', 'project-setup.md'))).toBe(true)
    expect(output).toContain('Next: fill .rsp/changes/project-setup.md')
  })

  it('reports a healthy setup', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    const output = execSync(`node ${cliPath()} doctor`, { cwd: doctorDir, encoding: 'utf-8' })
    expect(output).toContain('RSP setup looks healthy')
  })

  it('prints machine-readable JSON for doctor', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-json-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    let output = ''
    try {
      output = execSync(`node ${cliPath()} doctor --json`, { cwd: doctorDir, encoding: 'utf-8' })
    }
    catch (error) {
      output = String((error as { stdout?: string }).stdout || '')
    }
    const result = JSON.parse(output)

    expect(result.command).toBe('doctor')
    expect(result.ok).toBe(true)
    expect(result).toHaveProperty('runtime')
    expect(result).toHaveProperty('summary')
    expect(result.summary.issues).toBe(0)
    expect(result.checks.some((check: { label: string }) => check.label === '.rsp exists')).toBe(true)
  })

  it('repairs safe deterministic drift with doctor --fix', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-fix-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await writeFile(join(doctorDir, 'AGENTS.md'), '# Custom Agents\n\nmanual content\n')
    await writeFile(join(doctorDir, '.rsp', 'specs', '00-index.md'), renderGeneratedIndexMetadata('specs'))

    const output = execSync(`node ${cliPath()} doctor --fix --json`, { cwd: doctorDir, encoding: 'utf-8' })
    const result = JSON.parse(output)
    const agents = await readFile(join(doctorDir, 'AGENTS.md'), 'utf-8')
    const specsIndex = await readFile(join(doctorDir, '.rsp', 'specs', '00-index.md'), 'utf-8')

    expect(result.command).toBe('doctor')
    expect(result.ok).toBe(true)
    expect(result.fixed).toContain('AGENTS.md managed block refreshed')
    expect(result.fixed).toContain('generated Specs indexes reconciled')
    expect(agents).toContain('<!-- rsp:begin -->')
    expect(specsIndex).toContain('kind: generated-index')
  })

  it('does not report fixed actions for healthy doctor --fix', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-fix-idempotent-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    execSync(`node ${cliPath()} doctor --fix`, { cwd: doctorDir })

    const output = execSync(`node ${cliPath()} doctor --fix --json`, { cwd: doctorDir, encoding: 'utf-8' })
    const result = JSON.parse(output)

    expect(result.ok).toBe(true)
    expect(result.fixed).toEqual([])
  })

  it('prints no safe fixes needed for healthy doctor --fix', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-fix-human-idempotent-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    execSync(`node ${cliPath()} doctor --fix`, { cwd: doctorDir })

    const output = execSync(`node ${cliPath()} doctor --fix`, { cwd: doctorDir, encoding: 'utf-8' })
    expect(output).toContain('No safe fixes needed.')
    expect(output).not.toContain('Fixed:')
  })

  it('flags the generated Specs index with missing metadata and ignores an unrecognized legacy Archive Index', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-generated-index-metadata-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await writeFile(join(doctorDir, RSP_DIR, 'specs', '00-index.md'), '# Specs Index\n')
    await writeFile(join(doctorDir, RSP_DIR, 'archives', 'INDEX.md'), renderGeneratedIndexMetadata('specs'))

    let output = ''
    try {
      output = execSync(`node ${cliPath()} doctor --json`, { cwd: doctorDir, encoding: 'utf-8' })
    }
    catch (error) {
      output = String((error as { stdout?: string }).stdout || '')
    }
    const result = JSON.parse(output)

    expect(result.ok).toBe(false)
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: 'issue', label: 'hierarchical Specs indexes are current generated files' }),
    ]))
    expect(result.checks.some((check: { label: string }) => check.label.includes('archives/INDEX.md'))).toBe(false)
  })

  it('prints the resulting AGENTS.md content in print mode', async () => {
    const initDir = join(tmpdir(), 'rsp-init-print-test', randomUUID())
    await mkdir(initDir, { recursive: true })

    const output = execSync(`node ${cliPath()} init --agents-mode print`, { cwd: initDir, encoding: 'utf-8' })
    const agents = await readFile(join(initDir, 'AGENTS.md'), 'utf-8')

    expect(agents).toContain('<!-- rsp:begin -->')
    expect(agents).toContain('RSP tracks current work, stable specs, and archives under `.rsp/`.')
    expect(agents).toContain('1. Nearest `AGENTS.md` for project or module instructions.')
    expect(agents).toContain('2. Root `CONTEXT-MAP.md` if present, then the relevant nearest `CONTEXT.md`.')
    expect(agents).toContain('3. Use the project `rsp` Skill at `.agents/skills/rsp/SKILL.md`; hosts may load it through Skill discovery or read it directly.')
    expect(agents).toContain('Only when it is absent or cannot be used, read `.rsp/rsp-rules.md` as the fallback protocol.')
    expect(agents).toContain('4. `.rsp/focus.d/`; for grouped work read the sibling Group Brief, then the explicitly selected focused Change.')
    expect(agents).toContain('5. Only the relevant Specs and Decision Records under the configured authoritative path.')
    expect(agents).toContain('If `.rsp/focus.d/` is empty and the user has not provided a concrete task, ask what to work on or suggest `npx -y @oevery/rsp create <name>` for tracked work.')
    expect(agents).toContain('Do not treat `.rsp/specs/` or `.rsp/changes/` as replacements for nearest `AGENTS.md` or `CONTEXT.md`.')
    expect(output).toContain('## RSP Entry')
  })

  it('rejects an unmigrated fallback path and reports update guidance', async () => {
    const legacyDir = join(tmpdir(), 'rsp-legacy-fallback-test', randomUUID())
    await mkdir(join(legacyDir, '.rsp', 'rules'), { recursive: true })
    await mkdir(join(legacyDir, '.rsp', 'specs'), { recursive: true })
    await mkdir(join(legacyDir, '.rsp', 'changes'), { recursive: true })
    await mkdir(join(legacyDir, '.rsp', 'focus.d'), { recursive: true })
    await mkdir(join(legacyDir, '.rsp', 'archives'), { recursive: true })
    await writeFile(join(legacyDir, '.rsp', 'rules', 'rsp-rules.md'), '# legacy fallback\n')
    await writeFile(join(legacyDir, '.rsp', 'specs', 'design.md'), '# design\n')
    await writeFile(join(legacyDir, '.rsp', 'specs', 'INDEX.md'), renderGeneratedIndexMetadata('specs'))
    await writeFile(join(legacyDir, '.rsp', 'archives', 'INDEX.md'), renderGeneratedIndexMetadata('archives'))
    await writeFile(join(legacyDir, 'AGENTS.md'), '<!-- rsp:begin -->\n## RSP Entry\n<!-- rsp:end -->\n')

    const createResult = spawnSync('node', [cliPath(), 'create', 'legacy-change', '--kind', 'docs', 'Migration required'], { cwd: legacyDir, encoding: 'utf-8' })
    const doctorResult = spawnSync('node', [cliPath(), 'doctor'], { cwd: legacyDir, encoding: 'utf-8' })

    expect(createResult.status).toBe(1)
    expect(createResult.stderr).toContain('RSP project requires an update')
    expect(createResult.stderr).toContain('Run: rsp update')
    expect(existsSync(join(legacyDir, '.rsp', 'changes', 'legacy-change.md'))).toBe(false)
    expect(doctorResult.status).toBe(1)
    expect(doctorResult.stdout).toContain('obsolete fallback protocol path')
    expect(doctorResult.stdout).toContain('Run: rsp update')
  })

  it('reports missing AGENTS.md as an issue', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-missing-agents-test', randomUUID())
    await mkdir(join(doctorDir, RSP_DIR, 'specs'), { recursive: true })
    await mkdir(join(doctorDir, RSP_DIR, 'archives'), { recursive: true })
    await writeFile(join(doctorDir, RSP_DIR, 'rsp-rules.md'), '# rules\n')
    await writeFile(join(doctorDir, RSP_DIR, 'specs', 'design.md'), '# design\n')
    await writeFile(join(doctorDir, RSP_DIR, 'specs', 'INDEX.md'), renderGeneratedIndexMetadata('specs'))
    await writeFile(join(doctorDir, RSP_DIR, 'archives', 'INDEX.md'), renderGeneratedIndexMetadata('archives'))

    let output = ''
    try {
      output = execSync(`node ${cliPath()} doctor`, { cwd: doctorDir, encoding: 'utf-8' })
    }
    catch (error) {
      output = String((error as { stdout?: string }).stdout || '')
    }

    expect(output).toContain('AGENTS.md missing')
  })

  it('reports unfocused open changes as informational output', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-unfocused-change-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await writeFile(join(doctorDir, '.rsp', 'changes', 'unfocused-one.md'), renderChange('unfocused-one').replace('kind: feature', 'kind: docs'))

    const output = execSync(`node ${cliPath()} doctor`, { cwd: doctorDir, encoding: 'utf-8' })
    expect(output).toContain('Info: unfocused open changes: unfocused-one')
  })

  it('reports unsupported open-work structure as a doctor issue', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-work-ref-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    const nestedDir = join(doctorDir, '.rsp', 'changes', 'release', 'backend')
    await mkdir(nestedDir, { recursive: true })
    await writeFile(join(nestedDir, 'api.md'), renderChange('release/backend/api'))

    const result = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: doctorDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(output.checks).toContainEqual(expect.objectContaining({
      status: 'issue',
      label: 'open work uses supported WorkRef shapes',
    }))
  })

  it('reports a symlinked archive group as a doctor issue', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-archive-group-symlink-test', randomUUID())
    const externalDir = join(tmpdir(), 'rsp-doctor-archive-group-external-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })
    await mkdir(externalDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await symlink(externalDir, join(doctorDir, '.rsp', 'archives', 'release'))

    const result = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: doctorDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(output.ok).toBe(false)
    expect(output.checks).toContainEqual(expect.objectContaining({
      status: 'issue',
      label: 'archives use supported managed paths',
      message: expect.stringContaining('release'),
    }))
  })

  it('does not migrate archive state through a symlinked root', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-archive-root-symlink-test', randomUUID())
    const externalDir = join(tmpdir(), 'rsp-update-archive-root-external-test', randomUUID())
    await mkdir(updateDir, { recursive: true })
    await mkdir(externalDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: updateDir })
    await rm(join(updateDir, '.rsp', 'archives'), { recursive: true })
    await symlink(externalDir, join(updateDir, '.rsp', 'archives'))

    const result = spawnSync('node', [cliPath(), 'update'], { cwd: updateDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(`${result.stdout}${result.stderr}`).toContain('archive root must be a real directory')
    expect(existsSync(join(externalDir, 'INDEX.md'))).toBe(false)
    expect(existsSync(join(updateDir, '.rsp', '.lock'))).toBe(false)
  })

  it('reports a non-directory changes root as a doctor issue', async () => {
    const doctorDir = await createRspFixture('rsp-doctor-invalid-changes-root-test', ['specs'])
    await writeFile(join(doctorDir, '.rsp', 'changes'), 'not a directory')

    const result = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: doctorDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(output.ok).toBe(false)
    expect(output.checks).toContainEqual(expect.objectContaining({
      status: 'issue',
      label: 'open work uses supported WorkRef shapes',
      message: expect.stringContaining('must be a real directory'),
    }))
  })

  it('reports an empty recursive work directory as a doctor issue', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-empty-work-depth-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await mkdir(join(doctorDir, '.rsp', 'changes', 'release', 'backend'), { recursive: true })

    const result = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: doctorDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(output.checks).toContainEqual(expect.objectContaining({
      status: 'issue',
      label: 'open work uses supported WorkRef shapes',
      message: expect.stringContaining('release/backend'),
    }))
  })

  it('flags legacy required_sections config as an issue', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-required-sections-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await writeFile(join(doctorDir, '.rsp', 'config.yaml'), 'required_sections:\n  - Proposal\n  - Spec\n')

    let output = ''
    try {
      output = execSync(`node ${cliPath()} doctor`, { cwd: doctorDir, encoding: 'utf-8' })
    }
    catch (error) {
      output = String((error as { stdout?: string }).stdout || '')
    }

    expect(output).toContain('config.yaml field "required_sections" is no longer supported')

    const jsonResult = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: doctorDir, encoding: 'utf-8' })
    const jsonOutput = JSON.parse(jsonResult.stdout)
    expect(jsonOutput.checks).toContainEqual(expect.objectContaining({
      status: 'issue',
      code: 'invalid_config',
      message: 'config.yaml field "required_sections" is no longer supported',
    }))
  })

  it('fails a normal config consumer with structured invalid_config output', async () => {
    const checkDir = join(tmpdir(), 'rsp-check-invalid-config-test', randomUUID())
    await mkdir(checkDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: checkDir })
    await writeFile(join(checkDir, '.rsp', 'config.yaml'), 'kindz: [fix]\n')

    const result = spawnSync('node', [cliPath(), 'check', '--json'], { cwd: checkDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).not.toBe(0)
    expect(output.ok).toBe(false)
    expect(output.diagnostics).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'invalid_config',
      message: 'config.yaml field "kindz" is not supported',
    }))
  })

  it('fails a non-structured config consumer with the shared validation issue', async () => {
    const addSpecDir = join(tmpdir(), 'rsp-add-spec-invalid-config-test', randomUUID())
    await mkdir(addSpecDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: addSpecDir })
    await writeFile(join(addSpecDir, '.rsp', 'config.yaml'), 'kindz: [fix]\n')

    const result = spawnSync('node', [cliPath(), 'add', 'spec', 'architecture'], { cwd: addSpecDir, encoding: 'utf-8' })

    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('config.yaml field "kindz" is not supported')
    expect(existsSync(join(addSpecDir, '.rsp', 'specs', 'architecture.md'))).toBe(false)
  })

  it('reports invalid config YAML as structured doctor output', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-invalid-yaml-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await writeFile(join(doctorDir, '.rsp', 'config.yaml'), 'decisions: [\n')

    const result = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: doctorDir, encoding: 'utf-8' })
    const checkResult = spawnSync('node', [cliPath(), 'check', '--json'], { cwd: doctorDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)
    const checkOutput = JSON.parse(checkResult.stdout)

    expect(result.status).not.toBe(0)
    expect(output.ok).toBe(false)
    expect(output.checks).toContainEqual(expect.objectContaining({
      status: 'issue',
      code: 'invalid_config',
      message: checkOutput.diagnostics[0].message,
    }))
  })

  it('does not partially scaffold when an existing config is invalid', async () => {
    const initDir = join(tmpdir(), 'rsp-init-invalid-existing-config-test', randomUUID())
    await mkdir(join(initDir, '.rsp'), { recursive: true })
    await writeFile(join(initDir, '.rsp', 'config.yaml'), 'decisions:\n  path: .rsp/changes\n')

    const result = spawnSync('node', [cliPath(), 'init'], { cwd: initDir, encoding: 'utf-8' })

    expect(result.status).not.toBe(0)
    expect(existsSync(join(initDir, '.rsp', 'rsp-rules.md'))).toBe(false)
    expect(existsSync(join(initDir, '.rsp', 'specs'))).toBe(false)
  })

  it('keeps doctor --fix JSON structured when invalid config prevents repair', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-fix-invalid-config-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await writeFile(join(doctorDir, '.rsp', 'config.yaml'), 'decisions: [\n')

    const result = spawnSync('node', [cliPath(), 'doctor', '--fix', '--json'], { cwd: doctorDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).not.toBe(0)
    expect(output.ok).toBe(false)
    expect(output.fixed).toEqual([])
    expect(output.checks.some((check: { message?: string }) => check.message?.includes('safe deterministic repair could not run'))).toBe(true)

    const human = spawnSync('node', [cliPath(), 'doctor', '--fix'], { cwd: doctorDir, encoding: 'utf-8' })
    expect(human.stdout).toContain('safe deterministic repair could not run')
    expect(human.stdout).not.toContain('No safe fixes needed.')
  })

  it('does not partially repair managed files when the Decision Record target is not a directory', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-fix-decision-file-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await mkdir(join(doctorDir, 'docs'), { recursive: true })
    await writeFile(join(doctorDir, 'docs', 'adr'), 'not a directory\n')
    await writeFile(join(doctorDir, '.rsp', 'config.yaml'), 'decisions:\n  path: docs/adr\n')
    await writeFile(join(doctorDir, '.rsp', 'rsp-rules.md'), '# stale rules\n')

    const result = spawnSync('node', [cliPath(), 'doctor', '--fix', '--json'], { cwd: doctorDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).not.toBe(0)
    expect(output.fixed).toEqual([])
    expect(await readFile(join(doctorDir, '.rsp', 'rsp-rules.md'), 'utf-8')).toBe('# stale rules\n')
    expect(output.checks.some((check: { message?: string }) => check.message?.includes('must be a directory'))).toBe(true)
  })

  it('rejects additional Decision Record configuration fields', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-decision-fields-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await writeFile(join(doctorDir, '.rsp', 'config.yaml'), 'decisions:\n  path: docs/adr\n  fallback: .rsp/specs/decisions\n')

    const result = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: doctorDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).not.toBe(0)
    expect(output.checks.some((check: { message?: string }) => check.message?.includes('supports only "path"'))).toBe(true)
  })

  it('reports unreadable AGENTS.md as an issue instead of crashing', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-unreadable-agents-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await chmod(join(doctorDir, 'AGENTS.md'), 0o000)

    let output = ''
    try {
      output = execSync(`node ${cliPath()} doctor --json`, { cwd: doctorDir, encoding: 'utf-8' })
    }
    catch (error) {
      output = String((error as { stdout?: string }).stdout || '')
    }
    finally {
      await chmod(join(doctorDir, 'AGENTS.md'), 0o644)
    }

    const result = JSON.parse(output)
    expect(result.command).toBe('doctor')
    expect(result.ok).toBe(false)
    expect(result.summary.issues).toBeGreaterThan(0)
    expect(result.checks.some((check: { message?: string }) => check.message === 'AGENTS.md could not be read')).toBe(true)
  })

  it('prints machine-readable JSON for check and exits non-zero on errors', () => {
    const checkDir = join(tmpdir(), 'rsp-check-json-test', randomUUID())
    return (async () => {
      await mkdir(join(checkDir, '.rsp', 'changes'), { recursive: true })
      await writeFile(join(checkDir, '.rsp', 'changes', 'broken.md'), `---\nkind: fix\n---\n\n# Change: broken\n\n## Proposal\n- none\n`)

      let output = ''
      let failed = false
      try {
        output = execSync(`node ${cliPath()} check --json`, { cwd: checkDir, encoding: 'utf-8' })
      }
      catch (error) {
        failed = true
        output = String((error as { stdout?: string }).stdout || '')
      }

      const result = JSON.parse(output)
      expect(failed).toBe(true)
      expect(result.command).toBe('check')
      expect(result.ok).toBe(false)
      expect(result).toHaveProperty('runtime')
      expect(result).toHaveProperty('summary')
      expect(result.summary.errors).toBeGreaterThan(0)
      expect(result.diagnostics.some((diag: { code: string }) => diag.code === 'missing_section')).toBe(true)
    })()
  })

  it('reports unreadable focus markers as structured check errors', () => {
    const checkDir = join(tmpdir(), 'rsp-check-unreadable-focus-test', randomUUID())
    return (async () => {
      await mkdir(join(checkDir, '.rsp', 'focus.d'), { recursive: true })
      await mkdir(join(checkDir, '.rsp', 'changes'), { recursive: true })
      await writeFile(join(checkDir, '.rsp', 'focus.d', 'broken-focus'), '')
      await writeFile(join(checkDir, '.rsp', 'changes', 'broken-focus.md'), renderChange('broken-focus'))
      await chmod(join(checkDir, '.rsp', 'focus.d', 'broken-focus'), 0o000)

      let output = ''
      try {
        output = execSync(`node ${cliPath()} check --json`, { cwd: checkDir, encoding: 'utf-8' })
      }
      catch (error) {
        output = String((error as { stdout?: string }).stdout || '')
      }
      finally {
        await chmod(join(checkDir, '.rsp', 'focus.d', 'broken-focus'), 0o644)
      }

      const result = JSON.parse(output)
      expect(result.command).toBe('check')
      expect(result.ok).toBe(false)
      expect(result.summary.errors).toBeGreaterThan(0)
      expect(result.diagnostics.some((diag: { code: string }) => diag.code === 'focus_marker_read_failed')).toBe(true)
      expect(result.runtime.some((diag: { code: string }) => diag.code === 'focus_marker_read_failed')).toBe(true)
    })()
  })

  it('repairs a missing AGENTS managed block during update', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-agents-repair-test', randomUUID())
    await mkdir(updateDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: updateDir })
    await writeFile(join(updateDir, 'AGENTS.md'), '# Custom Agents\n\nmanual content\n')

    const output = execSync(`node ${cliPath()} update`, { cwd: updateDir, encoding: 'utf-8' })
    const agents = await readFile(join(updateDir, 'AGENTS.md'), 'utf-8')
    expect(agents).toContain('<!-- rsp:begin -->')
    expect(output).toContain('rsp skills install --dry-run')
    expect(output).toContain('rsp skills install --force')
  })

  it('recreates AGENTS.md during update without writing [object Promise]', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-recreate-agents-test', randomUUID())
    await mkdir(updateDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: updateDir })
    await rm(join(updateDir, 'AGENTS.md'))

    execSync(`node ${cliPath()} update`, { cwd: updateDir })
    const agents = await readFile(join(updateDir, 'AGENTS.md'), 'utf-8')
    expect(agents).not.toContain('[object Promise]')
    expect(agents).toContain('<!-- rsp:begin -->')
  })

  it('restores the canonical fallback protocol during update', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-missing-rules-test', randomUUID())
    await mkdir(updateDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: updateDir })
    await mkdir(join(updateDir, '.rsp', 'rules'))
    await rm(join(updateDir, '.rsp', 'rsp-rules.md'))

    execSync(`node ${cliPath()} update`, { cwd: updateDir })
    const rules = await readFile(join(updateDir, '.rsp', 'rsp-rules.md'), 'utf-8')
    expect(rules).toContain('minimal fallback protocol')
    expect(existsSync(join(updateDir, '.rsp', 'rules'))).toBe(false)
  })

  it('removes only a recognized legacy generated Archive Index during update', async () => {
    const recognizedDir = join(tmpdir(), 'rsp-update-recognized-archive-index-test', randomUUID())
    const customDir = join(tmpdir(), 'rsp-update-custom-archive-index-test', randomUUID())
    await mkdir(recognizedDir, { recursive: true })
    await mkdir(customDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: recognizedDir })
    execSync(`node ${cliPath()} init`, { cwd: customDir })
    await writeFile(join(recognizedDir, '.rsp', 'archives', 'INDEX.md'), renderGeneratedIndexMetadata('archives'))
    await writeFile(join(customDir, '.rsp', 'archives', 'INDEX.md'), '# Project-owned archive notes\n')

    const recognized = execSync(`node ${cliPath()} update`, { cwd: recognizedDir, encoding: 'utf-8' })
    execSync(`node ${cliPath()} update`, { cwd: customDir })

    expect(recognized).toContain('legacy Archive Index removed')
    expect(existsSync(join(recognizedDir, '.rsp', 'archives', 'INDEX.md'))).toBe(false)
    expect(await readFile(join(customDir, '.rsp', 'archives', 'INDEX.md'), 'utf-8')).toBe('# Project-owned archive notes\n')
  })

  it('migrates and removes the old generated fallback while preserving custom rules', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-legacy-fallback-test', randomUUID())
    const obsoleteGeneratedContent = '# obsolete generated fallback\n'
    await mkdir(join(updateDir, '.rsp', 'rules'), { recursive: true })
    await mkdir(join(updateDir, '.rsp', 'specs'), { recursive: true })
    await mkdir(join(updateDir, '.rsp', 'archives'), { recursive: true })
    await writeFile(join(updateDir, '.rsp', 'rules', 'rsp-rules.md'), obsoleteGeneratedContent)
    await writeFile(join(updateDir, '.rsp', 'rules', 'custom.md'), '# custom legacy rule\n')
    await writeFile(join(updateDir, '.rsp', 'specs', 'design.md'), '# design\n')
    await writeFile(join(updateDir, '.rsp', 'specs', 'INDEX.md'), renderGeneratedIndexMetadata('specs'))
    await writeFile(join(updateDir, '.rsp', 'archives', 'INDEX.md'), renderGeneratedIndexMetadata('archives'))

    const updateOutput = execSync(`node ${cliPath()} update`, { cwd: updateDir, encoding: 'utf-8' })

    expect(existsSync(join(updateDir, '.rsp', 'rules', 'rsp-rules.md'))).toBe(false)
    expect(await readFile(join(updateDir, '.rsp', 'rules', 'custom.md'), 'utf-8')).toBe('# custom legacy rule\n')
    expect(await readFile(join(updateDir, '.rsp', 'rsp-rules.md'), 'utf-8')).toContain('minimal fallback protocol')
    expect(updateOutput).toContain('custom.md')
    expect(updateOutput).toContain('no longer read by RSP')
    expect(updateOutput).toContain('Run: rsp doctor')

    const doctorResult = spawnSync('node', [cliPath(), 'doctor'], { cwd: updateDir, encoding: 'utf-8' })
    expect(doctorResult.status).toBe(1)
    expect(doctorResult.stdout).toContain('unsupported .rsp/rules/ entries')
  })

  it('fails update and doctor when obsolete rules cannot be inspected', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-unreadable-rules-test', randomUUID())
    await mkdir(updateDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: updateDir })
    await mkdir(join(updateDir, '.rsp', 'rules'))
    await writeFile(join(updateDir, '.rsp', 'rules', 'custom.md'), '# custom rule\n')
    await chmod(join(updateDir, '.rsp', 'rules'), 0o000)

    try {
      const updateResult = spawnSync('node', [cliPath(), 'update'], { cwd: updateDir, encoding: 'utf-8' })
      const doctorResult = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: updateDir, encoding: 'utf-8' })
      const doctor = JSON.parse(doctorResult.stdout)

      expect(updateResult.status).toBe(1)
      expect(`${updateResult.stdout}${updateResult.stderr}`).toContain('migration inspection incomplete')
      expect(doctorResult.status).toBe(1)
      expect(doctor.ok).toBe(false)
      expect(doctor.checks.some((check: { label: string }) => check.label === 'unable to inspect .rsp/rules/')).toBe(true)
      expect(doctor.runtime.some((diagnostic: { code: string }) => diagnostic.code === 'walk_failed')).toBe(true)
    }
    finally {
      await chmod(join(updateDir, '.rsp', 'rules'), 0o755)
    }
  })

  it('reports every residual rules entry regardless of file extension or visibility', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-non-markdown-rules-test', randomUUID())
    await mkdir(updateDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: updateDir })
    await mkdir(join(updateDir, '.rsp', 'rules'))
    await writeFile(join(updateDir, '.rsp', 'rules', 'custom.txt'), 'custom rule\n')
    await writeFile(join(updateDir, '.rsp', 'rules', '.hidden-rule'), 'hidden rule\n')

    const updateOutput = execSync(`node ${cliPath()} update`, { cwd: updateDir, encoding: 'utf-8' })
    const doctorResult = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: updateDir, encoding: 'utf-8' })
    const doctor = JSON.parse(doctorResult.stdout)

    expect(updateOutput).toContain('custom.txt')
    expect(updateOutput).toContain('.hidden-rule')
    expect(updateOutput).toContain('manual migration remains')
    expect(doctorResult.status).toBe(1)
    expect(doctor.checks.some((check: { label: string }) => check.label === 'unsupported .rsp/rules/ entries')).toBe(true)
  })

  it('removes a rules directory tree that contains only empty directories', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-empty-rules-tree-test', randomUUID())
    await mkdir(updateDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: updateDir })
    await mkdir(join(updateDir, '.rsp', 'rules', 'nested', 'empty'), { recursive: true })

    const updateOutput = execSync(`node ${cliPath()} update`, { cwd: updateDir, encoding: 'utf-8' })

    expect(existsSync(join(updateDir, '.rsp', 'rules'))).toBe(false)
    expect(updateOutput).toContain('empty rules directory tree removed')
  })

  it('migrates the generated fallback through doctor --fix while retaining custom rules as an issue', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-fix-rules-migration-test', randomUUID())
    await mkdir(join(doctorDir, '.rsp', 'rules'), { recursive: true })
    await mkdir(join(doctorDir, '.rsp', 'specs'), { recursive: true })
    await writeFile(join(doctorDir, '.rsp', 'rules', 'rsp-rules.md'), '# obsolete generated fallback\n')
    await writeFile(join(doctorDir, '.rsp', 'rules', 'custom.md'), '# custom rule\n')
    await writeFile(join(doctorDir, '.rsp', 'specs', 'design.md'), '# design\n')

    const doctorResult = spawnSync('node', [cliPath(), 'doctor', '--fix', '--json'], { cwd: doctorDir, encoding: 'utf-8' })
    const doctor = JSON.parse(doctorResult.stdout)

    expect(doctorResult.status).toBe(1)
    expect(doctor.fixed).toContain('rsp-rules.md updated')
    expect(doctor.fixed).toContain('obsolete rules/rsp-rules.md removed')
    expect(doctor.ok).toBe(false)
    expect(existsSync(join(doctorDir, '.rsp', 'rsp-rules.md'))).toBe(true)
    expect(existsSync(join(doctorDir, '.rsp', 'rules', 'rsp-rules.md'))).toBe(false)
    expect(existsSync(join(doctorDir, '.rsp', 'rules', 'custom.md'))).toBe(true)
    expect(doctor.checks.some((check: { label: string }) => check.label === 'unsupported .rsp/rules/ entries')).toBe(true)
  })

  it('completes an old generated fallback migration through doctor --fix', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-fix-generated-fallback-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await mkdir(join(doctorDir, '.rsp', 'rules'))
    await writeFile(join(doctorDir, '.rsp', 'rules', 'rsp-rules.md'), '# obsolete generated fallback\n')
    await rm(join(doctorDir, '.rsp', 'rsp-rules.md'))

    const output = execSync(`node ${cliPath()} doctor --fix --json`, { cwd: doctorDir, encoding: 'utf-8' })
    const doctor = JSON.parse(output)

    expect(doctor.ok).toBe(true)
    expect(doctor.fixed).toContain('rsp-rules.md updated')
    expect(doctor.fixed).toContain('obsolete rules/rsp-rules.md removed')
    expect(doctor.fixed).toContain('empty rules directory removed')
    expect(existsSync(join(doctorDir, '.rsp', 'rsp-rules.md'))).toBe(true)
    expect(existsSync(join(doctorDir, '.rsp', 'rules'))).toBe(false)
  })

  it('prints the skill refresh hint even when update is already up to date', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-skill-hint-test', randomUUID())
    await mkdir(updateDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: updateDir })
    const output = execSync(`node ${cliPath()} update`, { cwd: updateDir, encoding: 'utf-8' })

    expect(output).toContain('Already up to date.')
    expect(output).toContain('rsp skills install --dry-run')
    expect(output).toContain('rsp skills install --force')
  })

  it('reports invalid archive naming conventions using change wording', async () => {
    const brokenDir = join(tmpdir(), 'rsp-doctor-archive-name-test', randomUUID())
    await mkdir(join(brokenDir, RSP_DIR, 'specs'), { recursive: true })
    await mkdir(join(brokenDir, RSP_DIR, 'archives'), { recursive: true })
    await writeFile(join(brokenDir, RSP_DIR, 'rsp-rules.md'), '# rules\n')
    await writeFile(join(brokenDir, RSP_DIR, 'specs', 'design.md'), '# design\n')
    await writeFile(join(brokenDir, RSP_DIR, 'specs', 'INDEX.md'), renderGeneratedIndexMetadata('specs'))
    await writeFile(join(brokenDir, RSP_DIR, 'archives', 'INDEX.md'), renderGeneratedIndexMetadata('archives'))
    await writeFile(join(brokenDir, RSP_DIR, 'archives', 'bad-name.md'), '# archived\n')
    await writeFile(join(brokenDir, 'AGENTS.md'), '<!-- rsp:begin -->\n## RSP Entry\n<!-- rsp:end -->\n')

    let output = ''
    try {
      output = execSync(`node ${cliPath()} doctor`, { cwd: brokenDir, encoding: 'utf-8' })
    }
    catch (error) {
      output = String((error as { stdout?: string }).stdout || '')
    }

    expect(output).toContain('archived change files with invalid names: bad-name.md')
  })
})

describe('pseudo-real fixture workflow', () => {
  it('initializes, adds files, and passes doctor in a repo with existing AGENTS.md', async () => {
    const fixtureDir = await copyFixture('home-manager-ish')

    execSync(`node ${cliPath()} init`, { cwd: fixtureDir })
    execSync(`node ${cliPath()} add spec shell-layout`, { cwd: fixtureDir })

    const agents = await readFile(join(fixtureDir, 'AGENTS.md'), 'utf-8')
    expect(agents).toContain('<!-- rsp:begin -->')

    const doctorOutput = execSync(`node ${cliPath()} doctor`, { cwd: fixtureDir, encoding: 'utf-8' })
    expect(doctorOutput).toContain('RSP setup looks healthy')
  })
})

describe('archive name collisions', () => {
  it('fails closed on a normalization-equivalent archive filename', async () => {
    const archiveDir = join(tmpdir(), 'rsp-archive-normalization-collision-test', randomUUID())
    await mkdir(archiveDir, { recursive: true })
    execFileSync('node', [cliPath(), 'init'], { cwd: archiveDir })
    const workRef = '听说训练-é'
    execFileSync('node', [cliPath(), 'create', workRef, '验证中文归档'], { cwd: archiveDir })

    const today = new Date().toISOString().slice(0, 10)
    const canonicalName = `${today}_${workRef}.md`
    const decomposedName = canonicalName.normalize('NFD')
    expect(decomposedName).not.toBe(canonicalName)
    await writeFile(join(archiveDir, '.rsp', 'archives', decomposedName), '# normalization alias\n')

    const result = spawnSync('node', [cliPath(), 'archive', workRef], { cwd: archiveDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Unicode normalization collision')
    expect(existsSync(join(archiveDir, '.rsp', 'changes', `${workRef}.md`))).toBe(true)
    expect(await readdir(join(archiveDir, '.rsp', 'archives'))).toContain(decomposedName)
  })

  it('does not archive through a symlinked group destination', async () => {
    const archiveDir = join(tmpdir(), 'rsp-archive-group-symlink-test', randomUUID())
    const externalDir = join(tmpdir(), 'rsp-archive-group-external-test', randomUUID())
    await mkdir(archiveDir, { recursive: true })
    await mkdir(externalDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: archiveDir })
    execSync(`node ${cliPath()} group create release "Ship release"`, { cwd: archiveDir })
    await writeFile(join(archiveDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui']))
    execSync(`node ${cliPath()} create release/api`, { cwd: archiveDir })
    await symlink(externalDir, join(archiveDir, '.rsp', 'archives', 'release'))

    const dryRun = spawnSync('node', [cliPath(), 'archive', 'release/api', '--dry-run'], { cwd: archiveDir, encoding: 'utf-8' })
    const result = spawnSync('node', [cliPath(), 'archive', 'release/api'], { cwd: archiveDir, encoding: 'utf-8' })

    expect(dryRun.status).toBe(0)
    expect(dryRun.stderr).toContain('Deprecated: use `rsp ready <name>`')
    expect(dryRun.stdout).toContain('Archive readiness for release/api')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('archive path must be a real directory')
    expect(existsSync(join(archiveDir, '.rsp', 'changes', 'release', 'api.md'))).toBe(true)
    expect((await readdir(externalDir))).toEqual([])
    expect(existsSync(join(archiveDir, '.rsp', '.lock'))).toBe(false)
  })

  it('keeps both archives when the same change is archived twice on the same day', async () => {
    const { createChange } = await import('../src/commands/create.js')
    const { archiveChange } = await import('../src/commands/archive.js')

    await createChange('duplicate-archive', 'first pass')
    await archiveChange('duplicate-archive')
    await createChange('duplicate-archive', 'second pass')
    await archiveChange('duplicate-archive')

    const archiveFiles = (await readdir(archivePath())).filter(f => f !== 'INDEX.md')
    const matches = archiveFiles.filter(f => /_duplicate-archive(?:-2)?\.md$/.test(f))
    expect(matches).toHaveLength(2)
  })
})

describe('reopen command', () => {
  const today = new Date().toISOString().slice(0, 10)

  it('restores one archived Change under the same WorkRef while retaining history', async () => {
    const root = await createReopenProject('success')
    runReopen(root, ['create', 'recover-me', 'Recover this work'])
    const originalPath = join(root, '.rsp', 'changes', 'recover-me.md')
    await writeFile(originalPath, completeReopenChange(await readFile(originalPath, 'utf-8')))
    runReopen(root, ['archive', 'recover-me'])
    const archive = join(root, '.rsp', 'archives', `${today}_recover-me.md`)
    const archived = await readFile(archive, 'utf-8')

    const output = runReopen(root, ['reopen', 'recover-me', '--reason', 'real run still fails'])

    expect(output).toContain('Reopened: recover-me')
    expect(await readFile(archive, 'utf-8')).toBe(archived)
    const reopened = await readFile(originalPath, 'utf-8')
    expect(reopened).toContain('- [ ] Resolve reopened concern: real run still fails')
    expect(reopened).toContain('- [ ] Verify reopened concern: real run still fails')
    expect(existsSync(join(root, '.rsp', 'focus.d', 'recover-me'))).toBe(true)

    await writeFile(originalPath, completeReopenChange(reopened))
    runReopen(root, ['archive', 'recover-me'])
    expect((await readdir(join(root, '.rsp', 'archives'))).filter(name => name.includes('recover-me'))).toHaveLength(2)
    expect(existsSync(join(root, '.rsp', 'focus.d', 'recover-me'))).toBe(false)
  })

  it('fails on ambiguous history and accepts one exact matching archive path', async () => {
    const root = await createReopenProject('ambiguous')
    await createReopenArchive(root, 'repeat', 'first pass')
    await createReopenArchive(root, 'repeat', 'second pass')

    const ambiguous = failReopen(root, ['reopen', 'repeat', '--reason', 'needs correction'])
    expect(ambiguous.stderr).toContain('multiple archives match WorkRef repeat')
    expect(ambiguous.stderr).toContain(`.rsp/archives/${today}_repeat.md`)
    expect(ambiguous.stderr).toContain(`.rsp/archives/${today}_repeat-2.md`)
    expect(existsSync(join(root, '.rsp', 'changes', 'repeat.md'))).toBe(false)

    runReopen(root, ['reopen', 'repeat', '--from', `.rsp/archives/${today}_repeat-2.md`, '--reason', 'needs correction'])
    expect(await readFile(join(root, '.rsp', 'changes', 'repeat.md'), 'utf-8')).toContain('- Outcome: second pass')
    expect((await readdir(join(root, '.rsp', 'archives'))).filter(name => name.includes('repeat'))).toHaveLength(2)
  })

  it('rejects identity mismatch and never overwrites existing open work', async () => {
    const root = await createReopenProject('identity-and-collision')
    await createReopenArchive(root, 'first', 'archived version')

    const mismatch = failReopen(root, ['reopen', 'other', '--from', `.rsp/archives/${today}_first.md`, '--reason', 'wrong target'])
    expect(mismatch.stderr).toContain('selected archive belongs to first, not other')

    runReopen(root, ['create', 'first', 'current open version'])
    const openPath = join(root, '.rsp', 'changes', 'first.md')
    const current = await readFile(openPath, 'utf-8')
    const collision = failReopen(root, ['reopen', 'first', '--reason', 'must not overwrite'])
    expect(collision.stderr).toContain('open Change already exists: first')
    expect(await readFile(openPath, 'utf-8')).toBe(current)
  })

  it('treats reopened work as an open dependency rather than archived history', async () => {
    const root = await createReopenProject('dependency')
    await createReopenArchive(root, 'foundation', 'foundation pass')
    runReopen(root, ['create', 'consumer', 'consumer pass'])
    const consumerPath = join(root, '.rsp', 'changes', 'consumer.md')
    await writeFile(consumerPath, (await readFile(consumerPath, 'utf-8')).replace(
      '## Blockers\n- none',
      '## Blockers\n- requires `foundation`: foundation must be complete',
    ))

    runReopen(root, ['reopen', 'foundation', '--reason', 'foundation is incomplete'])
    const status = JSON.parse(runReopen(root, ['status', '--json']))
    expect(status.plan.edges).toContainEqual(expect.objectContaining({ change: 'consumer', requires: 'foundation', state: 'open' }))
    expect(status.plan.nodes).toContainEqual(expect.objectContaining({ name: 'foundation', selection: 'selected', state: 'ready' }))
    expect(status.plan.blocked).toContainEqual(expect.objectContaining({ change: 'consumer', requires: ['foundation'] }))
  })

  it('reopens a declared child only while its Change Group remains open', async () => {
    const root = await createReopenProject('open-group')
    runReopen(root, ['group', 'create', 'delivery', 'Deliver two slices'])
    await writeFile(join(root, '.rsp', 'changes', 'delivery', '00-brief.md'), renderReopenGroupBrief('delivery', false))
    await createReopenArchive(root, 'delivery/api', 'api pass')

    runReopen(root, ['reopen', 'delivery/api', '--reason', 'api still fails'])
    expect(existsSync(join(root, '.rsp', 'changes', 'delivery', 'api.md'))).toBe(true)
    expect(existsSync(join(root, '.rsp', 'focus.d', 'delivery', 'api'))).toBe(true)
  })

  it('does not implicitly reopen a closed Change Group', async () => {
    const root = await createReopenProject('closed-group')
    runReopen(root, ['group', 'create', 'delivery', 'Deliver two slices'])
    await writeFile(join(root, '.rsp', 'changes', 'delivery', '00-brief.md'), renderReopenGroupBrief('delivery', true))
    await createReopenArchive(root, 'delivery/api', 'api pass')
    await createReopenArchive(root, 'delivery/ui', 'ui pass')
    runReopen(root, ['group', 'close', 'delivery'])

    const result = failReopen(root, ['reopen', 'delivery/api', '--reason', 'api still fails'])
    expect(result.stderr).toContain('cannot reopen delivery/api because its Change Group is closed')
    expect(existsSync(join(root, '.rsp', 'changes', 'delivery', 'api.md'))).toBe(false)
  })

  it('fails before mutation when archive inspection is incomplete', async () => {
    const root = await createReopenProject('invalid-history')
    await createReopenArchive(root, 'valid', 'valid pass')
    await writeFile(join(root, '.rsp', 'archives', 'bad-name.md'), '# invalid archive\n')

    const result = failReopen(root, ['reopen', 'valid', '--reason', 'must inspect first'])
    expect(result.stderr).toContain('archive history inspection is incomplete')
    expect(existsSync(join(root, '.rsp', 'changes', 'valid.md'))).toBe(false)
    expect(existsSync(join(root, '.rsp', 'focus.d', 'valid'))).toBe(false)
  })

  it('rejects non-canonical required section headings before mutation', async () => {
    const root = await createReopenProject('invalid-sections')
    await writeFile(join(root, '.rsp', 'archives', `${today}_invalid-sections.md`), `---
kind: feature
---

# Change: invalid-sections

## Proposal
- Outcome: malformed archived sections

## Tasks notes
- [x] old task

## Verify notes
- [x] old verification

## Blockers
- none
`)

    const result = failReopen(root, ['reopen', 'invalid-sections', '--reason', 'must remain atomic'])
    expect(result.stderr).toContain('must contain exactly one required section: Tasks')
    expect(existsSync(join(root, '.rsp', 'changes', 'invalid-sections.md'))).toBe(false)
    expect(existsSync(join(root, '.rsp', 'focus.d', 'invalid-sections'))).toBe(false)
  })
})

async function createReopenProject(label: string): Promise<string> {
  const root = join(tmpdir(), `rsp-reopen-${label}`, randomUUID())
  await mkdir(root, { recursive: true })
  runReopen(root, ['init'])
  return root
}

function runReopen(root: string, args: string[]): string {
  return execFileSync('node', [cliPath(), ...args], { cwd: root, encoding: 'utf-8' })
}

function failReopen(root: string, args: string[]) {
  const result = spawnSync('node', [cliPath(), ...args], { cwd: root, encoding: 'utf-8' })
  expect(result.status).toBe(1)
  return result
}

async function createReopenArchive(root: string, name: string, summary: string): Promise<void> {
  runReopen(root, ['create', name, summary])
  const segments = name.split('/')
  const path = join(root, '.rsp', 'changes', ...segments.slice(0, -1), `${segments.at(-1)}.md`)
  await writeFile(path, completeReopenChange(await readFile(path, 'utf-8')))
  runReopen(root, ['archive', name])
}

function completeReopenChange(content: string): string {
  return content.replaceAll('- [ ]', '- [x]')
}

function renderReopenGroupBrief(group: string, complete: boolean): string {
  return `---
kind: group
---

# Change Group: ${group}

## Goal
- Deliver two slices

## Scope
- Coordinate delivery

## Shared Constraints
- Keep slices independent

## Slices
- \`${group}/api\`: API slice
- \`${group}/ui\`: UI slice

## Completion Conditions
- [${complete ? 'x' : ' '}] Both slices work together

## Durable Outcomes
- none

## Blockers
- none
`
}

describe('ready command', () => {
  it('reports archive readiness without moving the change', async () => {
    const readyDir = await createRspFixture('rsp-ready-test')
    await writeFile(join(readyDir, '.rsp', 'changes', 'incomplete.md'), renderChange('incomplete'))

    const output = execSync(`node ${cliPath()} ready incomplete`, { cwd: readyDir, encoding: 'utf-8' })
    expect(output).toContain('task item(s) still incomplete')
    expect(output).toContain('Verify checklist item(s) are still incomplete')
    expect(output).not.toContain('Run: rsp archive incomplete')

    // change should still be there (not archived)
    expect(existsSync(join(readyDir, '.rsp', 'changes', 'incomplete.md'))).toBe(true)
  })

  it('reports ready when all checks pass', async () => {
    const readyDir = await createRspFixture('rsp-ready-clean-test')
    await writeFile(join(readyDir, '.rsp', 'changes', 'complete.md'), renderChange('complete').replace(
      '- [ ] implement complete',
      '- [x] implement complete',
    ).replace(
      '- [ ] run tests',
      '- [x] run tests',
    ).replace(
      '- [ ] smoke test complete',
      '- [x] smoke test complete',
    ).replace(
      '- [ ] decide whether this change produced durable knowledge',
      '- [x] decide whether this change produced durable knowledge',
    ).replace(
      '- [ ] if yes, update the smallest correct target before archive',
      '- [x] if yes, update the smallest correct target before archive',
    ))

    const output = execSync(`node ${cliPath()} ready complete`, { cwd: readyDir, encoding: 'utf-8' })
    expect(output).toContain('Ready to archive.')
    expect(output).not.toContain('Run: rsp archive complete')
  })

  it('emits machine-readable JSON', async () => {
    const readyDir = await createRspFixture('rsp-ready-json-test')
    await writeFile(join(readyDir, '.rsp', 'changes', 'incomplete.md'), renderChange('incomplete'))

    const output = execSync(`node ${cliPath()} ready incomplete --json`, { cwd: readyDir, encoding: 'utf-8' })
    const result = JSON.parse(output)
    expect(result.command).toBe('ready')
    expect(result.ok).toBe(true)
    expect(result.change).toBe('incomplete')
    expect(result.readiness.incompleteTasks).toBe(1)
    expect(result.readiness.incompleteVerify).toBe(4)
    expect(result.readiness.activeBlockers).toBe(false)
    expect(result.readiness.missingScenarios).toBe(false)
    expect(result.readiness.deterministic).toBe('warnings')
    expect(result.readiness.semantic).toBe('needs-review')
    expect(result.readiness.archiveReady).toBe('judgment')
    expect(result.durableReview.required).toBe(true)
    expect(result.durableReview.factDecisions).toContain('No current-fact update needed')
    expect(result.durableReview.rationaleDecisions).toContain('No Decision Record needed')
    expect(result.durableReview.factCandidateTargets).toContain('.rsp/specs/design.md')
    expect(result.durableReview.factCandidateTargets).not.toContain('.rsp/specs/00-index.md')
    expect(result.durableReview.factCandidateTargets).not.toContain('.rsp/rules/rsp-rules.md')
    expect(result.durableReview.decisionRecordsPath).toBe('.rsp/specs/decisions')
    expect(result.durableReview.note).toContain('never promotes Change content automatically')
    expect(result).not.toHaveProperty('nextActions')
    expect(Array.isArray(result.warnings)).toBe(true)
  })

  it('keeps deterministic readiness advisory when the change is ready', async () => {
    const readyDir = await createRspFixture('rsp-ready-next-actions-test')
    await writeFile(join(readyDir, '.rsp', 'changes', 'complete.md'), renderChange('complete').replaceAll('- [ ]', '- [x]'))

    const output = execSync(`node ${cliPath()} ready complete --json`, { cwd: readyDir, encoding: 'utf-8' })
    const result = JSON.parse(output)

    expect(result.readiness.archiveReady).toBe('yes')
    expect(result).not.toHaveProperty('nextActions')
  })

  it('reports machine-readable readiness categories for active blockers', async () => {
    const readyDir = await createRspFixture('rsp-ready-json-blocked-test')
    await writeFile(join(readyDir, '.rsp', 'changes', 'blocked.md'), renderChange('blocked').replace('## Blockers\n- none', '## Blockers\n- waiting on release owner'))

    const output = execSync(`node ${cliPath()} ready blocked --json`, { cwd: readyDir, encoding: 'utf-8' })
    const result = JSON.parse(output)
    expect(result.readiness.deterministic).toBe('warnings')
    expect(result.readiness.semantic).toBe('needs-review')
    expect(result.readiness.archiveReady).toBe('no')
  })

  it('prints readiness category guidance in human output', async () => {
    const readyDir = await createRspFixture('rsp-ready-human-categories-test')
    await writeFile(join(readyDir, '.rsp', 'changes', 'incomplete.md'), renderChange('incomplete'))

    const output = execSync(`node ${cliPath()} ready incomplete`, { cwd: readyDir, encoding: 'utf-8' })
    expect(output).toContain('Deterministic readiness:')
    expect(output).toContain('Semantic review:')
    expect(output).toContain('Archive ready:')
    expect(output).toContain('Durable review:')
    expect(output).toContain('Current-fact options:')
    expect(output).toContain('Rationale options:')
    expect(output).toContain('Decision Record path:')
  })

  it('keeps ready errors machine-readable when the target is not a file', async () => {
    const readyDir = await createRspFixture('rsp-ready-not-file-test')
    await mkdir(join(readyDir, '.rsp', 'changes', 'not-a-file.md'), { recursive: true })

    const result = spawnSync('node', [cliPath(), 'ready', 'not-a-file', '--json'], { cwd: readyDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(output.error.code).toBe('work_ref_not_file')
  })
})

describe('show command', () => {
  it('shows change context for a named change', async () => {
    const showDir = await createRspFixture('rsp-show-test')
    await writeFile(join(showDir, '.rsp', 'changes', 'display-me.md'), renderChange('display-me'))

    const output = execSync(`node ${cliPath()} show display-me`, { cwd: showDir, encoding: 'utf-8' })
    expect(output).toContain('display-me')
    expect(output).toContain('Kind:')
    expect(output).toContain('Progress:')
    expect(output).toContain('Blockers:')
    expect(output).toContain('Scenarios:')
    expect(output).toContain('Readiness:')
    expect(output).toContain('Context paths')
  })

  it('shows focused change with --focused flag', async () => {
    const showDir = await createRspFixture('rsp-show-focused-test', ['specs', 'changes', 'focus.d'])
    await writeFile(join(showDir, '.rsp', 'changes', 'focused-show.md'), renderChange('focused-show'))
    await writeFile(join(showDir, '.rsp', 'focus.d', 'focused-show'), '')

    const output = execSync(`node ${cliPath()} show --focused`, { cwd: showDir, encoding: 'utf-8' })
    expect(output).toContain('focused-show')
    expect(output).toContain('Focused:')
  })

  it('does not print an archive action before Core durable review', async () => {
    const showDir = await createRspFixture('rsp-show-ready-human-test')
    await writeFile(join(showDir, '.rsp', 'changes', 'complete.md'), renderChange('complete').replaceAll('- [ ]', '- [x]'))

    const output = execSync(`node ${cliPath()} show complete`, { cwd: showDir, encoding: 'utf-8' })

    expect(output).not.toContain('Run: rsp archive complete')
  })

  it('emits machine-readable JSON with readiness and context paths', async () => {
    const showDir = await createRspFixture('rsp-show-json-test')
    await writeFile(join(showDir, '.rsp', 'changes', 'json-test.md'), renderChange('json-test'))

    const output = execSync(`node ${cliPath()} show json-test --json`, { cwd: showDir, encoding: 'utf-8' })
    const result = JSON.parse(output)
    expect(result.command).toBe('show')
    expect(result.ok).toBe(true)
    expect(result.change.name).toBe('json-test')
    expect(result.change.kind).toBe('feature')
    expect(result.change.progress).toHaveProperty('done')
    expect(result.change.progress).toHaveProperty('total')
    expect(result.change.blockers).toBe(false)
    expect(result.change.scenarioCount).toBe(1)
    expect(result.change.readiness.incompleteTasks).toBe(1)
    expect(result.change.readiness.incompleteVerify).toBe(4)
    expect(result.change.readiness).toHaveProperty('activeBlockers')
    expect(result.change.readiness).toHaveProperty('missingScenarios')
    expect(result.change.readiness.deterministic).toBe('warnings')
    expect(result.change.readiness.semantic).toBe('needs-review')
    expect(result.change.readiness.archiveReady).toBe('judgment')
    expect(Array.isArray(result.contextPaths)).toBe(true)
    expect(result.contextPaths).toContain('.rsp/specs/design.md')
    expect(result.contextPaths).not.toContain('.rsp/specs/00-index.md')
    expect(result.contextPaths).not.toContain('.rsp/rules/rsp-rules.md')
    expect(result.durableReview.required).toBe(true)
    expect(result.durableReview.factCandidateTargets).toEqual(['.rsp/specs/design.md'])
    expect(result.contextPaths).toContain(result.durableReview.decisionRecordsPath)
    expect(result).not.toHaveProperty('nextActions')
  })

  it('keeps shown readiness advisory before Core durable review', async () => {
    const showDir = await createRspFixture('rsp-show-next-actions-test')
    await writeFile(join(showDir, '.rsp', 'changes', 'complete.md'), renderChange('complete').replaceAll('- [ ]', '- [x]'))

    const output = execSync(`node ${cliPath()} show complete --json`, { cwd: showDir, encoding: 'utf-8' })
    const result = JSON.parse(output)

    expect(result.change.readiness.archiveReady).toBe('yes')
    expect(result).not.toHaveProperty('nextActions')
  })

  it('emits machine-readable JSON errors when requested', async () => {
    const showDir = await createRspFixture('rsp-show-json-error-test')

    let output = ''
    let failed = false
    try {
      output = execSync(`node ${cliPath()} show --focused --json`, { cwd: showDir, encoding: 'utf-8' })
    }
    catch (error) {
      failed = true
      output = String((error as { stdout?: string }).stdout || '')
    }

    const result = JSON.parse(output)
    expect(failed).toBe(true)
    expect(result.command).toBe('show')
    expect(result.ok).toBe(false)
    expect(result.error.code).toBe('no_focused_change')
    expect(result.nextActions).toContain('Run: rsp status')
    expect(result.nextActions).toContain('Run: rsp focus <name>')
  })

  it('rejects Group Briefs as executable Changes with a machine-readable error', async () => {
    const showDir = await createRspFixture('rsp-show-group-brief-test')
    await mkdir(join(showDir, '.rsp', 'changes', 'release'), { recursive: true })
    await writeFile(join(showDir, '.rsp', 'changes', 'release', '00-brief.md'), '# Group Brief: release\n')

    const result = spawnSync('node', [cliPath(), 'show', 'release/brief', '--json'], { cwd: showDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    const output = JSON.parse(result.stdout)
    expect(output.error.code).toBe('non_executable_work_ref')
  })
})

describe('typed work references', () => {
  it('keeps Group Briefs out of executable status records', async () => {
    const statusDir = await createRspFixture('rsp-status-work-ref-test')
    const groupDir = join(statusDir, '.rsp', 'changes', 'release')
    await mkdir(groupDir, { recursive: true })
    await writeFile(join(groupDir, '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui']))
    await writeFile(join(groupDir, 'api.md'), renderChange('release/api'))
    await writeFile(join(groupDir, 'ui.md'), renderChange('release/ui'))

    const output = execSync(`node ${cliPath()} status --json`, { cwd: statusDir, encoding: 'utf-8' })
    const result = JSON.parse(output)

    expect(result.records.map((record: { name: string }) => record.name)).toEqual(['release/api', 'release/ui'])
  })

  it('never focuses a Group Brief', async () => {
    const focusDir = await createRspFixture('rsp-focus-group-brief-test', ['specs', 'changes', 'focus.d'])
    const groupDir = join(focusDir, '.rsp', 'changes', 'release')
    await mkdir(groupDir, { recursive: true })
    await writeFile(join(groupDir, '00-brief.md'), '# Group Brief: release\n')

    const result = spawnSync('node', [cliPath(), 'focus', 'release/brief'], { cwd: focusDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('is a Group Brief and cannot be used as an executable Change')
    expect(existsSync(join(focusDir, '.rsp', 'focus.d', 'release', 'brief'))).toBe(false)

    const marker = join(focusDir, '.rsp', 'focus.d', 'release', 'brief')
    await mkdir(join(focusDir, '.rsp', 'focus.d', 'release'), { recursive: true })
    await writeFile(marker, '')
    const cleanup = spawnSync('node', [cliPath(), 'unfocus', 'release/brief'], { cwd: focusDir, encoding: 'utf-8' })

    expect(cleanup.status).toBe(0)
    expect(existsSync(marker)).toBe(false)
  })

  it('fails status visibly when the work tree is structurally invalid', async () => {
    const statusDir = await createRspFixture('rsp-status-invalid-work-ref-test')
    const nestedDir = join(statusDir, '.rsp', 'changes', 'release', 'backend')
    await mkdir(nestedDir, { recursive: true })
    await writeFile(join(nestedDir, 'api.md'), renderChange('release/backend/api'))

    const result = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(output.ok).toBe(false)
    expect(output.diagnostics).toContainEqual(expect.objectContaining({ code: 'unsupported_work_depth' }))
    expect(output.nextActions).toContain('Run: rsp doctor')
    expect(output.nextActions).not.toContain('Run: rsp create <name>')
  })
})

describe('change groups', () => {
  it('creates an unfocused Group Brief before child Changes', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-create-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })

    const output = execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir, encoding: 'utf-8' })
    const briefPath = join(groupDir, '.rsp', 'changes', 'release', '00-brief.md')
    const brief = await readFile(briefPath, 'utf-8')

    expect(output).toContain('Created Change Group: release')
    expect(brief).toContain('kind: group')
    expect(brief).toContain('# Change Group: release')
    expect(brief).toContain('## Goal\n- Ship the release')
    expect(brief).toContain('## Slices')
    expect(brief).toContain('## Completion Conditions')
    expect(brief).toContain('- Current facts:')
    expect(brief).toContain('- Lasting rationale:')
    expect(existsSync(join(groupDir, '.rsp', 'focus.d', 'release', 'brief'))).toBe(false)
  })

  it('documents replacement and validation semantics in the generated config template', async () => {
    const initDir = join(tmpdir(), 'rsp-config-template-test', randomUUID())
    await mkdir(initDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: initDir })

    const config = await readFile(join(initDir, '.rsp', 'config.yaml'), 'utf-8')
    expect(config).toContain('A non-empty kinds list replaces the built-in defaults; it does not extend them.')
    expect(config).toContain('Every entry must be a unique non-empty string.')
    expect(config).toContain('manage:\n  activation: auto\n  closeout: lifecycle')
    expect(config).toContain('local routes a qualified clean terminal non-small boundary to one local commit but never push or publication')
    expect(config).toContain('Set exactly one project-relative authoritative directory')
  })

  it('rejects a grouped Change until its Group Brief exists', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-required-brief-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })

    const result = spawnSync('node', [cliPath(), 'create', 'release/api'], { cwd: groupDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Change Group "release" requires a Group Brief')
    expect(result.stderr).toContain('rsp group create release')
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release', 'api.md'))).toBe(false)
    expect(existsSync(join(groupDir, '.rsp', 'focus.d', 'release', 'api'))).toBe(false)
  })

  it('can unfocus a grouped Change after its Group Brief is lost', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-unfocus-recovery-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui']))
    execSync(`node ${cliPath()} create release/api`, { cwd: groupDir })
    await rm(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'))

    const result = spawnSync('node', [cliPath(), 'unfocus', 'release/api'], { cwd: groupDir, encoding: 'utf-8' })

    expect(result.status).toBe(0)
    expect(existsSync(join(groupDir, '.rsp', 'focus.d', 'release', 'api'))).toBe(false)
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release', 'api.md'))).toBe(true)
  })

  it('rejects a grouped Change that is not declared by the Group Brief', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-undeclared-create-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui']))

    const result = spawnSync('node', [cliPath(), 'create', 'release/docs'], { cwd: groupDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('grouped Change is not declared by release/brief')
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release', 'docs.md'))).toBe(false)
    expect(existsSync(join(groupDir, '.rsp', 'focus.d', 'release', 'docs'))).toBe(false)
  })

  it('rejects an undeclared grouped Change at every executable CLI seam', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-undeclared-seams-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui']))
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', 'docs.md'), renderChange('release/docs'))

    for (const args of [
      ['focus', 'release/docs'],
      ['show', 'release/docs', '--json'],
      ['ready', 'release/docs', '--json'],
      ['archive', 'release/docs', '--dry-run'],
      ['archive', 'release/docs'],
    ]) {
      const result = spawnSync('node', [cliPath(), ...args], { cwd: groupDir, encoding: 'utf-8' })
      expect(result.status, args.join(' ')).toBe(1)
      expect(`${result.stdout}${result.stderr}`, args.join(' ')).toContain('grouped Change is not declared by release/brief')
    }
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release', 'docs.md'))).toBe(true)
    expect(existsSync(join(groupDir, '.rsp', 'focus.d', 'release', 'docs'))).toBe(false)
  })

  it('reports an empty group directory without a Group Brief', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-empty-directory-test', randomUUID())
    await mkdir(join(groupDir, '.rsp', 'changes', 'release'), { recursive: true })
    await mkdir(join(groupDir, '.rsp', 'specs'), { recursive: true })
    await writeFile(join(groupDir, '.rsp', 'rsp-rules.md'), '# RSP\n')
    await writeFile(join(groupDir, '.rsp', 'specs', 'design.md'), '# Design\n')

    const result = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    const status = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(status.diagnostics).toContainEqual(expect.objectContaining({ code: 'group_brief_missing', change: 'release' }))

    const doctorResult = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    const doctor = JSON.parse(doctorResult.stdout)
    expect(doctorResult.status).toBe(1)
    expect(doctor.checks).toContainEqual(expect.objectContaining({ status: 'issue', label: 'Change Group contracts are valid' }))
    expect(doctor.checks).not.toContainEqual(expect.objectContaining({ status: 'ok', label: 'Change Group contracts are valid' }))
  })

  it('projects Change Group membership and completion without persisted status', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-status-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui']))
    execSync(`node ${cliPath()} create release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} create release/ui`, { cwd: groupDir })

    const output = execSync(`node ${cliPath()} status --json`, { cwd: groupDir, encoding: 'utf-8' })
    const status = JSON.parse(output)

    expect(status.groups).toEqual([expect.objectContaining({
      name: 'release',
      path: '.rsp/changes/release/00-brief.md',
      completion: { done: 0, total: 1 },
      blockers: false,
      readyToClose: false,
      slices: [
        expect.objectContaining({ name: 'release/api', state: 'open' }),
        expect.objectContaining({ name: 'release/ui', state: 'open' }),
      ],
    })])
    expect(status.records.map((record: { name: string }) => record.name)).toEqual(['release/api', 'release/ui'])
    expect(status.groups[0]).not.toHaveProperty('status')

    const human = execSync(`node ${cliPath()} status`, { cwd: groupDir, encoding: 'utf-8' })
    expect(human).toContain('Change Groups')
    expect(human).toContain('release')
    expect(human).toContain('0/2 archived')
  })

  it('reports Group Brief membership mismatches through check and doctor', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-membership-check-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui']))
    execSync(`node ${cliPath()} create release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} create release/ui`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', 'docs.md'), renderChange('release/docs'))

    const checkResult = spawnSync('node', [cliPath(), 'check', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    const doctorResult = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    const check = JSON.parse(checkResult.stdout)
    const doctor = JSON.parse(doctorResult.stdout)

    expect(checkResult.status).toBe(1)
    expect(check.diagnostics).toContainEqual(expect.objectContaining({ code: 'group_child_undeclared', change: 'release' }))
    expect(doctorResult.status).toBe(1)
    expect(doctor.checks).toContainEqual(expect.objectContaining({ status: 'issue', label: 'Change Group contracts are valid' }))
  })

  it('does not derive archived membership from a Change heading in another group directory', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-archive-identity-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create other "Ship the other effort"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui'], { complete: true }))
    await writeFile(join(groupDir, '.rsp', 'changes', 'other', '00-brief.md'), renderGroupBrief('other', ['other/api', 'other/ui'], { complete: true }))
    const releaseArchiveDir = join(groupDir, '.rsp', 'archives', 'release')
    await mkdir(releaseArchiveDir, { recursive: true })
    await writeFile(join(releaseArchiveDir, '2026-07-19_api.md'), renderChange('other/api'))
    await writeFile(join(releaseArchiveDir, '2026-07-19_ui.md'), renderChange('other/ui'))

    const result = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    const status = JSON.parse(result.stdout)
    const other = status.groups.find((group: { name: string }) => group.name === 'other')

    expect(result.status).toBe(1)
    expect(other).toEqual(expect.objectContaining({
      readyToClose: false,
      slices: [
        expect.objectContaining({ name: 'other/api', state: 'missing' }),
        expect.objectContaining({ name: 'other/ui', state: 'missing' }),
      ],
    }))
    expect(status.diagnostics).toContainEqual(expect.objectContaining({ code: 'group_archive_identity_mismatch', change: 'release' }))
  })

  it('rejects an archived child removed from the authoritative Group Brief', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-archived-undeclared-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    const briefPath = join(groupDir, '.rsp', 'changes', 'release', '00-brief.md')
    await writeFile(briefPath, renderGroupBrief('release', ['release/api', 'release/ui', 'release/docs'], { complete: true }))
    execSync(`node ${cliPath()} create release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} create release/ui`, { cwd: groupDir })
    execSync(`node ${cliPath()} create release/docs`, { cwd: groupDir })
    execSync(`node ${cliPath()} archive release/docs`, { cwd: groupDir })
    await writeFile(briefPath, renderGroupBrief('release', ['release/api', 'release/ui'], { complete: true }))
    execSync(`node ${cliPath()} archive release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} archive release/ui`, { cwd: groupDir })

    const statusResult = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    const status = JSON.parse(statusResult.stdout)
    const checkResult = spawnSync('node', [cliPath(), 'check', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    const check = JSON.parse(checkResult.stdout)
    const doctorResult = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    const doctor = JSON.parse(doctorResult.stdout)
    const closeResult = spawnSync('node', [cliPath(), 'group', 'close', 'release'], { cwd: groupDir, encoding: 'utf-8' })

    expect(statusResult.status).toBe(1)
    expect(status.groups[0]).toEqual(expect.objectContaining({ readyToClose: false }))
    expect(status.diagnostics).toContainEqual(expect.objectContaining({
      code: 'group_archived_child_undeclared',
      change: 'release',
      message: expect.stringContaining('release/docs'),
    }))
    expect(checkResult.status).toBe(1)
    expect(check.diagnostics).toContainEqual(expect.objectContaining({ code: 'group_archived_child_undeclared', change: 'release' }))
    expect(doctorResult.status).toBe(1)
    expect(doctor.checks).toContainEqual(expect.objectContaining({ status: 'issue', label: 'Change Group contracts are valid' }))
    expect(closeResult.status).toBe(1)
    expect(closeResult.stderr).toContain('archived child Change is not declared by the Group Brief: release/docs')
    expect(existsSync(briefPath)).toBe(true)
  })

  it('requires the Group Brief heading to match its directory identity', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-heading-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    const mismatched = renderGroupBrief('release', ['release/api', 'release/ui']).replace('# Change Group: release', '# Change Group: other')
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), mismatched)

    const result = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    const status = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(status.diagnostics).toContainEqual(expect.objectContaining({ code: 'group_heading_mismatch', change: 'release' }))
  })

  it('includes the sibling Group Brief in grouped Change context', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-context-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui']))
    execSync(`node ${cliPath()} create release/api`, { cwd: groupDir })

    const output = execSync(`node ${cliPath()} show release/api --json`, { cwd: groupDir, encoding: 'utf-8' })
    const show = JSON.parse(output)

    expect(show.change.name).toBe('release/api')
    expect(show.contextPaths[0]).toBe('.rsp/changes/release/00-brief.md')
  })

  it('does not close a Change Group while declared children remain open', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-close-open-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui'], { complete: true }))
    execSync(`node ${cliPath()} create release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} create release/ui`, { cwd: groupDir })

    const result = spawnSync('node', [cliPath(), 'group', 'close', 'release'], { cwd: groupDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Change Group "release" is not ready to close')
    expect(result.stderr).toContain('open slices: release/api, release/ui')
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'))).toBe(true)
  })

  it('closes only the Group Brief after every declared child is archived', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-close-complete-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui'], { complete: true }))
    execSync(`node ${cliPath()} create release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} create release/ui`, { cwd: groupDir })
    execSync(`node ${cliPath()} archive release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} archive release/ui`, { cwd: groupDir })

    const before = JSON.parse(execSync(`node ${cliPath()} status --json`, { cwd: groupDir, encoding: 'utf-8' }))
    expect(before.groups[0]).toEqual(expect.objectContaining({
      name: 'release',
      readyToClose: true,
      slices: [
        expect.objectContaining({ name: 'release/api', state: 'archived' }),
        expect.objectContaining({ name: 'release/ui', state: 'archived' }),
      ],
    }))
    expect(before.nextActions).toContain('Run: rsp group close release')
    const humanBefore = execSync(`node ${cliPath()} status`, { cwd: groupDir, encoding: 'utf-8' })
    expect(humanBefore).toContain('2/2 archived')
    expect(humanBefore).toContain('ready to close')

    const output = execSync(`node ${cliPath()} group close release`, { cwd: groupDir, encoding: 'utf-8' })
    const archiveFiles = await readdir(join(groupDir, '.rsp', 'archives', 'release'))

    expect(output).toContain('Closed Change Group: release')
    expect(archiveFiles).toEqual(expect.arrayContaining([
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}_api\.md$/),
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}_ui\.md$/),
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}_brief\.md$/),
    ]))
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release'))).toBe(false)
    const after = JSON.parse(execSync(`node ${cliPath()} status --json`, { cwd: groupDir, encoding: 'utf-8' }))
    expect(after.groups).toEqual([])
  })

  it('reopens a closed Change Group before explicitly reopening one child', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-explicit-reopen-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui'], { complete: true }))
    execSync(`node ${cliPath()} create release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} create release/ui`, { cwd: groupDir })
    execSync(`node ${cliPath()} archive release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} archive release/ui`, { cwd: groupDir })
    execSync(`node ${cliPath()} group close release`, { cwd: groupDir })

    const archiveDir = join(groupDir, '.rsp', 'archives', 'release')
    const archiveFiles = await readdir(archiveDir)
    const briefArchive = archiveFiles.find(name => name.endsWith('_brief.md'))!
    const retained = new Map(await Promise.all(archiveFiles.map(async name => [name, await readFile(join(archiveDir, name), 'utf-8')] as const)))
    const output = execSync(`node ${cliPath()} group reopen release --reason "api still fails"`, { cwd: groupDir, encoding: 'utf-8' })
    const briefPath = join(groupDir, '.rsp', 'changes', 'release', '00-brief.md')

    expect(output).toContain('Reopened Change Group: release')
    expect(await readFile(briefPath, 'utf-8')).toContain(`- [ ] Resolve reopened concern from \`.rsp/archives/release/${briefArchive}\`: api still fails`)
    expect(await readdir(archiveDir)).toEqual(archiveFiles)
    for (const [name, content] of retained)
      expect(await readFile(join(archiveDir, name), 'utf-8')).toBe(content)
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release', 'api.md'))).toBe(false)
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release', 'ui.md'))).toBe(false)
    expect(existsSync(join(groupDir, '.rsp', 'focus.d', 'release'))).toBe(false)

    const reopenedStatus = JSON.parse(execSync(`node ${cliPath()} status --json`, { cwd: groupDir, encoding: 'utf-8' }))
    expect(reopenedStatus.diagnostics).not.toContainEqual(expect.objectContaining({ code: 'group_identity_reopened', change: 'release' }))
    expect(reopenedStatus.groups[0]).toEqual(expect.objectContaining({
      name: 'release',
      readyToClose: false,
      slices: [
        expect.objectContaining({ name: 'release/api', state: 'archived' }),
        expect.objectContaining({ name: 'release/ui', state: 'archived' }),
      ],
    }))

    execSync(`node ${cliPath()} reopen release/api --reason "api still fails"`, { cwd: groupDir })
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release', 'api.md'))).toBe(true)
    expect(existsSync(join(groupDir, '.rsp', 'focus.d', 'release', 'api'))).toBe(true)
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release', 'ui.md'))).toBe(false)

    expect((await readdir(join(groupDir, '.rsp', 'changes', 'release'))).some(name => name.includes('.tmp'))).toBe(false)
    const cleanupResidue = join(groupDir, '.rsp', '.group-reopen-leftover.tmp')
    await writeFile(cleanupResidue, 'partial temporary output')
    const residueStatus = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    expect(residueStatus.status).toBe(0)
    await rm(cleanupResidue)
  })

  it('requires exact Group archive selection and rejects identity mismatches before mutation', async () => {
    const groupDir = await createClosedGroupProject('rsp-group-reopen-selection-test')
    const archiveDir = join(groupDir, '.rsp', 'archives', 'release')
    const firstBrief = (await readdir(archiveDir)).find(name => name.endsWith('_brief.md'))!
    const secondBrief = firstBrief.replace('_brief.md', '_brief-2.md')
    await cp(join(archiveDir, firstBrief), join(archiveDir, secondBrief))
    const otherArchiveDir = join(groupDir, '.rsp', 'archives', 'other')
    await mkdir(otherArchiveDir, { recursive: true })
    const otherBrief = firstBrief.replace('_brief.md', '_brief.md')
    await writeFile(join(otherArchiveDir, otherBrief), renderGroupBrief('other', ['other/api', 'other/ui'], { complete: true }))

    const ambiguous = spawnSync('node', [cliPath(), 'group', 'reopen', 'release', '--reason', 'api still fails'], { cwd: groupDir, encoding: 'utf-8' })
    expect(ambiguous.status).toBe(1)
    expect(ambiguous.stderr).toContain('multiple archives match Change Group release')
    expect(ambiguous.stderr).toContain(`.rsp/archives/release/${firstBrief}`)
    expect(ambiguous.stderr).toContain(`.rsp/archives/release/${secondBrief}`)
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release'))).toBe(false)

    const mismatch = spawnSync('node', [
      cliPath(),
      'group',
      'reopen',
      'release',
      '--from',
      `.rsp/archives/other/${otherBrief}`,
      '--reason',
      'wrong group',
    ], { cwd: groupDir, encoding: 'utf-8' })
    expect(mismatch.status).toBe(1)
    expect(mismatch.stderr).toContain('selected archived Change Group belongs to other, not release')
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release'))).toBe(false)

    execFileSync('node', [
      cliPath(),
      'group',
      'reopen',
      'release',
      '--from',
      `.rsp/archives/release/${secondBrief}`,
      '--reason',
      'api still fails',
    ], { cwd: groupDir })
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'))).toBe(true)
  })

  it('fails atomically on incomplete history, malformed sections, and an open Group collision', async () => {
    const incompleteDir = await createClosedGroupProject('rsp-group-reopen-incomplete-history-test')
    await writeFile(join(incompleteDir, '.rsp', 'archives', 'bad-name.md'), '# invalid archive\n')
    const incomplete = spawnSync('node', [cliPath(), 'group', 'reopen', 'release', '--reason', 'must inspect first'], { cwd: incompleteDir, encoding: 'utf-8' })
    expect(incomplete.status).toBe(1)
    expect(incomplete.stderr).toContain('archive history inspection is incomplete')
    expect(existsSync(join(incompleteDir, '.rsp', 'changes', 'release'))).toBe(false)

    const malformedDir = await createClosedGroupProject('rsp-group-reopen-malformed-test')
    const malformedArchiveDir = join(malformedDir, '.rsp', 'archives', 'release')
    const malformedBrief = (await readdir(malformedArchiveDir)).find(name => name.endsWith('_brief.md'))!
    const malformedPath = join(malformedArchiveDir, malformedBrief)
    await writeFile(malformedPath, `${await readFile(malformedPath, 'utf-8')}\n## Completion Conditions\n- [x] duplicate\n`)
    const malformed = spawnSync('node', [cliPath(), 'group', 'reopen', 'release', '--reason', 'must remain atomic'], { cwd: malformedDir, encoding: 'utf-8' })
    expect(malformed.status).toBe(1)
    expect(malformed.stderr).toContain('must contain exactly one canonical required section: Completion Conditions')
    expect(existsSync(join(malformedDir, '.rsp', 'changes', 'release'))).toBe(false)

    const collisionDir = await createClosedGroupProject('rsp-group-reopen-collision-test')
    execSync(`node ${cliPath()} group reopen release --reason "first concern"`, { cwd: collisionDir })
    const openBrief = join(collisionDir, '.rsp', 'changes', 'release', '00-brief.md')
    const beforeCollision = await readFile(openBrief, 'utf-8')
    const collision = spawnSync('node', [cliPath(), 'group', 'reopen', 'release', '--reason', 'must not overwrite'], { cwd: collisionDir, encoding: 'utf-8' })
    expect(collision.status).toBe(1)
    expect(collision.stderr).toContain('Change Group work subtree for release must be absent or empty')
    expect(await readFile(openBrief, 'utf-8')).toBe(beforeCollision)
  })

  it('requires empty work and focus subtrees before Group reopen', async () => {
    const emptyDir = await createClosedGroupProject('rsp-group-reopen-empty-subtrees-test')
    await mkdir(join(emptyDir, '.rsp', 'changes', 'release'), { recursive: true })
    await mkdir(join(emptyDir, '.rsp', 'focus.d', 'release'), { recursive: true })
    execSync(`node ${cliPath()} group reopen release --reason "empty directories are reusable"`, { cwd: emptyDir })
    expect(existsSync(join(emptyDir, '.rsp', 'changes', 'release', '00-brief.md'))).toBe(true)

    const orphanDir = await createClosedGroupProject('rsp-group-reopen-orphan-work-test')
    await mkdir(join(orphanDir, '.rsp', 'changes', 'release'), { recursive: true })
    await writeFile(join(orphanDir, '.rsp', 'changes', 'release', 'orphan.md'), renderChange('release/orphan'))
    const orphan = spawnSync('node', [cliPath(), 'group', 'reopen', 'release', '--reason', 'must reject orphan'], { cwd: orphanDir, encoding: 'utf-8' })
    expect(orphan.status).toBe(1)
    expect(orphan.stderr).toContain('Change Group work subtree for release must be absent or empty')
    expect(existsSync(join(orphanDir, '.rsp', 'changes', 'release', '00-brief.md'))).toBe(false)

    const focusDir = await createClosedGroupProject('rsp-group-reopen-stale-focus-test')
    await mkdir(join(focusDir, '.rsp', 'focus.d', 'release'), { recursive: true })
    await writeFile(join(focusDir, '.rsp', 'focus.d', 'release', 'api'), '')
    const staleFocus = spawnSync('node', [cliPath(), 'group', 'reopen', 'release', '--reason', 'must reject focus'], { cwd: focusDir, encoding: 'utf-8' })
    expect(staleFocus.status).toBe(1)
    expect(staleFocus.stderr).toContain('Change Group focus subtree for release must be absent or empty')
    expect(existsSync(join(focusDir, '.rsp', 'changes', 'release'))).toBe(false)

    const unsupportedDir = await createClosedGroupProject('rsp-group-reopen-unsupported-entry-test')
    await mkdir(join(unsupportedDir, '.rsp', 'changes', 'release', 'nested'), { recursive: true })
    const unsupported = spawnSync('node', [cliPath(), 'group', 'reopen', 'release', '--reason', 'must reject nested entry'], { cwd: unsupportedDir, encoding: 'utf-8' })
    expect(unsupported.status).toBe(1)
    expect(unsupported.stderr).toContain('Change Group work subtree for release must be absent or empty')
    expect(existsSync(join(unsupportedDir, '.rsp', 'changes', 'release', '00-brief.md'))).toBe(false)
  })

  it('rejects replayed Group reopen evidence and accepts a fresh retained snapshot', async () => {
    const groupDir = await createClosedGroupProject('rsp-group-reopen-evidence-replay-test')
    const archiveDir = join(groupDir, '.rsp', 'archives', 'release')
    const firstBrief = (await readdir(archiveDir)).find(name => name.endsWith('_brief.md'))!
    const firstArchivePath = `.rsp/archives/release/${firstBrief}`
    execFileSync('node', [cliPath(), 'group', 'reopen', 'release', '--from', firstArchivePath, '--reason', 'api still fails'], { cwd: groupDir })

    const openBrief = join(groupDir, '.rsp', 'changes', 'release', '00-brief.md')
    await writeFile(openBrief, (await readFile(openBrief, 'utf-8')).replace(
      `- [ ] Resolve reopened concern from \`${firstArchivePath}\`: api still fails`,
      `- [x] Resolve reopened concern from \`${firstArchivePath}\`: api still fails`,
    ))
    execSync(`node ${cliPath()} group close release`, { cwd: groupDir })
    const briefArchives = (await readdir(archiveDir)).filter(name => name.includes('_brief')).sort()
    expect(briefArchives).toHaveLength(2)
    const secondBrief = briefArchives.find(name => name !== firstBrief)!
    const secondArchivePath = `.rsp/archives/release/${secondBrief}`

    await mkdir(join(groupDir, '.rsp', 'changes', 'release'), { recursive: true })
    await cp(join(archiveDir, secondBrief), openBrief)
    const copiedStatus = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    expect(copiedStatus.status).toBe(1)
    expect(JSON.parse(copiedStatus.stdout).diagnostics).toContainEqual(expect.objectContaining({ code: 'group_identity_reopened', change: 'release' }))
    await rm(join(groupDir, '.rsp', 'changes', 'release'), { recursive: true })

    const replay = spawnSync('node', [cliPath(), 'group', 'reopen', 'release', '--from', firstArchivePath, '--reason', 'api still fails'], { cwd: groupDir, encoding: 'utf-8' })
    expect(replay.status).toBe(1)
    expect(replay.stderr).toContain('reopen evidence already exists in retained Change Group history')
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release'))).toBe(false)

    execFileSync('node', [cliPath(), 'group', 'reopen', 'release', '--from', secondArchivePath, '--reason', 'api still fails'], { cwd: groupDir })
    const repeated = await readFile(openBrief, 'utf-8')
    expect(repeated).toContain(`- [ ] Resolve reopened concern from \`${secondArchivePath}\`: api still fails`)
    const repeatedStatus = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    expect(repeatedStatus.status).toBe(0)
  })

  it('requires reopen evidence to reference a retained Brief path for the current Group', async () => {
    const groupDir = await createClosedGroupProject('rsp-group-reopen-evidence-source-test')
    const releaseArchiveDir = join(groupDir, '.rsp', 'archives', 'release')
    const releaseBrief = (await readdir(releaseArchiveDir)).find(name => name.endsWith('_brief.md'))!
    const releaseArchivePath = `.rsp/archives/release/${releaseBrief}`
    const openGroupDir = join(groupDir, '.rsp', 'changes', 'release')
    const openBrief = join(openGroupDir, '00-brief.md')
    await mkdir(openGroupDir, { recursive: true })
    await cp(join(releaseArchiveDir, releaseBrief), openBrief)

    const nonexistentPath = '.rsp/archives/release/2099-01-01_brief.md'
    await writeFile(openBrief, (await readFile(openBrief, 'utf-8')).replace(
      '\n## Durable Outcomes',
      `\n- [ ] Resolve reopened concern from \`${nonexistentPath}\`: fabricated source\n\n## Durable Outcomes`,
    ))
    const nonexistentStatus = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    expect(nonexistentStatus.status).toBe(1)
    expect(JSON.parse(nonexistentStatus.stdout).diagnostics).toContainEqual(expect.objectContaining({ code: 'group_identity_reopened', change: 'release' }))

    const otherArchiveDir = join(groupDir, '.rsp', 'archives', 'other')
    await mkdir(otherArchiveDir, { recursive: true })
    await writeFile(join(otherArchiveDir, releaseBrief), renderGroupBrief('other', ['other/api', 'other/ui'], { complete: true }))
    const otherArchivePath = `.rsp/archives/other/${releaseBrief}`
    await writeFile(openBrief, (await readFile(openBrief, 'utf-8')).replace(nonexistentPath, otherArchivePath))
    const otherStatus = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    expect(otherStatus.status).toBe(1)
    expect(JSON.parse(otherStatus.stdout).diagnostics).toContainEqual(expect.objectContaining({ code: 'group_identity_reopened', change: 'release' }))

    await rm(openGroupDir, { recursive: true })
    execFileSync('node', [cliPath(), 'group', 'reopen', 'release', '--from', releaseArchivePath, '--reason', 'legitimate source'], { cwd: groupDir })
    const legitimateStatus = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    expect(legitimateStatus.status).toBe(0)
  })

  it('does not close a Change Group while a stale child focus marker remains', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-close-focus-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui'], { complete: true }))
    execSync(`node ${cliPath()} create release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} create release/ui`, { cwd: groupDir })
    execSync(`node ${cliPath()} archive release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} archive release/ui`, { cwd: groupDir })
    await mkdir(join(groupDir, '.rsp', 'focus.d', 'release'), { recursive: true })
    await writeFile(join(groupDir, '.rsp', 'focus.d', 'release', 'api'), '')

    const result = spawnSync('node', [cliPath(), 'group', 'close', 'release'], { cwd: groupDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('invalid focus for release/api')
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'))).toBe(true)
  })

  it('does not reopen an archived Change Group identity', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-reopen-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui'], { complete: true }))
    execSync(`node ${cliPath()} create release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} create release/ui`, { cwd: groupDir })
    execSync(`node ${cliPath()} archive release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} archive release/ui`, { cwd: groupDir })
    execSync(`node ${cliPath()} group close release`, { cwd: groupDir })

    const result = spawnSync('node', [cliPath(), 'group', 'create', 'release', 'Ship again'], { cwd: groupDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('archived Change Group cannot be reopened: release')
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release'))).toBe(false)

    await mkdir(join(groupDir, '.rsp', 'changes', 'release'), { recursive: true })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui'], { complete: true }))
    const statusResult = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    const status = JSON.parse(statusResult.stdout)
    expect(statusResult.status).toBe(1)
    expect(status.diagnostics).toContainEqual(expect.objectContaining({ code: 'group_identity_reopened', change: 'release' }))
  })
})

describe('archive --dry-run', () => {
  it('delegates to the canonical human readiness projection without moving the change', async () => {
    const dryRunDir = await createRspFixture('rsp-archive-dryrun-test')
    await writeFile(join(dryRunDir, '.rsp', 'changes', 'dry-run-test.md'), renderChange('dry-run-test'))

    const ready = spawnSync('node', [cliPath(), 'ready', 'dry-run-test'], { cwd: dryRunDir, encoding: 'utf-8' })
    const archive = spawnSync('node', [cliPath(), 'archive', 'dry-run-test', '--dry-run'], { cwd: dryRunDir, encoding: 'utf-8' })
    expect(ready.status, ready.stderr).toBe(0)
    expect(archive.status, archive.stderr).toBe(0)
    expect(archive.stderr).toContain('Deprecated: use `rsp ready <name>`')
    expect(archive.stdout).toBe(ready.stdout)
    expect(archive.stdout).toContain('task item(s) still incomplete')

    // change should still be there
    expect(existsSync(join(dryRunDir, '.rsp', 'changes', 'dry-run-test.md'))).toBe(true)
  })
})

describe('check --focused', () => {
  it('fails closed when the work root cannot be inspected', async () => {
    const focusedCheckDir = await createRspFixture('rsp-check-focused-invalid-root-test', ['specs', 'focus.d'])
    await writeFile(join(focusedCheckDir, '.rsp', 'changes'), 'not a directory')

    const result = spawnSync('node', [cliPath(), 'check', '--focused', '--json'], { cwd: focusedCheckDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(output.ok).toBe(false)
    expect(output.diagnostics).toContainEqual(expect.objectContaining({ code: 'invalid_work_root' }))
  })

  it('only validates focused changes', async () => {
    const focusedCheckDir = await createRspFixture('rsp-check-focused-test', ['specs', 'changes', 'focus.d'])

    // Focused change is valid
    await writeFile(join(focusedCheckDir, '.rsp', 'changes', 'focused-valid.md'), renderChange('focused-valid'))
    await writeFile(join(focusedCheckDir, '.rsp', 'focus.d', 'focused-valid'), '')

    // Unfocused change has missing Spec section
    await writeFile(join(focusedCheckDir, '.rsp', 'changes', 'unfocused-broken.md'), `---
kind: fix
---

# Change: unfocused-broken

## Proposal
- none

## Design
- not needed: trivial

## Tasks
- [ ] fix

## Verify
- none

## Blockers
- none
`)
    const unsupportedDir = join(focusedCheckDir, '.rsp', 'changes', 'unfocused', 'nested')
    await mkdir(unsupportedDir, { recursive: true })
    await writeFile(join(unsupportedDir, 'ignored.md'), renderChange('unfocused/nested/ignored'))

    const output = execSync(`node ${cliPath()} check --focused`, { cwd: focusedCheckDir, encoding: 'utf-8' })
    // focused check should pass because only the focused change is validated
    expect(output).toContain('All 1 change file(s) valid')
  })

  it('fails when focused change has errors', async () => {
    const focusedCheckDir = await createRspFixture('rsp-check-focused-fail-test', ['specs', 'changes', 'focus.d'])

    // Focused change has errors (placeholder kind)
    await writeFile(join(focusedCheckDir, '.rsp', 'changes', 'focused-broken.md'), `---
kind: "<choose: feature | fix | refactor | docs | ops | research>"
---

# Change: focused-broken

## Proposal
- none

## Spec
### ADDED
- Requirement: x

### Acceptance
#### Scenario: x
- GIVEN x
- WHEN y
- THEN z

## Design
- none

## Tasks
- [ ] task

## Verify
- none

## Blockers
- none
`)
    await writeFile(join(focusedCheckDir, '.rsp', 'focus.d', 'focused-broken'), '')

    let output = ''
    let failed = false
    try {
      output = execSync(`node ${cliPath()} check --focused`, { cwd: focusedCheckDir, encoding: 'utf-8' })
    }
    catch (error) {
      failed = true
      output = String((error as { stdout?: string }).stdout || '')
    }
    expect(failed).toBe(true)
    expect(output).toContain('kind still uses the template placeholder')
  })

  it('reports unsupported recursive work paths as structured diagnostics', async () => {
    const checkDir = await createRspFixture('rsp-check-work-depth-test')
    const nestedDir = join(checkDir, '.rsp', 'changes', 'release', 'backend')
    await mkdir(nestedDir, { recursive: true })
    await writeFile(join(nestedDir, 'api.md'), renderChange('release/backend/api'))

    const result = spawnSync('node', [cliPath(), 'check', '--json'], { cwd: checkDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    const output = JSON.parse(result.stdout)
    expect(output.diagnostics).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'unsupported_work_depth',
      change: 'release/backend',
    }))
  })
})

describe('decision record ownership', () => {
  it('initializes the default authoritative directory without fabricating a decision record', async () => {
    const initDir = join(tmpdir(), 'rsp-decisions-init-test', randomUUID())
    await mkdir(initDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: initDir })

    const decisionsDir = join(initDir, '.rsp', 'specs', 'decisions')
    expect(existsSync(decisionsDir)).toBe(true)
    expect((await readdir(decisionsDir)).filter(name => name.endsWith('.md'))).toEqual([])
  })

  it('uses one configured external authoritative directory in durable review', async () => {
    const projectDir = join(tmpdir(), 'rsp-decisions-external-test', randomUUID())
    await mkdir(projectDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: projectDir })
    await writeFile(join(projectDir, '.rsp', 'specs', 'decisions', 'old-default.md'), '# Decision: old default\n')
    await writeFile(join(projectDir, '.rsp', 'config.yaml'), 'decisions:\n  path: docs/adr\n')
    await writeFile(join(projectDir, '.rsp', 'changes', 'choose-storage.md'), renderChange('choose-storage'))

    execSync(`node ${cliPath()} update`, { cwd: projectDir })
    const output = execSync(`node ${cliPath()} show choose-storage --json`, { cwd: projectDir, encoding: 'utf-8' })
    const result = JSON.parse(output)

    expect(existsSync(join(projectDir, 'docs', 'adr'))).toBe(true)
    expect(result.durableReview.decisionRecordsPath).toBe('docs/adr')
    expect(result.contextPaths).not.toContain('.rsp/specs/decisions')
    expect(await readFile(join(projectDir, '.rsp', 'specs', '00-index.md'), 'utf-8')).not.toContain('old-default.md')

    const doctor = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: projectDir, encoding: 'utf-8' })
    const doctorResult = JSON.parse(doctor.stdout)
    expect(doctor.status).not.toBe(0)
    expect(doctorResult.checks.some((check: { message?: string }) => check.message?.includes('inactive default Decision Records: old-default.md'))).toBe(true)
  })

  it('reports traversal, absolute, and conflicting core decision paths without creating out-of-project directories', async () => {
    const escapedName = `escaped-decisions-${randomUUID()}`
    const absolutePath = join(tmpdir(), `absolute-decisions-${randomUUID()}`)
    const cases = [
      { value: `../${escapedName}`, createdPath: join(tmpdir(), 'rsp-decisions-unsafe-test', escapedName) },
      { value: absolutePath, createdPath: absolutePath },
      { value: '.rsp/changes' },
    ]

    for (const unsafe of cases) {
      const projectDir = join(tmpdir(), 'rsp-decisions-unsafe-test', randomUUID())
      await mkdir(projectDir, { recursive: true })
      execSync(`node ${cliPath()} init`, { cwd: projectDir })
      await writeFile(join(projectDir, '.rsp', 'config.yaml'), `decisions:\n  path: ${unsafe.value}\n`)

      let output = ''
      try {
        output = execSync(`node ${cliPath()} doctor --json`, { cwd: projectDir, encoding: 'utf-8' })
      }
      catch (error) {
        output = String((error as { stdout?: string }).stdout || '')
      }
      const result = JSON.parse(output)

      expect(result.ok).toBe(false)
      expect(result.checks.some((check: { message?: string }) => check.message?.includes('decisions.path'))).toBe(true)
      expect(spawnSync('node', [cliPath(), 'update'], { cwd: projectDir, encoding: 'utf-8' }).status).not.toBe(0)
      if (unsafe.createdPath)
        expect(existsSync(unsafe.createdPath)).toBe(false)
    }
  })

  it('reports current-fact and rationale decisions independently', async () => {
    const projectDir = join(tmpdir(), 'rsp-decisions-review-test', randomUUID())
    await mkdir(projectDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: projectDir })
    await writeFile(join(projectDir, '.rsp', 'changes', 'review-me.md'), renderChange('review-me'))

    const output = execSync(`node ${cliPath()} ready review-me --json`, { cwd: projectDir, encoding: 'utf-8' })
    const result = JSON.parse(output)

    expect(result.durableReview.factDecisions).toContain('No current-fact update needed')
    expect(result.durableReview.rationaleDecisions).toContain('No Decision Record needed')
    expect(result.durableReview.rationaleDecisions).toContain('Create or update a Decision Record')
    expect(result.durableReview.decisionRecordsPath).toBe('.rsp/specs/decisions')
  })

  it('rejects invalid Decision Record routing in show and ready JSON instead of falling back', async () => {
    const projectDir = join(tmpdir(), 'rsp-decisions-invalid-routing-test', randomUUID())
    await mkdir(projectDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: projectDir })
    await writeFile(join(projectDir, '.rsp', 'config.yaml'), 'decisions:\n  path: docs/adr\n  fallback: .rsp/specs/decisions\n')
    await writeFile(join(projectDir, '.rsp', 'changes', 'review-me.md'), renderChange('review-me'))

    for (const args of [['show', 'review-me', '--json'], ['ready', 'review-me', '--json']]) {
      const result = spawnSync('node', [cliPath(), ...args], { cwd: projectDir, encoding: 'utf-8' })
      const output = JSON.parse(result.stdout)

      expect(result.status).not.toBe(0)
      expect(output.ok).toBe(false)
      expect(output.error.code).toBe('invalid_config')
      expect(output.durableReview).toBeUndefined()
    }
  })

  it('refuses to create an external Decision Record directory through a symlink that escapes the Host Project', async () => {
    const projectDir = join(tmpdir(), 'rsp-decisions-symlink-test', randomUUID())
    const outsideDir = join(tmpdir(), 'rsp-decisions-symlink-outside', randomUUID())
    await mkdir(projectDir, { recursive: true })
    await mkdir(outsideDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: projectDir })
    await symlink(outsideDir, join(projectDir, 'linked-docs'))
    await writeFile(join(projectDir, '.rsp', 'config.yaml'), 'decisions:\n  path: linked-docs/adr\n')
    await writeFile(join(projectDir, '.rsp', 'changes', 'review-me.md'), renderChange('review-me'))

    const result = spawnSync('node', [cliPath(), 'update'], { cwd: projectDir, encoding: 'utf-8' })

    expect(result.status).not.toBe(0)
    expect(existsSync(join(outsideDir, 'adr'))).toBe(false)
    for (const args of [['show', 'review-me', '--json'], ['ready', 'review-me', '--json']]) {
      const routing = spawnSync('node', [cliPath(), ...args], { cwd: projectDir, encoding: 'utf-8' })
      const output = JSON.parse(routing.stdout)
      expect(routing.status).not.toBe(0)
      expect(output.error.code).toBe('invalid_decision_records_path')
    }
  })

  it('reports an unreadable authoritative Decision Record directory as unhealthy', async () => {
    const projectDir = join(tmpdir(), 'rsp-decisions-unreadable-active-test', randomUUID())
    await mkdir(projectDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: projectDir })
    const decisionsDir = join(projectDir, '.rsp', 'specs', 'decisions')
    await chmod(decisionsDir, 0o000)

    let result
    try {
      result = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: projectDir, encoding: 'utf-8' })
    }
    finally {
      await chmod(decisionsDir, 0o755)
    }
    const output = JSON.parse(result!.stdout)

    expect(result!.status).not.toBe(0)
    expect(output.checks.some((check: { message?: string }) => check.message?.includes('Decision Record directory is missing or unreadable'))).toBe(true)
  })

  it('does not report healthy when inactive default Decision Records cannot be inspected', async () => {
    const projectDir = join(tmpdir(), 'rsp-decisions-unreadable-inactive-test', randomUUID())
    await mkdir(projectDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: projectDir })
    await writeFile(join(projectDir, '.rsp', 'config.yaml'), 'decisions:\n  path: docs/adr\n')
    execSync(`node ${cliPath()} update`, { cwd: projectDir })
    const defaultDir = join(projectDir, '.rsp', 'specs', 'decisions')
    await chmod(defaultDir, 0o000)

    let result
    try {
      result = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: projectDir, encoding: 'utf-8' })
    }
    finally {
      await chmod(defaultDir, 0o755)
    }
    const output = JSON.parse(result!.stdout)

    expect(result!.status).not.toBe(0)
    expect(output.checks.some((check: { message?: string }) => check.message?.includes('unable to inspect inactive default Decision Records'))).toBe(true)
  })

  it('keeps default Decision Records out of the generated Specs index', async () => {
    const projectDir = join(tmpdir(), 'rsp-decisions-index-test', randomUUID())
    await mkdir(projectDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: projectDir })
    await writeFile(join(projectDir, '.rsp', 'specs', 'decisions', '0001-storage.md'), '# Decision: storage\n')

    execSync(`node ${cliPath()} update`, { cwd: projectDir })
    const index = await readFile(join(projectDir, '.rsp', 'specs', '00-index.md'), 'utf-8')

    expect(index).not.toContain('0001-storage.md')
    expect(index).not.toContain('decisions/')
  })

  it('does not create a Spec when invalid Decision Record configuration prevents index maintenance', async () => {
    const projectDir = join(tmpdir(), 'rsp-decisions-add-spec-preflight-test', randomUUID())
    await mkdir(projectDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: projectDir })
    await writeFile(join(projectDir, '.rsp', 'config.yaml'), 'decisions:\n  path: .rsp/changes\n')

    const result = spawnSync('node', [cliPath(), 'add', 'spec', 'should-not-exist'], { cwd: projectDir, encoding: 'utf-8' })

    expect(result.status).not.toBe(0)
    expect(existsSync(join(projectDir, '.rsp', 'specs', 'should-not-exist.md'))).toBe(false)
  })

  it('does not create Specs inside the reserved default Decision Record subtree', async () => {
    const projectDir = join(tmpdir(), 'rsp-decisions-reserved-spec-test', randomUUID())
    await mkdir(projectDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: projectDir })

    const result = spawnSync('node', [cliPath(), 'add', 'spec', 'decisions/not-a-spec'], { cwd: projectDir, encoding: 'utf-8' })

    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('reserved for Decision Records')
    expect(existsSync(join(projectDir, '.rsp', 'specs', 'decisions', 'not-a-spec.md'))).toBe(false)
  })
})
