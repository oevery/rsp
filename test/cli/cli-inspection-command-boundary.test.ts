import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '..', '..')
const inspectionOperations = ['status.ts', 'show.ts', 'ready.ts', 'check.ts', 'doctor.ts', 'history.ts', 'specs.ts']
const cliCommandDomains = ['inspection.ts', 'setup.ts', 'work.ts', 'skills.ts']

describe('cli inspection command boundary', () => {
  it('keeps every command operation presentation-neutral and process-neutral', () => {
    const commandDirectory = join(root, 'src', 'commands')
    const source = readdirSync(commandDirectory)
      .filter(file => file.endsWith('.ts'))
      .map(file => readFileSync(join(commandDirectory, file), 'utf8'))
      .join('\n')

    expect(source).not.toMatch(/\bconsole\.(?:log|warn|error)\b/)
    expect(source).not.toMatch(/\bemitJson\b/)
    expect(source).not.toMatch(/process\.(?:exit|exitCode|stdout|stderr)\b/)
  })

  it('keeps inspection operations free of CLI presentation options', () => {
    const source = inspectionOperations
      .map(file => readFileSync(join(root, 'src', 'commands', file), 'utf8'))
      .join('\n')

    expect(source).not.toMatch(/\bCommandRunOptions\b/)
    expect(source).not.toMatch(/(?:options|args)\.(?:json|compact|verbose)\b/)
    expect(source).not.toMatch(/\brecordRuntimeDiagnostic\b/)
  })

  it('routes every published command domain through the accepted executor', () => {
    for (const file of cliCommandDomains) {
      const source = readFileSync(join(root, 'src', 'cli', 'commands', file), 'utf8')
      expect(source, file).toContain('executeCliCommand')
    }
  })

  it('composes archive dry-run from the ready operation and CLI presenter', () => {
    const workCommand = readFileSync(join(root, 'src', 'cli', 'commands', 'work.ts'), 'utf8')
    const workPresenter = readFileSync(join(root, 'src', 'cli', 'presenters', 'work.ts'), 'utf8')

    expect(workCommand).toContain('execute: () => showReady(args.name)')
    expect(workPresenter).toContain('presentReady(result, { json: false, compact: false })')
    expect(workPresenter).not.toContain('import { showReady }')
  })
})
