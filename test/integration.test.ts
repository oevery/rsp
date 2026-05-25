import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync, utimesSync } from 'node:fs'
import { chmod, cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { CHANGES_DIR, clearConfigCache, RSP_DIR } from '../src/core/config.js'

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

function rulesPath(...parts: string[]) {
  return rspPath('rules', ...parts)
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
  - [ ] decide whether this change produced durable knowledge that belongs in .rsp/specs/ or .rsp/rules/
  - [ ] if yes, update the target spec or rule file before archive

## Blockers
- none
${extra}`
}

async function copyFixture(name: string): Promise<string> {
  const src = join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures', name)
  const dest = join(tmpdir(), `rsp-fixture-${name}`, randomUUID())
  await cp(src, dest, { recursive: true })
  return dest
}

beforeAll(async () => {
  execSync('pnpm build', { cwd: repoRoot, stdio: 'pipe' })
  testDir = join(tmpdir(), 'rsp-int-test', randomUUID())
  await mkdir(testDir, { recursive: true })
  origCwd = process.cwd()
  process.chdir(testDir)

  const dirs = ['rules', 'specs', 'changes', 'archives', 'focus.d']
  for (const d of dirs)
    await mkdir(rspPath(d), { recursive: true })

  await writeFile(rulesPath('rsp-rules.md'), '# RSP Rules\n')
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
  })

  it('archive warns when verify checklist or durable updates are still incomplete', () => {
    const archiveWarnDir = join(tmpdir(), 'rsp-archive-warn-test', randomUUID())
    return (async () => {
      await mkdir(join(archiveWarnDir, '.rsp', 'rules'), { recursive: true })
      await mkdir(join(archiveWarnDir, '.rsp', 'specs'), { recursive: true })
      await mkdir(join(archiveWarnDir, '.rsp', 'changes'), { recursive: true })
      await mkdir(join(archiveWarnDir, '.rsp', 'archives'), { recursive: true })
      await mkdir(join(archiveWarnDir, '.rsp', 'focus.d'), { recursive: true })
      await writeFile(join(archiveWarnDir, '.rsp', 'rules', 'rsp-rules.md'), '# RSP')
      await writeFile(join(archiveWarnDir, '.rsp', 'specs', 'design.md'), '# Design')
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
    })()
  })

  it('treats archive follow-up failures as warnings after the archive move succeeds', () => {
    const archiveWarnDir = join(tmpdir(), 'rsp-archive-followup-warning-test', randomUUID())
    return (async () => {
      await mkdir(join(archiveWarnDir, '.rsp', 'rules'), { recursive: true })
      await mkdir(join(archiveWarnDir, '.rsp', 'specs'), { recursive: true })
      await mkdir(join(archiveWarnDir, '.rsp', 'changes'), { recursive: true })
      await mkdir(join(archiveWarnDir, '.rsp', 'focus.d'), { recursive: true })
      await mkdir(join(archiveWarnDir, '.rsp', 'archives'), { recursive: true })
      await writeFile(join(archiveWarnDir, '.rsp', 'rules', 'rsp-rules.md'), '# RSP')
      await writeFile(join(archiveWarnDir, '.rsp', 'specs', 'design.md'), '# Design')
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
    })()
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
    expect(index).toContain('_Additional project-level specs beyond `design.md`._')
    expect(index).toContain('_No additional project-level specs yet._')
    expect(index).not.toContain('| design.md |')
  })

  it('lists only additional spec files after add spec', async () => {
    const specDir = join(tmpdir(), 'rsp-specs-index-add-spec-test', randomUUID())
    await mkdir(specDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: specDir })
    execSync(`node ${cliPath()} add spec shell-layout`, { cwd: specDir })

    const index = await readFile(join(specDir, '.rsp', 'specs', 'INDEX.md'), 'utf-8')
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
  it('shows focused changes separately from unfocused open changes', () => {
    const statusDir = join(tmpdir(), 'rsp-status-focused-test', randomUUID())
    return (async () => {
      await mkdir(join(statusDir, '.rsp', 'rules'), { recursive: true })
      await mkdir(join(statusDir, '.rsp', 'specs'), { recursive: true })
      await mkdir(join(statusDir, '.rsp', 'changes'), { recursive: true })
      await mkdir(join(statusDir, '.rsp', 'focus.d'), { recursive: true })
      await writeFile(join(statusDir, '.rsp', 'rules', 'rsp-rules.md'), '# rules\n')
      await writeFile(join(statusDir, '.rsp', 'specs', 'design.md'), '# design\n')
      await writeFile(join(statusDir, '.rsp', 'changes', 'focused-one.md'), renderChange('focused-one'))
      await writeFile(join(statusDir, '.rsp', 'changes', 'unfocused-one.md'), renderChange('unfocused-one'))
      await writeFile(join(statusDir, '.rsp', 'focus.d', 'focused-one'), '')

      const output = execSync(`node ${cliPath()} status`, { cwd: statusDir, encoding: 'utf-8' })
      expect(output).toContain('Focused: focused-one')
      expect(output).toContain('2 change(s), 1 focused')
    })()
  })

  it('filters blocked changes by blockers section', () => {
    const statusDir = join(tmpdir(), 'rsp-status-blocked-test', randomUUID())
    return (async () => {
      await mkdir(join(statusDir, '.rsp', 'rules'), { recursive: true })
      await mkdir(join(statusDir, '.rsp', 'specs'), { recursive: true })
      await mkdir(join(statusDir, '.rsp', 'changes'), { recursive: true })
      await writeFile(join(statusDir, '.rsp', 'rules', 'rsp-rules.md'), '# rules\n')
      await writeFile(join(statusDir, '.rsp', 'specs', 'design.md'), '# design\n')
      await writeFile(join(statusDir, '.rsp', 'changes', 'blocked-one.md'), renderChange('blocked-one').replace('## Blockers\n- none', '## Blockers\n- waiting on api'))
      await writeFile(join(statusDir, '.rsp', 'changes', 'ready-one.md'), renderChange('ready-one'))

      const output = execSync(`node ${cliPath()} status --blocked`, { cwd: statusDir, encoding: 'utf-8' })
      expect(output).toContain('blocked-one')
      expect(output).not.toContain('ready-one')
    })()
  })

  it('filters stale changes by age', () => {
    const statusDir = join(tmpdir(), 'rsp-status-stale-test', randomUUID())
    return (async () => {
      await mkdir(join(statusDir, '.rsp', 'rules'), { recursive: true })
      await mkdir(join(statusDir, '.rsp', 'specs'), { recursive: true })
      await mkdir(join(statusDir, '.rsp', 'changes'), { recursive: true })
      await writeFile(join(statusDir, '.rsp', 'rules', 'rsp-rules.md'), '# rules\n')
      await writeFile(join(statusDir, '.rsp', 'specs', 'design.md'), '# design\n')

      const stalePath = join(statusDir, '.rsp', 'changes', 'stale-one.md')
      const freshPath = join(statusDir, '.rsp', 'changes', 'fresh-one.md')
      await writeFile(stalePath, renderChange('stale-one'))
      await writeFile(freshPath, renderChange('fresh-one'))

      const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
      utimesSync(stalePath, oldDate, oldDate)

      const output = execSync(`node ${cliPath()} status --stale 14`, { cwd: statusDir, encoding: 'utf-8' })
      expect(output).toContain('stale-one')
      expect(output).not.toContain('fresh-one')
    })()
  })

  it('treats recently updated older files as fresh', () => {
    const statusDir = join(tmpdir(), 'rsp-status-revived-test', randomUUID())
    return (async () => {
      await mkdir(join(statusDir, '.rsp', 'rules'), { recursive: true })
      await mkdir(join(statusDir, '.rsp', 'specs'), { recursive: true })
      await mkdir(join(statusDir, '.rsp', 'changes'), { recursive: true })
      await writeFile(join(statusDir, '.rsp', 'rules', 'rsp-rules.md'), '# rules\n')
      await writeFile(join(statusDir, '.rsp', 'specs', 'design.md'), '# design\n')

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
    })()
  })

  it('prints machine-readable JSON for status', () => {
    const statusDir = join(tmpdir(), 'rsp-status-json-test', randomUUID())
    return (async () => {
      await mkdir(join(statusDir, '.rsp', 'rules'), { recursive: true })
      await mkdir(join(statusDir, '.rsp', 'specs'), { recursive: true })
      await mkdir(join(statusDir, '.rsp', 'changes'), { recursive: true })
      await mkdir(join(statusDir, '.rsp', 'focus.d'), { recursive: true })
      await writeFile(join(statusDir, '.rsp', 'rules', 'rsp-rules.md'), '# rules\n')
      await writeFile(join(statusDir, '.rsp', 'specs', 'design.md'), '# design\n')
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
    })()
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

  it('prints verbose diagnostics for malformed frontmatter in status', () => {
    const statusDir = join(tmpdir(), 'rsp-status-verbose-test', randomUUID())
    return (async () => {
      await mkdir(join(statusDir, '.rsp', 'rules'), { recursive: true })
      await mkdir(join(statusDir, '.rsp', 'specs'), { recursive: true })
      await mkdir(join(statusDir, '.rsp', 'changes'), { recursive: true })
      await writeFile(join(statusDir, '.rsp', 'rules', 'rsp-rules.md'), '# rules\n')
      await writeFile(join(statusDir, '.rsp', 'specs', 'design.md'), '# design\n')
      await writeFile(join(statusDir, '.rsp', 'changes', 'broken.md'), `---\nkind: [broken\n---\n\n# Change: broken\n`)

      const output = execSync(`node ${cliPath()} status --verbose 2>&1`, { cwd: statusDir, encoding: 'utf-8', shell: '/bin/zsh' })
      expect(output).toContain('[verbose] parseFrontmatter')
      expect(output).toContain('RSP status')
    })()
  })
})

describe('init and doctor', () => {
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
    const output = execSync(`node ${cliPath()} doctor --json`, { cwd: doctorDir, encoding: 'utf-8' })
    const result = JSON.parse(output)

    expect(result.command).toBe('doctor')
    expect(result.ok).toBe(true)
    expect(result).toHaveProperty('runtime')
    expect(result).toHaveProperty('summary')
    expect(result.summary.issues).toBe(0)
    expect(result.checks.some((check: { label: string }) => check.label === '.rsp exists')).toBe(true)
  })

  it('prints the resulting AGENTS.md content in print mode', async () => {
    const initDir = join(tmpdir(), 'rsp-init-print-test', randomUUID())
    await mkdir(initDir, { recursive: true })

    const output = execSync(`node ${cliPath()} init --agents-mode print`, { cwd: initDir, encoding: 'utf-8' })
    const agents = await readFile(join(initDir, 'AGENTS.md'), 'utf-8')

    expect(agents).toContain('<!-- rsp:begin -->')
    expect(agents).toContain('RSP keeps durable rules, specs, and current work under `.rsp/`.')
    expect(agents).toContain('Treat AGENTS.md as navigation only; keep durable rules and design in `.rsp/`.')
    expect(agents).toContain('1. .rsp/rules/rsp-rules.md')
    expect(agents).toContain('2. .rsp/focus.d/')
    expect(agents).toContain('3. matching .rsp/changes/*.md for the focused entries')
    expect(agents).toContain('4. .rsp/specs/design.md')
    expect(agents).toContain('5. .rsp/specs/INDEX.md')
    expect(agents).toContain('6. only the relevant additional .rsp/rules/*.md and .rsp/specs/*.md files')
    expect(agents).toContain('If `.rsp/focus.d/` is empty, ask what to work on or suggest `npx -y @oevery/rsp create <name>`.')
    expect(agents).toContain('If your agent supports Agent Skills, load `rsp` for setup, repair, and durable-decision tasks.')
    expect(output).toContain('## RSP Entry')
  })

  it('reports missing AGENTS.md as an issue', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-missing-agents-test', randomUUID())
    await mkdir(join(doctorDir, RSP_DIR, 'rules'), { recursive: true })
    await mkdir(join(doctorDir, RSP_DIR, 'specs'), { recursive: true })
    await mkdir(join(doctorDir, RSP_DIR, 'archives'), { recursive: true })
    await writeFile(join(doctorDir, RSP_DIR, 'rules', 'rsp-rules.md'), '# rules\n')
    await writeFile(join(doctorDir, RSP_DIR, 'specs', 'design.md'), '# design\n')
    await writeFile(join(doctorDir, RSP_DIR, 'specs', 'INDEX.md'), '_Auto-generated by `rsp update`._\n')
    await writeFile(join(doctorDir, RSP_DIR, 'archives', 'INDEX.md'), '_Auto-generated by `rsp update`._\n')

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

  it('restores missing rsp-rules.md during update', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-missing-rules-test', randomUUID())
    await mkdir(updateDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: updateDir })
    await rm(join(updateDir, '.rsp', 'rules', 'rsp-rules.md'))

    execSync(`node ${cliPath()} update`, { cwd: updateDir })
    const rules = await readFile(join(updateDir, '.rsp', 'rules', 'rsp-rules.md'), 'utf-8')
    expect(rules).toContain('This file is the canonical RSP rules source.')
  })

  it('restores missing rules directory during update', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-missing-rules-dir-test', randomUUID())
    await mkdir(updateDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: updateDir })
    await rm(join(updateDir, '.rsp', 'rules'), { recursive: true, force: true })

    execSync(`node ${cliPath()} update`, { cwd: updateDir })
    const rules = await readFile(join(updateDir, '.rsp', 'rules', 'rsp-rules.md'), 'utf-8')
    expect(rules).toContain('This file is the canonical RSP rules source.')
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
    await mkdir(join(brokenDir, RSP_DIR, 'rules'), { recursive: true })
    await mkdir(join(brokenDir, RSP_DIR, 'specs'), { recursive: true })
    await mkdir(join(brokenDir, RSP_DIR, 'archives'), { recursive: true })
    await writeFile(join(brokenDir, RSP_DIR, 'rules', 'rsp-rules.md'), '# rules\n')
    await writeFile(join(brokenDir, RSP_DIR, 'specs', 'design.md'), '# design\n')
    await writeFile(join(brokenDir, RSP_DIR, 'specs', 'INDEX.md'), '_Auto-generated by `rsp update`._\n')
    await writeFile(join(brokenDir, RSP_DIR, 'archives', 'INDEX.md'), '_Auto-generated by `rsp update`._\n')
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
    execSync(`node ${cliPath()} add rules project-rules`, { cwd: fixtureDir })
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
