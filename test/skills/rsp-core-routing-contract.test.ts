import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { inlineCodeValues, markdownHeadings, markdownLinks, mutateSemanticUnit, satisfiesSemanticContract } from '../support/markdown-contract'

const root = fileURLToPath(new URL('../..', import.meta.url))
const read = (path: string) => readFileSync(join(root, path), 'utf8')
const skill = read('skills/rsp/SKILL.md')
const controlOutcome = read('skills/rsp/references/control-outcome.md')
const implementationEvidence = read('skills/rsp/references/implementation-evidence.md')
const focusContinuation = read('skills/rsp/references/focus-continuation.md')
const durableReview = read('skills/rsp/references/durable-review.md')
const fallback = read('rules/rsp-rules.md')
const controlModel = read('.rsp/specs/skill-control-model.md')
const managed = read('skills/rsp/references/managed-routing.md')
const manage = read('skills/rsp-manage/SKILL.md')
const closeout = read('skills/rsp-manage/references/closeout.md')

const runtimeOwners = [
  { all: [/delegated Discipline/iu, /owns/iu, /result/iu] },
  { all: [/Hosts?/u, /worker execution/iu, /lifecycle/iu, /capabilit/iu] },
  { all: [/Evaluators?/u, /machine schemas/iu, /provider scoring/iu] },
]

const coreAuthority = [
  { all: [/Core/iu, /mutat/iu, /RSP control-plane/iu, /\b(?:only|solely)\b/iu] },
  { all: [/product mutation/iu, /Implement/iu] },
  { all: [/RouteDisposition: direct/u, /one ready owner/iu, /one writer/iu, /one execution phase/iu, /no recovery/iu] },
  { all: [/required managed worker/iu, /required independent Verify/iu, /never substitutes|does not substitute|must not substitute/iu] },
]

describe('rsp core routing contract', () => {
  it('keeps Core compact and loads inactive procedures conditionally', () => {
    expect(markdownHeadings(skill)).toEqual(['Scope', 'Derive one next action', 'Implementation evidence', 'Operate the selected Change', 'Ownership and safety', 'Durable decision output'])
    expect(markdownLinks(skill)).toEqual(expect.arrayContaining([
      'references/response-language.md',
      'references/control-outcome.md',
      'references/managed-routing.md',
      'references/implementation-evidence.md',
      'references/focus-continuation.md',
      'references/durable-review.md',
    ]))
    expect(markdownLinks(skill)).not.toContain('references/contract-kernel.md')
  })

  it('loads low-frequency evidence, recovery, and durable output only after their triggers', () => {
    const triggerContract = [
      { all: [/incomplete or failed implementation evidence/iu, /references\/implementation-evidence\.md/u, /before selecting Diagnose/iu] },
      { all: [/Focus Capsule exists/iu, /references\/focus-continuation\.md/u, /continuation resumes/iu] },
      { all: [/durable writeback decision/iu, /references\/durable-review\.md/u, /canonical localized output/iu] },
    ]
    expect(satisfiesSemanticContract(skill, triggerContract)).toBe(true)
    expect(satisfiesSemanticContract(implementationEvidence, [
      { all: [/Load this reference only/iu, /incomplete or failed/iu, /Diagnose/iu, /TDD/iu] },
      { all: [/Diagnosis first/iu, /rsp-diagnose/u, /unexplained/iu] },
      { all: [/TDD when justified/iu, /rsp-tdd/u, /Mere testability/iu] },
      { all: [/Fresh Required verification/iu, /mandatory/iu, /optional omissions/iu, /warnings/iu] },
    ])).toBe(true)
    expect(satisfiesSemanticContract(focusContinuation, [
      { all: [/Load this reference only/iu, /Focus Capsule/iu, /continuation resumes/iu] },
      { all: [/Current/iu, /Evidence/iu, /Next/iu, /Resume check/iu] },
      { all: [/cross-session or cross-device/iu, /distrust/iu, /rederive/iu, /Manage qualification/iu] },
    ])).toBe(true)
    for (const field of ['Durable Decision heading', 'Current facts label', 'Decision Record label', 'Archive ready label'])
      expect(durableReview).toContain(field)

    const unconditionalEvidence = mutateSemanticUnit(skill, [/incomplete or failed implementation evidence/iu, /before selecting Diagnose/iu], unit => unit.replace(/For incomplete or failed implementation evidence,/iu, 'Always'))
    expect(satisfiesSemanticContract(unconditionalEvidence, triggerContract)).toBe(false)
  })

  it('keeps control semantic and runtime protocols outside RSP', () => {
    expect(inlineCodeValues(controlModel)).toEqual(expect.arrayContaining([
      'solo | delegated | coordinated',
      'DispatchDisposition: none | preferred | required',
      'AcceptanceDisposition',
      'incomplete | evidence-complete | review-clean',
      'CloseoutEligibility',
      'not-eligible | lifecycle-ready | local-commit-ready',
    ]))
    expect(satisfiesSemanticContract(controlModel, runtimeOwners)).toBe(true)
    for (const token of ['WorkerSession', 'WorkerInvocation', 'WorkerReceipt', 'AcceptedLaneEvidence', 'ResourceLease', 'AssignmentDelta'])
      expect(controlModel).not.toContain(token)
    expect(satisfiesSemanticContract(controlOutcome, [
      { all: ['`delegated`', /one worker/iu] },
    ])).toBe(true)

    const evaluatorOwnedByCore = mutateSemanticUnit(controlModel, [/Evaluators?/u, /provider scoring/iu], unit => unit.replace(/Evaluators?/u, 'Core'))
    expect(satisfiesSemanticContract(evaluatorOwnedByCore, runtimeOwners)).toBe(false)
  })

  it('preserves routing, fallback, and authority boundaries', () => {
    expect(satisfiesSemanticContract(skill, coreAuthority)).toBe(true)
    expect(satisfiesSemanticContract(fallback, [
      { all: [/fallback/iu, /does not|never/iu, /emulate/iu, /rsp-manage/u] },
      { all: [/identity/iu, /independence/iu, /evidence/iu, /host/iu] },
    ])).toBe(true)

    const widenedCore = mutateSemanticUnit(skill, [/Core/iu, /RSP control-plane/iu, /product mutation/iu], unit => unit.replace(/\b(?:only|solely)\b/iu, ''))
    expect(satisfiesSemanticContract(widenedCore, coreAuthority)).toBe(false)
    const simulatedRequiredWork = mutateSemanticUnit(skill, [/required managed worker/iu, /required independent Verify/iu], unit => unit.replace(/never substitutes|does not substitute|must not substitute/iu, 'may substitute'))
    expect(satisfiesSemanticContract(simulatedRequiredWork, coreAuthority)).toBe(false)
  })

  it('qualifies automatic Manage only from observable coordination obligations', () => {
    expect(satisfiesSemanticContract(managed, [
      { all: [/Select `rsp-manage`/u, /independent slices/iu, /coordination obligation/iu] },
      { all: [/sequential work/iu, /selected/iu, /multi-phase|authority obligation/iu] },
      { all: [/Multiple files/iu, /do not by themselves qualify Manage/iu] },
    ])).toBe(true)
  })

  it('keeps compact delegation and local delivery with their owners', () => {
    const delegationContract = [
      { all: [/delegated task/iu, /only/iu, /act safely/iu] },
      { all: [/delegated Discipline/iu, /owns/iu, /result/iu] },
      { all: [/Manage/iu, /no universal worker receipt/iu, /never asks/iu, /identity/iu, /independence/iu] },
    ]
    expect(satisfiesSemanticContract(manage, delegationContract)).toBe(true)
    expect(markdownLinks(manage)).toContain('references/closeout.md')
    expect(satisfiesSemanticContract(closeout, [
      { all: [/give `rsp-commit`/iu, /WorkOwner/u, /paths/iu, /evidence/iu, /authority/iu, /receipt/iu] },
    ])).toBe(true)

    const managerOwnedResult = mutateSemanticUnit(manage, [/delegated Discipline/iu, /owns/iu, /result/iu], unit => unit.replace(/delegated Discipline/iu, 'Manage'))
    expect(satisfiesSemanticContract(managerOwnedResult, delegationContract)).toBe(false)
  })
})
