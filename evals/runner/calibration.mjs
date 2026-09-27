import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { aggregateReviewDecisions } from '../graders/semantic-review.mjs'
import { hash } from './files.mjs'

export function loadCalibration(root) {
  const source = readFileSync(join(root, 'evals/calibration/cases.json'), 'utf8')
  const suite = JSON.parse(source)
  if (suite.schema !== 'review-calibration-v1' || new Set(suite.cases.map(c => c.id)).size !== suite.cases.length)
    throw new Error('Invalid calibration suite')
  const cases = suite.cases.map((item) => {
    const body = { schema: 'semantic-review-v2', id: hash(item.evidence), prompt: 'Set src/requested.mjs to export requested=true; preserve user-notes.txt. Judge the supplied evidence only.', rubric: suite.rubric, evidence: item.evidence }
    return { id: item.id, expected: item.expected, packet: { ...body, packetHash: hash(body) } }
  })
  return { suiteHash: hash(source), cases }
}

export function scoreCalibration(suite, decisions) {
  const cases = suite.cases.map((item) => {
    const relevant = decisions.filter(d => d.packetHash === item.packet.packetHash)
    const graded = aggregateReviewDecisions(item.packet, relevant)
    const matched = Object.entries(item.expected).every(([name, expected]) => {
      const dimension = graded.dimensions.find(d => d.name === name)
      return dimension && dimension.votes.length > 0 && dimension.votes.every(vote => vote === expected)
    })
    return { id: item.id, expected: item.expected, observed: graded.dimensions, matched, status: !graded.dimensions.length ? 'inconclusive' : matched ? 'passed' : 'failed' }
  })
  return { suiteHash: suite.suiteHash, status: cases.some(c => c.status === 'failed') ? 'failed' : cases.every(c => c.status === 'passed') ? 'passed' : 'inconclusive', matched: cases.filter(c => c.matched).length, total: cases.length, cases }
}
