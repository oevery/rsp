import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

async function check() {
  const { normalizeLabel } = await import(pathToFileURL(resolve('src/normalize.mjs')).href)
  assert.equal(normalizeLabel('  Hello   WORLD  '), 'hello world')
  assert.equal(normalizeLabel('\tA\nB\t'), 'a b')
  assert.equal(readFileSync('unrelated.txt', 'utf8'), 'preserve me\n')
}

check().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
