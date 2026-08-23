---
kind: "refactor"
---

# Change: skill-context-optimization-followup/progressive-manage-disclosure

## Proposal
- Outcome: `rsp-manage` loads interruption, convergence, and closeout detail only for routes that need them.
- Why:
  - Manage is not active on ordinary direct work, but its inactive procedures amplify the default context surface.
- Scope:
  - Establish explicit trigger-to-reference ownership and preserve selected, declined, worker, recovery, and closeout boundaries.
- Non-goals:
  - Changing Manage qualification, worker authority, lifecycle policy, or release/commit behavior.

## Spec
### MODIFIED
- Requirement: Inactive Manage procedures remain independently reachable but are not loaded before their trigger is established.

### Acceptance
#### Scenario: Direct route does not preload Manage detail
- GIVEN Core selects direct and no recovery, coordination, worker, or closeout branch is active
- WHEN the route is evaluated
- THEN Manage detail is not read and direct authority remains unchanged

#### Scenario: Managed route reaches its detail
- GIVEN Manage is selected or an interruption, convergence, worker, or closeout branch is active
- WHEN the branch executes
- THEN the owning reference is read and behavior remains equivalent to current HEAD

## Design
- Approach:
  - Prefer existing Manage references; add a Markdown reference only when it owns one coherent low-frequency branch.
- Boundaries:
  - New files are allowed; unconditional reads on ordinary routes are not.
- Affected areas:
  - `skills/rsp-manage/SKILL.md` and directly owned references
  - Manage contracts and provider fixtures
- Constraints:
  - Preserve serial provider fail-fast and required-worker/independent-Verify boundaries.

## Tasks
- [x] Map Manage reference ownership: interruption/status/pause/recovery → `interruption-recovery.md`; same-scope correction and fixed-scope Findings convergence → `review-convergence.md`; eligible lifecycle/recovery-checkpoint/push delivery → `closeout.md`.
- [x] Move only inactive branch detail behind explicit conditions while retaining the selected-goal, worker-authority, acceptance, recovery, lifecycle, and Commit boundaries.
- [x] Run direct, managed, recovery, and closeout holdouts plus repository gates.
  - Deterministic Manage contracts, branch-specific holdout manifests, build, lint, the serial provider campaign, and the unified full suite passed.
  - The unavailable-capability comparison remained fail-closed in both baseline and product; it is boundary evidence, not a successful execution claim.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skills/skill-runtime-context-contract.test.ts test/evaluation/managed-controller-contract.test.ts test/architecture/documentation-contract.test.ts test/skills/daily-workflow-product-surface.test.ts test/skills/artifact-continuation-contract.test.ts test/evaluation/skill-evaluation-observability.test.ts` — 6 files / 54 tests passed; proves conditional reference ownership plus existing routing, worker, recovery, and closeout boundaries.
  - [x] `mise exec -- pnpm exec vitest run test/evaluation/managed-controller-contract.test.ts test/evaluation/skill-evaluation-observability.test.ts test/skills/skill-runtime-context-contract.test.ts` — 3 files / 36 tests passed after aligning ordinary, interruption, convergence, and closeout `expected_resources`.
  - [x] `prepareManagedControllerRun(..., variant: "product")` for `auto-multisurface-routing`, `pause-resume`, `review-convergence`, and `auto-lifecycle-current` — all manifests and declared installed-Skill reference paths validated without provider execution.
  - [x] Provider direct and managed holdouts with default local routing, `combo/gpt-5.6-terra`, and `high` effort — 8 baseline/product arms passed across `auto-integrated-direct`, `auto-multisurface-routing`, `pause-resume`, and `auto-lifecycle-current`. Direct and ordinary managed routes did not observe Manage low-frequency references; pause/resume observed `interruption-recovery.md`; lifecycle closeout observed `review-convergence.md` and `closeout.md`. Some expected Core resources were absent from host event capture and remain observability omissions rather than inferred reads.
  - [x] `mise exec -- pnpm run build` — passed.
  - [x] `mise exec -- pnpm run lint` — passed.
  - [x] `mise exec -- pnpm exec vitest run test/release/release-provider-comparison.test.ts --reporter=dot --no-file-parallelism` — passed 1 file / 37 tests after refreshing the candidate composition and default holdout manifest identity locks.
  - [x] `mise exec -- pnpm exec vitest run --no-file-parallelism --reporter=dot` — passed 89 files / 880 tests after review corrections and all first-wave slices merged.
### Optional
- Manual or environment:
  - [x] Recovery provider run plus unavailable independent-Verify boundary comparison — pause/resume preserved the recovery reference trigger; `capability-masked-host` baseline and product both stopped fail-closed with no changed or unauthorized paths. The fixture's required verification was unavailable, so this is boundary coverage rather than completed independent Verify.
- Coverage:
  - `scan-skill-context.mjs`: all 4 Manage Markdown files remain reachable with none unreachable; package diagnostics are 2,572 words versus the 2,546-word baseline.
  - Routinely loaded `skills/rsp-manage/SKILL.md`: 1,460 words / 11,159 bytes versus 1,493 words / 11,451 bytes at HEAD; the 33-word and 292-byte reductions are diagnostic only.

## Blockers
- none
