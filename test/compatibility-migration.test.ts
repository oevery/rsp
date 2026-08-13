import type { Buffer } from 'node:buffer'
import type { BrokerDiscoveryRecord } from '../src/broker/protocol.js'
import type {
  RuntimeContextPacketData,
  RuntimeFreshnessIdentity,
  RuntimeProjectIdentity,
} from '../src/runtime/model.js'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import {
  chmod,
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
  truncate,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { resolveBrokerPaths } from '../src/broker/host.js'
import { brokerProjectNamespace, discoverBrokerProject } from '../src/broker/project.js'
import {
  BROKER_DISCOVERY_SCHEMA,
  BROKER_PROTOCOL_VERSION,
  BROKER_RUNTIME_SCHEMA_VERSION,
} from '../src/broker/protocol.js'
import { startBrokerServer } from '../src/broker/server.js'
import { writeBrokerJsonAtomic } from '../src/broker/storage.js'
import { inspectDoctorRuntime } from '../src/commands/doctor-runtime.js'
import { removeRecognizedGeneratedSpecsIndexes } from '../src/commands/specs-index-migration.js'
import { updateProject } from '../src/commands/update.js'
import { resolveRuntimeDisposalTarget } from '../src/runtime/disposal.js'
import { withRuntimeInspectionSnapshot } from '../src/runtime/inspection-snapshot.js'
import { migrateRuntimeDatabase } from '../src/runtime/migrations.js'
import { RUNTIME_MAX_DATABASE_BYTES, RUNTIME_STORE_SCHEMA_VERSION } from '../src/runtime/model.js'
import {
  disposeRuntimeDatabase,
  inspectRuntimeContextPackets,
  openRuntimeEventStore,
  runtimeDatabasePath,
} from '../src/runtime/store.js'
import { processIdentityFor } from '../src/workspace/process.js'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
const v320FixtureRoot = join(repositoryRoot, 'test', 'fixtures', 'compatibility', 'v3.2.0')
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
    const entries = await recursivePaths(v320FixtureRoot)
    const actualDirectories: string[] = []
    const actualFiles: string[] = []
    for (const path of entries) {
      const projectPath = relative(v320FixtureRoot, path)
      const value = await lstat(path)
      if (value.isDirectory())
        actualDirectories.push(projectPath)
      else if (value.isFile() && projectPath !== 'manifest.json')
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
    const cacheRoot = join(fixture, '.test-broker-cache')
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))

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

    const update = runCli(['update'], fixture, {
      RSP_BROKER_CACHE_HOME: cacheRoot,
    })
    expect(update.status, update.stderr || update.stdout).toBe(0)
    expect(update.stdout).toContain('generated Specs indexes removed')
    for (const path of generated.keys())
      expect(existsSync(join(fixture, path))).toBe(false)
    expect(await readFile(join(fixture, '.rsp', 'specs', 'owner.md'))).toEqual(ownerBefore)
    expect(existsSync(join(fixture, '.rsp', 'specs', 'decisions'))).toBe(true)

    const specs = runCli(['specs', '--json'], fixture, {
      RSP_BROKER_CACHE_HOME: cacheRoot,
    })
    expect(specs.status, specs.stderr || specs.stdout).toBe(0)
    expect(JSON.parse(specs.stdout)).toMatchObject({
      generatedIndexes: [],
      documents: expect.arrayContaining([
        expect.objectContaining({ path: '.rsp/specs/owner.md' }),
        expect.objectContaining({ path: '.rsp/specs/runtime/events.md' }),
      ]),
    })

    const doctor = runCli(['doctor', '--json'], fixture, {
      RSP_BROKER_CACHE_HOME: cacheRoot,
    })
    expect(doctor.status, doctor.stderr || doctor.stdout).toBe(0)
    expect(JSON.parse(doctor.stdout)).toMatchObject({
      ok: true,
      checks: expect.arrayContaining([
        expect.objectContaining({ code: 'broker_absent', status: 'ok' }),
        expect.objectContaining({ code: 'runtime_absent', status: 'ok' }),
      ]),
    })
    expect(existsSync(cacheRoot)).toBe(false)
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
    const cacheRoot = join(fixture, '.test-broker-cache')
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    await writeFile(join(fixture, '.rsp', 'specs', '00-index.md'), '# Owner-controlled reserved notes\r\n\x00bytes\r\n')
    await writeFile(join(fixture, '.rsp', 'specs', 'owner.md'), '# Owner fact\n')
    const before = await snapshotRepositoryBytes(fixture)

    const update = runCli(['update'], fixture, {
      RSP_BROKER_CACHE_HOME: cacheRoot,
    })
    expect(update.status).toBe(1)
    expect(update.stderr).toContain('Generated Specs-index migration requires owner review before update')
    expect(await snapshotRepositoryBytes(fixture)).toEqual(before)

    const doctor = runCli(['doctor', '--json'], fixture, {
      RSP_BROKER_CACHE_HOME: cacheRoot,
    })
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
    expect(existsSync(cacheRoot)).toBe(false)
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

  it('reports absent, stale, invalid, unhealthy, healthy, and incompatible Broker states without starting one', async ({ onTestFinished }) => {
    const fixture = await createGitRspProject('rsp-compat-broker-doctor-')
    const paths = resolveBrokerPaths({ root: join(fixture, '.test-broker-cache') })
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))

    await withDoctorEnvironment(fixture, paths.root, async () => {
      expect((await inspectDoctorRuntime()).checks).toContainEqual(expect.objectContaining({
        code: 'broker_absent',
        status: 'ok',
      }))
    })
    expect(existsSync(paths.root)).toBe(false)

    await writeBrokerJsonAtomic(paths.discovery, discoveryRecord({
      pid: 2_147_483_000,
      processIdentity: 'dead-broker',
    }))
    await withDoctorEnvironment(fixture, paths.root, async () => {
      expect((await inspectDoctorRuntime()).checks).toContainEqual(expect.objectContaining({
        code: 'broker_stale',
        status: 'issue',
        hint: expect.stringContaining('rsp broker stop --json'),
      }))
    })
    const staleIndexPath = join(fixture, '.rsp', 'specs', '00-index.md')
    await writeFile(staleIndexPath, generatedSpecsIndex('.rsp/specs'))
    const staleUpdate = runCli(['update'], fixture, {
      RSP_BROKER_CACHE_HOME: paths.root,
    })
    expect(staleUpdate.status, staleUpdate.stderr || staleUpdate.stdout).toBe(0)
    expect(existsSync(staleIndexPath)).toBe(false)
    expect(existsSync(paths.discovery)).toBe(true)

    await writeFile(paths.discovery, '{invalid-json')
    await withDoctorEnvironment(fixture, paths.root, async () => {
      expect((await inspectDoctorRuntime()).checks).toContainEqual(expect.objectContaining({
        code: 'broker_invalid',
        status: 'issue',
      }))
    })

    const processIdentity = await processIdentityFor(process.pid)
    expect(processIdentity).not.toBeNull()
    await writeBrokerJsonAtomic(paths.discovery, discoveryRecord({
      pid: process.pid,
      processIdentity: processIdentity!,
      endpoint: 'http://127.0.0.1:65534',
    }))
    await withDoctorEnvironment(fixture, paths.root, async () => {
      expect((await inspectDoctorRuntime()).checks).toContainEqual(expect.objectContaining({
        code: 'broker_unhealthy',
        status: 'issue',
      }))
    })

    await rm(paths.discovery, { force: true })
    const healthy = await startBrokerServer({
      paths,
      packageVersion: '4.0.0-doctor-fixture',
    })
    try {
      await withDoctorEnvironment(fixture, paths.root, async () => {
        expect((await inspectDoctorRuntime()).checks).toContainEqual(expect.objectContaining({
          code: 'broker_healthy',
          status: 'ok',
        }))
      })
    }
    finally {
      await healthy.close()
    }

    const incompatible = await startBrokerServer({
      paths,
      packageVersion: '3.1.1-doctor-fixture',
      protocol: {
        major: BROKER_PROTOCOL_VERSION.major + 1,
        minor: 0,
      },
    })
    try {
      await withDoctorEnvironment(fixture, paths.root, async () => {
        expect((await inspectDoctorRuntime()).checks).toContainEqual(expect.objectContaining({
          code: 'broker_incompatible',
          status: 'issue',
          hint: expect.stringContaining('@oevery/rsp@3.1.1-doctor-fixture broker stop --json'),
        }))
      })
    }
    finally {
      await incompatible.close()
    }

    const restartable = await startBrokerServer({
      paths,
      packageVersion: '3.2.0-doctor-fixture',
      protocol: {
        major: BROKER_PROTOCOL_VERSION.major,
        minor: BROKER_PROTOCOL_VERSION.minor - 1,
      },
    })
    try {
      await withDoctorEnvironment(fixture, paths.root, async () => {
        expect((await inspectDoctorRuntime()).checks).toContainEqual(expect.objectContaining({
          code: 'broker_incompatible',
          status: 'issue',
          hint: expect.stringContaining('rsp broker restart --json'),
        }))
      })
    }
    finally {
      await restartable.close()
    }
  })

  it('reports runtime migration, incompatibility, incomplete history, and corruption without mutating repository truth', async ({ onTestFinished }) => {
    const fixture = await createGitRspProject('rsp-compat-runtime-doctor-')
    const paths = resolveBrokerPaths({ root: join(fixture, '.test-broker-cache') })
    const project = await discoverBrokerProject(fixture)
    const namespacePath = brokerProjectNamespace(paths.projects, project.projectId)
    const repositoryBefore = await snapshotRepositoryBytes(fixture)
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))

    await createRuntimeSchema(namespacePath, project, 1)
    await expectRuntimeDoctorCode(fixture, paths.root, 'runtime_migration_required')
    const migrationIndexPath = join(fixture, '.rsp', 'specs', '00-index.md')
    await writeFile(migrationIndexPath, generatedSpecsIndex('.rsp/specs'))
    const update = runCli(['update'], fixture, {
      RSP_BROKER_CACHE_HOME: paths.root,
    })
    expect(update.status, update.stderr || update.stdout).toBe(0)
    expect(existsSync(migrationIndexPath)).toBe(false)
    expect(existsSync(runtimeDatabasePath(namespacePath))).toBe(true)
    expect(await snapshotRepositoryBytes(fixture, paths.root)).toEqual(repositoryBefore)

    await disposeRuntimeDatabase(runtimeDisposalScope(paths, project.projectId, namespacePath))
    await createRuntimeSchema(namespacePath, project, RUNTIME_STORE_SCHEMA_VERSION)
    mutateRuntimeDatabase(namespacePath, (database) => {
      database.prepare('UPDATE runtime_metadata SET schema_major = 2 WHERE singleton = 1').run()
    })
    await expectRuntimeDoctorCode(fixture, paths.root, 'runtime_schema_incompatible')

    await disposeRuntimeDatabase(runtimeDisposalScope(paths, project.projectId, namespacePath))
    await createRuntimeSchema(namespacePath, project, RUNTIME_STORE_SCHEMA_VERSION)
    mutateRuntimeDatabase(namespacePath, (database) => {
      database.prepare('DELETE FROM runtime_migrations WHERE version = 2').run()
    })
    await expectRuntimeDoctorCode(fixture, paths.root, 'runtime_migration_history_invalid')

    await disposeRuntimeDatabase(runtimeDisposalScope(paths, project.projectId, namespacePath))
    await mkdir(namespacePath, { recursive: true })
    await writeFile(runtimeDatabasePath(namespacePath), 'not a sqlite database')
    await expectRuntimeDoctorCode(fixture, paths.root, 'runtime_database_corrupt')
    expect(await snapshotRepositoryBytes(fixture, paths.root)).toEqual(repositoryBefore)
  })

  it('rejects runtime symlink, oversize, and namespace-swap inspection without opening the source path', async ({ onTestFinished }) => {
    const fixture = await createGitRspProject('rsp-compat-runtime-safety-')
    const paths = resolveBrokerPaths({ root: join(fixture, '.test-broker-cache') })
    const project = await discoverBrokerProject(fixture)
    const namespacePath = brokerProjectNamespace(paths.projects, project.projectId)
    const databasePath = runtimeDatabasePath(namespacePath)
    const external = await mkdtemp(join(tmpdir(), 'rsp-runtime-external-'))
    onTestFinished(async () => {
      await Promise.all([
        rm(fixture, { recursive: true, force: true }),
        rm(external, { recursive: true, force: true }),
      ])
    })

    await mkdir(namespacePath, { recursive: true, mode: 0o700 })
    await writeFile(databasePath, '')
    await truncate(databasePath, RUNTIME_MAX_DATABASE_BYTES + 1)
    await expectRuntimeDoctorCode(fixture, paths.root, 'runtime_database_oversize')

    await rm(databasePath)
    const externalDatabase = join(external, 'runtime.sqlite')
    await writeFile(externalDatabase, 'external')
    await symlink(externalDatabase, databasePath)
    await expectRuntimeDoctorCode(fixture, paths.root, 'runtime_database_invalid')

    await rm(databasePath)
    await createRuntimeSchema(namespacePath, project, RUNTIME_STORE_SCHEMA_VERSION)
    const preservedNamespace = `${namespacePath}-preserved`
    let swapped = false
    await expect(withRuntimeInspectionSnapshot(namespacePath, async () => undefined, {
      async afterCopy() {
        if (swapped)
          return
        swapped = true
        await rename(namespacePath, preservedNamespace)
        await symlink(external, namespacePath, 'dir')
      },
    })).rejects.toSatisfy((error: unknown) =>
      ['stable_path_identity_changed', 'stable_path_not_real_directory']
        .includes((error as { code?: string }).code ?? ''))
    expect(existsSync(join(external, 'runtime-v1.sqlite'))).toBe(false)
  })

  it('reports POSIX mode violations, Windows skip semantics, and exact disposal derivation', async ({ onTestFinished }) => {
    const fixture = await createGitRspProject('rsp-compat-runtime-contracts-')
    const paths = resolveBrokerPaths({ root: join(fixture, '.test-broker-cache') })
    const project = await discoverBrokerProject(fixture)
    const namespacePath = brokerProjectNamespace(paths.projects, project.projectId)
    await createRuntimeSchema(namespacePath, project, RUNTIME_STORE_SCHEMA_VERSION)
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))

    const target = await resolveRuntimeDisposalTarget({
      cwd: fixture,
      cacheRoot: paths.root,
    })
    expect(target).toEqual({
      projectId: project.projectId,
      cacheRoot: paths.root,
      projectsRoot: paths.projects,
      namespacePath,
    })
    if (process.platform !== 'win32') {
      await chmod(paths.root, 0o755)
      await withDoctorEnvironment(fixture, paths.root, async () => {
        expect((await inspectDoctorRuntime()).checks).toContainEqual(expect.objectContaining({
          code: 'runtime_cache_permissions_unsafe',
          status: 'issue',
        }))
        expect((await inspectDoctorRuntime({ platform: 'win32' })).checks).toContainEqual(expect.objectContaining({
          code: 'runtime_cache_permissions_skipped',
          status: 'info',
        }))
      })
      expect((await stat(paths.root)).mode & 0o777).toBe(0o755)
    }
  })

  it('rejects pre-existing cache-root and projects-root symlinks before runtime disposal', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-compat-disposal-chain-'))
    const external = await mkdtemp(join(tmpdir(), 'rsp-compat-disposal-external-'))
    const projectId = 'e'.repeat(64)
    const externalProjects = join(external, 'projects')
    const externalNamespace = join(externalProjects, projectId)
    const externalDatabase = runtimeDatabasePath(externalNamespace)
    await mkdir(externalNamespace, { recursive: true })
    await writeFile(externalDatabase, 'other checkout database\n')
    onTestFinished(async () => {
      await Promise.all([
        rm(fixture, { recursive: true, force: true }),
        rm(external, { recursive: true, force: true }),
      ])
    })

    const cacheRootLink = join(fixture, 'cache-root-link')
    await symlink(external, cacheRootLink, 'dir')
    await expect(disposeRuntimeDatabase({
      projectId,
      cacheRoot: cacheRootLink,
      projectsRoot: join(cacheRootLink, 'projects'),
      namespacePath: join(cacheRootLink, 'projects', projectId),
    })).rejects.toMatchObject({
      code: 'stable_path_not_real_directory',
    })
    expect(await readFile(externalDatabase, 'utf8')).toBe('other checkout database\n')

    await rm(cacheRootLink)
    const cacheRoot = join(fixture, 'cache-root')
    await mkdir(cacheRoot)
    await symlink(externalProjects, join(cacheRoot, 'projects'), 'dir')
    await expect(disposeRuntimeDatabase({
      projectId,
      cacheRoot,
      projectsRoot: join(cacheRoot, 'projects'),
      namespacePath: join(cacheRoot, 'projects', projectId),
    })).rejects.toMatchObject({
      code: 'stable_path_not_real_directory',
    })
    expect(await readFile(externalDatabase, 'utf8')).toBe('other checkout database\n')
  })

  it('classifies fresh and stale context as disposable and keeps explicit cache disposal separate from repository migration', async ({ onTestFinished }) => {
    const fixture = await createGitRspProject('rsp-compat-context-doctor-')
    const paths = resolveBrokerPaths({ root: join(fixture, '.test-broker-cache') })
    const project = await discoverBrokerProject(fixture)
    const namespacePath = brokerProjectNamespace(paths.projects, project.projectId)
    const authorityPath = '.rsp/specs/design.md'
    const evidencePath = 'evidence.txt'
    await writeFile(join(fixture, evidencePath), 'fresh evidence\n')
    const gitHead = git(fixture, ['rev-parse', 'HEAD'])
    const freshness = await runtimeFreshness(project, gitHead, authorityPath, evidencePath)
    const store = await openRuntimeEventStore({
      namespacePath,
      project,
      now: () => new Date('2026-08-08T00:00:02.000Z'),
    })
    store.ensureRun({
      runId: 'run-context-doctor',
      runKey: 'run-key-context-doctor',
      workRef: 'rsp-4-runtime/compatibility-migration',
      createdAt: '2026-08-08T00:00:00.000Z',
    })
    store.appendEvent({
      runId: 'run-context-doctor',
      eventId: 'event-context-doctor',
      idempotencyKey: 'event-key-context-doctor',
      kind: 'manager-observed',
      actorType: 'manager',
      actorId: 'manager',
      observedAt: '2026-08-08T00:00:01.000Z',
    })
    store.saveContextPacket({
      runId: 'run-context-doctor',
      packetKey: 'manage-resume',
      expectedVersion: 0,
      sourceSequence: 1,
      freshness,
      data: runtimeContextData(authorityPath),
      updatedAt: '2026-08-08T00:00:02.000Z',
      expiresAt: '2099-08-08T00:00:00.000Z',
    })
    store.close()
    const repositoryBefore = await snapshotRepositoryBytes(fixture, paths.root)
    onTestFinished(async () => {
      await rm(fixture, { recursive: true, force: true })
    })

    await withDoctorEnvironment(fixture, paths.root, async () => {
      const doctor = await inspectDoctorRuntime()
      expect(doctor.checks).toContainEqual(expect.objectContaining({
        code: 'runtime_context_fresh',
        status: 'ok',
        hint: expect.stringContaining('dirty-path and authority aggregate identities'),
      }))
    })
    expect(existsSync(runtimeDatabasePath(namespacePath))).toBe(true)

    const inspectTimestampReasons = async (): Promise<string[]> => {
      const inspection = await inspectRuntimeContextPackets({
        namespacePath,
        project,
        currentGitHead: gitHead,
        sourceHash: async path => sha256(await readFile(join(fixture, path))),
      })
      return inspection.records[0]?.reasons ?? []
    }
    const setPacketTimes = (updatedAt: string, expiresAt: string): void => {
      mutateRuntimeDatabase(namespacePath, (database) => {
        database.prepare(`
          UPDATE runtime_context_packets
          SET updated_at = ?,
              expires_at = ?
          WHERE run_id = 'run-context-doctor'
            AND packet_key = 'manage-resume'
        `).run(updatedAt, expiresAt)
      })
    }
    setPacketTimes('2026-08-08 00:00:02Z', '2099-08-08T00:00:00.000Z')
    expect(await inspectTimestampReasons()).toContain('context packet update timestamp is invalid')
    setPacketTimes('2026-08-08T00:00:02.000Z', '2026-08-08T00:00:01.000Z')
    expect(await inspectTimestampReasons()).toContain('context packet timestamp ordering is invalid')
    setPacketTimes('2098-08-08T00:00:02.000Z', '2099-08-08T00:00:00.000Z')
    expect(await inspectTimestampReasons()).toContain('context packet update time is in the future')
    setPacketTimes('2000-08-08T00:00:02.000Z', '2001-08-08T00:00:00.000Z')
    expect(await inspectTimestampReasons()).toContain('context packet expired')
    setPacketTimes('2026-08-08T00:00:02.000Z', '2099-08-08T00:00:00.000Z')

    await writeFile(join(fixture, evidencePath), 'changed evidence\n')
    mutateRuntimeDatabase(namespacePath, (database) => {
      database.prepare(`
        UPDATE runtime_context_packets
        SET schema_version = 2,
            expires_at = '2000-01-01T00:00:00.000Z',
            updated_at = 'not-a-date'
        WHERE run_id = 'run-context-doctor'
          AND packet_key = 'manage-resume'
      `).run()
      database.prepare(`
        INSERT INTO runtime_events (
          event_id,
          run_id,
          dispatch_id,
          sequence,
          kind,
          actor_type,
          actor_id,
          parent_event_id,
          fingerprint,
          payload_json,
          redaction_count,
          observed_at,
          committed_at
        ) VALUES (
          'event-context-doctor-later',
          'run-context-doctor',
          NULL,
          2,
          'manager-observed',
          'manager',
          'manager',
          NULL,
          ?,
          '{}',
          0,
          '2026-08-08T00:00:03.000Z',
          '2026-08-08T00:00:03.000Z'
        )
      `).run(sha256('event-context-doctor-later'))
      database.prepare(`
        UPDATE runtime_runs
        SET next_sequence = 3,
            last_observed_at = '2026-08-08T00:00:03.000Z'
        WHERE run_id = 'run-context-doctor'
      `).run()
    })
    const contextInspection = await inspectRuntimeContextPackets({
      namespacePath,
      project,
      currentGitHead: gitHead,
      sourceHash: async path => sha256(await readFile(join(fixture, path))),
    })
    expect(contextInspection).toMatchObject({
      total: 1,
      returned: 1,
      hasMore: false,
      records: [
        expect.objectContaining({
          state: 'stale',
          disposable: true,
          reasons: expect.arrayContaining([
            'context packet schema changed',
            'context packet update timestamp is invalid',
            'committed runtime revision changed',
            'source changed: evidence',
          ]),
        }),
      ],
    })
    await withDoctorEnvironment(fixture, paths.root, async () => {
      expect((await inspectDoctorRuntime()).checks).toContainEqual(expect.objectContaining({
        code: 'runtime_context_stale',
        status: 'info',
        hint: expect.stringContaining('@oevery/rsp/dist/runtime-store.mjs'),
      }))
    })
    expect(existsSync(runtimeDatabasePath(namespacePath))).toBe(true)
    expect(await snapshotRepositoryBytes(fixture, paths.root)).not.toEqual(repositoryBefore)

    const repositoryBeforeDisposal = await snapshotRepositoryBytes(fixture, paths.root)
    const siblingNamespace = join(paths.projects, 'f'.repeat(64))
    await mkdir(siblingNamespace, { recursive: true })
    await writeFile(join(siblingNamespace, 'keep.txt'), 'other checkout cache\n')
    const disposalScope = runtimeDisposalScope(paths, project.projectId, namespacePath)
    const removed = await disposeRuntimeDatabase(disposalScope)
    expect(removed.map(path => relative(namespacePath, path))).toContain('runtime-v1.sqlite')
    expect(existsSync(runtimeDatabasePath(namespacePath))).toBe(false)
    expect(await readFile(join(siblingNamespace, 'keep.txt'), 'utf8')).toBe('other checkout cache\n')
    expect(await snapshotRepositoryBytes(fixture, paths.root)).toEqual(repositoryBeforeDisposal)

    await writeFile(runtimeDatabasePath(siblingNamespace), 'other checkout database\n')
    await expect(disposeRuntimeDatabase({
      ...disposalScope,
      namespacePath: siblingNamespace,
    })).rejects.toMatchObject({
      code: 'runtime_disposal_scope_invalid',
    })
    expect(await readFile(runtimeDatabasePath(siblingNamespace), 'utf8')).toBe('other checkout database\n')
    await rm(namespacePath, { recursive: true, force: true })
    await symlink(siblingNamespace, namespacePath, 'dir')
    await expect(disposeRuntimeDatabase(disposalScope)).rejects.toMatchObject({
      code: 'runtime_disposal_unsafe',
    })
    expect(await readFile(runtimeDatabasePath(siblingNamespace), 'utf8')).toBe('other checkout database\n')
    await rm(namespacePath)

    await mkdir(namespacePath)
    await writeFile(runtimeDatabasePath(namespacePath), 'current checkout database\n')
    const preservedNamespace = `${namespacePath}-preserved`
    await expect(disposeRuntimeDatabase(disposalScope, {
      testing: {
        async afterNamespaceCapture() {
          await rename(namespacePath, preservedNamespace)
          await symlink(siblingNamespace, namespacePath, 'dir')
        },
      },
    })).rejects.toSatisfy((error: unknown) =>
      ['stable_path_identity_changed', 'stable_path_not_real_directory']
        .includes((error as { code?: string }).code ?? ''))
    expect(await readFile(runtimeDatabasePath(siblingNamespace), 'utf8')).toBe('other checkout database\n')
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

function discoveryRecord(overrides: Partial<BrokerDiscoveryRecord> = {}): BrokerDiscoveryRecord {
  return {
    schema: BROKER_DISCOVERY_SCHEMA,
    instanceId: randomUUID(),
    pid: process.pid,
    processIdentity: 'fixture-process',
    endpoint: 'http://127.0.0.1:65534',
    protocol: { ...BROKER_PROTOCOL_VERSION },
    runtimeSchema: { ...BROKER_RUNTIME_SCHEMA_VERSION },
    packageVersion: '4.0.0-doctor-fixture',
    controlToken: randomBytes(32).toString('base64url'),
    startedAt: '2026-08-08T00:00:00.000Z',
    ...overrides,
  }
}

async function withDoctorEnvironment<T>(
  cwd: string,
  cacheRoot: string,
  action: () => Promise<T>,
): Promise<T> {
  const previousCwd = process.cwd()
  const previousCacheRoot = process.env.RSP_BROKER_CACHE_HOME
  process.chdir(cwd)
  process.env.RSP_BROKER_CACHE_HOME = cacheRoot
  try {
    return await action()
  }
  finally {
    process.chdir(previousCwd)
    if (previousCacheRoot === undefined)
      delete process.env.RSP_BROKER_CACHE_HOME
    else
      process.env.RSP_BROKER_CACHE_HOME = previousCacheRoot
  }
}

async function createRuntimeSchema(
  namespacePath: string,
  project: RuntimeProjectIdentity,
  targetVersion: number,
): Promise<void> {
  await mkdir(namespacePath, { recursive: true })
  const database = new DatabaseSync(runtimeDatabasePath(namespacePath))
  try {
    migrateRuntimeDatabase(database, project, {
      now: '2026-08-08T00:00:00.000Z',
      targetVersion,
    })
  }
  finally {
    database.close()
  }
  if (process.platform !== 'win32') {
    await chmod(namespacePath, 0o700)
    await chmod(runtimeDatabasePath(namespacePath), 0o600)
  }
}

function runtimeDisposalScope(
  paths: ReturnType<typeof resolveBrokerPaths>,
  projectId: string,
  namespacePath: string,
): {
  projectId: string
  cacheRoot: string
  projectsRoot: string
  namespacePath: string
} {
  return {
    projectId,
    cacheRoot: paths.root,
    projectsRoot: paths.projects,
    namespacePath,
  }
}

function mutateRuntimeDatabase(
  namespacePath: string,
  action: (database: DatabaseSync) => void,
): void {
  const database = new DatabaseSync(runtimeDatabasePath(namespacePath))
  try {
    action(database)
  }
  finally {
    database.close()
  }
}

async function expectRuntimeDoctorCode(
  fixture: string,
  cacheRoot: string,
  code: string,
): Promise<void> {
  await withDoctorEnvironment(fixture, cacheRoot, async () => {
    expect((await inspectDoctorRuntime()).checks).toContainEqual(expect.objectContaining({
      code,
      status: 'issue',
      hint: expect.stringContaining('@oevery/rsp/dist/runtime-store.mjs'),
    }))
  })
}

async function runtimeFreshness(
  project: RuntimeProjectIdentity,
  gitHead: string,
  authorityPath: string,
  evidencePath: string,
): Promise<RuntimeFreshnessIdentity> {
  return {
    projectId: project.projectId,
    checkoutRoot: project.root,
    workRef: 'rsp-4-runtime/compatibility-migration',
    gitHead,
    dirtyPathsHash: sha256('dirty-paths'),
    authorityHash: sha256('authority'),
    sources: [
      {
        key: 'authority',
        role: 'authority',
        path: authorityPath,
        contentHash: sha256(await readFile(join(project.root, authorityPath))),
        revision: null,
      },
      {
        key: 'evidence',
        role: 'evidence',
        path: evidencePath,
        contentHash: sha256(await readFile(join(project.root, evidencePath))),
        revision: null,
      },
    ],
  }
}

function runtimeContextData(authorityPath: string): RuntimeContextPacketData {
  return {
    phase: 'implement',
    authorityRefs: [authorityPath],
    decisiveObservations: [{
      eventId: 'event-context-doctor',
      sequence: 1,
      summary: 'Compatibility migration is under verification.',
    }],
    blockers: [],
    attention: [],
    evidence: [{
      sourceKey: 'evidence',
      summary: 'Current evidence source.',
    }],
    changedPaths: ['src/commands/doctor-runtime.ts'],
    nextAction: 'Request fixed-scope review.',
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
