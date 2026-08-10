import type { CommandDiagnostic, HistoryRecordOutput, RuntimeDiagnostic } from '../types.js'

export const HISTORY_DEFAULT_LIMIT = 20
export const HISTORY_MAX_LIMIT = 100
export const HISTORY_MAX_TEXT_CODE_POINTS = 500
export const HISTORY_MAX_EVIDENCE_ITEMS = 20
export const HISTORY_MAX_DIAGNOSTICS = 20
export const HISTORY_MAX_CANDIDATES = 20
export const HISTORY_MAX_FILE_BYTES = 512 * 1024

export interface BoundedCollectionSummary {
  total: number
  returned: number
  hasMore: boolean
}

export interface ArchiveHistoryRecord extends HistoryRecordOutput {
  sourcePath: string
  archivesDir: string
  sourceSnapshot: {
    device: bigint
    inode: bigint
    size: bigint
    mtimeNs: bigint
    ctimeNs: bigint
  }
  maxFileBytes: number
  searchSummary?: string
}

export interface ArchivedGroupBriefRecord {
  date: string
  group: string
  path: string
  sourcePath: string
}

export interface ArchiveHistoryInspection {
  rootExists: boolean
  records: ArchiveHistoryRecord[]
  groupBriefs: ArchivedGroupBriefRecord[]
  diagnostics: CommandDiagnostic[]
  diagnosticSummary: BoundedCollectionSummary
  runtime: RuntimeDiagnostic[]
}

export interface ArchiveHistoryQuery {
  limit?: number
  since?: string
  until?: string
  kind?: string
  group?: string
  search?: string
}

export interface ArchiveHistoryListResult {
  records: HistoryRecordOutput[]
  summary: {
    matched: number
    returned: number
    hasMore: boolean
  }
}

export class ArchiveHistoryError extends Error {
  public readonly candidates: string[]
  public readonly candidateTotal: number
  public readonly candidatesTruncated: boolean

  constructor(
    public readonly code: string,
    message: string,
    candidates: string[] = [],
  ) {
    super(message)
    this.name = 'ArchiveHistoryError'
    const ordered = [...candidates].sort()
    this.candidateTotal = ordered.length
    this.candidates = ordered.slice(0, HISTORY_MAX_CANDIDATES)
    this.candidatesTruncated = this.candidateTotal > this.candidates.length
  }
}
