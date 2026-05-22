import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
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
  return rspPath('archive', ...parts)
}

function specPath(...parts: string[]) {
  return rspPath('spec', ...parts)
}

beforeAll(async () => {
  testDir = join(tmpdir(), 'rsp-int-test', randomUUID())
  await mkdir(testDir, { recursive: true })
  origCwd = process.cwd()
  process.chdir(testDir)

  const dirs = ['rules', 'spec', 'features', 'archive', 'active.d']
  for (const d of dirs)
    await mkdir(rspPath(d), { recursive: true })
})

afterAll(() => {
  process.chdir(origCwd)
  clearConfigCache()
})

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

describe('spec index update on close', () => {
  it('appends entry to spec INDEX.md after close', async () => {
    const { newFeature } = await import('../src/commands/new-feature.js')
    const { closeFeature } = await import('../src/commands/close-feature.js')

    await newFeature('spec-test', 'Feature for spec index')
    await closeFeature('spec-test')

    const specIndexPath = specPath('INDEX.md')
    expect(existsSync(specIndexPath)).toBe(true)
    const content = await readFile(specIndexPath, 'utf-8')
    expect(content).toContain('spec-test')
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

describe('init creates .rsp/.gitignore', () => {
  let initDir: string
  let orig: string

  beforeAll(async () => {
    initDir = join(tmpdir(), 'rsp-gitignore-test', randomUUID())
    await mkdir(initDir, { recursive: true })
    orig = process.cwd()
    process.chdir(initDir)
    clearConfigCache()
  })

  afterAll(() => {
    process.chdir(orig)
    clearConfigCache()
  })

  it('creates .rsp/.gitignore when initialized', async () => {
    const cliPath = join(fileURLToPath(new URL('..', import.meta.url)), 'dist', 'cli.mjs')
    execSync(`node ${cliPath} init`, { cwd: initDir })

    const gitignorePath = join(initDir, RSP_DIR, '.gitignore')
    expect(existsSync(gitignorePath)).toBe(true)

    const content = await readFile(gitignorePath, 'utf-8')
    expect(content).toContain('.lock')
  })
})

async function readdirMinusIndex(dir: string): Promise<string[]> {
  const files = await readdir(dir)
  return files.filter(f => f !== 'INDEX.md')
}
