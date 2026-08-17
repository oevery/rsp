---
kind: "refactor"
---

# Change: unify-execution-receipts-and-recovery

## Proposal
- Outcome: Give the default RSP entry one compact execution receipt, three user-facing execution modes, efficient primary-worker continuation, and a semantically validated Focus Capsule recovery projection.
- Why:
  - Current control ownership is sound, but user-visible progress can still repeat route, topology, lane result, acceptance, and closeout vocabulary instead of projecting one current receipt.
  - The existing execution topologies cover direct work, one reusable primary worker, and coordinated workers, but those three modes are not explicit and reused workers still receive a complete Assignment rather than a bounded delta.
  - Focus Capsule writes are atomically bounded and UTF-8 safe, but arbitrary unversioned Markdown remains accepted and the documented v1 fields are not parsed or projected for recovery.
- Scope:
  - Make `ControlOutcome` the single outer response receipt with one user-facing execution mode and one simple transient status progression.
  - Keep detailed route, topology, lane result, acceptance, and closeout values as nested phase-specific evidence rather than parallel status models.
  - Prefer compatible primary-worker reuse and allow a continuation Assignment to carry only changed fields after one complete initial Assignment; use efficiency only as a tie-breaker after safety and authority are equal.
  - Parse and validate non-empty v1 Focus Capsules, retain legacy content as warning-only compatibility, and expose a bounded read-only recovery projection through `rsp show --json`.
- Non-goals:
  - No persisted run state, receipt registry, worker registry, universal primary worker, token-budget routing, mandatory parallelism, new lifecycle state, automatic Git transfer, or recovery authority.

## Spec
### MODIFIED
- Requirement: one outer execution receipt owns user-visible progress and handoff.
  - `ControlOutcome` projects `workRef`, `mode: solo | delegated | coordinated`, `status: running | waiting | completed`, phase-specific outcome or stop reason, decisive evidence, changed artifacts when present, next owner/action, and recovery guidance when present.
  - Runtime status transitions are limited to `running -> waiting | completed` and `waiting -> running | completed`; route, topology, lane result, acceptance, and closeout remain nested gates or details rather than additional status flows.
- Requirement: execution mode is distinct from internal coordination strategy.
  - `solo` uses no worker, `delegated` uses one compatible primary WorkerSession, and `coordinated` uses multiple or independence-seeking workers. Existing Manage topologies remain internal strategies.
  - One complete initial Assignment establishes the worker boundary; a resumed compatible WorkerSession may receive an `AssignmentDelta` containing only the new objective and changed authority, read/write/verify, evidence, or stop fields. Omitted fields inherit only from the immediately accepted Assignment or AssignmentDelta in that same observed WorkerSession.
  - Token or context cost never changes authority, safety, acceptance, or completion, but may choose between otherwise equally safe strategies; compatible longitudinal reuse remains preferred when it avoids repeated settled context.
- Requirement: Focus Capsule v1 is a parsed portable recovery projection.
  - A new non-empty capsule write requires `<!-- rsp-focus:v1 -->` plus exactly one non-empty `Current`, `Evidence`, and `Next` field and at most one non-empty `Resume check`; invalid v1 writes fail atomically.
  - Existing unversioned bounded UTF-8 capsule content remains readable as legacy compatibility with a warning, while unknown or malformed version declarations fail closed and valid v1 content is projected structurally by JSON show output.
  - Capsule prose remains non-authoritative and may not persist worker identity, topology, authority, raw receipts, logs, diffs, or machine-specific paths.

### Acceptance
#### Scenario: a direct task reports one compact receipt
- GIVEN one ready bounded task needs no worker
- WHEN Core completes it through the default entry
- THEN the user-visible receipt reports `mode: solo` and one transient status without duplicating topology, acceptance, or closeout as parallel states

#### Scenario: compatible work reuses one primary worker efficiently
- GIVEN one WorkerSession has an accepted complete Assignment and the owner, role, seam, writer boundary, and strategy remain compatible
- WHEN Manage continues the next slice
- THEN it reports `mode: delegated` and may send only an `AssignmentDelta`, while independence or a material reasoning reset still creates a fresh worker

#### Scenario: coordinated work hides internal topology
- GIVEN several independent or acceptance-separated worker obligations
- WHEN Manage executes them sequentially, in a parallel wave, through read-only fan-out, or through independent Verify
- THEN the outer receipt reports `mode: coordinated` and retains the exact topology only as nested technical evidence

#### Scenario: a valid v1 capsule resumes through current evidence
- GIVEN a focused Change has a valid v1 Focus Capsule
- WHEN `rsp show --focused --json` reads it
- THEN output contains the parsed current, evidence, next, and optional resume-check fields without granting authority or claiming freshness

#### Scenario: malformed and legacy capsules remain safe
- GIVEN a replacement capsule is malformed v1 or an existing marker contains bounded legacy Markdown
- WHEN focus replacement or structural inspection runs
- THEN malformed v1 replacement fails without changing the prior marker, while legacy content remains readable with a stable warning and no structured recovery claim

## Design
- Approach:
  - Extend the existing `ControlOutcome` contract instead of creating another universal receipt, and classify the current mode by active worker shape while leaving topology in Manage.
  - Add `AssignmentDelta` only for an observed resumed WorkerSession and require complete re-dispatch after session loss or boundary invalidation.
  - Add one shared Focus Capsule parser/renderer used by focus mutation, check diagnostics, and show projection; preserve the existing 4096-byte, UTF-8, no-follow, lock, and atomic-replace boundaries.
- Boundaries:
  - Core owns the outer receipt and execution mode projection; Manage owns topology, WorkerSession continuity, Assignment/AssignmentDelta, lane receipts, acceptance, and recovery write timing.
  - CLI owns capsule parsing, safe mutation, diagnostics, and read-only projection; the focused Change remains the durable owner and marker path remains the sole selection truth.
- Affected areas:
  - Skill Control, Core, CLI, and Skill-system Specs; authored Core/Manage/Verify contracts; bilingual Skill and concepts guidance; managed-controller fixtures and holdouts.
  - Focus Capsule core parser, focus/check/show command surfaces, CLI contracts, integration tests, and generated self-hosted fallback synchronization.
- Constraints:
  - Preserve standalone published Skills, host neutrality, phase-specific result ownership, `open | archived`, optional empty focus markers, legacy capsule readability, and no hidden runtime state.

## Tasks
- [x] Unify the outer `ControlOutcome` receipt and three execution modes across Specs, authored Skills, docs, and deterministic contracts.
- [x] Add compatible `AssignmentDelta` continuation and efficiency tie-break language without weakening fresh-worker or independent-Verify boundaries.
- [x] Implement shared Focus Capsule v1 parsing, atomic write validation, legacy warnings, and JSON show recovery projection.
- [x] Add focused runtime coverage for capsule validation, compatibility, projection, and atomic failure.
- [x] Add focused contract coverage for receipt modes and worker reuse/delta rules.
- [x] Converge CLI Specs/reference docs and authored fallback, build, synchronize the generated self-hosted fallback, and run focused verification.
- [x] Run full project verification and classify the isolated managed-controller beta composition drift.
- [x] Refresh the immutable provider-backed beta identity for the current receipt/recovery composition and lock only its bounded retained evidence.
- [x] Rerun full project verification after the bounded beta evidence-lock repair.

## Verify
### Required
- Automated:
  - [x] `VITEST_MAX_WORKERS=1 mise exec -- pnpm exec vitest run test/rsp-core-routing-contract.test.ts test/skill-runtime-context-contract.test.ts test/managed-controller-contract.test.ts test/integration.test.ts` — 4 files and 272 tests passed; proves the outer mode/status receipt, nested topology/gates, primary-worker AssignmentDelta continuation, fresh-worker exceptions, strict v1 grammar, legacy compatibility, atomic preservation, and bounded recovery projection.
  - [x] `VITEST_MAX_WORKERS=1 mise exec -- pnpm exec vitest run test/skills-install.test.ts` and `VITEST_MAX_WORKERS=1 mise exec -- pnpm exec vitest run test/helpers.test.ts` — 21 and 58 tests passed; proves packaged Skill inventory compatibility and the updated authored Core Skill CalVer contract.
  - [x] `VITEST_MAX_WORKERS=1 mise exec -- pnpm exec vitest run test/focus-capsule-public-contract.test.ts test/rsp-core-routing-contract.test.ts test/helpers.test.ts` — 3 files and 67 tests passed; proves CLI Spec, bilingual CLI reference, fallback outer receipt/v1 recovery contract, and self-hosted fallback synchronization. The final title-only lint correction was rerun with the public-contract file alone: 1 file and 3 tests passed.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm run docs:check` — passed; docs check covered 7 bilingual page pairs and 30 Markdown files.
  - [x] `node dist/cli.mjs update` and `node dist/cli.mjs skills list --json` — updated `.rsp/rsp-rules.md` from authored `rules/rsp-rules.md`; all 12 default Skills plus optional `rsp-structural-audit` reported `unchanged`.
  - [x] `VITEST_MAX_WORKERS=1 mise exec -- pnpm exec vitest run test/integration.test.ts test/managed-controller-contract.test.ts test/focus-capsule-public-contract.test.ts` — first review-correction pass: 3 files and 266 tests passed; proves AssignmentDelta chain wording, strict unsupported/damaged version rejection through focus/check/show, atomic preservation, and the public recovery contract. `VITEST_MAX_WORKERS=1 mise exec -- pnpm exec vitest run test/integration.test.ts test/managed-controller-beta-contract.test.ts` then passed 2 files and 216 tests after narrowing reserved-declaration detection and protecting every retained provider generation before output creation.
  - [x] `node scripts/managed-controller-eval.mjs contract` — all 22 deterministic managed-controller contracts passed against current product composition `85ab85631827c838b3811405b4c71292a1374abe04fdcb8f68784b48100b9e3b`.
  - [x] `node scripts/managed-controller-beta.mjs run --model combo/gpt-5.6-terra --effort high --timeout-ms 600000 --output-root .cache/rsp-manage-beta-2026-08-16-unified-execution-receipts-recovery-review-fixes` — baseline and product both reached `contract-passed`; retained only bounded `report.md` and `summary.json` under `research/evaluations/rsp-manage/2026-08-16-unified-execution-receipts-recovery-review-fixes/`. Retained report SHA-256 is `03c6edcc937afd41ab98d227b20ae11a005418a39a47c83be257d0f3f306830e`; retained summary SHA-256 is `e975183079a9ed290016afaf4900e0ab078a7c5ddf9efcd4886c15d3c94b0b46`; plan hash is `208a6c64803193a0a82a887bfa5ca94a4b64ac2b72d41a1cf3ef1da72ac4de55`. The summary truthfully retains one product intermediate trigger-dimension mismatch before the final receipt and harness passed; it supports no promotion or performance claim. Raw provider output remains ignored under `.cache/`, and the prior generation remains unchanged.
  - [x] `VITEST_MAX_WORKERS=1 mise exec -- pnpm exec vitest run test/managed-controller-beta-contract.test.ts test/managed-controller-contract.test.ts test/skill-runtime-context-contract.test.ts` — 3 files and 84 tests passed; proves current composition, old and current immutable retained hashes, output-boundary rejection, aggregate evidence sanitization, and WorkerSession/AssignmentDelta contracts.
  - [x] `VITEST_MAX_WORKERS=1 mise exec -- pnpm run test` — final post-review-correction complete-suite rerun passed: 72 files and 807 tests.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `mise exec -- pnpm run docs:check`, and `mise exec -- pnpm run release:metadata-check` — final convergence rerun passed; docs check covered 7 bilingual page pairs and 30 Markdown files, and release metadata matched `@oevery/rsp@3.2.0`.
  - [x] `git diff --check`, `mise exec -- node dist/cli.mjs check --focused --json`, and `mise exec -- node dist/cli.mjs skills list --json` — passed; focused inspection reported 0 errors and 0 warnings, and all 12 default Skills plus optional `rsp-structural-audit` reported `unchanged`.
### Optional
- Manual or environment:
  - [x] One bounded provider evaluation — completed for `combo/gpt-5.6-terra`; it adds confidence for this one holdout and makes no provider-general or real-host-general claim.
  - [ ] Additional provider or cross-device host evaluation — remains optional and is not implied by the retained generation.
- Coverage:
  - Required coverage includes runtime capsule behavior plus deterministic Skill contracts; optional evaluation adds confidence but does not replace either.

## Blockers
- none
