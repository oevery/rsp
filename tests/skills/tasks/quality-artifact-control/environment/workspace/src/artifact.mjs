import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
export async function ingest(bytes, expectedDigest, destination) {
  const digest = createHash('sha256').update(bytes).digest('hex')
  if (digest !== expectedDigest) throw new Error('artifact digest mismatch')
  await writeFile(destination, bytes)
  return { digest, size: bytes.length }
}
