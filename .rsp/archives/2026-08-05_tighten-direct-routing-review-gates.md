---
kind: "refactor"
---

# Change: tighten-direct-routing-review-gates

## Proposal
- Outcome: Make Core routing and review gates unambiguous so automatic Manage selects multi-surface completion work while true one-step work remains direct.
- Why:
  - `specialist` and `direct` are peer route values, but current prose does not clearly distinguish an explicitly bounded Discipline request from a one-step completion path that may use one Discipline executor.
  - Fixed-scope change review, implementation verification, and durable writeback judgment are distinct gates but current `durable review` wording can be read as one universal review operation.
  - Existing string contracts describe the automatic routing rule, but no unseen behavior holdout directly rejects a multi-surface tracked Change being executed as direct work.
- Scope:
  - Clarify `specialist` as an explicitly bounded Discipline operation and `direct` as the non-managed orchestration mode for one-step completion or continuation.
  - Define implementation verification, fixed-scope change review, and durable writeback decision as separate gates with explicit applicability.
  - Add one automatic multi-surface routing holdout and retain the ordinary-restraint holdout proving true small work remains direct.
  - Align the authoritative control/System Specs, Core and Manage Skills, public bilingual guidance, and focused contract tests.
  - Refresh the current Manage beta composition lock and retain one fresh immutable baseline/product generation for the changed Skill identity.
- Non-goals:
  - Remove `specialist` or `direct`, force every mutation through Manage, or require fixed-scope change review for every tiny direct action.
  - Change installation inventory, persisted lifecycle, `manage.activation` values, closeout ceilings, worker limits, or Git/publication authority.
  - Add runtime role metadata, a routing manifest, persisted controller state, or a numeric routing score.

## Spec
### MODIFIED
- Requirement: Core route and execution ownership remain separate.
  - `specialist` ends at one explicitly bounded Discipline result.
  - `direct` describes one non-managed completion path and may name exactly one Discipline executor without turning that executor into a controller.
  - `managed` remains the only route that composes worker lanes and review convergence.
- Requirement: Review-related gates have distinct names and obligations.
  - Implementation verification is required after every mutation.
  - Fixed-scope change review is required when explicitly requested, required by authority or risk, or used to derive managed `review-clean`; it is not automatically required for every tiny direct action.
  - Durable writeback decision is required before archive and decides current-fact and Decision Record updates independently from fixed-scope change review.
- Requirement: Automatic Manage routing is behaviorally guarded.
  - A tracked completion spanning multiple product or authority surfaces cannot be declined as direct merely because one writer can perform it sequentially.
  - A true one-owner, one-seam, one-pass, one-check action with no lifecycle coordination or ready successor remains direct.

### Acceptance
#### Scenario: Multi-surface tracked completion selects Manage
- GIVEN `manage.activation: auto` and one ready Change whose completion spans authoritative Specs, product presentation, public documentation, and multiple verification surfaces
- WHEN Core derives the prospective route
- THEN it reports `selected` for Manage even when mutation must be sequential and one implementation worker can own the writes

#### Scenario: True one-step work remains direct
- GIVEN one ready owner, one local seam, one mutation pass, one decisive check, no managed lifecycle coordination, and no ready successor
- WHEN Core derives the prospective route
- THEN it reports `declined` for Manage and does not require a fixed-scope change review unless separate authority or risk requires one

#### Scenario: Route and review terminology is unambiguous
- GIVEN the authoritative Specs, Core/Manage Skills, and public Skill guide
- WHEN a reader traces an implementation from route selection through archive
- THEN specialist ownership, direct orchestration, implementation verification, fixed-scope change review, and durable writeback decision remain distinguishable

## Design
- Approach:
  - Refine the existing control vocabulary rather than adding route values or another state model.
  - Keep the existing `durable-review.md` reference path for compatibility while naming its semantic operation the durable writeback decision.
  - Add a new unseen managed-controller holdout for multi-surface automatic selection and use the existing ordinary-restraint holdout as the direct counterexample.
- Boundaries:
  - Core owns route selection; a Discipline owns one bounded action; Manage alone composes lanes and derives managed review convergence.
  - Review remains report-only, Resolve Findings remains corrective, and durable writeback never substitutes for code/document review.
- Affected areas:
  - `.rsp/specs/skill-control-model.md` and `.rsp/specs/skill-system.md`
  - `skills/rsp/`, `skills/rsp-manage/`, and focused review/resolve wording where needed
  - `docs/site/en/guides/skills.md` and `docs/site/zh-CN/guides/skills.md`
  - Core-routing and managed-controller contract/holdout tests
  - `test/managed-controller/beta/manage-orchestration-beta.yaml` and one new retained generation under `research/evaluations/rsp-manage/`
- Constraints:
  - Preserve existing route enum values, authority boundaries, closeout behavior, dispatch limits, and default/optional inventory.
  - Do not rewrite retained evaluation outputs; new holdout evidence uses a new case identity.
  - Retain the fresh beta result under `2026-08-05-manage-orchestration-beta-routing-review-gates`; prior generations remain byte-for-byte unchanged.
  - Keep direct work proportional and avoid turning Review into a universal mutation tax.

## Tasks
- [x] Clarify specialist versus direct semantics in authoritative Specs and executable Skill contracts.
- [x] Separate verification, fixed-scope change review, and durable writeback terminology across managed acceptance and public guidance.
- [x] Add automatic multi-surface routing coverage while retaining the ordinary-restraint direct counterexample.
- [x] Run focused contract/holdout checks, docs checks, build, lint, and documentation build.
- [x] Refresh the beta composition lock, run the authorized baseline/product evaluation, and retain the new immutable evidence generation.
- [x] Rerun the complete repository verification after fixed-scope finding resolution.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/managed-controller-beta-contract.test.ts test/managed-controller-contract.test.ts test/rsp-core-routing-contract.test.ts test/skill-runtime-context-contract.test.ts` — passed: 4 files, 94 tests; proves route vocabulary, managed selection, review gates, beta identity, holdout preparation, and runtime composition remain aligned.
  - [x] `mise exec -- pnpm run docs:check` — passed: 7 bilingual page pairs and 29 Markdown files.
  - [x] `mise exec -- pnpm run build` — passed.
  - [x] `mise exec -- pnpm run lint` — passed.
  - [x] `mise exec -- pnpm run test` — passed: 55 files and 664 tests after fixed-scope finding resolution and beta-oracle reconciliation.
  - [x] `node scripts/managed-controller-beta.mjs run --model ocx/gpt-5.6-terra --effort high --timeout-ms 600000 --output-root .cache/rsp-manage-beta-2026-08-05-routing-review-gates-auto` plus deterministic re-score against the corrected oracle — passed: all 19 deterministic cases passed; `auto-multisurface-routing` baseline and product both reported `selected`, sequential dispatch, and passing `npm test`, with 5 and 10 aggregate tool calls, 129683 ms and 337149 ms elapsed respectively, and no unauthorized paths.
  - [x] `mise exec -- pnpm run docs:build` — passed: VitePress rendered the updated public terminology.
  - [x] `git diff --check` — passed after the final Change evidence update.
- Manual or environment:
  - [x] Inspected and executed the new `auto-multisurface-routing` holdout, then compared it with the retained `ordinary-restraint` manifest; the positive case reports `selected` plus sequential dispatch, while the counterexample remains an explicit decline with no mutation scope.
- Coverage:
  - Authoritative route model, executable Core/Manage contracts, acceptance gates, bilingual guidance, and positive/negative automatic-routing behavior.

## Blockers
- none
