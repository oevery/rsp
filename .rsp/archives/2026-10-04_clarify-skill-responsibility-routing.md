---
kind: "fix"
---

# Change: clarify-skill-responsibility-routing

## Proposal
- Outcome: Select the correct responsibility at task transitions and retain only necessary work/evidence facts, especially during whole-Change convergence, without requiring users to name a Skill.
- Why: Retained task observations expose writing-route and convergence gaps; they do not establish a unique cause or repeated reliability.
- Scope: Authored Skill entrypoints and active writing/recovery methods, fallback, existing work/Workflow contracts and usage alignment, and task-based evaluation cases.
- Non-goals: A keyword router, mandatory phase sequence, host invocation-policy changes, Focus schema or CLI changes, capture-layer repair, historical artifact rewrites, Git delivery or publication.

## Spec
### MODIFIED
- Requirement: [Workflow](../specs/workflow.md) selects the current responsibility by requested result and authority, including transitions within one objective.
  - Core coordinates; Implement owns product corrections and ordinary checks; Shape clarifies material choices for the authorized DecisionOwner and owns planning artifacts, not approval or new public requirements; Doc owns writing and final whole-record convergence; Review owns fixed-scope judgment; Verify owns separately declared evidence; Commit retains separately authorized delivery.
  - Whole-record convergence uses Doc's artifact method when available, even when few lines change. Local wording or mechanical status/evidence updates needing no whole-record reconciliation remain direct. Existing standalone fallbacks, conditional loading, independent acceptance and authority ceilings remain unchanged.
  - Requirements and mandatory checks implement settled acceptance. Replaceable internal choices stay in Design; unsettled material public choices remain proposals or readiness blockers.
- Requirement: Select information before writing it.
  - [Work model](../specs/work-model.md) owns work-record placement and recovery snapshots.
  - Routine execution narration stays in the conversation without a new process-record file. Change updates carry necessary plan/contract changes, task outcomes, blockers and scoped verification conclusions.
  - Focus is an optional minimum recovery snapshot, updated only when safe future continuation needs it; its v1 format remains unchanged. Tool-owned or explicitly required evidence retains its existing owner and retention contract.
  - Whole-record convergence reconciles historical mixed content while preserving original verdicts, material failure dispositions, evidence applicability and remaining limits.
- Requirement: Acceptance-critical closeout commands retain observable results. Dependent lifecycle actions require passing evidence; later success cannot establish an earlier failed or unobserved check.

### Acceptance
#### Scenario: Natural closeout request
- GIVEN an implemented Change with justified knowledge writeback, synthetic supporting history and unrelated files
- WHEN normal closeout is requested without naming Doc
- THEN all six sections form one current outcome, material failures and limits remain, session narration is excluded and lifecycle/file authority is respected.

For this Change's acceptance, the owner accepts the current historical-convergence case's retained completed-Task session-count wording as a low-severity documentation limitation. The case remains failed under its unchanged rubric; no substantive contract, required-check, knowledge-writeback or lifecycle/authority failure is waived. This disposition is limited to this candidate and does not relax the normative writing contract or establish complete historical cleanup.

#### Scenario: Ordinary writing and recovery
- GIVEN tracked work with routine execution progress and a later recovery need
- WHEN recording work and preparing continuation
- THEN Change retains necessary results and evidence boundaries, ordinary narration remains in the conversation, Focus holds only needed recovery state and required evidence stays with its owner.

#### Scenario: Adjacent tasks
- GIVEN a local wording fix, design question, implementation correction or read-only review
- WHEN selecting or changing responsibility
- THEN produce the bounded result without an invented planning phase, unnecessary document rewrite, repair permission from review or independent-verification claim from ordinary checks.

## Design
- Put Doc beside Core's other responsibilities; select by current task/authority rather than prior Skill or edit size. Discriminate neighboring discovery descriptions only where needed.
- Core and Implement admit information at the write entry. Doc's artifact lens defines Tasks as work/completion and Verify as methods, scoped conclusions, limits and references; final convergence applies these roles across all six sections. Focus supplies only a recovery snapshot beyond existing Change/evidence. Mirror necessary standalone behavior in fallback without adding files, schemas or a runtime controller.
- Preserve required closeout observations: individually observed commands or fail-fast batches with per-command results; safely re-observe missing checks before dependent lifecycle actions. Retained source events and review copies agree on earlier missing output; no capture-layer defect is established and no runner repair is inferred.
- Reuse existing natural-task, negative-boundary and workflow cases. Retain the natural trigger prompts, synthetic complex-history archive input and local-wording case; preserve the mechanical archive-control Task prefix. Current validation selects ordinary implementation and historical archive convergence without changing inputs or scoring. Judge outcomes and authority, not wording or Skill-read fingerprints.
- Source baseline: `dc7b6ec1345985bc21466905629af0ad087dfe4a`. Earlier generic-Core and explicit-Doc observations remain private under `tests/skills/reports/archive-directed-20261004.cH0Fat/` and `archive-directed-doc-20261004.ZM77JE/`; neither accepts the current candidate.

## Tasks
- [x] Clarified responsibility entrypoints, document/tiny-edit callers and Shape decision authority.
- [x] Aligned authored fallback, Workflow and bilingual usage guidance with responsibility routing; Work model records writing admission and needs-based recovery.
- [x] Prepared natural-request, adjacent-restraint and historical-convergence cases using existing fixtures and graders.
- [x] Defined observable critical-check results and safe missing-result recovery before lifecycle closeout.
- [x] Applied writing admission and simplified Doc/Focus methods and standalone fallback while preserving retention, authority and historical-convergence requirements.
- [x] Established affected package/document checks and unchanged ordinary-implementation/archive offline readiness.
- [x] Executed selected current-candidate tasks and retained independent judgments in their evidence owner.
- [x] Established bounded candidate acceptance with the owner's accepted low-severity historical-Task wording limitation; preserved the failed model verdict.

## Verify
### Required
- [x] `mise exec -- pnpm run build` and the built CLI's `update` pass; generated fallback matches authored rules.
- [x] `skills:package-check` passes for all eight product packages; `skills:security-check` passes with zero findings.
- [x] `mise exec -- pnpm exec vitest run --no-file-parallelism tests/code/package` passes: 3 files, 9 tests. Earlier project controls remain applicable to unchanged code, harness and case inputs; they were not freshly executed.
- [x] `docs:check` passes for 7 bilingual pairs/29 Markdown files; lint and `git diff --check` pass. Focused RSP validation checks this work record, not model behavior.
- [x] Existing runner `plan` and `check` pass for `implement-ready-workflow` and `archive-final-convergence`, with unchanged input identities, zero provider calls and `behavioralAcceptance: not-run`.
- [x] Current-candidate [task evaluation](../../tests/skills/reports/writing-admission-20261004.2LJf4j/report.md) completed with parsed independent judgments and passing mechanical checks. Ordinary implementation passed with a qualified checksum self-report; historical archive convergence failed from a retained completed Task's session-count narration. Product/focused checking and lifecycle ordering are observed. Candidate, case/scoring, Git/worktree, prior-report and personal-input preservation checks pass.
- [x] Bounded acceptance disposition: ordinary writing restraint is supported for its selected task; the owner accepts the historical completed-Task wording residual as a low-severity documentation limit. The archive case remains failed, not a full behavioral pass. No repeated-reliability, causal-improvement or cost claim follows; broad Focus recovery and other model cases remain unexercised.
- [x] Final author consistency checks cover all six sections and their Workflow/Work model owners. Fresh `docs:check`, local AST-link inspection and `git diff --check` pass; offline `check` passes for the two workflow cases, local-wording case and ten changed natural-trigger cases with zero provider calls. Source, composition and harness identities still match the retained model candidate, so unchanged build/package/security/lint evidence remains applicable. These author checks are not independent acceptance or a new model run.

Retained observations remain bound to their original candidates:
- [Responsibility-routing evaluation](../../tests/skills/reports/routing-acceptance-20261004.Zixk4O/report.md): local wording, document review, ordinary implementation and review-only tasks passed; Shape failed and archive convergence was inconclusive.
- [Shape/archive evaluation](../../tests/skills/reports/routing-correction-20261004.h9Wcny/report.md): Shape planning passed with validation/capture limits; archive convergence failed from narration and unconfirmed individual final-check results.
- [Archive evidence-method evaluation](../../tests/skills/reports/archive-evidence-20261004.Et5qKI/report.md): product/focused checks and readiness are observed, but archive narration failed and the batch/recovery method was not fully followed.

These original verdicts are unchanged, do not accept the rewritten candidate and supply no repeated-reliability, causal-improvement or comparative-efficiency claim.

### Optional
- Context diagnostics for the three changed packages find no unreachable Markdown or exact cross-file prose repetition; counts are not quality gates.
- The host quick validator is unavailable because its Python environment lacks PyYAML; repository metadata/resource validation passes.
- Unchanged broader CLI/domain coverage is reused where applicable. Full-corpus behavior, cross-host discovery, repeatability and matched-cost studies remain outside the executed boundary.

## Blockers
- none
