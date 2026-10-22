import { defineCommand } from 'citty'
import { inspectPackagedSkillInventory } from '../../commands/skills.js'
import { executeCliCommand } from '../adapter.js'
import { jsonArgs } from '../capabilities.js'
import { presentPackagedSkillInventory } from '../presenters/skills.js'

const skillsListCommand = defineCommand({
  meta: { name: 'list', description: 'Inspect the complete package-owned Skill inventory' },
  args: { ...jsonArgs },
  async run({ args }) {
    await executeCliCommand({
      execute: () => inspectPackagedSkillInventory(),
      present: inventory => presentPackagedSkillInventory(inventory, Boolean(args.json)),
    }, args)
  },
})

export const skillsCommands = {
  skills: defineCommand({
    meta: { name: 'skills', description: 'Inspect Skills; use init or update to manage the complete environment' },
    subCommands: { list: skillsListCommand },
  }),
}
