---
kind: "feature"
---

# Change: managed-goal-continuation/checkpoint-delivery

## Proposal
- Outcome: Checkpoint locally by policy and keep push explicit
- Why:
  - Long continuation benefits from clean recoverable Git boundaries, but push changes remote state and must remain a separately requested action.
- Scope:
  - Let an explicit managed goal authorize model-selected in-scope lifecycle closeout after durable review, independently from whether a local Git checkpoint is eligible.
  - Create local recovery checkpoints for continued work when the boundary is useful and nearer instructions do not reserve commits; keep terminal commit behavior proportional to task size and recovery value.
  - Stop terminal short work without an automatic commit unless Git delivery was separately requested.
  - Permit milestone push only when the user explicitly mentions push and the remote, branch, timing, and non-force boundary are unambiguous.
- Non-goals:
  - Do not auto-commit ordinary Core work, unrelated dirty paths, failed or unreviewed Changes, or terminal short work merely because Manage was available.
  - Do not infer push, force-push, tag, publication, deployment, merge, PR, or protected-branch authority.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: managed lifecycle closeout is independent from Git delivery
  - After a qualified Change passes verification and Core durable review, Manage runs `rsp archive <change-work-ref>` and inspects the complete lifecycle diff unless the user or nearest instructions reserve or deny lifecycle authority.
  - For a shallow Group, Manage independently completes durable review and `rsp archive <child-work-ref>` for every child, re-derives completion, and runs `rsp group close <group>` only after all children and the Group completion gate pass; it inspects the complete lifecycle diff after every mutation.
  - This lifecycle decision applies even when the owner is terminal or commit authority is denied; archive never supplies Git authority.
- Requirement: managed continuation may create local recovery checkpoints
  - When accepted downstream work remains, Manage may separately commit one independently reviewable Change or one integration-coupled wave if the user and nearest instructions permit managed checkpoints.
  - It stages exact paths, verifies the cached boundary, excludes unrelated work, and uses no checkpoint commit when a clean logical boundary cannot be proven.
  - When no downstream managed work remains, a small terminal Change or Group defaults to no commit. A terminal non-small owner commits only when explicit Git delivery or evidenced recovery value exists and nearest instructions permit it.
- Requirement: push is explicit-only and milestone-bound
  - Push authority exists only when the user explicitly mentions push and identifies or accepts an unambiguous current remote branch and milestone policy.
  - Once granted, Manage may push after a completed Group or final managed goal, or earlier only for required remote CI, recovery, or collaboration; it never force-pushes or treats commit authority as push authority.
  - Push failure preserves completed local commits and stops at the remote boundary.

### Acceptance
#### Scenario: a long goal checkpoints before continuing
- GIVEN accepted downstream work remains and managed checkpoint authority is allowed by the request and nearest instructions
- WHEN one Change or integration-coupled wave passes verification and durable review
- THEN Manage closes its lifecycle boundary, stages only its complete diff, commits it, and continues from freshly derived status
- AND it does not push without explicit push authority

#### Scenario: a terminal owner closes without a commit
- GIVEN a qualified final owner passes verification and durable review and lifecycle authority is allowed
- WHEN commit authority is denied or the owner is a small terminal task without separate delivery
- THEN Manage archives it, inspects the complete lifecycle diff, and stops without staging or committing

#### Scenario: a terminal shallow Group closes children before its brief
- GIVEN every direct child of a terminal shallow Group passes verification and independent durable review
- WHEN lifecycle authority is allowed but no commit is eligible
- THEN Manage runs `rsp archive <child-work-ref>` for each child and inspects each complete lifecycle diff
- AND it re-derives completion, requires every child and Group gate to pass, runs `rsp group close <group>`, inspects the complete Group lifecycle diff, and only then stops without staging or committing

#### Scenario: a terminal non-small owner needs independent commit justification
- GIVEN a qualified terminal non-small owner has completed lifecycle closeout
- WHEN no explicit Git delivery or evidenced recovery value exists, or nearest instructions deny commits
- THEN Manage stops without a commit
- AND it commits only when that separate justification exists and nearest instructions allow it

#### Scenario: an explicitly authorized milestone is pushed
- GIVEN the user explicitly requested push for an unambiguous working branch at Group or goal milestones
- WHEN that milestone has clean verified commits
- THEN Manage pushes normally once and continues or stops according to the goal
- AND any push failure stops without rewriting or discarding local commits

## Design
- Approach:
  - Model lifecycle closeout as qualified managed progress after durable review; evaluate local checkpoint permission only afterward, using continued work or a terminal non-small recovery/delivery need as separate evidence.
  - Reuse Core durable review and existing archive/Git safety instead of adding a delivery state machine.
- Boundaries:
  - Core owns durable review; `rsp archive` owns Change and child lifecycle mutation; `rsp group close` owns the completed shallow Group Brief transition; Manage selects checkpoint timing only after those lifecycle paths complete; Git and remote authority remain constrained by user and repository rules.
- Affected areas:
  - `skills/rsp/SKILL.md`, `skills/rsp-manage/SKILL.md`, and `skills/rsp/references/durable-review.md`
  - `rules/rsp-rules.md`, `.rsp/specs/design.md`, and `docs/design-philosophy.md`
  - managed-controller and Core authority contract tests
- Constraints:
  - Never override a nearer rule that requires separate commit approval; never stage broad globs; never push a protected or ambiguous branch, force-push, or make remote state a prerequisite for ordinary local continuation.

## Tasks
- [x] Add checkpoint eligibility, terminal no-commit, exact-boundary staging, and post-commit continuation semantics.
- [x] Add explicit-only milestone push, early-push exceptions, failure, and non-force boundaries.
- [x] Reconcile stable workflow truth and focused Git-authority contracts.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/managed-controller-contract.test.ts test/rsp-core-routing-contract.test.ts test/helpers.test.ts test/skill-contract.test.ts test/daily-workflow-product-surface.test.ts test/project-skill-dogfood.test.ts` — 95/95 passed; proves: Change archive commands, child-first shallow Group closeout, terminal Group command ordering, lifecycle-allowed/commit-denied, terminal commit qualification, explicit-only push, compact Skill metadata, fallback routing, and published product surfaces stay deterministic.
  - [x] `mise exec -- pnpm run build` and `mise exec -- pnpm run lint` — passed; proves: authored package build and project static checks remain valid.
  - [x] `node dist/cli.mjs check --focused` — all three focused Group Changes valid; proves: current dependency and artifact structure remains valid.
  - [x] `git diff --check` and `cmp -s rules/rsp-rules.md .rsp/rsp-rules.md` — passed; proves: changed text has no whitespace errors and authored rules match the self-hosted fallback.
- Manual or environment:
  - [x] Inspected final Core, Manage, durable-review, fallback, Spec, design-philosophy, and focused contract surfaces — Change and shallow Group closeout use their exact command paths and inspect each complete lifecycle diff before Git; continued work can checkpoint only at a proven clean boundary; terminal commit policy is size/recovery-aware; push stays explicit, milestone-bound, non-force, and failure-safe.
- Coverage:
  - No archive, commit, or push against the real repository; fresh isolated long-goal behavior belongs to `managed-goal-continuation/validate-long-goal`.
  - The full suite was not rerun because the known exact-package native composition evidence is intentionally stale after final Skill and rules changes; its immutable refresh belongs to `managed-goal-continuation/refresh-native-composition-evidence`.

## Review Resolution
- F1 (`P1`, lifecycle closeout was incorrectly coupled to continued-work commit eligibility): `accepted` — final Manage, Core, fallback, durable-review, Spec, docs, and focused contracts now close every qualified owner after durable review when lifecycle authority is allowed, independently from commit authority and terminal status.
- F2 (`P1`, shallow Group lifecycle lacked child-versus-Brief command semantics): `accepted` — Change owners now use `rsp archive <change-work-ref>` after Core durable review; shallow Groups independently durable-review and archive every child, re-derive completion, require all children plus the Group gate, then use `rsp group close <group>`.
- Correction: both lifecycle paths inspect the complete diff after every mutation before commit is evaluated; continued work may justify a recovery checkpoint, terminal small work defaults to no commit, and terminal non-small work requires explicit delivery or evidenced recovery value plus nearer-rule permission.
- Third fixed-scope re-review: clean; no remaining or new finding in the Core/Manage/fallback/Spec/docs/Change/test comparison. Push remains explicit-only, non-force, milestone-bound, and failure-safe.

## Blockers
- none
