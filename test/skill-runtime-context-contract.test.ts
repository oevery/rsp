import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { findSemanticUnit, markdownLinks } from './helpers/markdown-contract'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (path: string) => readFileSync(join(root, path), 'utf8')
const core = read('skills/rsp/SKILL.md')
const controlOutcome = read('skills/rsp/references/control-outcome.md')
const responseLanguage = read('skills/rsp/references/response-language.md')
const manage = read('skills/rsp-manage/SKILL.md')
const managedExchange = read('skills/rsp-manage/references/managed-exchange.md')
const manageInterruption = read('skills/rsp-manage/references/interruption-recovery.md')
const manageReviewConvergence = read('skills/rsp-manage/references/review-convergence.md')
const manageCloseout = read('skills/rsp-manage/references/closeout.md')
const controlModel = read('.rsp/specs/skill-control-model.md')
const skillSystem = read('.rsp/specs/skill-system.md')
const evaluation = join(root, 'research/evaluations/rsp-skill-runtime-context/2026-07-29-three-stage-behavior')
const verifiedEvaluation = join(root, 'research/evaluations/rsp-skill-runtime-context/2026-07-29-three-stage-behavior-user-config-adjudicated')
const hash = (body: string | Uint8Array) => createHash('sha256').update(body).digest('hex')

describe('skill runtime context composition', () => {
  it('keeps inactive procedures behind direct Core references', () => {
    expect(markdownLinks(core)).toEqual(expect.arrayContaining([
      'references/response-language.md',
      'references/control-outcome.md',
      'references/managed-routing.md',
      'references/reopen-recovery.md',
      'references/durable-review.md',
    ]))
    expect(core).not.toContain('### Release operations')
    expect(core).not.toContain('## Handle interruption')
    expect(findSemanticUnit(manageCloseout, ['Load this reference', 'CloseoutEligibility'])).toBeDefined()
  })

  it('keeps conditional Manage procedures reachable without loading their detail by default', () => {
    expect(markdownLinks(manage)).toEqual(expect.arrayContaining([
      'references/host-worker-lifecycle.md',
      'references/interruption-recovery.md',
      'references/managed-exchange.md',
      'references/review-convergence.md',
      'references/closeout.md',
    ]))
    expect(findSemanticUnit(manage, ['progress or status inquiry', 'explicit pause or release', 'resume from continuation pointers'])).toBeDefined()
    expect(findSemanticUnit(manage, ['fixed-scope re-review returns Findings', 'bounded Resolve Findings pass'])).toBeDefined()
    expect(findSemanticUnit(manage, ['When closeout begins', 'derive `CloseoutEligibility`', 'incomplete-or-drifted fail-safe'])).toBeDefined()

    expect(manage).not.toContain('Machine heartbeat is host-level liveness evidence')
    expect(manage).not.toContain('Observe creation, delivery, admission, activity or wait')
    expect(read('skills/rsp-manage/references/host-worker-lifecycle.md')).toContain('Observe creation, delivery, admission, activity or wait')
    expect(controlOutcome).toContain('default session rendering is localized labeled natural language')
    expect(controlOutcome).toContain('Use JSON only for an explicitly identified machine consumer')
    expect(controlOutcome).toContain('do not emit a duplicate JSON copy by default')
    expect(controlOutcome).toContain('Raw Assignments, WorkerReceipts, host events, leases, retry chronology, and unaccepted evidence never appear as outer receipt fields')
    expect(managedExchange).toContain('Every WorkerInvocation expects exactly one worker-authored `WorkerReceipt`')
    expect(managedExchange).toContain('Use localized labeled natural language as the default Assignment and WorkerReceipt presentation')
    expect(managedExchange).toContain('Use JSON only when an explicitly identified host, API, CLI, or other machine consumer requires this managed-exchange encoding')
    expect(managedExchange).toContain('A maintainer `EvaluationReceipt` is a separate evaluation-harness protocol')
    expect(managedExchange).toContain('Do not emit both natural-language and JSON renderings by default')
    expect(managedExchange).toContain('Host observations and producer claims remain separate inputs')
    expect(managedExchange).toContain('Manager validation')
    expect(manageInterruption).toContain('Machine heartbeat is host-level liveness evidence')
    expect(manage).not.toContain('same Finding remains after two completed corrections')
    expect(manageReviewConvergence).toContain('same Finding remains after two completed corrections')
    expect(manage).not.toContain('run `rsp ready <change-work-ref> --json`')
    expect(manageCloseout).toContain('run `rsp ready <change-work-ref> --json`')
  })

  it('keeps canonical control vocabulary in one durable Spec', () => {
    expect(controlModel).toContain('A `ControlOutcome` is the single outer response receipt')
    expect(controlModel).toContain('Core owns its packaged runtime projection in `skills/rsp/references/control-outcome.md`')
    expect(controlModel).toContain('`mode: solo | delegated | coordinated`')
    expect(controlModel).toContain('`status: running | waiting | completed`')
    expect(controlModel).toContain('Route, topology, lane result, `AcceptanceDisposition`, and `CloseoutEligibility` remain nested')
    expect(controlModel).toContain('Core owns `RouteDisposition`')
    expect(controlModel).toContain('`StopDisposition` values are exactly:')
    expect(controlModel).toContain('`AcceptanceDisposition` values are exactly')
    expect(controlModel).toContain('`CloseoutEligibility` values are exactly')
    expect(controlModel).toContain('Manage owns both packaged runtime forms and their transition contract in `skills/rsp-manage/references/managed-exchange.md`')
    expect(skillSystem).toContain('The Skill Control Model is the sole durable owner of transient control vocabulary')
    expect(skillSystem).not.toContain('`RouteDisposition` is exactly')
    expect(skillSystem).not.toContain('`StopDisposition` values are exactly')
  })

  it('keeps suite composition and capability ownership separate from runtime control fields', () => {
    expect(skillSystem).toContain('## Suite composition')
    expect(skillSystem).toContain('## Capability ownership')
    expect(skillSystem).toContain('## Progressive disclosure')
    expect(skillSystem).toContain('Each capability has one detailed procedure owner')
    expect(skillSystem).toContain('Published Skills are standalone')
    expect(skillSystem).not.toContain('AcceptanceDisposition')
    expect(skillSystem).not.toContain('CloseoutEligibility')
    expect(skillSystem).not.toContain('FrontierDisposition')
    expect(skillSystem).toContain('A reusable WorkerSession may receive successive non-overlapping WorkerInvocations')
    expect(skillSystem).toContain('worker-authored WorkerReceipt')
    expect(skillSystem).toContain('AcceptedLaneEvidence')
    expect(findSemanticUnit(skillSystem, ['rsp-manage', 'only suite capability', 'worker lanes', 'review convergence'])).toBeDefined()
    expect(findSemanticUnit(skillSystem, ['Core conditionally loads', 'Manage conditionally loads', 'Review conditionally loads'])).toBeDefined()
  })

  it('keeps language ownership conditional and preserves standalone evaluation evidence', () => {
    expect(core).toContain('[response language](references/response-language.md)')
    expect(responseLanguage).toContain('Response prose is user/session-owned')
    expect(responseLanguage).toContain('Existing artifacts retain their established language')
    expect(manage).toContain('response language')
    expect(manageInterruption).toContain('continuation')

    const cases = JSON.parse(readFileSync(join(evaluation, 'cases.json'), 'utf8'))
    const tokenCounts = JSON.parse(readFileSync(join(evaluation, 'token-counts.json'), 'utf8'))
    const report = readFileSync(join(evaluation, 'README.md'), 'utf8')
    expect(cases.map((item: { id: string }) => item.id)).toEqual([
      'normal-implement',
      'unexplained-diagnose',
      'risk-qualified-tdd',
      'missing-authority',
      'release-fallback-unconfirmed-unclean',
      'reopen-ambiguous-no-authority',
      'managed-status',
      'managed-pause',
    ])
    expect(tokenCounts.current.core_implement).toBe(3848)
    expect(tokenCounts.structural.core_implement).toBe(3386)
    expect(tokenCounts.combined.core_implement).toBe(3371)
    expect(report).toContain('does **not** establish behavior equivalence')

    for (const variant of ['current', 'structural', 'combined']) {
      const metadata = JSON.parse(readFileSync(join(evaluation, 'runs', variant, 'metadata.json'), 'utf8'))
      const score = JSON.parse(readFileSync(join(evaluation, 'runs', variant, 'score.json'), 'utf8'))
      expect(metadata).toMatchObject({ variant, exit_code: 1, usage: null, score_passed: false })
      expect(score).toEqual({ passed: false, parse_error: true, cases: [] })
      expect(hash(readFileSync(join(evaluation, 'inputs', variant, 'prompt.md')))).toBe(metadata.prompt_hash)
    }

    const verifiedReport = readFileSync(join(verifiedEvaluation, 'README.md'), 'utf8')
    expect(verifiedReport).toContain('`structural` and `combined` pass all eight')
  })
})
