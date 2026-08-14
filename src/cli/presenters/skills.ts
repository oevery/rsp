import type { PackagedSkillInventory, SkillInstallResult } from '../../commands/skills.js'
import { emitJson } from '../../core/output.js'

export function presentPackagedSkillInventory(inventory: PackagedSkillInventory, json = false): void {
  if (json) {
    emitJson(inventory)
    return
  }
  console.log(`  ${inventory.package.name}@${inventory.package.version}`)
  console.log(`  target: ${inventory.target}`)
  for (const group of [
    { heading: 'Default suite Skills', kind: 'default' },
    { heading: 'Optional project Skills', kind: 'optional' },
  ] as const) {
    console.log('')
    console.log(`  ${group.heading}`)
    const skills = inventory.skills.filter(skill => skill.kind === group.kind)
    if (skills.length === 0)
      console.log('    none')
    for (const skill of skills)
      console.log(`    ${skill.name}  ${skill.status}`)
  }
}

export function presentSkillInstallResult(result: SkillInstallResult, dryRun = false): void {
  const prefix = dryRun ? 'would be ' : ''
  for (const status of ['installed', 'unchanged', 'replaced', 'removed'] as const) {
    if (result[status].length > 0)
      console.log(`  ${prefix}${status}: ${result[status].join(', ')}`)
  }
}
