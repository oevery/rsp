import { defineCommand } from 'citty'
import { addSpec } from '../../commands/add-spec.js'
import { initProject } from '../../commands/init.js'
import { updateProject } from '../../commands/update.js'
import { executeCliCommand } from '../adapter.js'
import { presentAddSpec, presentInit, presentUpdate } from '../presenters/setup.js'

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
    await executeCliCommand({
      execute: () => initProject({
        agentsMode: args['agents-mode'] === 'print' ? 'print' : 'managed',
        withProjectSetup: Boolean(args['with-project-setup']),
      }),
      present: presentInit,
      exitCode: result => result.ok ? undefined : 1,
    }, args)
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
    await executeCliCommand({
      execute: () => addSpec(args.name),
      present: presentAddSpec,
      exitCode: result => result.ok ? undefined : 1,
    }, args)
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

const updateCommand = defineCommand({
  meta: {
    name: 'update',
    description: 'Refresh pinned project files; explicit options adopt another version or remove retired Rules',
  },
  args: {
    'adopt-version': { type: 'boolean', description: 'Explicitly migrate the project pin to this running CLI version', default: false },
    'remove-legacy-rules': { type: 'boolean', description: 'Delete the two retired fallback files after preserving custom content', default: false },
  },
  async run({ args }) {
    if (args._.length > 0)
      throw new Error('rsp update accepts no positional arguments; use --adopt-version=false or --remove-legacy-rules=false to disable a flag')
    await executeCliCommand({
      execute: () => updateProject({ adoptVersion: Boolean(args['adopt-version']), removeLegacyRules: Boolean(args['remove-legacy-rules']) }),
      present: presentUpdate,
      exitCode: result => result.migration.inspectionComplete ? undefined : 1,
    }, args)
  },
})

export const setupCommands = {
  init: initCommand,
  add: addCommand,
  update: updateCommand,
}
