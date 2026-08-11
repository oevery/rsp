import type { ChildProcess } from 'node:child_process'
import type { BrokerPaths } from '../src/broker/host.js'
import type { BrokerDiscoveryRecord, BrokerProjectSessionPublic } from '../src/broker/protocol.js'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { randomBytes, randomUUID } from 'node:crypto'
import { once } from 'node:events'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, realpath, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { describe, expect, it, onTestFinished as registerTestCleanup } from 'vitest'
import {
  brokerProjectRequest,
  getBrokerStatus,
  inspectBroker,
  registerBrokerProject,
  restartBroker,
  startBroker,
  stopBroker,
} from '../src/broker/client.js'
import {
  parseLoopbackEndpoint,
  resolveBrokerCacheRoot,
  resolveBrokerPaths,
} from '../src/broker/host.js'
import { withBrokerStartLock } from '../src/broker/lock.js'
import {
  brokerProjectNamespace,
  discoverBrokerProject,
  resolveBrokerProjectPath,
} from '../src/broker/project.js'
import {
  BROKER_DISCOVERY_SCHEMA,
  BROKER_MAX_JSON_RESPONSE_BYTES,
  BROKER_PROTOCOL_VERSION,
  BROKER_RUNTIME_SCHEMA_VERSION,
  BrokerError,
  parseBrokerDiscoveryRecord,
} from '../src/broker/protocol.js'
import {
  createBrokerStatusResponse,
  encodeBrokerJsonResponse,
  startBrokerServer,
} from '../src/broker/server.js'
import { BrokerProjectSessions } from '../src/broker/sessions.js'
import {
  readBrokerJson,
  unlinkBrokerFileIfIdentity,
  writeBrokerJsonAtomic,
} from '../src/broker/storage.js'
import { processIdentityFor } from '../src/workspace/process.js'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
const builtCli = join(repositoryRoot, 'dist', 'cli.mjs')

interface CliResult {
  status: number | null
  stdout: string
  stderr: string
}

describe.sequential('broker protocol and lifecycle', () => {
  it('allows concurrent client processes to start exactly one Broker instance', async ({ onTestFinished }) => {
    requireBuiltBroker()
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-concurrent-'))
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    onTestFinished(async () => {
      await cleanupDaemonBroker(paths)
      await rm(fixture, { recursive: true, force: true })
    })
    const environment = {
      ...process.env,
      RSP_BROKER_CACHE_HOME: paths.root,
    }

    const results = await Promise.all([
      runCli(['broker', 'start', '--json'], fixture, environment),
      runCli(['broker', 'start', '--json'], fixture, environment),
    ])

    for (const result of results)
      expect(result.status, result.stderr || result.stdout).toBe(0)
    const outputs = results.map(result => JSON.parse(result.stdout) as Record<string, any>)
    expect(new Set(outputs.map(output => output.broker.instanceId))).toHaveLength(1)
    expect(new Set(outputs.map(output => output.broker.endpoint))).toHaveLength(1)
    expect(new Set(outputs.map(output => output.broker.pid))).toHaveLength(1)
    expect(outputs.map(output => output.reused).sort()).toEqual([false, true])
    expect(outputs.every(output => output.sessionCount === 0)).toBe(true)

    const inspection = await inspectBroker({ paths })
    expect(inspection.state).toBe('running')
    expect(inspection.record?.instanceId).toBe(outputs[0]!.broker.instanceId)
    expect(existsSync(paths.startLock)).toBe(false)
  }, 20_000)

  it('restarts one healthy Broker as a fresh zero-session singleton through the CLI', async ({ onTestFinished }) => {
    requireBuiltBroker()
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-restart-'))
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    const repository = join(fixture, 'repository')
    await initializeGitRepository(repository, 'restart-fixture')
    onTestFinished(async () => {
      await cleanupDaemonBroker(paths)
      await rm(fixture, { recursive: true, force: true })
    })
    const environment = {
      ...process.env,
      RSP_BROKER_CACHE_HOME: paths.root,
    }
    const started = await runCli(['broker', 'start', '--json'], fixture, environment)
    expect(started.status, started.stderr || started.stdout).toBe(0)
    const first = JSON.parse(started.stdout) as Record<string, any>
    const inspection = await inspectBroker({ paths })
    expect(inspection.state).toBe('running')
    await registerBrokerProject(inspection.record!, repository)
    expect((await getBrokerStatus(inspection.record!)).sessionCount).toBe(1)

    const restarted = await runCli(['broker', 'restart', '--json'], fixture, environment)

    expect(restarted.status, restarted.stderr || restarted.stdout).toBe(0)
    const output = JSON.parse(restarted.stdout) as Record<string, any>
    expect(output).toMatchObject({
      command: 'broker',
      action: 'restart',
      ok: true,
      state: 'running',
      restarted: true,
      staleRecovered: false,
      sessionCount: 0,
    })
    expect(output.previousBroker.instanceId).toBe(first.broker.instanceId)
    expect(output.previousBroker.pid).toBe(first.broker.pid)
    expect(output.broker.instanceId).not.toBe(first.broker.instanceId)
    expect(output.broker.pid).not.toBe(first.broker.pid)
    const current = await inspectBroker({ paths })
    expect(current.state).toBe('running')
    expect(current.record?.instanceId).toBe(output.broker.instanceId)
    expect(existsSync(paths.startLock)).toBe(false)
  }, 20_000)

  it('replaces a healthy same-major older-minor Broker without an older client', async ({ onTestFinished }) => {
    requireBuiltBroker()
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-restart-upgrade-'))
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    const previous = await startBrokerServer({
      paths,
      packageVersion: '0.0.0-older-minor-fixture',
      protocol: {
        major: BROKER_PROTOCOL_VERSION.major,
        minor: BROKER_PROTOCOL_VERSION.minor - 1,
      },
    })
    onTestFinished(async () => {
      await cleanupDaemonBroker(paths)
      await previous.close()
      await rm(fixture, { recursive: true, force: true })
    })

    const result = await restartBroker({
      paths,
      daemonEntry: join(repositoryRoot, 'dist', 'broker-daemon.mjs'),
    })

    expect(result.restarted).toBe(true)
    expect(result.staleRecovered).toBe(false)
    expect(result.previousRecord?.instanceId).toBe(previous.record.instanceId)
    expect(result.record.instanceId).not.toBe(previous.record.instanceId)
    expect(result.record.protocol).toEqual(BROKER_PROTOCOL_VERSION)
    expect((await getBrokerStatus(result.record)).sessionCount).toBe(0)
  }, 20_000)

  it('starts from absence through restart and reports that no live owner was replaced', async ({ onTestFinished }) => {
    requireBuiltBroker()
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-restart-absent-'))
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    onTestFinished(async () => {
      await cleanupDaemonBroker(paths)
      await rm(fixture, { recursive: true, force: true })
    })

    const result = await restartBroker({
      paths,
      daemonEntry: join(repositoryRoot, 'dist', 'broker-daemon.mjs'),
    })

    expect(result).toMatchObject({
      previousRecord: null,
      restarted: false,
      staleRecovered: false,
    })
    expect((await inspectBroker({ paths })).state).toBe('running')
  }, 20_000)

  it('recovers stale discovery through restart before starting a fresh Broker', async ({ onTestFinished }) => {
    requireBuiltBroker()
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-restart-stale-'))
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    const stale = discoveryRecord({
      pid: 2_147_483_000,
      processIdentity: 'dead-restart-owner',
    })
    await writeBrokerJsonAtomic(paths.discovery, stale)
    onTestFinished(async () => {
      await cleanupDaemonBroker(paths)
      await rm(fixture, { recursive: true, force: true })
    })

    const result = await restartBroker({
      paths,
      daemonEntry: join(repositoryRoot, 'dist', 'broker-daemon.mjs'),
    })

    expect(result).toMatchObject({
      previousRecord: expect.objectContaining({ instanceId: stale.instanceId }),
      restarted: false,
      staleRecovered: true,
    })
    expect(result.record.instanceId).not.toBe(stale.instanceId)
    expect((await inspectBroker({ paths })).state).toBe('running')
  }, 20_000)

  it('returns one canonical session token for concurrent registration of the same checkout', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-register-race-'))
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    const repository = join(fixture, 'repository')
    await initializeGitRepository(repository, 'register-race-fixture')
    const handle = await startBrokerServer({ paths, packageVersion: '0.0.0-register-race-fixture' })
    onTestFinished(async () => {
      await handle.close()
      await rm(fixture, { recursive: true, force: true })
    })

    const registrations = await Promise.all(
      Array.from({ length: 24 }, () => registerBrokerProject(handle.record, repository)),
    )

    expect(new Set(registrations.map(registration => registration.project.projectId))).toHaveLength(1)
    expect(new Set(registrations.map(registration => registration.accessToken))).toHaveLength(1)
    expect(handle.sessions.sessionCount()).toBe(1)
    const results = await Promise.all(registrations.map(registration => brokerProjectRequest(
      registration,
      `/v1/projects/${registration.project.projectId}`,
    )))
    expect(results).toHaveLength(24)
    expect(results.every((result: any) => result.ok === true)).toBe(true)
  }, 20_000)

  it('reuses a healthy compatible Broker across package-version differences', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-compatible-'))
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    const handle = await startBrokerServer({
      paths,
      packageVersion: '0.0.0-compatible-fixture',
    })
    onTestFinished(async () => {
      await handle.close()
      await rm(fixture, { recursive: true, force: true })
    })

    const result = await startBroker({
      paths,
      daemonEntry: join(fixture, 'must-not-start.mjs'),
    })

    expect(result.reused).toBe(true)
    expect(result.record.instanceId).toBe(handle.record.instanceId)
    expect(result.record.packageVersion).toBe('0.0.0-compatible-fixture')
  })

  it('rejects an incompatible protocol major without starting a side-by-side Broker', async () => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-incompatible-'))
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    const handle = await startBrokerServer({
      paths,
      packageVersion: '0.0.0-incompatible-fixture',
      protocol: { major: BROKER_PROTOCOL_VERSION.major + 1, minor: 0 },
    })
    registerTestCleanup(async () => {
      await handle.close()
      await rm(fixture, { recursive: true, force: true })
    })
    const before = await readFile(paths.discovery, 'utf8')

    const inspection = await inspectBroker({ paths })
    expect(inspection.state).toBe('incompatible')
    expect(inspection.compatibility?.reason).toBe('protocol-major')
    await expect(startBroker({
      paths,
      daemonEntry: join(fixture, 'must-not-start.mjs'),
    })).rejects.toMatchObject({
      code: 'broker_incompatible',
    })
    await expect(startBroker({
      paths,
      daemonEntry: join(fixture, 'must-not-start.mjs'),
    })).rejects.toThrow(/rsp broker stop.*intended package version/u)
    await expect(restartBroker({
      paths,
      daemonEntry: join(fixture, 'must-not-start.mjs'),
    })).rejects.toMatchObject({
      code: 'broker_incompatible',
    })
    expect(await readFile(paths.discovery, 'utf8')).toBe(before)
    expect(handle.sessions.sessionCount()).toBe(0)
  })

  it('replaces an incompatible runtime schema when the verified control protocol major matches', async ({ onTestFinished }) => {
    requireBuiltBroker()
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-restart-runtime-schema-'))
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    const previous = await startBrokerServer({
      paths,
      packageVersion: '0.0.0-runtime-schema-fixture',
      runtimeSchema: {
        major: BROKER_RUNTIME_SCHEMA_VERSION.major + 1,
        minor: 0,
      },
    })
    onTestFinished(async () => {
      await cleanupDaemonBroker(paths)
      await previous.close()
      await rm(fixture, { recursive: true, force: true })
    })
    await expect(startBroker({
      paths,
      daemonEntry: join(fixture, 'must-not-start.mjs'),
    })).rejects.toMatchObject({ code: 'broker_incompatible' })

    const result = await restartBroker({
      paths,
      daemonEntry: join(repositoryRoot, 'dist', 'broker-daemon.mjs'),
    })

    expect(result.restarted).toBe(true)
    expect(result.previousRecord?.instanceId).toBe(previous.record.instanceId)
    expect(result.record.runtimeSchema).toEqual(BROKER_RUNTIME_SCHEMA_VERSION)
  }, 20_000)

  it('reports fresh startup failure after stopping the previous owner without starting side-by-side', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-restart-startup-failure-'))
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    const previous = await startBrokerServer({
      paths,
      packageVersion: '0.0.0-restart-failure-fixture',
    })
    onTestFinished(async () => {
      await previous.close()
      await rm(fixture, { recursive: true, force: true })
    })

    await expect(restartBroker({
      paths,
      daemonEntry: join(fixture, 'missing-daemon-entry.mjs'),
      startupTimeoutMs: 250,
    })).rejects.toMatchObject({
      code: 'broker_start_timeout',
    })
    expect((await inspectBroker({ paths })).state).toBe('absent')
  }, 20_000)

  it('removes dead discovery metadata without signaling a process', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-dead-'))
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    const currentIdentity = await processIdentityFor(process.pid)
    expect(currentIdentity).not.toBeNull()
    await writeBrokerJsonAtomic(paths.discovery, discoveryRecord({
      pid: 2_147_483_000,
      processIdentity: 'dead-process',
    }))
    const probed: number[] = []
    const processAdapter = {
      exists(pid: number) {
        probed.push(pid)
        return pid === process.pid
      },
      async identity(pid: number) {
        return pid === process.pid ? currentIdentity : null
      },
    }

    const result = await stopBroker({ paths, processAdapter })

    expect(result).toMatchObject({ stopped: false, staleRecovered: true })
    expect(probed).toContain(2_147_483_000)
    expect(existsSync(paths.discovery)).toBe(false)
  })

  it('clears reused-PID metadata without terminating the unrelated process', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-reused-pid-'))
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    const unrelated = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
      stdio: 'ignore',
    })
    onTestFinished(async () => {
      await terminateChild(unrelated)
      await rm(fixture, { recursive: true, force: true })
    })
    expect(unrelated.pid).toBeTypeOf('number')
    const identity = await waitForValue(
      () => processIdentityFor(unrelated.pid!),
      value => value !== null,
    )
    await writeBrokerJsonAtomic(paths.discovery, discoveryRecord({
      pid: unrelated.pid!,
      processIdentity: `${identity}-previous-owner`,
    }))

    const result = await stopBroker({ paths })

    expect(result).toMatchObject({ stopped: false, staleRecovered: true })
    expect(existsSync(paths.discovery)).toBe(false)
    expect(() => process.kill(unrelated.pid!, 0)).not.toThrow()
  })

  it('fails closed when a live PID identity cannot be observed', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-identity-unavailable-'))
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    const currentIdentity = await processIdentityFor(process.pid)
    expect(currentIdentity).not.toBeNull()
    const recordedPid = process.pid + 10_000
    await writeBrokerJsonAtomic(paths.discovery, discoveryRecord({
      pid: recordedPid,
      processIdentity: 'unavailable-owner',
    }))
    const processAdapter = {
      exists: () => true,
      async identity(pid: number) {
        return pid === process.pid ? currentIdentity : null
      },
    }

    const inspection = await inspectBroker({ paths, processAdapter })

    expect(inspection.state).toBe('unhealthy')
    await expect(stopBroker({ paths, processAdapter, startupTimeoutMs: 50 }))
      .rejects
      .toMatchObject({ code: 'broker_unhealthy' })
    expect(existsSync(paths.discovery)).toBe(true)
  })

  it('keeps repositories and worktrees isolated by identity, token, and namespace', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-projects-'))
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    const firstRepository = join(fixture, 'first')
    const secondRepository = join(fixture, 'second')
    const linkedWorktree = join(fixture, 'first-worktree')
    await initializeGitRepository(firstRepository, 'first')
    await initializeGitRepository(secondRepository, 'second')
    git(firstRepository, ['worktree', 'add', '-b', 'fixture-worktree', linkedWorktree])
    const handle = await startBrokerServer({ paths, packageVersion: '0.0.0-project-fixture' })
    onTestFinished(async () => {
      await handle.close()
      await rm(fixture, { recursive: true, force: true })
    })

    const first = await registerBrokerProject(handle.record, firstRepository)
    const second = await registerBrokerProject(handle.record, secondRepository)
    const worktree = await registerBrokerProject(handle.record, linkedWorktree)
    const projectIds = [first.project.projectId, second.project.projectId, worktree.project.projectId]
    const tokens = [first.accessToken, second.accessToken, worktree.accessToken]

    expect(new Set(projectIds)).toHaveLength(3)
    expect(new Set(tokens)).toHaveLength(3)
    expect(first.project.root).toBe(await realpath(firstRepository))
    expect(worktree.project.root).toBe(await realpath(linkedWorktree))
    const namespaces = [
      handle.sessions.namespaceFor(first.project.projectId, first.accessToken),
      handle.sessions.namespaceFor(second.project.projectId, second.accessToken),
      handle.sessions.namespaceFor(worktree.project.projectId, worktree.accessToken),
    ]
    expect(new Set(namespaces)).toHaveLength(3)
    expect(namespaces).toEqual(projectIds.map(projectId => brokerProjectNamespace(paths.projects, projectId)))
    expect(() => handle.sessions.namespaceFor(first.project.projectId, second.accessToken))
      .toThrow(/token is not valid/u)
    await expect(brokerProjectRequest(
      { ...first, accessToken: second.accessToken },
      `/v1/projects/${first.project.projectId}`,
    )).rejects.toMatchObject({ code: 'broker_project_unauthorized' })
    const exactOrigin = await brokerProjectRequest(
      first,
      `/v1/projects/${first.project.projectId}`,
      { origin: handle.record.endpoint },
    ) as Record<string, any>
    expect(exactOrigin.project.projectId).toBe(first.project.projectId)
    await expect(brokerProjectRequest(
      first,
      `/v1/projects/${first.project.projectId}`,
      { origin: 'http://127.0.0.1:1' },
    )).rejects.toMatchObject({ code: 'broker_origin_invalid' })
  }, 20_000)

  it('bounds project paths to the registered canonical checkout', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-paths-'))
    const repository = join(fixture, 'repository')
    const outside = join(fixture, 'outside')
    await initializeGitRepository(repository, 'path-fixture')
    await mkdir(outside)
    await writeFile(join(outside, 'secret.txt'), 'outside\n')
    await symlink(outside, join(repository, 'escape'))
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    const project = await discoverBrokerProject(repository)

    const valid = await resolveBrokerProjectPath(project, 'README.md')

    expect(valid.absolutePath).toBe(await realpath(join(repository, 'README.md')))
    await expect(resolveBrokerProjectPath(project, '../outside/secret.txt'))
      .rejects
      .toMatchObject({ code: 'broker_project_path_invalid' })
    await expect(resolveBrokerProjectPath(project, 'escape/secret.txt'))
      .rejects
      .toMatchObject({ code: 'broker_project_path_escape' })
    await expect(resolveBrokerProjectPath(project, '/etc/passwd'))
      .rejects
      .toMatchObject({ code: 'broker_project_path_invalid' })
  })

  it('authenticates SSE before headers and emits the initial project event', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-sse-'))
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    const repository = join(fixture, 'repository')
    await initializeGitRepository(repository, 'sse-fixture')
    const handle = await startBrokerServer({ paths, packageVersion: '0.0.0-sse-fixture' })
    onTestFinished(async () => {
      await handle.close()
      await rm(fixture, { recursive: true, force: true })
    })
    const connection = await registerBrokerProject(handle.record, repository)
    const url = `${handle.record.endpoint}/v1/projects/${connection.project.projectId}/events`

    const unauthorized = await fetch(url, {
      headers: {
        Authorization: 'Bearer wrong-token',
        Origin: handle.record.endpoint,
      },
    })
    expect(unauthorized.status).toBe(401)
    expect((await unauthorized.json() as Record<string, any>).error.code).toBe('broker_project_unauthorized')

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        Origin: handle.record.endpoint,
      },
      signal: AbortSignal.timeout(2_000),
    })
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/event-stream; charset=utf-8')
    const event = await readFirstSseEvent(response)
    expect(event.name).toBe('session-ready')
    expect(event.data).toMatchObject({
      type: 'session-ready',
      projectId: connection.project.projectId,
    })
  })

  it('unloads idle sessions while retaining the disposable project namespace', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-idle-'))
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    const repository = join(fixture, 'repository')
    await initializeGitRepository(repository, 'idle-fixture')
    let now = Date.parse('2026-08-08T00:00:00.000Z')
    const sessions = new BrokerProjectSessions(paths, 10, () => now)
    onTestFinished(async () => {
      sessions.close()
      await rm(fixture, { recursive: true, force: true })
    })
    const first = await sessions.register(repository)
    const namespace = sessions.namespaceFor(first.project.projectId, first.accessToken)

    now += 9
    expect(sessions.sweep()).toEqual([])
    now += 1
    expect(sessions.sweep()).toEqual([first.project.projectId])
    expect(sessions.sessionCount()).toBe(0)
    expect(existsSync(namespace)).toBe(true)

    const second = await sessions.register(repository)
    expect(second.project.projectId).toBe(first.project.projectId)
    expect(second.accessToken).not.toBe(first.accessToken)
  })

  it('keeps ordinary status, check, show, and non-starting Broker status cache-free', async ({ onTestFinished }) => {
    requireBuiltBroker()
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-one-shot-'))
    const project = join(fixture, 'project')
    const cacheRoot = join(fixture, 'broker-cache')
    await mkdir(project)
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    const environment = {
      ...process.env,
      RSP_BROKER_CACHE_HOME: cacheRoot,
    }
    for (const command of [
      { args: ['init'], status: 0 },
      { args: ['create', 'example', 'Example change'], status: 0 },
      { args: ['status', '--json'], status: 0 },
      { args: ['check', '--json'], status: 1 },
      { args: ['show', 'example', '--json'], status: 0 },
      { args: ['broker', 'status', '--json'], status: 0 },
    ]) {
      const result = spawnSync(process.execPath, [builtCli, ...command.args], {
        cwd: project,
        encoding: 'utf8',
        env: environment,
      })
      expect(result.status, result.stderr || result.stdout).toBe(command.status)
      expect(existsSync(cacheRoot), `cache created by rsp ${command.args.join(' ')}`).toBe(false)
    }
  }, 20_000)

  it('keeps portable cache, lock, process, and loopback adapters deterministic', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-adapters-'))
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    const currentIdentity = await processIdentityFor(process.pid)
    expect(currentIdentity).not.toBeNull()

    expect(resolveBrokerCacheRoot({
      env: { RSP_BROKER_CACHE_HOME: join(fixture, 'override'), XDG_CACHE_HOME: join(fixture, 'xdg') },
      homeDir: join(fixture, 'home'),
      platform: 'linux',
    })).toBe(resolve(fixture, 'override'))
    expect(resolveBrokerCacheRoot({
      env: { XDG_CACHE_HOME: join(fixture, 'xdg') },
      homeDir: join(fixture, 'home'),
      platform: 'linux',
    })).toBe(resolve(fixture, 'xdg', 'rsp', 'broker'))
    expect(resolveBrokerCacheRoot({
      env: { LOCALAPPDATA: join(fixture, 'local') },
      homeDir: join(fixture, 'home'),
      platform: 'win32',
    })).toBe(resolve(fixture, 'local', 'rsp', 'broker'))
    expect(resolveBrokerCacheRoot({
      env: {},
      homeDir: join(fixture, 'home'),
      platform: 'darwin',
    })).toBe(resolve(fixture, 'home', 'Library', 'Caches', 'rsp', 'broker'))
    expect(resolveBrokerCacheRoot({
      env: {},
      homeDir: join(fixture, 'home'),
      platform: 'linux',
    })).toBe(resolve(fixture, 'home', '.cache', 'rsp', 'broker'))
    expect(parseLoopbackEndpoint('http://127.0.0.1:43210')).toMatchObject({
      endpoint: 'http://127.0.0.1:43210',
      hostHeader: '127.0.0.1:43210',
      port: 43210,
    })
    expect(() => parseLoopbackEndpoint('http://localhost:43210')).toThrow(/exact loopback/u)
    expect(() => parseLoopbackEndpoint('https://127.0.0.1:43210')).toThrow(/exact loopback/u)

    await writeBrokerJsonAtomic(paths.startLock, {
      schema: 1,
      pid: 2_147_483_000,
      processIdentity: 'dead-lock-owner',
      token: randomUUID(),
      operation: 'fixture',
      acquiredAt: '2026-08-08T00:00:00.000Z',
    })
    const result = await withBrokerStartLock(paths, 'test', async () => {
      expect(existsSync(paths.startLock)).toBe(true)
      return 'acquired'
    }, {
      processAdapter: {
        exists: pid => pid === process.pid,
        identity: async pid => pid === process.pid ? currentIdentity : null,
      },
      timeoutMs: 200,
      retryMs: 5,
    })
    expect(result).toBe('acquired')
    expect(existsSync(paths.startLock)).toBe(false)

    if (process.platform !== 'win32') {
      await writeBrokerJsonAtomic(paths.discovery, discoveryRecord())
      expect((await stat(paths.root)).mode & 0o777).toBe(0o700)
      expect((await stat(paths.discovery)).mode & 0o777).toBe(0o600)
    }
    expect(await processIdentityFor(process.pid)).toBe(currentIdentity)
  })

  it('publishes complete startup lock records atomically under a deterministic contender window', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-lock-publish-'))
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    let firstReadyResolve!: () => void
    let releaseFirstPublish!: () => void
    let secondAcquiredResolve!: () => void
    let releaseSecond!: () => void
    const firstReady = new Promise<void>(resolveReady => firstReadyResolve = resolveReady)
    const firstPublishGate = new Promise<void>(resolveGate => releaseFirstPublish = resolveGate)
    const secondAcquired = new Promise<void>(resolveAcquired => secondAcquiredResolve = resolveAcquired)
    const secondGate = new Promise<void>(resolveGate => releaseSecond = resolveGate)
    const order: string[] = []
    let pauseFirstPublication = true

    const first = withBrokerStartLock(paths, 'first', async () => {
      order.push('first')
      return 'first'
    }, {
      timeoutMs: 2_000,
      retryMs: 5,
      beforePublish: async () => {
        if (!pauseFirstPublication)
          return
        pauseFirstPublication = false
        firstReadyResolve()
        await firstPublishGate
      },
    })
    await firstReady
    expect(existsSync(paths.startLock)).toBe(false)

    const second = withBrokerStartLock(paths, 'second', async () => {
      order.push('second')
      secondAcquiredResolve()
      await secondGate
      return 'second'
    }, {
      timeoutMs: 2_000,
      retryMs: 5,
    })
    await secondAcquired
    const completeRecord = await readBrokerJson(paths.startLock)
    expect(completeRecord?.value).toMatchObject({ schema: 1, operation: 'second' })

    releaseFirstPublish()
    await delay(20)
    expect(order).toEqual(['second'])
    releaseSecond()
    await expect(Promise.all([first, second])).resolves.toEqual(['first', 'second'])
    expect(order).toEqual(['second', 'first'])
    expect(existsSync(paths.startLock)).toBe(false)
  })

  it('rejects a late daemon claim after its startup client dies and a retry owns discovery', async ({ onTestFinished }) => {
    requireBuiltBroker()
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-late-daemon-'))
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    const delayedEntry = join(fixture, 'delayed-daemon.mjs')
    const releasePath = join(fixture, 'release-daemon')
    const daemonPidPath = join(fixture, 'delayed-daemon.pid')
    const daemonEntryUrl = pathToFileURL(join(repositoryRoot, 'dist', 'broker-daemon.mjs')).href
    await writeFile(delayedEntry, [
      'import { existsSync } from "node:fs"',
      'import { writeFile } from "node:fs/promises"',
      `await writeFile(${JSON.stringify(daemonPidPath)}, String(process.pid))`,
      `while (!existsSync(${JSON.stringify(releasePath)}))`,
      '  await new Promise(resolve => setTimeout(resolve, 10))',
      `await import(${JSON.stringify(daemonEntryUrl)})`,
      '',
    ].join('\n'))
    const firstEnvironment: NodeJS.ProcessEnv = {
      ...process.env,
      RSP_BROKER_CACHE_HOME: paths.root,
      RSP_BROKER_DAEMON_ENTRY: delayedEntry,
    }
    const secondEnvironment: NodeJS.ProcessEnv = {
      ...process.env,
      RSP_BROKER_CACHE_HOME: paths.root,
    }
    delete secondEnvironment.RSP_BROKER_DAEMON_ENTRY
    const firstStarter = spawn(process.execPath, [builtCli, 'broker', 'start', '--json'], {
      cwd: fixture,
      env: firstEnvironment,
      stdio: 'ignore',
    })
    let delayedDaemonPid: number | null = null
    let delayedDaemonIdentity: string | null = null
    onTestFinished(async () => {
      await terminateChild(firstStarter)
      if (delayedDaemonPid && delayedDaemonIdentity
        && await processIdentityFor(delayedDaemonPid) === delayedDaemonIdentity) {
        process.kill(delayedDaemonPid, 'SIGKILL')
      }
      await cleanupDaemonBroker(paths)
      await rm(fixture, { recursive: true, force: true })
    })
    expect(firstStarter.pid).toBeTypeOf('number')
    const daemonPidText = await waitForValue(
      () => readFile(daemonPidPath, 'utf8').catch(() => ''),
      value => /^\d+$/u.test(value),
      3_000,
    )
    delayedDaemonPid = Number(daemonPidText)
    delayedDaemonIdentity = await waitForValue(
      () => processIdentityFor(delayedDaemonPid!),
      value => value !== null,
    )
    await waitForValue(
      async () => {
        const stored = await readBrokerJson(paths.startLock).catch(() => null)
        return stored && typeof stored.value === 'object' && stored.value !== null
          ? Number((stored.value as Record<string, unknown>).pid)
          : null
      },
      value => value === firstStarter.pid,
    )

    const firstExit = once(firstStarter, 'exit')
    firstStarter.kill('SIGKILL')
    await firstExit
    const retry = await runCli(['broker', 'start', '--json'], fixture, secondEnvironment)
    expect(retry.status, retry.stderr || retry.stdout).toBe(0)
    const retryOutput = JSON.parse(retry.stdout) as Record<string, any>
    const retryInstanceId = String(retryOutput.broker.instanceId)

    await writeFile(releasePath, 'release\n')
    await waitForValue(
      () => processIdentityFor(delayedDaemonPid!),
      value => value === null,
      5_000,
    )
    const inspection = await inspectBroker({ paths })
    expect(inspection.state).toBe('running')
    expect(inspection.record?.instanceId).toBe(retryInstanceId)
    await delay(100)
    expect((await inspectBroker({ paths })).record?.instanceId).toBe(retryInstanceId)
    expect(existsSync(paths.startLock)).toBe(false)
  }, 20_000)

  it('preserves replacement metadata created during identity-scoped cleanup', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-cleanup-race-'))
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    const original = discoveryRecord({ instanceId: randomUUID() })
    const replacement = discoveryRecord({ instanceId: randomUUID() })
    await writeBrokerJsonAtomic(paths.discovery, original)
    const inspected = await readBrokerJson(paths.discovery)
    expect(inspected).not.toBeNull()

    const removed = await unlinkBrokerFileIfIdentity(paths.discovery, inspected!.file, {
      afterQuarantine: () => writeBrokerJsonAtomic(paths.discovery, replacement),
    })

    expect(removed).toBe(true)
    const current = await readBrokerJson(paths.discovery)
    expect(parseBrokerDiscoveryRecord(current?.value).instanceId).toBe(replacement.instanceId)
  })

  it('bounds status projection and every JSON response before sending headers', async () => {
    const sessions: BrokerProjectSessionPublic[] = Array.from({ length: 128 }, (_, index) => ({
      projectId: index.toString(16).padStart(64, '0'),
      root: `/${'x'.repeat(140_000)}-${index}`,
      filesystem: {
        device: String(index + 1),
        inode: String(index + 1),
      },
      loadedAt: '2026-08-08T00:00:00.000Z',
      lastAccessAt: '2026-08-08T00:00:00.000Z',
    }))
    const status = createBrokerStatusResponse(discoveryRecord(), sessions)

    expect(status.sessionCount).toBe(sessions.length)
    expect(status.sessionsTruncated).toBe(true)
    expect(status.sessions.length).toBeLessThan(sessions.length)
    expect(encodeBrokerJsonResponse(status).byteLength).toBeLessThanOrEqual(BROKER_MAX_JSON_RESPONSE_BYTES)
    expect(() => encodeBrokerJsonResponse({ value: 'x'.repeat(BROKER_MAX_JSON_RESPONSE_BYTES) }))
      .toThrow(new RegExp(`response exceeds ${BROKER_MAX_JSON_RESPONSE_BYTES} bytes`, 'u'))

    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-status-contract-'))
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    const handle = await startBrokerServer({ paths, packageVersion: '0.0.0-status-contract' })
    registerTestCleanup(async () => {
      await handle.close()
      await rm(fixture, { recursive: true, force: true })
    })
    await expect(getBrokerStatus(handle.record)).resolves.toMatchObject({
      sessionCount: 0,
      sessions: [],
      sessionsTruncated: false,
    })
  })

  it('does not steal a startup lock whose live owner identity is unavailable', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-broker-lock-unknown-'))
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    const currentIdentity = await processIdentityFor(process.pid)
    expect(currentIdentity).not.toBeNull()
    await writeBrokerJsonAtomic(paths.startLock, {
      schema: 1,
      pid: process.pid + 20_000,
      processIdentity: 'unknown-live-owner',
      token: randomUUID(),
      operation: 'fixture',
      acquiredAt: '2026-08-08T00:00:00.000Z',
    })

    await expect(withBrokerStartLock(paths, 'test', async () => 'must-not-run', {
      processAdapter: {
        exists: () => true,
        identity: async pid => pid === process.pid ? currentIdentity : null,
      },
      timeoutMs: 30,
      retryMs: 5,
    })).rejects.toMatchObject({ code: 'broker_start_lock_timeout' })
    expect(existsSync(paths.startLock)).toBe(true)
  })
})

function requireBuiltBroker(): void {
  if (!existsSync(builtCli) || !existsSync(join(repositoryRoot, 'dist', 'broker-daemon.mjs')))
    throw new Error('Broker process tests require a fresh "pnpm run build" before Vitest')
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
    packageVersion: '0.0.0-fixture',
    controlToken: randomBytes(32).toString('base64url'),
    startedAt: '2026-08-08T00:00:00.000Z',
    ...overrides,
  }
}

async function initializeGitRepository(root: string, name: string): Promise<void> {
  await mkdir(root, { recursive: true })
  git(root, ['init', '-b', 'main'])
  git(root, ['config', 'user.name', 'RSP Test'])
  git(root, ['config', 'user.email', 'rsp-test@example.invalid'])
  await writeFile(join(root, 'README.md'), `# ${name}\n`)
  git(root, ['add', 'README.md'])
  git(root, ['commit', '-m', `test: initialize ${name}`])
}

function git(root: string, args: string[]): string {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

async function runCli(args: string[], cwd: string, env: NodeJS.ProcessEnv): Promise<CliResult> {
  const child = spawn(process.execPath, [builtCli, ...args], {
    cwd,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stdout?.setEncoding('utf8')
  child.stderr?.setEncoding('utf8')
  let stdout = ''
  let stderr = ''
  child.stdout?.on('data', chunk => stdout += chunk)
  child.stderr?.on('data', chunk => stderr += chunk)
  const [status] = await once(child, 'exit') as [number | null, NodeJS.Signals | null]
  return { status, stdout, stderr }
}

async function readFirstSseEvent(response: Response): Promise<{ name: string, data: Record<string, any> }> {
  if (!response.body)
    throw new Error('SSE response had no body')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let content = ''
  try {
    while (!content.includes('\n\n')) {
      const result = await reader.read()
      if (result.done)
        break
      content += decoder.decode(result.value, { stream: true })
    }
  }
  finally {
    await reader.cancel().catch(() => undefined)
  }
  const name = content.match(/^event: ([^\n]+)$/mu)?.[1]
  const data = content.match(/^data: (.+)$/mu)?.[1]
  if (!name || !data)
    throw new Error(`Invalid SSE event: ${content}`)
  return { name, data: JSON.parse(data) as Record<string, any> }
}

async function cleanupDaemonBroker(paths: BrokerPaths): Promise<void> {
  const stored = await readBrokerJson(paths.discovery).catch(() => null)
  if (!stored)
    return
  let record: BrokerDiscoveryRecord
  try {
    record = parseBrokerDiscoveryRecord(stored.value)
  }
  catch {
    return
  }
  if (record.pid === process.pid)
    return
  try {
    await fetch(`${record.endpoint}/v1/control/stop`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${record.controlToken}`,
      },
      signal: AbortSignal.timeout(1_000),
    })
  }
  catch {
    // Fall through to exact process-identity cleanup.
  }
  await waitForValue(
    async () => await processIdentityFor(record.pid),
    identity => identity === null || identity !== record.processIdentity,
    2_000,
  ).catch(() => undefined)
  const identity = await processIdentityFor(record.pid)
  if (identity !== record.processIdentity)
    return
  process.kill(record.pid, 'SIGTERM')
  await waitForValue(
    async () => await processIdentityFor(record.pid),
    value => value === null,
    1_000,
  ).catch(() => undefined)
  if (await processIdentityFor(record.pid) === record.processIdentity)
    process.kill(record.pid, 'SIGKILL')
}

async function terminateChild(child: ChildProcess): Promise<void> {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null)
    return
  const exited = once(child, 'exit')
  child.kill('SIGTERM')
  const didExit = await Promise.race([
    exited.then(() => true),
    delay(1_000).then(() => false),
  ])
  if (didExit)
    return
  child.kill('SIGKILL')
  await once(child, 'exit')
}

async function waitForValue<T>(
  read: () => Promise<T>,
  accepts: (value: T) => boolean,
  timeoutMs = 3_000,
): Promise<T> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const value = await read()
    if (accepts(value))
      return value
    await delay(20)
  }
  throw new BrokerError('broker_test_timeout', 'Timed out waiting for Broker test state')
}

function delay(milliseconds: number): Promise<void> {
  return new Promise(resolveDelay => setTimeout(resolveDelay, milliseconds))
}
