import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { test } from 'node:test'
import { ingest } from '../src/artifact.mjs'
test('trusted digest gates publication of external bytes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'artifact-'))
  const path = join(directory, 'current.bin')
  try {
    const bytes = Buffer.from('release payload')
    const digest = createHash('sha256').update(bytes).digest('hex')
    await writeFile(path, 'old')
    await assert.rejects(ingest(Buffer.from('tampered'), digest, path))
    assert.equal(await readFile(path, 'utf8'), 'old')
    assert.deepEqual(await ingest(bytes, digest, path), { digest, size: bytes.length })
    assert.deepEqual(await readFile(path), bytes)
  }
  finally { await rm(directory, { recursive: true, force: true }) }
})
