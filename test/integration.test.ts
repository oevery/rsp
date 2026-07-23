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

  it('creates a kind-aware docs template when requested', () => {
    const createDir = join(tmpdir(), 'rsp-create-kind-test', randomUUID())
    return (async () => {
      await mkdir(createDir, { recursive: true })
      execSync(`node ${cliPath()} init`, { cwd: createDir })
      execSync(`node ${cliPath()} create docs-guide --kind docs "Improve docs"`, { cwd: createDir })

      const content = await readFile(join(createDir, '.rsp', 'changes', 'docs-guide.md'), 'utf-8')
      expect(content).toContain('kind: "docs"')
      expect(content).toContain('Requirement: documentation accuracy')
      expect(content).toContain('reader follows the updated guidance')
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
      expect(content).toContain('- [ ] Implement the small change')
      expect(content).not.toContain('Finalize the proposal, spec, and design details')
    })()
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

    const archiveFiles = (await readdir(archivePath())).filter(f => f !== 'INDEX.md')
    expect(archiveFiles.some(f => f.endsWith('_test-change.md'))).toBe(true)

    const archiveIndex = await readFile(archivePath('INDEX.md'), 'utf-8')
    const metadata = parseFrontmatter(archiveIndex)
    expect(metadata?.kind).toBe('generated-index')
    expect(metadata?.index_type).toBe('archives')
    expect(metadata?.entry_count).toBe(1)
    expect(archiveIndex).toContain('| Date | Change | Kind | Summary |')
    expect(archiveIndex).toContain('| test-change | <choose: feature \\| fix \\| refactor \\| docs \\| ops \\| research> | A test change |')
    expect(archiveIndex).not.toContain('_Auto-generated by `rsp update`._')
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
    await writeFile(join(archiveWarnDir, '.rsp', 'archives', 'INDEX.md'), '# Archive Index\n')
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
    for (const command of ['status', 'show', 'ready', 'check', 'doctor']) {
      const output = execFileSync('node', [cliPath(), command, '--help'], { encoding: 'utf-8' })
      expect(output).toContain('--compact')
    }

    const createHelp = execFileSync('node', [cliPath(), 'create', '--help'], { encoding: 'utf-8' })
    expect(createHelp).not.toContain('--compact')
  })
})

describe('specs index behavior', () => {
  it('keeps design.md out of the generated specs index on init', async () => {
    const initDir = join(tmpdir(), 'rsp-specs-index-init-test', randomUUID())
    await mkdir(initDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: initDir })

    const index = await readFile(join(initDir, '.rsp', 'specs', 'INDEX.md'), 'utf-8')
    const metadata = parseFrontmatter(index)
    expect(metadata?.kind).toBe('generated-index')
    expect(metadata?.index_type).toBe('specs')
    expect(metadata?.entry_count).toBe(0)
    expect(index).toContain('_Additional project-level specs beyond `design.md`._')
    expect(index).toContain('_No additional project-level specs yet._')
    expect(index).not.toContain('_Auto-generated by `rsp update`._')
    expect(index).not.toContain('| design.md |')
  })

  it('lists only additional spec files after add spec', async () => {
    const specDir = join(tmpdir(), 'rsp-specs-index-add-spec-test', randomUUID())
    await mkdir(specDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: specDir })
    execSync(`node ${cliPath()} add spec shell-layout`, { cwd: specDir })

    const index = await readFile(join(specDir, '.rsp', 'specs', 'INDEX.md'), 'utf-8')
    const metadata = parseFrontmatter(index)
    expect(metadata?.kind).toBe('generated-index')
    expect(metadata?.index_type).toBe('specs')
    expect(metadata?.entry_count).toBe(1)
    expect(index).toContain('| shell-layout.md |')
    expect(index).not.toContain('| design.md |')
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
    const index = await readFile(join(specDir, '.rsp', 'specs', 'INDEX.md'), 'utf-8')

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
    expect(human).toMatch(/◎ implement\s+selected · waiting/)
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
    expect(status).toMatch(/◎ implement\s+selected · ready/)
    expect(status).toMatch(/└── ✓ research\s+prerequisite · archived — needs the accepted research model/)
    expect(status).toContain('Next action: implement')
    expect(show.change.blockers).toBe(false)
    expect(show.change.readiness.activeBlockers).toBe(false)
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
    expect(archiveResult.status).toBe(1)
    expect(`${archiveResult.stdout}${archiveResult.stderr}`).toContain('archive root must be a real directory')
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
    await writeFile(join(doctorDir, '.rsp', 'specs', 'INDEX.md'), '# broken index\n')

    const output = execSync(`node ${cliPath()} doctor --fix --json`, { cwd: doctorDir, encoding: 'utf-8' })
    const result = JSON.parse(output)
    const agents = await readFile(join(doctorDir, 'AGENTS.md'), 'utf-8')
    const specsIndex = await readFile(join(doctorDir, '.rsp', 'specs', 'INDEX.md'), 'utf-8')

    expect(result.command).toBe('doctor')
    expect(result.ok).toBe(true)
    expect(result.fixed).toContain('AGENTS.md managed block refreshed')
    expect(result.fixed).toContain('generated indexes rebuilt')
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

  it('flags generated indexes with missing or mismatched metadata', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-generated-index-metadata-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await writeFile(join(doctorDir, RSP_DIR, 'specs', 'INDEX.md'), '# Specs Index\n')
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
      expect.objectContaining({ status: 'issue', label: 'specs/INDEX.md has generated-index metadata' }),
      expect.objectContaining({ status: 'issue', label: 'archives/INDEX.md has generated-index metadata' }),
    ]))
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
    expect(agents).toContain('3. The `rsp` skill; if unavailable, read `.rsp/rsp-rules.md` as the fallback protocol.')
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

  it('does not rebuild an archive index through a symlinked root', async () => {
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
    expect(output).toContain('npx skills add oevery/rsp')
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
    expect(output).toContain('npx skills add oevery/rsp')
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

    expect(dryRun.status).toBe(1)
    expect(dryRun.stderr).toContain('archive path must be a real directory')
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
    expect(result.durableReview.factCandidateTargets).not.toContain('.rsp/specs/INDEX.md')
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
    expect(result.contextPaths).not.toContain('.rsp/specs/INDEX.md')
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
  it('previews archive readiness without moving the change', async () => {
    const dryRunDir = await createRspFixture('rsp-archive-dryrun-test')
    await writeFile(join(dryRunDir, '.rsp', 'changes', 'dry-run-test.md'), renderChange('dry-run-test'))

    const output = execSync(`node ${cliPath()} archive dry-run-test --dry-run`, { cwd: dryRunDir, encoding: 'utf-8' })
    expect(output).toContain('Archive dry-run')
    expect(output).toContain('task item(s) still incomplete')

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
    expect(await readFile(join(projectDir, '.rsp', 'specs', 'INDEX.md'), 'utf-8')).not.toContain('old-default.md')

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
    const index = await readFile(join(projectDir, '.rsp', 'specs', 'INDEX.md'), 'utf-8')

    expect(index).not.toContain('0001-storage.md')
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
