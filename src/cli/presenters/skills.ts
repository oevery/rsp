import type { PackagedSkillInventory } from '../../commands/skills.js'
import { emitJson } from '../../core/output.js'

export function presentPackagedSkillInventory(inventory: PackagedSkillInventory, json = false): void {
  if (json) {
    emitJson(inventory)
    return
  }
  console.log(`  ${inventory.package.name}@${inventory.package.version}`)
  console.log(`  target: ${inventory.target}`)
  console.log('  Core suite (managed by init/update)')
  for (const skill of inventory.skills)
    console.log(`    ${skill.name}  ${skill.status}`)
  for (const name of inventory.retired)
    console.log(`    ${name}  retired`)
}
