import type { ArchiveHistoryInspection, ArchiveHistoryListResult, ArchiveHistoryRecord } from '../history/model.js'
import type { HistoryDetailOutput } from '../types.js'
import { ArchiveHistoryError, historyInspectionComplete, inspectArchiveHistory, queryArchiveHistory, readArchiveHistoryDetail } from '../history/query.js'

export interface TuiHistorySource {
  list: () => Promise<ArchiveHistoryListResult>
  detail: (path: string) => Promise<HistoryDetailOutput>
}

export interface TuiHistorySourceDependencies {
  inspect: () => Promise<ArchiveHistoryInspection>
  readDetail: (record: ArchiveHistoryRecord) => Promise<HistoryDetailOutput>
}

const defaultDependencies: TuiHistorySourceDependencies = {
  inspect: inspectArchiveHistory,
  readDetail: readArchiveHistoryDetail,
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
  }
}
