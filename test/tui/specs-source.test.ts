import type { SpecsInspection } from '../../src/specs/model.js'
import { randomUUID } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { projectSpecsDetail, projectSpecsSearch, projectSpecsTree } from '../../src/specs/projection.js'
import { inspectSpecs } from '../../src/specs/query.js'
import { createTuiSpecsSource } from '../../src/tui/specs-source.js'

const fixtures: string[] = []

async function createSpecsFixture(): Promise<string> {
  const root = join(tmpdir(), 'rsp-tui-specs-source', randomUUID())
  fixtures.push(root)
  await mkdir(join(root, '.rsp', 'specs', 'decisions'), { recursive: true })
  await mkdir(join(root, '.rsp', 'changes'), { recursive: true })
  await mkdir(join(root, '.rsp', 'archives'), { recursive: true })
  await mkdir(join(root, '.rsp', 'focus.d'), { recursive: true })
  await writeFile(join(root, '.rsp', 'config.yaml'), 'kinds: []\ndecisions:\n  path: .rsp/specs/decisions\n')
  await writeFile(join(root, '.rsp', 'rsp-rules.md'), '# fallback\n')
  return root
}

function incompleteInspection(inspection: SpecsInspection): SpecsInspection {
  return {
    ...inspection,
    diagnostics: [{
      severity: 'error',
      code: 'specs_tree_invalid',
      path: '.rsp/specs',
      message: 'failed refresh',
    }],
    diagnosticSummary: { total: 1, returned: 1, hasMore: false },
  }
}

function sourceDependencies(root: string) {
  return {
    inspect: vi.fn(() => inspectSpecs({ cwd: root })),
    projectTree: projectSpecsTree,
    projectDetail: projectSpecsDetail,
    projectSearch: projectSpecsSearch,
  }
}

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map(path => rm(path, { recursive: true, force: true })))
})

describe.sequential('tUI Specs source', () => {
  it('projects tree, detail, and search from current tracked or untracked Specs content', async () => {
    const root = await createSpecsFixture()
    await writeFile(join(root, '.rsp', 'specs', 'design.md'), '# Design\n\nStable facts.\n')
    await writeFile(join(root, '.rsp', 'specs', 'decisions', 'transport.md'), '# Choose HTTP\n')
    const dependencies = sourceDependencies(root)
    const source = createTuiSpecsSource(dependencies)

    const tree = await source.tree()
    await writeFile(join(root, '.rsp', 'specs', 'design.md'), '# Design\n\n## Current\nUntrackedNeedle is visible.\n')
    const detail = await source.detail('.rsp/specs/design.md')
    const search = await source.search('untrackedneedle', { limit: 1, excerptCodePoints: 40 })

    expect(tree).toEqual(expect.objectContaining({
      mode: 'tree',
      documents: expect.arrayContaining([
        expect.objectContaining({ path: '.rsp/specs/design.md', kind: 'spec' }),
        expect.objectContaining({ path: '.rsp/specs/decisions/transport.md', kind: 'decision-record' }),
      ]),
    }))
    expect(detail).toEqual(expect.objectContaining({
      mode: 'detail',
      document: expect.objectContaining({ content: expect.stringContaining('UntrackedNeedle') }),
    }))
    expect(search).toEqual(expect.objectContaining({
      mode: 'search',
      query: { literal: 'untrackedneedle', limit: 1, excerptCodePoints: 40 },
      matches: [expect.objectContaining({ path: '.rsp/specs/design.md', heading: 'Current', line: 4 })],
    }))
    expect(dependencies.inspect).toHaveBeenCalledTimes(1)
  })

  it('inspects on demand for detail and search and applies the shared search defaults', async () => {
    const root = await createSpecsFixture()
    await writeFile(join(root, '.rsp', 'specs', 'design.md'), '# Design\n\nDefaultNeedle is visible.\n')
    const detailDependencies = sourceDependencies(root)
    const detailSource = createTuiSpecsSource(detailDependencies)

    await expect(detailSource.detail('.rsp/specs/design.md')).resolves.toEqual(expect.objectContaining({ mode: 'detail' }))
    expect(detailDependencies.inspect).toHaveBeenCalledTimes(1)

    const searchDependencies = sourceDependencies(root)
    const search = await createTuiSpecsSource(searchDependencies).search('defaultneedle')

    expect(search.query).toEqual({ literal: 'defaultneedle', limit: 20, excerptCodePoints: 240 })
    expect(searchDependencies.inspect).toHaveBeenCalledTimes(1)
  })

  it('preserves the prior complete inspection after a failed refresh', async () => {
    const root = await createSpecsFixture()
    await writeFile(join(root, '.rsp', 'specs', 'design.md'), '# Design\n\nCachedNeedle remains available.\n')
    const valid = await inspectSpecs({ cwd: root })
    const inspect = vi.fn()
      .mockResolvedValueOnce(valid)
      .mockResolvedValueOnce(incompleteInspection(valid))
    const source = createTuiSpecsSource({
      inspect,
      projectTree: projectSpecsTree,
      projectDetail: projectSpecsDetail,
      projectSearch: projectSpecsSearch,
    })

    await source.tree()
    await expect(source.tree()).rejects.toEqual(expect.objectContaining({ code: 'specs_inspection_incomplete' }))
    await expect(source.detail('.rsp/specs/design.md')).resolves.toEqual(expect.objectContaining({
      document: expect.objectContaining({ content: expect.stringContaining('CachedNeedle') }),
    }))
    await expect(source.search('cachedneedle')).resolves.toEqual(expect.objectContaining({
      matches: [expect.objectContaining({ path: '.rsp/specs/design.md' })],
    }))
    expect(inspect).toHaveBeenCalledTimes(2)
  })
})
