import { defineCommand } from 'citty'
import { runCheck } from '../../commands/check.js'
import { runDoctor } from '../../commands/doctor.js'
import { showHistory } from '../../commands/history.js'
import { showReady } from '../../commands/ready.js'
import { showChange } from '../../commands/show.js'
import { showSpecs } from '../../commands/specs.js'
import { showStatus } from '../../commands/status.js'
import { toStatusJsonError } from '../../status/v3-json.js'
import { executeCliCommand } from '../adapter.js'
import { compactJsonArgs } from '../capabilities.js'
import { presentCheck, presentDoctor, presentHistory, presentReady, presentShow, presentSpecs, presentStatus } from '../presenters/inspection.js'

const specsCommand = defineCommand({
  meta: {
    name: 'specs',
    description: 'Inspect current Specs and Decision Records or run bounded literal search',
  },
  args: {
    path: {
      type: 'positional',
      description: 'Optional exact project-relative document path from rsp specs',
      required: false,
    },
    search: {
      type: 'string',
      description: 'Case-insensitive literal search over current Specs and Decision Records',
    },
    limit: {
      type: 'string',
      description: 'Maximum search matches from 1 through 100 (default: 20)',
    },
    excerpt: {
      type: 'string',
      description: 'Search excerpt bound from 40 through 1000 code points (default: 240)',
    },
    ...compactJsonArgs,
  },
  async run({ args }: { args: { path?: string, search?: string, limit?: string, excerpt?: string, json: boolean, compact: boolean, _?: string[] } }) {
    await executeCliCommand({
      execute: () => showSpecs({
        path: args.path,
        search: args.search,
        limit: args.limit,
        excerpt: args.excerpt,
        positionalCount: args._?.length ?? (args.path ? 1 : 0),
      }),
      present: result => presentSpecs(result, args),
      exitCode: result => result.ok ? undefined : 1,
    }, args)
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
    ...compactJsonArgs,
    verbose: {
      type: 'boolean',
      description: 'Print runtime diagnostics for suppressed I/O issues',
      default: false,
    },
  },
  async run({ args }) {
    await executeCliCommand({
      execute: async () => {
        const stale = args.stale === undefined ? undefined : Number(args.stale)
        if (stale !== undefined && (Number.isFinite(stale) === false || Number.isInteger(stale) === false || stale < 0)) {
          return {
            kind: 'error' as const,
            output: toStatusJsonError({ code: 'invalid_stale_filter', message: '--stale must be a non-negative integer number of days' }, {
              focused: Boolean(args.focused),
              blocked: Boolean(args.blocked),
            }),
          }
        }
        return { kind: 'view' as const, view: await showStatus({ focused: Boolean(args.focused), blocked: Boolean(args.blocked), stale }) }
      },
      present: result => presentStatus(result, args),
      exitCode: result => result.kind === 'error' || !result.view.ok ? 1 : undefined,
    }, args)
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
    ...compactJsonArgs,
    verbose: {
      type: 'boolean',
      description: 'Print runtime diagnostics for suppressed I/O issues',
      default: false,
    },
  },
  async run({ args }) {
    await executeCliCommand({
      execute: () => runCheck({ focused: Boolean(args.focused) }),
      present: result => presentCheck(result, args),
      exitCode: result => result.ok ? undefined : 1,
    }, args)
  },
})

const doctorCommand = defineCommand({
  meta: {
    name: 'doctor',
    description: 'Check RSP setup health and common integration issues',
  },
  args: {
    ...compactJsonArgs,
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
    await executeCliCommand({
      execute: () => runDoctor({ fix: Boolean(args.fix) }),
      present: result => presentDoctor(result, args),
      exitCode: result => result.ok ? undefined : 1,
    }, args)
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
    ...compactJsonArgs,
    verbose: {
      type: 'boolean',
      description: 'Print runtime diagnostics for suppressed I/O issues',
      default: false,
    },
  },
  async run({ args }: { args: { name: string, json: boolean, compact: boolean, verbose: boolean } }) {
    await executeCliCommand({
      execute: () => showReady(args.name),
      present: result => presentReady(result, args),
      exitCode: result => result.ok ? undefined : 1,
    }, args)
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
    ...compactJsonArgs,
    verbose: {
      type: 'boolean',
      description: 'Print runtime diagnostics for suppressed I/O issues',
      default: false,
    },
  },
  async run({ args }: { args: { name?: string, focused: boolean, json: boolean, compact: boolean, verbose: boolean } }) {
    await executeCliCommand({
      execute: () => showChange(args.name, { focused: Boolean(args.focused) }),
      present: result => presentShow(result, args),
      exitCode: result => result.ok ? undefined : 1,
    }, args)
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
    ...compactJsonArgs,
  },
  async run({ args }: { args: { name?: string, limit?: string, since?: string, until?: string, kind?: string, group?: string, search?: string, json: boolean, compact: boolean, _?: string[] } }) {
    await executeCliCommand({
      execute: () => showHistory({
        workRef: args.name,
        limit: args.limit,
        since: args.since,
        until: args.until,
        kind: args.kind,
        group: args.group,
        search: args.search,
        positionalCount: args._?.length ?? (args.name ? 1 : 0),
      }),
      present: result => presentHistory(result, args),
      exitCode: result => result.ok ? undefined : 1,
    }, args)
  },
})

export const inspectionCommands = {
  specs: specsCommand,
  ready: readyCommand,
  show: showCommand,
  history: historyCommand,
  status: statusCommand,
  check: checkCommand,
  doctor: doctorCommand,
}
