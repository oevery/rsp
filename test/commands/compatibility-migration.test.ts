import type { Buffer } from 'node:buffer'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rename,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { removeRecognizedGeneratedSpecsIndexes } from '../../src/commands/specs-index-migration.js'
import { updateProject } from '../../src/commands/update.js'

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url))
const v320FixtureRoot = join(repositoryRoot, 'acceptance', 'fixtures', 'compatibility', 'v3.2.0')
const v320TransportPlaceholder = '.rsp/archives/.fixture-transport-placeholder'
const builtCli = join(repositoryRoot, 'dist', 'cli.mjs')
const deprecatedLiteGuidance = 'Warning: create option "--lite" is deprecated and ignored; using the standard kind-aware Change template'

describe.sequential('rsp 3.x compatible-release migration', () => {
  it('pins supported 3.x migration evidence to the published v3.2.0 tag fixture', async () => {
    const manifest = JSON.parse(await readFile(join(v320FixtureRoot, 'manifest.json'), 'utf8')) as {
      tagCommit: string
      tagTree: string
      sourceBlobs: Record<string, string>
      directories: string[]
      sha256: Record<string, string>
    }
    expect(git(repositoryRoot, ['rev-parse', 'v3.2.0^{}'])).toBe(manifest.tagCommit)
    expect(git(repositoryRoot, ['rev-parse', 'v3.2.0^{tree}'])).toBe(manifest.tagTree)
    for (const [path, expectedBlob] of Object.entries(manifest.sourceBlobs))
      expect(git(repositoryRoot, ['rev-parse', `v3.2.0:${path}`])).toBe(expectedBlob)
    for (const [path, expectedHash] of Object.entries(manifest.sha256))
      expect(sha256(await readFile(join(v320FixtureRoot, path)))).toBe(expectedHash)
    expect(existsSync(join(v320FixtureRoot, v320TransportPlaceholder))).toBe(true)
    const entries = await recursivePaths(v320FixtureRoot)
    const actualDirectories: string[] = []
    const actualFiles: string[] = []
    for (const path of entries) {
      const projectPath = relative(v320FixtureRoot, path)
      const value = await lstat(path)
      if (value.isDirectory())
        actualDirectories.push(projectPath)
      else if (value.isFile() && projectPath !== 'manifest.json' && projectPath !== v320TransportPlaceholder)
        actualFiles.push(projectPath)
    }
    expect(actualDirectories.sort()).toEqual([...manifest.directories].sort())
    expect(actualFiles.sort()).toEqual(Object.keys(manifest.sha256).sort())
  })

  it('accepts every legacy --lite boolean form through the standard kind-aware scaffold', async ({ onTestFinished }) => {
    const fixture = await createGitRspProject('rsp-compat-lite-')
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))

    for (const [index, option] of ['--lite', '--lite=true', '--lite=false'].entries()) {
      const name = `legacy-compatible-${index + 1}`
      const result = runCli(['create', name, '--kind', 'fix', option, 'Compatible scaffold'], fixture)
      expect(result.status, result.stderr || result.stdout).toBe(0)
      expect(result.stderr.trim()).toBe(deprecatedLiteGuidance)
      const content = await readFile(join(fixture, '.rsp', 'changes', `${name}.md`), 'utf8')
      expect(content).toContain('kind: "fix"')
      expect(content).toContain('- Outcome: Compatible scaffold')
      expect(content).toContain('## Proposal')
      expect(content).toContain('## Spec')
      expect(content).toContain('## Design')
      expect(content).toContain('## Tasks')
      expect(content).toContain('## Verify')
      expect(content).toContain('## Blockers')
      expect(content).not.toContain('## Lite')
      expect(existsSync(join(fixture, '.rsp', 'focus.d', name))).toBe(true)
    }
  })

  it('rejects unsupported --lite values before Change or focus mutation', async ({ onTestFinished }) => {
    const fixture = await createGitRspProject('rsp-compat-invalid-lite-')
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))

    for (const [index, option] of ['--lite=yes', '--lite=1', '--lite=TRUE', '--lite='].entries()) {
      const name = `invalid-lite-${index + 1}`
      const result = runCli(['create', name, '--kind', 'fix', option, 'Must not mutate'], fixture)
      expect(result.status).toBe(1)
      expect(result.stdout).toBe('')
      expect(result.stderr.trim()).toBe(
        `Error: create option "${option}" is invalid; use --lite, --lite=true, or --lite=false`,
      )
      expect(existsSync(join(fixture, '.rsp', 'changes', `${name}.md`))).toBe(false)
      expect(existsSync(join(fixture, '.rsp', 'focus.d', name))).toBe(false)
    }
  })

  it('migrates a supported 3.x layout, restores missing safe directories, and leaves direct Specs navigation cache-free', async ({ onTestFinished }) => {
    const fixture = await createV320RspProject('rsp-compat-supported-3x-')
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    expect(existsSync(join(fixture, v320TransportPlaceholder))).toBe(false)

    await rm(join(fixture, '.rsp', 'specs', 'decisions'), { recursive: true, force: true })
    await mkdir(join(fixture, '.rsp', 'specs', 'runtime'), { recursive: true })
    await writeFile(join(fixture, '.rsp', 'specs', 'owner.md'), '# Owner fact\n\nbyte-identical\n')
    await writeFile(join(fixture, '.rsp', 'specs', 'runtime', 'events.md'), '# Runtime Events\n')
    const generated = new Map([
      ['.rsp/specs/INDEX.md', generatedSpecsIndex('.rsp/specs')],
      ['.rsp/specs/00-index.md', await readFile(join(v320FixtureRoot, '.rsp/specs/00-index.md'), 'utf8')],
      ['.rsp/specs/runtime/00-index.md', generatedSpecsIndex('.rsp/specs/runtime')],
    ])
    for (const [path, content] of generated)
      await writeFile(join(fixture, path), content)
    const ownerBefore = await readFile(join(fixture, '.rsp', 'specs', 'owner.md'))

    const update = runCli(['update'], fixture)
    expect(update.status, update.stderr || update.stdout).toBe(0)
    expect(update.stdout).toContain('generated Specs indexes removed')
    for (const path of generated.keys())
      expect(existsSync(join(fixture, path))).toBe(false)
    expect(await readFile(join(fixture, '.rsp', 'specs', 'owner.md'))).toEqual(ownerBefore)
    expect(existsSync(join(fixture, '.rsp', 'specs', 'decisions'))).toBe(true)

    const specs = runCli(['specs', '--json'], fixture)
    expect(specs.status, specs.stderr || specs.stdout).toBe(0)
    expect(JSON.parse(specs.stdout)).toMatchObject({
      generatedIndexes: [],
      documents: expect.arrayContaining([
        expect.objectContaining({ path: '.rsp/specs/owner.md' }),
        expect.objectContaining({ path: '.rsp/specs/runtime/events.md' }),
      ]),
    })
  })

  it('creates a fresh compatible-release project without root or nested generated Specs indexes', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-compat-fresh-'))
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))

    expect(runCli(['init'], fixture).status).toBe(0)
    expect(runCli(['add', 'spec', 'runtime/events'], fixture).status).toBe(0)
    expect(existsSync(join(fixture, '.rsp', 'specs', '00-index.md'))).toBe(false)
    expect(existsSync(join(fixture, '.rsp', 'specs', 'INDEX.md'))).toBe(false)
    expect(existsSync(join(fixture, '.rsp', 'specs', 'runtime', '00-index.md'))).toBe(false)

    const specs = runCli(['specs', '--json'], fixture)
    expect(specs.status, specs.stderr || specs.stdout).toBe(0)
    expect(JSON.parse(specs.stdout)).toMatchObject({
      generatedIndexes: [],
      documents: expect.arrayContaining([
        expect.objectContaining({ path: '.rsp/specs/runtime/events.md' }),
      ]),
    })
  })

  it('fails closed on owner-controlled reserved content and preserves the repository byte-for-byte', async ({ onTestFinished }) => {
    const fixture = await createGitRspProject('rsp-compat-owner-reserved-')
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    await writeFile(join(fixture, '.rsp', 'specs', '00-index.md'), '# Owner-controlled reserved notes\r\n\x00bytes\r\n')
    await writeFile(join(fixture, '.rsp', 'specs', 'owner.md'), '# Owner fact\n')
    const before = await snapshotRepositoryBytes(fixture)

    const update = runCli(['update'], fixture)
    expect(update.status).toBe(1)
    expect(update.stderr).toContain('Generated Specs-index migration requires owner review before update')
    expect(await snapshotRepositoryBytes(fixture)).toEqual(before)

    const doctor = runCli(['doctor', '--json'], fixture)
    expect(doctor.status).toBe(1)
    expect(JSON.parse(doctor.stdout)).toMatchObject({
      ok: false,
      checks: expect.arrayContaining([
        expect.objectContaining({
          status: 'issue',
          label: 'Specs tree is directly queryable',
        }),
      ]),
    })
    expect(await snapshotRepositoryBytes(fixture)).toEqual(before)
  })

  it('rolls every quarantined generated index back when migration is interrupted', async ({ onTestFinished }) => {
    const fixture = await createGitRspProject('rsp-compat-index-rollback-')
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    await mkdir(join(fixture, '.rsp', 'specs', 'runtime'), { recursive: true })
    const indexes = new Map([
      ['.rsp/specs/00-index.md', generatedSpecsIndex('.rsp/specs')],
      ['.rsp/specs/runtime/00-index.md', generatedSpecsIndex('.rsp/specs/runtime')],
    ])
    for (const [path, content] of indexes)
      await writeFile(join(fixture, path), content)
    let quarantined = 0

    await expect(removeRecognizedGeneratedSpecsIndexes({
      cwd: fixture,
      async afterQuarantine() {
        quarantined += 1
        if (quarantined === indexes.size)
          throw new Error('deterministic rollback injection')
      },
    })).rejects.toThrow('deterministic rollback injection')

    for (const [path, content] of indexes)
      expect(await readFile(join(fixture, path), 'utf8')).toBe(content)
    const paths = await recursivePaths(join(fixture, '.rsp', 'specs'))
    expect(paths.filter(path => path.includes('.rsp-migration'))).toEqual([])
  })

  it('fails closed when a generated-index parent is swapped to an external directory', async ({ onTestFinished }) => {
    const fixture = await createGitRspProject('rsp-compat-parent-swap-')
    const external = await mkdtemp(join(tmpdir(), 'rsp-compat-parent-external-'))
    const specs = join(fixture, '.rsp', 'specs')
    const preservedSpecs = join(fixture, '.rsp', 'specs-preserved')
    const content = generatedSpecsIndex('.rsp/specs')
    await writeFile(join(specs, '00-index.md'), content)
    onTestFinished(async () => {
      await Promise.all([
        rm(fixture, { recursive: true, force: true }),
        rm(external, { recursive: true, force: true }),
      ])
    })

    const error = await removeRecognizedGeneratedSpecsIndexes({
      cwd: fixture,
      async afterQuarantine() {
        await rename(specs, preservedSpecs)
        await symlink(external, specs, 'dir')
      },
    }).catch(value => value)
    expect(error).toMatchObject({
      code: 'generated_specs_index_recovery_required',
      recoveryPaths: [expect.any(String)],
      retainedMutations: [],
    })
    expect(await readdir(external)).toEqual([])
    const recovery = error.recoveryPaths[0]
    expect(await realpath(recovery)).toBe(recovery)
    expect(recovery.startsWith(await realpath(preservedSpecs))).toBe(true)
    expect(await readFile(recovery, 'utf8')).toBe(content)
  })

  it('restores through exclusive copy when hard links are unsupported', async ({ onTestFinished }) => {
    const fixture = await createGitRspProject('rsp-compat-copy-rollback-')
    const indexPath = join(fixture, '.rsp', 'specs', '00-index.md')
    const content = generatedSpecsIndex('.rsp/specs')
    await writeFile(indexPath, content)
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    const unsupportedLink = async () => {
      const error = new Error('hard links unsupported') as NodeJS.ErrnoException
      error.code = 'EOPNOTSUPP'
      throw error
    }
    await expect(removeRecognizedGeneratedSpecsIndexes({
      cwd: fixture,
      fileAdapter: { link: unsupportedLink },
      async afterQuarantine() {
        throw new Error('copy rollback injection')
      },
    })).rejects.toThrow('copy rollback injection')
    expect(await readFile(indexPath, 'utf8')).toBe(content)
    expect((await stat(indexPath)).mode & 0o777).toBe(0o644)
    expect((await recursivePaths(join(fixture, '.rsp', 'specs')))
      .filter(path => path.includes('.rsp-migration'))).toEqual([])
  })

  it('preserves a concurrent replacement when exclusive-copy rollback fails after destination creation', async ({ onTestFinished }) => {
    const fixture = await createGitRspProject('rsp-compat-copy-race-')
    const specs = join(fixture, '.rsp', 'specs')
    const indexPath = join(specs, '00-index.md')
    const createdPath = join(specs, 'created-by-rollback')
    const content = generatedSpecsIndex('.rsp/specs')
    const concurrent = '# Concurrent owner replacement\n'
    await writeFile(indexPath, content)
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    const unsupportedLink = async () => {
      const error = new Error('hard links unsupported') as NodeJS.ErrnoException
      error.code = 'EOPNOTSUPP'
      throw error
    }

    const error = await removeRecognizedGeneratedSpecsIndexes({
      cwd: fixture,
      fileAdapter: { link: unsupportedLink },
      async afterQuarantine() {
        throw new Error('copy rollback injection')
      },
      testing: {
        async afterCopyDestinationOpen(destinationPath) {
          await rename(destinationPath, createdPath)
          await writeFile(destinationPath, concurrent)
          throw new Error('concurrent replacement injection')
        },
      },
    }).catch(value => value)

    expect(error).toMatchObject({
      code: 'generated_specs_index_recovery_required',
    })
    expect(await readFile(indexPath, 'utf8')).toBe(concurrent)
    expect(await readFile(createdPath, 'utf8')).toBe('')
    expect(error.recoveryPaths.every((path: string) => existsSync(path))).toBe(true)
  })

  it('rolls back every same-command update mutation after a late migration failure', async ({ onTestFinished }) => {
    const fixture = await createGitRspProject('rsp-compat-update-transaction-')
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    await writeFile(join(fixture, '.rsp', 'config.yaml'), await readFile(join(v320FixtureRoot, '.rsp/config.yaml')))
    await writeFile(join(fixture, 'AGENTS.md'), await readFile(join(v320FixtureRoot, 'AGENTS.md')))
    await writeFile(join(fixture, '.rsp', 'specs', '00-index.md'), await readFile(join(v320FixtureRoot, '.rsp/specs/00-index.md')))
    await writeFile(join(fixture, '.rsp', 'archives', 'INDEX.md'), `---
kind: generated-index
index_type: archives
---
`)
    await mkdir(join(fixture, '.rsp', 'rules', 'nested', 'empty'), { recursive: true })
    await writeFile(join(fixture, '.rsp', 'rules', 'rsp-rules.md'), '# Legacy fallback\n')
    await rm(join(fixture, '.rsp', 'changes'), { recursive: true })
    await rm(join(fixture, '.rsp', 'specs', 'decisions'), { recursive: true })
    const before = await snapshotFilesystem(fixture)

    await withCwd(fixture, async () => {
      await expect(updateProject({
        quiet: true,
        testing: {
          packageRoot: repositoryRoot,
          async afterSpecsMigration() {
            throw new Error('late update transaction injection')
          },
        },
      })).rejects.toThrow('late update transaction injection')
    })
    expect(await snapshotFilesystem(fixture)).toEqual(before)
  })

  it('retains a concurrent update replacement and reports exact rollback recovery evidence', async ({ onTestFinished }) => {
    const fixture = await createV320RspProject('rsp-compat-update-race-')
    const configPath = await realpath(join(fixture, '.rsp', 'config.yaml'))
    const concurrentOriginalPath = `${configPath}.owner-preserved`
    const concurrent = '# concurrent owner config\n'
    let injected = false
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))

    const error = await withCwd(fixture, async () => updateProject({
      quiet: true,
      testing: {
        packageRoot: repositoryRoot,
        async afterSpecsMigration() {
          throw new Error('late update transaction injection')
        },
        rollback: {
          async afterPublishedValidation(path) {
            if (injected || path !== configPath)
              return
            injected = true
            await rename(path, concurrentOriginalPath)
            await writeFile(path, concurrent)
          },
        },
      },
    })).catch(value => value)

    expect(injected).toBe(true)
    expect(error).toMatchObject({
      name: 'UpdateTransactionError',
      rollback: {
        retainedMutations: expect.arrayContaining(['.rsp/config.yaml']),
        recoveryPaths: [expect.any(String)],
      },
    })
    expect(await readFile(configPath, 'utf8')).toBe(concurrent)
    expect(existsSync(concurrentOriginalPath)).toBe(true)
    expect(error.rollback.recoveryPaths.every((path: string) => existsSync(path))).toBe(true)
    for (const recoveryPath of error.rollback.recoveryPaths)
      await rm(dirname(recoveryPath), { recursive: true, force: true })
  })
})

interface CliResult {
  status: number | null
  stdout: string
  stderr: string
}

function runCli(
  args: string[],
  cwd: string,
  environment: Record<string, string> = {},
): CliResult {
  const result = spawnSync(process.execPath, [builtCli, ...args], {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...environment,
    },
  })
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  }
}

async function createGitRspProject(prefix: string): Promise<string> {
  const fixture = await mkdtemp(join(tmpdir(), prefix))
  git(fixture, ['init', '-b', 'main'])
  git(fixture, ['config', 'user.name', 'RSP Compatibility Test'])
  git(fixture, ['config', 'user.email', 'rsp-compat@example.invalid'])
  await writeFile(join(fixture, 'README.md'), '# Compatibility fixture\n')
  git(fixture, ['add', 'README.md'])
  git(fixture, ['commit', '-m', 'test: initialize compatibility fixture'])
  const initialized = runCli(['init'], fixture)
  if (initialized.status !== 0)
    throw new Error(initialized.stderr || initialized.stdout)
  return fixture
}

async function createV320RspProject(prefix: string): Promise<string> {
  const fixture = await mkdtemp(join(tmpdir(), prefix))
  git(fixture, ['init', '-b', 'main'])
  git(fixture, ['config', 'user.name', 'RSP Compatibility Test'])
  git(fixture, ['config', 'user.email', 'rsp-compat@example.invalid'])
  await writeFile(join(fixture, 'README.md'), '# Compatibility fixture\n')
  await cp(join(v320FixtureRoot, '.rsp'), join(fixture, '.rsp'), { recursive: true })
  await rm(join(fixture, v320TransportPlaceholder), { force: true })
  await cp(join(v320FixtureRoot, 'AGENTS.md'), join(fixture, 'AGENTS.md'))
  git(fixture, ['add', '.'])
  git(fixture, ['commit', '-m', 'test: initialize package-executed rsp 3.2.0 fixture'])
  return fixture
}

function generatedSpecsIndex(sourceDir: string): string {
  return `---
title: Specs Index
summary: Generated compatibility navigation.
kind: generated-index
index_type: specs
source_dir: ${sourceDir}
entry_count: 0
---

# Specs Index
`
}

async function snapshotRepositoryBytes(
  root: string,
  excludedRoot?: string,
): Promise<Map<string, Buffer>> {
  const snapshot = new Map<string, Buffer>()
  const excluded = excludedRoot ? resolve(excludedRoot) : null
  await walk(root)
  return snapshot

  async function walk(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name === '.git')
        continue
      const path = join(directory, entry.name)
      if (excluded && (path === excluded || path.startsWith(`${excluded}/`)))
        continue
      if (entry.isDirectory()) {
        await walk(path)
      }
      else if (entry.isFile()) {
        snapshot.set(relative(root, path), await readFile(path))
      }
    }
  }
}

async function snapshotFilesystem(root: string): Promise<Map<string, string>> {
  const snapshot = new Map<string, string>()
  await walk(root)
  return snapshot

  async function walk(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name === '.git' || entry.name === '.lock')
        continue
      const path = join(directory, entry.name)
      const projectPath = relative(root, path)
      const value = await lstat(path)
      if (entry.isDirectory()) {
        snapshot.set(`${projectPath}/`, `dir:${(value.mode & 0o777).toString(8)}`)
        await walk(path)
      }
      else if (entry.isFile()) {
        snapshot.set(projectPath, `file:${(value.mode & 0o777).toString(8)}:${sha256(await readFile(path))}`)
      }
      else {
        snapshot.set(projectPath, `other:${value.mode}`)
      }
    }
  }
}

async function withCwd<T>(cwd: string, action: () => Promise<T>): Promise<T> {
  const previous = process.cwd()
  process.chdir(cwd)
  try {
    return await action()
  }
  finally {
    process.chdir(previous)
  }
}

async function recursivePaths(root: string): Promise<string[]> {
  const paths: string[] = []
  await walk(root)
  return paths.sort()

  async function walk(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      paths.push(path)
      if (entry.isDirectory())
        await walk(path)
    }
  }
}

function git(root: string, args: string[]): string {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
