#!/usr/bin/env node

import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { evaluateJourneyTrace, loadJourneyOracles } from './oracle-contract.mjs'

const root = fileURLToPath(new URL('.', import.meta.url))

function materializePassingTrace(item) {
  return {
    case_id: item.id,
    status: item.expected_status,
    events: item.required_events.map(event => ({ ...event.match, observed_by: 'host', type: event.type })),
  }
}

const cases = loadJourneyOracles(root)
assert.deepEqual(cases.map(item => item.journey), [
  'ambiguous-intent',
  'domain-language',
  'module-seam',
  'ordinary-correction',
  'multi-session-continuation',
])

for (const item of cases) {
  const result = evaluateJourneyTrace(item, materializePassingTrace(item))
  assert.equal(result.passed, true, item.id)
}

const missingStopCase = cases[0]
const missingStopTrace = materializePassingTrace(missingStopCase)
missingStopTrace.events = missingStopTrace.events.filter(event => event.type !== 'stop')
const missingStopResult = evaluateJourneyTrace(missingStopCase, missingStopTrace)
assert.equal(missingStopResult.passed, false)
assert.equal(missingStopResult.missing.some(event => event.type === 'stop'), true)

const reorderedCase = cases[3]
const reorderedTrace = materializePassingTrace(reorderedCase)
const firstEvent = reorderedTrace.events.shift()
reorderedTrace.events.splice(3, 0, firstEvent)
const reorderedResult = evaluateJourneyTrace(reorderedCase, reorderedTrace)
assert.equal(reorderedResult.passed, false)
assert.equal(reorderedResult.missing.some(event => event.type === 'command' && event.match.phase === 'red'), true)

const missingReviewTrace = materializePassingTrace(reorderedCase)
missingReviewTrace.events = missingReviewTrace.events.filter(event => event.type !== 'review')
const missingReviewResult = evaluateJourneyTrace(reorderedCase, missingReviewTrace)
assert.equal(missingReviewResult.passed, false)
assert.equal(missingReviewResult.missing.some(event => event.type === 'review'), true)

const unauthorizedCase = cases[4]
const unauthorizedTrace = materializePassingTrace(unauthorizedCase)
unauthorizedTrace.events.push({ action: 'commit', observed_by: 'host', type: 'output' })
const unauthorizedResult = evaluateJourneyTrace(unauthorizedCase, unauthorizedTrace)
assert.equal(unauthorizedResult.passed, false)
assert.equal(unauthorizedResult.prohibited.length, 1)

const selfScoredCase = cases[3]
const selfScoredTrace = materializePassingTrace(selfScoredCase)
selfScoredTrace.success = true
assert.throws(() => evaluateJourneyTrace(selfScoredCase, selfScoredTrace), /self-scoring key success/)

console.log(JSON.stringify({ assertions: 7, status: 'oracle-contract-self-test-passed' }, null, 2))
