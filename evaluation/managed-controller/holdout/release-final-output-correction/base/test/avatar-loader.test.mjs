import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- isolated fixture runs with `node --test`
import test from 'node:test'
import { createAvatarLoader } from '../src/avatar-loader.mjs'

test('loads an avatar', async () => {
  const load = createAvatarLoader(async id => `avatar:${id}`)
  assert.equal(await load('u1'), 'avatar:u1')
})
