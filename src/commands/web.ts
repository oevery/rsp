import type { BrokerProjectConnection } from '../broker/client.js'
import { brokerProjectRequest, ensureBrokerProjectSession } from '../broker/client.js'
import { BrokerError } from '../broker/protocol.js'
import { emitJson } from '../core/output.js'
import { openWebBrowser } from '../web/open.js'

export interface WebCommandOptions {
  json?: boolean
  printUrl?: boolean
}

export interface WebCommandDependencies {
  connect: () => Promise<BrokerProjectConnection>
  createBootstrap: (connection: BrokerProjectConnection) => Promise<{ bootstrapToken: string, expiresAt: string }>
  openBrowser: (url: string) => Promise<void>
  stdoutIsTty: boolean
  stderrIsTty: boolean
}

const defaultDependencies: WebCommandDependencies = {
  connect: () => ensureBrokerProjectSession(),
  async createBootstrap(connection) {
    const value = await brokerProjectRequest(
      connection,
      `/v1/projects/${connection.project.projectId}/web/bootstrap`,
      { method: 'POST' },
    )
    if (!isObject(value)
      || value.ok !== true
      || value.projectId !== connection.project.projectId
      || typeof value.bootstrapToken !== 'string'
      || value.bootstrapToken.length < 32
      || typeof value.expiresAt !== 'string') {
      throw new BrokerError('web_bootstrap_invalid', 'Broker returned an invalid Web bootstrap')
    }
    return {
      bootstrapToken: value.bootstrapToken,
      expiresAt: value.expiresAt,
    }
  },
  openBrowser: openWebBrowser,
  stdoutIsTty: Boolean(process.stdout.isTTY),
  stderrIsTty: Boolean(process.stderr.isTTY),
}

const safeWebCommandErrors: Readonly<Record<string, string>> = Object.freeze({
  broker_absent: 'The local Broker is not available.',
  broker_discovery_invalid: 'The local Broker discovery metadata is invalid.',
  broker_endpoint_invalid: 'The local Broker endpoint is invalid.',
  broker_incompatible: 'The running Broker is incompatible; stop it and retry with the intended RSP package.',
  broker_invalid: 'The local Broker state is invalid.',
  broker_project_collision: 'The local Broker detected a project identity collision; stop it and retry.',
  broker_project_invalid: 'The current Git checkout is not a readable directory.',
  broker_project_not_checkout: 'rsp web must run inside one Git checkout.',
  broker_project_not_found: 'Unable to resolve the current project checkout.',
  broker_project_registration_invalid: 'The local Broker returned an invalid project registration.',
  broker_request_failed: 'Unable to contact the local Broker.',
  broker_response_invalid: 'The local Broker returned an invalid response.',
  broker_response_too_large: 'The local Broker response exceeded its safety bound.',
  broker_start_timeout: 'The local Broker did not become ready before the timeout.',
  broker_unhealthy: 'The local Broker is unhealthy; stop it and retry.',
  web_bootstrap_invalid: 'The local Broker returned an invalid Web bootstrap.',
  web_browser_open_failed: 'Unable to open the default browser.',
})

export async function runWebCommand(
  options: WebCommandOptions = {},
  dependencies: WebCommandDependencies = defaultDependencies,
): Promise<{ ok: boolean }> {
  try {
    const connection = await dependencies.connect()
    const safeUrl = `${connection.broker.endpoint}/web/${connection.project.projectId}/`

    if (options.json) {
      emitJson({
        command: 'web',
        ok: true,
        opened: false,
        url: safeUrl,
        action: 'Run rsp web in an interactive desktop terminal to open an authenticated one-time URL',
      })
      return { ok: true }
    }

    if (options.printUrl && !dependencies.stdoutIsTty) {
      console.error('  Error: --print-url requires an interactive terminal so the one-time bootstrap is not written to redirected logs')
      return { ok: false }
    }
    if (!options.printUrl && !dependencies.stdoutIsTty) {
      console.error(`  Error: rsp web requires an interactive desktop terminal; registered project URL: ${safeUrl}`)
      console.error('  Retry interactively, or use --print-url only when a human-controlled terminal is available.')
      return { ok: false }
    }

    const bootstrap = await dependencies.createBootstrap(connection)
    const bootstrapUrl = `${safeUrl}#bootstrap=${bootstrap.bootstrapToken}`
    if (options.printUrl) {
      console.log(`  One-time Web Observatory URL (expires ${bootstrap.expiresAt}):`)
      console.log(`  ${bootstrapUrl}`)
      return { ok: true }
    }

    try {
      await dependencies.openBrowser(bootstrapUrl)
      console.log(`  Web Observatory opened: ${safeUrl}`)
      return { ok: true }
    }
    catch (error) {
      if (dependencies.stderrIsTty) {
        console.error('  Browser open failed. Use this one-time URL before it expires:')
        console.error(`  ${bootstrapUrl}`)
        return { ok: true }
      }
      throw error
    }
  }
  catch (error) {
    return webCommandFailure(error, options)
  }
}

function webCommandFailure(error: unknown, options: WebCommandOptions): { ok: false } {
  const safe = safeWebCommandError(error)
  if (options.json) {
    emitJson({
      command: 'web',
      ok: false,
      error: safe,
    })
  }
  else {
    console.error(`  Error: ${safe.message}`)
  }
  return { ok: false }
}

function safeWebCommandError(error: unknown): { code: string, message: string } {
  if (error instanceof BrokerError && Object.hasOwn(safeWebCommandErrors, error.code)) {
    return {
      code: error.code,
      message: safeWebCommandErrors[error.code]!,
    }
  }
  return {
    code: 'web_command_failed',
    message: 'Unable to start the local Web Observatory.',
  }
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
