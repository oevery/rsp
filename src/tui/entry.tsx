import type { Writable } from 'node:stream'
import type { UiLocale } from './i18n/locale.js'
import process from 'node:process'
import { render } from 'ink'
import React from 'react'
import { inspectProjectStatus } from '../status/inspect.js'
import { DashboardApp } from './app.js'
import { createTuiHistorySource } from './history-source.js'
import { catalogs } from './i18n/messages.js'
import { createTuiSpecsSource } from './specs-source.js'
import { openTerminalSession } from './terminal.js'
import { createTuiWorkSource } from './work-source.js'

const signalExitCodes: Partial<Record<NodeJS.Signals, number>> = {
  SIGHUP: 129,
  SIGINT: 130,
  SIGTERM: 143,
}

interface TuiInstance {
  unmount: () => void
  waitUntilExit: () => Promise<unknown>
}

interface TuiHost {
  env: NodeJS.ProcessEnv
  stdout: Writable
  once: (signal: NodeJS.Signals, listener: () => void) => unknown
  off: (signal: NodeJS.Signals, listener: () => void) => unknown
  exit: (code: number | undefined) => never
}

export interface TuiRuntime {
  inspect: typeof inspectProjectStatus
  inspectHistory: () => ReturnType<ReturnType<typeof createTuiHistorySource>['list']>
  inspectHistoryDetail: (path: string) => ReturnType<ReturnType<typeof createTuiHistorySource>['detail']>
  inspectHistoryDocument?: (path: string) => ReturnType<ReturnType<typeof createTuiHistorySource>['document']>
  specsSource?: ReturnType<typeof createTuiSpecsSource>
  workSource?: ReturnType<typeof createTuiWorkSource>
  render: (element: React.ReactElement, options: { exitOnCtrlC: boolean, patchConsole: boolean }) => TuiInstance
  openSession: typeof openTerminalSession
  host: TuiHost
  reportError: (message: string) => void
}

const defaultHistorySource = createTuiHistorySource()
const defaultSpecsSource = createTuiSpecsSource()
const defaultWorkSource = createTuiWorkSource()

const defaultRuntime: TuiRuntime = {
  inspect: inspectProjectStatus,
  inspectHistory: defaultHistorySource.list,
  inspectHistoryDetail: defaultHistorySource.detail,
  inspectHistoryDocument: defaultHistorySource.document,
  specsSource: defaultSpecsSource,
  workSource: defaultWorkSource,
  render,
  openSession: openTerminalSession,
  host: process,
  reportError: message => console.error(message),
}

export async function runTui(locale: UiLocale, runtime: TuiRuntime = defaultRuntime): Promise<number> {
  const screenReader = runtime.host.env.INK_SCREEN_READER === 'true' || runtime.host.env.INK_SCREEN_READER === '1'
  const session = runtime.openSession(runtime.host.stdout, { screenReader })
  let instance: TuiInstance | undefined
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
    const snapshot = await runtime.inspect()
    instance = runtime.render(React.createElement(DashboardApp, {
      initialSnapshot: snapshot,
      messages: catalogs[locale],
      inspectStatus: runtime.inspect,
      inspectHistory: runtime.inspectHistory,
      inspectHistoryDetail: runtime.inspectHistoryDetail,
      inspectHistoryDocument: runtime.inspectHistoryDocument,
      specsSource: runtime.specsSource,
      workSource: runtime.workSource,
    }), {
      exitOnCtrlC: false,
      patchConsole: false,
    })
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
    return 0
  }
  catch (error) {
    cleanup()
    runtime.reportError(`  Error: ${error instanceof Error ? error.message : String(error)}`)
    return 1
  }
}
