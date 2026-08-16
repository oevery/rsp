import type { ArgsDef } from 'citty'

export interface CliCommandCapabilities {
  json: boolean
  compact: boolean
}

export const CLI_COMMAND_CAPABILITIES = {
  'status': { json: true, compact: true },
  'show': { json: true, compact: true },
  'ready': { json: true, compact: true },
  'check': { json: true, compact: true },
  'doctor': { json: true, compact: true },
  'history': { json: true, compact: true },
  'specs': { json: true, compact: true },
  'commit': { json: true, compact: false },
  'skills list': { json: true, compact: false },
} as const satisfies Record<string, CliCommandCapabilities>

export type CliCapabilityCommand = keyof typeof CLI_COMMAND_CAPABILITIES

export const jsonArgs = {
  json: {
    type: 'boolean',
    description: 'Print machine-readable JSON output',
    default: false,
  },
} as const satisfies ArgsDef

export const compactJsonArgs = {
  ...jsonArgs,
  compact: {
    type: 'boolean',
    description: 'Print JSON without indentation (requires --json)',
    default: false,
  },
} as const satisfies ArgsDef

export function supportsCompact(command: string | undefined): command is CliCapabilityCommand {
  if (!command || !(command in CLI_COMMAND_CAPABILITIES))
    return false
  return CLI_COMMAND_CAPABILITIES[command as CliCapabilityCommand].compact
}
