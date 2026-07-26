import type { Writable } from 'node:stream'
import type React from 'react'
import type { UiLocale } from '../tui/i18n/locale.js'
import type { SkillsTuiSelection } from './app.js'
import process from 'node:process'
import { render } from 'ink'
import ReactRuntime from 'react'
import { inspectPackagedSkillInventory } from '../commands/skills.js'
import { openTerminalSession } from '../tui/terminal.js'
import { SkillsApp } from './app.js'
import { skillsCatalogs } from './messages.js'

const signalExitCodes: Partial<Record<NodeJS.Signals, number>> = { SIGHUP: 129, SIGINT: 130, SIGTERM: 143 }

interface SkillsTuiInstance { unmount: () => void, waitUntilExit: () => Promise<unknown> }
interface SkillsTuiHost {
  env: NodeJS.ProcessEnv
  stdout: Writable
  once: (signal: NodeJS.Signals, listener: () => void) => unknown
  off: (signal: NodeJS.Signals, listener: () => void) => unknown
  exit: (code: number | undefined) => never
}

export interface SkillsTuiRuntime {
  inspect: typeof inspectPackagedSkillInventory
  render: (element: React.ReactElement, options: { exitOnCtrlC: boolean, patchConsole: boolean }) => SkillsTuiInstance
  openSession: typeof openTerminalSession
  host: SkillsTuiHost
  reportError: (message: string) => void
}

const defaultRuntime: SkillsTuiRuntime = {
  inspect: inspectPackagedSkillInventory,
  render,
  openSession: openTerminalSession,
  host: process,
  reportError: message => console.error(message),
}

export async function runSkillsTui(locale: UiLocale, runtime: SkillsTuiRuntime = defaultRuntime): Promise<SkillsTuiSelection> {
  const screenReader = runtime.host.env.INK_SCREEN_READER === 'true' || runtime.host.env.INK_SCREEN_READER === '1'
  const session = runtime.openSession(runtime.host.stdout, { screenReader })
  let instance: SkillsTuiInstance | undefined
  let selection: SkillsTuiSelection = { kind: 'cancelled' }
  const listeners = new Map<NodeJS.Signals, () => void>()
  let cleaned = false
  const cleanup = () => {
    if (cleaned)
      return
    cleaned = true
    for (const [signal, listener] of listeners)
      runtime.host.off(signal, listener)
    listeners.clear()
    instance?.unmount()
    session.cleanup()
  }
  try {
    const inventory = await runtime.inspect()
    instance = runtime.render(ReactRuntime.createElement(SkillsApp, {
      inventory,
      messages: skillsCatalogs[locale],
      onComplete: (value) => { selection = value },
    }), { exitOnCtrlC: false, patchConsole: false })
    for (const signal of Object.keys(signalExitCodes) as NodeJS.Signals[]) {
      const listener = () => {
        cleanup()
        runtime.host.exit(signalExitCodes[signal])
      }
      listeners.set(signal, listener)
      runtime.host.once(signal, listener)
    }
    await instance.waitUntilExit()
    cleanup()
    return selection
  }
  catch (error) {
    cleanup()
    runtime.reportError(`  Error: ${error instanceof Error ? error.message : String(error)}`)
    return { kind: 'error' }
  }
}
