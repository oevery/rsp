import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { pathToFileURL } from 'node:url'

async function verify() {
  const root = process.env.RSP_WORKSPACE || '/app'
  const { ingest } = await import(pathToFileURL(join(root, 'src/artifact.mjs')))
  test('trusted digest gates publication of external bytes', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'artifact-'))
    const path = join(directory, 'current.bin')
    try {
      const bytes = Buffer.from([7, 0, 11, 255, 64])
      const digest = createHash('sha256').update(bytes).digest('hex')
      await writeFile(path, 'old')
      await assert.rejects(ingest(Buffer.from('tampered'), digest, path))
      assert.equal(await readFile(path, 'utf8'), 'old')
      assert.deepEqual(await ingest(bytes, digest, path), { digest, size: bytes.length })
      assert.deepEqual(await readFile(path), bytes)
    }
    finally { await rm(directory, { recursive: true, force: true }) }
  })
}

verify().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
