#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

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
    const configuredProvider = config.match(/^model_provider\s*=\s*"([^"]+)"/mu)?.[1]
    const providerOverride = process.argv.find(value => value.startsWith('model_provider='))
    const selectedProvider = providerOverride ? JSON.parse(providerOverride.slice('model_provider='.length)) : configuredProvider
    final = JSON.stringify({ isolated: process.env.HOME === process.env.CODEX_HOME, leakedEnv: process.env.RSP_TEST_SECRET ?? null, configPresent: config.includes('fixture-provider'), selectedProvider, auth })
  }
  const finalIndex = process.argv.indexOf('--output-last-message')
  if (finalIndex >= 0)
    writeFileSync(process.argv[finalIndex + 1], final)
  event({ type: 'item.completed', item: { type: 'agent_message', text: final } })
  if (mode !== 'incomplete')
    event({ type: 'turn.completed', usage: { input_tokens: 12, output_tokens: 8 } })
}
