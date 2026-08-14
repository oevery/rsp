import type { ProjectStatusView, StatusOptions } from '../status/model.js'
import { deriveStatusView } from '../status/derive.js'
import { inspectProjectStatus } from '../status/inspect.js'

export type { StatusOptions } from '../status/model.js'

/** Inspect project status through the stable snapshot and derivation boundary. */
export async function showStatus(options: StatusOptions = {}): Promise<ProjectStatusView> {
  const snapshot = await inspectProjectStatus()
  return deriveStatusView(snapshot, options)
}
