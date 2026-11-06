import type { ArchitectureResult } from '../architecture/model.js'
import type { renderDocument } from './documents.js'
import type { layoutArchitecture } from './layout.js'

export interface ArchitecturePayload {
  workspace: string
  root: string
  revision: string
  graphRevision: string
  focus?: string
  missingFocus?: string
  architecture: ArchitectureResult
  layout: Awaited<ReturnType<typeof layoutArchitecture>>
}

export type DocumentPayload = { workspace: string } & Awaited<ReturnType<typeof renderDocument>>
