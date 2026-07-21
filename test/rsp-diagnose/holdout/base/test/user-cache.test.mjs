import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- isolated fixture runs with `node --test`
import test from 'node:test'
import { readUser, resetUsers } from '../src/user-cache.mjs'

test('returns the requested tenant user when ids overlap', async () => {
  resetUsers()
  const load = async tenantId => ({ name: tenantId })

  assert.deepEqual(await readUser('tenant-a', 'user-1', load), { name: 'tenant-a' })
  assert.deepEqual(await readUser('tenant-b', 'user-1', load), { name: 'tenant-b' })
})
