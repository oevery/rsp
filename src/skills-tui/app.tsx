import type { PackagedSkillInventory, SkillInstallResult } from '../commands/skills.js'
import type { SkillsTuiMessages } from './messages.js'
import { Box, Text, useApp, useInput, useStdout } from 'ink'
import { useState } from 'react'
import { truncateDisplay } from '../tui/display.js'

export type SkillsTuiSelection
  = | { kind: 'cancelled' }
    | { kind: 'confirmed', names: string[], force: boolean }
    | { kind: 'error' }

interface SkillsAppProps {
  inventory: PackagedSkillInventory
  plan: SkillInstallResult
  messages: SkillsTuiMessages
  initialWidth?: number
  onComplete: (selection: SkillsTuiSelection) => void
}

export function SkillsApp({ initialWidth, inventory, plan, messages, onComplete }: SkillsAppProps) {
  const { exit } = useApp()
  const { stdout } = useStdout()
  const width = Math.max(40, initialWidth ?? stdout.columns ?? 80)
  const [phase, setPhase] = useState<'select' | 'replace'>('select')

  const finish = (selection: SkillsTuiSelection) => {
    onComplete(selection)
    exit()
  }
  const selectedNames = () => inventory.skills.map(skill => skill.name).sort()

  useInput((input, key) => {
    if (phase === 'replace') {
      if (input.toLowerCase() === 'y') {
        finish({ kind: 'confirmed', names: selectedNames(), force: true })
      }
      else if (input.toLowerCase() === 'n' || key.escape) {
        finish({ kind: 'cancelled' })
      }
      return
    }
    if (key.escape || input === 'q' || (key.ctrl && input === 'c')) {
      finish({ kind: 'cancelled' })
      return
    }
    if (key.return) {
      const names = selectedNames()
      if (plan.replaced.length > 0 || plan.removed.length > 0)
        setPhase('replace')
      else
        finish({ kind: 'confirmed', names, force: false })
    }
  })

  const status = (value: 'missing' | 'unchanged' | 'divergent') => messages[value]
  return (
    <Box flexDirection="column" width={width}>
      <Text bold>{messages.title}</Text>
      <Text>{truncateDisplay(`${inventory.package.name}@${inventory.package.version}`, width)}</Text>
      <Text>{truncateDisplay(`${messages.target}: ${inventory.target}`, width)}</Text>
      <Text> </Text>
      <Text bold>{messages.defaultHeading}</Text>
      {inventory.skills.map(skill => (
        <Text key={skill.name}>{truncateDisplay(`  [x] ${skill.name}  ${messages.locked} · ${status(skill.status)}`, width)}</Text>
      ))}
      <Text> </Text>
      {plan.replaced.map(name => (
        <Text key={`replace-${name}`}>{`${messages.replaceDirectory}: ${inventory.target}/${name}`}</Text>
      ))}
      {plan.removed.map(name => (
        <Text key={`remove-${name}`}>{`${messages.removeDirectory}: ${inventory.target}/${name}`}</Text>
      ))}
      <Text color={phase === 'replace' ? 'yellow' : undefined}>{phase === 'replace' ? messages.replaceTitle : messages.selectHelp}</Text>
      {phase === 'replace' && <Text>{messages.replaceHelp}</Text>}
    </Box>
  )
}
