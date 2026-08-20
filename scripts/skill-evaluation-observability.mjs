function dimension(status, evidence) {
  return { status, evidence }
}

function finiteNumber(value) {
  return Number.isFinite(value) ? value : null
}

function nonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0 ? value : null
}

function firstFixResult(value) {
  return value === 'passed' || value === 'failed' ? value : null
}

function resourceList(value) {
  if (!Array.isArray(value) || value.some((item) => {
    if (typeof item !== 'string' || item.length === 0 || item.startsWith('/'))
      return true
    const parts = item.split('/')
    return parts.length < 3 || parts[1] !== 'references'
      || parts.some(part => part.length === 0 || part === '.' || part === '..')
  })) {
    return null
  }
  return [...new Set(value)].sort()
}

export function projectSkillResourceObservability({ expectedResources, observedResources } = {}) {
  const expected = resourceList(expectedResources)
  if (expected === null) {
    return {
      expected_resources: null,
      observed_resources: null,
      unexpected_resources: null,
      missing_resources: null,
    }
  }
  const observed = resourceList(observedResources)
  if (observed === null) {
    return {
      expected_resources: expected,
      observed_resources: null,
      unexpected_resources: null,
      missing_resources: null,
    }
  }
  const expectedSet = new Set(expected)
  const observedSet = new Set(observed)
  return {
    expected_resources: expected,
    observed_resources: observed,
    unexpected_resources: observed.filter(path => !expectedSet.has(path)),
    missing_resources: expected.filter(path => !observedSet.has(path)),
  }
}

function tokenMeasurements(usage) {
  const input = finiteNumber(usage?.input_tokens)
  const cachedInput = finiteNumber(usage?.cached_input_tokens)
  const cacheWriteInput = finiteNumber(usage?.cache_write_input_tokens)
  const output = finiteNumber(usage?.output_tokens)
  const reasoningOutput = finiteNumber(usage?.reasoning_output_tokens)
  const total = finiteNumber(usage?.total_tokens)
    ?? (input !== null && output !== null ? input + output : null)
  const uncachedInput = input !== null && cachedInput !== null && cachedInput <= input
    ? input - cachedInput
    : null
  return {
    cache_write_input: cacheWriteInput,
    cached_input: cachedInput,
    input,
    output,
    reasoning_output: reasoningOutput,
    total,
    uncached_input: uncachedInput,
  }
}

export function projectSkillEvaluationObservability({
  elapsedMs,
  expectedResources,
  modelInvocations,
  outcome,
  observedResources,
  outputContract,
  receiptObservations,
  toolCalls,
  toolOutputBytes,
  unauthorizedPaths,
  usage,
} = {}) {
  const expectedMissing = Array.isArray(outputContract?.expected_missing)
    ? outputContract.expected_missing
    : null
  const forbiddenPresent = Array.isArray(outputContract?.forbidden_present)
    ? outputContract.forbidden_present
    : null
  const unauthorized = Array.isArray(unauthorizedPaths) ? unauthorizedPaths : null
  const triggerObservation = receiptObservations?.trigger
  const trigger = triggerObservation?.status === 'passed' || triggerObservation?.status === 'failed'
    ? dimension(triggerObservation.status, triggerObservation.evidence ?? null)
    : dimension('not-observed', null)
  const compliance = expectedMissing === null
    ? dimension('not-observed', null)
    : dimension(expectedMissing.length === 0 ? 'passed' : 'failed', { expected_missing: expectedMissing })
  const boundary = forbiddenPresent?.length || unauthorized?.length
    ? dimension('failed', {
        forbidden_present: forbiddenPresent ?? [],
        unauthorized_paths: unauthorized ?? [],
      })
    : forbiddenPresent !== null && unauthorized !== null
      ? dimension('passed', { forbidden_present: [], unauthorized_paths: [] })
      : dimension('not-observed', null)
  const taskResult = outcome === 'passed' || outcome === 'failed'
    ? dimension(outcome, { outcome })
    : dimension('not-observed', outcome ? { outcome } : null)
  const tokens = tokenMeasurements(usage)
  const correctionCount = nonNegativeInteger(receiptObservations?.correction_count)
  const workerDispatchCount = nonNegativeInteger(receiptObservations?.worker_dispatch_count)
  const observedFirstFixResult = firstFixResult(receiptObservations?.first_fix_result)
  const resources = projectSkillResourceObservability({ expectedResources, observedResources })
  const measurements = {
    corrections: correctionCount,
    first_fix_result: observedFirstFixResult,
    worker_dispatch_count: workerDispatchCount,
    tool_calls: finiteNumber(toolCalls),
    model_invocations: nonNegativeInteger(modelInvocations),
    tool_output_bytes: nonNegativeInteger(toolOutputBytes),
    elapsed_ms: finiteNumber(elapsedMs),
    tokens,
  }
  const omissions = [
    ...(trigger.status === 'not-observed' ? ['trigger observation is unavailable'] : []),
    ...(compliance.status === 'not-observed' ? ['compliance evidence is unavailable'] : []),
    ...(boundary.status === 'not-observed' ? ['boundary evidence is unavailable'] : []),
    ...(taskResult.status === 'not-observed' ? ['task result is unavailable'] : []),
    ...(correctionCount === null ? ['correction count is unavailable'] : []),
    ...(observedFirstFixResult === null ? ['first-fix result is unavailable'] : []),
    ...(workerDispatchCount === null ? ['worker dispatch count is unavailable'] : []),
    ...(measurements.tool_calls === null ? ['tool-call count is unavailable'] : []),
    ...(measurements.model_invocations === null ? ['model-invocation count is unavailable'] : []),
    ...(measurements.tool_output_bytes === null ? ['tool-output byte count is unavailable'] : []),
    ...(measurements.elapsed_ms === null ? ['elapsed time is unavailable'] : []),
    ...(tokens.input === null ? ['input-token count is unavailable'] : []),
    ...(tokens.output === null ? ['output-token count is unavailable'] : []),
    ...(tokens.total === null ? ['total-token count is unavailable'] : []),
    ...(resources.expected_resources !== null && resources.observed_resources === null
      ? ['reference-load observation is unavailable']
      : []),
  ]
  return {
    dimensions: {
      trigger,
      compliance,
      boundary,
      task_result: taskResult,
    },
    resources,
    measurements,
    omissions,
  }
}
