---
kind: "fix"
---

# Change: support-direct-commit-boundaries

## Proposal
- Outcome: Allow rsp-commit to execute authorized direct Tiny/Small commit boundaries
- Why:
  - Core permits one concrete direct Tiny/Small action without inventing a Change, while the current `rsp-commit` contract accepts only Change, Group, or release owners.
  - The mismatch forces callers either to expose an internal capability rejection or to duplicate Commit's staging and receipt procedure as a supposed manual fallback.
- Scope:
  - Define one transient Commit envelope with `direct`, `change`, `group`, and `release` owner variants.
  - Let `rsp-commit` accept a confirmed direct boundary with exact paths, fresh verification, and explicit local commit authority.
  - Make lifecycle evidence and RSP trailers conditional on the selected owner variant.
  - Align Core routing, durable closeout guidance, stable Skill ownership Specs, and focused contract tests.
- Non-goals:
  - Do not make `rsp-commit` a general unbounded Git Skill or let it derive commit eligibility, product ownership, or authority.
  - Do not require Tiny/Small work to create a Change, persist a Commit envelope, or add a synthetic WorkRef.
  - Do not change `rsp commit` CLI staging or message transport behavior, archive policy, Manage eligibility, or remote delivery authority.

## Spec
### MODIFIED
- Requirement: Commit executes one Core- or Manage-derived owner boundary.
  - The transient owner variant is exactly one of `direct`, `change`, `group`, or `release`.
  - Every envelope contains exact allowed paths, fresh decisive verification, and current commit authority.
  - `direct` additionally contains a concise owner summary and is limited to a confirmed direct Tiny/Small boundary.
  - Change and Group variants carry their real WorkRefs and lifecycle evidence; release carries its confirmed release identity and evidence.
- Requirement: Commit metadata reflects the real owner without fabrication.
  - `RSP-WorkRef:` and `RSP-Group:` trailers are emitted only for owner variants that actually contain those identities.
  - A direct or release owner without included WorkRefs emits no synthetic RSP trailer.
  - The receipt reports owner kind and identity plus included WorkRefs only when present.
- Requirement: Capability refusal remains one fail-closed path.
  - A missing, ambiguous, stale, or unauthorized envelope stops before staging and reports the missing boundary condition.
  - Manual Commit fallback applies only when the capability is unavailable, not when an available Skill rejects its input.

### Acceptance
#### Scenario: Commit a direct Tiny/Small boundary
- GIVEN Core has confirmed one direct Tiny/Small result, exact paths, fresh verification, and explicit local commit authority
- WHEN Core routes a `direct` Commit envelope
- THEN `rsp-commit` stages and commits exactly that boundary without requiring lifecycle state or emitting an `RSP-WorkRef:` trailer

#### Scenario: Commit a tracked owner
- GIVEN a Change or Group boundary includes real WorkRefs and applicable lifecycle evidence
- WHEN Core or Manage routes that envelope
- THEN `rsp-commit` preserves its exact staging and receipt procedure and emits only the truthful RSP trailers owned by the envelope

#### Scenario: Reject an incomplete direct envelope
- GIVEN a direct request lacks exact paths, fresh verification, or explicit commit authority
- WHEN `rsp-commit` audits the envelope
- THEN it stops before staging and reports the missing condition without inventing a WorkRef or invoking a second manual implementation path

## Design
- Approach:
  - Revise `rsp-commit` around a named transient Commit envelope and an owner-variant table.
  - Keep owner qualification in Core or Manage, exact Git execution in Commit, and staged-message transport in the existing CLI.
  - Add the direct handoff to Core's direct route and make the durable-review fallback explicitly capability-unavailable-only.
- Boundaries:
  - A direct Commit owner is a transient delivery boundary, not an RSP durable WorkOwner or lifecycle state.
  - Commit validates supplied evidence against the checkout but never derives direct-versus-tracked routing or grants authority.
- Affected areas:
  - `skills/rsp-commit/SKILL.md` and focused contract tests
  - `skills/rsp/SKILL.md` and `skills/rsp/references/durable-review.md`
  - `.rsp/specs/skill-control-model.md` and `.rsp/specs/skill-system.md`
  - `test/managed-controller/beta/manage-orchestration-beta.yaml` current product-composition lock
- Constraints:
  - Preserve current exact staging, multiline message transport, post-commit comparison, issue-link, and no-remote-action guarantees.
  - Do not add a second receipt schema or modify the `rsp commit` CLI.

## Tasks
- [x] Revise Commit and Core contracts around the four owner variants and conditional lifecycle/RSP metadata.
- [x] Update stable Specs and focused tests for direct-boundary acceptance and fail-closed fallback behavior.
- [x] Refresh only the current managed-controller product-composition lock while preserving retained evaluation evidence unchanged.
- [x] Run focused Skill contract, Core routing, and repository consistency verification.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/rsp-commit-skill-contract.test.ts test/rsp-core-routing-contract.test.ts test/helpers.test.ts` — passed 3 files / 71 tests; proves: Commit owner variants, Core direct routing, and fallback guardrails remain explicit
  - [x] `mise exec -- pnpm exec vitest run test/managed-controller-beta-contract.test.ts` and `node scripts/managed-controller-beta.mjs contract` — passed 1 file / 16 tests and reported composition `a15ac635ce7c0c42c9623caf850a4cde785bd6ad8d20cc9bac6db610907e9fda`; proves: the current product composition is locked and prior retained evidence remains immutable
  - [x] `mise exec -- pnpm run build` — passed; proves: authored package sources remain buildable
  - [x] `mise exec -- pnpm run lint` — passed; proves: changed Skill, Spec, Change, and test surfaces satisfy static checks
  - [x] `VITEST_MAX_WORKERS=1 mise exec -- pnpm run test -- --no-file-parallelism` — passed 73 files / 819 tests after refreshing the current composition lock; proves: the complete repository suite remains compatible
  - [x] `git diff --check && node dist/cli.mjs check support-direct-commit-boundaries` — passed; proves: patch hygiene and Change validity
### Optional
- Manual or environment:
  - [ ] Run a provider-backed current-versus-candidate Skill evaluation — optional because this correction is covered by deterministic trigger, authority, and boundary contract tests and does not change Git execution code
- Coverage:
  - Required checks cover the direct positive path, tracked-owner compatibility, conditional metadata, incomplete-envelope stop, and unavailable-only manual fallback boundary.

## Blockers
- none

## Durable Decisions
- Commit accepts one transient `direct | change | group | release` owner envelope; owner qualification remains with Core or Manage.
- A direct owner is an exact Git delivery boundary rather than a durable WorkOwner, so it requires no Change, WorkRef, lifecycle state, or RSP trailer.
- Manual Commit fallback is permitted only when the capability is unavailable; an available Skill refusal returns its real missing envelope condition.
- The existing `rsp commit` CLI remains a staged-message Git mechanism and does not interpret RSP owner types.
- Current facts: Update existing Specs `.rsp/specs/skill-control-model.md` and `.rsp/specs/skill-system.md`; no new Spec is needed.
- Decision Record: No Decision Record needed because this resolves an ownership inconsistency without introducing a separate lasting tradeoff beyond the updated contracts.
