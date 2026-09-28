---
kind: "feature"
---

# Change: natural-workflow-evaluation

## Proposal
- Outcome: Evaluate natural-request completion, owner-decision restraint and recovery of staged work using discriminating public catalog scenarios.
- Why: Named-Skill smoke cases do not prove a model completes authorized work from natural intent, and boolean-export fixtures do not exercise synchronization between source and generated consumer artifacts.
- Scope: Three case packages, one shared host-owned catalog oracle, focused engine controls and evaluation documentation. Reuse existing direct-work and interrupted-verification cases. Correct one inline-code Markdown marker in the preceding SkillOpt research report to restore the repository lint baseline; its research conclusion is unchanged.
- Non-goals: Product Skill changes, new runners or multi-turn protocol, research-baseline acceptance, release-suite expansion, live providers, independent holdouts, archive or Git delivery.

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
- One outcome and one writer; direct Implement with integrated local verification. No independent worker acceptance, external execution or lifecycle orchestration is required; Manage is declined for this local implementation boundary.
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
- Post-correction verification: The blocked fixture now explicitly limits unresolved-decision work to read-only inspection and response-only reporting; implementation/writeback tasks require owner authorization. The five focused engine tests, all 25 case checks, lint, docs:check and RSP check pass after this instruction correction. No wording assertions were added; real-model interpretation remains unverified.
- Durable writeback: Existing evals/README.md and tests/COVERAGE.md now describe the cases and their evidence limits. No additional current-fact Spec or Decision Record is needed: no product contract, runner API or release policy changed.
### Optional
- [ ] Authorized current-Skill model baseline and independent semantic review; not run in this implementation.
- Coverage: One-request execution with different initial states, not mid-run messaging, live worker identity or general model routing quality.

## Blockers
- none
