import type { CommandDef, Resolvable, SubCommandsDef } from 'citty'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderUsage } from 'citty'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { executeCliCommand } from '../src/cli/adapter.js'
import { CLI_COMMAND_CAPABILITIES } from '../src/cli/capabilities.js'
import { createRootCommand } from '../src/cli/registry.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const originalExitCode = process.exitCode

afterEach(() => {
  process.exitCode = originalExitCode
})

async function resolveValue<T>(value: Resolvable<T> | undefined): Promise<T | undefined> {
  if (typeof value !== 'function')
    return await value
  const resolve = value as () => T | Promise<T>
  return await resolve()
}

async function resolveCommand(rootCommand: CommandDef, path: string): Promise<CommandDef> {
  let command = rootCommand
  for (const segment of path.split(' ')) {
    const subCommands = await resolveValue(command.subCommands as Resolvable<SubCommandsDef> | undefined)
    const next = subCommands ? await resolveValue(subCommands[segment]) : undefined
    if (!next)
      throw new Error(['Missing command registration for', path].join(' '))
    command = next
  }
  return command
}

describe('cli command boundary foundation', () => {
  it('keeps process routing separate from Citty command definitions', () => {
    const cliSource = readFileSync(join(root, 'src', 'cli.ts'), 'utf8')
    const registrySource = readFileSync(join(root, 'src', 'cli', 'registry.ts'), 'utf8')

    expect(cliSource).not.toContain('defineCommand')
    expect(cliSource).toContain('createRootCommand')
    expect(cliSource).toContain('await import(\'./tui/entry.js\')')
    expect(cliSource).toContain('await import(\'./skills-tui/entry.js\')')
    expect(registrySource).toContain('defineCommand')
    expect(registrySource).toContain('from \'./commands/inspection.js\'')
    expect(registrySource).toContain('from \'./commands/setup.js\'')
    expect(registrySource).toContain('from \'./commands/work.js\'')
    expect(registrySource).toContain('from \'./commands/workspace.js\'')
    expect(registrySource).toContain('from \'./commands/skills.js\'')
  })

  it('registers every published root command through the registry', async () => {
    const rootCommand = createRootCommand({ version: '0.0.0-test', deprecatedLite: false })
    const subCommands = await resolveValue(rootCommand.subCommands)

    expect(Object.keys(subCommands ?? {})).toEqual([
      'init',
      'add',
      'specs',
      'workspace',
      'land',
      'commit',
      'create',
      'group',
      'focus',
      'unfocus',
      'archive',
      'reopen',
      'ready',
      'show',
      'history',
      'status',
      'check',
      'update',
      'doctor',
      'skills',
    ])
  })

  it('keeps capability metadata aligned with generated command help', async () => {
    const rootCommand = createRootCommand({ version: '0.0.0-test', deprecatedLite: false })

    for (const [path, capabilities] of Object.entries(CLI_COMMAND_CAPABILITIES)) {
      const command = await resolveCommand(rootCommand, path)
      const usage = await renderUsage(command)
      expect(usage, path).toContain('--json')
      if (capabilities.compact)
        expect(usage, path).toContain('--compact')
      else
        expect(usage, path).not.toContain('--compact')
    }
  })

  it('provides a typed execute-present-exit sequence without interception', async () => {
    const events: string[] = []
    const present = vi.fn((result: { ok: boolean }, args: { command: string }) => {
      events.push(['present', args.command, String(result.ok)].join(':'))
    })

    const result = await executeCliCommand({
      execute: async (args: { command: string }) => {
        events.push(['execute', args.command].join(':'))
        return { ok: false }
      },
      present,
      exitCode: value => value.ok ? undefined : 1,
    }, { command: 'example' })

    expect(result).toEqual({ ok: false })
    expect(events).toEqual(['execute:example', 'present:example:false'])
    expect(present).toHaveBeenCalledOnce()
    expect(process.exitCode).toBe(1)
  })

  it('contains no process monkeypatch, output capture, AsyncLocalStorage, or control-signal mechanism', () => {
    const sources = [
      'src/cli/adapter.ts',
      'src/cli/capabilities.ts',
      'src/cli/registry.ts',
      'src/cli/commands/inspection.ts',
      'src/cli/commands/setup.ts',
      'src/cli/commands/work.ts',
      'src/cli/commands/workspace.ts',
      'src/cli/commands/skills.ts',
    ].map(path => readFileSync(join(root, path), 'utf8')).join('\n')

    expect(sources).not.toMatch(/\bAsyncLocalStorage\b/)
    expect(sources).not.toMatch(/process\.(?:exit|stdout|stderr)\s*=/)
    expect(sources).not.toMatch(/(?:stdout|stderr).*capture|capture.*(?:stdout|stderr)/i)
    expect(sources).not.toMatch(/(?:Exit|Control)(?:Signal|Sentinel)/)
    expect(readFileSync(join(root, 'src', 'cli', 'adapter.ts'), 'utf8')).not.toMatch(/\bany\b/)
  })
})
