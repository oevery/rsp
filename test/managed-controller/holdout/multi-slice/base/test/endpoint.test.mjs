import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- isolated fixture runs with `node --test`
import test from 'node:test'
import { formatEndpoint, parseEndpoint } from '../src/endpoint.mjs'

test('parses a normalized endpoint', () => {
  assert.deepEqual(parseEndpoint('API.EXAMPLE:443'), { host: 'api.example', port: 443 })
})

test('rejects an invalid port', () => {
  assert.throws(() => parseEndpoint('api.example:0'), /port/i)
})

test('formats a normalized endpoint', () => {
  assert.equal(formatEndpoint({ host: 'API.EXAMPLE', port: 443 }), 'api.example:443')
})
