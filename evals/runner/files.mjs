import { Buffer } from 'node:buffer'
import { createHash, randomUUID } from 'node:crypto'
import { lstatSync, readdirSync, readFileSync, readlinkSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export function hash(value) {
  return createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex')
}

// Never follow fixture or installed-Skill symlinks into the host filesystem.
export function treeFiles(directory, { rejectLinks = false, excludeGit = false } = {}) {
  const files = Object.create(null)
  let totalBytes = 0
  let entries = 0
  function visit(current, prefix = '') {
    for (const name of readdirSync(current).sort()) {
      if (name === '.git' && excludeGit && !prefix)
        continue
      const path = join(current, name)
      const key = prefix + name
      const stat = lstatSync(path)
      entries++
      totalBytes += stat.isFile() ? stat.size : 0
      if (entries > 10000 || totalBytes > 64 * 1024 * 1024)
        throw new Error('Evaluation snapshot exceeds the file or byte budget')
      if (stat.isSymbolicLink()) {
        if (rejectLinks)
          throw new Error('Evaluation inputs must not contain symlinks')
        files[key] = hash(`link:${readlinkSync(path)}`)
      }
      else if (stat.isDirectory()) {
        visit(path, `${key}/`)
      }
      else if (stat.isFile()) {
        files[key] = hash(Buffer.concat([Buffer.from(`${stat.mode & 0o111}:`), readFileSync(path)]))
      }
      else {
        throw new Error('Unsupported evaluation input file')
      }
    }
  }
  if (lstatSync(directory).isSymbolicLink())
    throw new Error('Evaluation input root must not be a symlink')
  visit(directory)
  return files
}

export function writeJson(path, value) {
  const temporary = `${path}.${randomUUID()}.tmp`
  try {
    writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 })
    renameSync(temporary, path)
  }
  finally {
    rmSync(temporary, { force: true })
  }
}
