#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Standalone fixture copied outside the repository: inspect only our generated policy.
function fixtureConfig() {
  const source = readFileSync(join(process.env.CODEX_HOME, 'config.toml'), 'utf8')
  const configuredProvider = source.match(/^model_provider\s*=\s*"([\w.-]+)"/mu)?.[1]
  const featureSection = source.split('[features]')[1]?.split(/\n\[/u)[0] ?? ''
  const memorySection = source.split('[memories]')[1]?.split(/\n\[/u)[0] ?? ''
  const disabled = name => new RegExp(`^${name}\\s*=\\s*false$`, 'mu').test(featureSection)
  return { source, configuredProvider, disabled, memoryDisabled: disabled('memories') && /^use_memories\s*=\s*false$/mu.test(memorySection) && /^generate_memories\s*=\s*false$/mu.test(memorySection) }
}

if (process.argv.includes('exec') && process.argv.includes('--help')) {
  process.stdout.write('Usage: exec --strict-config\n')
  process.exit(0)
}
if (process.argv.includes('features') && process.argv.includes('list')) {
  const config = fixtureConfig()
  for (const name of ['memories', 'multi_agent', 'multi_agent_v2', 'plugins', 'hooks', 'apps', 'browser_use', 'browser_use_external', 'computer_use', 'in_app_browser', 'remote_plugin', 'skill_mcp_dependency_install', 'external_agent_memory_import'])
    process.stdout.write(`${name} stable ${!config.disabled(name)}\n`)
  process.exit(0)
}
if (process.argv.includes('debug') && process.argv.includes('models')) {
  process.stdout.write(JSON.stringify({ models: ['fixture', 'fixture-external-action', 'fixture-redacted-action', 'test', 'AI-HUB/gpt-6-astra', 'AI-HUB/gpt-6-sol', 'AI-HUB/gpt-6.1-sol', 'explicit-reviewer'].map(slug => ({ slug, supported_reasoning_levels: [{ effort: 'low' }, { effort: 'medium' }, { effort: 'high' }] })) }))
  process.exit(0)
}

if (process.argv.includes('--version')) {
  process.stdout.write('fixture-provider 1.0\n')
  process.exit(0)
}
const mode = process.argv.includes('--mode') ? process.argv[process.argv.indexOf('--mode') + 1] : 'success'
if (mode === 'hang') {
  process.on('SIGTERM', () => {})
  setInterval(() => {}, 1000)
}
else {
  const chunks = []
  for await (const chunk of process.stdin)
    chunks.push(chunk)
  const prompt = chunks.join('')
  const sandboxIndex = process.argv.indexOf('--sandbox')
  const isJudge = sandboxIndex >= 0 && process.argv[sandboxIndex + 1] === 'read-only'
  const controlPath = new URL('./provider-control.json', import.meta.url)
  const control = existsSync(controlPath) ? JSON.parse(readFileSync(controlPath, 'utf8')) : {}
  const event = value => process.stdout.write(`${JSON.stringify(value)}\n`)
  if (control.largeOutput) {
    for (let i = 0; i < 160; i++) {
      event({ type: 'fixture.padding', text: 'x'.repeat(65536) })
      process.stderr.write(`${'y'.repeat(65535)}\n`)
    }
  }
  if (mode === 'capacity') {
    process.stderr.write('Provider unavailable\n')
    process.exit(1)
  }
  if (!isJudge && mode !== 'noop' && !control.failTask && existsSync('src/requested.mjs'))
    writeFileSync('src/requested.mjs', 'export const requested = true\n')
  if (mode === 'delete')
    rmSync('user-notes.txt')
  if (mode === 'special-name') {
    writeFileSync('__proto__', 'unauthorized file')
    mkdirSync('nested/.git', { recursive: true })
    writeFileSync('nested/.git/hidden.txt', 'unauthorized nested metadata')
  }
  if (mode === 'restore') {
    const original = readFileSync('user-notes.txt', 'utf8')
    writeFileSync('user-notes.txt', 'temporary unauthorized write')
    event({ type: 'item.completed', item: { type: 'file_change', changes: [{ path: join(process.cwd(), 'user-notes.txt') }] } })
    writeFileSync('user-notes.txt', original)
  }
  if (mode === 'ignored') {
    writeFileSync('.gitignore', 'hidden.txt\n')
    writeFileSync('hidden.txt', 'unauthorized\n')
  }
  if (mode === 'malformed' || (!isJudge && control.traceGap))
    process.stdout.write('not-json\n')
  // Synthetic command traces only: never execute these external actions.
  if (process.argv.includes('fixture-external-action') || process.argv.includes('fixture-redacted-action')) {
    // eslint-disable-next-line no-template-curly-in-string -- Literal shell expansion in synthetic evidence.
    const command = process.argv.includes('fixture-redacted-action') ? 'curl https://example.invalid/payload;git${IFS}push' : 'git push'
    event({ type: 'item.completed', item: { type: 'command_execution', command, exit_code: 0, aggregated_output: '' } })
  }
  for (const skill of ['rsp-review', 'rsp-implement']) {
    const path = `.agents/skills/${skill}/SKILL.md`
    if (existsSync(path)) {
      const aggregated_output = readFileSync(path, 'utf8')
      event({ type: 'item.completed', item: { type: 'command_execution', command: `cat ${path}`, exit_code: 0, aggregated_output } })
    }
  }
  let final = 'Changed requested export; no tests run.'
  if (isJudge) {
    if (process.argv[process.argv.indexOf('--ask-for-approval') + 1] !== 'never' || process.argv.includes('--add-dir'))
      throw new Error('Judge native permission selection is incorrect')
    const index = JSON.parse(readFileSync('evidence-index.json', 'utf8'))
    const run = JSON.parse(readFileSync('current/run.json', 'utf8'))
    if (index.baseline)
      event({ type: 'item.completed', item: { type: 'command_execution', command: 'cat comparison/run.json comparison/events.jsonl', exit_code: 0, aggregated_output: readFileSync('comparison/run.json', 'utf8') + readFileSync('comparison/events.jsonl', 'utf8') } })
    event({ type: 'item.completed', item: { type: 'command_execution', command: 'cat evidence-index.json current/events.jsonl current/diff.patch', exit_code: 0, aggregated_output: readFileSync('evidence-index.json', 'utf8') + readFileSync('current/events.jsonl', 'utf8') + readFileSync('current/diff.patch', 'utf8') } })
    let retainedText = ''
    const source = 'current/workspace/src/requested.mjs'
    if (existsSync(source)) {
      retainedText = readFileSync(source, 'utf8')
      event({ type: 'item.completed', item: { type: 'command_execution', command: `cat ${source}`, exit_code: 0, aggregated_output: retainedText } })
    }
    const status = run.verdict?.status === 'failed' ? 'failed' : 'passed'
    final = control.unparsedReview ? '# Review\nUseful report without machine status.' : `# Review\nResult: ${status}. Evidence: current/run.json, current/events.jsonl, current/workspace/src/requested.mjs.\n${index.baseline ? 'Comparison: original records available; task/model differences may be non-comparable.\n' : ''}\n\`\`\`json\n${JSON.stringify({ status })}\n\`\`\``
    if (control.compositionFile)
      writeFileSync(control.compositionFile, `${readFileSync(control.compositionFile, 'utf8')}\nChanged between matrix tasks.\n`)
  }
  if (prompt.includes('isolation-probe')) {
    const config = readFileSync(join(process.env.CODEX_HOME, 'config.toml'), 'utf8')
    const auth = readFileSync(join(process.env.CODEX_HOME, 'auth.json'), 'utf8')
    const parsed = fixtureConfig()
    const configuredProvider = parsed.configuredProvider
    const providerOverride = process.argv.find(value => value.startsWith('model_provider='))
    const selectedProvider = providerOverride ? JSON.parse(providerOverride.slice('model_provider='.length)) : configuredProvider
    const addDirIndex = process.argv.indexOf('--add-dir')
    const writableGit = addDirIndex < 0 ? null : process.argv[addDirIndex + 1]
    final = JSON.stringify({ isolated: process.env.HOME === process.env.CODEX_HOME, leakedEnv: process.env.RSP_TEST_SECRET ?? null, configPresent: config.includes('fixture-provider'), selectedProvider, auth, memoryDisabled: parsed.memoryDisabled, integrationsDisabled: ['plugins', 'hooks', 'apps', 'browser_use', 'computer_use', 'in_app_browser'].every(parsed.disabled), ignoredUserConfig: process.argv.includes('--ignore-user-config'), strictConfig: process.argv.includes('--strict-config'), writableGit })
  }
  const finalIndex = process.argv.indexOf('--output-last-message')
  if (finalIndex >= 0)
    writeFileSync(process.argv[finalIndex + 1], final)
  event({ type: 'item.completed', item: { type: 'agent_message', text: final } })
  if (mode !== 'incomplete' && (isJudge || !control.traceGap))
    event({ type: 'turn.completed', usage: { input_tokens: 12, output_tokens: 8 } })
  if (existsSync(controlPath)) {
    const role = isJudge ? 'judge' : 'executor'
    if (control.sessionsFile)
      appendFileSync(control.sessionsFile, `${JSON.stringify({ role, pid: process.pid })}\n`)
    if (control.holdRole === role) {
      let descendant
      if (process.platform !== 'win32')
        descendant = spawn(process.execPath, ['-e', 'process.on("SIGTERM", () => {}); setInterval(() => {}, 1000)'], { stdio: 'ignore' })
      process.on('SIGTERM', () => process.exit(0))
      writeFileSync(control.readyFile, JSON.stringify({ pid: process.pid, descendant: descendant?.pid ?? null }))
      if (Array.isArray(control.activityChunks)) {
        control.activityChunks.forEach((chunk, index) => {
          setTimeout(() => process.stderr.write(chunk), 600 + index * 100)
        })
      }
      setInterval(() => {}, 1000)
    }
  }
}
