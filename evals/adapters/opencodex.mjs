import { execFileSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { hash } from '../runner/files.mjs'
import { runProcess } from './process.mjs'

export function createOpenCodexAdapter(options = {}) {
  const { model, effort, configFile, authFile } = options
  if (!model || !effort || !configFile)
    throw new Error('OpenCodex requires explicit model, effort and isolated config file')
  const codexBin = options.codexBin ?? 'codex'
  const config = readFileSync(configFile, 'utf8')
  const configuredProvider = config.split(/^\s*\[/mu)[0].match(/^\s*model_provider\s*=\s*["']([\w.-]+)["']/mu)?.[1]
  if (!configuredProvider)
    throw new Error('Isolated config must explicitly select a model_provider')
  const auth = authFile ? readFileSync(authFile, 'utf8') : null
  const secrets = []
  if (authFile) {
    const collect = (value) => {
      if (typeof value === 'string' && value.length >= 8)
        secrets.push(value)
      else if (value && typeof value === 'object')
        Object.values(value).forEach(collect)
    }
    collect(JSON.parse(auth))
  }
  for (const match of config.matchAll(/(?:key|token|secret|password)\s*=\s*["']([^"'\n]+)["']/giu))
    secrets.push(match[1])
  function redact(value) {
    let text = String(value ?? '')
    for (const secret of secrets)
      text = text.split(secret).join('[REDACTED]')
    return text.replace(/Bearer\s+[\w.~+/-]+/giu, 'Bearer [REDACTED]')
      .replace(/https?:\/\/[^\s"'<>]+/giu, '[URL REDACTED]')
  }
  function redactValue(value) {
    if (typeof value === 'string')
      return redact(value)
    if (Array.isArray(value))
      return value.map(redactValue)
    if (value && typeof value === 'object')
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, redactValue(item)]))
    return value
  }
  let version
  try {
    version = execFileSync(codexBin, ['--version'], { encoding: 'utf8', timeout: 10000 }).trim()
  }
  catch {
    throw new Error('OpenCodex executable/version unavailable')
  }
  const settings = { provider: 'config', configuredProvider, model, effort, version, configHash: hash(config), isolated: true }
  return {
    id: 'opencodex-config',
    settings,
    redact,
    async run({ workspace, prompt, timeoutMs = 600000, outputSchema }) {
      if (hash(readFileSync(configFile)) !== settings.configHash)
        throw new Error('OpenCodex configuration changed after campaign freeze')
      const home = mkdtempSync(join(tmpdir(), 'rsp-provider-home-'))
      const finalPath = join(home, 'final.md')
      try {
        chmodSync(home, 0o700)
        writeFileSync(join(home, 'config.toml'), config, { mode: 0o600 })
        if (authFile) {
          writeFileSync(join(home, 'auth.json'), auth, { mode: 0o600 })
        }
        mkdirSync(join(home, '.config'))
        const env = Object.fromEntries(['PATH', 'LANG', 'LC_ALL', 'LC_CTYPE', 'TZ', 'TERM'].filter(key => process.env[key]).map(key => [key, process.env[key]]))
        Object.assign(env, { HOME: home, USERPROFILE: home, CODEX_HOME: home, XDG_CONFIG_HOME: join(home, '.config'), CI: 'true' })
        const args = ['exec', '--sandbox', 'workspace-write', '--model', model, '--config', `model_reasoning_effort=${JSON.stringify(effort)}`, '--json', '--output-last-message', finalPath, '--cd', workspace, '-']
        if (outputSchema) {
          const schemaPath = join(home, 'output-schema.json')
          writeFileSync(schemaPath, JSON.stringify(outputSchema), { mode: 0o600 })
          args.splice(1, 0, '--output-schema', schemaPath)
        }
        const result = await runProcess(codexBin, args, { cwd: workspace, env, input: `${prompt}\n`, timeoutMs })
        let finalOutput = null
        try {
          finalOutput = redact(readFileSync(finalPath, 'utf8'))
        }
        catch {}
        const stdout = result.stdout.split('\n').map((line) => {
          try {
            return JSON.stringify(redactValue(JSON.parse(line)))
          }
          catch {
            return redact(line)
          }
        }).join('\n')
        return { ...result, stdout, stderr: redact(result.stderr), finalOutput }
      }
      finally {
        rmSync(home, { force: true, recursive: true })
      }
    },
  }
}
