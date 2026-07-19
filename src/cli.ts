import type { ArchiveChangeArgs, CreateChangeArgs } from './types.js'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineCommand, runMain } from 'citty'
import { addSpec } from './commands/add-spec.js'
import { archiveChange } from './commands/archive.js'
import { runCheck } from './commands/check.js'
import { createChange } from './commands/create.js'
import { runDoctor } from './commands/doctor.js'
import { focusChange, unfocusChange } from './commands/focus.js'
import { initProject } from './commands/init.js'
import { showReady } from './commands/ready.js'
import { showChange } from './commands/show.js'
import { showStatus } from './commands/status.js'
import { updateProject } from './commands/update.js'
import { getVersion } from './core/config.js'
import { emitStatusJsonError } from './core/output.js'

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

const addSpecCommand = defineCommand({
  meta: {
    name: 'spec',
    description: 'Create .rsp/specs/<name>.md and rebuild specs index',
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
      description: 'Preview archive readiness without moving the change',
      default: false,
    },
  },
  async run({ args }: { args: ArchiveChangeArgs & { 'dry-run': boolean } }) {
    await archiveChange(args.name, { dryRun: Boolean(args['dry-run']) })
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
        emitStatusJsonError({
          code: 'invalid_stale_filter',
          message: '--stale must be a non-negative integer number of days',
        }, {
          focused: Boolean(args.focused),
          blocked: Boolean(args.blocked),
        })
      }
      else {
        console.error(`  Error: --stale must be a non-negative integer number of days`)
      }
      process.exit(1)
    }

    await showStatus({
      focused: Boolean(args.focused),
      blocked: Boolean(args.blocked),
      stale,
    }, {
      json: Boolean(args.json),
      verbose: Boolean(args.verbose),
    })
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
      verbose: Boolean(args.verbose),
    })
    if (!result.ok)
      process.exit(1)
  },
})

const updateCommand = defineCommand({
  meta: {
    name: 'update',
    description: 'Refresh RSP project structure after upgrade (fallback protocol, AGENTS, indices)',
  },
  async run() {
    const result = await updateProject()
    if (!result.migration.inspectionComplete)
      process.exit(1)
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
    const result = await runDoctor({ json: Boolean(args.json), verbose: Boolean(args.verbose), fix: Boolean(args.fix) })
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
    verbose: {
      type: 'boolean',
      description: 'Print runtime diagnostics for suppressed I/O issues',
      default: false,
    },
  },
  async run({ args }: { args: { name: string, json: boolean, verbose: boolean } }) {
    await showReady(args.name, { json: Boolean(args.json), verbose: Boolean(args.verbose) })
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
    verbose: {
      type: 'boolean',
      description: 'Print runtime diagnostics for suppressed I/O issues',
      default: false,
    },
  },
  async run({ args }: { args: { name?: string, focused: boolean, json: boolean, verbose: boolean } }) {
    await showChange(args.name, {
      focused: Boolean(args.focused),
      json: Boolean(args.json),
      verbose: Boolean(args.verbose),
    })
  },
})

export async function runCli(rawArgs = process.argv.slice(2)) {
  const version = await getVersion()

  const main = defineCommand({
    meta: {
      name: 'rsp',
      version,
      description: 'RSP (Rules, Specs, Plans) workflow for lightweight AI-assisted change management',
    },
    subCommands: {
      init: initCommand,
      add: addCommand,
      create: createCommand,
      focus: focusCommand,
      unfocus: unfocusCommand,
      archive: archiveCommand,
      ready: readyCommand,
      show: showCommand,
      status: statusCommand,
      check: checkCommand,
      update: updateCommand,
      doctor: doctorCommand,
    },
  })

  await runMain(main, { rawArgs })
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])
if (isMain) {
  runCli().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`  Error: ${message}`)
    process.exit(1)
  })
}
