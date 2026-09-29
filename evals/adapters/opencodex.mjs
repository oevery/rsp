import { Buffer } from 'node:buffer'
import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, dirname, isAbsolute, join, resolve } from 'node:path'
import { parse as parseToml, stringify as stringifyToml } from 'smol-toml'
import { hash } from '../runner/files.mjs'
import { runProcess } from './process.mjs'

const roles = new Set(['coordinator', 'implementer', 'verifier', 'reviewer'])
const providerFields = new Set(['name', 'base_url', 'wire_api', 'requires_openai_auth', 'request_max_retries', 'stream_max_retries', 'stream_idle_timeout_ms'])
const policyDirectory = new URL('../config/', import.meta.url)
const disabledFeatures = ['memories', 'multi_agent', 'multi_agent_v2', 'plugins', 'hooks', 'apps', 'browser_use', 'browser_use_external', 'computer_use', 'in_app_browser', 'remote_plugin', 'skill_mcp_dependency_install', 'external_agent_memory_import']

function parse(source, label) {
  try {
    return parseToml(source)
  }
  catch {
    throw new Error(`Invalid ${label} TOML (contents withheld)`)
  }
}

function snapshot(path, limit = 16 * 1024 * 1024) {
  if (statSync(path).size > limit)
    throw new Error('Evaluation input exceeds size limit')
  return readFileSync(path)
}

function binaryPath(bin) {
  const paths = bin.includes('/') || isAbsolute(bin) ? [resolve(bin)] : (process.env.PATH ?? '').split(delimiter).map(dir => join(dir, bin))
  for (const path of paths) {
    try {
      const real = realpathSync(path)
      if (statSync(real).isFile())
        return real
    }
    catch {}
  }
  throw new Error('OpenCodex executable unavailable')
}

function validateOverlay(overlay) {
  if (Object.keys(overlay).some(key => !['model_provider', 'model_providers', 'model_catalog_json'].includes(key)))
    throw new Error('Private overlay has disallowed evaluation policy fields')
  const name = overlay.model_provider
  if (typeof name !== 'string' || !/^[\w.-]+$/u.test(name))
    throw new Error('Private overlay must select one model_provider')
  if (overlay.model_providers !== undefined) {
    const providers = overlay.model_providers
    if (!providers || typeof providers !== 'object' || Array.isArray(providers) || Object.keys(providers).some(key => key !== name))
      throw new Error('Private overlay contains disallowed providers')
    const provider = providers[name]
    if (!provider || typeof provider !== 'object' || Array.isArray(provider) || Object.keys(provider).some(key => !providerFields.has(key)))
      throw new Error('Private overlay contains disallowed provider fields')
    for (const [key, value] of Object.entries(provider)) {
      if (key.endsWith('retries') || key.endsWith('timeout_ms')) {
        if (!Number.isInteger(value) || value < 0)
          throw new Error('Invalid provider field')
      }
      else if (key === 'requires_openai_auth' ? typeof value !== 'boolean' : typeof value !== 'string') {
        throw new Error('Invalid provider field')
      }
    }
  }
  if (overlay.model_catalog_json !== undefined && (typeof overlay.model_catalog_json !== 'string' || !isAbsolute(overlay.model_catalog_json)))
    throw new Error('Private catalog must be an absolute path')
  return name
}

function metadata(buffer) {
  try {
    const data = JSON.parse(buffer.toString('utf8'))
    if (!Array.isArray(data.models))
      throw new Error('models')
    return data.models.map(item => ({ slug: item.slug, efforts: item.supported_reasoning_levels?.map(level => level.effort) ?? [] }))
  }
  catch {
    throw new Error('Model catalog is invalid (contents withheld)')
  }
}

export function createOpenCodexAdapter(options = {}) {
  if (options.requireWorker)
    throw new Error('Required-worker mode unavailable: single-turn runner cannot establish worker dispatch')
  const role = options.role ?? 'implementer'
  if (!roles.has(role))
    throw new Error('Unknown evaluation role')
  const baseSource = readFileSync(new URL('base.toml', policyDirectory), 'utf8')
  const roleSource = readFileSync(new URL(`${role}.toml`, policyDirectory), 'utf8')
  const policy = parse(baseSource, 'policy')
  const rolePolicy = parse(roleSource, 'role')
  if (Object.keys(rolePolicy).some(key => !['model', 'model_reasoning_effort'].includes(key))
    || policy.web_search !== 'disabled'
    || disabledFeatures.some(name => policy.features?.[name] !== false)
    || policy.memories?.use_memories !== false || policy.memories?.generate_memories !== false) {
    throw new Error('Evaluation policy does not enforce isolation')
  }
  const model = options.model ?? rolePolicy.model
  const effort = options.effort ?? rolePolicy.model_reasoning_effort
  if (typeof model !== 'string' || typeof effort !== 'string' || !options.configFile)
    throw new Error('OpenCodex requires a model, effort and private provider overlay')
  const privateSource = readFileSync(options.configFile, 'utf8')
  const overlay = parse(privateSource, 'private overlay')
  const configuredProvider = validateOverlay(overlay)
  const catalogFile = overlay.model_catalog_json
  const catalog = catalogFile ? snapshot(catalogFile) : null
  const catalogHash = catalog && hash(catalog)
  if (catalog) {
    const listed = metadata(catalog).find(item => item.slug === model)
    if (!listed || !listed.efforts.includes(effort))
      throw new Error('Selected model and effort are absent from the private catalog')
  }
  const auth = options.authFile ? readFileSync(options.authFile, 'utf8') : null
  const authHash = auth && hash(auth)
  const secrets = []
  const collect = (value) => {
    if (typeof value === 'string' && value.length >= 8)
      secrets.push(value)
    else if (value && typeof value === 'object')
      Object.values(value).forEach(collect)
  }
  if (auth) {
    try {
      collect(JSON.parse(auth))
    }
    catch {
      throw new Error('Invalid private auth JSON (contents withheld)')
    }
  }
  collect(overlay.model_providers ?? {})
  if (catalogFile)
    secrets.push(catalogFile)
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
  const codexBin = options.codexBin ?? 'codex'
  const executable = binaryPath(codexBin)
  const settings = { provider: 'config', configuredProvider, role, model, effort, binaryHash: hash(snapshot(executable, 256 * 1024 * 1024)), configHash: hash(privateSource), policyHash: hash([baseSource, roleSource]), catalogHash, authHash, isolated: true }
  const effective = { ...policy, model, model_reasoning_effort: effort, model_provider: configuredProvider, ...(overlay.model_providers && { model_providers: overlay.model_providers }) }
  settings.effectiveConfigHash = hash(stringifyToml({ ...effective, ...(catalogHash && { model_catalog_json: catalogHash }) }))
  let preflightResult
  function assertFrozen() {
    if (hash(readFileSync(options.configFile)) !== settings.configHash || hash(readFileSync(new URL('base.toml', policyDirectory))) !== hash(baseSource)
      || hash(readFileSync(new URL(`${role}.toml`, policyDirectory))) !== hash(roleSource)
      || binaryPath(codexBin) !== executable || (options.authFile && hash(readFileSync(options.authFile)) !== authHash)
      || hash(snapshot(binaryPath(codexBin), 256 * 1024 * 1024)) !== settings.binaryHash
      || (catalogFile && hash(snapshot(catalogFile)) !== settings.catalogHash)) {
      throw new Error('Evaluation provider, catalog, binary or policy identity drift')
    }
  }
  function isolatedHome() {
    const home = mkdtempSync(join(tmpdir(), 'rsp-provider-home-'))
    chmodSync(home, 0o700)
    mkdirSync(join(home, '.config'))
    const config = { ...effective }
    if (catalog) {
      const path = join(home, 'models.json')
      writeFileSync(path, catalog, { mode: 0o600 })
      config.model_catalog_json = path
    }
    writeFileSync(join(home, 'config.toml'), stringifyToml(config), { mode: 0o600 })
    if (auth) {
      writeFileSync(join(home, 'auth.json'), auth, { mode: 0o600 })
    }
    const env = Object.fromEntries(['PATH', 'LANG', 'LC_ALL', 'LC_CTYPE', 'TZ', 'TERM'].filter(key => process.env[key]).map(key => [key, process.env[key]]))
    Object.assign(env, { HOME: home, USERPROFILE: home, CODEX_HOME: home, XDG_CONFIG_HOME: join(home, '.config'), CI: 'true' })
    return { home, env }
  }
  {
    const { home, env } = isolatedHome()
    try {
      settings.version = redact(execFileSync(executable, ['--version'], { cwd: home, env, encoding: 'utf8', timeout: 10000 }).trim()).slice(0, 256)
      if (!catalog) {
        const bundled = spawnSync(executable, ['debug', 'models', '--bundled'], { cwd: home, env, encoding: 'utf8', timeout: 10000, maxBuffer: 16 * 1024 * 1024 })
        try {
          if (bundled.status === 0) {
            metadata(Buffer.from(bundled.stdout))
            settings.bundledCatalogHash = hash(bundled.stdout)
          }
        }
        catch {}
      }
    }
    catch {
      throw new Error('OpenCodex executable/version unavailable')
    }
    finally {
      rmSync(home, { force: true, recursive: true })
    }
  }
  return {
    id: 'opencodex-config',
    settings,
    redact,
    preflight() {
      assertFrozen()
      if (preflightResult)
        return preflightResult
      const { home, env } = isolatedHome()
      try {
        const probe = args => spawnSync(executable, args, { cwd: home, env, encoding: 'utf8', timeout: 10000, maxBuffer: 16 * 1024 * 1024 })
        const help = probe(['exec', '--help'])
        const flags = help.status === 0 && help.stdout.includes('--strict-config')
        const features = probe(['features', 'list'])
        const bundled = probe(['debug', 'models', '--bundled'])
        let bundledModels = []
        let bundledMetadataReadable = false
        try {
          bundledModels = metadata(Buffer.from(bundled.stdout))
          bundledMetadataReadable = bundled.status === 0
        }
        catch {}
        const listed = (catalog ? metadata(catalog) : bundledModels).find(item => item.slug === model)
        const modelEffortListed = Boolean(listed?.efforts.includes(effort))
        const featureLines = new Map(features.stdout.trim().split('\n').map(line => line.trim().split(/\s+/u)).filter(parts => parts.length >= 3).map(parts => [parts[0], parts.at(-1)]))
        const featuresDisabled = features.status === 0 && disabledFeatures.every(name => featureLines.get(name) === 'false')
        const bundledCatalogHash = bundledMetadataReadable ? hash(bundled.stdout) : null
        const bundledCatalogFrozen = Boolean(catalog || (bundledCatalogHash && bundledCatalogHash === settings.bundledCatalogHash))
        preflightResult = { status: flags && featuresDisabled && bundledMetadataReadable && bundledCatalogFrozen && modelEffortListed ? 'passed' : 'inconclusive', providerInvocations: 0, flagsRecognized: flags, bootstrapFeatures: features.status === 0, featuresDisabled, bundledMetadataReadable, bundledCatalogHash, bundledCatalogFrozen, modelEffortListed, strictFullSchemaValidated: false, requiredWorkerAvailable: 'unknown', singleTurnWorkerDispatchProven: false, settings }
        return preflightResult
      }
      finally {
        rmSync(home, { force: true, recursive: true })
      }
    },
    async run({ workspace, prompt, timeoutMs = 600000, outputSchema }) {
      assertFrozen()
      for (let directory = realpathSync(workspace); ; directory = dirname(directory)) {
        if (existsSync(join(directory, '.codex')))
          throw new Error('Project Codex configuration is not allowed during evaluation')
        if (dirname(directory) === directory)
          break
      }
      if (this.preflight().status !== 'passed')
        throw new Error('Offline model/effort preflight inconclusive; provider execution refused')
      const { home, env } = isolatedHome()
      const finalPath = join(home, 'final.md')
      try {
        const args = ['exec', '--strict-config', '--sandbox', 'workspace-write', '--model', model, '--config', `model_reasoning_effort=${JSON.stringify(effort)}`, '--json', '--output-last-message', finalPath, '--cd', workspace, '-']
        for (const name of disabledFeatures)
          args.push('--config', ['features.', name, '=false'].join(''))
        args.push('--config', 'memories.use_memories=false', '--config', 'memories.generate_memories=false', '--config', 'web_search="disabled"')
        if (outputSchema) {
          const schemaPath = join(home, 'output-schema.json')
          writeFileSync(schemaPath, JSON.stringify(outputSchema), { mode: 0o600 })
          args.splice(1, 0, '--output-schema', schemaPath)
        }
        const result = await runProcess(executable, args, { cwd: workspace, env, input: `${prompt}\n`, timeoutMs })
        let finalOutput = null
        try {
          finalOutput = redact(readFileSync(finalPath, 'utf8'))
        }
        catch {}
        const stdout = result.stdout.split('\n').map((line) => {
          try {
            const event = JSON.parse(line)
            const sanitized = redactValue(event)
            if (event?.item?.type === 'command_execution' && typeof event.item.command === 'string' && sanitized.item.command !== event.item.command)
              sanitized.item.command_redacted = true
            return JSON.stringify(sanitized)
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
