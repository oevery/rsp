import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '..', '..')
const operationFiles = [
  'add-spec.ts',
  'archive.ts',
  'commit.ts',
  'create.ts',
  'focus.ts',
  'group.ts',
  'init.ts',
  'reopen.ts',
  'skills.ts',
  'update.ts',
]
const cliCommandFiles = ['setup.ts', 'work.ts', 'skills.ts']

describe('cli mutation command boundary', () => {
  it('keeps mutation operations presentation-neutral and process-neutral', () => {
    const source = operationFiles
      .map(file => readFileSync(join(root, 'src', 'commands', file), 'utf8'))
      .join('\n')

    expect(source).not.toMatch(/\bconsole\.(?:log|warn|error)\b/)
    expect(source).not.toMatch(/\bemitJson\b/)
    expect(source).not.toMatch(/process\.(?:exit|exitCode|stdout|stderr)\b/)
    expect(source).not.toMatch(/\bguardRspInitialized\b/)
    expect(source).not.toMatch(/(?:options|args)\.json\b/)
    expect(source).not.toMatch(/options\.quiet\b/)
  })

  it('routes every mutation command domain through the accepted executor', () => {
    for (const file of cliCommandFiles) {
      const source = readFileSync(join(root, 'src', 'cli', 'commands', file), 'utf8')
      expect(source, file).toContain('executeCliCommand')
      expect(source, file).toMatch(/present:/)
    }
  })

  it('keeps presentation in CLI-owned domain presenters', () => {
    for (const file of cliCommandFiles) {
      const source = readFileSync(join(root, 'src', 'cli', 'presenters', file), 'utf8')
      expect(source, file).toMatch(/console\.|emitJson|showReady/)
    }
  })
})
