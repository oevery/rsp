import type { ArchiveChangeArgs, CreateChangeArgs, ReopenChangeArgs } from '../../types.js'
import { defineCommand } from 'citty'
import { archiveChange } from '../../commands/archive.js'
import { commitFromMessageFile } from '../../commands/commit.js'
import { createChange } from '../../commands/create.js'
import { focusChange, unfocusChange } from '../../commands/focus.js'
import { closeChangeGroup, createChangeGroup, reopenChangeGroup } from '../../commands/group.js'
import { showReady } from '../../commands/ready.js'
import { reopenChange } from '../../commands/reopen.js'
import { executeCliCommand } from '../adapter.js'
import { jsonArgs } from '../capabilities.js'
import { presentCommit } from '../presenters/commit.js'
import { presentArchive, presentArchiveDryRun, presentCreate, presentFocus, presentGroup, presentReopen } from '../presenters/work.js'

function createCreateCommand(deprecatedLite: boolean) {
  return defineCommand({
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
      await executeCliCommand({
        execute: () => createChange(args.name, summary, args.kind, {
          issue: args.issue,
          issueRelation: args.issueRelation,
          deprecatedLite,
        }),
        present: presentCreate,
        exitCode: result => result.ok ? undefined : 1,
      }, args)
    },
  })
}

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
    await executeCliCommand({ execute: () => createChangeGroup(args.name, goal), present: presentGroup, exitCode: result => result.ok ? undefined : 1 }, args)
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
        await executeCliCommand({ execute: () => closeChangeGroup(args.name), present: presentGroup, exitCode: result => result.ok ? undefined : 1 }, args)
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
        await executeCliCommand({ execute: () => reopenChangeGroup(args.name, { from: args.from, reason: args.reason }), present: presentGroup, exitCode: result => result.ok ? undefined : 1 }, args)
      },
    }),
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
    if (args['dry-run'])
      await executeCliCommand({ execute: () => showReady(args.name), present: presentArchiveDryRun, exitCode: result => result.ok ? undefined : 1 }, args)
    else
      await executeCliCommand({ execute: () => archiveChange(args.name), present: presentArchive, exitCode: result => result.ok ? undefined : 1 }, args)
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
    await executeCliCommand({ execute: () => reopenChange(args.name, { from: args.from, reason: args.reason }), present: presentReopen, exitCode: result => result.ok ? undefined : 1 }, args)
  },
})

const focusCommand = defineCommand({
  meta: {
    name: 'focus',
    description: 'Mark an existing change as currently focused in .rsp/focus.d/',
  },
  args: {
    'name': {
      type: 'positional',
      description: 'Change name',
      required: true,
    },
    'capsule-file': {
      type: 'string',
      description: 'Replace the focus capsule from a regular file or standard input (-)',
    },
  },
  async run({ args }: { args: { 'name': string, 'capsule-file'?: string } }) {
    await executeCliCommand({ execute: () => focusChange(args.name, { capsuleFile: args['capsule-file'] }), present: presentFocus, exitCode: result => result.ok ? undefined : 1 }, args)
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
    await executeCliCommand({ execute: () => unfocusChange(args.name), present: presentFocus, exitCode: result => result.ok ? undefined : 1 }, args)
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
    ...jsonArgs,
  },
  async run({ args }: { args: { 'message-file': string, 'json': boolean } }) {
    await executeCliCommand({
      execute: () => commitFromMessageFile(args['message-file']),
      present: result => presentCommit(result, Boolean(args.json)),
      exitCode: result => result.ok ? undefined : 1,
    }, args)
  },
})

export function createWorkCommands(deprecatedLite: boolean) {
  return {
    commit: commitCommand,
    create: createCreateCommand(deprecatedLite),
    group: groupCommand,
    focus: focusCommand,
    unfocus: unfocusCommand,
    archive: archiveCommand,
    reopen: reopenCommand,
  }
}
