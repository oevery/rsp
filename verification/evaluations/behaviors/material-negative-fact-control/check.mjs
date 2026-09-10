import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

async function check() {
  const { run } = await import(pathToFileURL(resolve('src/run.mjs')).href)
  assert.equal((await run(process.execPath, ['-e', 'process.stdout.write("ok")'])).trim(), 'ok')
  assert.notEqual(readFileSync('RELEASE.md', 'utf8').trim(), '# Release notes')
  // The explanation is semantic evidence, reviewed using case.yaml, not phrase matching.
}

check().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
