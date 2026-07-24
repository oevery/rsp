import type { StatusOptions } from '../status/model.js'
import type { CommandRunOptions, StatusJsonShape } from '../types.js'

import { emitJson } from '../core/output.js'
import { deriveStatusView } from '../status/derive.js'
import { inspectProjectStatus } from '../status/inspect.js'
import { printStatusPlain, printStatusRuntimeDiagnostics } from '../status/plain.js'
import { toStatusJson } from '../status/v3-json.js'

export type { StatusOptions } from '../status/model.js'

/** Display project status through the stable snapshot and presentation adapters. */
export async function showStatus(options: StatusOptions = {}, runOptions: CommandRunOptions = {}): Promise<StatusJsonShape> {
  const snapshot = await inspectProjectStatus()
  if (runOptions.verbose && !runOptions.json)
    printStatusRuntimeDiagnostics(snapshot.runtime)

  const view = deriveStatusView(snapshot, options)
  const result = toStatusJson(view)
  if (runOptions.json)
    emitJson(result, runOptions)
  else
    printStatusPlain(view)
  return result
}
