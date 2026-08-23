import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- isolated fixture runs with `node --test`
import test from 'node:test'
import { run } from '../src/run.mjs'

test('runs an executable with explicit arguments', async () => {
  assert.equal((await run(process.execPath, ['--version'])).startsWith('v'), true)
})
