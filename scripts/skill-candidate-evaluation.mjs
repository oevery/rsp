#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

const dimensions = ['trigger', 'compliance', 'boundary', 'task_result']
const numericMeasurements = [
  ['corrections'],
  ['worker_dispatch_count'],
  ['tool_calls'],
  ['elapsed_ms'],
  ['tokens', 'input'],
  ['tokens', 'output'],
  ['tokens', 'total'],
]

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function canonicalJson(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return JSON.stringify(value)
  if (typeof value === 'number' && Number.isFinite(value))
    return JSON.stringify(value)
  if (Array.isArray(value))
    return `[${value.map(item => canonicalJson(item)).join(',')}]`
  if (isObject(value)) {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`
  }
  throw new Error('evaluation evidence must contain only finite JSON values')
}

export function hashSkillEvaluationValue(value) {
  return createHash('sha256').update(canonicalJson(value)).digest('hex')
}

function identityHash(identity, label) {
  const hash = typeof identity === 'string' ? identity : identity?.sha256
  if (typeof hash !== 'string' || !/^[a-f0-9]{64}$/u.test(hash))
    throw new Error(`${label} identity must contain a lowercase SHA-256 hash`)
  return hash
}

function contractHash(value, label) {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/u.test(value))
    throw new Error(`${label} contract_sha256 must be a lowercase SHA-256 hash`)
  return value
}

function exactKeys(value, expected, label) {
  const actual = Object.keys(value).sort()
  const sortedExpected = [...expected].sort()
  if (JSON.stringify(actual) !== JSON.stringify(sortedExpected))
    throw new Error(`${label} must contain exactly: ${sortedExpected.join(', ')}`)
}

function nullableCount(value, label) {
  if (value === null || (Number.isInteger(value) && value >= 0))
    return value
  throw new Error(`${label} must be null or a non-negative integer`)
}

export function validateSkillEvaluationReceipt(receipt, {
  caseId,
  compositionSha256,
  contractSha256,
} = {}) {
  if (!isObject(receipt))
    throw new Error('evaluation receipt must be an object')
  exactKeys(
    receipt,
    ['case_id', 'composition_sha256', 'contract_sha256', 'observations'],
    'evaluation receipt',
  )
  if (typeof receipt.case_id !== 'string' || receipt.case_id.length === 0)
    throw new Error('evaluation receipt case_id must be a non-empty string')
  const normalizedComposition = contractHash(
    receipt.composition_sha256,
    'evaluation receipt composition_sha256',
  )
  const normalizedContract = contractHash(
    receipt.contract_sha256,
    'evaluation receipt contract_sha256',
  )
  if (!isObject(receipt.observations))
    throw new Error('evaluation receipt observations must be an object')
  exactKeys(
    receipt.observations,
    ['correction_count', 'first_fix_result', 'trigger', 'worker_dispatch_count'],
    'evaluation receipt observations',
  )
  const trigger = receipt.observations.trigger
  if (trigger !== null
    && (!isObject(trigger)
      || (trigger.status !== 'passed' && trigger.status !== 'failed')
      || Object.keys(trigger).some(key => key !== 'status' && key !== 'evidence'))) {
    throw new Error('evaluation receipt trigger must be null or a passed/failed observation')
  }
  const firstFixResult = receipt.observations.first_fix_result
  if (firstFixResult !== null && firstFixResult !== 'passed' && firstFixResult !== 'failed')
    throw new Error('evaluation receipt first_fix_result must be null, passed, or failed')
  if (caseId !== undefined && receipt.case_id !== caseId)
    throw new Error(`evaluation receipt case_id does not match ${caseId}`)
  if (compositionSha256 !== undefined && normalizedComposition !== compositionSha256)
    throw new Error('evaluation receipt composition_sha256 does not match the run composition')
  if (contractSha256 !== undefined && normalizedContract !== contractSha256)
    throw new Error('evaluation receipt contract_sha256 does not match the case contract')
  return {
    case_id: receipt.case_id,
    composition_sha256: normalizedComposition,
    contract_sha256: normalizedContract,
    observations: {
      trigger: trigger === null
        ? null
        : { status: trigger.status, evidence: trigger.evidence ?? null },
      first_fix_result: firstFixResult,
      correction_count: nullableCount(
        receipt.observations.correction_count,
        'evaluation receipt correction_count',
      ),
      worker_dispatch_count: nullableCount(
        receipt.observations.worker_dispatch_count,
        'evaluation receipt worker_dispatch_count',
      ),
    },
  }
}

function readMeasurement(measurements, path) {
  let value = measurements
  for (const key of path)
    value = isObject(value) ? value[key] : undefined
  return Number.isFinite(value) ? value : null
}

function diagnosticMeasurements(current, candidate) {
  const deltas = {}
  for (const path of numericMeasurements) {
    const key = path.join('.')
    const currentValue = readMeasurement(current, path)
    const candidateValue = readMeasurement(candidate, path)
    deltas[key] = {
      current: currentValue,
      candidate: candidateValue,
      delta: currentValue !== null && candidateValue !== null
        ? candidateValue - currentValue
        : null,
    }
  }
  const currentFirstFix = current?.first_fix_result === 'passed' || current?.first_fix_result === 'failed'
    ? current.first_fix_result
    : null
  const candidateFirstFix = candidate?.first_fix_result === 'passed' || candidate?.first_fix_result === 'failed'
    ? candidate.first_fix_result
    : null
  return {
    first_fix_result: {
      current: currentFirstFix,
      candidate: candidateFirstFix,
      changed: currentFirstFix !== null && candidateFirstFix !== null
        ? currentFirstFix !== candidateFirstFix
        : null,
    },
    measurements: deltas,
  }
}

function validateObservation(observation, label) {
  if (!isObject(observation))
    throw new Error(`${label} observation must be an object`)
  if (!isObject(observation.dimensions))
    throw new Error(`${label} dimensions must be an object`)
  if (observation.measurements !== undefined && !isObject(observation.measurements))
    throw new Error(`${label} measurements must be an object when present`)
}

export function validateSkillEvaluationReceiptObservability(receiptObservations, observability, label = 'evaluation observation') {
  validateObservation(observability, `${label}.observability`)
  const expectedTrigger = receiptObservations?.trigger === null || receiptObservations?.trigger === undefined
    ? { status: 'not-observed', evidence: null }
    : {
        status: receiptObservations.trigger.status,
        evidence: receiptObservations.trigger.evidence ?? null,
      }
  if (hashSkillEvaluationValue(observability.dimensions.trigger) !== hashSkillEvaluationValue(expectedTrigger))
    throw new Error(`${label}.observability trigger does not match its receipt observation`)
  const receiptMeasurements = {
    corrections: receiptObservations?.correction_count ?? null,
    first_fix_result: receiptObservations?.first_fix_result ?? null,
    worker_dispatch_count: receiptObservations?.worker_dispatch_count ?? null,
  }
  for (const [measurement, expected] of Object.entries(receiptMeasurements)) {
    if (observability.measurements?.[measurement] !== expected)
      throw new Error(`${label}.observability ${measurement} does not match its receipt observation`)
  }
  return observability
}

function validateBoundObservation(value, label, { caseId, compositionSha256, contractSha256 }) {
  if (!isObject(value))
    throw new Error(`${label} must be an object`)
  if (value.case_id !== caseId)
    throw new Error(`${label}.case_id must match ${caseId}`)
  if (value.composition_sha256 !== compositionSha256)
    throw new Error(`${label}.composition_sha256 must match its manifest identity`)
  if (value.contract_sha256 !== contractSha256)
    throw new Error(`${label}.contract_sha256 must match the case contract`)
  const receiptSha256 = contractHash(value.receipt_sha256, `${label}.receipt_sha256`)
  const observationSha256 = contractHash(value.observation_sha256, `${label}.observation_sha256`)
  const receipt = validateSkillEvaluationReceipt({
    case_id: value.case_id,
    composition_sha256: value.composition_sha256,
    contract_sha256: value.contract_sha256,
    observations: value.receipt_observations,
  }, { caseId, compositionSha256, contractSha256 })
  if (hashSkillEvaluationValue(receipt) !== receiptSha256)
    throw new Error(`${label}.receipt_sha256 does not match its receipt content`)
  validateSkillEvaluationReceiptObservability(receipt.observations, value.observability, label)
  if (hashSkillEvaluationValue(value.observability) !== observationSha256)
    throw new Error(`${label}.observation_sha256 does not match its observability content`)
  return {
    case_id: caseId,
    composition_sha256: compositionSha256,
    contract_sha256: contractSha256,
    receipt_sha256: receiptSha256,
    observation_sha256: observationSha256,
    receipt_observations: receipt.observations,
    observability: value.observability,
  }
}

export function evaluateSkillCandidate(manifest) {
  if (!isObject(manifest))
    throw new Error('candidate evaluation manifest must be an object')
  const currentIdentity = identityHash(manifest.current_identity, 'current')
  const candidateIdentity = identityHash(manifest.candidate_identity, 'candidate')
  if (!Array.isArray(manifest.cases) || manifest.cases.length < 1 || manifest.cases.length > 3)
    throw new Error('candidate evaluation manifest must contain one to three cases')

  const caseIds = new Set()
  const regressions = []
  const candidateFailures = []
  const missingEvidence = []
  const cases = manifest.cases.map((item, index) => {
    if (!isObject(item) || typeof item.id !== 'string' || item.id.length === 0)
      throw new Error(`cases[${index}].id must be a non-empty string`)
    if (caseIds.has(item.id))
      throw new Error(`candidate evaluation case is duplicated: ${item.id}`)
    caseIds.add(item.id)
    const contractSha256 = contractHash(item.contract_sha256, `cases[${index}]`)
    const current = validateBoundObservation(item.current, `cases[${index}].current`, {
      caseId: item.id,
      compositionSha256: currentIdentity,
      contractSha256,
    })
    const candidate = validateBoundObservation(item.candidate, `cases[${index}].candidate`, {
      caseId: item.id,
      compositionSha256: candidateIdentity,
      contractSha256,
    })
    if (item.unseen !== true) {
      missingEvidence.push({
        case_id: item.id,
        variant: null,
        dimension: null,
        reason: 'case is not explicitly marked unseen',
      })
    }

    const comparedDimensions = {}
    for (const name of dimensions) {
      const currentStatus = current.observability.dimensions[name]?.status
      const candidateStatus = candidate.observability.dimensions[name]?.status
      const validCurrent = currentStatus === 'passed' || currentStatus === 'failed'
      const validCandidate = candidateStatus === 'passed' || candidateStatus === 'failed'
      comparedDimensions[name] = {
        current: validCurrent ? currentStatus : 'not-observed',
        candidate: validCandidate ? candidateStatus : 'not-observed',
      }
      if (!validCurrent) {
        missingEvidence.push({
          case_id: item.id,
          variant: 'current',
          dimension: name,
          reason: 'required dimension is not observed',
        })
      }
      if (!validCandidate) {
        missingEvidence.push({
          case_id: item.id,
          variant: 'candidate',
          dimension: name,
          reason: 'required dimension is not observed',
        })
      }
      if (currentStatus === 'passed' && candidateStatus !== 'passed') {
        regressions.push({
          case_id: item.id,
          dimension: name,
          current: 'passed',
          candidate: validCandidate ? candidateStatus : 'not-observed',
        })
      }
      if (candidateStatus === 'failed') {
        candidateFailures.push({
          case_id: item.id,
          dimension: name,
          status: 'failed',
        })
      }
    }

    return {
      id: item.id,
      contract_sha256: contractSha256,
      unseen: item.unseen === true,
      observations: {
        current: {
          composition_sha256: current.composition_sha256,
          receipt_sha256: current.receipt_sha256,
          observation_sha256: current.observation_sha256,
        },
        candidate: {
          composition_sha256: candidate.composition_sha256,
          receipt_sha256: candidate.receipt_sha256,
          observation_sha256: candidate.observation_sha256,
        },
      },
      dimensions: comparedDimensions,
      diagnostics: diagnosticMeasurements(
        current.observability.measurements,
        candidate.observability.measurements,
      ),
    }
  })

  if (currentIdentity === candidateIdentity) {
    missingEvidence.unshift({
      case_id: null,
      variant: null,
      dimension: null,
      reason: 'current and candidate identities must be distinct',
    })
  }

  return {
    result: missingEvidence.length > 0
      ? 'incomplete'
      : candidateFailures.length > 0 || regressions.length > 0
        ? 'retain-current'
        : 'candidate-eligible',
    identities: {
      current: currentIdentity,
      candidate: candidateIdentity,
    },
    regressions,
    candidate_failures: candidateFailures,
    missing_evidence: missingEvidence,
    cases,
    authority: {
      mutate_skills: false,
      publish: false,
    },
  }
}

export function loadSkillCandidateManifest(path) {
  const absolutePath = resolve(path)
  const file = lstatSync(absolutePath)
  if (file.isSymbolicLink() || !file.isFile())
    throw new Error('candidate evaluation manifest must be a regular non-symlink file')
  return parseYaml(readFileSync(absolutePath, 'utf8'))
}

function loadManagedRunMetadata(path, label) {
  const absolutePath = resolve(path)
  const file = lstatSync(absolutePath)
  if (file.isSymbolicLink() || !file.isFile())
    throw new Error(`${label} metadata must be a regular non-symlink file`)
  const metadata = JSON.parse(readFileSync(absolutePath, 'utf8'))
  if (!isObject(metadata))
    throw new Error(`${label} metadata must be a JSON object`)
  return metadata
}

function boundObservationFromManagedRun(metadata, label) {
  const receiptSummary = metadata.evaluation_receipt
  if (!isObject(receiptSummary) || !isObject(metadata.receipt_observations))
    throw new Error(`${label} metadata lacks structured evaluation receipt evidence`)
  const receipt = validateSkillEvaluationReceipt({
    case_id: metadata.case_id,
    composition_sha256: receiptSummary.composition_sha256,
    contract_sha256: metadata.contract_sha256,
    observations: metadata.receipt_observations,
  })
  const receiptSha256 = hashSkillEvaluationValue(receipt)
  if (receiptSummary.receipt_sha256 !== receiptSha256)
    throw new Error(`${label} receipt hash does not match its structured content`)
  const observationSha256 = hashSkillEvaluationValue(metadata.observability)
  if (metadata.observation_sha256 !== observationSha256)
    throw new Error(`${label} observability hash does not match its structured content`)
  validateSkillEvaluationReceiptObservability(
    receipt.observations,
    metadata.observability,
    `${label} observability`,
  )
  return {
    case_id: receipt.case_id,
    composition_sha256: receipt.composition_sha256,
    contract_sha256: receipt.contract_sha256,
    receipt_sha256: receiptSha256,
    observation_sha256: observationSha256,
    receipt_observations: receipt.observations,
    observability: metadata.observability,
  }
}

export function createSkillCandidateManifestFromManagedRuns(currentMetadata, candidateMetadata) {
  const current = boundObservationFromManagedRun(currentMetadata, 'current run')
  const candidate = boundObservationFromManagedRun(candidateMetadata, 'candidate run')
  if (current.case_id !== candidate.case_id)
    throw new Error('managed runs must use the same case_id')
  if (current.contract_sha256 !== candidate.contract_sha256)
    throw new Error('managed runs must use the same contract_sha256')
  return {
    current_identity: { sha256: current.composition_sha256 },
    candidate_identity: { sha256: candidate.composition_sha256 },
    cases: [{
      id: current.case_id,
      contract_sha256: current.contract_sha256,
      unseen: true,
      current,
      candidate,
    }],
  }
}

function writeComparisonOutput(path, value) {
  const absolutePath = resolve(path)
  if (existsSync(absolutePath)) {
    const file = lstatSync(absolutePath)
    if (file.isSymbolicLink() || !file.isFile())
      throw new Error('candidate comparison output must be a regular non-symlink file')
  }
  mkdirSync(dirname(absolutePath), { recursive: true })
  writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`)
  return absolutePath
}

async function main() {
  const args = process.argv.slice(2)
  if (args[0] === 'managed-runs') {
    const outputIndex = args.indexOf('--output')
    const positional = outputIndex === -1 ? args.slice(1) : args.slice(1, outputIndex)
    if (positional.length !== 2 || outputIndex === -1 || outputIndex !== args.length - 2 || !args[outputIndex + 1])
      throw new Error(`usage: ${basename(process.argv[1])} managed-runs <current-metadata.json> <candidate-metadata.json> --output <comparison.json>`)
    const manifest = createSkillCandidateManifestFromManagedRuns(
      loadManagedRunMetadata(positional[0], 'current run'),
      loadManagedRunMetadata(positional[1], 'candidate run'),
    )
    const result = evaluateSkillCandidate(manifest)
    const outputPath = writeComparisonOutput(args[outputIndex + 1], { manifest, result })
    console.log(JSON.stringify({ output_path: outputPath, result: result.result }, null, 2))
    process.exitCode = result.result === 'candidate-eligible' ? 0 : 1
    return
  }
  const [path, ...extra] = args
  if (!path || extra.length > 0)
    throw new Error(`usage: ${basename(process.argv[1])} <manifest.yaml|manifest.json> | managed-runs <current-metadata.json> <candidate-metadata.json> --output <comparison.json>`)
  const result = evaluateSkillCandidate(loadSkillCandidateManifest(path))
  console.log(JSON.stringify(result, null, 2))
  process.exitCode = result.result === 'candidate-eligible' ? 0 : 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
