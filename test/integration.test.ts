import { execSync, spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync, utimesSync } from 'node:fs'
import { chmod, cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
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
    expect(content).toContain('- Summary: A test change')
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
    await createChange('auth/login', 'Login change')

    expect(existsSync(changesPath('auth', 'login.md'))).toBe(true)
    expect(existsSync(focusDPath('auth', 'login'))).toBe(true)
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
      expect(content).toContain('- Summary: Fix tiny issue')
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

  it('ignores legacy required_sections config overrides', () => {
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

      let output = ''
      let failed = false
      try {
        output = execSync(`node ${cliPath()} check`, { cwd: configDir, encoding: 'utf-8' })
      }
      catch (error) {
        failed = true
        output = String((error as { stdout?: string }).stdout || '')
      }

      expect(failed).toBe(true)
      expect(output).toContain('missing "## Spec" section')
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

  it('prints status JSON next actions when no focus exists', async () => {
    const statusDir = await createRspFixture('rsp-status-json-no-focus-test')
    await writeFile(join(statusDir, '.rsp', 'changes', 'unfocused-json.md'), renderChange('unfocused-json'))

    const output = execSync(`node ${cliPath()} status --json`, { cwd: statusDir, encoding: 'utf-8' })
    const result = JSON.parse(output)
    expect(result.focused).toEqual([])
    expect(result.nextActions).toContain('Run: rsp focus unfocused-json')
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
    expect(agents).toContain('4. `.rsp/focus.d/` and the explicitly selected focused Change.')
    expect(agents).toContain('5. Only the relevant `.rsp/specs/` files.')
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
    expect(result.durableReview.decisions).toContain('No durable update needed')
    expect(result.durableReview.candidateTargets).toContain('.rsp/specs/design.md')
    expect(result.durableReview.candidateTargets).not.toContain('.rsp/specs/INDEX.md')
    expect(result.durableReview.candidateTargets).not.toContain('.rsp/rules/rsp-rules.md')
    expect(result.durableReview.note).toContain('never merges delta specs automatically')
    expect(Array.isArray(result.warnings)).toBe(true)
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
    expect(output).toContain('Decision options:')
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
    expect(result.durableReview.candidateTargets).toEqual(result.contextPaths)
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
})
