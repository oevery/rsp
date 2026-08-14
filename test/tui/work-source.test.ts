import type { Buffer } from 'node:buffer'
import type { FileHandle } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { mkdir, open, rename, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTuiWorkSource, WorkDocumentError } from '../../src/tui/work-source.js'

const roots: string[] = []

async function fixture() {
  const root = join(tmpdir(), `rsp-tui-work-${randomUUID()}`)
  roots.push(root)
  await mkdir(join(root, '.rsp', 'changes', 'delivery'), { recursive: true })
  await writeFile(join(root, '.rsp', 'changes', 'alpha.md'), '# Change: alpha\n')
  await writeFile(join(root, '.rsp', 'changes', 'delivery', '00-brief.md'), '# Change Group: delivery\n')
  return root
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

describe('tUI Work document source', () => {
  it('reads only exact bounded Change and Group Brief paths', async () => {
    const root = await fixture()
    const source = createTuiWorkSource({ changesDir: join(root, '.rsp', 'changes'), maxFileBytes: 64 })

    await expect(source.document(join(root, '.rsp', 'changes', 'alpha.md'))).resolves.toEqual({
      path: '.rsp/changes/alpha.md',
      content: '# Change: alpha\n',
    })
    await expect(source.document(join(root, '.rsp', 'changes', 'delivery', '00-brief.md'))).resolves.toEqual({
      path: '.rsp/changes/delivery/00-brief.md',
      content: '# Change Group: delivery\n',
    })
    await expect(source.document(join(root, '.rsp', 'changes', 'missing.md'))).rejects.toBeInstanceOf(WorkDocumentError)
  })

  it('rejects symlinks, oversized files, and replacement during the bounded read', async () => {
    const root = await fixture()
    const changesDir = join(root, '.rsp', 'changes')
    const source = createTuiWorkSource({ changesDir, maxFileBytes: 64 })
    const external = join(root, 'external.md')
    await writeFile(external, '# External\n')
    await symlink(external, join(changesDir, 'linked.md'))
    await expect(source.document(join(changesDir, 'linked.md'))).rejects.toEqual(expect.objectContaining({ code: 'work_document_unsafe' }))

    await writeFile(join(changesDir, 'large.md'), 'x'.repeat(65))
    await expect(source.document(join(changesDir, 'large.md'))).rejects.toEqual(expect.objectContaining({ code: 'work_document_too_large' }))

    const target = join(changesDir, 'alpha.md')
    const replacement = join(root, 'replacement.md')
    await writeFile(replacement, '# Replacement\n')
    const probe = await open(target, 'r')
    const prototype = Object.getPrototypeOf(probe) as { read: FileHandle['read'] }
    await probe.close()
    const originalRead = prototype.read
    let replaced = false
    const spy = vi.spyOn(prototype, 'read').mockImplementation((async function (
      this: FileHandle,
      buffer: Buffer,
      offset: number,
      length: number,
      position: number,
    ) {
      const result = await Reflect.apply(originalRead, this, [buffer, offset, length, position])
      if (!replaced && result.bytesRead > 0) {
        replaced = true
        await rename(replacement, target)
      }
      return result
    }) as FileHandle['read'])
    try {
      await expect(source.document(target)).rejects.toEqual(expect.objectContaining({ code: 'work_document_changed' }))
      expect(replaced).toBe(true)
    }
    finally {
      spy.mockRestore()
    }
  })
})
