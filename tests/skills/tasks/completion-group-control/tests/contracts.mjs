import assert from 'node:assert/strict'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

async function main() {
  const { createCache } = await import(pathToFileURL(path.join(process.env.RSP_WORKSPACE || '/app', 'src/cache.mjs')))
  const complete = true
  let now = 100
  const cache = createCache(() => now)
  cache.set('item', 'value', 10)
  now = 110
  assert.equal(cache.get('item'), complete ? undefined : 'value')
  cache.set('zero', 'immediate', 0)
  assert.equal(cache.get('zero'), complete ? undefined : 'immediate')
  now = 111
  assert.equal(cache.get('item'), undefined)
  assert.equal(cache.get('zero'), undefined)
  now = 100
  assert.equal(cache.get('item'), undefined)
  cache.set('stable', 'old', 10)
  assert.throws(() => cache.set('stable', 'new', -1), RangeError)
  assert.throws(() => cache.set('stable', 'new', 0.5), RangeError)
  assert.equal(cache.get('stable'), 'old')
  assert.equal(createCache(() => now).get('stable'), undefined)
  console.log('Completion fixture behavior verified')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
