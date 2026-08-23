import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { findSemanticUnit, markdownLinks } from '../support/markdown-contract'

const root = fileURLToPath(new URL('../..', import.meta.url))
const read = (path: string) => readFileSync(join(root, path), 'utf8')
const core = read('skills/rsp/SKILL.md')
const controlOutcome = read('skills/rsp/references/control-outcome.md')
const manage = read('skills/rsp-manage/SKILL.md')
const interruption = read('skills/rsp-manage/references/interruption-recovery.md')
const reviewConvergence = read('skills/rsp-manage/references/review-convergence.md')
const closeout = read('skills/rsp-manage/references/closeout.md')
const controlModel = read('.rsp/specs/skill-control-model.md')
const skillSystem = read('.rsp/specs/skill-system.md')

describe('skill runtime context composition', () => {
  it('keeps inactive Core procedures behind direct references', () => {
    expect(markdownLinks(core)).toEqual(expect.arrayContaining(['references/response-language.md', 'references/control-outcome.md', 'references/managed-routing.md', 'references/reopen-recovery.md', 'references/durable-review.md']))
    expect(markdownLinks(core)).not.toContain('references/contract-kernel.md')
  })

  it('keeps only low-frequency Manage procedures conditional', () => {
    expect(markdownLinks(manage)).toEqual(expect.arrayContaining(['references/interruption-recovery.md', 'references/review-convergence.md', 'references/closeout.md']))
    expect(markdownLinks(manage)).not.toEqual(expect.arrayContaining(['references/managed-exchange.md', 'references/host-worker-lifecycle.md']))
    expect(findSemanticUnit(closeout, ['Load this reference', 'CloseoutEligibility'])).toBeDefined()
    expect(reviewConvergence).toContain('same Finding remains after two completed corrections')
    expect(interruption).toContain('Cancelling the caller\'s wait does not itself stop accepted work')
  })

  it('keeps ordinary delegation small and host facts separate', () => {
    expect(manage).toContain('A delegated task includes only what the worker needs to act safely')
    expect(manage).toContain('Treat three evidence sources separately')
    expect(manage).toContain('Host facts are capabilities and observations, not RSP domain objects')
    expect(manage).toContain('Manager must not author, repair, reconstruct, or substitute the missing worker result')
    expect(controlOutcome).toContain('Raw worker messages, host events, retry chronology, and unaccepted evidence never appear')
  })

  it('keeps durable ownership free of runtime and evaluator protocols', () => {
    expect(controlModel).toContain('Manage adds no universal worker receipt schema')
    expect(skillSystem).toContain('Hosts own worker execution, identity, continuation, cancellation, isolation, concurrency, and lifecycle observations')
    expect(skillSystem).toContain('Evaluators and adapters own machine schemas, correlation, parsing, event extraction, and provider scoring')
    expect(skillSystem).toContain('Internal evaluation formats must remain lightweight implementation details')
    for (const token of ['WorkerSession', 'WorkerInvocation', 'WorkerReceipt', 'AcceptedLaneEvidence', 'ResourceLease', 'AssignmentDelta']) {
      expect(controlModel).not.toContain(token)
      expect(skillSystem).not.toContain(token)
    }
  })
})
