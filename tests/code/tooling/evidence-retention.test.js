import { Buffer } from 'node:buffer'
import { chmodSync, closeSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, openSync, readdirSync, readFileSync, rmSync, symlinkSync, truncateSync, writeFileSync, writeSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it, vi } from 'vitest'
import { createOpenCodexAdapter } from '../../skills/runner/adapters/opencodex.mjs'
import { loadCase } from '../../skills/runner/core/cases.mjs'
import { prepareWorkspace, runCase, workspaceObservation } from '../../skills/runner/core/execute.mjs'
import { hash, hashFile } from '../../skills/runner/core/files.mjs'
import { reviewRun } from '../../skills/runner/core/review.mjs'
import { retainSessionTools } from '../../skills/runner/observers/session-tools.mjs'

const temporary = []
function temp() {
  const dir = mkdtempSync(join(tmpdir(), 'rsp-evidence-retention-'))
  temporary.push(dir)
  return dir
}
afterEach(() => temporary.splice(0).forEach(path => rmSync(path, { recursive: true, force: true })))

it('preserves public task evidence through execution and review while removing only injected credentials', async () => {
  const directory = temp()
  const codexBin = join(directory, 'provider')
  copyFileSync('tests/code/tooling/fixtures/provider.mjs', codexBin)
  chmodSync(codexBin, 0o755)
  const configFile = join(directory, 'provider.toml')
  writeFileSync(configFile, 'model_provider = "fixture-provider"\n[model_providers.fixture-provider]\nname = "Fixture Provider"\nbase_url = "https://api.example.test/v1"\n')
  const authFile = join(directory, 'auth.json')
  writeFileSync(authFile, JSON.stringify({ OPENAI_API_KEY: 'synthetic-api-key-value', tokens: { access_token: 'synthetic-access-token', account_id: 'fixture-account-id' }, last_refresh: '2026-10-03T00:00:00Z' }))
  const publicText = [
    '迁移说明：https://docs.example.org/authentication/migrations/legacy-token-query-parameter-to-authorization-bearer-header',
    'Issue: https://github.com/example/service/issues/123',
    'Use a Bearer header; Bearer authentication is required.',
    'Fixture Provider https://api.example.test/v1 fixture-account-id 2026-10-03T00:00:00Z',
  ].join('\n')
  const finalOutput = `${publicText}\nsynthetic-api-key-value synthetic-access-token`
  const argv = ['/bin/zsh', '-lc', `node -e 'console.log("quoted")'\nprintf done`]
  const sessionRecords = [
    { type: 'session_meta', payload: { id: 'fixture-root', base_instructions: 'PRIVATE-INSTRUCTIONS' } },
    { type: 'response_item', payload: { type: 'message', content: 'PRIVATE-CONTEXT' } },
    { type: 'response_item', payload: { type: 'custom_tool_call', call_id: 'outer', name: 'exec', input: 'console.log("synthetic-api-key-value")' } },
    { type: 'event_msg', payload: { type: 'item_completed', item: { type: 'CommandExecution', id: 'cmd', command: argv, aggregated_output: 'PASS: missing tenant\nsynthetic-access-token', exit_code: 0 } } },
    { type: 'response_item', payload: { type: 'custom_tool_call_output', call_id: 'outer', output: 'PASS: missing tenant\nPASS: final check' } },
    'malformed session record',
  ]
  writeFileSync(join(directory, 'provider-control.json'), JSON.stringify({ finalOutput, sessionRecords }))
  const adapter = createOpenCodexAdapter({ codexBin, configFile, authFile, model: 'fixture', effort: 'low' })
  const entry = loadCase(process.cwd(), 'preserve-user-files')
  entry.manifest.prompt += `\n${publicText}`
  const run = await runCase(entry, process.cwd(), { adapter, outputRoot: temp() })
  expect(run.verdict.status).toBe('passed')
  const expected = `${publicText}\n[REDACTED] [REDACTED]`
  const assertEvidence = (path) => {
    expect(readFileSync(join(path, 'final.md'), 'utf8')).toBe(expected)
    const record = readFileSync(join(path, 'run.json'), 'utf8')
    expect(JSON.parse(record).caseSpec.prompt).toContain(publicText)
    const events = readFileSync(join(path, 'events.jsonl'), 'utf8')
    const answer = events.trim().split('\n').map(line => JSON.parse(line)).find(event => event.item?.type === 'agent_message')
    expect(answer.item.text).toBe(expected)
    expect(record + events).not.toContain('synthetic-api-key-value')
    expect(record + events).not.toContain('synthetic-access-token')
    const tools = readFileSync(join(path, 'session-tools.jsonl'), 'utf8')
    const retained = tools.trim().split('\n').map(line => JSON.parse(line))
    expect(retained).toHaveLength(3)
    expect(retained[1]).toMatchObject({ sessionId: 'fixture-root', line: 4, event: { payload: { item: { command: argv, aggregated_output: 'PASS: missing tenant\n[REDACTED]' } } } })
    expect(tools).toContain('PASS: final check')
    expect(tools).not.toMatch(/PRIVATE-INSTRUCTIONS|PRIVATE-CONTEXT|synthetic-api-key-value|synthetic-access-token/u)
    expect(JSON.parse(record).result.toolEvidence).toMatchObject({ records: 3, gaps: [{ reason: 'malformed-record', line: 6 }] })
  }
  assertEvidence(run.reportDirectory)
  const review = await reviewRun(run, { outputRoot: temp(), adapter: {
    settings: {},
    redact: adapter.redact,
    async run({ workspace, prompt }) {
      assertEvidence(join(workspace, 'current'))
      expect(prompt).toContain('https://github.com/example/service/issues/123')
      const fence = String.fromCharCode(96).repeat(3)
      return { exitCode: 0, stdout: JSON.stringify({ type: 'turn.completed' }), finalOutput: `${fence}json\n{"status":"passed"}\n${fence}` }
    },
  } })
  expect(review.status).toBe('passed')
  assertEvidence(join(review.reportPath, '..', 'evidence/current'))
})

it('observes ignored mutations beyond former snapshot count and byte quotas', () => {
  const workspace = prepareWorkspace(loadCase(process.cwd(), 'preserve-user-files'), process.cwd())
  temporary.push(workspace)
  writeFileSync(join(workspace, '.git/info/exclude'), 'node_modules/\n')
  const cache = join(workspace, 'node_modules')
  mkdirSync(cache)
  for (let i = 0; i < 10001; i++)
    writeFileSync(join(cache, `${i}.txt`), 'baseline')
  const large = join(cache, 'large.bin')
  writeFileSync(large, '')
  truncateSync(large, 65 * 1024 * 1024)
  const baseline = workspaceObservation(workspace)
  expect(baseline.files['node_modules/0.txt']).toBe(hash('0:baseline'))
  const fd = openSync(large, 'r+')
  try {
    writeSync(fd, Buffer.from('changed'), 0, 7, 65 * 1024 * 1024 - 7)
  }
  finally { closeSync(fd) }
  const after = workspaceObservation(workspace, baseline)
  expect(after.changedPaths).toEqual(['node_modules/large.bin'])
  expect(after.status).not.toContain('node_modules')
})

it.each(['escape', 'symlink', 'tampered'])('refuses unsafe retained stream evidence: %s', async (mode) => {
  const source = temp()
  const outside = join(temp(), 'private.jsonl')
  writeFileSync(outside, '{"type":"turn.completed"}\n')
  const stream = join(source, 'events.jsonl')
  if (mode === 'symlink')
    symlinkSync(outside, stream)
  else
    writeFileSync(stream, 'changed')
  const adapter = { settings: {}, run: vi.fn() }
  const result = await reviewRun({ reportDirectory: source, result: { stdoutFile: mode === 'escape' ? '../private.jsonl' : 'events.jsonl', streamHashes: { stdout: hashFile(outside) } } }, { adapter, outputRoot: temp() })
  expect(result.status).toBe('inconclusive')
  expect(adapter.run).not.toHaveBeenCalled()
})

it.each(['escape', 'symlink', 'tampered'])('refuses unsafe session tool evidence before independent review: %s', async (mode) => {
  const source = temp()
  const outside = join(temp(), 'private.jsonl')
  writeFileSync(outside, 'private tool data')
  const path = join(source, 'session-tools.jsonl')
  if (mode === 'symlink')
    symlinkSync(outside, path)
  else
    writeFileSync(path, 'changed')
  const adapter = { settings: {}, run: vi.fn() }
  const review = await reviewRun({ reportDirectory: source, result: { toolEvidence: { file: mode === 'escape' ? '../private.jsonl' : 'session-tools.jsonl', hash: hashFile(outside) } } }, { adapter, outputRoot: temp() })
  expect(review.status).toBe('inconclusive')
  expect(adapter.run).not.toHaveBeenCalled()
})

it('reports unavailable session tools and excludes linked session directories', () => {
  const home = temp()
  const output = temp()
  expect(retainSessionTools(home, output, value => value).gaps).toContainEqual({ reason: 'no-tool-records' })
  const privateDirectory = temp()
  writeFileSync(join(privateDirectory, 'private.jsonl'), 'private session')
  symlinkSync(privateDirectory, join(home, 'sessions'))
  expect(retainSessionTools(home, output, value => value).gaps).toContainEqual({ source: 'sessions', reason: 'link-or-special-file' })
  expect(readFileSync(join(output, 'session-tools.jsonl'), 'utf8')).toBe('')
})

it('offers compact review navigation without hiding failures or losing complete sanitized evidence', async () => {
  const outputRoot = temp()
  const script = `node <<'NODE'\nconst pattern = /\\[[^\\]]+\\]\\(([^)]+)\\)/g\n// ${'x'.repeat(1000)}\nNODE`
  const command = `/bin/zsh -lc ${JSON.stringify(script).replaceAll('\\n', '\n')}`
  const event = { type: 'item.completed', source_thread_id: 'actor', item: { id: '../unsafe', type: 'command_execution', command, exit_code: 2, aggregated_output: `synthetic-credential${'output'.repeat(200000)}` } }
  const run = { result: { exitCode: 2, stdout: `\n${JSON.stringify(event)}\ninvalid` }, hard: { status: 'failed', failures: ['boundary'] }, retainedEvidence: { workspace: { omitted: Array.from({ length: 6000 }, (_, i) => ({ path: `.tooling/${i}`, reason: 'runtime' })) } } }
  let reviewWorkspace
  const review = await reviewRun(run, { outputRoot, baseline: {}, adapter: {
    settings: { model: 'fixture' },
    redact: text => text.replaceAll('synthetic-credential', '[REDACTED]'),
    async run({ workspace }) {
      reviewWorkspace = workspace
      expect(readFileSync(join(workspace, 'evidence-index.json'), 'utf8').length).toBeLessThan(10000)
      const summary = JSON.parse(readFileSync(join(workspace, 'current/summary.json')))
      expect(JSON.stringify(summary).length).toBeLessThan(5000)
      expect(summary.execution.exitCode).toBe(2)
      expect(summary.checks.hard.status).toBe('failed')
      expect(summary.trace.parseFailures).toBe(1)
      expect(summary.execution.timedOut).toBeNull()
      expect(summary.sessionTools.gaps).toEqual([{ reason: 'not-retained' }])
      expect(JSON.parse(readFileSync(join(workspace, 'comparison/summary.json'))).git.headUnchanged).toBeNull()
      const tool = JSON.parse(readFileSync(join(workspace, 'current/tool-index.jsonl'), 'utf8'))
      expect(tool).toMatchObject({ traceLine: 2, exitCode: 2, commandTruncated: true })
      const full = JSON.parse(readFileSync(join(workspace, 'current', tool.evidence)))
      expect(full.source_thread_id).toBe('actor')
      expect(full.item.command).toBe(event.item.command)
      expect(full.derivedCommand).toEqual({ source: 'literal-shell-decoding', argv: ['/bin/zsh', '-lc', script] })
      expect(full.item.aggregated_output).toBe(event.item.aggregated_output.replace('synthetic-credential', '[REDACTED]'))
      return { exitCode: 0, stdout: JSON.stringify({ type: 'turn.completed' }), finalOutput: '```json\n{"status":"failed"}\n```' }
    },
  } })
  expect(review.status).toBe('failed')
  expect(existsSync(reviewWorkspace)).toBe(false)
  expect(run.result.stdout).toContain('synthetic-credential')
  const index = JSON.parse(readFileSync(join(review.reportPath, '..', 'evidence-index.json')))
  const retained = join(review.reportPath, '..', index.current.retainedView)
  expect(JSON.parse(readFileSync(join(retained, 'run.json'))).retainedEvidence.workspace.omitted).toHaveLength(6000)
  expect(readFileSync(join(retained, 'events.jsonl'), 'utf8')).toContain('invalid')
  expect(readFileSync(join(retained, 'tool-events/000002.json'), 'utf8')).not.toContain('synthetic-credential')
})

it('retains large task text and initial Skill context before cleanup, with explicit safe omissions', async () => {
  const outputRoot = temp()
  const privateFile = join(temp(), 'private.txt')
  writeFileSync(privateFile, 'outside workspace')
  const large = `export const requested = true\n${'// task artifact\n'.repeat(5000)}`
  const entry = loadCase(process.cwd(), 'preserve-user-files')
  const adapter = {
    id: 'local-test',
    settings: { provider: 'fixture', model: 'none', effort: 'none' },
    redact: text => text.replaceAll('synthetic-credential', '[REDACTED]'),
    async run({ workspace }) {
      writeFileSync(join(workspace, 'src/requested.mjs'), large)
      writeFileSync(join(workspace, '.env'), 'TOKEN=synthetic-credential')
      mkdirSync(join(workspace, 'auth'))
      writeFileSync(join(workspace, 'auth/README.md'), 'Use a Bearer header.')
      writeFileSync(join(workspace, 'fixture.key'), 'synthetic key fixture')
      mkdirSync(join(workspace, 'dist'))
      writeFileSync(join(workspace, 'dist/report.txt'), 'generated task evidence')
      writeFileSync(join(workspace, 'binary.dat'), Buffer.from([0, 1, 2]))
      symlinkSync(privateFile, join(workspace, 'outside-link'))
      return { exitCode: 0, stdout: JSON.stringify({ type: 'item.completed', item: { type: 'command_execution', command: 'echo result', exit_code: 0, aggregated_output: 'synthetic-credential result' } }), stderr: '', finalOutput: 'Task output.', durationMs: 1 }
    },
  }
  const run = await runCase(entry, process.cwd(), { adapter, outputRoot, composition: join(process.cwd(), 'skills') })
  expect(existsSync(run.context.workspace)).toBe(false)
  expect(run.observation.omittedArtifacts).toContain('src/requested.mjs')
  expect(readFileSync(join(run.reportDirectory, 'workspace/src/requested.mjs'), 'utf8')).toBe(large)
  expect(readFileSync(join(run.reportDirectory, 'baseline/.agents/skills/rsp/SKILL.md'), 'utf8')).toContain('name: rsp')
  expect(run.retainedEvidence.workspace.omitted).toEqual(expect.arrayContaining([{ path: 'binary.dat', reason: 'binary' }, { path: 'outside-link', reason: 'link-or-special-file' }]))
  for (const [path, content] of Object.entries({ '.env': 'TOKEN=[REDACTED]', 'auth/README.md': 'Use a Bearer header.', 'fixture.key': 'synthetic key fixture', 'dist/report.txt': 'generated task evidence' }))
    expect(readFileSync(join(run.reportDirectory, 'workspace', path), 'utf8')).toBe(content)
  expect(existsSync(join(run.reportDirectory, 'workspace/outside-link'))).toBe(false)
  expect(readFileSync(join(run.reportDirectory, 'events.jsonl'), 'utf8')).toContain('[REDACTED] result')
  const reviewer = {
    settings: { provider: 'local-test', model: 'none' },
    async run({ workspace, prompt }) {
      expect(prompt.length).toBeLessThan(10000)
      expect(readFileSync(join(workspace, 'current/workspace/src/requested.mjs'), 'utf8')).toBe(large)
      expect(readFileSync(join(workspace, 'current/baseline/.agents/skills/rsp/SKILL.md'), 'utf8')).toContain('name: rsp')
      expect(readFileSync(join(workspace, 'current/events.jsonl'), 'utf8')).toContain('[REDACTED] result')
      expect(readFileSync(join(workspace, 'current/workspace/auth/README.md'), 'utf8')).toBe('Use a Bearer header.')
      expect(readFileSync(join(workspace, 'current/workspace/.env'), 'utf8')).toBe('TOKEN=[REDACTED]')
      expect(readFileSync(join(workspace, 'current/workspace/dist/report.txt'), 'utf8')).toBe('generated task evidence')
      return { exitCode: 0, stdout: JSON.stringify({ type: 'turn.completed' }), stderr: '', finalOutput: `Review: current/workspace/src/requested.mjs is available.\n\n${String.fromCharCode(96).repeat(3)}json\n{"status":"failed"}\n${String.fromCharCode(96).repeat(3)}`, durationMs: 1 }
    },
  }
  const review = await reviewRun(run, { adapter: reviewer, outputRoot })
  expect(review.status).toBe('failed')
  const index = JSON.parse(readFileSync(join(review.reportPath, '..', 'evidence-index.json')))
  expect(index.current.source).toMatchObject({ directory: run.reportDirectory, hash: hash(readFileSync(join(run.reportDirectory, 'run.json'))) })
  expect(readFileSync(join(index.current.source.directory, 'workspace/src/requested.mjs'), 'utf8')).toBe(large)
})

it('records auxiliary baseline retention failure without skipping the executor', async () => {
  const outputRoot = temp()
  const adapter = { id: 'local-test', settings: { provider: 'fixture', model: 'none', effort: 'none' }, run: vi.fn(async () => ({ exitCode: 0, stdout: '', stderr: '', finalOutput: 'Completed.', durationMs: 1 })) }
  const run = await runCase(loadCase(process.cwd(), 'preserve-user-files'), process.cwd(), { adapter, outputRoot, onActivity({ phase }) {
    // Actual filesystem fault: the destination's parent cannot be a directory.
    if (phase === 'composition')
      writeFileSync(join(outputRoot, readdirSync(outputRoot)[0], 'baseline'), 'blocked')
  } })
  expect(adapter.run).toHaveBeenCalledOnce()
  expect(run.retainedEvidence.baseline.omitted).toContainEqual({ path: 'src/requested.mjs', reason: 'unreadable' })
  expect(run.retainedEvidence.workspace.retained).toContain('src/requested.mjs')
})
