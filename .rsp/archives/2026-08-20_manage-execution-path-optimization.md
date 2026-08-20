---
kind: "refactor"
---

# Change: manage-execution-path-optimization

## Proposal
- Outcome: Reduce unnecessary managed-execution context and repeated dispatch decisions while preserving all existing authority, acceptance, review, lifecycle, and delivery boundaries.
- Why:
  - The first provider comparison passed correctness and boundary checks, but candidate output tokens increased 19.93% and tool calls increased 18.18% against `v3.2.0`.
  - Previous prose-concision work already addressed broad repetition, templates, single-fact ownership, and table restraint; this Change targets execution-path behavior rather than another global rewrite.
- Scope:
  - Refine only the published `rsp-manage` entrypoint.
  - Make the normal selected-owner path explicit and defer low-frequency recovery, worker lifecycle, review, closeout, and provider details to existing conditional references.
  - Define a bounded incremental Assignment continuation path when WorkRef, authority, scope, seam, and acceptance surface remain unchanged.
  - Add only focused deterministic contracts and provider-observable evidence needed to prove fewer redundant qualification/dispatch actions without weakening required boundaries.
- Non-goals:
  - No change to Core route qualification, public canonical enums, worker receipt schema, review ownership, archive/commit authority, publication, or provider model.
  - No broad rewrite of `rsp`, `rsp-implement`, or existing reference documents.
  - No hard efficiency threshold based on one three-pair provider sample.

## Spec
### MODIFIED
- Requirement: The `rsp-manage` entrypoint shall make the common selected-owner execution path primary and load low-frequency procedures only when their trigger is present.
  - The entrypoint retains fail-closed guardrails for authority, scope, acceptance, receipt, and delivery boundaries.
  - Recovery, worker lifecycle, review convergence, closeout, and provider-specific detail remain reachable through their existing references and are not restated as default execution steps.
- Requirement: A same-session continuation may use an incremental Assignment only when the host-observed WorkRef, role, seam, writer, authority, scope, replay, verification target, and acceptance surface remain compatible.
  - Any session loss, identity change, authority drift, scope change, acceptance change, or recovery transition requires a fresh complete Assignment.
  - Continuation never grants authority, proves isolation, discharges independent verification, or permits lifecycle/Git/publication actions.
- Requirement: The optimization shall be evaluated on observable execution behavior, not line count.
  - Correctness, compliance, boundary, task-result, and required receipt behavior remain release gates.
  - Dispatch count, redundant checks, output size, token use, and elapsed time are diagnostic evidence unless a later Change establishes a supported threshold.

### Acceptance
#### Scenario: Common managed execution
- GIVEN a selected ready WorkRef with stable authority, scope, and acceptance
- WHEN Manage derives the next execution action
- THEN it follows the common path without loading or re-explaining inactive recovery, review, closeout, or provider procedures, while preserving the existing stop boundaries

#### Scenario: Compatible continuation
- GIVEN a host-confirmed active worker session and an unchanged WorkRef, role, seam, authority, scope, replay rule, verification target, and acceptance surface
- WHEN a same-goal successor is dispatched
- THEN Manage sends only the allowed incremental continuation and does not repeat complete qualification or invent a new worker obligation

#### Scenario: Incompatible continuation
- GIVEN any lost session, changed identity, authority drift, scope drift, changed acceptance, or recovery transition
- WHEN Manage resumes work
- THEN it requires a fresh complete Assignment and keeps acceptance incomplete until valid receipts and required evidence exist

## Design
- Approach:
- Keep the published entrypoint concise but readable: use short conditional trigger sentences and a default path, not a large mapping table or opaque mini-language.
  - Remove only reference-owned restatements after confirming the linked reference remains directly reachable.
  - State one compatibility predicate for incremental continuation and one fail-closed rule for incompatible continuation.
  - Add deterministic contract cases for inactive-reference deferral, continuation compatibility, and boundary preservation.
  - Re-run the provider comparison with the same baseline, model, effort, repetitions, and harness after deterministic checks pass.
- Boundaries:
- `rsp-manage` remains the owner of selected-goal revalidation, dispatch, receipt validation, acceptance, review convergence, lifecycle orchestration, and commit orchestration.
  - Existing conditional references remain canonical owners for detailed worker lifecycle, managed exchange, interruption/recovery, review convergence, and closeout procedures.
  - Core, `rsp-implement`, `rsp-review`, `rsp-commit`, and external publication boundaries are unchanged.
- Affected areas:
- `skills/rsp-manage/SKILL.md`
- focused managed-controller deterministic contracts and sanitized evaluation evidence only if required by the observable behavior
- Constraints:
- Preserve all canonical values, triggers, stop dispositions, receipt fields, and conditional-reference paths.
  - Do not add a runtime registry, persistent execution frame, numeric router, or new public package command.
  - Do not optimize by deleting required boundary language.

## Tasks
- [x] Snapshot current `rsp-manage` composition and focused contract behavior before mutation.
- [x] Refine the common-path and conditional-loading prose in `skills/rsp-manage/SKILL.md`.
- [x] Add or update only distinct deterministic contracts for continuation compatibility and inactive-reference deferral. Existing managed-controller contracts cover the behavior; the beta composition lock was refreshed for the changed published Skill source.
- [x] Run focused static/security/type/test checks and inspect the exact diff.
- [x] Run the serial release acceptance campaign.
- [x] Run the repeated provider comparison against `v3.2.0` and record diagnostic deltas without a hard threshold.
- [x] Perform fixed-scope review and resolve any findings before archive or commit.

## Verify
### Required
- Automated:
- [x] Focused managed-controller contracts — 3 files, 81 tests passed; the beta/provider focused contract run covered 2 files and 25 tests passed.
  - [x] `mise exec -- pnpm run typecheck` and `mise exec -- pnpm run lint` — both passed; `git diff --check` passed.
  - [x] Final focused Skill and managed-controller contracts after review fixes — 19 files / 176 tests passed; typecheck, lint, security, docs, RSP, and diff checks also passed.
  - [x] `mise exec -- pnpm run release:acceptance` — passed on 2026-08-20: 9/9 stages, 86/86 files, 860/860 tests, and packed installed-package workflows. Report: `.cache/release-acceptance/20260820T003524262Z-a8fc9ba4ff-36544/report.md`.
  - [x] `mise exec -- pnpm run release:provider-compare -- --baseline-ref v3.2.0 --repetitions 3 --model combo/gpt-5.6-terra --effort high --timeout-ms 600000` — passed 3/3 pairs on 2026-08-20; median input tokens +14.31%, output tokens -12.25%, total tokens +13.98%, tool calls -55%, and elapsed -27.29%. These are diagnostic deltas, not hard thresholds, and do not establish an overall token-efficiency improvement. Report: `.cache/release-provider-comparison/20260820T003735232Z-3205aba11a-12230/report.md`.
  - [x] Fixed-scope Code and Document re-review — clean after restoring the independent-Verify acceptance qualifier and the explicit cost/authority boundary; no findings remain.
### Optional
- Manual or environment:
  - [x] Provider comparison completed in the current environment; unavailable or incomplete runs would remain explicit and never be treated as a pass.
- Coverage:
- No cross-provider, model-general, publication, Windows, or human-acceptance claim is made by this Change.

## Blockers
- none
