---
kind: "feature"
---

# Change: natural-workflow-evaluation

## Proposal
- Outcome: Evaluate natural-request completion, owner-decision restraint and recovery of staged work using discriminating public catalog scenarios.
- Why: Named-Skill smoke cases do not prove a model completes authorized work from natural intent, and boolean-export fixtures do not exercise synchronization between source and generated consumer artifacts.
- Scope: Three case packages, one shared host-owned catalog oracle, focused engine controls, evaluation documentation and the separately authorized Sol execution/Astra blind-review baseline. Reuse existing direct-work and interrupted-verification cases. Correct one inline-code Markdown marker in the preceding SkillOpt research report to restore the repository lint baseline; its research conclusion is unchanged.
- Non-goals: Product Skill changes, new runners or multi-turn protocol, upstream research-baseline acceptance, release-suite expansion, independent holdouts or remote delivery.

## Spec
### ADDED
- Requirement: The same natural prompt must lead to completion or a bounded owner question according to project evidence, not an answer embedded in the prompt.
- Requirement: Completion requires correct source and generated storefront data plus current owner readiness; stopping after a plan or claiming completion cannot pass.
- Requirement: Recovery preserves already staged source content and the index while completing only the remaining generated output and owner evidence.
- Requirement: Deterministic execution and replay use recorded public artifacts. Semantic review separately judges meaningful clarification, truthful verification and unnecessary stopping; successful local controls do not prove model behavior.

### Acceptance
#### Scenario: Complete authorized work
- GIVEN a ready catalog-price Change and stale storefront output
- WHEN the natural task is completed
- THEN the intended price appears in both artifacts, unrelated entries remain unchanged, and the same Change is ready without commit or archive.
#### Scenario: Stop for a material decision
- GIVEN the same request with an unresolved price choice
- WHEN it is evaluated
- THEN no artifact or index is changed and independent review must confirm a relevant owner question rather than invented completion.
#### Scenario: Resume staged work
- GIVEN the authorized price is already staged and only generation/verification remains
- WHEN work resumes
- THEN staged source/index are preserved and the remaining output and owner state complete.

## Design
- One evaluation capability with three initial project states; local engine controls and separately authorized model execution/review supply different evidence and remain independently reported.
- Fixtures include real source/generated JSON, immutable build/check scripts and existing RSP state. Only fixture project inputs reach the executor; expected results and oracle code stay host-side.
- Add a shared grader under evals/graders so it participates in grading identity; each case owns a small oracle entrypoint. No manifest/runner API extension.
- Evaluate JSON public values rather than formatting, command strings, private implementation or final-answer phrases. Existing hard graders own unauthorized files, staging, commits and composition mutation.
- Activation remains optional: observe guidance exposure without enforcing one valid invocation path. Required semantic rubric covers actual validation and meaningful clarification.
- Provenance: research/models/skill-upstream-refresh-2026-09.md C1/C3; addy-agent-skills R5 and planning-with-files R4, independently implemented around local observed coverage gaps. No upstream assets are copied or promoted.

## Tasks
- [x] Add ready, blocked and staged-recovery case packages with the same natural request.
- [x] Implement one recorded-artifact oracle and exercise good, claim-only, partial, wrong-price, wrong-owner/index and forbidden-mutation outcomes through runCase and replay.
- [x] Update coverage/usage documentation without claiming live behavior or expanding release gates.

## Verify
### Required
- [x] Focused engine tests prove scenario/oracle discrimination and replay agreement: all five new engine tests pass, including positive and negative controls.
- [x] eval:check validates all 25 public cases; the three-case plan reports 12 planned sessions, execution not-run and zero provider invocations.
- [x] Fresh build, lint, typecheck and deterministic tests pass: 15 test files, 70 tests. docs:check passes for 7 bilingual page pairs and 31 Markdown files.
- [x] RSP check and git diff --check pass; product Skills, source, rules, lock and release required-suite remain untouched.
- Evidence date: 2026-09-28. Local controls verify the evaluation machinery, not real-model performance.
- The blocked fixture explicitly limits unresolved-decision work to read-only inspection and response-only reporting; implementation/writeback tasks require owner authorization. The five focused engine tests, all 25 case checks, lint, docs:check and RSP check pass. No wording assertions were added; live observations are reported separately below.
- Durable writeback: Existing evals/README.md and tests/COVERAGE.md now describe the cases and their evidence limits. No additional current-fact Spec or Decision Record is needed: no product contract, runner API or release policy changed.
### Optional
- [x] Authorized current-Skill model baseline and independent semantic review, executed in a separately authorized follow-up on 2026-09-28 against cb174458. Three cases, two repetitions per arm: no installed Skills versus current skills/, with common CLI/fallback rules. AI-HUB/gpt-6-sol at medium completed all 12 executions; AI-HUB/gpt-6-astra at low passed all 12 fresh blind-packet reviews, without format retries.
- Evidence: evals/reports/natural-baseline-EgRQ8a/campaign-247d195c-ffb6-460d-9c54-7c52879623cb/campaign.json.review-batch-8633eef1-698f-471c-8fc1-8a676fd81d81.reviewed.json; original execution and review-batch reports are retained locally under the same ignored evidence root. Isolated configuration used the existing OpenCodex proxy without auth.json; personal configuration was not modified.
- Outcome limits: Each arm passed 6/6 execution and semantic checks. Mean execution duration was 54.31 seconds without Skills versus 82.99 seconds with Skills; mean tool calls were 9 versus 17.83. These six pairs are diagnostic, not evidence of a general quality or cost advantage. Input-token totals include cache hits and do not establish billed cost.
- Observed guidance: rsp was exposed in all six current-Skill runs and rsp-implement in five. Exposure of the optionally targeted rsp-manage remains unknown; this campaign does not establish Manage activation or worker orchestration.
- Closeout evidence: Offline revalidation of the retained reviewed campaign passed all 12 runs with zero provider invocations. The sibling .reviewed.json.revalidated.json retains the receipts. Broader workflow stability, multi-turn authorization and model-family equivalence remain unverified.
- Coverage: One-request execution with different initial states, not mid-run messaging, live worker identity or general model routing quality.

## Blockers
- none
