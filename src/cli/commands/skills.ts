import { defineCommand } from 'citty'
import { inspectPackagedSkillInventory, installPackagedSkills } from '../../commands/skills.js'
import { executeCliCommand } from '../adapter.js'
import { jsonArgs } from '../capabilities.js'
import { presentPackagedSkillInventory, presentSkillInstallResult } from '../presenters/skills.js'

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
    await executeCliCommand({
      execute: () => installPackagedSkills({
        dryRun: Boolean(args['dry-run']),
        force: Boolean(args.force),
        names: args.name ? [args.name] : undefined,
      }),
      present: result => presentSkillInstallResult(result, Boolean(args['dry-run'])),
    }, args)
  },
})

const skillsListCommand = defineCommand({
  meta: {
    name: 'list',
    description: 'List package-bundled Skills and their project status',
  },
  args: {
    ...jsonArgs,
  },
  async run({ args }) {
    await executeCliCommand({
      execute: () => inspectPackagedSkillInventory(),
      present: inventory => presentPackagedSkillInventory(inventory, Boolean(args.json)),
    }, args)
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

export const skillsCommands = {
  skills: skillsCommand,
}
