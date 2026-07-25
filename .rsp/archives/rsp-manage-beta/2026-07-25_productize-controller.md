---
kind: "feature"
---

# Change: rsp-manage-beta/productize-controller

## Proposal
- Outcome: Promote a compact, explicit-only `rsp-manage` Skill for low-overhead continuation across genuinely independent slices.
- Why:
  - The research candidate proved bounded parallel mutation and recovery safety, but it remains package-excluded and added avoidable orchestration cost and process-heavy output in synthetic comparisons.
- Scope:
  - Add a product-owned Skill that preserves the proven authority and recovery boundary while minimizing repeated reads, verification, user-visible dispatch ceremony, and process artifacts.
  - Integrate explicit managed routing, package inventory, installed discovery, and focused public-contract coverage.
- Non-goals:
  - Implicit invocation, persistent controller state, replacing Core or Discipline Skills, npm publication, boats-cloud mutation, or claiming a real-project advantage before beta dogfooding.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: eligible managed continuation is explicit, bounded, and economical
  - `rsp-manage` activates only after an explicit request and one focused ready Change qualifies through independent mutation and verification scopes, genuinely long continuation, or interruption recovery.
  - An ineligible run performs no mutation and emits no dispatch envelope, receipt, budget, or controller state; it returns the exact Core or Discipline next action.
  - An eligible run snapshots stable authority once, sends compact envelopes only to actual workers, runs the cheapest decisive check per slice and one broader gate only when integration risk requires it, and rereads stable authority only during recovery or evidenced drift.
- Requirement: managed progress remains transient
  - Dispatch, retry, budget, and process chronology stay out of Changes, Specs, and user-facing final output; selected artifacts retain only converged requirements, outcomes, decisive evidence, omissions, and real blockers.
  - The final result reports completed and pending slices, fresh verification, omissions, the real boundary owner, and one next action without granting archive, Git, publication, deployment, or human-acceptance authority.

### Acceptance
#### Scenario: eligible independent work continues with bounded overhead
- GIVEN an explicit managed-continuation request and a focused ready Change with two non-overlapping mutation and verification scopes
- WHEN `rsp-manage` dispatches available workers and integrates their returns
- THEN each worker receives only its bounded internal envelope, returned mutations and focused checks are inspected, integration receives at most one necessary broader gate, and no process diary is persisted or replayed to the user

#### Scenario: ordinary work stays direct
- GIVEN an explicit manage request for one small slice or tightly coupled scopes
- WHEN the eligibility gate runs
- THEN no mutation or controller artifact is created and the exact existing Core or Discipline next action is returned

#### Scenario: recovery stops at current truth and authority
- GIVEN an interrupted run with stale evidence or an evidenced worktree or authority drift
- WHEN managed continuation resumes
- THEN current authority and evidence are reread, unverifiable completion returns to pending, the finite correction budget is enforced, and unavailable environment, human acceptance, lifecycle, Git, or publication authority remains a truthful stop

## Design
- Approach:
  - Preserve `research/candidates/skills/rsp-manage/` and its retained evaluation hashes as historical evidence; author the refined product contract independently under `skills/rsp-manage/`.
  - Extend existing deterministic controller fixtures only for the new overhead and artifact-hygiene boundaries, then update installed-suite and Core-routing contracts.
- Boundaries:
  - `skills/rsp-manage` owns optional managed behavior; `skills/rsp` owns routing; existing RSP artifacts retain durable truth and lifecycle ownership.
- Affected areas:
  - `skills/rsp-manage/`, `skills/rsp/SKILL.md`
  - managed-controller fixtures and Skill inventory/discovery tests
- Constraints:
  - Preserve the four-dispatch and one-corrective-retry default ceiling, non-overlapping parallelism, fail-closed recovery, and explicit lifecycle/Git/publication boundaries.
  - Do not mutate or replace retained research evidence and do not add a new orchestration runtime, schema, receipt store, or broad evaluation matrix.

## Tasks
- [x] Add the refined product-owned `rsp-manage` Skill and explicit Core route without changing historical candidate evidence.
- [x] Extend focused contracts for zero-overhead decline, conditional authority rereads, minimal verification, transient process data, and concise final output.
- [x] Update package Skill inventory and clean-install discovery expectations from nine to ten Skills.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/managed-controller-contract.test.ts test/rsp-core-routing-contract.test.ts test/skill-contract.test.ts test/project-skill-dogfood.test.ts test/clean-install-check.test.ts test/daily-workflow-product-surface.test.ts` — 6 files and 34 tests pass, covering the product contract, Core route, portable ten-Skill inventory, dogfood projection, and exact-tarball clean installation.
- Manual or environment:
  - [x] Inspected the eligible and declined prompt contracts against the exact-tarball clean-install result: eligible work gets compact internal envelopes and bounded verification; declined work returns the direct Core or Discipline path without mutation or controller artifacts; neither path persists or returns process chronology. No host/model execution was required for this static Skill contract.
- Coverage:
  - Real boats-cloud value and npm-registry installation remain beta follow-up evidence; this slice proves the distributable contract, not a production advantage.

## Blockers
- none
