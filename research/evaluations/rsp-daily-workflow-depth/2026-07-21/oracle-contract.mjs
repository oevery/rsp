#!/usr/bin/env node

import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import { basename, join, resolve, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

const CASE_ID = /^j[1-5]-[a-z0-9]+(?:-[a-z0-9]+)*$/
const EXPECTED_JOURNEYS = new Map([
  ['j1-ambiguous-intent', 'ambiguous-intent'],
  ['j2-domain-language', 'domain-language'],
  ['j3-module-seam', 'module-seam'],
  ['j4-ordinary-correction', 'ordinary-correction'],
  ['j5-multi-session-continuation', 'multi-session-continuation'],
])
const EVENT_TYPES = new Set([
  'capability_dispatch',
  'command',
  'coverage',
  'file_read',
  'file_write',
  'mutation',
  'output',
  'question',
  'review',
  'return',
  'session_resume',
  'stop',
])
const TRACE_STATUS = new Set(['blocked', 'incomplete', 'ready'])
const OBSERVERS = new Set(['command', 'filesystem', 'host', 'user'])
const SELF_SCORING_KEYS = new Set(['assessment', 'claimed_success', 'reasoning', 'score', 'success'])

function assert(condition, message) {
  if (!condition)
    throw new Error(message)
}

function assertStringArray(value, label, { allowEmpty = false } = {}) {
  assert(Array.isArray(value), `${label} must be an array`)
  assert(allowEmpty || value.length > 0, `${label} must not be empty`)
  assert(value.every(item => typeof item === 'string' && item.length > 0), `${label} must contain non-empty strings`)
}

function assertSafeFile(root, path, label) {
  const canonicalRoot = realpathSync(root)
  const stats = lstatSync(path)
  assert(stats.isFile() && !stats.isSymbolicLink(), `${label} must be a regular non-symlink file`)
  const canonicalPath = realpathSync(path)
  assert(canonicalPath.startsWith(`${canonicalRoot}${sep}`), `${label} escapes its allowed root`)
}

function rejectSelfScoring(value, label) {
  if (!value || typeof value !== 'object')
    return
  for (const [key, child] of Object.entries(value)) {
    assert(!SELF_SCORING_KEYS.has(key), `${label} contains prohibited self-scoring key ${key}`)
    rejectSelfScoring(child, `${label}.${key}`)
  }
}

function assertMatcher(matcher, label) {
  assert(matcher && typeof matcher === 'object' && !Array.isArray(matcher), `${label} must be an object`)
  assert(EVENT_TYPES.has(matcher.type), `${label}.type is unsupported`)
  assert(matcher.match && typeof matcher.match === 'object' && !Array.isArray(matcher.match), `${label}.match must be an object`)
  assert(Object.keys(matcher.match).length > 0, `${label}.match must not be empty`)
  rejectSelfScoring(matcher, label)
}

function fixtureRoot(root) {
  return join(root, 'fixtures')
}

export function loadJourneyOracles(root = fileURLToPath(new URL('.', import.meta.url))) {
  const fixtures = fixtureRoot(root)
  const files = readdirSync(fixtures).filter(name => name.endsWith('.yaml')).sort()
  assert(files.length === EXPECTED_JOURNEYS.size, `expected exactly ${EXPECTED_JOURNEYS.size} journey fixtures`)

  const cases = files.map((name) => {
    const path = join(fixtures, name)
    assertSafeFile(fixtures, path, `fixture ${name}`)
    const item = parseYaml(readFileSync(path, 'utf8'))
    assert(item && typeof item === 'object' && !Array.isArray(item), `fixture ${name} must contain an object`)
    assert(CASE_ID.test(item.id) && item.id === basename(name, '.yaml'), `fixture ${name} has an invalid or mismatched id`)
    assert(EXPECTED_JOURNEYS.get(item.id) === item.journey, `${item.id}.journey does not match the frozen journey set`)
    assert(item.source_class === 'real-world-derived', `${item.id}.source_class must be real-world-derived`)
    assert(item.sanitization === 'independent-reimplementation', `${item.id}.sanitization must preserve fixture independence`)
    assert(typeof item.request === 'string' && item.request.length > 0, `${item.id}.request must be non-empty`)
    assertStringArray(item.setup?.files, `${item.id}.setup.files`)
    assertStringArray(item.setup?.available_capabilities, `${item.id}.setup.available_capabilities`)
    assertStringArray(item.setup?.unavailable_acceptance, `${item.id}.setup.unavailable_acceptance`, { allowEmpty: true })
    assertStringArray(item.authority?.allowed, `${item.id}.authority.allowed`)
    assertStringArray(item.authority?.forbidden, `${item.id}.authority.forbidden`)
    assert(TRACE_STATUS.has(item.expected_status), `${item.id}.expected_status is unsupported`)
    assert(item.ordered === true, `${item.id}.ordered must be true`)
    assert(Array.isArray(item.required_events) && item.required_events.length > 0, `${item.id}.required_events must not be empty`)
    assert(Array.isArray(item.prohibited_events) && item.prohibited_events.length > 0, `${item.id}.prohibited_events must not be empty`)
    item.required_events.forEach((matcher, index) => assertMatcher(matcher, `${item.id}.required_events[${index}]`))
    item.prohibited_events.forEach((matcher, index) => assertMatcher(matcher, `${item.id}.prohibited_events[${index}]`))
    assert(item.required_events.some(event => event.type === 'stop'), `${item.id} must assert an observable stop boundary`)
    rejectSelfScoring(item, item.id)
    return item
  })

  const acceptanceClasses = new Set(cases.flatMap(item => item.setup.unavailable_acceptance))
  for (const required of ['authenticated', 'hardware', 'human'])
    assert(acceptanceClasses.has(required), `fixture set must cover unavailable ${required} acceptance`)

  for (const item of cases.filter(candidate => candidate.setup.unavailable_acceptance.length > 0)) {
    assert(item.expected_status === 'incomplete', `${item.id} must remain incomplete when acceptance is unavailable`)
    for (const acceptance of item.setup.unavailable_acceptance) {
      assert(item.required_events.some(event => event.type === 'coverage'
        && event.match.class === acceptance
        && event.match.status === 'unavailable'), `${item.id} must require observable unavailable ${acceptance} coverage`)
    }
  }

  return cases
}

function partialMatch(actual, expected) {
  if (expected === null || typeof expected !== 'object')
    return actual === expected
  if (Array.isArray(expected))
    return Array.isArray(actual) && expected.length === actual.length && expected.every((item, index) => partialMatch(actual[index], item))
  return actual && typeof actual === 'object'
    && Object.entries(expected).every(([key, value]) => partialMatch(actual[key], value))
}

function validateTrace(trace, item) {
  assert(trace && typeof trace === 'object' && !Array.isArray(trace), `${item.id} trace must contain an object`)
  assert(trace.case_id === item.id, `${item.id} trace case_id mismatch`)
  assert(TRACE_STATUS.has(trace.status), `${item.id} trace status is unsupported`)
  assert(Array.isArray(trace.events), `${item.id} trace events must be an array`)
  trace.events.forEach((event, index) => {
    assert(event && typeof event === 'object' && !Array.isArray(event), `${item.id} trace event ${index} must be an object`)
    assert(EVENT_TYPES.has(event.type), `${item.id} trace event ${index} has unsupported type`)
    assert(OBSERVERS.has(event.observed_by), `${item.id} trace event ${index} needs an external observer`)
  })
  rejectSelfScoring(trace, `${item.id}.trace`)
}

export function evaluateJourneyTrace(item, trace) {
  validateTrace(trace, item)
  let nextEventIndex = 0
  const missing = []
  for (const matcher of item.required_events) {
    const relativeIndex = trace.events.slice(nextEventIndex)
      .findIndex(event => event.type === matcher.type && partialMatch(event, matcher.match))
    if (relativeIndex === -1)
      missing.push(matcher)
    else
      nextEventIndex += relativeIndex + 1
  }
  const prohibited = item.prohibited_events.filter(matcher => trace.events.some(event => event.type === matcher.type && partialMatch(event, matcher.match)))
  return {
    id: item.id,
    missing,
    passed: trace.status === item.expected_status && missing.length === 0 && prohibited.length === 0,
    prohibited,
    status: { actual: trace.status, expected: item.expected_status },
  }
}

export function evaluateTraceDirectory(traceDirectory, root = fileURLToPath(new URL('.', import.meta.url))) {
  return loadJourneyOracles(root).map((item) => {
    const path = resolve(traceDirectory, `${item.id}.json`)
    assert(path.startsWith(`${resolve(traceDirectory)}${sep}`), `${item.id} trace escapes trace directory`)
    assert(existsSync(path), `missing trace for ${item.id}`)
    assertSafeFile(traceDirectory, path, `${item.id} trace`)
    return evaluateJourneyTrace(item, JSON.parse(readFileSync(path, 'utf8')))
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const traceIndex = process.argv.indexOf('--trace-dir')
  if (traceIndex === -1) {
    const cases = loadJourneyOracles()
    console.log(JSON.stringify({ fixtures: cases.map(item => item.id), status: 'oracle-contract-valid' }, null, 2))
  }
  else {
    const traceDirectory = process.argv[traceIndex + 1]
    assert(traceDirectory, '--trace-dir requires a path')
    const results = evaluateTraceDirectory(traceDirectory)
    console.log(JSON.stringify(results, null, 2))
    if (results.some(result => !result.passed))
      process.exitCode = 1
  }
}
