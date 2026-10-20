import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { test } from 'node:test'
import { capture } from '../src/capture.mjs'
import { repository } from './repository.mjs'
test('capture reads the requested historical revision', async () => {
  const source = await repository()
  const destination = await mkdtemp(join(tmpdir(), 'capture-output-'))
  try {
    await capture(source.directory, source.before, ['notes.txt'], destination)
    assert.equal(await readFile(join(destination, 'notes.txt'), 'utf8'), 'before\n')
  }
  finally {
    await rm(source.directory, { recursive: true, force: true })
    await rm(destination, { recursive: true, force: true })
  }
})
