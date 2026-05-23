import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { clearConfigCache, RSP_DIR } from '../src/core/config.js'

let testDir: string
let origCwd: string

function rspPath(...parts: string[]) {
  return join(testDir, RSP_DIR, ...parts)
}

function featuresPath(...parts: string[]) {
  return rspPath('features', ...parts)
}

function activeDPath(...parts: string[]) {
  return rspPath('active.d', ...parts)
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

beforeAll(async () => {
  testDir = join(tmpdir(), 'rsp-int-test', randomUUID())
  await mkdir(testDir, { recursive: true })
  origCwd = process.cwd()
  process.chdir(testDir)

  const dirs = ['rules', 'specs', 'features', 'archives', 'active.d']
  for (const d of dirs)
    await mkdir(rspPath(d), { recursive: true })
})

afterAll(() => {
  process.chdir(origCwd)
  clearConfigCache()
})

async function copyFixture(name: string): Promise<string> {
  const src = join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures', name)
  const dest = join(tmpdir(), `rsp-fixture-${name}`, randomUUID())
  await cp(src, dest, { recursive: true })
  return dest
}

describe('full workflow integration', () => {
  it('creates a feature file', async () => {
    const { newFeature } = await import('../src/commands/new-feature.js')
    await newFeature('test-feature', 'A test feature')

    const content = await readFile(featuresPath('test-feature.md'), 'utf-8')
    expect(content).toContain('# Feature: test-feature')
    expect(content).toContain('- Summary: A test feature')

    expect(existsSync(activeDPath('test-feature'))).toBe(true)
  })

  it('creates a feature with subdirectory', async () => {
    const { newFeature } = await import('../src/commands/new-feature.js')
    await newFeature('auth/login', 'Login feature')

    expect(existsSync(featuresPath('auth', 'login.md'))).toBe(true)
    expect(existsSync(activeDPath('auth', 'login'))).toBe(true)
  })

  it('lists feature with status', async () => {
    const { showStatus } = await import('../src/commands/status.js')
    await expect(showStatus()).resolves.toBeUndefined()
  })

  it('passes check on valid features', async () => {
    const { runCheck } = await import('../src/commands/check.js')
    await expect(runCheck()).resolves.toBeDefined()
  })

  it('closes a feature', async () => {
    const { closeFeature } = await import('../src/commands/close-feature.js')
    await closeFeature('test-feature')

    expect(existsSync(featuresPath('test-feature.md'))).toBe(false)
    expect(existsSync(activeDPath('test-feature'))).toBe(false)

    const archiveFiles = await readdirMinusIndex(archivePath())
    expect(archiveFiles.some(f => f.endsWith('_test-feature.md'))).toBe(true)
  })

  it('closes a subdirectory feature', async () => {
    const { closeFeature } = await import('../src/commands/close-feature.js')
    await closeFeature('auth/login')

    expect(existsSync(featuresPath('auth', 'login.md'))).toBe(false)
    expect(existsSync(activeDPath('auth', 'login'))).toBe(false)
  })

  it('cleans up empty active.d/ parent after closing subdirectory feature', async () => {
    // auth/login was closed above; auth/ dir should be removed
    expect(existsSync(activeDPath('auth'))).toBe(false)
  })

  it('status shows no active features after all closed', async () => {
    const { showStatus } = await import('../src/commands/status.js')
    await expect(showStatus()).resolves.toBeUndefined()
  })

  it('refuses to close a feature that still has dependents', async () => {
    const dependentDir = join(tmpdir(), 'rsp-close-dependent-test', randomUUID())
    await mkdir(join(dependentDir, '.rsp', 'features'), { recursive: true })
    await mkdir(join(dependentDir, '.rsp', 'active.d'), { recursive: true })
    await mkdir(join(dependentDir, '.rsp', 'archives'), { recursive: true })
    await writeFile(join(dependentDir, '.rsp', 'archives', 'INDEX.md'), '# Archive Index\n')
    await writeFile(join(dependentDir, '.rsp', 'features', 'base.md'), `---
status: draft
priority: medium
tags:
---
# Feature: base

## Spec
- Summary: Base feature

## Plan
- [ ] Keep it open
`)
    await writeFile(join(dependentDir, '.rsp', 'features', 'consumer.md'), `---
status: draft
priority: medium
tags:
depends-on:
  - base
---
# Feature: consumer

## Spec
- Summary: Depends on base

## Plan
- [ ] Use base
`)

    const cliPath = join(fileURLToPath(new URL('..', import.meta.url)), 'dist', 'cli.mjs')
    let output = ''
    try {
      execSync(`node ${cliPath} close base`, { cwd: dependentDir, encoding: 'utf-8', stdio: 'pipe' })
    }
    catch (error) {
      const execError = error as { stdout?: string, stderr?: string }
      output = `${execError.stdout || ''}${execError.stderr || ''}`
    }

    expect(output).toContain('cannot close "base" because it is still referenced by: consumer')
    expect(existsSync(join(dependentDir, '.rsp', 'features', 'base.md'))).toBe(true)
    expect(existsSync(join(dependentDir, '.rsp', 'archives', `${new Date().toISOString().slice(0, 10)}_base.md`))).toBe(false)
  })
})

describe('check detects issues', () => {
  beforeAll(async () => {
    await writeFile(featuresPath('orphan.md'), `---
status: draft
priority: medium
tags:
depends-on:
  - nonexistent-feature
---
# Feature: orphan

## Spec
- Summary: Orphan feature
- Requirements:
  - [ ] nothing

## Plan
- [ ] Phase 1:
  - [ ] nothing
`)
  })

  it('reports missing dependency', async () => {
    const { runCheck } = await import('../src/commands/check.js')
    const errors = await runCheck()
    expect(errors).toBeGreaterThan(0)
  })

  it('detects circular dependency via check', async () => {
    await writeFile(featuresPath('cycle-a.md'), `---
status: draft
priority: medium
tags:
depends-on:
  - cycle-b
---
# Feature: cycle-a

## Spec
- Summary: Cycle test A

## Plan
- [ ] Phase 1:
  - [ ] nothing
`)
    await writeFile(featuresPath('cycle-b.md'), `---
status: draft
priority: medium
tags:
depends-on:
  - cycle-a
---
# Feature: cycle-b

## Spec
- Summary: Cycle test B

## Plan
- [ ] Phase 1:
  - [ ] nothing
`)
    const { runCheck } = await import('../src/commands/check.js')
    const errors = await runCheck()
    expect(errors).toBeGreaterThan(1)
  })

  it('accepts a valid feature file with CRLF frontmatter', async () => {
    const windowsDir = join(tmpdir(), 'rsp-crlf-check-test', randomUUID())
    await mkdir(join(windowsDir, '.rsp', 'features'), { recursive: true })
    await writeFile(join(windowsDir, '.rsp', 'features', 'windows-style.md'), '---\r\nstatus: draft\r\npriority: medium\r\ntags:\r\n---\r\n# Feature: windows-style\r\n\r\n## Spec\r\n- Summary: Windows line endings\r\n\r\n## Plan\r\n- [ ] Keep parsing\r\n')

    const cwd = process.cwd()
    process.chdir(windowsDir)
    clearConfigCache()

    try {
      const { runCheck } = await import('../src/commands/check.js')
      const errors = await runCheck()
      expect(errors).toBe(0)
    }
    finally {
      process.chdir(cwd)
      clearConfigCache()
    }
  })
})

describe('archive index', () => {
  beforeAll(async () => {
    const archDir = archivePath()
    const content = `---
status: done
priority: low
tags:
---
# Feature: archived-feat

## Spec
- Summary: An already archived feature
- Requirements:
  - [x] done

## Plan
- [x] done`
    await writeFile(join(archDir, '2026-01-15_archived-feat.md'), content)
  })

  it('builds archive index', async () => {
    const { buildArchiveIndex } = await import('../src/commands/archive-index.js')
    await buildArchiveIndex({ acquireLock: false })

    const indexPath = archivePath('INDEX.md')
    expect(existsSync(indexPath)).toBe(true)
    const content = await readFile(indexPath, 'utf-8')
    expect(content).toContain('archived-feat')
    expect(content).toContain('2026-01-15')
  })
})

describe('close keeps project specs untouched', () => {
  it('does not append archived feature entries to specs/INDEX.md', async () => {
    const { newFeature } = await import('../src/commands/new-feature.js')
    const { closeFeature } = await import('../src/commands/close-feature.js')

    await writeFile(specPath('INDEX.md'), '# Specs Index\n\n_Project-level specs and design notes._\n')
    await newFeature('spec-test', 'Feature for project specs')
    await closeFeature('spec-test')

    const specIndexPath = specPath('INDEX.md')
    expect(existsSync(specIndexPath)).toBe(true)
    const content = await readFile(specIndexPath, 'utf-8')
    expect(content).not.toContain('spec-test')
  })
})

describe('specs index', () => {
  it('builds a lightweight specs index', async () => {
    await writeFile(specPath('design.md'), `# Project Design: Sample Project

## Overview
- System architecture overview
`)
    await writeFile(specPath('domain.md'), `---
summary: Domain model reference
---
# Domain Model

## Entities
- User
`)

    const { buildSpecsIndex } = await import('../src/commands/specs-index.js')
    await buildSpecsIndex({ acquireLock: false })

    const content = await readFile(specPath('INDEX.md'), 'utf-8')
    expect(content).toContain('| File | Title | Summary |')
    expect(content).toContain('| design.md | Project Design: Sample Project | System architecture overview |')
    expect(content).toContain('| domain.md | Domain Model | Domain model reference |')
  })

  it('rebuilds specs index from the CLI', async () => {
    const cliPath = join(fileURLToPath(new URL('..', import.meta.url)), 'dist', 'cli.mjs')
    execSync(`node ${cliPath} specs-index`, { cwd: testDir })

    const content = await readFile(specPath('INDEX.md'), 'utf-8')
    expect(content).toContain('| File | Title | Summary |')
  })
})

describe('add commands', () => {
  it('adds a rules file via CLI', async () => {
    const cliPath = join(fileURLToPath(new URL('..', import.meta.url)), 'dist', 'cli.mjs')
    execSync(`node ${cliPath} add rules team-conventions`, { cwd: testDir })

    const content = await readFile(rulesPath('team-conventions.md'), 'utf-8')
    expect(content).toContain('# Team Conventions')
  })

  it('adds project-rules via unified add rules command', async () => {
    const cliPath = join(fileURLToPath(new URL('..', import.meta.url)), 'dist', 'cli.mjs')
    execSync(`node ${cliPath} add rules project-rules`, { cwd: testDir })

    const content = await readFile(rulesPath('project-rules.md'), 'utf-8')
    expect(content).toContain('# Project Rules')
  })

  it('uses detected project name when adding design spec', async () => {
    const designDir = join(tmpdir(), 'rsp-add-design-test', randomUUID())
    await mkdir(join(designDir, '.rsp', 'specs'), { recursive: true })
    await writeFile(join(designDir, 'package.json'), '{"name":"design-target"}\n')

    const cliPath = join(fileURLToPath(new URL('..', import.meta.url)), 'dist', 'cli.mjs')
    execSync(`node ${cliPath} add spec design`, { cwd: designDir })

    const content = await readFile(join(designDir, '.rsp', 'specs', 'design.md'), 'utf-8')
    expect(content).toContain('# Project Design: design-target')
  })

  it('adds a spec file and rebuilds specs index', async () => {
    const cliPath = join(fileURLToPath(new URL('..', import.meta.url)), 'dist', 'cli.mjs')
    execSync(`node ${cliPath} add spec domain-model`, { cwd: testDir })

    const specContent = await readFile(specPath('domain-model.md'), 'utf-8')
    expect(specContent).toContain('# Domain Model')

    const indexContent = await readFile(specPath('INDEX.md'), 'utf-8')
    expect(indexContent).toContain('domain-model.md')
    expect(indexContent).toContain('Domain Model')
  })
})

describe('deps command', () => {
  it('shows dependencies', async () => {
    const { showDependencies } = await import('../src/commands/deps.js')
    await expect(showDependencies()).resolves.toBeUndefined()
  })

  it('shows mermaid output', async () => {
    const { showDependencies } = await import('../src/commands/deps.js')
    await expect(showDependencies(true)).resolves.toBeUndefined()
  })
})

describe('init scaffolding', () => {
  let initDir: string
  let orig: string
  let initDir2: string

  beforeAll(async () => {
    initDir = join(tmpdir(), 'rsp-gitignore-test', randomUUID())
    await mkdir(initDir, { recursive: true })
    initDir2 = join(tmpdir(), 'rsp-init-options-test', randomUUID())
    await mkdir(initDir2, { recursive: true })
    orig = process.cwd()
    process.chdir(initDir)
    clearConfigCache()
  })

  afterAll(() => {
    process.chdir(orig)
    clearConfigCache()
  })

  it('creates init defaults when initialized', async () => {
    const cliPath = join(fileURLToPath(new URL('..', import.meta.url)), 'dist', 'cli.mjs')
    execSync(`node ${cliPath} init`, { cwd: initDir })

    const gitignorePath = join(initDir, RSP_DIR, '.gitignore')
    expect(existsSync(gitignorePath)).toBe(true)

    const content = await readFile(gitignorePath, 'utf-8')
    expect(content).toContain('.lock')

    expect(existsSync(join(initDir, RSP_DIR, 'active.d'))).toBe(true)
    expect(existsSync(join(initDir, RSP_DIR, 'archives', 'INDEX.md'))).toBe(true)
    expect(existsSync(join(initDir, RSP_DIR, 'specs', 'design.md'))).toBe(true)
    expect(existsSync(join(initDir, RSP_DIR, 'specs', 'INDEX.md'))).toBe(true)
    expect(existsSync(join(initDir, RSP_DIR, 'features', '.gitkeep'))).toBe(true)
    expect(existsSync(join(initDir, RSP_DIR, 'active.d', '.gitkeep'))).toBe(true)
    expect(existsSync(join(initDir, RSP_DIR, 'rules', 'project-rules.md'))).toBe(false)

    const specsIndexContent = await readFile(join(initDir, RSP_DIR, 'specs', 'INDEX.md'), 'utf-8')
    expect(specsIndexContent).toContain('| File | Title | Summary |')
    expect(specsIndexContent).toContain('design.md')
    expect(specsIndexContent).toContain('Project Design:')

    const designContent = await readFile(join(initDir, RSP_DIR, 'specs', 'design.md'), 'utf-8')
    expect(designContent).toContain('## Purpose')
    expect(designContent).toContain('## Scope')
    expect(designContent).toContain('## Structure')
    expect(designContent).toContain('## Constraints')
  })

  it('creates optional project-rules when requested', async () => {
    const cliPath = join(fileURLToPath(new URL('..', import.meta.url)), 'dist', 'cli.mjs')
    execSync(`node ${cliPath} init --with-project-rules`, { cwd: initDir2 })

    expect(existsSync(join(initDir2, RSP_DIR, 'rules', 'project-rules.md'))).toBe(true)
  })

  it('can skip AGENTS.md updates', async () => {
    const skipDir = join(tmpdir(), 'rsp-init-skip-test', randomUUID())
    await mkdir(skipDir, { recursive: true })
    const cliPath = join(fileURLToPath(new URL('..', import.meta.url)), 'dist', 'cli.mjs')
    execSync(`node ${cliPath} init --agents-mode skip`, { cwd: skipDir })

    expect(existsSync(join(skipDir, 'AGENTS.md'))).toBe(false)
  })

  it('can print the managed AGENTS block', async () => {
    const printDir = join(tmpdir(), 'rsp-init-print-test', randomUUID())
    await mkdir(printDir, { recursive: true })
    const cliPath = join(fileURLToPath(new URL('..', import.meta.url)), 'dist', 'cli.mjs')
    const output = execSync(`node ${cliPath} init --agents-mode print`, { cwd: printDir, encoding: 'utf-8' })

    expect(output).toContain('<!-- rsp:begin -->')
    expect(output).toContain('## RSP Entry')
  })

  it('updates existing AGENTS.md via managed block only', async () => {
    const managedDir = join(tmpdir(), 'rsp-init-managed-test', randomUUID())
    await mkdir(managedDir, { recursive: true })
    await writeFile(join(managedDir, 'AGENTS.md'), '# Custom Project\n\n## Notes\nExisting content\n')

    const cliPath = join(fileURLToPath(new URL('..', import.meta.url)), 'dist', 'cli.mjs')
    execSync(`node ${cliPath} init`, { cwd: managedDir })

    const agents = await readFile(join(managedDir, 'AGENTS.md'), 'utf-8')
    expect(agents).toContain('<!-- rsp:begin -->')
    expect(agents).toContain('## RSP Entry')
    expect(agents).toContain('## Notes')
    expect(agents).toContain('Existing content')
  })
})

describe('doctor command', () => {
  it('reports a healthy setup', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })
    const cliPath = join(fileURLToPath(new URL('..', import.meta.url)), 'dist', 'cli.mjs')

    execSync(`node ${cliPath} init`, { cwd: doctorDir })
    const output = execSync(`node ${cliPath} doctor`, { cwd: doctorDir, encoding: 'utf-8' })
    expect(output).toContain('RSP doctor')
    expect(output).toContain('RSP setup looks healthy')
  })

  it('reports AGENTS integration issues', async () => {
    const brokenDir = join(tmpdir(), 'rsp-doctor-broken-test', randomUUID())
    await mkdir(join(brokenDir, RSP_DIR, 'rules'), { recursive: true })
    await mkdir(join(brokenDir, RSP_DIR, 'specs'), { recursive: true })
    await mkdir(join(brokenDir, RSP_DIR, 'archives'), { recursive: true })
    await writeFile(join(brokenDir, RSP_DIR, 'rules', 'rsp-rules.md'), '# rules\n')
    await writeFile(join(brokenDir, RSP_DIR, 'specs', 'design.md'), '# design\n')
    await writeFile(join(brokenDir, RSP_DIR, 'specs', 'INDEX.md'), '# index\n')
    await writeFile(join(brokenDir, RSP_DIR, 'archives', 'INDEX.md'), '# archive\n')
    await writeFile(join(brokenDir, 'AGENTS.md'), '# Manual AGENTS\n')

    const cliPath = join(fileURLToPath(new URL('..', import.meta.url)), 'dist', 'cli.mjs')
    let output = ''
    try {
      output = execSync(`node ${cliPath} doctor`, { cwd: brokenDir, encoding: 'utf-8' })
    }
    catch (error) {
      output = String((error as { stdout?: string }).stdout || '')
    }

    expect(output).toContain('AGENTS.md missing managed RSP block')
  })

  it('reports generated index and active marker issues', async () => {
    const brokenDir = join(tmpdir(), 'rsp-doctor-index-test', randomUUID())
    await mkdir(join(brokenDir, RSP_DIR, 'rules'), { recursive: true })
    await mkdir(join(brokenDir, RSP_DIR, 'specs'), { recursive: true })
    await mkdir(join(brokenDir, RSP_DIR, 'archives'), { recursive: true })
    await mkdir(join(brokenDir, RSP_DIR, 'features'), { recursive: true })
    await mkdir(join(brokenDir, RSP_DIR, 'active.d'), { recursive: true })
    await writeFile(join(brokenDir, RSP_DIR, 'rules', 'rsp-rules.md'), '# rules\n')
    await writeFile(join(brokenDir, RSP_DIR, 'specs', 'design.md'), '# design\n')
    await writeFile(join(brokenDir, RSP_DIR, 'specs', 'INDEX.md'), '# manual\n')
    await writeFile(join(brokenDir, RSP_DIR, 'archives', 'INDEX.md'), '# manual\n')
    await writeFile(join(brokenDir, RSP_DIR, 'features', 'orphan.md'), '# orphan\n')
    await writeFile(join(brokenDir, 'AGENTS.md'), '<!-- rsp:begin -->\n## RSP Entry\n<!-- rsp:end -->\n')

    const cliPath = join(fileURLToPath(new URL('..', import.meta.url)), 'dist', 'cli.mjs')
    let output = ''
    try {
      output = execSync(`node ${cliPath} doctor`, { cwd: brokenDir, encoding: 'utf-8' })
    }
    catch (error) {
      output = String((error as { stdout?: string }).stdout || '')
    }

    expect(output).toContain('specs/INDEX.md has generated signature')
    expect(output).toContain('archives/INDEX.md has generated signature')
    expect(output).toContain('feature files without active markers: orphan')
  })
})

describe('pseudo-real fixture workflow', () => {
  it('initializes, adds files, and passes doctor in a repo with existing AGENTS.md', async () => {
    const fixtureDir = await copyFixture('home-manager-ish')
    const cliPath = join(fileURLToPath(new URL('..', import.meta.url)), 'dist', 'cli.mjs')

    execSync(`node ${cliPath} init --agents-mode managed`, { cwd: fixtureDir })
    execSync(`node ${cliPath} add rules project-rules`, { cwd: fixtureDir })
    execSync(`node ${cliPath} add spec shell-layout`, { cwd: fixtureDir })

    const agents = await readFile(join(fixtureDir, 'AGENTS.md'), 'utf-8')
    expect(agents).toContain('<!-- rsp:begin -->')
    expect(agents).toContain('## Project Context')

    const projectRules = await readFile(join(fixtureDir, '.rsp', 'rules', 'project-rules.md'), 'utf-8')
    expect(projectRules).toContain('# Project Rules')
    expect(projectRules).toContain('Project-specific rules for home-manager-ish')

    const specIndex = await readFile(join(fixtureDir, '.rsp', 'specs', 'INDEX.md'), 'utf-8')
    expect(specIndex).toContain('shell-layout.md')

    const doctorOutput = execSync(`node ${cliPath} doctor`, { cwd: fixtureDir, encoding: 'utf-8' })
    expect(doctorOutput).toContain('RSP setup looks healthy')
  })
})

async function readdirMinusIndex(dir: string): Promise<string[]> {
  const files = await readdir(dir)
  return files.filter(f => f !== 'INDEX.md')
}
