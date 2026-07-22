---
kind: "research"
---

# Change: lightweight-rsp-manage/refine-explicit-controller

## Proposal
- Summary: Revise `rsp-manage` into an explicit-only lightweight controller for genuine long continuation, independent bounded delegation, and interruption recovery.
- Why:
  - The first candidate preserved authority and recovery correctness but matched baseline outcomes while adding 31.12% input tokens and 27.90% elapsed time.
  - The eight stable Skills now cover ordinary engineering; the remaining gap is autonomous continuation across genuinely independent slices without repeated user prompts.
- Scope:
  - Remove direct/assisted depth management and require an explicit managed-continuation request plus one focused, ready Change.
  - Add a discriminating independence gate, compact dispatch contract, bounded progress/retry loop, stale-evidence recovery, and truthful stop receipt.
  - Revise deterministic fixtures and candidate evaluation surfaces while keeping the Skill outside package discovery.
- Non-goals:
  - Promotion, implicit invocation, a durable controller state model, general project planning, or Git/publication/platform delivery.
  - Reproducing Core, Shape, Design, Implement, Diagnose, TDD, Review, or Address Review behavior inside the controller.

## Spec
### ADDED
- Requirement: managed orchestration activates only for explicit authorized work that benefits from continuation or delegation.
  - It consumes one focused, ready Change and rejects ordinary single-slice or tightly coupled work back to the existing Core/Discipline owner.
  - Eligible work has at least two independently bounded mutation/verification scopes, a genuinely long authorized continuation, or interruption recovery whose stale-evidence cost justifies orchestration.
- Requirement: an eligible managed run continues autonomously through bounded evidence-producing dispatches.
  - Each dispatch names WorkRef, objective, exact inputs, output, mutation scope, verification, stop conditions, and finite budget.
  - Independent scopes may run in parallel; overlapping scopes and dependent verification remain sequential.
  - After each return the controller inspects actual mutations and fresh verification, continues only on positive progress, and spends at most one default corrective retry for the whole run.
- Requirement: orchestration stops at existing authority and truth boundaries.
  - It never grants lifecycle, Git, publication, deployment, deletion, approval, environment, or human-acceptance authority.
  - It returns completed/pending slices, fresh verification and omissions, budget use, exact boundary owner, next action, and durable routing to existing owners without persisting controller truth.

### Acceptance
#### Scenario: explicit independent multi-slice continuation
- GIVEN a focused ready Change with two independently mutable and verifiable slices and explicit authority to continue
- WHEN `rsp-manage` runs with bounded worker capability available
- THEN it dispatches non-overlapping envelopes, verifies returned artifacts, and continues without another user prompt until completion or a real boundary
- AND it preserves unrelated work and returns all evidence to the same WorkRef

#### Scenario: ordinary work remains direct
- GIVEN a single slice or two changes sharing mutation and verification scope
- WHEN managed orchestration is requested
- THEN the independence gate declines controller overhead and returns the exact existing Core or Discipline next action

#### Scenario: recovery stalls or exhausts budget
- GIVEN an interrupted run whose receipt contains stale completion evidence
- WHEN fresh inspection finds one evidenced in-scope correction and then an unavailable human or environment gate
- THEN the controller spends at most the authorized retry, refreshes verification, and stops at the real owner with no fabricated completion

## Design
- Approach:
  - Independently revise the existing candidate using the prior evaluation's `revise` gate rather than adding another workflow layer.
  - Keep a short canonical candidate `SKILL.md`; put scenario discrimination in deterministic fixtures and forward tests rather than verbose tutorials.
  - Provenance: `research/models/rsp-matt-first-daily-capability-audit.md` D3; GSD report R1-R4; planning-with-files report R1-R5; Superpowers report R4; Matt report R4. Adoption mode `independent-reimplementation` with model-only constraints.
- Affected areas:
  - `research/candidates/skills/rsp-manage/`
  - `test/managed-controller/fixtures/` and controller contract tests
  - `scripts/managed-controller-eval.mjs` only where the revised seam requires it
- Constraints:
  - Keep the body below 600 whitespace-delimited words and remove non-portable canonical metadata.
  - No implicit trigger, hidden recursion, recursive Skill invocation, second lifecycle, or automatic durable promotion.
  - Preserve current RSP artifacts and explicit user/project authority as the only truth and mutation sources.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Write failing explicit-trigger, independence, progress/retry, recovery, and authority-restraint contracts
- [x] Revise the candidate to satisfy the lightweight controller contract
- [x] Run focused static/behavior validation and record context cost

## Verify
- Automated:
  - [x] `mise exec -- pnpm vitest run test/managed-controller-contract.test.ts`
  - [x] focused ESLint and Agent Skills validation
- Manual:
  - [x] Confirm ordinary/tightly coupled work declines managed overhead and an eligible run can continue without repeated user prompts.
- Durable updates:
  - [x] Decide whether this change produced durable knowledge that belongs in `.rsp/specs/` or stable instructions that belong in the nearest project-owned `AGENTS.md`
  - [x] No stable product writeback: the candidate remains research-only pending the promotion gate.

## Blockers
- none
