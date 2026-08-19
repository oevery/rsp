import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
// eslint-disable-next-line test/no-import-node-test -- isolated fixture runs with `node --test`
import test from 'node:test'

test('keeps the authoritative Spec and paired guidance on the canonical label', () => {
  for (const path of [
    '.rsp/specs/status-presentation.md',
    'docs/en/status.md',
    'docs/zh-CN/status.md',
  ]) {
    assert.match(readFileSync(path, 'utf8'), /`Status: Ready`/)
  }
})
