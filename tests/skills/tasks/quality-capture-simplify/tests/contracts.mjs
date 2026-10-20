import assert from 'node:assert/strict'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { repository } from './repository.mjs'

async function verify() {
  const root = process.env.RSP_WORKSPACE || '/app'
  const { capture, changedPaths } = await import(pathToFileURL(join(root, 'src/capture.mjs')))
  const source = await repository()
  const directory = await mkdtemp(join(tmpdir(), 'capture-contract-'))
  try {
    const paths = Object.freeze(['notes.txt'])
    assert.deepEqual(await capture(source.directory, source.before, paths, directory), {
      repository: source.directory,
      revision: source.before,
      paths: ['notes.txt'],
    })
    assert.equal(await readFile(join(directory, 'notes.txt'), 'utf8'), 'before\n')
    assert.deepEqual(await readdir(directory), ['notes.txt'])
    assert.deepEqual(
      changedPaths(source.directory, source.before, source.after).sort(),
      ['notes.txt', 'other.txt', '说明.txt', ' spaced name.txt ', 'line\nbreak.txt'].sort(),
    )
    assert.deepEqual(changedPaths(source.directory, source.after, source.after), [])
    assert.deepEqual(paths, ['notes.txt'])
  }
  finally {
    await rm(source.directory, { recursive: true, force: true })
    await rm(directory, { recursive: true, force: true })
  }
  console.log('Historical capture, recovery record and Git comparison passed')
}

verify().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
