import { spawnSync } from 'node:child_process'
import { chmodSync, copyFileSync, cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import { loadCalibration, scoreCalibration } from '../../evals/runner/calibration.mjs'
import { runCampaign } from '../../evals/runner/campaign.mjs'
import { loadCase } from '../../evals/runner/cases.mjs'
import { createLocalAdapter, runCase } from '../../evals/runner/execute.mjs'
import { hash } from '../../evals/runner/files.mjs'
import { reviewBatch } from '../../evals/runner/review-batch.mjs'

const root = process.cwd()
const temps = []
function temp() {
  const dir = mkdtempSync(join(tmpdir(), 'rsp-batch-test-'))
  temps.push(dir)
  return dir
}
afterEach(() => temps.splice(0).forEach(dir => rmSync(dir, { force: true, recursive: true })))
function reviewer(outputs) {
  let count = 0
  return {
    settings: { provider: 'local-test', model: 'reviewer', effort: 'low' },
    get count() { return count },
    async run({ prompt }) {
      count++
      expect(prompt).not.toContain('expected')
      const packet = JSON.parse(prompt.split('\n').at(-1))
      const finalOutput = outputs?.[count - 1] ?? JSON.stringify({ dimensions: packet.rubric.map(r => ({ name: r.name, status: 'pass', reason: 'Observed supplied evidence.', evidence: ['finalOutput'] })) })
      return { exitCode: 0, stderr: '', finalOutput, stdout: `${JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 10, output_tokens: 5 } })}\n` }
    },
  }
}

it.each(['baseline', 'candidate'])('stops before another provider call when the external %s composition changes', async (changedArm) => {
  const entry = loadCase(root, 'preserve-user-files')
  const directories = { baseline: temp(), candidate: temp() }
  for (const directory of Object.values(directories))
    cpSync(join(root, 'skills/rsp-implement'), join(directory, 'rsp-implement'), { recursive: true })
  const baselineFile = join(directories.baseline, 'rsp-implement/SKILL.md')
  writeFileSync(baselineFile, `${readFileSync(baselineFile, 'utf8')}\nBaseline variant.\n`)
  const changedFile = join(directories[changedArm], 'rsp-implement/SKILL.md')
  const original = readFileSync(changedFile, 'utf8')
  const adapter = createLocalAdapter(process.execPath, [join(root, 'tests/engine/fixtures/provider.mjs')])
  const execute = adapter.run
  let calls = 0
  adapter.run = async (input) => {
    const result = await execute(input)
    if (++calls === 1)
      writeFileSync(changedFile, `${original}\nChanged after freeze.\n`)
    return result
  }
  const options = { adapter, baselineComposition: directories.baseline, candidateComposition: directories.candidate, outputRoot: temp(), repetitions: 2, seed: 'composition-drift' }
  const report = await runCampaign([entry], root, options)
  expect(report).toMatchObject({ complete: false, stopReason: 'composition-drift' })
  expect(calls).toBe(1)
  expect(report.comparisons[0].runs).toHaveLength(1)
  const retained = report.comparisons[0].runs[0]
  expect(retained.identity.compositionHash).toBe(report.plan[retained.arm].hash)
  const originalEvidence = readFileSync(join(retained.reportDirectory, 'run.json'), 'utf8')
  const rejected = await runCase(entry, root, { adapter, composition: directories[changedArm], compositionHash: report.plan[changedArm].hash, outputRoot: temp() })
  expect(rejected.verdict).toMatchObject({ status: 'inconclusive', category: 'harness' })
  expect(calls).toBe(1)
  await expect(runCampaign([entry], root, { ...options, resume: report.reportPath })).rejects.toThrow('Resume identity drift')
  expect(calls).toBe(1)
  writeFileSync(changedFile, original)
  const resumed = await runCampaign([entry], root, { ...options, resume: report.reportPath })
  expect(resumed.complete).toBe(true)
  expect(calls).toBe(4)
  expect(readFileSync(join(retained.reportDirectory, 'run.json'), 'utf8')).toBe(originalEvidence)
})

it('resumes paired execution at the next slot without rerunning retained samples', async () => {
  const entry = loadCase(root, 'preserve-user-files')
  const adapter = createLocalAdapter(process.execPath, [join(root, 'tests/engine/fixtures/provider.mjs')])
  const options = { adapter, candidateComposition: join(root, 'skills'), baselineComposition: null, outputRoot: temp(), repetitions: 2, seed: 'resume-test', maxSessions: 1 }
  const first = await runCampaign([entry], root, options)
  expect(first.complete).toBe(false)
  expect(first.stopReason).toBe('session-budget')
  const original = readFileSync(join(first.comparisons[0].runs[0].reportDirectory, 'run.json'), 'utf8')
  const resumed = await runCampaign([entry], root, { ...options, resume: first.reportPath, maxSessions: 3 })
  expect(resumed.complete).toBe(true)
  expect(resumed.comparisons[0].runs).toHaveLength(4)
  expect(new Set(resumed.comparisons[0].runs.map(r => r.id)).size).toBe(4)
  expect(readFileSync(join(first.comparisons[0].runs[0].reportDirectory, 'run.json'), 'utf8')).toBe(original)
  const state = JSON.parse(readFileSync(first.reportPath))
  state.inFlight = { case: entry.id }
  writeFileSync(first.reportPath, JSON.stringify(state))
  await expect(runCampaign([entry], root, { ...options, resume: first.reportPath })).rejects.toThrow('Unresolved')
})

it('resumes batch reviews, imports earlier decisions, and refuses tampered retained output', async () => {
  const packets = loadCalibration(root).cases.slice(0, 2).map(c => c.packet)
  const adapter = reviewer()
  const options = { adapter, outputRoot: temp(), maxSessions: 1 }
  const first = await reviewBatch(packets, options)
  expect(first).toMatchObject({ complete: false, stopReason: 'session-budget' })
  expect(adapter.count).toBe(1)
  const complete = await reviewBatch(packets, { ...options, resume: first.reportPath })
  expect(complete.complete).toBe(true)
  expect(adapter.count).toBe(2)
  await reviewBatch(packets, { ...options, resume: first.reportPath })
  expect(adapter.count).toBe(2)
  const initialDecisions = JSON.parse(readFileSync(join(first.reportPath, '../decisions.json')))
  const imported = await reviewBatch(packets, { ...options, initialDecisions })
  expect(imported.complete).toBe(true)
  expect(adapter.count).toBe(2)
  writeFileSync(complete.reviews[0].reportPath, '{}')
  await expect(reviewBatch(packets, { ...options, resume: first.reportPath })).rejects.toThrow('changed')
  expect(existsSync(`${first.reportPath}.lock`)).toBe(false)
})

it('bounds format retry and token spend across resume boundaries without hiding valid failures', async () => {
  const packets = loadCalibration(root).cases.slice(0, 2).map(c => c.packet)
  const adapter = reviewer(['malformed'])
  const options = { adapter, outputRoot: temp(), maxSessions: 1 }
  const first = await reviewBatch(packets, options)
  expect(first.reviews[0].attempts).toHaveLength(1)
  expect(first.stopReason).toBe('session-budget')
  const second = await reviewBatch(packets, { ...options, resume: first.reportPath, maxTokens: 1, maxSessions: 3 })
  expect(adapter.count).toBe(2)
  expect(second.stopReason).toBe('token-budget')
  expect(second.usage.tokens).toBe(30)
  const exhaustedAdapter = reviewer(['bad', 'bad'])
  const failed = await reviewBatch([packets[0]], { ...options, adapter: exhaustedAdapter, maxSessions: 3 })
  expect(failed.reviews[0].attempts).toHaveLength(2)
  await reviewBatch([packets[0]], { ...options, adapter: exhaustedAdapter, resume: failed.reportPath })
  expect(exhaustedAdapter.count).toBe(2)
  const unknownUsage = reviewer()
  const run = unknownUsage.run.bind(unknownUsage)
  unknownUsage.run = async (input) => {
    const result = await run(input)
    result.stdout = JSON.stringify({ type: 'turn.completed' })
    return result
  }
  const missing = await reviewBatch(packets, { ...options, adapter: unknownUsage, maxSessions: 3, maxTokens: 100 })
  expect(missing.stopReason).toBe('token-usage-unavailable')
  expect(unknownUsage.count).toBe(1)
})

it('calibration distinguishes correct, false-success, missing-evidence and scope failures', () => {
  const suite = loadCalibration(root)
  const decisions = suite.cases.map(c => ({ packetHash: c.packet.packetHash, reviewer: { id: 'local-oracle', kind: 'human' }, reviewContext: { fresh: true, blindPacketOnly: true }, dimensions: Object.entries(c.expected).map(([name, status]) => ({ name, status, reason: 'Fixture expected result; not a real judge evaluation.', evidence: ['finalOutput'] })) }))
  expect(scoreCalibration(suite, decisions).status).toBe('passed')
  const allPass = structuredClone(decisions)
  allPass.forEach(d => d.dimensions.forEach((r) => {
    r.status = 'pass'
  }))
  expect(scoreCalibration(suite, allPass)).toMatchObject({ status: 'failed', matched: 1, total: 4 })
  expect(scoreCalibration(suite, decisions.slice(0, 1)).status).toBe('inconclusive')
  expect(suite.cases.every(c => !JSON.stringify(c.packet).includes('expected'))).toBe(true)
  expect(new Set(suite.cases.map(c => hash(c.packet))).size).toBe(4)
})

it('runs the bounded calibration CLI without exposing expected labels to the provider', () => {
  const dir = temp()
  const bin = join(dir, 'provider')
  copyFileSync('tests/engine/fixtures/provider.mjs', bin)
  chmodSync(bin, 0o755)
  const config = join(dir, 'config.toml')
  writeFileSync(config, 'model_provider = "fixture-provider"')
  const args = ['evals/runner/cli.mjs', 'calibrate', '--allow-live', '--max-sessions', '4', '--config-file', config, '--codex-bin', bin, '--output-root', dir]
  const result = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 10000 })
  expect(result.status).toBe(1)
  const output = JSON.parse(result.stdout)
  expect(output.calibration).toMatchObject({ status: 'failed', matched: 1, total: 4 })
  expect(output.usage.sessions).toBe(4)
})
