---
kind: "feature"
---

# Change: managed-goal-composition/manage-change-groups

## Proposal
- Outcome: Manage shallow Change Groups by derived waves.
- Why:
  - A one-focused-Change gate pressures Shape to collapse independently closable outcomes into one omnibus owner and makes worker slices diverge from durable Change ownership.
- Scope:
  - Accept one explicitly selected ready Change or one explicitly selected shallow Group whose executable children are shape-ready.
  - Dispatch Group work by child WorkRef and derived `status.plan.waves` while preserving child verification and blockers.
  - Run shared or dependent integration sequentially and return child-level completion and pending boundaries.
- Non-goals:
  - Do not persist a wave plan, controller lifecycle, retry graph, receipt, or worker chronology.
  - Do not create nested Groups, silently select unrelated Groups, or infer worktree, branch, or Git authority.

## Spec
### ADDED
- Requirement: managed continuation preserves durable owner granularity.
  - A single Change remains eligible under the existing independent-slice, long-continuation, or recovery gate.
  - A selected shallow Group is eligible when at least two direct children are ready or an evidenced long/recovery path crosses its children.
  - Each Group dispatch names one executable child WorkRef; independent children may run in parallel only with non-overlapping mutations and independent verification.
  - Blocked children and later derived waves remain sequential, and at most one aggregate gate runs after combined mutation.

### Acceptance
#### Scenario: a Group contains independent and dependent children
- GIVEN an explicitly selected shallow Group whose status exposes ready children and dependency waves
- WHEN the user explicitly requests managed continuation
- THEN Manage dispatches only ready child WorkRefs in the current wave
- AND it re-derives readiness after accepted returns before continuing to the next wave
- AND child lifecycle, Git, publication, deployment, approval, and human acceptance remain separately authorized

## Design
- Approach:
  - Generalize the qualified owner from one focused Change to one selected Change or shallow Group.
  - Use Brief membership, child Blockers, and CLI-derived waves rather than a second orchestration model.
- Boundaries:
  - Group Brief owns the shared goal and completion contract; child Changes own implementation and focused evidence; Manage owns transient scheduling only.
- Affected areas:
  - `skills/rsp-manage/SKILL.md` and managed-controller contract fixtures.
- Constraints:
  - Retain four-dispatch and one-corrective-retry defaults across the whole managed run.
  - Shared-worktree mutations touching the same paths, lockfiles, generated artifacts, or broad integration outputs are not parallel-safe.

## Tasks
- [x] Add shallow Group qualification, child envelopes, derived-wave continuation, and child-level return semantics.
- [x] Add deterministic contracts for independent, dependent, blocked, and overlapping Group children.

## Verify
- Automated:
  - [x] `mise exec -- pnpm vitest run test/managed-controller-contract.test.ts` (17 tests passed) — proves: Group execution uses durable child owners and derived waves without new state, and retained product behavior evidence remains replayable.
- Manual or environment:
  - [x] Dogfooded `managed-goal-composition` after the Skill change by dispatching `route-managed-preflight` and `enforce-shape-owner-boundaries` as separate parallel WorkRefs, then re-read `rsp status --json` — proves: ready children can be managed without collapsing their durable owners.
  - [x] Fresh real-host product holdout `research/evaluations/rsp-manage/2026-07-25-product-group-waves/` — proves: only two first-wave child WorkRefs changed; shared lockfile overlap stayed sequential and unchanged; dependent and externally blocked children remained pending; status was re-read; no controller state or lifecycle action was created.
- Coverage:
  - Host-specific isolated worktree creation remains outside portable Manage; the Skill only states the authority and overlap gate.

## Review Resolution
- Finding #1 [P2] `新增 Manage Group 路径缺少行为级回归证据`: `accepted` — deterministic string assertions could not prove execution boundaries. Added the `group-waves` product holdout, fresh retained host evidence, and deterministic replay coverage for waves, changed paths, overlap, blockers, status reread, and lifecycle restraint.

## Blockers
- none
