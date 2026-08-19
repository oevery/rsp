import type { Buffer } from 'node:buffer'
import type { FileHandle } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { symlinkSync, unlinkSync } from 'node:fs'
import { appendFile, mkdir, open, rename, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { describe, expect, it, vi } from 'vitest'

import { projectSpecsDetail, projectSpecsSearch, projectSpecsTree } from '../../src/specs/projection.js'
import { inspectSpecs, readSpecsDetail, searchSpecs, specsInspectionComplete, SpecsQueryError } from '../../src/specs/query.js'

async function createSpecsFixture(name: string): Promise<string> {
  const root = join(tmpdir(), name, randomUUID())
  await mkdir(join(root, '.rsp', 'specs', 'decisions'), { recursive: true })
  await mkdir(join(root, '.rsp', 'changes'), { recursive: true })
  await mkdir(join(root, '.rsp', 'archives'), { recursive: true })
  await mkdir(join(root, '.rsp', 'focus.d'), { recursive: true })
  await writeFile(join(root, '.rsp', 'config.yaml'), 'kinds: []\ndecisions:\n  path: .rsp/specs/decisions\n')
  await writeFile(join(root, '.rsp', 'rsp-rules.md'), '# fallback\n')
  return root
}

describe.sequential('specs query model', () => {
  it('derives nested Specs and separately identified Decision Records without generated indexes', async () => {
    const root = await createSpecsFixture('rsp-specs-query-tree')
    await mkdir(join(root, '.rsp', 'specs', 'platform', 'api'), { recursive: true })
    await writeFile(join(root, '.rsp', 'specs', 'design.md'), '# Project Design\n\nStable project facts.\n')
    await writeFile(join(root, '.rsp', 'specs', 'platform', 'api', 'http.md'), '---\ntitle: HTTP API\nsummary: Stable API contract\n---\n\n# HTTP\n')
    await writeFile(join(root, '.rsp', 'specs', 'decisions', 'transport.md'), '# Choose HTTP\n\nTransport rationale.\n')

    const inspection = await inspectSpecs({ cwd: root })

    expect(specsInspectionComplete(inspection)).toBe(true)
    expect(inspection.documents).toEqual([
      expect.objectContaining({ path: '.rsp/specs/decisions/transport.md', kind: 'decision-record', title: 'Choose HTTP' }),
      expect.objectContaining({ path: '.rsp/specs/design.md', kind: 'spec', title: 'Project Design' }),
      expect.objectContaining({ path: '.rsp/specs/platform/api/http.md', kind: 'spec', title: 'HTTP API', summary: 'Stable API contract' }),
    ])
    expect(inspection.tree.directories[0]).toEqual(expect.objectContaining({
      name: 'platform',
      directories: [expect.objectContaining({ name: 'api' })],
    }))
    expect(inspection.decisionRecords.documents).toEqual([
      expect.objectContaining({ path: '.rsp/specs/decisions/transport.md', kind: 'decision-record' }),
    ])
  })

  it('reads current tracked or untracked content for detail and bounded literal search', async () => {
    const root = await createSpecsFixture('rsp-specs-query-current-file')
    const path = join(root, '.rsp', 'specs', 'design.md')
    await writeFile(path, '# Project Design\n\nInitial facts.\n')
    let inspection = await inspectSpecs({ cwd: root })

    await writeFile(path, '# Project Design\n\n## Runtime boundary\nThe CurrentNeedle is visible from the working tree.\n')
    inspection = await inspectSpecs({ cwd: root })
    const detail = await readSpecsDetail(inspection, '.rsp/specs/design.md')
    const search = await searchSpecs(inspection, 'currentneedle', { limit: 1, excerptCodePoints: 40 })

    expect(detail.content).toContain('CurrentNeedle')
    expect(search.matches).toEqual([
      expect.objectContaining({
        path: '.rsp/specs/design.md',
        kind: 'spec',
        heading: 'Runtime boundary',
        line: 4,
        excerpt: expect.stringContaining('CurrentNeedle'),
      }),
    ])
    expect(search.summary).toEqual({ candidates: 1, searched: 1, matched: 1, returned: 1, hasMore: false })
  })

  it('preserves literal trailing hashes and removes only CommonMark closing sequences', async () => {
    const root = await createSpecsFixture('rsp-specs-query-heading-hashes')
    await writeFile(join(root, '.rsp', 'specs', 'languages.md'), [
      '# C#',
      '',
      '## F#',
      'FunctionalNeedle is current.',
      '',
      '## Runtime ###   ',
      'ClosingNeedle is current.',
      '',
    ].join('\n'))

    const inspection = await inspectSpecs({ cwd: root })
    const document = inspection.documents[0]
    const functional = await searchSpecs(inspection, 'functionalneedle')
    const closing = await searchSpecs(inspection, 'closingneedle')

    expect(document).toEqual(expect.objectContaining({
      title: 'C#',
      headings: [
        expect.objectContaining({ title: 'C#' }),
        expect.objectContaining({ title: 'F#' }),
        expect.objectContaining({ title: 'Runtime' }),
      ],
    }))
    expect(functional.matches).toContainEqual(expect.objectContaining({ heading: 'F#' }))
    expect(closing.matches).toContainEqual(expect.objectContaining({ heading: 'Runtime' }))
  })

  it('rejects a Specs file replaced by an external symlink after managed inspection', async () => {
    const root = await createSpecsFixture('rsp-specs-query-file-race')
    const path = join(root, '.rsp', 'specs', 'design.md')
    const external = join(tmpdir(), 'rsp-specs-query-external-file', randomUUID(), 'outside.md')
    await mkdir(dirname(external), { recursive: true })
    await writeFile(path, '# Project Design\n\nInternal facts.\n')
    await writeFile(external, '# External\n\nExternalSecretNeedle\n')
    const inspection = await inspectSpecs({ cwd: root })
    const detail = readSpecsDetail(inspection, '.rsp/specs/design.md')
    unlinkSync(path)
    symlinkSync(external, path)

    await expect(detail).rejects.toEqual(expect.objectContaining({
      code: 'specs_file_changed',
    }))
  })

  it('classifies recognized generated indexes and fails closed on owner-controlled reserved content', async () => {
    const root = await createSpecsFixture('rsp-specs-query-reserved')
    await writeFile(join(root, '.rsp', 'specs', 'design.md'), '# Design\n')
    await writeFile(join(root, '.rsp', 'specs', '00-index.md'), `---
kind: generated-index
index_type: specs
source_dir: .rsp/specs
---
`)

    let inspection = await inspectSpecs({ cwd: root })
    expect(specsInspectionComplete(inspection)).toBe(true)
    expect(inspection.generatedIndexes).toEqual([
      expect.objectContaining({ path: '.rsp/specs/00-index.md', classification: 'safe-removal' }),
    ])
    expect(inspection.documents.map(document => document.path)).toEqual(['.rsp/specs/design.md'])

    await writeFile(join(root, '.rsp', 'specs', '00-index.md'), '# Project-owned reserved notes\n')
    inspection = await inspectSpecs({ cwd: root })
    expect(specsInspectionComplete(inspection)).toBe(false)
    expect(inspection.generatedIndexes).toEqual([
      expect.objectContaining({ path: '.rsp/specs/00-index.md', classification: 'owner-controlled' }),
    ])
    expect(inspection.diagnostics).toContainEqual(expect.objectContaining({ code: 'unrecognized_reserved_specs_index' }))
  })

  it('retains no-follow traversal and explicit candidate and file-size bounds', async () => {
    const root = await createSpecsFixture('rsp-specs-query-bounds')
    const external = join(tmpdir(), 'rsp-specs-query-external', randomUUID())
    await mkdir(external, { recursive: true })
    await writeFile(join(root, '.rsp', 'specs', 'design.md'), '# Design\n')
    await writeFile(join(root, '.rsp', 'specs', 'a-large.md'), `# Large\n\n${'x'.repeat(100)}`)
    await writeFile(join(root, '.rsp', 'specs', 'z-extra.md'), '# Extra\n')
    await symlink(external, join(root, '.rsp', 'specs', 'linked'))

    const inspection = await inspectSpecs({ cwd: root, maxCandidates: 1, maxFileBytes: 32 })

    expect(specsInspectionComplete(inspection)).toBe(false)
    expect(inspection.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'specs_tree_invalid' }),
      expect.objectContaining({ code: 'specs_candidate_limit_exceeded' }),
      expect.objectContaining({ code: 'specs_file_too_large' }),
    ]))
  })

  it('keeps checkout inspection independent without changing the process cwd', async () => {
    const first = await createSpecsFixture('rsp-specs-query-cwd-first')
    const second = await createSpecsFixture('rsp-specs-query-cwd-second')
    await writeFile(join(first, '.rsp', 'specs', 'design.md'), '# First project\n')
    await writeFile(join(second, '.rsp', 'specs', 'design.md'), '# Second project\n')
    const cwd = process.cwd()

    const [firstInspection, secondInspection] = await Promise.all([
      inspectSpecs({ cwd: first }),
      inspectSpecs({ cwd: second }),
    ])

    expect(process.cwd()).toBe(cwd)
    expect(firstInspection.documents).toContainEqual(expect.objectContaining({ title: 'First project' }))
    expect(secondInspection.documents).toContainEqual(expect.objectContaining({ title: 'Second project' }))
    expect(firstInspection.source.root).not.toBe(secondInspection.source.root)
  })

  it('reapplies the file-size bound when current detail or search content changes after inspection', async () => {
    const root = await createSpecsFixture('rsp-specs-query-current-bound')
    const path = join(root, '.rsp', 'specs', 'design.md')
    await writeFile(path, '# Design\nsmall\n')
    const inspection = await inspectSpecs({ cwd: root, maxFileBytes: 64 })
    await writeFile(path, `# Design\n${'x'.repeat(100)}\n`)

    await expect(readSpecsDetail(inspection, '.rsp/specs/design.md')).rejects.toEqual(expect.objectContaining({
      code: 'specs_file_too_large',
    }))
    await expect(searchSpecs(inspection, 'design')).rejects.toEqual(expect.objectContaining({
      code: 'specs_file_too_large',
    }))
  })

  it('rejects a Specs file that grows after handle validation for detail and search', async () => {
    const root = await createSpecsFixture('rsp-specs-query-growing-file')
    const path = join(root, '.rsp', 'specs', 'design.md')
    const initialContent = '# Design\nsmall\n'
    await writeFile(path, initialContent)
    const inspection = await inspectSpecs({ cwd: root, maxFileBytes: 64 })

    async function expectGrowthRejected(operation: () => Promise<unknown>): Promise<void> {
      await writeFile(path, initialContent)
      const probe = await open(path, 'r')
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
          await appendFile(path, 'x'.repeat(128))
        }
        return info
      }) as FileHandle['stat'])

      try {
        await expect(operation()).rejects.toEqual(expect.objectContaining({
          code: 'specs_file_too_large',
        }))
        expect(grewAfterStat).toBe(true)
      }
      finally {
        statSpy.mockRestore()
      }
    }

    await expectGrowthRejected(() => readSpecsDetail(inspection, '.rsp/specs/design.md'))
    await expectGrowthRejected(() => searchSpecs(inspection, 'design'))
  })

  it('rejects symlink and regular-file replacement after current Specs detail or search starts reading', async () => {
    for (const operation of ['detail', 'search'] as const) {
      for (const replacementKind of ['symlink', 'regular'] as const) {
        const root = await createSpecsFixture(`rsp-specs-query-${operation}-${replacementKind}-replacement`)
        const path = join(root, '.rsp', 'specs', 'design.md')
        await writeFile(path, '# Design\nStableNeedle remains authoritative.\n')
        const inspection = await inspectSpecs({ cwd: root })
        const replacement = join(root, `${operation}-${replacementKind}-replacement.md`)
        await writeFile(replacement, '# Replaced\nReplacement content must not escape.\n')
        const probe = await open(path, 'r')
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
              await rm(path)
              await symlink(replacement, path)
            }
            else {
              await rename(replacement, path)
            }
          }
          return result
        }) as FileHandle['read'])

        try {
          const request = operation === 'detail'
            ? readSpecsDetail(inspection, '.rsp/specs/design.md')
            : searchSpecs(inspection, 'stableneedle')
          await expect(request).rejects.toEqual(expect.objectContaining({
            code: 'specs_file_changed',
          }))
          expect(replaced).toBe(true)
        }
        finally {
          readSpy.mockRestore()
        }
      }
    }
  })

  it('exposes one fail-closed presentation-neutral projection seam', async () => {
    const root = await createSpecsFixture('rsp-specs-query-projection')
    await writeFile(join(root, '.rsp', 'specs', 'design.md'), '# Project Design\n\n## Runtime\nProjectionNeedle is current.\n')
    const inspection = await inspectSpecs({ cwd: root })

    expect(projectSpecsTree(inspection)).toEqual(expect.objectContaining({
      mode: 'tree',
      documents: [expect.objectContaining({ title: 'Project Design' })],
    }))
    await expect(projectSpecsDetail(inspection, '.rsp/specs/design.md')).resolves.toEqual(expect.objectContaining({
      mode: 'detail',
      document: expect.objectContaining({ content: expect.stringContaining('ProjectionNeedle') }),
    }))
    await expect(projectSpecsSearch(inspection, 'projectionneedle', { limit: 1, excerptCodePoints: 40 })).resolves.toEqual(expect.objectContaining({
      mode: 'search',
      matches: [expect.objectContaining({ title: 'Project Design', heading: 'Runtime' })],
    }))

    await writeFile(join(root, '.rsp', 'specs', '00-index.md'), '# owner content\n')
    const incomplete = await inspectSpecs({ cwd: root })
    expect(() => projectSpecsTree(incomplete)).toThrowError(SpecsQueryError)
  })
})
