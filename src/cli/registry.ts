import { defineCommand } from 'citty'
import { inspectionCommands } from './commands/inspection.js'
import { setupCommands } from './commands/setup.js'
import { skillsCommands } from './commands/skills.js'
import { createWorkCommands } from './commands/work.js'

export interface RootCommandOptions {
  version: string
  deprecatedLite: boolean
}

export function createRootCommand(options: RootCommandOptions) {
  const workCommands = createWorkCommands(options.deprecatedLite)

  return defineCommand({
    meta: {
      name: 'rsp',
      version: options.version,
      description: 'RSP (Reliable Software Practice), a repository-native engineering workflow for humans and AI agents',
    },
    subCommands: {
      init: setupCommands.init,
      add: setupCommands.add,
      specs: inspectionCommands.specs,
      commit: workCommands.commit,
      create: workCommands.create,
      group: workCommands.group,
      focus: workCommands.focus,
      unfocus: workCommands.unfocus,
      archive: workCommands.archive,
      reopen: workCommands.reopen,
      ready: inspectionCommands.ready,
      show: inspectionCommands.show,
      history: inspectionCommands.history,
      status: inspectionCommands.status,
      check: inspectionCommands.check,
      update: setupCommands.update,
      doctor: inspectionCommands.doctor,
      skills: skillsCommands.skills,
    },
  })
}
