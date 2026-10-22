import { constants } from 'node:fs'
import { access, chmod, link, mkdtemp, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { requireManagedFile } from './managed-path.js'

/** Prepare one text file before publishing it. No backups or multi-file rollback. */
export async function updateSetupFile(path: string, render: (current: string | null) => string): Promise<boolean> {
  const exists = requireManagedFile(path, 'setup file', { allowMissing: true })
  const current = exists ? await readFile(path, 'utf8') : null
  const next = render(current)
  if (next === current)
    return false
  if (exists)
    await access(path, constants.W_OK)
  const temporary = await mkdtemp(join(dirname(path), '.rsp-write-'))
  const prepared = join(temporary, 'next')
  let failure: Error | undefined
  try {
    await writeFile(prepared, next, { flag: 'wx' })
    if (exists)
      await chmod(prepared, (await stat(path)).mode & 0o777)
    const stillExists = requireManagedFile(path, 'setup file', { allowMissing: true })
    if (stillExists !== exists || (stillExists && await readFile(path, 'utf8') !== current))
      throw new Error(`Setup file changed during update: ${path}`)
    if (exists)
      await rename(prepared, path)
    else
      await link(prepared, path)
  }
  catch (error) {
    failure = error instanceof Error ? error : new Error(String(error))
  }
  try {
    await rm(temporary, { recursive: true })
  }
  catch (error) {
    failure = new Error(`Temporary content cleanup failed: ${temporary}`, { cause: failure ?? error })
  }
  if (failure)
    throw failure
  return true
}
