import type { AddSpecResult } from '../../commands/add-spec.js'
import type { InitProjectResult } from '../../commands/init.js'
import type { UpdateResult } from '../../commands/update.js'
import { pc } from '../../core/config.js'

const SKILL_REFRESH_HINT = '  Note: if you use package-bundled RSP Skills, refresh them too:\n    rsp skills install --dry-run\n    rsp skills install --force\n'

export function presentAddSpec(result: AddSpecResult): void {
  if (!result.ok) {
    console.error(`  ${pc.red('Error:')} ${result.message}`)
    return
  }
  console.log(`  ${pc.green('Created:')} ${result.path}\n`)
}

export function presentInit(result: InitProjectResult): void {
  if (!result.ok) {
    console.error(`  ${pc.red('Error:')} ${result.message}`)
    return
  }
  if (result.managedAgents !== undefined)
    console.log(`\n${result.managedAgents}\n`)
  if (result.isNew) {
    const createdProjectSetup = result.withProjectSetup ? '\n           .rsp/changes/project-setup.md\n           .rsp/focus.d/project-setup' : ''
    const createdAgents = result.agentsUpdated ? '\n           AGENTS.md' : ''
    const next = result.withProjectSetup ? 'fill .rsp/changes/project-setup.md' : 'rsp create project-setup'
    console.log(`
  ${pc.green('RSP scaffolded.')}\n`)
    console.log(`  Created: .rsp/rsp-rules.md\n           .rsp/specs/\n           ${result.decisionRecordsPath}/\n           .rsp/changes/\n           .rsp/focus.d/\n           .rsp/archives/\n           .rsp/.gitignore\n           .rsp/config.yaml\n           .rsp/specs/design.md${createdProjectSetup}${createdAgents}\n`)
    console.log(`  ${pc.cyan('Next:')} ${next}\n  ${pc.dim('Then:')} fill .rsp/specs/design.md\n  ${pc.dim('Also:')} rsp status  rsp check\n`)
  }
  else if (result.created) {
    console.log(`
  ${pc.green('RSP initialized.')}\n`)
  }
  else {
    console.log(`
  ${pc.yellow('RSP already initialized — nothing changed.')}\n`)
  }
}

export function presentUpdate(result: UpdateResult): void {
  if (!result.ok && result.events.some(event => event.type === 'not-initialized')) {
    console.error(`  ${pc.red('Error:')} RSP is not initialized in this project`)
    console.error(`  ${pc.dim('Run: rsp init')}`)
    return
  }
  for (const event of result.events) {
    if (event.type === 'updated') {
      console.log(`  ${pc.green('✓')} ${event.message}`)
    }
    else if (event.type === 'migration-diagnostics') {
      console.log(`  ${pc.red('Error:')} migration inspection incomplete:`)
      for (const diagnostic of event.diagnostics)
        console.log(`    ${diagnostic.path}: ${diagnostic.message}`)
      console.log(`  ${pc.dim('Fix access to .rsp/rules/, then run rsp update again.')}`)
      console.log()
    }
    else if (event.type === 'residual-rules') {
      console.log(`  ${pc.yellow('Warning:')} these entries are no longer read by RSP:`)
      for (const path of event.entries)
        console.log(`    .rsp/rules/${path}`)
      console.log(`  ${pc.dim('Move stable scoped instructions to the nearest project-owned AGENTS.md, then remove the old files.')}`)
      console.log(`  ${pc.dim('Run: rsp doctor')}`)
      console.log()
    }
    else if (event.type === 'specs-indexes-removed') {
      console.log(`  ${pc.green('✓')} generated Specs indexes removed`)
      for (const path of event.paths)
        console.log(`    ${path}`)
    }
  }
  if (!result.migration.inspectionComplete)
    console.log(`  ${pc.red('Managed update incomplete; migration inspection failed.')}\n`)
  else if (result.migration.residualEntries.length > 0)
    console.log(`  ${pc.yellow(result.updated ? 'Managed update complete; manual migration remains.' : 'Managed files are up to date; manual migration remains.')}\n`)
  else if (!result.updated)
    console.log(`  ${pc.dim('Already up to date.')}\n`)
  else
    console.log(`  ${pc.green('Update complete.')}\n`)
  console.log(SKILL_REFRESH_HINT)
}
