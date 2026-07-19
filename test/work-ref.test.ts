import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { inspectWorkTree, resolveArchiveDirectory, resolveFocusMarkerPath, resolveWorkRef, resolveWorkRefPath, WorkRefError } from '../src/core/work-ref.js'

const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

describe('work ref resolution', () => {
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
      path: join(changesDir, 'release', 'brief.md'),
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
    await writeFile(join(changesDir, 'release', 'brief.md'), '')
    await writeFile(join(changesDir, 'release', 'notes.txt'), '')

    const inspection = await inspectWorkTree({ changesDir })

    expect(inspection.changes.map(ref => ref.name)).toEqual(['flat', 'release/api'])
    expect(inspection.briefs.map(ref => ref.name)).toEqual(['release/brief'])
    expect(inspection.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'unsupported_work_depth', input: 'release/backend' }),
      expect.objectContaining({ code: 'invalid_work_ref_path', input: 'release/notes.txt' }),
    ]))
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
  writeFileSync(join(groupDir, 'brief.md'), `---\nkind: group\n---\n\n# Change Group: ${group}\n`)
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
