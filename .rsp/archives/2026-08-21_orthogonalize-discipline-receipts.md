---
kind: refactor
---

# Change: orthogonalize-discipline-receipts

## Proposal
- Outcome: Orthogonalize Discipline receipt result, boundary, and evidence enums
- Why:
  - Current managed lane results such as `changed-same-scope`, `confirmed-same-scope`, and `boundary-changed` combine outcome and boundary dimensions, allowing contradictory or redundant receipts.
  - Verify additionally combines check outcome and evidence novelty in `failed-with-new-evidence` and `failed-without-new-evidence`.
- Scope:
  - Update the published Diagnose and Verify Skill contracts, the Manage-owned Inspect and Fix lane contracts, and the managed WorkerReceipt envelope.
  - Update the managed-controller evaluator machine descriptor, manifest schema, validator, holdout fixture, and contract tests.
  - Record the orthogonal Discipline receipt model in the maintainer-facing Skill Control Model Spec.
- Non-goals:
  - Renaming unrelated stable enums such as mode, status, route, dispatch, evidence status, or release claim.
  - Forcing all Disciplines into one shared result enum.
  - Rewriting archived Changes, historical research reports, or already-recorded evaluation evidence.
  - Preserving legacy compound values as accepted aliases.

## Spec
### MODIFIED
- Requirement: Each Discipline WorkerReceipt field expresses one dimension.
  - Fix result is exactly `changed | no-change`; Diagnose and Inspect result is exactly `confirmed | unresolved`; Verify result is exactly `pass | fail | unavailable`.
  - Boundary is independently exactly `unchanged | changed` and is never encoded as a Discipline result.
  - Verify alone requires `evidence_delta: new | none`; other lanes neither require nor accept that field.
  - Existing envelope enums remain `evidence_status: valid | invalid | unavailable` and `release_claim: released | retained | unavailable`.
- Requirement: Machine-consumed WorkerReceipts fail closed against the lane-specific v2 descriptor.
  - Every assignment declares its lane and allowed result domain.
  - The evaluator rejects legacy compound results, missing Verify evidence delta, and evidence delta on non-Verify lanes.
  - The v2 contract is an atomic cutover; no compatibility aliases or dual-write period are provided.

### Acceptance
#### Scenario: Fix receipt keeps outcome and boundary independent
- GIVEN a managed Fix assignment
- WHEN its worker returns a receipt
- THEN `result` is `changed | no-change`, `boundary` is `unchanged | changed`, and no compound legacy result is accepted

#### Scenario: Verify receipt reports evidence novelty separately
- GIVEN a managed Verify assignment
- WHEN its worker returns `result: fail | unavailable` or `result: pass`
- THEN it also returns `evidence_delta: new | none` independently from `boundary`

#### Scenario: Discipline vocabularies remain lane-owned
- GIVEN Diagnose, Inspect, Fix, and Verify lanes
- WHEN their contracts are rendered or validated
- THEN each lane retains its own result domain rather than a generic cross-Discipline enum

## Design
- Approach:
  - Replace compound result values at their owning Skill definitions and update Manage to compose the independent fields.
  - Extend the WorkerReceipt presentation with a Verify-only Evidence delta field.
  - Bump the evaluator machine contract from v1 to v2, add assignment lane metadata, and validate lane-specific fields after exact assignment correlation.
- Boundaries:
  - `result` expresses only the lane outcome; `boundary` expresses only whether the declared owner/path/interface/authority boundary changed.
  - `evidence_delta` expresses only whether Verify produced materially new evidence.
  - `evidence_status` continues to express receipt evidence validity/availability, not novelty.
- Affected areas:
  - `skills/rsp-manage/**`, `skills/rsp-diagnose/SKILL.md`, and `skills/rsp-verify/SKILL.md`.
  - `scripts/managed-controller-eval.*`, managed-controller fixtures and beta identity, and focused Skill/evaluator contract tests.
  - `.rsp/specs/skill-control-model.md` and the generated self-hosted fallback after rules synchronization when authored rules change.
- Constraints:
  - Published Skills cannot depend on repository-only `.rsp/` Specs.
  - Historical archives and research artifacts remain immutable evidence of their original protocol version.
  - Stable unrelated enums remain unchanged.

## Tasks
- [x] Update the durable Spec and published Discipline/Manage contracts to use orthogonal lane-owned result, boundary, and Verify evidence-delta fields.
- [x] Upgrade the managed-controller machine descriptor, manifests, validation, fixtures, and focused contract tests to v2 without legacy aliases.
- [x] Synchronize generated self-hosted rules if required by authored rule changes, then run fresh focused and repository verification. No authored rule changed, so no fallback synchronization was required.
- [x] Complete a fixed-scope review and resolve any in-scope findings.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skills/rsp-diagnose-skill-contract.test.ts test/skills/rsp-verify-skill-contract.test.ts test/skills/skill-contract.test.ts test/evaluation/managed-controller-contract.test.ts` — 4 files / 102 tests passed; proves: lane-owned Skill contracts and the v2 evaluator schema reject legacy or cross-lane values.
  - [x] `mise exec -- pnpm run build` — passed; proves: package sources compile into the distributable CLI.
  - [x] `mise exec -- pnpm run lint` — passed; proves: changed authored and evaluator code satisfies repository static policy.
  - [x] `mise exec -- pnpm run test` — 87 files / 913 tests passed after the independent `fix-verification-topology-inventory` Change corrected the stale architecture inventory.
  - [x] `git diff --check` — passed; proves: the final patch has no whitespace errors.
  - [x] `node dist/cli.mjs check --focused --json` — passed with only the expected `delta_markers_found` info diagnostic; proves: the selected Change remains structurally valid.
### Optional
- Manual or environment:
  - [ ] Post-change provider comparison — optional external/model coverage; omission does not block local acceptance.
- Coverage:
  - Focused static/evaluator contracts cover schema transport and lane semantics; the full suite covers adjacent Skill composition and release checks.
  - `test/evaluation/managed-controller-beta-contract.test.ts` passed 20/20 and `test/release/release-provider-comparison.test.ts` passed 28/28 after synchronizing the current product composition identity; no provider execution was run.
  - Fixed-scope re-review against `e0dd5ea` is clean after correcting the Diagnose impact-boundary wording and Change scope terminology.
  - Non-required `pnpm run typecheck` remains baseline-failing in existing evaluation/release test typings and is not completion evidence.

## Blockers
- none
