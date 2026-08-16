import { defineCommand } from 'citty'
import { landWorkspaceCommand } from '../../commands/land.js'
import { disposeWorkspaceCommand, inspectWorkspaceCommand, prepareWorkspaceCommand, pruneWorkspaceCommand, registerWorkspaceActivityCommand, showWorkspaceCommand, stopWorkspaceActivityCommand } from '../../commands/workspace.js'
import { executeCliCommand } from '../adapter.js'
import { jsonArgs } from '../capabilities.js'
import { presentDisposeWorkspace, presentInspectWorkspace, presentLandWorkspace, presentPrepareWorkspace, presentPruneWorkspace, presentRegisterWorkspaceActivity, presentShowWorkspace, presentStopWorkspaceActivity } from '../presenters/workspace.js'

function exitCodeForResult(result: unknown): number | undefined {
  return typeof result === 'object' && result !== null && 'ok' in result && result.ok === false
    ? 1
    : undefined
}

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
        'workref': {
          type: 'positional',
          description: 'Existing executable RSP WorkRef',
          required: true,
        },
        'target': {
          type: 'string',
          description: 'Target local branch (default: current branch)',
        },
        'allow-dirty-source': {
          type: 'boolean',
          description: 'Acknowledge that source dirty paths were reviewed as unrelated',
          default: false,
        },
        ...jsonArgs,
      },
      async run({ args }: { args: { 'workref': string, 'target'?: string, 'allow-dirty-source': boolean, 'json': boolean } }) {
        await executeCliCommand({
          execute: () => prepareWorkspaceCommand(args.workref, { targetBranch: args.target, allowDirtySource: Boolean(args['allow-dirty-source']) }),
          present: result => presentPrepareWorkspace(result, Boolean(args.json)),
          exitCode: exitCodeForResult,
        }, args)
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
        ...jsonArgs,
      },
      async run({ args }: { args: { workref: string, json: boolean } }) {
        await executeCliCommand({
          execute: () => showWorkspaceCommand(args.workref),
          present: result => presentShowWorkspace(result, Boolean(args.json)),
          exitCode: exitCodeForResult,
        }, args)
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
        ...jsonArgs,
      },
      async run({ args }: { args: { workref: string, json: boolean } }) {
        await executeCliCommand({
          execute: () => inspectWorkspaceCommand(args.workref),
          present: result => presentInspectWorkspace(result, Boolean(args.json)),
          exitCode: exitCodeForResult,
        }, args)
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
            ...jsonArgs,
          },
          async run({ args }: { args: { 'workref': string, 'id': string, 'pid': string, 'label'?: string, 'process-group'?: string, 'resources'?: string, 'json': boolean } }) {
            await executeCliCommand({
              execute: () => registerWorkspaceActivityCommand(args.workref, {
                id: args.id,
                pid: Number(args.pid),
                label: args.label,
                processGroupId: args['process-group'] === undefined ? undefined : Number(args['process-group']),
                resources: args.resources,
              }),
              present: result => presentRegisterWorkspaceActivity(result, Boolean(args.json)),
              exitCode: exitCodeForResult,
            }, args)
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
            ...jsonArgs,
          },
          async run({ args }: { args: { workref: string, id: string, json: boolean } }) {
            await executeCliCommand({
              execute: () => stopWorkspaceActivityCommand(args.workref, args.id),
              present: result => presentStopWorkspaceActivity(result, Boolean(args.json)),
              exitCode: exitCodeForResult,
            }, args)
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
        ...jsonArgs,
      },
      async run({ args }: { args: { workref: string, discard: boolean, json: boolean } }) {
        await executeCliCommand({
          execute: () => disposeWorkspaceCommand(args.workref, { discard: Boolean(args.discard) }),
          present: result => presentDisposeWorkspace(result, Boolean(args.json)),
          exitCode: exitCodeForResult,
        }, args)
      },
    }),
    prune: defineCommand({
      meta: { name: 'prune', description: 'Report or apply bounded cleanup of orphaned workspace records' },
      args: {
        workref: { type: 'positional', description: 'Exact Workspace WorkRef', required: true },
        apply: { type: 'boolean', description: 'Apply a mechanically safe prune or quarantine', default: false },
        ...jsonArgs,
      },
      async run({ args }: { args: { workref: string, apply: boolean, json: boolean } }) {
        await executeCliCommand({
          execute: () => pruneWorkspaceCommand(args.workref, { apply: Boolean(args.apply) }),
          present: result => presentPruneWorkspace(result, Boolean(args.json)),
          exitCode: exitCodeForResult,
        }, args)
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
    ...jsonArgs,
  },
  async run({ args }: { args: { workref: string, target: string, commits: string, cleanup: boolean, json: boolean } }) {
    await executeCliCommand({
      execute: () => landWorkspaceCommand(args.workref, {
        targetBranch: args.target,
        commits: args.commits,
        cleanup: Boolean(args.cleanup),
      }),
      present: result => presentLandWorkspace(result, Boolean(args.json)),
      exitCode: exitCodeForResult,
    }, args)
  },
})

export const workspaceCommands = {
  workspace: workspaceCommand,
  land: landCommand,
}
