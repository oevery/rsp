---
kind: "fix"
---

# Change: decouple-managed-release-identity

## Proposal
- Outcome: Remove the accidental release-identity prerequisite from ordinary managed execution while preserving release-specific identity checks in their existing release and Commit owners.
- Why:
  - `skills/rsp-manage/SKILL.md` currently requires an explicit release identity for every transient `ExecutionFrame`, including implementation, recovery, and verification goals that have no release operation.
  - The stable control-model Spec defines the frame without a release identity, while `rsp-release-docs` and the `release` Commit owner already enforce identity only at the release boundary.
  - Leaving the unconditional sentence in place can make a valid selected managed goal stop on irrelevant release input or encourage an invented release identity.
- Scope:
  - Correct the authored `rsp-manage` contract so ordinary execution frames use only their canonical goal, owner, authority, baseline, location, resources, and acceptance surfaces.
  - Preserve explicit release identity requirements when a real release boundary or release Commit owner is active.
  - Add focused contract coverage that rejects an unconditional release-identity prerequisite in the managed execution-frame unit.
  - Compare exact current and candidate Skill identities through the existing candidate evaluator on the same bounded managed case before accepting the behavior change.
- Non-goals:
  - No change to Manage qualification, dispatch topology, closeout presets, Commit owner variants, release-document behavior, publication authority, or human acceptance.
  - No broad rewrite of `rsp-manage`, new control state, receipt, configuration, schema, or abstraction.
  - No change to the `long-running` metadata trigger without reproduced collision evidence; no broad provider/model matrix or high-risk control-flow evaluation.

## Spec
### MODIFIED
- Requirement: managed execution requires release identity only at a real release boundary.
  - An ordinary `ExecutionFrame` contains the canonical fields owned by the control model and does not require or invent release identity.
  - A release operation and the `release` Commit owner continue to require a confirmed release identity and release-boundary evidence.

### Acceptance
#### Scenario: execute a non-release managed Change
- GIVEN Core selected Manage for a ready implementation, recovery, verification, or review-convergence owner with no release operation
- WHEN Manage validates the handoff and derives its transient `ExecutionFrame`
- THEN execution proceeds without requesting, inferring, or inventing a release identity

#### Scenario: preserve release identity at its owner
- GIVEN a confirmed release operation or a `release` Commit envelope
- WHEN release documentation or exact local release commit work begins
- THEN the existing owner still requires the confirmed release identity and release-boundary evidence

## Design
- Approach:
  - Replace only the unconditional release-identity clause in the authored `rsp-manage` frame paragraph with an explicit non-inference boundary for non-release work.
  - Add a semantic contract assertion beside the canonical `ExecutionFrame` checks rather than duplicating release logic in Manage.
  - Use the existing managed evaluation producer and `skill-candidate-evaluation.mjs` comparison contract for exact current/candidate evidence.
- Boundaries:
  - `rsp-manage` owns managed execution frames; `rsp-release-docs` owns release identity for release operations; `rsp-commit` owns the exact `release` commit envelope.
  - The fix removes an unrelated prerequisite but grants no new mutation, lifecycle, Git, push, tag, publication, approval, or human-acceptance authority.
- Affected areas:
  - `skills/rsp-manage/SKILL.md`
  - `test/managed-controller-contract.test.ts`
  - Exact current/candidate evaluation evidence under the existing ignored or retained evaluation boundary, only as required by the evaluation contract.
- Constraints:
  - Edit authored `skills/**`, not `.agents/skills/**` projections.
  - Preserve the stable `ExecutionFrame` field set and all existing release/Commit identity checks.
  - Treat context counts and repeated prose as diagnostics only.

## Tasks
- [x] Add focused contract coverage for non-release managed execution-frame identity.
- [x] Correct the authored Manage contract without changing release-specific owners.
- [x] Run exact current/candidate comparison with the same bounded acceptance contract.
- [x] Run focused checks, update final evidence and Durable Decision, then run one complete Skill security plus release gate.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/managed-controller-contract.test.ts test/managed-controller-beta-contract.test.ts test/skill-runtime-context-contract.test.ts test/rsp-release-docs-skill-contract.test.ts test/rsp-commit-skill-contract.test.ts --maxWorkers=1` — passed 5 files / 105 tests; proves the canonical frame, release-owner checks, current composition lock, and conditional references remain coherent.
  - [x] Exact `HEAD` current composition `272186fb7913598117a7e1ed18f4fda2762ff8df5d568da44fa1b0d04283935f` versus candidate `2318b39b79d392384d4a0ed501363dbcffbef801a48bcbeb014961ab0dd71676` on `auto-multisurface-routing` contract `0303b585bef27638f92f1c7b0f308fd0f63ff5b0ae92354f389d2c9fdb9c4540` through `scripts/skill-candidate-evaluation.mjs managed-runs` — `candidate-eligible`; Trigger, Compliance, and Boundary stayed `passed`, task result improved from `failed` to `passed`, with no regression, candidate failure, or missing evidence.
  - [x] `mise exec -- pnpm run skills:security-check` and `mise exec -- pnpm run release:check` — passed on 2026-08-18: security scanned 40 files with 0 findings and 0 suppressions; metadata, 7 bilingual documentation pairs / 30 Markdown files, docs build, package build, typecheck, lint, 74 test files / 829 tests, and clean-install package verification all passed. The clean-install package was `@oevery/rsp@3.2.0` with SHA-256 `41a45e70ea71acd44425c27fd28742c179fd8cde984ca8d54461013ed21aecc7` and all 13 published Skills.
### Optional
- Manual or environment:
  - [-] Additional provider/model or downstream real-host evaluation — omitted because no provider-general performance claim or control-flow redesign is in scope.
- Coverage:
  - Scanner reported all 13 published package resources reachable; its single repeated-prose group is the intentional cross-Discipline response-language boundary, not a correctness defect.
  - The current provider run selected Manage but made zero worker dispatches and changed none of the five required paths; the candidate made two dispatches, changed exactly the five required paths, and passed both fixture tests. Cost observations increased, so this Change claims behavior correction only, not performance improvement.
  - Required evidence covers the exact contract correction, package reachability, current/candidate behavior, deterministic security checks, and the repository release gate.

## Blockers
- none

## Durable Decision
- Current facts: No current-fact update needed
- Current-fact target: N/A
- Facts to write: none; the stable control-model Spec already defines the correct `ExecutionFrame` fields
- Decision Record: No Decision Record needed
- Decision Record target: N/A
- Rationale to write: none; this is a bounded correction aligning the published Skill with existing owners and Specs
- Archive ready: yes
