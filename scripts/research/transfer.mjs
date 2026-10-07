import { lstat, rm } from 'node:fs/promises'
import { capturePath, captureRef, evidenceMetadata, readIndex } from './catalog.mjs'
import { retain } from './evidence.mjs'
import { withLock } from './locking.mjs'
import { captureSource, syncSource } from './sources.mjs'
import { exists, fail, inventory, safePath } from './storage.mjs'

export async function recoverCapture(root, id) {
  const { capture } = await evidenceMetadata(root, id)
  const { source, revision, git } = captureRef(id)
  if (!git)
    fail('unavailable', 'Restore imported historical material from your retained copy or archive')
  // Fetch the recorded commit itself, not the current registry branch.
  const config = { repository: capture.repository, ref: revision, paths: capture.paths }
  await syncSource(root, source, config)
  return retain(root, await captureSource(root, source, { source: config, revision }))
}

export async function cleanCaptures(root, ids, apply = false) {
  if (!ids.length)
    fail('invalid', 'clean requires explicit capture IDs; use list to choose')
  return withLock(root, 'index', async () => {
    const index = await readIndex(root)
    const candidates = []
    for (const id of new Set(ids)) {
      const record = index.captures[id]
      if (!record)
        fail('invalid', `Unknown capture: ${id}`)
      const path = capturePath(id, record)
      const present = await exists(await safePath(root, path))
      let bytes = 0
      if (present) {
        for (const file of await inventory(root, path))
          bytes += (await lstat(await safePath(root, `${path}/${file}`))).size
      }
      candidates.push({ id, path, local: present ? 'present' : 'missing', bytes })
    }
    if (apply) {
      for (const item of candidates)
        await rm(await safePath(root, item.path), { recursive: true, force: true })
    }
    return { applied: apply, candidates, indexRetained: true }
  })
}
