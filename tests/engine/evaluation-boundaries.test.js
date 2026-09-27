import { spawnSync } from 'node:child_process'
import { chmodSync, copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createOpenCodexAdapter } from '../../evals/adapters/opencodex.mjs'
import { aggregateReviewDecisions } from '../../evals/graders/semantic-review.mjs'
import { compositionIdentity } from '../../evals/observers/workspace.mjs'
import { applyReviews, runCampaign } from '../../evals/runner/campaign.mjs'
import { loadCase } from '../../evals/runner/cases.mjs'
import { createLocalAdapter, runCase } from '../../evals/runner/execute.mjs'
import { hash, treeFiles } from '../../evals/runner/files.mjs'
import { loadHoldout } from '../../evals/runner/holdout.mjs'
import { revalidateCampaign } from '../../evals/runner/replay.mjs'
import { checkCampaignEvidence } from '../../release/evidence.mjs'

const root = process.cwd()
const fixture = join(root, 'tests/engine/fixtures/provider.mjs')
const temporary = []
function temp() {
  const directory = mkdtempSync(join(tmpdir(), 'rsp-engine-test-'))
  temporary.push(directory)
  return directory
}
afterEach(() => {
  for (const directory of temporary.splice(0))
    rmSync(directory, { recursive: true, force: true })
})
function execute(mode = 'success', options = {}) {
  return runCase(loadCase(root, 'preserve-user-files'), root, {
    adapter: createLocalAdapter(process.execPath, [fixture, '--mode', mode]),
    outputRoot: temp(),
    ...options,
  })
}
function decision(packet, overrides = {}) {
  return {
    packetHash: packet.packetHash,
    reviewer: { id: 'independent-human', kind: 'human' },
    reviewContext: { fresh: true, blindPacketOnly: true },
    dimensions: packet.rubric.map(({ name }) => ({ name, status: 'pass', reason: 'Checked the requested artifact and report.', evidence: ['finalOutput', 'diff'] })),
    ...overrides,
  }
}

describe('evaluation evidence and authority boundaries', () => {
  it('refuses a second CLI review import without replacing the original report or decisions', async () => {
    const run = await execute()
    const directory = temp()
    const reportPath = join(directory, 'campaign.json')
    const decisionsPath = join(directory, 'decisions.json')
    const campaign = JSON.stringify({ schema: 'rsp-campaign-v1', complete: true, comparisons: [{ runs: [{ ...run, arm: 'candidate' }] }] })
    writeFileSync(reportPath, campaign)
    writeFileSync(decisionsPath, JSON.stringify([decision(run.packet)]))
    const review = () => spawnSync(process.execPath, ['evals/runner/cli.mjs', 'review', '--report', reportPath, '--decisions', decisionsPath], { cwd: root, encoding: 'utf8', timeout: 10000 })
    expect(review().status).toBe(0)
    const original = readFileSync(`${reportPath}.reviewed.json`, 'utf8')
    const changed = decision(run.packet)
    changed.dimensions[0].status = 'fail'
    writeFileSync(decisionsPath, JSON.stringify([changed]))
    const repeated = review()
    expect(repeated.status).toBe(2)
    expect(repeated.stderr).toContain('refusing to overwrite')
    expect(readFileSync(`${reportPath}.reviewed.json`, 'utf8')).toBe(original)
    expect(readFileSync(reportPath, 'utf8')).toBe(campaign)
  })

  it('detects deleted and ignored user files instead of crashing or trusting git status alone', async () => {
    const deleted = await execute('delete')
    expect(deleted.verdict).toMatchObject({ status: 'failed', category: 'hard-boundary' })
    expect(deleted.observation.changedPaths).toContain('user-notes.txt')
    const ignored = await execute('ignored')
    expect(ignored.verdict.status).toBe('failed')
    expect(ignored.observation.changedPaths).toContain('hidden.txt')
    const specialName = await execute('special-name')
    expect(specialName.observation.changedPaths).toContain('__proto__')
    expect(specialName.observation.changedPaths).toContain('nested/.git/hidden.txt')
    expect(specialName.verdict.status).toBe('failed')
    const restored = await execute('restore')
    expect(restored.observation.changedPaths).not.toContain('user-notes.txt')
    expect(restored.verdict).toMatchObject({ status: 'failed', category: 'hard-boundary' })
  })

  it('requires the requested result, not just a clean process exit', async () => {
    const run = await execute('noop')
    expect(run.verdict).toMatchObject({ status: 'failed', category: 'task' })
  })

  it('distinguishes provider outage, incomplete evidence and bounded termination', async () => {
    expect((await execute('capacity')).verdict.category).toBe('infrastructure')
    for (const mode of ['malformed', 'incomplete'])
      expect((await execute(mode)).verdict).toMatchObject({ status: 'inconclusive', category: 'evidence' })
    const hung = await execute('hang', { timeoutMs: 100 })
    expect(hung.result.timedOut).toBe(true)
    expect(hung.result.durationMs).toBeLessThan(3000)
    expect(hung.verdict.status).toBe('inconclusive')
    expect(existsSync(join(hung.reportDirectory, 'events.jsonl'))).toBe(true)
  })

  it('requires fresh packet-only context rather than a different reviewer model or provider', async () => {
    const run = await execute()
    const reviewer = { id: 'fresh-reviewer', kind: 'model', ...run.identity.executor }
    const report = { schema: 'rsp-campaign-v1', comparisons: [{ runs: [{ ...run, arm: 'candidate' }] }] }
    const review = overrides => applyReviews(report, [decision(run.packet, { reviewer, ...overrides })]).summary.semantic
    expect(review({})).toBe('passed')
    expect(review({ reviewer: { ...reviewer, model: 'other-model' } })).toBe('passed')
    expect(review({ reviewer: { ...reviewer, provider: 'other-provider' } })).toBe('passed')
    expect(review({ reviewer: { ...reviewer, provider: '' } })).toBe('inconclusive')
    for (const reviewContext of [undefined, {}, { fresh: false, blindPacketOnly: true }, { fresh: true, blindPacketOnly: false }, { fresh: 'true', blindPacketOnly: true }])
      expect(review({ reviewContext })).toBe('inconclusive')
  })

  it('rejects incomplete, duplicate, mismatched and conflicting semantic decisions', async () => {
    const run = await execute()
    const packet = run.packet
    const grader = decisions => aggregateReviewDecisions(packet, decisions)
    expect(grader([decision(packet)]).status).toBe('passed')
    expect(grader([]).status).toBe('inconclusive')
    expect(grader([decision(packet, { dimensions: [] })]).status).toBe('inconclusive')
    expect(grader([decision(packet, { packetHash: 'wrong' })]).status).toBe('inconclusive')
    expect(grader([decision(packet), decision(packet)]).status).toBe('inconclusive')
    const dissent = decision(packet, { reviewer: { id: 'second-human', kind: 'human' } })
    dissent.dimensions[0].status = 'fail'
    expect(grader([decision(packet), dissent]).status).toBe('inconclusive')
    expect(packet).not.toHaveProperty('arm')
    expect(packet).not.toHaveProperty('blindArm')
    expect(packet).not.toHaveProperty('executor')
  })

  it('loads hash-pinned private cases without installing their oracle into the task workspace', async () => {
    const privateRoot = temp()
    const entry = loadCase(root, 'preserve-user-files')
    const directory = join(privateRoot, entry.id)
    cpSync(entry.directory, directory, { recursive: true })
    const registryPath = join(temp(), 'manifest.json')
    writeFileSync(registryPath, JSON.stringify({ schema: 'rsp-holdout-v1', cases: [{ id: entry.id, version: '1', sha256: hash(treeFiles(directory, { rejectLinks: true })), tags: ['scope'] }] }))
    const [holdout] = loadHoldout(root, registryPath, privateRoot)
    const adapter = createLocalAdapter(process.execPath, [fixture])
    const run = adapter.run
    adapter.run = async (input) => {
      expect(existsSync(join(input.workspace, 'oracle.mjs'))).toBe(false)
      expect(existsSync(join(input.workspace, 'case.yaml'))).toBe(false)
      return run(input)
    }
    expect((await runCase(holdout, root, { adapter, outputRoot: temp() })).verdict.status).toBe('passed')
    writeFileSync(join(directory, 'extra.txt'), 'drift')
    expect(() => loadHoldout(root, registryPath, privateRoot)).toThrow('hash mismatch')
    rmSync(join(directory, 'extra.txt'))
    symlinkSync(join(root, 'package.json'), join(directory, 'external'))
    expect(() => loadHoldout(root, registryPath, privateRoot)).toThrow('symlinks')
  })

  it('retains paired identity and review packets, but refuses local/pilot evidence for publication', async () => {
    const report = await runCampaign([loadCase(root, 'preserve-user-files')], root, {
      adapter: createLocalAdapter(process.execPath, [fixture]),
      candidateComposition: join(root, 'skills'),
      outputRoot: temp(),
      repetitions: 2,
    })
    expect(report.complete).toBe(true)
    expect(report.summary.status).toBe('inconclusive')
    const runs = report.comparisons.flatMap(item => item.runs)
    expect(new Set(runs.map(run => run.identity.fixtureHash)).size).toBe(1)
    expect(new Set(runs.map(run => run.identity.compositionHash)).size).toBe(2)
    const reviewed = applyReviews(report, runs.map(run => decision(run.packet)))
    expect(reviewed.summary.status).toBe('passed')
    const path = `${report.reportPath}.reviewed.json`
    writeFileSync(path, JSON.stringify(reviewed))
    const gate = checkCampaignEvidence(root, path)
    expect(gate.status).toBe('inconclusive')
    expect(gate.reasons).toContain('real isolated OpenCodex execution required')
    expect(gate.reasons.some(reason => reason.startsWith('missing holdout coverage'))).toBe(true)
    expect(checkCampaignEvidence(root).status).toBe('inconclusive')
  })

  it('uses explicit isolated config/auth, excludes ambient secrets, redacts retained evidence and removes runtime credentials', async () => {
    const directory = temp()
    const executable = join(directory, 'fixture-provider')
    copyFileSync(fixture, executable)
    chmodSync(executable, 0o755)
    const configFile = join(directory, 'config.toml')
    const authFile = join(directory, 'auth.json')
    writeFileSync(configFile, 'model_provider = "fixture-provider"\n')
    writeFileSync(authFile, JSON.stringify({ access_token: 'test-credential-never-persist' }))
    const adapter = createOpenCodexAdapter({ codexBin: executable, model: 'fixture', effort: 'low', configFile, authFile })
    const entry = loadCase(root, 'preserve-user-files')
    entry.manifest.prompt += ' isolation-probe'
    const previous = process.env.RSP_TEST_SECRET
    process.env.RSP_TEST_SECRET = 'ambient-secret'
    try {
      const result = await runCase(entry, root, { adapter, outputRoot: directory })
      expect(result.verdict.status).toBe('passed')
      const final = JSON.parse(result.result.finalOutput)
      expect(final).toMatchObject({ isolated: true, leakedEnv: null, configPresent: true, selectedProvider: 'fixture-provider' })
      expect(JSON.stringify(result)).not.toContain('test-credential-never-persist')
      expect(readFileSync(join(result.reportDirectory, 'events.jsonl'), 'utf8')).not.toContain('test-credential-never-persist')
    }
    finally {
      if (previous === undefined)
        delete process.env.RSP_TEST_SECRET
      else
        process.env.RSP_TEST_SECRET = previous
    }
  })

  it('accepts complete independently reviewed evidence and rejects tampering, missing artifacts and source drift', async () => {
    const project = temp()
    for (const name of ['src', 'bin', 'rules', 'skills', 'dist', 'evals/cases/behavior', 'evals/adapters', 'evals/observers', 'evals/graders', 'evals/runner'])
      mkdirSync(join(project, name), { recursive: true })
    for (const name of ['tsup.config.ts', 'tsconfig.json'])
      copyFileSync(join(root, name), join(project, name))
    writeFileSync(join(project, 'dist/cli.mjs'), '// synthetic CLI artifact')
    writeFileSync(join(project, 'package.json'), '{"name":"acceptance-fixture"}')
    writeFileSync(join(project, 'pnpm-lock.yaml'), 'lockfileVersion: 9')
    mkdirSync(join(project, 'release/suites'), { recursive: true })
    writeFileSync(join(project, 'release/suites/required-cases.json'), JSON.stringify({ schema: 'rsp-release-suite-v1', publicCases: ['preserve-user-files'], holdoutNegativeSkills: [] }))
    cpSync(join(root, 'skills/rsp-implement'), join(project, 'skills/rsp-implement'), { recursive: true })
    for (const name of ['adapters', 'observers', 'graders', 'runner'])
      cpSync(join(root, 'evals', name), join(project, 'evals', name), { recursive: true })
    cpSync(loadCase(root, 'preserve-user-files').directory, join(project, 'evals/cases/behavior/preserve-user-files'), { recursive: true })
    const publicCase = loadCase(project, 'preserve-user-files')
    const privateRoot = temp()
    const privateCase = join(privateRoot, 'private-preserve')
    cpSync(publicCase.directory, privateCase, { recursive: true })
    const manifestPath = join(privateCase, 'case.yaml')
    writeFileSync(manifestPath, readFileSync(manifestPath, 'utf8').replace('id: preserve-user-files', 'id: private-preserve'))
    const registry = join(temp(), 'registry.json')
    const provenance = { authorId: 'test-case-author', candidateAuthorId: 'test-skill-author', candidateHash: compositionIdentity(join(project, 'skills')).hash, isolation: 'separate-read-boundary', isolationEvidence: 'synthetic-gate-test-only', frozenAt: '2026-01-01T00:00:00Z', unsealedAt: '2026-01-02T00:00:00Z' }
    writeFileSync(registry, JSON.stringify({ schema: 'rsp-holdout-v1', provenance, cases: [{ id: 'private-preserve', version: 'test-v1', tags: ['scope'], sha256: hash(treeFiles(privateCase)) }] }))
    const config = join(temp(), 'config.toml')
    writeFileSync(config, 'model_provider = "fixture-provider"')
    const executable = join(temp(), 'fixture-provider')
    copyFileSync(fixture, executable)
    chmodSync(executable, 0o755)
    const report = await runCampaign([publicCase, ...loadHoldout(project, registry, privateRoot)], project, {
      adapter: createOpenCodexAdapter({ codexBin: executable, model: 'test', effort: 'low', configFile: config }),
      candidateComposition: join(project, 'skills'),
      repetitions: 2,
    })
    const decisions = report.comparisons.flatMap(item => item.runs).map(run => decision(run.packet, {
      reviewer: { id: 'fresh-same-model', kind: 'model', provider: run.identity.executor.configuredProvider, model: run.identity.executor.model },
    }))
    const reviewed = applyReviews(report, decisions)
    const path = `${report.reportPath}.reviewed.json`
    writeFileSync(path, JSON.stringify(reviewed))
    expect(checkCampaignEvidence(project, path)).toEqual({ status: 'passed', reasons: [] })
    for (const name of ['dist/cli.mjs', 'tsup.config.ts', 'tsconfig.json']) {
      const target = join(project, name)
      const original = readFileSync(target, 'utf8')
      writeFileSync(target, `${original}\n// changed build input or artifact`)
      expect(checkCampaignEvidence(project, path).reasons).toContain('stale source, candidate or harness identity')
      await expect(revalidateCampaign(path, project)).rejects.toThrow('Execution identity')
      await expect(runCampaign([publicCase, ...loadHoldout(project, registry, privateRoot)], project, {
        adapter: createOpenCodexAdapter({ codexBin: executable, model: 'test', effort: 'low', configFile: config }),
        candidateComposition: join(project, 'skills'),
        repetitions: 2,
        resume: report.reportPath,
      })).rejects.toThrow('Resume identity drift')
      writeFileSync(target, original)
    }
    expect(checkCampaignEvidence(project, path)).toEqual({ status: 'passed', reasons: [] })
    const cliFile = join(project, 'evals/runner/cli.mjs')
    writeFileSync(cliFile, `${readFileSync(cliFile, 'utf8') + String.fromCharCode(10)}// changed reviewer default only`)
    expect(checkCampaignEvidence(project, path)).toEqual({ status: 'passed', reasons: [] })
    const graderFile = join(project, 'evals/graders/module-value.mjs')
    const originalGrader = readFileSync(graderFile, 'utf8')
    writeFileSync(graderFile, `${originalGrader + String.fromCharCode(10)}// grading revision`)
    expect(checkCampaignEvidence(project, path).reasons).toContain('offline revalidation required or invalid')
    const fresh = await revalidateCampaign(path, project, [publicCase, ...loadHoldout(project, registry, privateRoot)])
    expect(fresh.providerInvocations).toBe(0)
    expect(checkCampaignEvidence(project, fresh.reportPath)).toEqual({ status: 'passed', reasons: [] })
    const tampered = JSON.parse(readFileSync(fresh.reportPath))
    tampered.revalidation.runs[0].evidenceHash = 'wrong'
    writeFileSync(fresh.reportPath, JSON.stringify(tampered))
    expect(checkCampaignEvidence(project, fresh.reportPath).status).toBe('inconclusive')
    writeFileSync(graderFile, originalGrader)
    const adapterFile = join(project, 'evals/adapters/process.mjs')
    const originalAdapter = readFileSync(adapterFile, 'utf8')
    writeFileSync(adapterFile, `${originalAdapter + String.fromCharCode(10)}// execution changed`)
    await expect(revalidateCampaign(path, project)).rejects.toThrow('Execution identity')
    expect(checkCampaignEvidence(project, path).reasons).toContain('stale source, candidate or harness identity')
    writeFileSync(adapterFile, originalAdapter)
    const suiteFile = join(project, 'release/suites/required-cases.json')
    const originalSuite = readFileSync(suiteFile, 'utf8')
    writeFileSync(suiteFile, JSON.stringify({ schema: 'rsp-release-suite-v1', publicCases: ['preserve-user-files', 'required-workflow'], holdoutNegativeSkills: [] }))
    expect(checkCampaignEvidence(project, path).reasons).toContain('required public scenario missing: required-workflow')
    writeFileSync(suiteFile, originalSuite)
    const run = reviewed.comparisons[0].runs.find(run => run.arm === 'candidate')
    delete run.decisions[0].reviewContext
    writeFileSync(path, JSON.stringify(reviewed))
    expect(checkCampaignEvidence(project, path).reasons).toContain(`independent semantic review incomplete: ${run.id}`)
    run.decisions[0].reviewContext = { fresh: true, blindPacketOnly: true }
    run.decisions[0].dimensions = []
    writeFileSync(path, JSON.stringify(reviewed))
    expect(checkCampaignEvidence(project, path).status).toBe('inconclusive')
    writeFileSync(path, JSON.stringify(applyReviews(report, report.comparisons.flatMap(item => item.runs).map(run => decision(run.packet)))))
    writeFileSync(join(project, 'src/changed.js'), 'source changed')
    expect(checkCampaignEvidence(project, path).reasons).toContain('stale source, candidate or harness identity')
    rmSync(join(project, 'src/changed.js'))
    rmSync(join(run.reportDirectory, 'events.jsonl'))
    expect(checkCampaignEvidence(project, path).status).toBe('inconclusive')
  })

  it('refuses external CLI execution without explicit authorization and rejects arbitrary commands', () => {
    for (const args of [['campaign'], ['run', '--allow-live', '--command', process.execPath]]) {
      const result = spawnSync(process.execPath, ['evals/runner/cli.mjs', ...args], { cwd: root, encoding: 'utf8' })
      expect(result.status).toBe(2)
    }
  })
})
