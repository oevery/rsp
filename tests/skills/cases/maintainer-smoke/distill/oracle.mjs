import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { verifyEvidence } from '../../../../../scripts/research/evidence.mjs'
import { parseStudy } from '../../../../../scripts/research/studies.mjs'
import { hashFile } from '../../../runner/core/files.mjs'
import { verify as verifyDocument } from '../../document-quality/write/oracle.mjs'

export { check } from '../../document-quality/write/oracle.mjs'

const projects = fileURLToPath(new URL('../../../projects/', import.meta.url))

export async function verify(input) {
  const document = await verifyDocument(input)
  const { case: spec, observation } = input
  const studies = spec.expected.documents.map((path) => {
    try {
      // verify receives retained observations, not the disposable workspace.
      // Bind the fixed fixture to the recorded baseline before comparing refs.
      const originalPath = join(projects, spec.project, path)
      if (hashFile(originalPath, '0:') !== observation.baseline?.[path])
        throw new Error('Study fixture differs from the recorded baseline')
      const original = parseStudy(readFileSync(originalPath), { requireBody: false })
      const current = parseStudy(Buffer.from(observation.artifacts?.[path] ?? ''))
      const missingEvidence = original.metadata.evidence.filter(id => !current.metadata.evidence.includes(id))
      const addedEvidence = current.metadata.evidence.filter(id => !original.metadata.evidence.includes(id))
      return { path, status: missingEvidence.length || addedEvidence.length ? 'failed' : 'passed', missingEvidence, addedEvidence }
    }
    catch (error) {
      return { path, status: 'failed', error: error.message }
    }
  })
  return {
    status: document.status === 'passed' && studies.every(item => item.status === 'passed') ? 'passed' : 'failed',
    evidence: { ...document.evidence, studies },
  }
}

export async function readiness({ workspace, case: spec }) {
  const provenance = JSON.parse(readFileSync(join(workspace, 'sources/provenance.json'), 'utf8'))
  const bytes = readFileSync(join(workspace, provenance.excerpt.path))
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  const { metadata } = parseStudy(readFileSync(join(workspace, spec.expected.documents[0])), { requireBody: false })
  const evidence = await Promise.all(metadata.evidence.map(id => verifyEvidence(workspace, id)))
  return {
    status: sha256 === provenance.excerpt.sha256 && bytes.length === provenance.excerpt.bytes && evidence.length > 0 && evidence.every(item => item.integrity === 'valid') ? 'passed' : 'failed',
    excerptSha256: sha256,
    excerptBytes: bytes.length,
    evidence: evidence.map(item => item.id),
    scope: 'retained-excerpt-and-bundle-identity; not source freshness or behavioral acceptance',
  }
}
