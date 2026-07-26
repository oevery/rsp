import type { PackagedSkillInventory } from '../commands/skills.js'
import type { SkillsTuiMessages } from './messages.js'
import { Box, Text, useApp, useInput, useStdout } from 'ink'
import { useMemo, useState } from 'react'
import { truncateDisplay } from '../tui/display.js'

export type SkillsTuiSelection
  = | { kind: 'cancelled' }
    | { kind: 'confirmed', names: string[], force: boolean }
    | { kind: 'error' }

interface SkillsAppProps {
  inventory: PackagedSkillInventory
  messages: SkillsTuiMessages
  initialWidth?: number
  onComplete: (selection: SkillsTuiSelection) => void
}

export function SkillsApp({ initialWidth, inventory, messages, onComplete }: SkillsAppProps) {
  const { exit } = useApp()
  const { stdout } = useStdout()
  const width = Math.max(40, initialWidth ?? stdout.columns ?? 80)
  const optional = useMemo(() => inventory.skills.filter(skill => skill.kind === 'optional'), [inventory])
  const defaults = useMemo(() => inventory.skills.filter(skill => skill.kind === 'default'), [inventory])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [cursor, setCursor] = useState(0)
  const [phase, setPhase] = useState<'select' | 'replace'>('select')

  const finish = (selection: SkillsTuiSelection) => {
    onComplete(selection)
    exit()
  }
  const selectedNames = () => [...defaults.map(skill => skill.name), ...optional.filter(skill => selected.has(skill.name)).map(skill => skill.name)].sort()

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
    if ((key.upArrow || input === 'k') && optional.length > 0) {
      setCursor(value => (value - 1 + optional.length) % optional.length)
    }
    else if ((key.downArrow || input === 'j') && optional.length > 0) {
      setCursor(value => (value + 1) % optional.length)
    }
    else if (input === ' ' && optional[cursor]) {
      const name = optional[cursor].name
      setSelected((current) => {
        const next = new Set(current)
        if (next.has(name))
          next.delete(name)
        else
          next.add(name)
        return next
      })
    }
    else if (key.return) {
      const names = selectedNames()
      const divergent = inventory.skills.some(skill => names.includes(skill.name) && skill.status === 'divergent')
      if (divergent)
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
      {defaults.map(skill => (
        <Text key={skill.name}>{truncateDisplay(`  [x] ${skill.name}  ${messages.locked} · ${status(skill.status)}`, width)}</Text>
      ))}
      <Text> </Text>
      <Text bold>{messages.optionalHeading}</Text>
      {optional.length === 0 && <Text dimColor>{`  ${messages.none}`}</Text>}
      {optional.map((skill, index) => (
        <Text key={skill.name}>{truncateDisplay(`${index === cursor ? '›' : ' '} ${selected.has(skill.name) ? '[x]' : '[ ]'} ${skill.name}  ${status(skill.status)}`, width)}</Text>
      ))}
      <Text> </Text>
      <Text color={phase === 'replace' ? 'yellow' : undefined}>{phase === 'replace' ? messages.replaceTitle : messages.selectHelp}</Text>
      {phase === 'replace' && <Text>{messages.replaceHelp}</Text>}
    </Box>
  )
}
