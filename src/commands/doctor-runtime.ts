import type { BigIntStats } from 'node:fs'
import type { FileHandle } from 'node:fs/promises'
import type { BrokerInspection } from '../broker/client.js'
import type { RuntimeDatabaseInspection } from '../runtime/model.js'
import type { RuntimeDiagnostic as CommandRuntimeDiagnostic } from '../types.js'
import { Buffer } from 'node:buffer'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { constants } from 'node:fs'
import { lstat, open, realpath } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'

import { inspectBroker } from '../broker/client.js'
import { resolveBrokerPaths } from '../broker/host.js'
import { brokerProjectNamespace, discoverBrokerProject } from '../broker/project.js'
import {
  inspectRuntimeContextPackets,
  inspectRuntimeDatabase,
} from '../runtime/store.js'

const MAX_DOCTOR_SOURCE_BYTES = 512 * 1024
const READ_NO_FOLLOW_FLAGS = constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)

export interface DoctorRuntimeCheck {
  status: 'ok' | 'issue' | 'info'
  code: string
  label: string
  message?: string
  hint?: string
}

export interface DoctorRuntimeInspection {
  checks: DoctorRuntimeCheck[]
  runtime: CommandRuntimeDiagnostic[]
}

export async function inspectDoctorRuntime(options: {
  platform?: NodeJS.Platform
} = {}): Promise<DoctorRuntimeInspection> {
  const checks: DoctorRuntimeCheck[] = []
  const runtime: CommandRuntimeDiagnostic[] = []
  const paths = resolveBrokerPaths()
  const broker = await inspectBroker({ paths })
  checks.push(brokerCheck(broker))

  let project
  try {
    project = await discoverBrokerProject()
  }
  catch {
    checks.push(await runtimeCachePermissionCheck(paths, null, options.platform ?? process.platform))
    checks.push({
      status: 'info',
      code: 'runtime_project_unavailable',
      label: 'checkout-scoped runtime cache is inspectable',
      message: 'Current directory is not inside one exact Git checkout, so no Broker project identity or runtime namespace was guessed.',
      hint: 'Repository doctor checks remain available. Initialize Git before using optional Broker or runtime capabilities.',
    })
    return { checks, runtime }
  }

  const namespacePath = brokerProjectNamespace(paths.projects, project.projectId)
  checks.push(await runtimeCachePermissionCheck(paths, namespacePath, options.platform ?? process.platform))
  const unsafeCachePath = await findUnsafeCachePath([
    { path: paths.root, label: 'Broker cache root' },
    { path: paths.projects, label: 'Broker projects root' },
    { path: namespacePath, label: 'current checkout runtime namespace' },
  ])
  if (unsafeCachePath) {
    checks.push({
      status: 'issue',
      code: 'runtime_cache_path_invalid',
      label: 'checkout-scoped runtime cache path is safe',
      message: `Runtime cache path is not a real directory: ${unsafeCachePath}`,
      hint: 'Preserve the cache for diagnostics. Replace the unsupported path explicitly; do not delete the cache root or follow a symlink.',
    })
    return { checks, runtime }
  }

  const database = await inspectRuntimeDatabase(namespacePath, project)
  checks.push(runtimeDatabaseCheck(database, namespacePath))
  if (database.state !== 'ready')
    return { checks, runtime }

  const gitHead = currentGitHead(project.root)
  if (!gitHead) {
    checks.push({
      status: 'info',
      code: 'runtime_context_git_unavailable',
      label: 'runtime context packet freshness is inspectable',
      message: 'Current Git HEAD could not be read, so retained context packets were not classified as fresh.',
      hint: 'Restore Git inspection, then rerun rsp doctor. Context packets remain disposable and non-authoritative.',
    })
    return { checks, runtime }
  }

  try {
    const contexts = await inspectRuntimeContextPackets({
      namespacePath,
      project,
      currentGitHead: gitHead,
      sourceHash: path => hashCurrentProjectFile(project.root, path),
    })
    if (contexts.total === 0) {
      checks.push({
        status: 'ok',
        code: 'runtime_context_absent',
        label: 'runtime context packets are absent or disposable',
        message: 'No retained context packets exist for this checkout.',
      })
      return { checks, runtime }
    }

    const stale = contexts.records.filter(record => record.state === 'stale')
    const fresh = contexts.records.filter(record => record.state === 'fresh')
    if (fresh.length > 0) {
      checks.push({
        status: 'ok',
        code: 'runtime_context_fresh',
        label: 'runtime context packet bounded freshness checks pass',
        message: `${fresh.length} retained context packet(s) match current checkout, Git, committed sequence, schema, expiry, and bounded source hashes.`,
        hint: 'Resume still revalidates dirty-path and authority aggregate identities. Every packet remains disposable and non-authoritative.',
      })
    }
    if (stale.length > 0) {
      checks.push({
        status: 'info',
        code: 'runtime_context_stale',
        label: 'stale runtime context packets are disposable',
        message: stale
          .slice(0, 5)
          .map(record => `${record.workRef}/${record.packetKey}: ${record.reasons.join(', ')}`)
          .join('; '),
        hint: runtimeDisposalHint(),
      })
    }
    if (contexts.hasMore) {
      checks.push({
        status: 'info',
        code: 'runtime_context_truncated',
        label: 'runtime context packet inspection is bounded',
        message: `${contexts.total - contexts.returned} additional retained context packet(s) were not listed.`,
        hint: 'Context remains non-authoritative; inspect or dispose only this exact checkout namespace explicitly.',
      })
    }
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    runtime.push({
      code: 'runtime_context_inspection_failed',
      operation: 'inspectRuntimeContextPackets',
      path: 'current checkout runtime namespace',
      message: redactRuntimePath(message, namespacePath),
    })
    checks.push({
      status: 'issue',
      code: 'runtime_context_inspection_failed',
      label: 'runtime context packet freshness is inspectable',
      message: redactRuntimePath(message, namespacePath),
      hint: runtimeDisposalHint(),
    })
  }
  return { checks, runtime }
}

function brokerCheck(inspection: BrokerInspection): DoctorRuntimeCheck {
  if (inspection.state === 'absent') {
    return {
      status: 'ok',
      code: 'broker_absent',
      label: 'optional Broker is absent or healthy',
      message: 'Broker is absent; one-shot repository inspection and migration remain available.',
    }
  }
  if (inspection.state === 'running') {
    return {
      status: 'ok',
      code: 'broker_healthy',
      label: 'optional Broker is absent or healthy',
      message: `Broker is healthy and compatible at protocol ${inspection.record!.protocol.major}.${inspection.record!.protocol.minor} with runtime schema ${inspection.record!.runtimeSchema.major}.${inspection.record!.runtimeSchema.minor}.`,
    }
  }
  if (inspection.state === 'stale') {
    return {
      status: 'issue',
      code: 'broker_stale',
      label: 'optional Broker discovery is current',
      message: inspection.reason ?? 'Broker discovery metadata is stale.',
      hint: 'Run: rsp broker stop --json. It removes only the identity-verified stale discovery record and does not signal a dead or reused PID; then rerun rsp doctor.',
    }
  }
  if (inspection.state === 'incompatible') {
    const version = inspection.record?.packageVersion
    return {
      status: 'issue',
      code: 'broker_incompatible',
      label: 'optional Broker is compatible',
      message: inspection.reason ?? 'Broker protocol or runtime schema is incompatible.',
      hint: version
        ? `Run: npx -y @oevery/rsp@${version} broker stop --json, then rerun the intended package's rsp doctor. Do not start a side-by-side Broker.`
        : 'Use the package compatible with the running Broker to stop it cooperatively, then rerun the intended package. Do not signal the PID manually.',
    }
  }
  return {
    status: 'issue',
    code: inspection.state === 'invalid' ? 'broker_invalid' : 'broker_unhealthy',
    label: 'optional Broker discovery is healthy',
    message: inspection.reason ?? `Broker discovery is ${inspection.state}.`,
    hint: 'Preserve discovery metadata for diagnostics. Restore the exact owner/endpoint or stop it with a compatible package; do not delete the cache root or signal a PID manually.',
  }
}

function runtimeDatabaseCheck(
  inspection: RuntimeDatabaseInspection,
  namespacePath: string,
): DoctorRuntimeCheck {
  if (inspection.state === 'absent') {
    return {
      status: 'ok',
      code: 'runtime_absent',
      label: 'checkout runtime database is absent or compatible',
      message: 'No runtime database exists for this exact checkout; repository truth remains fully available.',
    }
  }
  if (inspection.state === 'ready') {
    return {
      status: 'ok',
      code: 'runtime_healthy',
      label: 'checkout runtime database is absent or compatible',
      message: `Runtime database schema ${inspection.schema!.major}.${inspection.schema!.version} is healthy for this exact checkout.`,
    }
  }
  const diagnostic = inspection.diagnostic
  return {
    status: 'issue',
    code: diagnostic?.code ?? `runtime_${inspection.state}`,
    label: 'checkout runtime database is compatible and healthy',
    message: redactRuntimePath(
      diagnostic?.message ?? `Runtime database is ${inspection.state}.`,
      namespacePath,
    ),
    hint: [
      diagnostic?.action,
      runtimeDisposalHint(),
    ].filter(Boolean).join(' '),
  }
}

function runtimeDisposalHint(): string {
  return 'Preserve diagnostics and stop the exact Broker/session first. If disposal is explicitly authorized, import resolveRuntimeDisposalTarget() and disposeRuntimeDatabase() from @oevery/rsp/dist/runtime-store.mjs; derive the current checkout disposal target, then pass that exact target back without printing or guessing cache roots, tokens, or another project identity. Never hand-delete runtime files.'
}

async function findUnsafeCachePath(paths: Array<{ path: string, label: string }>): Promise<string | null> {
  for (const candidate of paths) {
    try {
      const value = await lstat(candidate.path)
      if (!value.isDirectory() || value.isSymbolicLink())
        return candidate.label
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
        return candidate.label
    }
  }
  return null
}

async function runtimeCachePermissionCheck(
  paths: ReturnType<typeof resolveBrokerPaths>,
  namespacePath: string | null,
  platform: NodeJS.Platform,
): Promise<DoctorRuntimeCheck> {
  if (platform === 'win32') {
    return {
      status: 'info',
      code: 'runtime_cache_permissions_skipped',
      label: 'optional runtime cache permissions use platform semantics',
      message: 'POSIX mode checks are not applicable on Windows.',
    }
  }

  const candidates: Array<{
    path: string
    label: string
    kind: 'directory' | 'file'
    allowed: number
  }> = [
    { path: paths.root, label: 'Broker cache root', kind: 'directory', allowed: 0o700 },
    { path: paths.projects, label: 'Broker projects root', kind: 'directory', allowed: 0o700 },
    { path: paths.discovery, label: 'Broker discovery file', kind: 'file', allowed: 0o600 },
    { path: paths.startLock, label: 'Broker start lock', kind: 'file', allowed: 0o600 },
  ]
  if (namespacePath) {
    const databasePath = runtimeDatabasePathForDoctor(namespacePath)
    candidates.push(
      { path: namespacePath, label: 'current checkout runtime namespace', kind: 'directory', allowed: 0o700 },
      { path: databasePath, label: 'current checkout runtime database', kind: 'file', allowed: 0o600 },
      { path: `${databasePath}-wal`, label: 'current checkout runtime WAL', kind: 'file', allowed: 0o600 },
      { path: `${databasePath}-shm`, label: 'current checkout runtime shared-memory sidecar', kind: 'file', allowed: 0o600 },
      { path: `${databasePath}-journal`, label: 'current checkout runtime journal', kind: 'file', allowed: 0o600 },
    )
  }

  const violations: string[] = []
  for (const candidate of candidates) {
    let value
    try {
      value = await lstat(candidate.path)
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT')
        continue
      continue
    }
    if ((candidate.kind === 'directory' && !value.isDirectory())
      || (candidate.kind === 'file' && !value.isFile())
      || value.isSymbolicLink()) {
      continue
    }
    const mode = value.mode & 0o777
    if ((mode & ~candidate.allowed) !== 0)
      violations.push(`${candidate.label} mode ${mode.toString(8).padStart(3, '0')}`)
  }
  if (violations.length > 0) {
    return {
      status: 'issue',
      code: 'runtime_cache_permissions_unsafe',
      label: 'optional runtime cache permissions are private',
      message: violations.slice(0, 8).join('; '),
      hint: 'Restrict the named directory to at most 0700 or file to at most 0600 using an explicit owner-approved host operation, then rerun rsp doctor. Doctor is read-only and never changes modes.',
    }
  }
  return {
    status: 'ok',
    code: 'runtime_cache_permissions_private',
    label: 'optional runtime cache permissions are private',
    message: 'Every existing inspected cache directory is at most 0700 and every inspected metadata/runtime file is at most 0600.',
  }
}

function runtimeDatabasePathForDoctor(namespacePath: string): string {
  return resolve(namespacePath, 'runtime-v1.sqlite')
}

function redactRuntimePath(message: string, namespacePath: string): string {
  const normalizedNamespace = resolve(namespacePath)
  return message
    .replaceAll(`${normalizedNamespace}${sep}`, '')
    .replaceAll(normalizedNamespace, 'current checkout runtime namespace')
}

function currentGitHead(root: string): string | null {
  const result = spawnSync('git', ['-C', root, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024,
  })
  return result.status === 0 ? result.stdout.trim() || null : null
}

async function hashCurrentProjectFile(
  projectRoot: string,
  projectRelativePath: string,
): Promise<string | null> {
  if (!projectRelativePath
    || projectRelativePath.includes('\0')
    || projectRelativePath.includes('\\')
    || isAbsolute(projectRelativePath)) {
    return null
  }
  const segments = projectRelativePath.split('/')
  if (segments.some(segment => !segment || segment === '.' || segment === '..'))
    return null
  const root = resolve(projectRoot)
  const path = resolve(root, ...segments)
  const rel = relative(root, path)
  if (rel === '' || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel))
    return null

  let before: BigIntStats
  let realRoot: string
  try {
    before = await lstat(path, { bigint: true })
    realRoot = await realpath(root)
    const realPath = await realpath(path)
    if (!before.isFile() || before.isSymbolicLink() || !isContained(realRoot, realPath))
      return null
  }
  catch {
    return null
  }

  let handle: FileHandle
  try {
    handle = await open(path, READ_NO_FOLLOW_FLAGS)
  }
  catch {
    return null
  }
  try {
    const opened = await handle.stat({ bigint: true })
    if (!sameSnapshot(before, opened) || opened.size > BigInt(MAX_DOCTOR_SOURCE_BYTES))
      return null
    const buffer = Buffer.allocUnsafe(MAX_DOCTOR_SOURCE_BYTES + 1)
    let bytes = 0
    while (bytes < buffer.length) {
      const result = await handle.read(buffer, bytes, buffer.length - bytes, bytes)
      if (result.bytesRead === 0)
        break
      bytes += result.bytesRead
    }
    const after = await handle.stat({ bigint: true })
    if (bytes > MAX_DOCTOR_SOURCE_BYTES
      || !sameSnapshot(opened, after)
      || after.size !== BigInt(bytes)) {
      return null
    }
    const finalRealRoot = await realpath(root)
    const finalRealPath = await realpath(path)
    const finalPath = await lstat(path, { bigint: true })
    if (finalRealRoot !== realRoot
      || !isContained(finalRealRoot, finalRealPath)
      || !sameSnapshot(after, finalPath)) {
      return null
    }
    return createHash('sha256').update(buffer.subarray(0, bytes)).digest('hex')
  }
  finally {
    await handle.close()
  }
}

function isContained(root: string, path: string): boolean {
  const candidate = relative(root, path)
  return candidate !== ''
    && candidate !== '..'
    && !candidate.startsWith(`..${sep}`)
    && !isAbsolute(candidate)
}

function sameSnapshot(
  left: Pick<BigIntStats, 'dev' | 'ino' | 'size' | 'mtimeNs' | 'ctimeNs'>,
  right: Pick<BigIntStats, 'dev' | 'ino' | 'size' | 'mtimeNs' | 'ctimeNs'>,
): boolean {
  return left.dev === right.dev
    && left.ino === right.ino
    && left.size === right.size
    && left.mtimeNs === right.mtimeNs
    && left.ctimeNs === right.ctimeNs
}
