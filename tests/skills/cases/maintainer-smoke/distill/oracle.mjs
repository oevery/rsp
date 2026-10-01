import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export { check, verify } from '../../document-quality/write/oracle.mjs'

export async function readiness({ workspace }) {
  const provenance = JSON.parse(readFileSync(join(workspace, 'sources/provenance.json'), 'utf8'))
  const bytes = readFileSync(join(workspace, provenance.excerpt.path))
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  return {
    status: sha256 === provenance.excerpt.sha256 && bytes.length === provenance.excerpt.bytes && bytes.length < 65536 ? 'passed' : 'failed',
    excerptSha256: sha256,
    excerptBytes: bytes.length,
    scope: 'retained-excerpt-identity; not source freshness or behavioral acceptance',
  }
}
