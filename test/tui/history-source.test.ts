import type { ArchiveHistoryInspection, ArchiveHistoryRecord } from '../../src/history/model.js'
import type { HistoryDetailOutput } from '../../src/types.js'
import { describe, expect, it, vi } from 'vitest'
import { createTuiHistorySource } from '../../src/tui/history-source.js'

function record(path: string, summary: string): ArchiveHistoryRecord {
  return {
    date: '2026-07-24',
    workRef: 'repeat',
    group: null,
    kind: 'feature',
    summary,
    summaryTruncated: false,
    path,
    sourcePath: `/fixture/${path}`,
    archivesDir: '/fixture/.rsp/archives',
    sourceSnapshot: {
      device: 1n,
      inode: 2n,
      size: 100n,
      mtimeNs: 200n,
      ctimeNs: 300n,
    },
    maxFileBytes: 512 * 1024,
  }
}

function inspection(records: ArchiveHistoryRecord[], complete = true): ArchiveHistoryInspection {
  return {
    rootExists: true,
    records,
    groupBriefs: [],
    diagnostics: complete ? [] : [{ severity: 'error', code: 'archive_read_failed', path: '.rsp/archives/bad.md', message: 'bad archive' }],
    diagnosticSummary: { total: complete ? 0 : 1, returned: complete ? 0 : 1, hasMore: false },
    runtime: [],
  }
}

describe('tUI history source', () => {
  it('reads detail from the last successful validated list cache without reinspection', async () => {
    const first = record('.rsp/archives/2026-07-24_repeat.md', 'first')
    const inspect = vi.fn()
      .mockResolvedValueOnce(inspection([first]))
      .mockResolvedValueOnce(inspection([], false))
    const readDetail = vi.fn(async (selected: ArchiveHistoryRecord): Promise<HistoryDetailOutput> => ({
      ...selected,
      scenarioCount: 0,
      checkboxes: {
        tasks: { done: 0, todo: 0, progress: 0, dropped: 0, total: 0 },
        verify: { done: 0, todo: 0, progress: 0, dropped: 0, total: 0 },
      },
      evidence: {
        tasks: { items: [], truncated: false },
        verify: { items: [], truncated: false },
        blockers: { items: [], truncated: false },
      },
    }))
    const source = createTuiHistorySource({ inspect, readDetail })

    await source.list()
    await source.detail(first.path)
    expect(inspect).toHaveBeenCalledTimes(1)
    expect(readDetail).toHaveBeenCalledWith(first)

    await expect(source.list()).rejects.toThrow('archive_inspection_incomplete')
    await source.detail(first.path)
    expect(inspect).toHaveBeenCalledTimes(2)
    expect(readDetail).toHaveBeenLastCalledWith(first)
  })
})
