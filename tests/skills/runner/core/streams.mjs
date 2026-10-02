import { Buffer } from 'node:buffer'
import { closeSync, constants, fstatSync, openSync, readSync, rmSync, writeSync } from 'node:fs'
import { join } from 'node:path'
import { StringDecoder } from 'node:string_decoder'
import { hashFile } from './files.mjs'

// Keep line terminators and partial final lines; memory follows one record, not a run.
export function* fileLines(path) {
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK)
  try {
    const initial = fstatSync(fd)
    if (!initial.isFile())
      throw new Error('Evidence must be a regular file')
    const decoder = new StringDecoder('utf8')
    const buffer = Buffer.alloc(65536)
    let pending = []
    let remaining = initial.size
    while (remaining > 0) {
      const count = readSync(fd, buffer, 0, Math.min(buffer.length, remaining), null)
      if (!count)
        break
      remaining -= count
      const chunk = decoder.write(buffer.subarray(0, count))
      let start = 0
      for (let end = chunk.indexOf('\n'); end !== -1; end = chunk.indexOf('\n', start)) {
        pending.push(chunk.slice(start, end + 1))
        yield pending.join('')
        pending = []
        start = end + 1
      }
      if (start < chunk.length)
        pending.push(chunk.slice(start))
    }
    pending.push(decoder.end())
    const final = pending.join('')
    if (final)
      yield final
    if (remaining || fstatSync(fd).size !== initial.size)
      throw new Error('Evidence changed while reading')
  }
  finally { closeSync(fd) }
}

export function* textLines(text) {
  if (typeof text !== 'string') {
    yield* text ?? []
    return
  }
  let start = 0
  for (let end = text.indexOf('\n', start); end !== -1; end = text.indexOf('\n', start)) {
    yield text.slice(start, end + 1)
    start = end + 1
  }
  if (start < text.length)
    yield text.slice(start)
}

export function streamLines(result, name, directory) {
  const file = result?.[`${name}File`]
  if (file !== undefined) {
    const expected = name === 'stdout' ? 'events.jsonl' : 'stderr.log'
    if (!directory || file !== expected)
      throw new Error('Invalid retained stream reference')
    const path = join(directory, file)
    if (result.streamHashes?.[name] && hashFile(path) !== result.streamHashes[name])
      throw new Error('Retained stream identity mismatch')
    return fileLines(path)
  }
  return textLines(result?.[name] ?? '')
}

export function writeAll(fd, text) {
  const buffer = Buffer.from(text)
  let offset = 0
  while (offset < buffer.length) {
    const count = writeSync(fd, buffer, offset, buffer.length - offset)
    if (!count)
      throw new Error('Evidence write made no progress')
    offset += count
  }
}

export function writeLines(path, lines, transform = value => value) {
  const fd = openSync(path, 'w', 0o600)
  try {
    for (const line of lines)
      writeAll(fd, transform(line))
  }
  finally { closeSync(fd) }
}

// Binary exclusion is a text-evidence policy, not a size quota.
export function copyText(from, to, redact) {
  try {
    writeLines(to, fileLines(from), (line) => {
      if (line.includes('\0'))
        throw new Error('binary')
      return redact(line)
    })
    return true
  }
  catch (error) {
    rmSync(to, { force: true })
    if (error.message === 'binary')
      return false
    throw error
  }
}
