import type { ArchiveChangeArgs, CreateChangeArgs, ReopenChangeArgs } from './types.js'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineCommand, runMain } from 'citty'
import { addSpec } from './commands/add-spec.js'
import { archiveChange } from './commands/archive.js'
import { runCheck } from './commands/check.js'
import { commitFromMessageFile } from './commands/commit.js'
import { createChange } from './commands/create.js'
import { runDoctor } from './commands/doctor.js'
import { focusChange, unfocusChange } from './commands/focus.js'
import { closeChangeGroup, createChangeGroup, reopenChangeGroup } from './commands/group.js'
import { showHistory } from './commands/history.js'
import { initProject } from './commands/init.js'
import { landWorkspaceCommand } from './commands/land.js'
import { showReady } from './commands/ready.js'
import { reopenChange } from './commands/reopen.js'
import { showChange } from './commands/show.js'
import { inspectPackagedSkillInventory, installPackagedSkills, printPackagedSkillInventory, printSkillInstallResult } from './commands/skills.js'
import { showSpecs } from './commands/specs.js'
import { showStatus } from './commands/status.js'
import { updateProject } from './commands/update.js'
import { disposeWorkspaceCommand, inspectWorkspaceCommand, prepareWorkspaceCommand, registerWorkspaceActivityCommand, showWorkspaceCommand, stopWorkspaceActivityCommand } from './commands/workspace.js'
import { getVersion } from './core/config.js'
import { emitJson } from './core/output.js'
import { toStatusJsonError } from './status/v3-json.js'
import { isInteractiveTerminal, shouldAutoLaunchUi, shouldLaunchSkillsUi, validateUiArgs } from './tui/route.js'

const COMPACT_JSON_COMMANDS = new Set(['status', 'show', 'ready', 'check', 'doctor', 'history', 'specs'])

function exitOnWorkspaceCommandFailure(result: unknown): void {
  if (typeof result === 'object' && result !== null && 'ok' in result && result.ok === false)
    process.exitCode = 1
}

function validateCompactInvocation(rawArgs: string[]): void {
  if (!rawArgs.includes('--compact'))
    return

  const command = rawArgs[0]
  if (!command || !COMPACT_JSON_COMMANDS.has(command))
    throw new Error(`--compact is unsupported for rsp${command ? ` ${command}` : ''}`)
  if (!rawArgs.includes('--json'))
    throw new Error('--compact requires --json')
}

function validateRemovedCreateOptions(rawArgs: string[]): void {
  if (rawArgs[0] === 'create' && rawArgs.some(arg => arg === '--lite' || arg.startsWith('--lite=')))
    throw new Error('create option "--lite" was removed in RSP 4.0; rerun without "--lite" to use the standard kind-aware Change template')
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
    'name': {
      type: 'positional',
      description: 'Change name',
      required: true,
    },
    'kind': {
      type: 'string',
      description: 'Optional kind for a kind-aware template (feature, fix, refactor, docs, ops, research)',
    },
    'issue': {
      type: 'string',
      description: 'Attach one external issue URL without fetching it',
    },
    'issue-relation': {
      type: 'string',
      description: 'Issue relationship: relates (default) or closes; requires --issue',
    },
  },
  async run({ args }: { args: CreateChangeArgs }) {
    const summary = Array.isArray(args._) && args._.length > 1 ? args._.slice(1).join(' ') : ''
    await createChange(args.name, summary, args.kind, {
      issue: args.issue,
      issueRelation: args.issueRelation,
    })
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
    description: 'Create, close, and explicitly reopen shallow Change Groups',
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
    reopen: defineCommand({
      meta: {
        name: 'reopen',
        description: 'Restore one archived Group Brief while retaining history',
      },
      args: {
        name: {
          type: 'positional',
          description: 'Archived Change Group name',
          required: true,
        },
        from: {
          type: 'string',
          description: 'Exact .rsp/archives/... path when the Group has multiple archives',
        },
        reason: {
          type: 'string',
          description: 'One-line concern that makes Group completion unfinished',
          required: true,
        },
      },
      async run({ args }: { args: { name: string, from?: string, reason: string } }) {
        await reopenChangeGroup(args.name, { from: args.from, reason: args.reason })
      },
    }),
  },
})

const addSpecCommand = defineCommand({
  meta: {
    name: 'spec',
    description: 'Create .rsp/specs/<name>.md for direct Specs queries',
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
  async run({ args }: { args: { path?: string, search?: string, limit?: string, excerpt?: string, json: boolean, compact: boolean, _?: string[] } }) {
    const result = await showSpecs({
      path: args.path,
      search: args.search,
      limit: args.limit,
      excerpt: args.excerpt,
      positionalCount: args._?.length ?? (args.path ? 1 : 0),
    }, {
      json: Boolean(args.json),
      compact: Boolean(args.compact),
    })
    if (!result.ok)
      process.exitCode = 1
  },
})

const brokerCommand = defineCommand({
  meta: {
    name: 'broker',
    description: 'Control the optional user-level local Broker',
  },
  subCommands: {
    start: defineCommand({
      meta: {
        name: 'start',
        description: 'Start or reuse one compatible user-level Broker',
      },
      args: {
        json: {
          type: 'boolean',
          description: 'Print machine-readable JSON output',
          default: false,
        },
      },
      async run({ args }: { args: { json: boolean } }) {
        const { startBrokerCommand } = await import('./commands/broker.js')
        const result = await startBrokerCommand({ json: Boolean(args.json) })
        if (!result.ok)
          process.exitCode = 1
      },
    }),
    status: defineCommand({
      meta: {
        name: 'status',
        description: 'Inspect Broker discovery, health, compatibility, and loaded-session count without starting it',
      },
      args: {
        json: {
          type: 'boolean',
          description: 'Print machine-readable JSON output',
          default: false,
        },
      },
      async run({ args }: { args: { json: boolean } }) {
        const { statusBrokerCommand } = await import('./commands/broker.js')
        const result = await statusBrokerCommand({ json: Boolean(args.json) })
        if (!result.ok)
          process.exitCode = 1
      },
    }),
    stop: defineCommand({
      meta: {
        name: 'stop',
        description: 'Stop the healthy compatible Broker through its owned loopback endpoint',
      },
      args: {
        json: {
          type: 'boolean',
          description: 'Print machine-readable JSON output',
          default: false,
        },
      },
      async run({ args }: { args: { json: boolean } }) {
        const { stopBrokerCommand } = await import('./commands/broker.js')
        const result = await stopBrokerCommand({ json: Boolean(args.json) })
        if (!result.ok)
          process.exitCode = 1
      },
    }),
    restart: defineCommand({
      meta: {
        name: 'restart',
        description: 'Replace one verified same-protocol-major Broker with a fresh compatible process',
      },
      args: {
        json: {
          type: 'boolean',
          description: 'Print machine-readable JSON output',
          default: false,
        },
      },
      async run({ args }: { args: { json: boolean } }) {
        const { restartBrokerCommand } = await import('./commands/broker.js')
        const result = await restartBrokerCommand({ json: Boolean(args.json) })
        if (!result.ok)
          process.exitCode = 1
      },
    }),
  },
})

const webCommand = defineCommand({
  meta: {
    name: 'web',
    description: 'Open the local read-only Web Observatory for the current checkout',
  },
  args: {
    'json': {
      type: 'boolean',
      description: 'Print a safe non-interactive registration result without opening a browser or exposing a bootstrap',
      default: false,
    },
    'print-url': {
      type: 'boolean',
      description: 'Print one short-lived bootstrap URL to an interactive terminal instead of opening a browser',
      default: false,
    },
  },
  async run({ args }: { args: { 'json': boolean, 'print-url': boolean } }) {
    const { runWebCommand } = await import('./commands/web.js')
    const result = await runWebCommand({
      json: Boolean(args.json),
      printUrl: Boolean(args['print-url']),
    })
    if (!result.ok)
      process.exitCode = 1
  },
})

const workspaceCommand = defineCommand({
  meta: {
    name: 'workspace',
    description: 'Prepare isolated worktrees and track recoverable host activities',
  },
  subCommands: {
    prepare: defineCommand({
      meta: {
        name: 'prepare',
        description: 'Create or resume branch rsp/<workref> in an isolated worktree',
      },
      args: {
        workref: {
          type: 'positional',
          description: 'Existing executable RSP WorkRef',
          required: true,
        },
        target: {
          type: 'string',
          description: 'Target local branch (default: current branch)',
        },
        json: {
          type: 'boolean',
          description: 'Print machine-readable JSON output',
          default: false,
        },
      },
      async run({ args }: { args: { workref: string, target?: string, json: boolean } }) {
        const result = await prepareWorkspaceCommand(args.workref, { targetBranch: args.target, json: Boolean(args.json) })
        exitOnWorkspaceCommandFailure(result)
      },
    }),
    status: defineCommand({
      meta: {
        name: 'status',
        description: 'Inspect one recorded RSP workspace',
      },
      args: {
        workref: {
          type: 'positional',
          description: 'Existing workspace WorkRef',
          required: true,
        },
        json: {
          type: 'boolean',
          description: 'Print machine-readable JSON output',
          default: false,
        },
      },
      async run({ args }: { args: { workref: string, json: boolean } }) {
        const result = await showWorkspaceCommand(args.workref, { json: Boolean(args.json) })
        exitOnWorkspaceCommandFailure(result)
      },
    }),
    inspect: defineCommand({
      meta: {
        name: 'inspect',
        description: 'Return bounded workspace and repository facts without project-semantic interpretation',
      },
      args: {
        workref: {
          type: 'positional',
          description: 'Existing workspace WorkRef',
          required: true,
        },
        json: {
          type: 'boolean',
          description: 'Print machine-readable JSON output',
          default: false,
        },
      },
      async run({ args }: { args: { workref: string, json: boolean } }) {
        const result = await inspectWorkspaceCommand(args.workref, { json: Boolean(args.json) })
        exitOnWorkspaceCommandFailure(result)
      },
    }),
    activity: defineCommand({
      meta: {
        name: 'activity',
        description: 'Register or stop host-started workspace activities',
      },
      subCommands: {
        register: defineCommand({
          meta: {
            name: 'register',
            description: 'Register a host-started process for workspace cleanup and resource ownership',
          },
          args: {
            'workref': {
              type: 'positional',
              description: 'Existing workspace WorkRef',
              required: true,
            },
            'id': {
              type: 'string',
              description: 'Stable activity id',
              required: true,
            },
            'pid': {
              type: 'string',
              description: 'Running process id',
              required: true,
            },
            'label': {
              type: 'string',
              description: 'Optional human-readable activity label',
            },
            'process-group': {
              type: 'string',
              description: 'Optional verified process group id to stop as one unit',
            },
            'resources': {
              type: 'string',
              description: 'Optional comma-separated exclusive resource ids',
            },
            'json': {
              type: 'boolean',
              description: 'Print machine-readable JSON output',
              default: false,
            },
          },
          async run({ args }: { args: { 'workref': string, 'id': string, 'pid': string, 'label'?: string, 'process-group'?: string, 'resources'?: string, 'json': boolean } }) {
            const result = await registerWorkspaceActivityCommand(args.workref, {
              id: args.id,
              pid: Number(args.pid),
              label: args.label,
              processGroupId: args['process-group'] === undefined ? undefined : Number(args['process-group']),
              resources: args.resources,
              json: Boolean(args.json),
            })
            exitOnWorkspaceCommandFailure(result)
          },
        }),
        stop: defineCommand({
          meta: {
            name: 'stop',
            description: 'Stop one recorded workspace activity and release its resources',
          },
          args: {
            workref: {
              type: 'positional',
              description: 'Existing workspace WorkRef',
              required: true,
            },
            id: {
              type: 'string',
              description: 'Exact recorded activity id',
              required: true,
            },
            json: {
              type: 'boolean',
              description: 'Print machine-readable JSON output',
              default: false,
            },
          },
          async run({ args }: { args: { workref: string, id: string, json: boolean } }) {
            const result = await stopWorkspaceActivityCommand(args.workref, args.id, { json: Boolean(args.json) })
            exitOnWorkspaceCommandFailure(result)
          },
        }),
      },
    }),
    dispose: defineCommand({
      meta: {
        name: 'dispose',
        description: 'Remove a safe completed workspace or explicitly discard it',
      },
      args: {
        workref: {
          type: 'positional',
          description: 'Existing workspace WorkRef',
          required: true,
        },
        discard: {
          type: 'boolean',
          description: 'Explicitly discard uncommitted changes and unlanded commits',
          default: false,
        },
        json: {
          type: 'boolean',
          description: 'Print machine-readable JSON output',
          default: false,
        },
      },
      async run({ args }: { args: { workref: string, discard: boolean, json: boolean } }) {
        const result = await disposeWorkspaceCommand(args.workref, { discard: Boolean(args.discard), json: Boolean(args.json) })
        exitOnWorkspaceCommandFailure(result)
      },
    }),
  },
})

const landCommand = defineCommand({
  meta: {
    name: 'land',
    description: 'Cherry-pick explicit workspace commits into its recorded target branch',
  },
  args: {
    workref: {
      type: 'positional',
      description: 'Existing workspace WorkRef',
      required: true,
    },
    target: {
      type: 'string',
      description: 'Exact recorded target local branch',
      required: true,
    },
    commits: {
      type: 'string',
      description: 'Comma-separated exact commits to cherry-pick in order',
      required: true,
    },
    cleanup: {
      type: 'boolean',
      description: 'Dispose the source workspace after a successful landing',
      default: false,
    },
    json: {
      type: 'boolean',
      description: 'Print machine-readable JSON output',
      default: false,
    },
  },
  async run({ args }: { args: { workref: string, target: string, commits: string, cleanup: boolean, json: boolean } }) {
    const result = await landWorkspaceCommand(args.workref, {
      targetBranch: args.target,
      commits: args.commits,
      cleanup: Boolean(args.cleanup),
      json: Boolean(args.json),
    })
    if (!result.ok)
      process.exitCode = 1
  },
})

const commitCommand = defineCommand({
  meta: {
    name: 'commit',
    description: 'Create one local commit from a message file on the existing staged boundary',
  },
  args: {
    'message-file': {
      type: 'string',
      description: 'Path to the prepared commit message file',
      required: true,
    },
    'json': {
      type: 'boolean',
      description: 'Print machine-readable JSON output',
      default: false,
    },
  },
  async run({ args }: { args: { 'message-file': string, 'json': boolean } }) {
    const result = await commitFromMessageFile(args['message-file'], { json: Boolean(args.json) })
    if (!result.ok)
      process.exitCode = 1
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
  validateRemovedCreateOptions(rawArgs)
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
      specs: specsCommand,
      broker: brokerCommand,
      web: webCommand,
      workspace: workspaceCommand,
      land: landCommand,
      commit: commitCommand,
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
