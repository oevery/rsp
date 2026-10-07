import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hashFile } from '../../../runner/core/files.mjs'
import { verify as verifyDocument } from '../../document-quality/write/oracle.mjs'

export { check } from '../../document-quality/write/oracle.mjs'

const projects = fileURLToPath(new URL('../../../projects/', import.meta.url))
// This fixture asks to preserve its supplied links; reports have no runtime schema.
const links = text => [...text.matchAll(/\]\(([^)]+)\)/g)].map(match => match[1])

export async function verify(input) {
  const document = await verifyDocument(input)
  const { case: spec, observation } = input
  const reports = spec.expected.documents.map((path) => {
    try {
      const originalPath = join(projects, spec.project, path)
      if (hashFile(originalPath, '0:') !== observation.baseline?.[path])
        throw new Error('Report fixture differs from the recorded test baseline')
      const original = readFileSync(originalPath, 'utf8')
      const current = observation.artifacts?.[path] ?? ''
      const missingSources = links(original).filter(link => !links(current).includes(link))
      return { path, status: missingSources.length || current.trim() === original.trim() ? 'failed' : 'passed', missingSources }
    }
    catch (error) { return { path, status: 'failed', error: error.message } }
  })
  return { status: document.status === 'passed' && reports.every(item => item.status === 'passed') ? 'passed' : 'failed', evidence: { ...document.evidence, reports } }
}

export async function readiness({ workspace, case: spec }) {
  const paths = spec.expected.documents.flatMap((path) => {
    const text = readFileSync(join(workspace, path), 'utf8')
    return links(text).map(link => resolve(workspace, dirname(path), link))
  })
  const available = paths.every(path => readFileSync(path).length > 0)
  return { status: available ? 'passed' : 'failed', sources: paths.length, scope: 'supplied-report-links-and-local-material; not freshness or behavioral acceptance' }
}
