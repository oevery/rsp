import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- fixture executes with node --test in an isolated package
import { test } from 'node:test'

// @ts-expect-error -- isolated Node fixture intentionally imports its TypeScript source by extension
import { clearCache, getCachedValue, putCachedValue } from '../src/cache.ts'

test('stores and reads one cached value', () => {
  clearCache()
  putCachedValue('class-a', 'reading', 'a')
  assert.equal(getCachedValue('class-a', 'reading'), 'a')
})
