import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { markdownLinks, mutateSemanticUnit, satisfiesSemanticContract } from '../support/markdown-contract'

const root = fileURLToPath(new URL('../..', import.meta.url))
const read = (path: string) => readFileSync(join(root, path), 'utf8')
const core = read('skills/rsp/SKILL.md')
const controlOutcome = read('skills/rsp/references/control-outcome.md')
const implementationEvidence = read('skills/rsp/references/implementation-evidence.md')
const focusContinuation = read('skills/rsp/references/focus-continuation.md')
const manage = read('skills/rsp-manage/SKILL.md')
const delegation = read('skills/rsp-manage/references/delegation.md')
const interruption = read('skills/rsp-manage/references/interruption-recovery.md')
const reviewConvergence = read('skills/rsp-manage/references/review-convergence.md')
const closeout = read('skills/rsp-manage/references/closeout.md')
const controlModel = read('.rsp/specs/skill-control-model.md')
const skillSystem = read('.rsp/specs/skill-system.md')

const delegationEvidenceContract = [
  { all: [/worker-authored Discipline result/iu, /did|observed/iu] },
  { all: [/host observations/iu, /dispatch/iu, /attribution/iu, /completion/iu] },
  { all: [/Manager/iu, /validates/iu, /authority/iu, /changed paths/iu, /verification/iu] },
  { all: [/Host facts/iu, /observations/iu, /not RSP domain objects/iu] },
  { all: [/Manager/iu, /must not|never/iu, /author|repair|reconstruct|substitute/iu, /worker result/iu] },
]

const manageConditionalLoadingContract = [
  { all: [/delegation and host evidence/iu, /references\/delegation\.md/u, /preferred \| required/u, /before/iu, /worker task/iu, /worker result/iu] },
  { all: [/interruption and recovery/iu, /references\/interruption-recovery\.md/u, /only/iu, /progress or status inquiry/iu, /explicit pause/iu, /environment or verification stop/iu, /resume/iu] },
  { all: [/managed review convergence/iu, /references\/review-convergence\.md/u, /only/iu, /same-scope correction/iu, /fixed-scope review/iu, /Findings/u] },
  { all: [/lifecycle and delivery closeout/iu, /references\/closeout\.md/u, /only/iu, /selected handoff/iu, /review-clean/u, /recovery checkpoint/iu, /push request/iu] },
  { all: [/none of these triggers/iu, /do not read/iu, /references/iu] },
]

describe('skill runtime context composition', () => {
  it('keeps inactive Core procedures behind direct references', () => {
    expect(markdownLinks(core)).toEqual(expect.arrayContaining(['references/response-language.md', 'references/control-outcome.md', 'references/managed-routing.md', 'references/implementation-evidence.md', 'references/focus-continuation.md', 'references/reopen-recovery.md', 'references/durable-review.md']))
    expect(markdownLinks(core)).not.toContain('references/contract-kernel.md')
    expect(satisfiesSemanticContract(core, [
      { all: [/incomplete or failed implementation evidence/iu, /implementation-evidence\.md/u] },
      { all: [/Focus Capsule exists/iu, /focus-continuation\.md/u, /continuation resumes/iu] },
    ])).toBe(true)
    expect(satisfiesSemanticContract(implementationEvidence, [
      { all: [/rsp-diagnose/u, /Diagnosis first/iu] },
      { all: [/rsp-tdd/u, /TDD when justified/iu] },
      { all: [/rsp-implement/u, /Ordinary implementation/iu] },
      { all: [/rsp-verify/u, /Verification as one bounded action/iu] },
    ])).toBe(true)
    expect(satisfiesSemanticContract(focusContinuation, [
      { all: [/WorkRef/u, /Authority/u, /Current state/u, /Changed artifacts/u, /Fresh verification/u, /Blockers/u, /Next action/u] },
    ])).toBe(true)
  })

  it('keeps only low-frequency Manage procedures conditional', () => {
    expect(markdownLinks(manage)).toEqual(expect.arrayContaining(['references/delegation.md', 'references/interruption-recovery.md', 'references/review-convergence.md', 'references/closeout.md']))
    expect(markdownLinks(manage)).not.toEqual(expect.arrayContaining(['references/managed-exchange.md', 'references/host-worker-lifecycle.md']))
    expect(satisfiesSemanticContract(manage, manageConditionalLoadingContract)).toBe(true)
    expect(satisfiesSemanticContract(manage, [
      { all: [/same Finding/iu, /two completed corrections/iu] },
      { all: [/rsp ready/iu, /completionGate/u, /archiveReady/u] },
      { all: [/Focus Capsule/iu, /exactly one/iu, /Current/u, /Evidence/u, /Next/u] },
    ])).toBe(false)

    expect(satisfiesSemanticContract(interruption, [
      { all: [/Load this reference/iu, /progress or status inquiry/iu, /explicit pause/iu, /environment or verification stop/iu, /resume/iu] },
      { all: [/Reread/iu, /complete owner and authority/iu, /invalidation/iu, /recovery/iu, /cross-session continuation/iu, /closeout boundary/iu] },
    ])).toBe(true)
    expect(satisfiesSemanticContract(closeout, [
      { all: [/Load this reference/iu, /closeout begins|recovery checkpoint|requests push/iu, /CloseoutEligibility/u] },
      { all: [/rsp ready/iu, /completionGate/u, /archiveReady/u] },
    ])).toBe(true)
    expect(satisfiesSemanticContract(reviewConvergence, [
      { all: [/same-scope failure/iu, /three worker correction passes/iu, /Required independent Verify/iu, /separate obligation/iu] },
      { all: [/stop/iu, /same Finding/iu, /two completed corrections/iu] },
    ])).toBe(true)
    expect(satisfiesSemanticContract(interruption, [
      { all: [/cancell?ing/iu, /wait/iu, /does not|never/iu, /stop/iu, /accepted work/iu] },
    ])).toBe(true)
  })

  it('keeps ordinary delegation small and host facts separate', () => {
    expect(satisfiesSemanticContract(delegation, [
      { all: [/delegated task/iu, /only/iu, /act safely/iu] },
      ...delegationEvidenceContract,
    ])).toBe(true)
    expect(satisfiesSemanticContract(controlOutcome, [
      { all: [/Raw worker messages/iu, /host events/iu, /unaccepted evidence/iu, /never appear|must not appear|do not appear/iu, /outer receipt fields/iu] },
    ])).toBe(true)

    expect(satisfiesSemanticContract(manage, [
      { all: [/DispatchDisposition: none/iu, /do not read/iu, /worker delegation procedure/iu, /bounded local Discipline/iu] },
    ])).toBe(true)

    const managerSubstitutes = mutateSemanticUnit(delegation, [/Manager/iu, /worker result/iu, /reconstruct/iu], unit => unit.replace(/must not|never/iu, 'may'))
    expect(satisfiesSemanticContract(managerSubstitutes, delegationEvidenceContract)).toBe(false)
  })

  it('keeps durable ownership free of runtime and evaluator protocols', () => {
    const durableOwnership = [
      { all: [/Manage/iu, /no universal worker receipt schema/iu] },
    ]
    const portableOwnership = [
      { all: [/Hosts?/u, /worker execution/iu, /identity/iu, /lifecycle observations/iu] },
      { all: [/Evaluators? and adapters/iu, /machine schemas/iu, /provider scoring/iu] },
      { all: [/Internal evaluation formats/iu, /implementation details/iu, /must not|never/iu, /published Skill|durable Spec/iu] },
      { all: [/Published Skills/iu, /standalone/iu, /never require/iu, /another installed Skill/iu, /runtime glossary/iu] },
    ]
    expect(satisfiesSemanticContract(controlModel, durableOwnership)).toBe(true)
    expect(satisfiesSemanticContract(skillSystem, portableOwnership)).toBe(true)
    for (const token of ['WorkerSession', 'WorkerInvocation', 'WorkerReceipt', 'AcceptedLaneEvidence', 'ResourceLease', 'AssignmentDelta']) {
      expect(controlModel).not.toContain(token)
      expect(skillSystem).not.toContain(token)
    }

    const providerOwnedBySkills = mutateSemanticUnit(skillSystem, [/Evaluators? and adapters/iu, /provider scoring/iu], unit => unit.replace(/Evaluators? and adapters/iu, 'Published Skills'))
    expect(satisfiesSemanticContract(providerOwnedBySkills, portableOwnership)).toBe(false)
    const recursiveRuntime = mutateSemanticUnit(skillSystem, [/Published Skills/iu, /standalone/iu, /another installed Skill/iu], unit => unit.replace(/never require/iu, 'may require'))
    expect(satisfiesSemanticContract(recursiveRuntime, portableOwnership)).toBe(false)
  })
})
