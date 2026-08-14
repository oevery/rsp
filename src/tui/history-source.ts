import type { ArchiveHistoryInspection, ArchiveHistoryListResult, ArchiveHistoryRecord } from '../history/model.js'
import type { HistoryDetailOutput } from '../types.js'
import { ArchiveHistoryError, historyInspectionComplete, inspectArchiveHistory, queryArchiveHistory, readArchiveHistoryDetail, readArchiveHistoryDocument } from '../history/query.js'

export interface TuiHistorySource {
  list: () => Promise<ArchiveHistoryListResult>
  detail: (path: string) => Promise<HistoryDetailOutput>
  document: (path: string) => Promise<{ path: string, content: string }>
}

export interface TuiHistorySourceDependencies {
  inspect: () => Promise<ArchiveHistoryInspection>
  readDetail: (record: ArchiveHistoryRecord) => Promise<HistoryDetailOutput>
  readDocument?: (record: ArchiveHistoryRecord) => Promise<{ content: string }>
}

const defaultDependencies: TuiHistorySourceDependencies = {
  inspect: inspectArchiveHistory,
  readDetail: readArchiveHistoryDetail,
  readDocument: readArchiveHistoryDocument,
}

export function createTuiHistorySource(dependencies: TuiHistorySourceDependencies = defaultDependencies): TuiHistorySource {
  let recordsByPath = new Map<string, ArchiveHistoryRecord>()
  return {
    async list() {
      const inspection = await dependencies.inspect()
      if (!historyInspectionComplete(inspection)) {
        const first = inspection.diagnostics[0]
        throw new ArchiveHistoryError('archive_inspection_incomplete', `archive_inspection_incomplete${first ? `: ${first.path ?? 'archive'} — ${first.message}` : ''}`)
      }
      const result = queryArchiveHistory(inspection.records)
      const returnedPaths = new Set(result.records.map(record => record.path))
      const nextRecords = new Map(inspection.records.filter(record => returnedPaths.has(record.path)).map(record => [record.path, record]))
      recordsByPath = nextRecords
      return result
    },
    detail(path) {
      const record = recordsByPath.get(path)
      if (!record)
        throw new ArchiveHistoryError('archive_not_found', `archived Change is not present in the last successful bounded TUI result: ${path}`)
      return dependencies.readDetail(record)
    },
    async document(path) {
      const record = recordsByPath.get(path)
      if (!record)
        throw new ArchiveHistoryError('archive_not_found', `archived Change is not present in the last successful bounded TUI result: ${path}`)
      if (!dependencies.readDocument)
        throw new ArchiveHistoryError('archive_read_failed', `archive document reader is unavailable: ${path}`)
      return { path, content: (await dependencies.readDocument(record)).content }
    },
  }
}
