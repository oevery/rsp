import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { chmodSync, copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, expect, it, vi } from 'vitest'
import { discoverCases, loadCase } from '../../skills/runner/core/cases.mjs'
import { hash } from '../../skills/runner/core/files.mjs'
import { compositionIdentity } from '../../skills/runner/observers/workspace.mjs'

const root = process.cwd()
const cli = join(root, 'tests/skills/runner/cli.mjs')
const temporary = []
function temp() {
  const directory = mkdtempSync(join(tmpdir(), 'rsp-matrix-selection-'))
  temporary.push(directory)
  return directory
}
afterEach(() => temporary.splice(0).forEach(path => rmSync(path, { recursive: true, force: true })))
function provider(directory) {
  const bin = join(directory, 'provider.mjs')
  const config = join(directory, 'provider.toml')
  copyFileSync(join(root, 'tests/code/tooling/fixtures/provider.mjs'), bin)
  chmodSync(bin, 0o755)
  writeFileSync(config, 'model_provider = "fixture-provider"\n')
  return ['--allow-live', '--config-file', config, '--codex-bin', bin, '--output-root', join(directory, 'reports')]
}
function invoke(args, cwd = root) {
  return spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8', timeout: 20000 })
}

it('reviews legacy failed and drifted records once with optional baseline, warnings and immutable originals', () => {
  const directory = temp()
  const sessionsFile = join(directory, 'sessions.jsonl')
  writeFileSync(join(directory, 'provider-control.json'), JSON.stringify({ sessionsFile }))
  const live = provider(directory)
  const executed = invoke(['run', '--case', 'preserve-user-files', '--max-sessions', '2', ...live])
  expect(executed.status, executed.stderr).toBe(0)
  const matrixPath = JSON.parse(executed.stdout).report
  const matrix = JSON.parse(readFileSync(matrixPath))
  const runPath = matrix.runs[0].run
  const run = JSON.parse(readFileSync(runPath))
  delete run.identity.sharedConfigHash
  delete run.retainedEvidence
  run.identity.sourceHash = 'historical-source'
  run.verdict.status = 'inconclusive'
  run.result.cancelled = true
  writeFileSync(runPath, JSON.stringify(run))
  // A record-integrity mismatch is visible evidence, not refusal to inspect.
  const runBytes = readFileSync(runPath)
  const matrixBytes = readFileSync(matrixPath)
  const oldReviewBytes = readFileSync(matrix.runs[0].review)
  const base = ['reassess', '--matrix', matrixPath, '--case', 'preserve-user-files', '--output-root', join(directory, 'reassessments')]
  const preview = invoke(base)
  expect(preview.status, preview.stderr).toBe(0)
  expect(JSON.parse(preview.stdout)).toMatchObject({ status: 'preview', rootSessions: 0, executorSessions: 0 })
  expect(JSON.parse(preview.stdout).warnings.join(' ')).toMatch(/Legacy|hash|incomplete|differs/u)
  expect(readFileSync(sessionsFile, 'utf8').trim().split('\n')).toHaveLength(2)
  const reassessed = invoke([...base, '--baseline', matrixPath, ...live, '--max-sessions', '3'])
  expect(reassessed.status, reassessed.stderr).toBe(0)
  const lineage = JSON.parse(readFileSync(JSON.parse(reassessed.stdout).report))
  expect(lineage).toMatchObject({ rootSessions: 1, executorSessions: 0, originalRunHash: hash(runBytes), baselineRunHash: hash(runBytes), parsed: true })
  expect(readFileSync(lineage.reviewReport, 'utf8')).toContain('Comparison:')
  expect(readFileSync(sessionsFile, 'utf8').trim().split('\n').map(line => JSON.parse(line).role)).toEqual(['executor', 'judge', 'judge'])
  expect(readFileSync(runPath)).toEqual(runBytes)
  expect(readFileSync(matrixPath)).toEqual(matrixBytes)
  expect(readFileSync(matrix.runs[0].review)).toEqual(oldReviewBytes)
  const missing = invoke(['reassess', '--matrix', join(directory, 'missing/matrix.json'), '--case', 'preserve-user-files'])
  expect(missing.status).toBe(2)
  expect(missing.stderr).toContain('REASSESS_REPORT')
  const absent = invoke(['reassess', '--matrix', matrixPath, '--case', 'trigger-rsp-review'])
  expect(absent.status).toBe(2)
  expect(absent.stderr).toContain('REASSESS_SELECTION')
}, 30000)

it('continues independent cases after task failures or unparsed reviews and tolerates a baseline subset', () => {
  const directory = temp()
  const live = provider(directory)
  const baseline = invoke(['run', '--case', 'preserve-user-files', '--max-sessions', '2', ...live])
  expect(baseline.status, baseline.stderr).toBe(0)
  const baselinePath = JSON.parse(baseline.stdout).report
  for (const control of [{ failTask: true }, { unparsedReview: true }, { traceGap: true }]) {
    writeFileSync(join(directory, 'provider-control.json'), JSON.stringify(control))
    const result = invoke(['run', '--case', 'preserve-user-files,trigger-rsp-review', '--baseline', baselinePath, '--max-sessions', '4', ...live])
    expect(result.status, result.stderr).toBe(control.traceGap ? 0 : 1)
    const matrix = JSON.parse(readFileSync(JSON.parse(result.stdout).report))
    expect(matrix).toMatchObject({ complete: true, rootSessions: 4 })
    expect(matrix.runs).toHaveLength(2)
    const first = matrix.runs[0]
    expect(readFileSync(first.reviewReport, 'utf8')).toContain(control.unparsedReview ? 'Useful report' : 'Comparison:')
    expect(first.status).toBe(control.failTask ? 'failed' : control.traceGap ? 'passed' : 'inconclusive')
    if (control.traceGap)
      expect(first.mechanical.status).toBe('inconclusive')
    const secondReview = JSON.parse(readFileSync(matrix.runs[1].review))
    expect(secondReview.warnings.join(' ')).toContain('no comparison evidence')
    expect(existsSync(matrix.runs[1].reviewReport)).toBe(true)
  }
  const reassessed = invoke(['reassess', '--matrix', baselinePath, '--case', 'preserve-user-files', '--baseline', JSON.parse(readFileSync(baselinePath)).runs[0].run])
  expect(reassessed.status).toBe(2) // An unreadable matrix is a configuration error, not a missing member.
}, 30000)

it('freezes an external composition across actual multi-case CLI runs and refuses mid-matrix drift', () => {
  const directory = temp()
  const composition = join(directory, 'candidate')
  cpSync(join(root, 'skills'), composition, { recursive: true })
  const identity = compositionIdentity(composition)
  const args = ['run', '--case', 'preserve-user-files,trigger-rsp-review', '--composition', composition, '--max-sessions', '4', ...provider(directory)]
  const stable = invoke(args)
  expect(stable.status, stable.stderr).toBe(0)
  const matrix = JSON.parse(readFileSync(JSON.parse(stable.stdout).report))
  expect(matrix).toMatchObject({ status: 'passed', complete: true, composition: identity })
  expect(matrix.runs).toHaveLength(2)
  for (const item of matrix.runs)
    expect(JSON.parse(readFileSync(item.run)).identity.compositionHash).toBe(identity.hash)

  writeFileSync(join(directory, 'provider-control.json'), JSON.stringify({ compositionFile: join(composition, 'rsp/SKILL.md') }))
  const drifted = invoke(args)
  expect(drifted.status, drifted.stderr).toBe(1)
  const rejected = JSON.parse(readFileSync(JSON.parse(drifted.stdout).report))
  expect(rejected).toMatchObject({ status: 'inconclusive', complete: false, composition: identity })
  expect(rejected.runs).toHaveLength(2)
  expect(rejected.runs[0].status).toBe('passed')
  const refused = JSON.parse(readFileSync(rejected.runs[1].run))
  expect(refused.verdict).toMatchObject({ status: 'inconclusive', reason: 'composition-failed' })
  expect(refused.result).toBeUndefined()
  expect(refused.identity.compositionHash).not.toBe(identity.hash)
}, 30000)

it.skipIf(process.platform === 'win32').each([
  ['SIGINT', 'executor'],
  ['SIGTERM', 'executor'],
  ['SIGINT', 'judge'],
  ['SIGTERM', 'judge'],
])('saves CLI %s cancellation during %s and reaps the process group without another session', async (signal, role) => {
  const directory = temp()
  const readyFile = join(directory, 'ready.json')
  const sessionsFile = join(directory, 'sessions.jsonl')
  const progressFailure = signal === 'SIGTERM' && role === 'judge'
  writeFileSync(join(directory, 'provider-control.json'), JSON.stringify({ holdRole: role, readyFile, sessionsFile, activityChunks: ['Bearer fixture-', 'secret-value'] }))
  const args = ['run', '--case', 'preserve-user-files,trigger-rsp-review', '--max-sessions', '4', ...provider(directory)]
  const child = spawn(process.execPath, [cli, ...args], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
  let stdout = ''
  let stderr = ''
  child.stdout.on('data', chunk => stdout += chunk)
  child.stderr.on('data', chunk => stderr += chunk)
  const closed = new Promise(resolve => child.on('close', (code, signal) => resolve({ code, signal })))
  let pids
  const watchdog = setTimeout(() => child.kill('SIGKILL'), 15000)
  try {
    await vi.waitFor(() => expect(existsSync(readyFile), stderr).toBe(true), { timeout: 10000, interval: 25 })
    pids = JSON.parse(readFileSync(readyFile))
    const reportRoot = join(directory, 'reports', readdirSync(join(directory, 'reports'))[0])
    const progressPath = join(reportRoot, 'progress.json')
    await vi.waitFor(() => {
      const progress = JSON.parse(readFileSync(progressPath))
      expect(progress).toMatchObject({ caseId: 'preserve-user-files', role, state: 'process-started' })
      expect(progress.outputChunks).toBeGreaterThan(0)
      expect(Date.parse(progress.lastOutputAt)).toBeGreaterThanOrEqual(Date.parse(progress.processStartedAt))
      expect(Object.keys(progress).sort()).toEqual(['caseId', 'lastOutputAt', 'observedAt', 'outputChunks', 'phase', 'phaseStartedAt', 'processStartedAt', 'role', 'schema', 'startedAt', 'state', 'stderrBytes', 'stdoutBytes'].sort())
    }, { timeout: 3000, interval: 25 })
    // Still running despite complete output followed by silence: activity is not
    // completion, and no idle deadline is inferred. stdout is final-JSON-only.
    expect(child.exitCode).toBeNull()
    expect(stdout).toBe('')
    if (progressFailure) {
      rmSync(progressPath)
      mkdirSync(progressPath)
      await vi.waitFor(() => expect(stderr).toContain('PROGRESS_WRITE_FAILED'), { timeout: 3000, interval: 25 })
      expect(child.exitCode).toBeNull()
    }
    else {
      await vi.waitFor(() => expect(JSON.parse(readFileSync(progressPath)).stderrBytes).toBeGreaterThan(0), { timeout: 3000, interval: 25 })
      expect(readFileSync(progressPath, 'utf8')).not.toMatch(/Bearer|fixture-secret|activityChunks/u)
    }
    child.kill(signal)
    expect(await closed).toEqual({ code: 1, signal: null })
    const matrix = JSON.parse(readFileSync(JSON.parse(stdout).report))
    const sessionCount = role === 'executor' ? 1 : 2
    expect(matrix).toMatchObject({ timeoutMs: null, cancelled: true, cancellationReason: signal, status: 'inconclusive', complete: false, rootSessions: sessionCount })
    expect(matrix.progressError).toBe(progressFailure ? 'PROGRESS_WRITE_FAILED' : null)
    if (progressFailure)
      expect(stderr).toContain('PROGRESS_WRITE_FAILED')
    expect(matrix.runs).toHaveLength(1)
    expect(readFileSync(sessionsFile, 'utf8').trim().split('\n')).toHaveLength(sessionCount)
    const run = JSON.parse(readFileSync(matrix.runs[0].run))
    expect(run.timeoutMs).toBeNull()
    expect(run.observation.changedPaths).toContain('src/requested.mjs')
    expect(readFileSync(join(dirname(matrix.runs[0].run), 'events.jsonl'), 'utf8')).toContain('turn.completed')
    const interrupted = role === 'executor' ? run : JSON.parse(readFileSync(matrix.runs[0].review))
    expect(interrupted).toMatchObject({ timeoutMs: null, cancelled: true, cancellationReason: signal })
    expect(role === 'executor' ? interrupted.result : interrupted.attempts[0].result).toMatchObject({ exitCode: 0, timedOut: false, cancelled: true })
    if (role === 'executor')
      expect(matrix.runs[0].review).toBeUndefined()
    else
      expect(interrupted.decision).toBeUndefined()
    await vi.waitFor(() => {
      for (const pid of Object.values(pids))
        expect(() => process.kill(pid, 0)).toThrow()
    }, { timeout: 3000, interval: 25 })
  }
  finally {
    clearTimeout(watchdog)
    child.kill('SIGKILL')
    if (!pids && existsSync(readyFile))
      pids = JSON.parse(readFileSync(readyFile))
    if (pids) {
      try {
        process.kill(-pids.pid, 'SIGKILL')
      }
      catch {}
    }
    await closed
  }
}, 20000)

it('rejects model total deadlines before starting a session', () => {
  const directory = temp()
  const readyFile = join(directory, 'ready.json')
  const sessionsFile = join(directory, 'sessions.jsonl')
  writeFileSync(join(directory, 'provider-control.json'), JSON.stringify({ holdRole: 'executor', readyFile, sessionsFile }))
  const args = ['run', '--case', 'preserve-user-files', '--max-sessions', '2', ...provider(directory)]
  const overflow = invoke([...args, '--timeout-ms', '2147483648'])
  expect(overflow.status).toBe(2)
  expect(existsSync(sessionsFile)).toBe(false)
  for (const command of [args, ['reassess', '--matrix', directory]]) {
    const result = invoke([...command, '--timeout-ms', '1000'])
    expect(result.status, result.stderr).toBe(2)
    expect(existsSync(sessionsFile)).toBe(false)
  }
}, 25000)

it('selects and runs a small case without unrelated history, but explicitly rejects a selected real snapshot', () => {
  const repository = temp()
  execFileSync('git', ['init', '--quiet', repository])
  for (const path of ['src', 'bin', 'rules', 'skills', 'dist', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'tsup.config.ts', 'tests/skills/runner', 'tests/skills/config.toml', 'tests/skills/cases/behavior/preserve-user-files', 'tests/skills/cases/real/cli-contract', 'tests/skills/projects/small/preserve-user-files', 'tests/skills/projects/real/rsp-cli']) {
    const destination = join(repository, path)
    mkdirSync(dirname(destination), { recursive: true })
    cpSync(join(root, path), destination, { recursive: true })
  }
  expect(discoverCases(repository).map(entry => entry.id)).toEqual(['preserve-user-files', 'real-cli-contract'])
  expect(loadCase(repository, 'preserve-user-files').project.kind).toBe('fixture')
  expect(() => loadCase(repository, 'real-cli-contract')).toThrow('Selected project unavailable: real-cli-contract')
  for (const command of ['list', 'plan', 'check']) {
    const small = invoke([command, '--case', 'preserve-user-files'], repository)
    expect(small.status, small.stderr).toBe(0)
    const real = invoke([command, '--case', 'real-cli-contract'], repository)
    expect(real.status).toBe(2)
    expect(real.stderr).toContain('Selected project unavailable: real-cli-contract')
  }
  const args = ['run', '--max-sessions', '2', ...provider(temp())]
  const small = invoke([...args, '--case', 'preserve-user-files'], repository)
  expect(small.status, small.stderr || small.stdout).toBe(0)
  expect(JSON.parse(small.stdout).status).toBe('passed')
  const real = invoke([...args, '--case', 'real-cli-contract'], repository)
  expect(real.status).toBe(2)
  expect(real.stderr).toContain('Selected project unavailable: real-cli-contract')
}, 30000)
