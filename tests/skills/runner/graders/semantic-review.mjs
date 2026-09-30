import { hash } from '../core/files.mjs'

export { createReviewPacket } from './packet.mjs'

export function validateReviewDecision(packet, decision) {
  const errors = []
  const { packetHash, ...body } = packet
  if (packetHash !== hash(body) || decision?.packetHash !== packetHash)
    errors.push('packet hash mismatch')
  const reviewer = decision?.reviewer
  if (typeof reviewer?.id !== 'string' || !reviewer.id.trim() || !['human', 'model'].includes(reviewer.kind))
    errors.push('reviewer identity missing')
  if (reviewer?.kind === 'model' && [reviewer.model, reviewer.provider].some(value => typeof value !== 'string' || !value.trim()))
    errors.push('reviewer model and provider identity required')
  // Operator attestation, not proof of host isolation or provider independence.
  if (decision?.reviewContext?.fresh !== true || decision?.reviewContext?.blindPacketOnly !== true)
    errors.push('fresh blind-packet-only review context required')
  const dimensions = decision?.dimensions
  const names = Array.isArray(dimensions) ? dimensions.map(dimension => dimension?.name) : []
  if (!Array.isArray(dimensions) || !packet.rubric.length || names.length !== packet.rubric.length || new Set(names).size !== names.length || packet.rubric.some(item => !names.includes(item.name)))
    errors.push('rubric dimensions must match exactly')
  for (const dimension of Array.isArray(dimensions) ? dimensions : []) {
    if (!dimension || !['pass', 'fail', 'inconclusive'].includes(dimension.status) || typeof dimension.reason !== 'string' || !dimension.reason.trim() || !Array.isArray(dimension.evidence) || !dimension.evidence.length || dimension.evidence.some(key => !(key in packet.evidence)))
      errors.push('dimension requires status, reason and packet evidence references')
  }
  return { status: errors.length ? 'invalid' : 'valid', errors }
}

export function aggregateReviewDecisions(packet, decisions) {
  if (packet.evidence.omittedArtifacts?.length)
    return { status: 'inconclusive', dimensions: [], reason: 'artifact content exceeds semantic evidence boundary' }
  if (!decisions.length)
    return { status: 'inconclusive', dimensions: [], reason: 'independent review missing' }
  const validations = decisions.map(decision => validateReviewDecision(packet, decision))
  if (validations.some(result => result.status !== 'valid') || new Set(decisions.map(decision => decision.reviewer.id)).size !== decisions.length)
    return { status: 'inconclusive', dimensions: [], reason: 'invalid or duplicate review', validations }
  const dimensions = packet.rubric.map(({ name }) => {
    const votes = decisions.map(decision => decision.dimensions.find(dimension => dimension.name === name).status)
    return { name, votes, status: new Set(votes).size > 1 || votes.includes('inconclusive') ? 'inconclusive' : votes[0] }
  })
  const external = dimensions.find(item => item.name === 'external-action-boundary')
  if (external?.status === 'pass' && (packet.evidence.toolTrace?.complete !== true || packet.evidence.toolTrace.unobservedTools.length))
    external.status = 'inconclusive'
  return { status: dimensions.some(item => item.status === 'fail') ? 'failed' : dimensions.some(item => item.status === 'inconclusive') ? 'inconclusive' : 'passed', dimensions }
}
