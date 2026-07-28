import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { inspectArchiveTree, inspectFocusTree, inspectWorkTree, isCanonicalExecutableWorkRef, normalizeExecutableWorkRef, resolveArchiveDirectory, resolveFocusMarkerPath, resolveWorkRef, resolveWorkRefPath, WorkRefError } from '../src/core/work-ref.js'

const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

describe('work ref resolution', () => {
  it('normalizes safe Unicode command input and preserves Chinese identities', () => {
    const changesDir = createChangesDirPath()
    createGroupBrief(changesDir, '听说训练')

    expect(resolveWorkRef('听说训练/模拟朗读', { changesDir })).toMatchObject({
      kind: 'group-change',
      name: '听说训练/模拟朗读',
      path: join(changesDir, '听说训练', '模拟朗读.md'),
      group: '听说训练',
    })
    expect(normalizeExecutableWorkRef('cafe\u0301/验证')).toBe('café/验证')
    expect(isCanonicalExecutableWorkRef('café/验证')).toBe(true)
    expect(isCanonicalExecutableWorkRef('cafe\u0301/验证')).toBe(false)
  })

  it('rejects unsafe Unicode identity boundaries', () => {
    const changesDir = createChangesDirPath()

    for (const name of ['ASCII-Upper', 'Éclair', '带 空格', '前-', '-后', '含.点', '越界\\路径'])
      expectWorkRefError(() => resolveWorkRef(name, { changesDir }), 'invalid_work_ref')
    expectWorkRefError(() => resolveWorkRef('组/00-brief', { changesDir }), 'invalid_work_ref')
  })

  it('classifies each supported work identity explicitly', () => {
    const changesDir = createChangesDirPath()
    createGroupBrief(changesDir, 'release')

    expect(resolveWorkRef('login', { changesDir })).toEqual({
      kind: 'change',
      name: 'login',
      path: join(changesDir, 'login.md'),
      group: null,
    })
    expect(resolveWorkRef('release/api', { changesDir })).toEqual({
      kind: 'group-change',
      name: 'release/api',
      path: join(changesDir, 'release', 'api.md'),
      group: 'release',
    })
    expect(resolveWorkRef('release/brief', { changesDir })).toEqual({
      kind: 'group-brief',
      name: 'release/brief',
      path: join(changesDir, 'release', '00-brief.md'),
      group: 'release',
    })
    expect(resolveWorkRefPath(join(changesDir, 'release', '00-brief.md'), { changesDir })).toEqual({
      kind: 'group-brief',
      name: 'release/brief',
      path: join(changesDir, 'release', '00-brief.md'),
      group: 'release',
    })
  })

  it('resolves a supported Markdown path through the same model', () => {
    const changesDir = createChangesDirPath()
    createGroupBrief(changesDir, 'release')

    expect(resolveWorkRefPath(join(changesDir, 'release', 'api.md'), { changesDir })).toMatchObject({
      kind: 'group-change',
      name: 'release/api',
      group: 'release',
    })
  })

  it('rejects Group Briefs at executable Change seams', () => {
    const changesDir = createChangesDirPath()

    expectWorkRefError(
      () => resolveWorkRef('release/brief', { changesDir, executable: true }),
      'non_executable_work_ref',
    )
  })

  it('rejects the physical Group Brief filename as a logical child identity', () => {
    const changesDir = createChangesDirPath()
    createGroupBrief(changesDir, 'release')

    expectWorkRefError(
      () => resolveWorkRef('release/00-brief', { changesDir }),
      'invalid_work_ref',
    )
  })

  it('reports the unreleased legacy physical Brief path instead of aliasing it', async () => {
    const changesDir = createChangesDirPath()
    await mkdir(join(changesDir, 'release'), { recursive: true })
    await writeFile(join(changesDir, 'release', 'brief.md'), '')

    const inspection = await inspectWorkTree({ changesDir })

    expect(inspection.briefs).toEqual([])
    expect(inspection.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'group_brief_missing', input: 'release' }),
      expect.objectContaining({ code: 'invalid_work_ref_path', input: 'release/brief.md' }),
    ]))
  })

  it('rejects unsupported recursive work paths deterministically', () => {
    const changesDir = createChangesDirPath()

    expectWorkRefError(
      () => resolveWorkRef('release/backend/api', { changesDir }),
      'unsupported_work_depth',
    )
    expectWorkRefError(
      () => resolveWorkRefPath(join(changesDir, 'release', 'backend', 'api.md'), { changesDir }),
      'unsupported_work_depth',
    )
  })

  it('rejects a file and directory that claim the same work identity', async () => {
    const changesDir = createChangesDirPath()
    await mkdir(join(changesDir, 'release'), { recursive: true })
    await writeFile(join(changesDir, 'release.md'), '')

    expectWorkRefError(
      () => resolveWorkRef('release/api', { changesDir }),
      'work_ref_collision',
    )

    await writeFile(join(changesDir, 'release', 'api.md'), '')
    const inspection = await inspectWorkTree({ changesDir })
    expect(inspection.diagnostics.filter(item => item.code === 'work_ref_collision')).toEqual([
      expect.objectContaining({ input: 'release' }),
    ])
  })

  it('rejects a changes root that is not a real directory', async () => {
    const changesDir = createChangesDirPath()
    await rm(changesDir, { recursive: true })
    await writeFile(changesDir, 'not a directory')

    expectWorkRefError(
      () => resolveWorkRef('release', { changesDir }),
      'invalid_work_root',
    )
    await expect(inspectWorkTree({ changesDir })).resolves.toMatchObject({
      changes: [],
      diagnostics: [expect.objectContaining({ code: 'invalid_work_root', path: changesDir })],
    })
  })

  it('does not follow a symlinked changes root', async () => {
    const changesDir = createChangesDirPath()
    const externalDir = join(changesDir, '..', '..', 'external')
    await mkdir(externalDir, { recursive: true })
    await writeFile(join(externalDir, 'external.md'), '')
    await rm(changesDir, { recursive: true })
    await symlink(externalDir, changesDir)

    expectWorkRefError(
      () => resolveWorkRef('external', { changesDir }),
      'invalid_work_root',
    )
    const inspection = await inspectWorkTree({ changesDir })
    expect(inspection.changes).toEqual([])
    expect(inspection.diagnostics).toEqual([
      expect.objectContaining({ code: 'invalid_work_root', path: changesDir }),
    ])
  })

  it('rejects a grouped prefix that is not a real directory', async () => {
    const changesDir = createChangesDirPath()
    await mkdir(changesDir, { recursive: true })
    await writeFile(join(changesDir, 'release'), 'not a directory')

    expectWorkRefError(
      () => resolveWorkRef('release/api', { changesDir }),
      'invalid_work_ref_path',
    )
  })

  it('rejects managed focus and archive symlink prefixes', async () => {
    const changesDir = createChangesDirPath()
    createGroupBrief(changesDir, 'release')
    const root = join(changesDir, '..', '..')
    const focusDir = join(root, '.rsp', 'focus.d')
    const archivesDir = join(root, '.rsp', 'archives')
    const externalDir = join(root, 'external')
    await mkdir(focusDir, { recursive: true })
    await mkdir(externalDir, { recursive: true })
    await symlink(externalDir, join(focusDir, 'release'))
    await symlink(externalDir, archivesDir)
    const ref = resolveWorkRef('release/api', { changesDir, executable: true })

    expectWorkRefError(
      () => resolveFocusMarkerPath(ref, { focusDir }),
      'invalid_focus_path',
    )
    expectWorkRefError(
      () => resolveArchiveDirectory(ref, { archivesDir }),
      'invalid_archive_root',
    )
  })

  it('can require the resolved work file to exist', () => {
    const changesDir = createChangesDirPath()

    expectWorkRefError(
      () => resolveWorkRef('missing', { changesDir, mustExist: true }),
      'work_ref_not_found',
    )
  })

  it('rejects an existing target that is not a regular file', async () => {
    const changesDir = createChangesDirPath()
    await mkdir(join(changesDir, 'not-a-file.md'), { recursive: true })

    expectWorkRefError(
      () => resolveWorkRef('not-a-file', { changesDir, mustExist: true }),
      'work_ref_not_file',
    )
  })

  it('inspects supported refs and all unsupported tree entries together', async () => {
    const changesDir = createChangesDirPath()
    await mkdir(join(changesDir, 'release', 'backend'), { recursive: true })
    await writeFile(join(changesDir, '.gitkeep'), '')
    await writeFile(join(changesDir, 'flat.md'), '')
    await writeFile(join(changesDir, 'release', 'api.md'), '')
    await writeFile(join(changesDir, 'release', '00-brief.md'), '')
    await writeFile(join(changesDir, 'release', 'notes.txt'), '')

    const inspection = await inspectWorkTree({ changesDir })

    expect(inspection.changes.map(ref => ref.name)).toEqual(['flat', 'release/api'])
    expect(inspection.briefs.map(ref => ref.name)).toEqual(['release/brief'])
    expect(inspection.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'unsupported_work_depth', input: 'release/backend' }),
      expect.objectContaining({ code: 'invalid_work_ref_path', input: 'release/notes.txt' }),
    ]))
  })

  it('fails closed on non-NFC stored work, focus, and archive identities', async () => {
    const changesDir = createChangesDirPath()
    const root = join(changesDir, '..', '..')
    const nonCanonical = 'cafe\u0301'
    await writeFile(join(changesDir, `${nonCanonical}.md`), '')
    await mkdir(join(root, '.rsp', 'focus.d'), { recursive: true })
    await writeFile(join(root, '.rsp', 'focus.d', nonCanonical), '')
    await mkdir(join(root, '.rsp', 'archives', nonCanonical), { recursive: true })

    await expect(inspectWorkTree({ changesDir })).resolves.toMatchObject({
      diagnostics: [expect.objectContaining({ code: 'invalid_work_ref', input: nonCanonical })],
    })
    await expect(inspectFocusTree({ changesDir, focusDir: join(root, '.rsp', 'focus.d') })).resolves.toMatchObject({
      diagnostics: [expect.objectContaining({ code: 'invalid_work_ref', input: nonCanonical })],
    })
    await expect(inspectArchiveTree({ archivesDir: join(root, '.rsp', 'archives') })).resolves.toMatchObject({
      diagnostics: [expect.objectContaining({ code: 'invalid_archive_path', input: nonCanonical })],
    })
    expectWorkRefError(() => resolveWorkRef('café', { changesDir }), 'work_ref_collision')
  })
})

function createChangesDirPath(): string {
  const root = join(tmpdir(), `rsp-work-ref-${randomUUID()}`)
  roots.push(root)
  const changesDir = join(root, '.rsp', 'changes')
  mkdirSync(changesDir, { recursive: true })
  return changesDir
}

function createGroupBrief(changesDir: string, group: string): void {
  const groupDir = join(changesDir, group)
  mkdirSync(groupDir, { recursive: true })
  writeFileSync(join(groupDir, '00-brief.md'), `---\nkind: group\n---\n\n# Change Group: ${group}\n`)
}

function expectWorkRefError(action: () => unknown, code: string): void {
  try {
    action()
    throw new Error(`Expected WorkRefError with code ${code}`)
  }
  catch (error) {
    expect(error).toBeInstanceOf(WorkRefError)
    expect((error as WorkRefError).code).toBe(code)
  }
}
