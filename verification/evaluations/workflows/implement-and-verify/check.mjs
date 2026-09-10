import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

async function check() {
  const { renderStatusCard } = await import(pathToFileURL(resolve('src/status-card.mjs')).href)
  assert.equal(renderStatusCard('Ready'), 'Status: Ready')
  for (const file of ['.rsp/specs/status-presentation.md', 'docs/en/status.md', 'docs/zh-CN/status.md']) {
    // This label is a product requirement, not an agent narration template.
    assert.ok(readFileSync(file, 'utf8').includes('Status: Ready'), file)
  }
}

check().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
