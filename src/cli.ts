import type { ArchiveChangeArgs, CreateChangeArgs, ReopenChangeArgs } from './types.js'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineCommand, runMain } from 'citty'
import { addSpec } from './commands/add-spec.js'
import { archiveChange } from './commands/archive.js'
import { runCheck } from './commands/check.js'
import { createChange } from './commands/create.js'
import { runDoctor } from './commands/doctor.js'
import { focusChange, unfocusChange } from './commands/focus.js'
import { closeChangeGroup, createChangeGroup } from './commands/group.js'
import { showHistory } from './commands/history.js'
import { initProject } from './commands/init.js'
import { showReady } from './commands/ready.js'
import { reopenChange } from './commands/reopen.js'
import { showChange } from './commands/show.js'
import { inspectPackagedSkillInventory, installPackagedSkills, printPackagedSkillInventory, printSkillInstallResult } from './commands/skills.js'
import { showStatus } from './commands/status.js'
import { updateProject } from './commands/update.js'
import { getVersion } from './core/config.js'
import { emitJson } from './core/output.js'
import { toStatusJsonError } from './status/v3-json.js'
import { isInteractiveTerminal, shouldAutoLaunchUi, shouldLaunchSkillsUi, validateUiArgs } from './tui/route.js'

const COMPACT_JSON_COMMANDS = new Set(['status', 'show', 'ready', 'check', 'doctor', 'history'])

function validateCompactInvocation(rawArgs: string[]): void {
  if (!rawArgs.includes('--compact'))
    return

  const command = rawArgs[0]
  if (!command || !COMPACT_JSON_COMMANDS.has(command))
    throw new Error(`--compact is unsupported for rsp${command ? ` ${command}` : ''}`)
  if (!rawArgs.includes('--json'))
    throw new Error('--compact requires --json')
}

const initCommand = defineCommand({
  meta: {
    name: 'init',
    description: 'Scaffold .rsp/ and ensure AGENTS.md contains the RSP entry block',
  },
  args: {
    'agents-mode': {
      type: 'string',
      description: 'How to handle AGENTS.md output: managed or print',
      default: 'managed',
    },
    'with-project-setup': {
      type: 'boolean',
      description: 'Create .rsp/changes/project-setup.md and focus it',
      default: false,
    },
  },
  async run({ args }: { args: Record<string, unknown> }) {
    await initProject({
      agentsMode: args['agents-mode'] === 'print'
        ? 'print'
        : 'managed',
      withProjectSetup: Boolean(args['with-project-setup']),
    })
  },
})

const createCommand = defineCommand({
  meta: {
    name: 'create',
    description: 'Create .rsp/changes/<name>.md [summary]',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Change name',
      required: true,
    },
    kind: {
      type: 'string',
      description: 'Optional kind for a kind-aware template (feature, fix, refactor, docs, ops, research)',
    },
    lite: {
      type: 'boolean',
      description: 'Use a shorter change template while keeping the required RSP sections',
      default: false,
    },
  },
  async run({ args }: { args: CreateChangeArgs }) {
    const summary = Array.isArray(args._) && args._.length > 1 ? args._.slice(1).join(' ') : ''
    await createChange(args.name, summary, args.kind, { lite: Boolean(args.lite) })
  },
})

const groupCreateCommand = defineCommand({
  meta: {
    name: 'create',
    description: 'Create an unfocused .rsp/changes/<group>/00-brief.md',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Change Group name',
      required: true,
    },
  },
  async run({ args }: { args: { name: string, _: string[] } }) {
    const goal = Array.isArray(args._) && args._.length > 1 ? args._.slice(1).join(' ') : ''
    await createChangeGroup(args.name, goal)
  },
})

const groupCommand = defineCommand({
  meta: {
    name: 'group',
    description: 'Create and close shallow Change Groups',
  },
  subCommands: {
    create: groupCreateCommand,
    close: defineCommand({
      meta: {
        name: 'close',
        description: 'Archive a completed Group Brief after all child Changes are archived',
      },
      args: {
        name: {
          type: 'positional',
          description: 'Change Group name',
          required: true,
        },
      },
      async run({ args }: { args: { name: string } }) {
        await closeChangeGroup(args.name)
      },
    }),
  },
})

const addSpecCommand = defineCommand({
  meta: {
    name: 'spec',
    description: 'Create .rsp/specs/<name>.md and refresh local Specs indexes',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Spec file name',
      required: true,
    },
  },
  async run({ args }: { args: { name: string } }) {
    await addSpec(args.name)
  },
})

const addCommand = defineCommand({
  meta: {
    name: 'add',
    description: 'Add an optional durable spec file',
  },
  subCommands: {
    spec: addSpecCommand,
  },
})

const archiveCommand = defineCommand({
  meta: {
    name: 'archive',
    description: 'Archive an open change into .rsp/archives/',
  },
  args: {
    'name': {
      type: 'positional',
      description: 'Change name',
      required: true,
    },
    'dry-run': {
      type: 'boolean',
      description: 'Deprecated compatibility route to rsp ready; never moves the Change',
      default: false,
    },
  },
  async run({ args }: { args: ArchiveChangeArgs & { 'dry-run': boolean } }) {
    if (args['dry-run']) {
      console.error('  Deprecated: use `rsp ready <name>` for read-only archive readiness.')
      await showReady(args.name)
      return
    }
    await archiveChange(args.name)
  },
})

const reopenCommand = defineCommand({
  meta: {
    name: 'reopen',
    description: 'Restore one archived Change as focused open work while retaining history',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Archived Change WorkRef',
      required: true,
    },
    from: {
      type: 'string',
      description: 'Exact .rsp/archives/... path when the WorkRef has multiple archives',
    },
    reason: {
      type: 'string',
      description: 'One-line concern that makes the restored Change unfinished',
      required: true,
    },
  },
  async run({ args }: { args: ReopenChangeArgs }) {
    await reopenChange(args.name, { from: args.from, reason: args.reason })
  },
})

const focusCommand = defineCommand({
  meta: {
    name: 'focus',
    description: 'Mark an existing change as currently focused in .rsp/focus.d/',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Change name',
      required: true,
    },
  },
  async run({ args }: { args: { name: string } }) {
    await focusChange(args.name)
  },
})

const unfocusCommand = defineCommand({
  meta: {
    name: 'unfocus',
    description: 'Remove a change from the current focus set in .rsp/focus.d/',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Change name',
      required: true,
    },
  },
  async run({ args }: { args: { name: string } }) {
    await unfocusChange(args.name)
  },
})

const statusCommand = defineCommand({
  meta: {
    name: 'status',
    description: 'Show project status summary with current focus information',
  },
  args: {
    focused: {
      type: 'boolean',
      description: 'Show only currently focused changes',
      default: false,
    },
    blocked: {
      type: 'boolean',
      description: 'Show only blocked changes',
      default: false,
    },
    stale: {
      type: 'string',
      description: 'Show only changes with age >= days',
    },
    json: {
      type: 'boolean',
      description: 'Print machine-readable JSON output',
      default: false,
    },
    compact: {
      type: 'boolean',
      description: 'Print JSON without indentation (requires --json)',
      default: false,
    },
    verbose: {
      type: 'boolean',
      description: 'Print runtime diagnostics for suppressed I/O issues',
      default: false,
    },
  },
  async run({ args }) {
    const stale = args.stale === undefined ? undefined : Number(args.stale)
    if (stale !== undefined && (Number.isFinite(stale) === false || Number.isInteger(stale) === false || stale < 0)) {
      if (args.json) {
        emitJson(toStatusJsonError({
          code: 'invalid_stale_filter',
          message: '--stale must be a non-negative integer number of days',
        }, {
          focused: Boolean(args.focused),
          blocked: Boolean(args.blocked),
        }), { compact: Boolean(args.compact) })
      }
      else {
        console.error(`  Error: --stale must be a non-negative integer number of days`)
      }
      process.exit(1)
    }

    const result = await showStatus({
      focused: Boolean(args.focused),
      blocked: Boolean(args.blocked),
      stale,
    }, {
      json: Boolean(args.json),
      compact: Boolean(args.compact),
      verbose: Boolean(args.verbose),
    })
    if (!result.ok)
      process.exit(1)
  },
})

const checkCommand = defineCommand({
  meta: {
    name: 'check',
    description: 'Validate changes (frontmatter, sections, template text, deltas, scenarios)',
  },
  args: {
    focused: {
      type: 'boolean',
      description: 'Only validate currently focused changes',
      default: false,
    },
    json: {
      type: 'boolean',
      description: 'Print machine-readable JSON output',
      default: false,
    },
    compact: {
      type: 'boolean',
      description: 'Print JSON without indentation (requires --json)',
      default: false,
    },
    verbose: {
      type: 'boolean',
      description: 'Print runtime diagnostics for suppressed I/O issues',
      default: false,
    },
  },
  async run({ args }) {
    const result = await runCheck({
      focused: Boolean(args.focused),
      json: Boolean(args.json),
      compact: Boolean(args.compact),
      verbose: Boolean(args.verbose),
    })
    if (!result.ok)
      process.exit(1)
  },
})

const updateCommand = defineCommand({
  meta: {
    name: 'update',
    description: 'Refresh RSP-managed project files after upgrade; does not update packaged Skills',
  },
  async run() {
    const result = await updateProject()
    if (!result.migration.inspectionComplete)
      process.exit(1)
  },
})

const skillsInstallCommand = defineCommand({
  meta: {
    name: 'install',
    description: 'Install this package\'s bundled Skills into .agents/skills',
  },
  args: {
    'name': {
      type: 'positional',
      description: 'Exact packaged Skill name (default: lifecycle suite)',
      required: false,
    },
    'dry-run': {
      type: 'boolean',
      description: 'Preflight selected packaged Skills without changing files',
      default: false,
    },
    'force': {
      type: 'boolean',
      description: 'Replace divergent package-owned Skill directories',
      default: false,
    },
  },
  async run({ args }: { args: { '_': string[], 'dry-run': boolean, 'force': boolean, 'name'?: string } }) {
    if (args._.length > 1)
      throw new Error('rsp skills install accepts at most one Skill name')
    const result = await installPackagedSkills({
      dryRun: Boolean(args['dry-run']),
      force: Boolean(args.force),
      names: args.name ? [args.name] : undefined,
    })
    printSkillInstallResult(result, Boolean(args['dry-run']))
  },
})

const skillsListCommand = defineCommand({
  meta: {
    name: 'list',
    description: 'List package-bundled Skills and their project status',
  },
  args: {
    json: {
      type: 'boolean',
      description: 'Print machine-readable JSON output',
      default: false,
    },
  },
  async run({ args }) {
    const inventory = await inspectPackagedSkillInventory()
    if (args.json)
      emitJson(inventory)
    else
      printPackagedSkillInventory(inventory)
  },
})

const skillsCommand = defineCommand({
  meta: {
    name: 'skills',
    description: 'Manage package-bundled project Skills',
  },
  subCommands: {
    install: skillsInstallCommand,
    list: skillsListCommand,
  },
})

const doctorCommand = defineCommand({
  meta: {
    name: 'doctor',
    description: 'Check RSP setup health and common integration issues',
  },
  args: {
    json: {
      type: 'boolean',
      description: 'Print machine-readable JSON output',
      default: false,
    },
    compact: {
      type: 'boolean',
      description: 'Print JSON without indentation (requires --json)',
      default: false,
    },
    verbose: {
      type: 'boolean',
      description: 'Print runtime diagnostics for suppressed I/O issues',
      default: false,
    },
    fix: {
      type: 'boolean',
      description: 'Run safe deterministic repairs before reporting diagnostics',
      default: false,
    },
  },
  async run({ args }) {
    const result = await runDoctor({ json: Boolean(args.json), compact: Boolean(args.compact), verbose: Boolean(args.verbose), fix: Boolean(args.fix) })
    if (!result.ok)
      process.exit(1)
  },
})

const readyCommand = defineCommand({
  meta: {
    name: 'ready',
    description: 'Preview archive readiness for a change without moving it',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Change name',
      required: true,
    },
    json: {
      type: 'boolean',
      description: 'Print machine-readable JSON output',
      default: false,
    },
    compact: {
      type: 'boolean',
      description: 'Print JSON without indentation (requires --json)',
      default: false,
    },
    verbose: {
      type: 'boolean',
      description: 'Print runtime diagnostics for suppressed I/O issues',
      default: false,
    },
  },
  async run({ args }: { args: { name: string, json: boolean, compact: boolean, verbose: boolean } }) {
    await showReady(args.name, { json: Boolean(args.json), compact: Boolean(args.compact), verbose: Boolean(args.verbose) })
  },
})

const showCommand = defineCommand({
  meta: {
    name: 'show',
    description: 'Show change context with readiness signals and relevant paths',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Change name (use --focused instead to show the currently focused change)',
      required: false,
    },
    focused: {
      type: 'boolean',
      description: 'Show the currently focused change',
      default: false,
    },
    json: {
      type: 'boolean',
      description: 'Print machine-readable JSON output',
      default: false,
    },
    compact: {
      type: 'boolean',
      description: 'Print JSON without indentation (requires --json)',
      default: false,
    },
    verbose: {
      type: 'boolean',
      description: 'Print runtime diagnostics for suppressed I/O issues',
      default: false,
    },
  },
  async run({ args }: { args: { name?: string, focused: boolean, json: boolean, compact: boolean, verbose: boolean } }) {
    await showChange(args.name, {
      focused: Boolean(args.focused),
      json: Boolean(args.json),
      compact: Boolean(args.compact),
      verbose: Boolean(args.verbose),
    })
  },
})

const historyCommand = defineCommand({
  meta: {
    name: 'history',
    description: 'Query bounded archived Change summaries or one exact archived WorkRef',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Optional exact archived Change WorkRef for detail',
      required: false,
    },
    limit: {
      type: 'string',
      description: 'Maximum list records from 1 through 100 (default: 20)',
    },
    since: {
      type: 'string',
      description: 'Include archives on or after YYYY-MM-DD',
    },
    until: {
      type: 'string',
      description: 'Include archives on or before YYYY-MM-DD',
    },
    kind: {
      type: 'string',
      description: 'Match one exact historical Change kind',
    },
    group: {
      type: 'string',
      description: 'Match one exact Change Group',
    },
    search: {
      type: 'string',
      description: 'Case-insensitive literal match over WorkRef and summary',
    },
    json: {
      type: 'boolean',
      description: 'Print machine-readable JSON output',
      default: false,
    },
    compact: {
      type: 'boolean',
      description: 'Print JSON without indentation (requires --json)',
      default: false,
    },
  },
  async run({ args }: { args: { name?: string, limit?: string, since?: string, until?: string, kind?: string, group?: string, search?: string, json: boolean, compact: boolean, _?: string[] } }) {
    const result = await showHistory({
      workRef: args.name,
      limit: args.limit,
      since: args.since,
      until: args.until,
      kind: args.kind,
      group: args.group,
      search: args.search,
      positionalCount: args._?.length ?? (args.name ? 1 : 0),
    }, { json: Boolean(args.json), compact: Boolean(args.compact) })
    if (!result.ok)
      process.exitCode = 1
  },
})

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
  const version = await getVersion()

  const main = defineCommand({
    meta: {
      name: 'rsp',
      version,
      description: 'RSP (Reliable Software Practice), a repository-native engineering workflow for humans and AI agents',
    },
    subCommands: {
      init: initCommand,
      add: addCommand,
      create: createCommand,
      group: groupCommand,
      focus: focusCommand,
      unfocus: unfocusCommand,
      archive: archiveCommand,
      reopen: reopenCommand,
      ready: readyCommand,
      show: showCommand,
      history: historyCommand,
      status: statusCommand,
      check: checkCommand,
      update: updateCommand,
      doctor: doctorCommand,
      skills: skillsCommand,
    },
  })

  await runMain(main, { rawArgs })
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
