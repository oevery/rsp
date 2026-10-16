import assert from 'node:assert/strict'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

async function main() {
  const { visibleRecords } = await import(pathToFileURL(join(process.env.RSP_WORKSPACE || '/app', 'src/expiry.mjs')))
  const records = Object.freeze([
    Object.freeze({ tenant: 'A', expiresAt: 100, payload: 'expired' }),
    Object.freeze({ tenant: 'B', expiresAt: 101, payload: 'future' }),
    Object.freeze({ tenant: 'A', expiresAt: null, payload: 'perpetual' }),
    Object.freeze({ tenant: 'C', payload: 'absent' }),
  ])
  assert.deepEqual(visibleRecords(records, 100), [records[1], records[2], records[3]])
  const visible = visibleRecords(records, 100)
  for (const [index, original] of [records[1], records[2], records[3]].entries())
    assert.equal(visible[index], original)
  assert.deepEqual(visibleRecords([{ expiresAt: 0 }], 0), [])
  assert.deepEqual(visibleRecords([{ expiresAt: -1 }], -1), [])
  assert.deepEqual(visibleRecords([], 100), [])
  assert.equal(records.length, 4)
  console.log('Expiry boundary and preservation checks passed.')
  for (const now of [-50, 0, 42, 999]) {
    const a = Object.freeze({ expiresAt: now - 1 })
    const b = Object.freeze({ expiresAt: now })
    const c = Object.freeze({ expiresAt: now + 1 })
    assert.deepEqual(visibleRecords(Object.freeze([a, b, c]), now), [c])
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
