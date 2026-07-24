import { randomUUID } from 'node:crypto'
import { chmod, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { inspectArchiveHistory, queryArchiveHistory, readArchiveHistoryDetail, selectArchiveHistoryRecord } from '../src/history/query.js'

function archivedChange(name: string, kind = 'feature', summary = `${name} summary`, extra = ''): string {
  return `---
kind: ${kind}
---

# Change: ${name}

## Proposal
- Summary: ${summary}

## Spec
### Acceptance
#### Scenario: archived behavior
- GIVEN history
- WHEN queried
- THEN it is returned

## Design
- none

## Tasks
- [x] completed task

## Verify
- Automated:
  - [x] focused test

## Blockers
- none
${extra}`
}

async function fixture(): Promise<string> {
  const root = join(tmpdir(), 'rsp-history-query', randomUUID())
  await mkdir(join(root, '.rsp', 'archives', 'release'), { recursive: true })
  await writeFile(join(root, '.rsp', 'archives', '2026-07-22_flat.md'), archivedChange('flat', 'docs'))
  await writeFile(join(root, '.rsp', 'archives', 'release', '2026-07-24_api.md'), archivedChange('release/api'))
  await writeFile(join(root, '.rsp', 'archives', 'release', '2026-07-23_ui.md'), archivedChange('release/ui', 'fix'))
  await writeFile(join(root, '.rsp', 'archives', 'release', '2026-07-24_brief.md'), `---\nkind: group\n---\n\n# Change Group: release\n`)
  return root
}

describe('archive history query', () => {
  it('strictly inspects archives and returns bounded deterministic Change records', async () => {
    const root = await fixture()
    const inspection = await inspectArchiveHistory({ archivesDir: join(root, '.rsp', 'archives') })

    expect(inspection.diagnostics).toEqual([])
    expect(inspection.records).toHaveLength(3)

    const result = queryArchiveHistory(inspection.records, { group: 'release', limit: 1 })
    expect(result.records.map(record => record.workRef)).toEqual(['release/api'])
    expect(result.summary).toEqual({ matched: 2, returned: 1, hasMore: true })
    expect(() => queryArchiveHistory(inspection.records, { limit: 101 })).toThrowError(expect.objectContaining({ code: 'invalid_history_limit' }))

    const byPath = selectArchiveHistoryRecord(inspection.records, { path: '.rsp/archives/release/2026-07-24_api.md' })
    expect(byPath.workRef).toBe('release/api')
  })

  it('selects exact detail and bounds every evidence field', async () => {
    const root = await fixture()
    const path = join(root, '.rsp', 'archives', '2026-07-25_bounded.md')
    const long = '🚀'.repeat(510)
    const items = Array.from({ length: 22 }, (_, index) => `- [x] task ${index} ${long}`).join('\n')
    await writeFile(path, archivedChange('bounded', 'feature', long).replace('- [x] completed task', items))
    const inspection = await inspectArchiveHistory({ archivesDir: join(root, '.rsp', 'archives') })
    const selected = selectArchiveHistoryRecord(inspection.records, { workRef: 'bounded' })
    const detail = await readArchiveHistoryDetail(selected)

    expect([...detail.summary]).toHaveLength(500)
    expect(detail.summaryTruncated).toBe(true)
    expect(detail.evidence.tasks.items).toHaveLength(20)
    expect([...detail.evidence.tasks.items[0]]).toHaveLength(500)
    expect(detail.evidence.tasks.truncated).toBe(true)
    expect(detail.scenarioCount).toBe(1)
    expect(detail.checkboxes.tasks.done).toBe(22)
  })

  it('fails closed on inconsistent identities and reports duplicate WorkRefs as ambiguous', async () => {
    const root = await fixture()
    await writeFile(join(root, '.rsp', 'archives', 'release', '2026-07-24_wrong.md'), archivedChange('other/wrong'))
    let inspection = await inspectArchiveHistory({ archivesDir: join(root, '.rsp', 'archives') })
    expect(inspection.diagnostics).toContainEqual(expect.objectContaining({ code: 'archive_identity_mismatch' }))

    const badPath = join(root, '.rsp', 'archives', 'release', '2026-07-24_wrong.md')
    await writeFile(badPath, archivedChange('release/wrong'))
    await writeFile(join(root, '.rsp', 'archives', 'release', '2026-07-24_api-2.md'), archivedChange('release/api'))
    inspection = await inspectArchiveHistory({ archivesDir: join(root, '.rsp', 'archives') })

    expect(() => selectArchiveHistoryRecord(inspection.records, { workRef: 'release/api' })).toThrowError(expect.objectContaining({
      code: 'archive_ambiguous',
      candidates: [
        '.rsp/archives/release/2026-07-24_api-2.md',
        '.rsp/archives/release/2026-07-24_api.md',
      ],
    }))
  })

  it('rejects reserved executable identities including collision-suffixed archive names', async () => {
    const root = await fixture()
    await writeFile(join(root, '.rsp', 'archives', 'release', '2026-07-25_brief-2.md'), archivedChange('release/brief'))
    await writeFile(join(root, '.rsp', 'archives', 'release', '2026-07-25_00-brief-2.md'), archivedChange('release/00-brief'))

    const inspection = await inspectArchiveHistory({ archivesDir: join(root, '.rsp', 'archives') })
    expect(inspection.diagnostics.filter(diagnostic => diagnostic.code === 'archive_work_ref_invalid')).toHaveLength(2)
    expect(inspection.records.map(record => record.workRef)).not.toContain('release/brief')
    expect(inspection.records.map(record => record.workRef)).not.toContain('release/00-brief')
  })

  it('fails closed when the archive root is missing', async () => {
    const root = join(tmpdir(), 'rsp-history-missing-root', randomUUID())
    const inspection = await inspectArchiveHistory({ archivesDir: join(root, '.rsp', 'archives') })

    expect(inspection.rootExists).toBe(false)
    expect(inspection.diagnostics).toContainEqual(expect.objectContaining({ code: 'archive_root_missing' }))
  })

  it('bounds diagnostics and ambiguous candidates with total metadata', async () => {
    const root = await fixture()
    for (let index = 0; index < 25; index++) {
      await writeFile(join(root, '.rsp', 'archives', `2026-07-20_bad-${index}.md`), archivedChange(`different-${index}`))
      await writeFile(join(root, '.rsp', 'archives', `2026-07-21_repeat${index === 0 ? '' : `-${index + 1}`}.md`), archivedChange('repeat'))
    }

    const inspection = await inspectArchiveHistory({ archivesDir: join(root, '.rsp', 'archives') })
    expect(inspection.diagnostics).toHaveLength(20)
    expect(inspection.diagnosticSummary).toEqual({ total: 25, returned: 20, hasMore: true })

    try {
      selectArchiveHistoryRecord(inspection.records, { workRef: 'repeat' })
      throw new Error('expected ambiguous history selection')
    }
    catch (error) {
      expect(error).toEqual(expect.objectContaining({
        code: 'archive_ambiguous',
        candidates: expect.any(Array),
        candidateTotal: 25,
        candidatesTruncated: true,
      }))
      expect((error as { candidates: string[] }).candidates).toHaveLength(20)
    }
  })

  it('does not repeat archive read failures through an unbounded runtime channel', async () => {
    const root = await fixture()
    const unreadable = join(root, '.rsp', 'archives', '2026-07-25_unreadable.md')
    await writeFile(unreadable, archivedChange('unreadable'))
    await chmod(unreadable, 0o000)
    try {
      const inspection = await inspectArchiveHistory({ archivesDir: join(root, '.rsp', 'archives') })
      expect(inspection.diagnostics).toContainEqual(expect.objectContaining({ code: 'archive_read_failed' }))
      expect(inspection.runtime).toEqual([])
    }
    finally {
      await chmod(unreadable, 0o600)
    }
  })
})
