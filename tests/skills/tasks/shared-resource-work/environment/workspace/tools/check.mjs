import { mkdir, rm, writeFile, readFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import assert from 'node:assert/strict'

const mode = process.argv[2]
assert.ok(['csv', 'window'].includes(mode), 'Expected csv or window mode')
await mkdir('.cache', { recursive: true })
const lease = '.cache/acceptance-fixture'
try {
  await mkdir(lease)
} catch (error) {
  if (error.code !== 'EEXIST') throw error
  console.error('Shared acceptance fixture already in use; concurrent checks are unsafe.')
  process.exit(73)
}
try {
  await writeFile(`${lease}/owner`, mode)
  console.log(`Fixture acquired: ${mode}`)
  // Model asynchronous fixture startup and teardown within one exclusive lease.
  await delay(150)
  await import(`./check-${mode}.mjs`)
  assert.equal(await readFile(`${lease}/owner`, 'utf8'), mode, 'Fixture was contaminated')
  await delay(150)
} finally {
  await rm(lease, { recursive: true })
}
console.log(`Fixture released: ${mode}`)
