import { execFileSync, spawnSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error -- repository maintainer tooling intentionally ships as plain ESM outside src/.
import {
  acceptUpstreams,
  diffUpstreams,
  getUpstreamStatus,
  loadUpstreamManifest,
  prepareUpstream,
  syncUpstreams,
} from '../scripts/upstreams.mjs'

const testRoots: string[] = []
const repoRoot = fileURLToPath(new URL('..', import.meta.url))

interface ManifestSourceInput {
  repository: string
  ref: string
  tier: 'core' | 'reference'
  strategy: 'conform' | 'model' | 'adapt' | 'tooling'
  paths: string[]
}

afterEach(async () => {
  await Promise.all(testRoots.splice(0).map(path => rm(path, { recursive: true, force: true })))
})

describe('upstream manifest', () => {
  it('parses a compact versioned source registry', async () => {
    const root = await createRoot()
    await writeManifest(root, {
      example: {
        repository: '/tmp/example.git',
        ref: 'main',
        tier: 'core',
        strategy: 'adapt',
        paths: ['skills/**', 'LICENSE*'],
      },
    })

    const manifest = await loadUpstreamManifest(root)

    expect(manifest.version).toBe(1)
    expect(manifest.sources.example).toEqual({
      repository: '/tmp/example.git',
      ref: 'main',
      tier: 'core',
      strategy: 'adapt',
      paths: ['skills/**', 'LICENSE*'],
    })
  })

  it('rejects unsafe source ids and repository transports', async () => {
    const root = await createRoot()
    await writeFile(join(root, 'upstreams.yaml'), `version: 1
sources:
  ../escape:
    repository: /tmp/example.git
    ref: main
    tier: core
    strategy: adapt
    paths: ["**"]
`)

    await expect(loadUpstreamManifest(root)).rejects.toThrow(/source id/)

    await writeManifest(root, {
      example: {
        ...sourceConfig('ext::sh -c echo unsafe'),
      },
    })
    await expect(loadUpstreamManifest(root)).rejects.toThrow(/repository/)
  })
})

describe('upstream cache lifecycle', () => {
  it('syncs, accepts, and diffs a local Git source with a stable minimal lock', async () => {
    const root = await createRoot()
    const upstream = await createGitSource()
    await writeManifest(root, {
      example: sourceConfig(upstream),
    })

    const synced = await syncUpstreams({ root })
    expect(synced).toHaveLength(1)
    expect(synced[0]?.source).toBe('example')
    expect(synced[0]?.candidateCommit).toMatch(/^[0-9a-f]{40}$/)
    expect(existsSync(join(root, '.cache', 'upstreams', 'example', '.git'))).toBe(true)
    expect(existsSync(join(root, 'upstreams.lock'))).toBe(false)

    const initialStatus = await getUpstreamStatus({ root })
    expect(initialStatus[0]).toMatchObject({
      source: 'example',
      cacheState: 'ready',
      acceptedCommit: null,
      pending: true,
      researchState: 'missing',
      nextAction: 'prepare-initial',
      pathCoverage: [{ pattern: '**', matchedFiles: 1 }],
      unmatchedPaths: [],
    })

    await expect(acceptUpstreams({ root })).rejects.toThrow(/source distillation/)
    const initialPrepared = await prepareUpstream({ root, source: 'example', initial: true })
    expect((await getUpstreamStatus({ root }))[0]).toMatchObject({
      researchState: 'draft',
      nextAction: 'distill',
    })
    await completeDistillation(initialPrepared.reportPath)
    const completeInitialReport = await readFile(initialPrepared.reportPath, 'utf8')
    await writeFile(initialPrepared.reportPath, completeInitialReport.replace('## License and Reuse', '## Reuse Notes'))
    expect((await getUpstreamStatus({ root }))[0]).toMatchObject({ researchState: 'draft', nextAction: 'distill' })
    await expect(acceptUpstreams({ root })).rejects.toThrow(/License and Reuse/)
    await writeFile(initialPrepared.reportPath, completeInitialReport)
    expect((await getUpstreamStatus({ root }))[0]).toMatchObject({
      researchState: 'complete',
      nextAction: 'accept',
    })
    const accepted = await acceptUpstreams({ root })
    expect(accepted[0]?.acceptedCommit).toBe(synced[0]?.candidateCommit)
    const initialLock = await readFile(join(root, 'upstreams.lock'), 'utf8')
    expect(initialLock).toBe(`version: 1\nrevisions:\n  example: ${synced[0]?.candidateCommit}\n`)

    await acceptUpstreams({ root })
    expect(await readFile(join(root, 'upstreams.lock'), 'utf8')).toBe(initialLock)

    await commitFile(upstream, 'workflow.md', 'second version\n')
    await syncUpstreams({ root })

    const pendingStatus = await getUpstreamStatus({ root })
    expect(pendingStatus[0]?.pending).toBe(true)
    expect(pendingStatus[0]?.acceptedCommit).toBe(accepted[0]?.acceptedCommit)

    const diffs = await diffUpstreams({ root })
    expect(diffs[0]?.available).toBe(true)
    expect(diffs[0]?.output).toContain('workflow.md')

    await expect(acceptUpstreams({ root })).rejects.toThrow(/source distillation/)
    const prepared = await prepareUpstream({ root, source: 'example' })
    await expect(acceptUpstreams({ root })).rejects.toThrow(/status.*complete/)
    await completeDistillation(prepared.reportPath)
    await acceptUpstreams({ root })
    const cleanStatus = await getUpstreamStatus({ root })
    expect(cleanStatus[0]).toMatchObject({ pending: false, researchState: 'complete', nextAction: 'none' })
  })

  it('keeps the synchronized candidate stable when the checkout HEAD moves', async () => {
    const root = await createRoot()
    const upstream = await createGitSource()
    const firstCommit = git(upstream, ['rev-parse', 'HEAD'])
    await commitFile(upstream, 'workflow.md', 'second version\n')
    await writeManifest(root, { example: sourceConfig(upstream) })

    const [synced] = await syncUpstreams({ root })
    const cache = join(root, '.cache', 'upstreams', 'example')
    git(cache, ['checkout', '--quiet', '--detach', '--force', firstCommit])

    const [status] = await getUpstreamStatus({ root })
    expect(status?.candidateCommit).toBe(synced?.candidateCommit)
    expect(status?.candidateCommit).not.toBe(firstCommit)

    const prepared = await prepareUpstream({ root, source: 'example', initial: true })
    await completeDistillation(prepared.reportPath)
    await acceptUpstreams({ root })
    expect(await readFile(join(root, 'upstreams.lock'), 'utf8')).toContain(`example: ${synced?.candidateCommit}`)
  })

  it('refuses to overwrite a dirty cached checkout', async () => {
    const root = await createRoot()
    const upstream = await createGitSource()
    await writeManifest(root, { example: sourceConfig(upstream) })
    await syncUpstreams({ root })
    await writeFile(join(root, '.cache', 'upstreams', 'example', 'local.txt'), 'do not overwrite\n')

    await expect(syncUpstreams({ root })).rejects.toThrow(/dirty/)
  })

  it('refuses to reuse a cache when its repository changes', async () => {
    const root = await createRoot()
    const first = await createGitSource()
    const second = await createGitSource()
    await writeManifest(root, { example: sourceConfig(first) })
    await syncUpstreams({ root })

    await writeManifest(root, { example: sourceConfig(second) })

    await expect(syncUpstreams({ root })).rejects.toThrow(/repository changed/)
  })

  it('can operate on one selected source without touching peers', async () => {
    const root = await createRoot()
    const first = await createGitSource()
    const second = await createGitSource()
    await writeManifest(root, {
      first: sourceConfig(first),
      second: sourceConfig(second),
    })

    await syncUpstreams({ root, selector: 'second' })

    expect(existsSync(join(root, '.cache', 'upstreams', 'first'))).toBe(false)
    expect(existsSync(join(root, '.cache', 'upstreams', 'second', '.git'))).toBe(true)
  })

  it('selects core sources by default and supports explicit tiers', async () => {
    const root = await createRoot()
    const core = await createGitSource()
    const reference = await createGitSource()
    await writeManifest(root, {
      'core-source': sourceConfig(core, 'core'),
      'reference-source': sourceConfig(reference, 'reference'),
    })

    await syncUpstreams({ root })
    expect(existsSync(join(root, '.cache', 'upstreams', 'core-source', '.git'))).toBe(true)
    expect(existsSync(join(root, '.cache', 'upstreams', 'reference-source'))).toBe(false)

    await syncUpstreams({ root, selector: 'reference' })
    expect(existsSync(join(root, '.cache', 'upstreams', 'reference-source', '.git'))).toBe(true)
  })
})

describe('upstream research preparation', () => {
  it('reports required path coverage and refuses to prepare an incomplete scope', async () => {
    const root = await createRoot()
    const upstream = await createGitSource()
    await writeManifest(root, {
      example: {
        ...sourceConfig(upstream, 'core', 'model'),
        paths: ['SKILL.md', 'missing/**'],
      },
    })
    await syncUpstreams({ root })

    const [status] = await getUpstreamStatus({ root })
    expect(status).toMatchObject({
      pathCoverage: [
        { pattern: 'SKILL.md', matchedFiles: 1 },
        { pattern: 'missing/**', matchedFiles: 0 },
      ],
      unmatchedPaths: ['missing/**'],
      nextAction: 'fix-paths',
    })
    await expect(prepareUpstream({ root, source: 'example', initial: true })).rejects.toThrow(/missing\/\*\*/)
  })

  it('creates deterministic evidence and a non-overwriting source distillation draft', async () => {
    const root = await createRoot()
    const upstream = await createGitSource()
    await writeManifest(root, { example: sourceConfig(upstream, 'core', 'adapt') })
    const [initial] = await syncUpstreams({ root })
    await writeLock(root, { example: initial!.candidateCommit })
    await commitFile(upstream, 'workflow.md', 'second version\n')
    const [candidate] = await syncUpstreams({ root })
    const lockBefore = await readFile(join(root, 'upstreams.lock'), 'utf8')

    const prepared = await prepareUpstream({ root, source: 'example' })

    expect(prepared).toMatchObject({
      source: 'example',
      strategy: 'adapt',
      baseCommit: initial!.candidateCommit,
      candidateCommit: candidate!.candidateCommit,
      created: true,
    })
    expect(existsSync(prepared.evidencePath)).toBe(true)
    expect(existsSync(prepared.reportPath)).toBe(true)
    expect(await readFile(join(root, 'upstreams.lock'), 'utf8')).toBe(lockBefore)

    const evidence = JSON.parse(await readFile(prepared.evidencePath, 'utf8'))
    const patch = await readFile(join(prepared.evidencePath, '..', 'diff.patch'))
    expect(evidence).toMatchObject({
      version: 1,
      source: 'example',
      strategy: 'adapt',
      base_revision: initial!.candidateCommit,
      candidate_revision: candidate!.candidateCommit,
      changed_files: ['workflow.md'],
    })
    expect(evidence.evidence_hash).toMatch(/^sha256:[0-9a-f]{64}$/)
    expect(evidence.diff_sha256).toBe(`sha256:${createHash('sha256').update(patch).digest('hex')}`)

    const draft = await readFile(prepared.reportPath, 'utf8')
    expect(draft).toContain('status: draft')
    expect(draft).toContain(`evidence_hash: ${evidence.evidence_hash}`)
    expect(draft).toContain('## Extracted Mechanisms')
    expect(draft).toContain('## License and Reuse')
    expect(draft).toContain('## Recommendations')

    await writeFile(prepared.reportPath, `${draft}\nMaintainer note.\n`)
    const repeated = await prepareUpstream({ root, source: 'example' })
    expect(repeated.created).toBe(false)
    expect(repeated.evidenceHash).toBe(prepared.evidenceHash)
    expect(await readFile(prepared.reportPath, 'utf8')).toBe(`${draft}\nMaintainer note.\n`)
  })

  it('streams large patch evidence without the buffered Git output limit', async () => {
    const root = await createRoot()
    const upstream = await createGitSource()
    await writeManifest(root, { example: sourceConfig(upstream, 'core', 'model') })
    const [initial] = await syncUpstreams({ root })
    await writeLock(root, { example: initial!.candidateCommit })
    await commitFile(upstream, 'large.txt', `${'x'.repeat(21 * 1024 * 1024)}\n`)
    await syncUpstreams({ root })

    const prepared = await prepareUpstream({ root, source: 'example' })
    const evidence = JSON.parse(await readFile(prepared.evidencePath, 'utf8'))
    const patch = await readFile(join(prepared.evidencePath, '..', 'diff.patch'))

    expect(patch.byteLength).toBeGreaterThan(20 * 1024 * 1024)
    expect(evidence.diff_sha256).toBe(`sha256:${createHash('sha256').update(patch).digest('hex')}`)
  }, 30_000)

  it('supports an explicit initial distillation without an accepted baseline', async () => {
    const root = await createRoot()
    const upstream = await createGitSource()
    await writeManifest(root, { example: sourceConfig(upstream, 'core', 'model') })
    await syncUpstreams({ root })

    await expect(prepareUpstream({ root, source: 'example' })).rejects.toThrow(/--initial/)
    const prepared = await prepareUpstream({ root, source: 'example', initial: true })
    const evidence = JSON.parse(await readFile(prepared.evidencePath, 'utf8'))

    expect(prepared).toMatchObject({ strategy: 'model', baseCommit: null, created: true })
    expect(evidence).toMatchObject({
      strategy: 'model',
      base_revision: null,
      changed_files: ['SKILL.md'],
    })

    const draft = await readFile(prepared.reportPath, 'utf8')
    await writeFile(prepared.reportPath, draft.replace(`revision: ${prepared.candidateCommit}`, `revision: ${'0'.repeat(40)}`))
    expect((await getUpstreamStatus({ root }))[0]).toMatchObject({
      researchState: 'stale',
      nextAction: 'distill',
    })

    await writeLock(root, { example: prepared.candidateCommit })
    await commitFile(upstream, 'workflow.md', 'new candidate\n')
    await syncUpstreams({ root })
    await expect(prepareUpstream({ root, source: 'example', initial: true })).rejects.toThrow(/pending candidate/)
  })
})

describe('upstream CLI', () => {
  it('reports registry status as machine-readable JSON', async () => {
    const root = await createRoot()
    const upstream = await createGitSource()
    await writeManifest(root, { example: sourceConfig(upstream) })

    const output = execFileSync('node', [join(repoRoot, 'scripts', 'upstreams.mjs'), 'status', '--json'], {
      cwd: root,
      encoding: 'utf8',
    })
    const parsed = JSON.parse(output)

    expect(parsed).toMatchObject({
      command: 'upstreams status',
      ok: true,
      sources: [{ source: 'example', cacheState: 'missing' }],
    })
  })

  it('reports argument failures as JSON without a stack trace', () => {
    const result = spawnSync('node', [join(repoRoot, 'scripts', 'upstreams.mjs'), 'status', '--patch', '--json'], {
      cwd: repoRoot,
      encoding: 'utf8',
    })

    expect(result.status).toBe(1)
    expect(result.stderr).toBe('')
    expect(JSON.parse(result.stdout)).toMatchObject({
      command: 'upstreams status',
      ok: false,
      error: { code: 'upstream_operation_failed' },
    })
  })

  it('prepares one source through the CLI with JSON output', async () => {
    const root = await createRoot()
    const upstream = await createGitSource()
    await writeManifest(root, { example: sourceConfig(upstream, 'core', 'model') })
    await syncUpstreams({ root })

    const result = spawnSync('node', [join(repoRoot, 'scripts', 'upstreams.mjs'), 'prepare', 'example', '--initial', '--json'], {
      cwd: root,
      encoding: 'utf8',
    })

    expect(result.status).toBe(0)
    expect(JSON.parse(result.stdout)).toMatchObject({
      command: 'upstreams prepare',
      ok: true,
      source: 'example',
      strategy: 'model',
      created: true,
    })
  })
})

async function createRoot(): Promise<string> {
  const root = join(tmpdir(), 'rsp-upstreams-test', randomUUID())
  testRoots.push(root)
  await mkdir(root, { recursive: true })
  return root
}

async function createGitSource(): Promise<string> {
  const root = join(tmpdir(), 'rsp-upstream-source', randomUUID())
  testRoots.push(root)
  await mkdir(root, { recursive: true })
  git(root, ['init', '--initial-branch=main'])
  git(root, ['config', 'user.name', 'RSP Test'])
  git(root, ['config', 'user.email', 'rsp@example.test'])
  await commitFile(root, 'SKILL.md', 'first version\n')
  return root
}

async function commitFile(root: string, name: string, content: string): Promise<void> {
  await writeFile(join(root, name), content)
  git(root, ['add', name])
  git(root, ['commit', '-m', `update ${name}`])
}

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
}

function sourceConfig(
  repository: string,
  tier: 'core' | 'reference' = 'core',
  strategy: 'conform' | 'model' | 'adapt' | 'tooling' = 'adapt',
) {
  return {
    repository,
    ref: 'main',
    tier,
    strategy,
    paths: ['**'],
  }
}

async function writeManifest(root: string, sources: Record<string, ManifestSourceInput>): Promise<void> {
  const lines = ['version: 1', 'sources:']
  for (const [id, source] of Object.entries(sources)) {
    lines.push(`  ${id}:`)
    lines.push(`    repository: ${source.repository}`)
    lines.push(`    ref: ${source.ref}`)
    lines.push(`    tier: ${source.tier}`)
    lines.push(`    strategy: ${source.strategy}`)
    lines.push('    paths:')
    for (const entry of source.paths)
      lines.push(`      - "${entry}"`)
  }
  await writeFile(join(root, 'upstreams.yaml'), `${lines.join('\n')}\n`)
}

async function writeLock(root: string, revisions: Record<string, string | null | undefined>): Promise<void> {
  const lines = ['version: 1', 'revisions:']
  for (const [source, revision] of Object.entries(revisions)) {
    if (revision)
      lines.push(`  ${source}: ${revision}`)
  }
  await writeFile(join(root, 'upstreams.lock'), `${lines.join('\n')}\n`)
}

async function completeDistillation(reportPath: string): Promise<void> {
  const draft = await readFile(reportPath, 'utf8')
  const complete = draft
    .replace('status: draft', 'status: complete')
    .replace('- TODO: State the source\'s role and problem domain.', '- Engineering workflow source for the reviewed scope.')
    .replace('- TODO: Record mechanisms, models, or reusable assets supported by evidence.', '- The candidate changes the documented workflow mechanism.')
    .replace('- TODO: Tie each applicable mechanism to a concrete RSP problem or gap.', '- No immediate RSP product change is required.')
    .replace('- TODO: Record relevant ideas that should not be adopted and why.', '- Runtime coupling is rejected because research remains offline.')
    .replace('- TODO: Record the applicable license, reuse mode, attribution, and eligible source paths.', '- License: test fixture; reuse mode: model-only; attribution: none; eligible paths: none.')
    .replace('- TODO: List research-backed options only; do not modify final RSP artifacts here.', '- Keep the result as research input until a recommendation is selected.')
  await writeFile(reportPath, complete)
}
