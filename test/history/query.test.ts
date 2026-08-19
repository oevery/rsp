import type { FileHandle } from 'node:fs/promises'
import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { appendFile, chmod, lstat, mkdir, open, rename, rm, symlink, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it, vi } from 'vitest'

import { inspectArchiveHistory, queryArchiveHistory, readArchiveHistoryDetail, selectArchiveHistoryRecord } from '../../src/history/query.js'

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

  it('preserves canonical Chinese Group identities and normalizes query input', async () => {
    const root = await fixture()
    await mkdir(join(root, '.rsp', 'archives', '听说训练'), { recursive: true })
    await writeFile(
      join(root, '.rsp', 'archives', '听说训练', '2026-07-26_模拟朗读.md'),
      archivedChange('听说训练/模拟朗读', 'feature', '保留中文身份'),
    )
    await mkdir(join(root, '.rsp', 'archives', 'café'), { recursive: true })
    await writeFile(join(root, '.rsp', 'archives', 'café', '2026-07-26_验证.md'), archivedChange('café/验证'))

    const inspection = await inspectArchiveHistory({ archivesDir: join(root, '.rsp', 'archives') })

    expect(inspection.diagnostics).toEqual([])
    expect(inspection.records).toEqual(expect.arrayContaining([
      expect.objectContaining({ workRef: '听说训练/模拟朗读', group: '听说训练', path: '.rsp/archives/听说训练/2026-07-26_模拟朗读.md' }),
    ]))
    expect(queryArchiveHistory(inspection.records, { group: 'cafe\u0301' }).records.map(record => record.workRef)).toEqual(['café/验证'])
  })

  it('rejects non-canonical Unicode archive headings and paths', async () => {
    const root = await fixture()
    const nonCanonical = 'cafe\u0301'
    await writeFile(join(root, '.rsp', 'archives', `2026-07-26_${nonCanonical}.md`), archivedChange(nonCanonical))

    const inspection = await inspectArchiveHistory({ archivesDir: join(root, '.rsp', 'archives') })

    expect(inspection.diagnostics).toContainEqual(expect.objectContaining({ code: 'archive_identity_mismatch' }))
    expect(inspection.records.map(record => record.workRef)).not.toContain(nonCanonical)
  })

  it('preserves the archive-heading diagnostic for identities containing spaces', async () => {
    const root = await fixture()
    await writeFile(
      join(root, '.rsp', 'archives', '2026-07-26_invalid-title.md'),
      archivedChange('invalid title'),
    )

    const inspection = await inspectArchiveHistory({ archivesDir: join(root, '.rsp', 'archives') })

    expect(inspection.diagnostics).toContainEqual(expect.objectContaining({
      code: 'archive_heading_invalid',
      path: '.rsp/archives/2026-07-26_invalid-title.md',
    }))
  })

  it('searches WorkRef and the complete summary case-insensitively before applying the limit', async () => {
    const root = await fixture()
    const longPrefix = 'x'.repeat(500)
    await writeFile(join(root, '.rsp', 'archives', '2026-07-25_searchable.md'), archivedChange('searchable', 'feature', `${longPrefix} HiddenNeedle`))
    const inspection = await inspectArchiveHistory({ archivesDir: join(root, '.rsp', 'archives') })

    expect(queryArchiveHistory(inspection.records, { search: 'RELEASE/', limit: 1 })).toEqual(expect.objectContaining({
      records: [expect.objectContaining({ workRef: 'release/api' })],
      summary: { matched: 2, returned: 1, hasMore: true },
    }))
    expect(queryArchiveHistory(inspection.records, { search: 'hiddenneedle' }).records.map(record => record.workRef)).toEqual(['searchable'])
    expect(() => queryArchiveHistory(inspection.records, { search: '   ' })).toThrowError(expect.objectContaining({ code: 'invalid_history_search' }))
  })

  it('shares Change summary precedence while preserving immutable archive placeholder compatibility', async () => {
    const root = await fixture()
    await writeFile(join(root, '.rsp', 'archives', '2026-07-25_frontmatter.md'), archivedChange('frontmatter', 'feature', 'Outcome summary').replace('kind: feature', 'kind: feature\nsummary: Frontmatter summary'))
    await writeFile(join(root, '.rsp', 'archives', '2026-07-25_outcome.md'), archivedChange('outcome', 'feature', 'Legacy summary').replace('- Summary: Legacy summary', '- Outcome: Outcome summary\n- Summary: Legacy summary'))
    await writeFile(join(root, '.rsp', 'archives', '2026-07-25_placeholder.md'), archivedChange('placeholder', 'feature', '<…>'))

    const inspection = await inspectArchiveHistory({ archivesDir: join(root, '.rsp', 'archives') })

    expect(inspection.records).toContainEqual(expect.objectContaining({ workRef: 'frontmatter', summary: 'Frontmatter summary' }))
    expect(inspection.records).toContainEqual(expect.objectContaining({ workRef: 'outcome', summary: 'Outcome summary' }))
    expect(inspection.records).toContainEqual(expect.objectContaining({ workRef: 'placeholder', summary: '<…>' }))
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

  it('rejects an inspected archive replaced by a symlink before detail reads', async ({ onTestFinished }) => {
    const root = await fixture()
    onTestFinished(() => rm(root, { recursive: true, force: true }))
    const inspection = await inspectArchiveHistory({ archivesDir: join(root, '.rsp', 'archives') })
    const selected = selectArchiveHistoryRecord(inspection.records, { workRef: 'flat' })
    const external = join(tmpdir(), 'rsp-history-external', randomUUID())
    await mkdir(join(tmpdir(), 'rsp-history-external'), { recursive: true })
    await writeFile(external, archivedChange('external', 'feature', 'must not escape'))
    onTestFinished(() => rm(external, { force: true }))
    await rm(selected.sourcePath)
    await symlink(external, selected.sourcePath)

    await expect(readArchiveHistoryDetail(selected)).rejects.toEqual(expect.objectContaining({
      code: 'archive_file_changed',
    }))
  })

  it('rejects a same-inode archive rewrite between inspection and detail without rejecting a stable read', async ({ onTestFinished }) => {
    const root = await fixture()
    onTestFinished(() => rm(root, { recursive: true, force: true }))
    const inspection = await inspectArchiveHistory({ archivesDir: join(root, '.rsp', 'archives') })
    const selected = selectArchiveHistoryRecord(inspection.records, { workRef: 'flat' })

    await expect(readArchiveHistoryDetail(selected)).resolves.toEqual(expect.objectContaining({
      workRef: 'flat',
      summary: 'flat summary',
    }))

    const before = await lstat(selected.sourcePath, { bigint: true })
    const rewritten = archivedChange('flat', 'docs', 'evil summary')
    expect(Buffer.byteLength(rewritten)).toBe(Number(before.size))
    await writeFile(selected.sourcePath, rewritten)
    await utimes(selected.sourcePath, new Date('2026-01-01T00:00:00.000Z'), new Date('2026-01-01T00:00:00.000Z'))
    const after = await lstat(selected.sourcePath, { bigint: true })
    expect({ dev: after.dev, ino: after.ino, size: after.size }).toEqual({
      dev: before.dev,
      ino: before.ino,
      size: before.size,
    })

    await expect(readArchiveHistoryDetail(selected)).rejects.toEqual(expect.objectContaining({
      code: 'archive_file_changed',
    }))
  })

  it('rejects symlink and regular-file replacement after the archive handle starts reading', async ({ onTestFinished }) => {
    for (const replacementKind of ['symlink', 'regular'] as const) {
      const root = await fixture()
      onTestFinished(() => rm(root, { recursive: true, force: true }))
      const inspection = await inspectArchiveHistory({ archivesDir: join(root, '.rsp', 'archives') })
      const selected = selectArchiveHistoryRecord(inspection.records, { workRef: 'flat' })
      const replacement = join(root, `${replacementKind}-replacement.md`)
      await writeFile(replacement, archivedChange('flat', 'docs', `${replacementKind} replacement`))
      const probe = await open(selected.sourcePath, 'r')
      const prototype = Object.getPrototypeOf(probe) as { read: FileHandle['read'] }
      await probe.close()
      const originalRead = prototype.read
      let replaced = false
      const readSpy = vi.spyOn(prototype, 'read').mockImplementation((async function (
        this: FileHandle,
        buffer: Buffer,
        offset: number,
        length: number,
        position: number,
      ) {
        const result = await Reflect.apply(originalRead, this, [buffer, offset, length, position])
        if (!replaced && result.bytesRead > 0) {
          replaced = true
          if (replacementKind === 'symlink') {
            await rm(selected.sourcePath)
            await symlink(replacement, selected.sourcePath)
          }
          else {
            await rename(replacement, selected.sourcePath)
          }
        }
        return result
      }) as FileHandle['read'])
      try {
        await expect(readArchiveHistoryDetail(selected)).rejects.toEqual(expect.objectContaining({
          code: 'archive_file_changed',
        }))
        expect(replaced).toBe(true)
      }
      finally {
        readSpy.mockRestore()
      }
    }
  })

  it('reapplies the archive byte bound after inspection and detects growth after handle validation', async ({ onTestFinished }) => {
    const root = await fixture()
    onTestFinished(() => rm(root, { recursive: true, force: true }))
    const path = join(root, '.rsp', 'archives', '2026-07-25_growing.md')
    await writeFile(path, archivedChange('growing'))
    const inspection = await inspectArchiveHistory({
      archivesDir: join(root, '.rsp', 'archives'),
      maxFileBytes: 2_048,
    })
    const selected = selectArchiveHistoryRecord(inspection.records, { workRef: 'growing' })
    await appendFile(path, 'x'.repeat(4_096))
    await expect(readArchiveHistoryDetail(selected)).rejects.toEqual(expect.objectContaining({
      code: 'archive_file_too_large',
    }))

    const growthRoot = join(tmpdir(), 'rsp-history-growth', randomUUID())
    onTestFinished(() => rm(growthRoot, { recursive: true, force: true }))
    const archivesDir = join(growthRoot, '.rsp', 'archives')
    await mkdir(archivesDir, { recursive: true })
    const growthPath = join(archivesDir, '2026-07-25_growing.md')
    await writeFile(growthPath, archivedChange('growing'))
    const probe = await open(growthPath, 'r')
    const prototype = Object.getPrototypeOf(probe) as { stat: FileHandle['stat'] }
    await probe.close()
    const originalStat = prototype.stat
    let grewAfterStat = false
    const statSpy = vi.spyOn(prototype, 'stat').mockImplementation((async function (
      this: FileHandle,
      options?: Parameters<FileHandle['stat']>[0],
    ) {
      const info = await Reflect.apply(originalStat, this, options === undefined ? [] : [options])
      if (!grewAfterStat) {
        grewAfterStat = true
        await appendFile(growthPath, 'x'.repeat(2_048))
      }
      return info
    }) as FileHandle['stat'])
    try {
      const growingInspection = await inspectArchiveHistory({
        archivesDir,
        maxFileBytes: 1_024,
      })
      expect(grewAfterStat).toBe(true)
      expect(growingInspection.diagnostics).toContainEqual(expect.objectContaining({
        code: 'archive_file_too_large',
      }))
    }
    finally {
      statSpy.mockRestore()
    }
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
