#!/usr/bin/env node

import { execFile, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createWriteStream, existsSync } from 'node:fs'
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { isAbsolute, join, resolve } from 'node:path'
import { Transform, Writable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { parse, stringify } from 'yaml'

const execFileAsync = promisify(execFile)

export const UPSTREAM_MANIFEST_PATH = 'upstreams.yaml'
export const UPSTREAM_LOCK_PATH = 'upstreams.lock'
export const UPSTREAM_CACHE_DIR = join('.cache', 'upstreams')
export const UPSTREAM_DISTILLATION_CACHE_DIR = join('.cache', 'upstream-distillation')
export const UPSTREAM_RESEARCH_DIR = join('research', 'upstreams')

const SOURCE_ID_RE = /^[a-z0-9][a-z0-9-]*$/
const REF_RE = /^\w[\w./-]*$/
const GIT_OBJECT_RE = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/
const VALID_TIERS = new Set(['core', 'reference'])
const VALID_STRATEGIES = new Set(['conform', 'model', 'adapt', 'tooling'])
const RESERVED_SELECTORS = new Set(['all', ...VALID_TIERS])
const ACTIONS = new Set(['sync', 'status', 'diff', 'prepare', 'accept'])
const GIT_TIMEOUT_MS = 60_000

/** Load and validate the compact upstream source registry. */
export async function loadUpstreamManifest(root = process.cwd()) {
  const path = join(root, UPSTREAM_MANIFEST_PATH)
  if (!existsSync(path))
    throw new Error(`Missing ${UPSTREAM_MANIFEST_PATH}. Add a versioned upstream source registry first.`)

  const parsed = parseYaml(await readFile(path, 'utf8'))
  if (parsed.version !== 1)
    throw new Error(`${UPSTREAM_MANIFEST_PATH} version must be 1`)
  if (!isRecord(parsed.sources))
    throw new Error(`${UPSTREAM_MANIFEST_PATH} sources must be a mapping`)

  const sources = {}
  for (const [id, value] of Object.entries(parsed.sources)) {
    if (!SOURCE_ID_RE.test(id) || RESERVED_SELECTORS.has(id))
      throw new Error(`Invalid upstream source id "${id}"; use a non-reserved lowercase kebab-case id`)
    if (!isRecord(value))
      throw new Error(`Upstream source "${id}" must be a mapping`)

    const repository = requiredString(value.repository, `${id}.repository`)
    if (!repository.startsWith('https://') && !isAbsolute(repository))
      throw new Error(`${id}.repository must be an HTTPS URL or absolute local path`)

    const ref = requiredString(value.ref, `${id}.ref`)
    if (!REF_RE.test(ref) || ref.includes('..') || ref.includes('@{'))
      throw new Error(`Invalid tracked ref for upstream source "${id}"`)

    const tier = requiredString(value.tier, `${id}.tier`)
    if (!VALID_TIERS.has(tier))
      throw new Error(`Unsupported tier "${tier}" for upstream source "${id}"`)

    const strategy = requiredString(value.strategy, `${id}.strategy`)
    if (!VALID_STRATEGIES.has(strategy))
      throw new Error(`Unsupported strategy "${strategy}" for upstream source "${id}"`)

    sources[id] = {
      repository,
      ref,
      tier,
      strategy,
      paths: stringArray(value.paths, `${id}.paths`, ['**']),
    }
  }

  return { version: 1, sources }
}

/** Load accepted revisions, returning an empty lock when absent. */
export async function loadUpstreamLock(root = process.cwd()) {
  const path = join(root, UPSTREAM_LOCK_PATH)
  if (!existsSync(path))
    return { version: 1, revisions: {} }

  const parsed = parseYaml(await readFile(path, 'utf8'))
  if (parsed.version !== 1 || !isRecord(parsed.revisions))
    throw new Error(`${UPSTREAM_LOCK_PATH} must contain version 1 and a revisions mapping`)

  const revisions = {}
  for (const [id, value] of Object.entries(parsed.revisions)) {
    if (!SOURCE_ID_RE.test(id))
      throw new Error(`Invalid lock entry for upstream source "${id}"`)
    revisions[id] = gitObjectString(value, `${id}.revision`)
  }
  return { version: 1, revisions }
}

/** Clone or fetch synchronized candidates without changing upstreams.lock. */
export async function syncUpstreams(options = {}) {
  const root = options.root ?? process.cwd()
  const manifest = await loadUpstreamManifest(root)
  const selected = selectSources(manifest, options.selector)
  await mkdir(join(root, UPSTREAM_CACHE_DIR), { recursive: true })

  for (const [id, source] of selected)
    await syncSource(root, id, source)

  return getUpstreamStatus({ root, selector: options.selector })
}

/** Report accepted and synchronized candidate revisions without network access. */
export async function getUpstreamStatus(options = {}) {
  const root = options.root ?? process.cwd()
  const manifest = await loadUpstreamManifest(root)
  const lock = await loadUpstreamLock(root)
  const selected = selectSources(manifest, options.selector)
  const statuses = []

  for (const [id, source] of selected) {
    const cachePath = join(root, UPSTREAM_CACHE_DIR, id)
    const acceptedCommit = lock.revisions[id] ?? null
    if (!existsSync(cachePath)) {
      statuses.push(await statusResult(root, id, source, cachePath, 'missing', acceptedCommit, null))
      continue
    }

    await assertGitCheckout(cachePath, id)
    const candidateCommit = await readCandidate(cachePath, id)
    statuses.push(await statusResult(
      root,
      id,
      source,
      cachePath,
      candidateCommit ? 'ready' : 'unsynced',
      acceptedCommit,
      candidateCommit,
    ))
  }

  return statuses
}

/** Diff accepted revisions against synchronized candidates in declared paths. */
export async function diffUpstreams(options = {}) {
  const root = options.root ?? process.cwd()
  const manifest = await loadUpstreamManifest(root)
  const selected = selectSources(manifest, options.selector)
  const statuses = new Map((await getUpstreamStatus({ root, selector: options.selector })).map(status => [status.source, status]))
  const results = []

  for (const [id, source] of selected) {
    const status = statuses.get(id)
    if (!status?.candidateCommit) {
      results.push(diffUnavailable(id, status, 'candidate is missing; run sync first'))
      continue
    }
    if (!status.acceptedCommit) {
      results.push(diffUnavailable(id, status, 'source has no accepted revision; run accept after review'))
      continue
    }

    const pathspecs = source.paths.map(pattern => `:(glob)${pattern}`)
    const output = await runGit(status.cachePath, [
      'diff',
      '--no-ext-diff',
      '--no-textconv',
      '--no-color',
      options.patch ? '--patch' : '--stat',
      `${status.acceptedCommit}..${status.candidateCommit}`,
      '--',
      ...pathspecs,
    ])
    results.push({
      source: id,
      acceptedCommit: status.acceptedCommit,
      candidateCommit: status.candidateCommit,
      available: true,
      output,
      reason: null,
    })
  }

  return results
}

/** Prepare deterministic evidence and a tracked semantic-distillation draft for one source. */
export async function prepareUpstream(options = {}) {
  const root = options.root ?? process.cwd()
  const sourceId = requiredString(options.source, 'prepare.source')
  const manifest = await loadUpstreamManifest(root)
  const source = manifest.sources[sourceId]
  if (!source)
    throw new Error(`Unknown upstream source "${sourceId}"`)

  const [status] = await getUpstreamStatus({ root, selector: sourceId })
  if (!status?.candidateCommit)
    throw new Error(`Upstream source "${sourceId}" has no synchronized candidate; run sync first`)
  if (status.unmatchedPaths.length > 0)
    throw new Error(`Upstream source "${sourceId}" has required paths with no candidate files: ${status.unmatchedPaths.join(', ')}`)
  if (options.initial && status.acceptedCommit && status.acceptedCommit !== status.candidateCommit)
    throw new Error(`Upstream source "${sourceId}" has a pending candidate; prepare it without --initial`)
  if (!options.initial && status.acceptedCommit === status.candidateCommit)
    throw new Error(`Upstream source "${sourceId}" has no pending candidate; use --initial for baseline distillation`)
  if (!options.initial && !status.acceptedCommit)
    throw new Error(`Upstream source "${sourceId}" has no accepted baseline; use --initial`)

  const baseCommit = options.initial ? null : status.acceptedCommit
  const evidenceDir = join(root, UPSTREAM_DISTILLATION_CACHE_DIR, sourceId, status.candidateCommit)
  const reportDir = join(root, UPSTREAM_RESEARCH_DIR, sourceId)
  const evidencePath = join(evidenceDir, 'evidence.json')
  const reportPath = join(reportDir, `${status.candidateCommit}.md`)

  await mkdir(evidenceDir, { recursive: true })
  await mkdir(reportDir, { recursive: true })
  const evidence = await buildDistillationEvidence(
    sourceId,
    source,
    status.cachePath,
    baseCommit,
    status.candidateCommit,
    join(evidenceDir, 'diff.patch'),
  )
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`)
  await writeFile(join(evidenceDir, 'files.txt'), evidence.changed_files.length > 0 ? `${evidence.changed_files.join('\n')}\n` : '')
  await writeFile(join(evidenceDir, 'diff.stat'), evidence.diff_stat ? `${evidence.diff_stat}\n` : '')

  let created = false
  try {
    await writeFile(reportPath, sourceDistillationTemplate(evidence), { flag: 'wx' })
    created = true
  }
  catch (error) {
    if (error.code !== 'EEXIST')
      throw error
  }

  return {
    source: sourceId,
    strategy: source.strategy,
    baseCommit,
    candidateCommit: status.candidateCommit,
    evidenceHash: evidence.evidence_hash,
    evidencePath,
    reportPath,
    created,
  }
}

/** Explicitly accept synchronized candidate refs into the minimal lock. */
export async function acceptUpstreams(options = {}) {
  const root = options.root ?? process.cwd()
  const manifest = await loadUpstreamManifest(root)
  const selected = selectSources(manifest, options.selector)
  const currentLock = await loadUpstreamLock(root)
  const lock = options.selector === 'all' ? { version: 1, revisions: {} } : currentLock
  const statuses = new Map((await getUpstreamStatus({ root, selector: options.selector })).map(status => [status.source, status]))

  for (const [id] of selected) {
    const status = statuses.get(id)
    if (!status?.candidateCommit)
      throw new Error(`Upstream source "${id}" has no synchronized candidate; run sync first`)
    await assertCleanCheckout(status.cachePath, id)
    if (status.pending)
      await validateSourceDistillation(root, id, manifest.sources[id], status)
    lock.revisions[id] = status.candidateCommit
  }

  await writeUpstreamLock(root, lock)
  return getUpstreamStatus({ root, selector: options.selector })
}

async function validateSourceDistillation(root, sourceId, source, status) {
  const evidence = await buildDistillationEvidence(
    sourceId,
    source,
    status.cachePath,
    status.acceptedCommit,
    status.candidateCommit,
  )
  const reportPath = join(root, UPSTREAM_RESEARCH_DIR, sourceId, `${status.candidateCommit}.md`)
  if (!existsSync(reportPath))
    throw new Error(`Missing source distillation for upstream source "${sourceId}"; run prepare first`)

  const { metadata, body } = parseMarkdownFrontmatter(await readFile(reportPath, 'utf8'), reportPath)
  if (metadata.status !== 'complete')
    throw new Error(`Source distillation status must be complete for upstream source "${sourceId}"`)

  const expected = {
    source: sourceId,
    revision: status.candidateCommit,
    base: status.acceptedCommit,
    strategy: source.strategy,
    evidence_hash: evidence.evidence_hash,
  }
  for (const [field, value] of Object.entries(expected)) {
    if (metadata[field] !== value)
      throw new Error(`Source distillation ${field} does not match the synchronized candidate for upstream source "${sourceId}"`)
  }

  for (const heading of requiredReportHeadings(source.strategy)) {
    if (!body.includes(`## ${heading}`))
      throw new Error(`Source distillation is missing "## ${heading}" for upstream source "${sourceId}"`)
  }
  if (/\b(?:TODO|TBD)\b|\[(?:fill|placeholder)[^\]]*\]/i.test(body))
    throw new Error(`Source distillation contains unresolved placeholders for upstream source "${sourceId}"`)
}

async function syncSource(root, id, source) {
  const cachePath = join(root, UPSTREAM_CACHE_DIR, id)
  if (existsSync(cachePath)) {
    await assertGitCheckout(cachePath, id)
    await assertCleanCheckout(cachePath, id)
    const cachedRepository = await runGit(cachePath, ['remote', 'get-url', 'origin'])
    if (cachedRepository !== source.repository)
      throw new Error(`Managed cache repository changed for upstream source "${id}"; move or remove the cache before syncing`)
    await fetchCandidate(cachePath, id, source)
    return
  }

  const tempPath = `${cachePath}.tmp-${process.pid}`
  await rm(tempPath, { recursive: true, force: true })
  try {
    await runGit(root, ['clone', '--filter=blob:none', '--no-tags', '--no-checkout', source.repository, tempPath])
    await fetchCandidate(tempPath, id, source)
    await rename(tempPath, cachePath)
  }
  catch (error) {
    await rm(tempPath, { recursive: true, force: true })
    throw error
  }
}

async function fetchCandidate(cachePath, id, source) {
  await runGit(cachePath, ['fetch', '--prune', '--no-tags', 'origin', source.ref])
  const candidate = gitObjectString(await runGit(cachePath, ['rev-parse', 'FETCH_HEAD']), `${id}.candidate`)
  await runGit(cachePath, ['checkout', '--detach', '--force', candidate])
  await runGit(cachePath, ['update-ref', candidateRef(id), candidate])
}

async function readCandidate(cachePath, id) {
  try {
    return gitObjectString(await runGit(cachePath, ['rev-parse', '--verify', candidateRef(id)]), `${id}.candidate`)
  }
  catch {
    return null
  }
}

function candidateRef(id) {
  return `refs/rsp/upstreams/${id}/candidate`
}

async function statusResult(root, id, source, cachePath, cacheState, acceptedCommit, candidateCommit) {
  const pathCoverage = candidateCommit
    ? await buildPathCoverage(cachePath, candidateCommit, source.paths)
    : []
  const unmatchedPaths = pathCoverage.filter(entry => entry.matchedFiles === 0).map(entry => entry.pattern)
  const researchState = await readResearchState(root, id, source, acceptedCommit, candidateCommit)
  const pending = candidateCommit !== null && acceptedCommit !== candidateCommit
  return {
    source: id,
    repository: source.repository,
    ref: source.ref,
    tier: source.tier,
    strategy: source.strategy,
    cachePath,
    cacheState,
    acceptedCommit,
    candidateCommit,
    pending,
    pathCoverage,
    unmatchedPaths,
    researchState,
    nextAction: deriveNextAction(cacheState, acceptedCommit, pending, unmatchedPaths, researchState),
  }
}

async function buildPathCoverage(cachePath, candidateCommit, patterns) {
  const files = splitLines(await runGit(cachePath, ['ls-tree', '-r', '--name-only', candidateCommit]))
  return patterns.map(pattern => ({
    pattern,
    matchedFiles: files.filter(path => globPatternToRegExp(pattern).test(path)).length,
  }))
}

async function readResearchState(root, sourceId, source, acceptedCommit, candidateCommit) {
  if (!candidateCommit)
    return 'missing'
  const reportPath = join(root, UPSTREAM_RESEARCH_DIR, sourceId, `${candidateCommit}.md`)
  if (!existsSync(reportPath))
    return 'missing'

  try {
    const { metadata, body } = parseMarkdownFrontmatter(await readFile(reportPath, 'utf8'), reportPath)
    const expectedBase = acceptedCommit === candidateCommit ? metadata.base : acceptedCommit
    if (
      metadata.source !== sourceId
      || metadata.revision !== candidateCommit
      || metadata.base !== expectedBase
      || metadata.strategy !== source.strategy
      || !/^sha256:[0-9a-f]{64}$/.test(metadata.evidence_hash ?? '')
      || !['draft', 'complete'].includes(metadata.status)
    ) {
      return 'stale'
    }
    if (
      metadata.status === 'complete'
      && (
        requiredReportHeadings(source.strategy).some(heading => !body.includes(`## ${heading}`))
        || /\b(?:TODO|TBD)\b|\[(?:fill|placeholder)[^\]]*\]/i.test(body)
      )
    ) {
      return 'draft'
    }
    return metadata.status
  }
  catch {
    return 'stale'
  }
}

function deriveNextAction(cacheState, acceptedCommit, pending, unmatchedPaths, researchState) {
  if (cacheState !== 'ready')
    return 'sync'
  if (unmatchedPaths.length > 0)
    return 'fix-paths'
  if (researchState === 'missing')
    return acceptedCommit && pending ? 'prepare' : 'prepare-initial'
  if (researchState !== 'complete')
    return 'distill'
  return pending ? 'accept' : 'none'
}

function requiredReportHeadings(strategy) {
  const headings = ['Source Position', 'Extracted Mechanisms', 'Applicable to RSP', 'Rejected', 'Recommendations']
  if (['adapt', 'tooling'].includes(strategy))
    headings.push('License and Reuse')
  return headings
}

async function buildDistillationEvidence(sourceId, source, cachePath, baseCommit, candidateCommit, patchPath) {
  const pathCoverage = await buildPathCoverage(cachePath, candidateCommit, source.paths)
  const unmatchedPaths = pathCoverage.filter(entry => entry.matchedFiles === 0).map(entry => entry.pattern)
  if (unmatchedPaths.length > 0)
    throw new Error(`Upstream source "${sourceId}" has required paths with no candidate files: ${unmatchedPaths.join(', ')}`)
  const pathspecs = source.paths.map(pattern => `:(glob)${pattern}`)
  const rangeArgs = baseCommit ? [`${baseCommit}..${candidateCommit}`] : [candidateCommit]
  const changedFilesOutput = baseCommit
    ? await runGit(cachePath, ['diff', '--no-ext-diff', '--no-textconv', '--no-color', '--name-only', ...rangeArgs, '--', ...pathspecs])
    : filterPaths(
        splitLines(await runGit(cachePath, ['ls-tree', '-r', '--name-only', ...rangeArgs])),
        source.paths,
      ).join('\n')
  const diffStat = baseCommit
    ? await runGit(cachePath, ['diff', '--no-ext-diff', '--no-textconv', '--no-color', '--stat', ...rangeArgs, '--', ...pathspecs])
    : `${splitLines(changedFilesOutput).length} files in initial review scope`
  const patchArgs = ['diff', '--no-ext-diff', '--no-textconv', '--no-color', '--patch', ...rangeArgs, '--', ...pathspecs]
  const diffSha256 = baseCommit
    ? await hashGitOutput(cachePath, patchArgs, patchPath)
    : sha256('')
  if (!baseCommit && patchPath)
    await writeFile(patchPath, '')
  const hashInput = {
    version: 1,
    source: sourceId,
    repository: source.repository,
    strategy: source.strategy,
    base_revision: baseCommit,
    candidate_revision: candidateCommit,
    paths: source.paths,
    path_coverage: pathCoverage,
    changed_files: splitLines(changedFilesOutput),
    diff_sha256: `sha256:${diffSha256}`,
  }
  return {
    ...hashInput,
    diff_stat: diffStat,
    evidence_hash: `sha256:${sha256(JSON.stringify(hashInput))}`,
  }
}

function sourceDistillationTemplate(evidence) {
  const licenseSection = ['adapt', 'tooling'].includes(evidence.strategy)
    ? `
## License and Reuse
- TODO: Record the applicable license, reuse mode, attribution, and eligible source paths.
`
    : ''
  return `---
source: ${evidence.source}
revision: ${evidence.candidate_revision}
base: ${evidence.base_revision ?? 'null'}
strategy: ${evidence.strategy}
evidence_hash: ${evidence.evidence_hash}
status: draft
---

# Upstream Distillation: ${evidence.source}

## Source Position
- TODO: State the source's role and problem domain.

## Extracted Mechanisms
- TODO: Record mechanisms, models, or reusable assets supported by evidence.

## Applicable to RSP
- TODO: Tie each applicable mechanism to a concrete RSP problem or gap.

## Rejected
- TODO: Record relevant ideas that should not be adopted and why.
${licenseSection}

## Recommendations
- TODO: List research-backed options only; do not modify final RSP artifacts here.
`
}

function splitLines(value) {
  return value ? value.split('\n').filter(Boolean).sort() : []
}

function filterPaths(paths, patterns) {
  const matchers = patterns.map(globPatternToRegExp)
  return paths.filter(path => matchers.some(matcher => matcher.test(path)))
}

function globPatternToRegExp(pattern) {
  let result = '^'
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index]
    if (char === '*' && pattern[index + 1] === '*') {
      if (pattern[index + 2] === '/') {
        result += '(?:.*/)?'
        index += 2
      }
      else {
        result += '.*'
        index += 1
      }
    }
    else if (char === '*') {
      result += '[^/]*'
    }
    else if (char === '?') {
      result += '[^/]'
    }
    else {
      result += char.replace(/[.+^${}()|[\]\\]/g, '\\$&')
    }
  }
  return new RegExp(`${result}$`)
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

async function writeUpstreamLock(root, lock) {
  const revisions = {}
  for (const id of Object.keys(lock.revisions).sort())
    revisions[id] = lock.revisions[id]

  const path = join(root, UPSTREAM_LOCK_PATH)
  const content = stringify({ version: 1, revisions }, { lineWidth: 0 })
  if (existsSync(path) && await readFile(path, 'utf8') === content)
    return

  const tempPath = `${path}.tmp-${process.pid}`
  try {
    await writeFile(tempPath, content)
    await rename(tempPath, path)
  }
  finally {
    await rm(tempPath, { force: true })
  }
}

function selectSources(manifest, selector) {
  const entries = Object.entries(manifest.sources).sort(([left], [right]) => left.localeCompare(right))
  const effectiveSelector = selector ?? 'core'
  if (effectiveSelector === 'all')
    return entries
  if (VALID_TIERS.has(effectiveSelector))
    return entries.filter(([, source]) => source.tier === effectiveSelector)
  const selected = manifest.sources[effectiveSelector]
  if (!selected)
    throw new Error(`Unknown upstream source or tier "${effectiveSelector}"`)
  return [[effectiveSelector, selected]]
}

async function assertGitCheckout(cachePath, id) {
  try {
    const info = await stat(join(cachePath, '.git'))
    if (!info.isDirectory() && !info.isFile())
      throw new Error('not a Git checkout')
  }
  catch {
    throw new Error(`Managed cache for upstream source "${id}" is not a Git checkout: ${cachePath}`)
  }
}

async function assertCleanCheckout(cachePath, id) {
  const dirty = await runGit(cachePath, ['status', '--porcelain'])
  if (dirty)
    throw new Error(`Managed cache for upstream source "${id}" is dirty; remove local changes before continuing`)
}

async function runGit(cwd, args) {
  try {
    const result = await execFileAsync('git', args, {
      cwd,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      timeout: GIT_TIMEOUT_MS,
      env: gitEnvironment(),
    })
    return result.stdout.trim()
  }
  catch (error) {
    const details = error.stderr?.trim() || error.stdout?.trim() || error.message
    throw new Error(`git ${args[0]} failed in ${cwd}: ${details}`)
  }
}

async function hashGitOutput(cwd, args, outputPath) {
  const tempPath = outputPath ? `${outputPath}.tmp-${process.pid}` : null
  const hash = createHash('sha256')
  const hashStream = new Transform({
    transform(chunk, _encoding, callback) {
      hash.update(chunk)
      callback(null, chunk)
    },
  })
  const output = tempPath
    ? createWriteStream(tempPath)
    : new Writable({ write(_chunk, _encoding, callback) { callback() } })
  const child = spawn('git', args, {
    cwd,
    env: gitEnvironment(),
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let stderr = ''
  let timedOut = false
  child.stderr.on('data', (chunk) => {
    if (stderr.length < 64 * 1024)
      stderr += chunk.toString('utf8').slice(0, 64 * 1024 - stderr.length)
  })
  const timer = setTimeout(() => {
    timedOut = true
    child.kill('SIGTERM')
  }, GIT_TIMEOUT_MS)
  const completed = new Promise((resolvePromise, rejectPromise) => {
    child.once('error', rejectPromise)
    child.once('close', (code, signal) => {
      if (code === 0)
        resolvePromise()
      else
        rejectPromise(new Error(timedOut ? `timed out after ${GIT_TIMEOUT_MS}ms` : stderr.trim() || `exited with ${code ?? signal}`))
    })
  })

  try {
    await Promise.all([pipeline(child.stdout, hashStream, output), completed])
    if (tempPath)
      await rename(tempPath, outputPath)
    return hash.digest('hex')
  }
  catch (error) {
    child.kill('SIGTERM')
    throw new Error(`git ${args[0]} failed in ${cwd}: ${error.message}`)
  }
  finally {
    clearTimeout(timer)
    if (tempPath)
      await rm(tempPath, { force: true })
  }
}

function gitEnvironment() {
  return {
    ...process.env,
    GIT_ALLOW_PROTOCOL: 'https:file',
    GIT_LFS_SKIP_SMUDGE: '1',
    GIT_TERMINAL_PROMPT: '0',
  }
}

function diffUnavailable(id, status, reason) {
  return {
    source: id,
    acceptedCommit: status?.acceptedCommit ?? null,
    candidateCommit: status?.candidateCommit ?? null,
    available: false,
    output: '',
    reason,
  }
}

function parseYaml(text) {
  const parsed = parse(text)
  if (!isRecord(parsed))
    throw new Error('YAML document must be a mapping/object')
  return parsed
}

function parseMarkdownFrontmatter(text, path) {
  if (!text.startsWith('---\n'))
    throw new Error(`Source distillation must start with YAML frontmatter: ${path}`)
  const end = text.indexOf('\n---\n', 4)
  if (end < 0)
    throw new Error(`Source distillation frontmatter is not closed: ${path}`)
  return {
    metadata: parseYaml(text.slice(4, end)),
    body: text.slice(end + 5),
  }
}

function gitObjectString(value, field) {
  const object = requiredString(value, field)
  if (!GIT_OBJECT_RE.test(object))
    throw new Error(`${field} must be a full lowercase Git object id`)
  return object
}

function requiredString(value, field) {
  if (typeof value !== 'string' || value.trim() === '')
    throw new Error(`${field} must be a non-empty string`)
  return value.trim()
}

function stringArray(value, field, fallback = []) {
  if (value === undefined)
    return [...fallback]
  if (!Array.isArray(value) || value.length === 0 || value.some(item => typeof item !== 'string' || item.trim() === ''))
    throw new Error(`${field} must be a non-empty list of strings`)
  return value.map(item => item.trim())
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function runCli(rawArgs = process.argv.slice(2)) {
  const wantsJson = rawArgs.includes('--json')
  const actionHint = rawArgs.find(argument => !argument.startsWith('-'))
  try {
    const { action, selector, json, patch, initial, help } = parseArgs(rawArgs)
    if (help || !action) {
      printHelp()
      return
    }

    let result
    if (action === 'sync')
      result = { sources: await syncUpstreams({ selector }) }
    else if (action === 'status')
      result = { sources: await getUpstreamStatus({ selector }) }
    else if (action === 'diff')
      result = { patch, sources: await diffUpstreams({ selector, patch }) }
    else if (action === 'prepare')
      result = await prepareUpstream({ source: selector, initial })
    else
      result = { sources: await acceptUpstreams({ selector }) }

    if (json)
      console.log(JSON.stringify({ command: `upstreams ${action}`, ok: true, ...result }, null, 2))
    else
      printHumanResult(action, result)
  }
  catch (error) {
    if (wantsJson) {
      console.log(JSON.stringify({
        command: actionHint ? `upstreams ${actionHint}` : 'upstreams',
        ok: false,
        error: { code: 'upstream_operation_failed', message: error.message },
      }, null, 2))
    }
    else {
      console.error(`Error: ${error.message}`)
    }
    process.exitCode = 1
  }
}

function parseArgs(rawArgs) {
  const json = rawArgs.includes('--json')
  const patch = rawArgs.includes('--patch')
  const initial = rawArgs.includes('--initial')
  const help = rawArgs.includes('--help') || rawArgs.includes('-h')
  const positional = rawArgs.filter(argument => !argument.startsWith('-'))
  const unknownFlags = rawArgs.filter(argument => argument.startsWith('-') && !['--json', '--patch', '--initial', '--help', '-h'].includes(argument))
  if (unknownFlags.length > 0)
    throw new Error(`Unknown option ${unknownFlags[0]}`)
  if (positional.length > 2)
    throw new Error('Expected an action and at most one source or tier selector')
  const [action, selector] = positional
  if (action && !ACTIONS.has(action))
    throw new Error(`Unknown action "${action}"`)
  if (patch && action !== 'diff')
    throw new Error('--patch is only valid with diff')
  if (initial && action !== 'prepare')
    throw new Error('--initial is only valid with prepare')
  if (action === 'prepare' && !selector)
    throw new Error('prepare requires one source id')
  if (action === 'prepare' && RESERVED_SELECTORS.has(selector))
    throw new Error('prepare requires an exact source id, not a tier selector')
  return { action, selector, json, patch, initial, help }
}

function printHumanResult(action, result) {
  console.log()
  if (action === 'diff') {
    console.log('Upstream candidate diffs')
    for (const source of result.sources) {
      console.log(`\n${source.source} ${shortCommit(source.acceptedCommit)} → ${shortCommit(source.candidateCommit)}`)
      console.log(source.available ? (source.output || '  No changes in declared paths.') : `  ${source.reason}`)
    }
  }
  else if (action === 'prepare') {
    console.log('Prepared upstream distillation')
    console.log(`${result.source} (${result.strategy})`)
    console.log(`Evidence: ${result.evidencePath}`)
    console.log(`Research: ${result.reportPath}${result.created ? ' (created)' : ' (preserved)'}`)
    console.log('Next: load $distill-upstream, complete the report, then request accept separately.')
  }
  else {
    console.log(action === 'sync' ? 'Synchronized upstream candidates' : action === 'accept' ? 'Accepted upstream revisions' : 'Upstream status')
    for (const source of result.sources) {
      const state = source.cacheState !== 'ready' ? source.cacheState : source.pending ? 'pending' : 'accepted'
      console.log(`${source.source.padEnd(24)} ${state.padEnd(9)} ${shortCommit(source.acceptedCommit)} → ${shortCommit(source.candidateCommit)}  research=${source.researchState} next=${source.nextAction}`)
      if (source.unmatchedPaths.length > 0)
        console.log(`  Unmatched required paths: ${source.unmatchedPaths.join(', ')}`)
    }
  }
  console.log()
}

function shortCommit(commit) {
  return commit ? commit.slice(0, 8) : '—'
}

function printHelp() {
  console.log(`Usage: node scripts/upstreams.mjs <action> [source|core|reference|all] [--json] [--patch]

Actions:
  sync     Clone or fetch candidates without changing upstreams.lock
  status   Show accepted and synchronized candidate revisions
  diff     Compare accepted revisions with candidates in declared paths
  prepare  Create mechanical evidence and a source-distillation draft
  accept   Explicitly accept candidates into upstreams.lock

The default selector is core. Prepare requires one exact source; use --initial for its baseline review.`)
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])
if (isMain)
  await runCli()
