import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

async function check() {
  const { formatName } = await import(pathToFileURL(resolve('src/name.mjs')).href)
  for (const [input, expected] of [['  Ada   Lovelace  ', 'Ada Lovelace'], ['\tGrace\nHopper ', 'Grace Hopper']]) {
    assert.equal(formatName(input), expected)
  }
  assert.equal(formatName(''), '')
  assert.equal(readFileSync('user-notes.txt', 'utf8'), 'User-owned notes: keep the original wording.\n')
}

check().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
