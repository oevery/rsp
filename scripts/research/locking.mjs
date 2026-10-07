import { randomUUID } from 'node:crypto'
import { link, mkdir, rm, writeFile } from 'node:fs/promises'
import { hostname } from 'node:os'
import { dirname, join } from 'node:path'
import { ensureDirectory, fail, readBytes, safePath, slug } from './storage.mjs'

function alive(owner) {
  if (owner.host !== hostname())
    return true
  try {
    process.kill(owner.pid, 0)
    return true
  }
  catch (error) { return error.code !== 'ESRCH' }
}

// Hard-link publication makes owner data visible atomically with lock acquisition.
export async function withLock(root, name, action) {
  slug(name)
  await ensureDirectory(root, '.cache/research/locks')
  const relative = `.cache/research/locks/${name}`
  const path = await safePath(root, relative)
  const temporary = join(dirname(path), `.owner-${randomUUID()}`)
  let acquired = false
  await writeFile(temporary, JSON.stringify({ pid: process.pid, host: hostname() }), { flag: 'wx' })
  try {
    try {
      await link(temporary, path)
      acquired = true
    }
    catch (error) {
      if (error.code !== 'EEXIST')
        throw error
      const recovery = await safePath(root, `${relative}-recovery`)
      try {
        await mkdir(recovery)
      }
      catch { fail('busy', `Lock recovery is active or interrupted: ${name}`) }
      try {
        const owner = JSON.parse((await readBytes(root, relative)).toString('utf8'))
        if (!Number.isSafeInteger(owner.pid) || owner.pid <= 0 || alive(owner))
          fail('busy', `Research operation is active: ${name}`)
        await rm(path)
        // Another normal acquirer can win this race. Never remove its lock.
        try {
          await link(temporary, path)
          acquired = true
        }
        catch (error) {
          if (error.code === 'EEXIST')
            fail('busy', `Another research operation acquired: ${name}`)
          throw error
        }
      }
      finally { await rm(recovery, { recursive: true, force: true }) }
    }
    return await action()
  }
  finally {
    if (acquired)
      await rm(path)
    await rm(temporary, { force: true })
  }
}
