import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runMain } from 'citty'
import { supportsCompact } from './cli/capabilities.js'
import { createRootCommand } from './cli/registry.js'
import { installPackagedSkills, printSkillInstallResult } from './commands/skills.js'
import { getVersion } from './core/config.js'
import { isInteractiveTerminal, shouldAutoLaunchUi, shouldLaunchSkillsUi, validateUiArgs } from './tui/route.js'

function validateCompactInvocation(rawArgs: string[]): void {
  if (!rawArgs.includes('--compact'))
    return

  const command = rawArgs[0]
  if (!supportsCompact(command))
    throw new Error(`--compact is unsupported for rsp${command ? ` ${command}` : ''}`)
  if (!rawArgs.includes('--json'))
    throw new Error('--compact requires --json')
}

function normalizeLegacyCreateOptions(rawArgs: string[]): { rawArgs: string[], deprecatedLite: boolean } {
  if (rawArgs[0] !== 'create')
    return { rawArgs, deprecatedLite: false }

  const legacyLiteOptions = new Set(['--lite', '--lite=true', '--lite=false'])
  const invalidLegacyLite = rawArgs.find(arg => arg.startsWith('--lite=') && !legacyLiteOptions.has(arg))
  if (invalidLegacyLite)
    throw new Error(`create option "${invalidLegacyLite}" is invalid; use --lite, --lite=true, or --lite=false`)
  const deprecatedLite = rawArgs.some(arg => legacyLiteOptions.has(arg))
  return {
    rawArgs: deprecatedLite ? rawArgs.filter(arg => !legacyLiteOptions.has(arg)) : rawArgs,
    deprecatedLite,
  }
}

export async function runCli(rawArgs = process.argv.slice(2)) {
  const terminalEnvironment = {
    stdinTty: Boolean(process.stdin.isTTY),
    stdoutTty: Boolean(process.stdout.isTTY),
    term: process.env.TERM,
    ci: process.env.CI,
  }
  const explicitUi = rawArgs[0] === 'ui'
  if (shouldLaunchSkillsUi(rawArgs, terminalEnvironment)) {
    const { resolveUiLocale } = await import('./tui/i18n/locale.js')
    const locale = resolveUiLocale('auto', process.env.RSP_UI_LANG, process.env.LC_ALL ?? process.env.LC_MESSAGES ?? process.env.LANG ?? new Intl.DateTimeFormat().resolvedOptions().locale)
    const { runSkillsTui } = await import('./skills-tui/entry.js')
    const selection = await runSkillsTui(locale)
    if (selection.kind === 'confirmed') {
      const result = await installPackagedSkills({ names: selection.names, force: selection.force })
      printSkillInstallResult(result)
    }
    else if (selection.kind === 'error') {
      process.exitCode = 1
    }
    return
  }
  if (explicitUi || shouldAutoLaunchUi(rawArgs, terminalEnvironment)) {
    const { lang } = validateUiArgs(explicitUi ? rawArgs.slice(1) : [])
    if (!isInteractiveTerminal(terminalEnvironment)) {
      if (explicitUi)
        throw new Error('rsp ui requires an interactive terminal; use rsp status or rsp status --json instead')
    }
    else {
      const { resolveUiLocale } = await import('./tui/i18n/locale.js')
      const locale = resolveUiLocale(lang, process.env.RSP_UI_LANG, process.env.LC_ALL ?? process.env.LC_MESSAGES ?? process.env.LANG ?? new Intl.DateTimeFormat().resolvedOptions().locale)
      const { runTui } = await import('./tui/entry.js')
      const exitCode = await runTui(locale)
      if (exitCode !== 0)
        process.exitCode = exitCode
      return
    }
  }
  validateCompactInvocation(rawArgs)
  const normalizedCreate = normalizeLegacyCreateOptions(rawArgs)
  const version = await getVersion()
  const main = createRootCommand({
    version,
    deprecatedLite: normalizedCreate.deprecatedLite,
  })

  await runMain(main, { rawArgs: normalizedCreate.rawArgs })
}

export async function runCliMain(rawArgs = process.argv.slice(2)): Promise<void> {
  try {
    await runCli(rawArgs)
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`  Error: ${message}`)
    process.exitCode = 1
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])
if (isMain)
  await runCliMain()
