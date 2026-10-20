import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
const git = (repository, args) => execFileSync('git', ['-C', repository, ...args])
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
export async function capture(repository, revision, paths, destination) {
  const files = []
  for (const path of paths) {
    const bytes = git(repository, ['show', revision + ':' + path])
    await mkdir(dirname(join(destination, path)), { recursive: true })
    await writeFile(join(destination, path), bytes)
    files.push({ path, size: bytes.length, digest: hash(bytes) })
  }
  const entry = { repository, revision, paths: [...paths], files, identity: hash(JSON.stringify(files)) }
  await writeFile(join(destination, 'capture-proof.json'), JSON.stringify(entry))
  return entry
}
export function changedPaths(repository, before, after) {
  return git(repository, ['diff', '--name-only', '-z', before, after]).toString().split('\0').filter(Boolean)
}
