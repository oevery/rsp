---
kind: "fix"
---

# Change: layer-archive-closeout

## Proposal
- Outcome: Layer advisory archive guidance and managed closeout execution
- Why:
  - Deterministic readiness currently presents archive as an immediate CLI next action even though Core still owns semantic durable review.
  - The research-only managed controller stops before lifecycle closeout even when the user explicitly authorizes continuation through archive.
  - `rsp archive` prints a Git recipe that stages only the destination archive file and can omit the source deletion, focus cleanup, and archive-index update.
- Scope:
  - Keep `ready` and `show` as readiness inspection surfaces without successful archive `nextActions`.
  - Keep Core archive guidance advisory, and let the research `rsp-manage` candidate execute archive only under explicit lifecycle-closeout authority after Core gates pass.
  - Replace the incomplete post-archive Git recipe with authority-preserving full-lifecycle inspection guidance.
- Non-goals:
  - Promote `rsp-manage`, add a persistent state, automatically commit, or infer lifecycle/Git authority.
  - Change the `open -> archived` lifecycle or make `rsp archive` blocking.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: Archive guidance is layered by owner.
  - Successful `ready` and `show` results expose readiness and durable-review facts but no archive `nextActions`.
  - Core recommends explicit archive only after required durable decisions and does not execute it.
  - The research `rsp-manage` candidate may execute archive only when explicit managed authority includes lifecycle closeout and every Core archive gate passes; otherwise it stops with the advisory action.
- Requirement: Post-archive Git guidance preserves the complete lifecycle transition.
  - `rsp archive` does not recommend staging only the archive destination or issue a commit command.
  - In a Git worktree it asks the user or agent to inspect the full worktree and stage the intended lifecycle paths only under separate Git authority.

### Acceptance
#### Scenario: Readiness remains advisory
- GIVEN a deterministically ready Change whose durable decision is owned by Core
- WHEN an agent runs `rsp ready <name> --json` or `rsp show <name> --json`
- THEN the result contains readiness and durable-review facts without an archive `nextActions` field

#### Scenario: Managed closeout is explicitly authorized
- GIVEN an eligible managed run with explicit lifecycle-closeout authority and completed Core archive gates
- WHEN `rsp-manage` reaches terminal closeout
- THEN it may run the explicit archive action and verify the resulting RSP state without inferring Git authority

#### Scenario: Managed closeout lacks lifecycle authority
- GIVEN a managed run without explicit archive authority
- WHEN Core recommends archive
- THEN `rsp-manage` stops and returns that recommendation without mutating lifecycle state

#### Scenario: Git guidance covers archive effects
- GIVEN `rsp archive` moves a Change, clears focus, and rebuilds the archive index in a Git worktree
- WHEN it reports post-archive guidance
- THEN it requests fresh worktree inspection before separately authorized staging and does not print a destination-only `git add` or automatic commit recipe

## Design
- Approach:
  - Remove the successful archive action projection from `ready` and `show` while retaining the existing readiness contract.
  - Clarify Core's advisory boundary and add a narrow explicit-closeout branch to the research candidate without promoting it.
  - Make archive output describe the inspection/authority boundary rather than guessing the user's complete staging slice.
- Boundaries:
  - CLI owns deterministic facts; Core owns semantic recommendation; optional managed orchestration owns authorized continuation; the host/user owns Git delivery.
- Affected areas:
  - `src/commands/ready.ts`, `src/commands/show.ts`, `src/core/helpers.ts`, and `src/commands/archive.ts`
  - `skills/rsp/SKILL.md`, `rules/rsp-rules.md`, README files, and `.rsp/specs/design.md`
  - `research/candidates/skills/rsp-manage/SKILL.md` and focused contract/integration tests
- Constraints:
  - Preserve compact/pretty JSON equivalence, deterministic archive readiness, explicit archive mutation, unrelated work, and separate lifecycle/Git authority.
  - Keep `rsp-manage` research-only and within its compactness contract.

## Tasks
- [x] Remove premature CLI archive actions while preserving readiness output.
- [x] Clarify advisory Core guidance and explicit-authority managed archive execution.
- [x] Replace incomplete Git staging/commit instructions with full-lifecycle inspection guidance.
- [x] Align durable/public documentation and retained native-composition evidence with the final behavior.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/integration.test.ts test/helpers.test.ts test/managed-controller-contract.test.ts` — proves: 210 focused CLI, Core, archive-guidance, and research-controller tests passed after observed RED.
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run lint && mise exec -- pnpm run typecheck && mise exec -- pnpm run test` — proves: build, lint, typecheck, and all 363 tests passed.
  - [x] `node scripts/native-design-composition-eval.mjs` — proves: retained same-case real-host evidence passed all exact-package, phase, authority, integrity, and output gates for package `876b038279d1670b3f7b1337c1772b912130821a29e62950650fbe71d96c8642`.
- Manual or environment:
  - [x] Inspect ready/show JSON and post-archive human output in focused fixtures — proves: successful inspection output has no archive `nextActions`; archive output requests `git status --short` and separate Git authority without destination-only staging or commit instructions.
- Coverage:
  - No real Git staging, commit, or promoted managed run was performed because those operations remain out of scope. Two failed real-host attempts remain retained under `invalid-attempts/`; the accepted run records its corrected-oracle rescore provenance without rewriting the source attempt.

## Blockers
- none
