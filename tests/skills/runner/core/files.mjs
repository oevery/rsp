import { Buffer } from 'node:buffer'
import { createHash, randomUUID } from 'node:crypto'
import { closeSync, constants, fstatSync, lstatSync, openSync, readdirSync, readlinkSync, readSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export function hash(value) {
  return createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex')
}

// Fixed-size I/O buffers are not file-size limits.
export function hashFile(path, prefix = '') {
  const digest = createHash('sha256').update(prefix)
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK)
  try {
    if (!fstatSync(fd).isFile())
      throw new Error('Expected a regular file')
    const buffer = Buffer.alloc(65536)
    for (let count = readSync(fd, buffer, 0, buffer.length, null); count > 0; count = readSync(fd, buffer, 0, buffer.length, null))
      digest.update(buffer.subarray(0, count))
    return digest.digest('hex')
  }
  finally { closeSync(fd) }
}

// Never follow fixture or installed-Skill symlinks into the host filesystem.
export function treeFiles(directory, { rejectLinks = false, excludeGit = false } = {}) {
  const files = Object.create(null)
  function visit(current, prefix = '') {
    for (const name of readdirSync(current).sort()) {
      if (name === '.git' && excludeGit && !prefix)
        continue
      const path = join(current, name)
      const key = prefix + name
      const stat = lstatSync(path)
      if (stat.isSymbolicLink()) {
        if (rejectLinks)
          throw new Error('Evaluation inputs must not contain symlinks')
        files[key] = hash(`link:${readlinkSync(path)}`)
      }
      else if (stat.isDirectory()) {
        visit(path, `${key}/`)
      }
      else if (stat.isFile()) {
        files[key] = hashFile(path, `${stat.mode & 0o111}:`)
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
