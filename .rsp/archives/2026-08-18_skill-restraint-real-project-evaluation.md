---
kind: "refactor"
---

# Change: skill-restraint-real-project-evaluation

## Proposal
- Outcome: Add a reusable, locale-independent Skill-restraint evaluator with three independently reimplemented boats-cloud-derived fixtures that distinguish overbuilt boundaries/tests from proportionate implementation and preserve tests with independent consequences.
- Why:
  - The retained restraint evaluation proved no regression, but current and candidate both passed its small synthetic cases, so it did not demonstrate behavioral uplift.
  - Its one-off scorer misread localized `代码: clean` and the negative phrase `不应合并或删除`, requiring manual rescoring.
- Scope:
  - Add a deterministic fixture preparation and scoring script that evaluates Git/file/test evidence plus a hash-bound structured adjudication receipt instead of matching natural-language verdict phrases.
  - Add at most three sanitized, independently reimplemented fixtures derived from boats-cloud page ownership, deep-interface test pruning, and independent desktop side effects.
  - Add focused contract tests and TypeScript declarations for the evaluator.
- Non-goals:
  - Do not revise `rsp-implement`, `rsp-tdd`, or `rsp-review` contracts again.
  - Do not retain boats-cloud proprietary source, provider logs, or a broad model/provider matrix.
  - Do not make static fixtures or an adjudication receipt sufficient promotion, release, Git, or publication authority.

## Spec
### MODIFIED
- Requirement: Restraint candidate evaluation must contain real-project-derived discriminating evidence without depending on response language.
  - Every real-derived fixture records source class, project, sanitization mode, one observable risk, and proportionate acceptance checks.
  - The scorer derives compliance, boundary, and task-result observations from prepared workspace evidence and an executed fixture command.
  - Human/model semantic adjudication uses exact enum fields bound to the final-output hash; natural-language output is retained only as hashed evidence and is never regex-scored.
  - Current/overbuilt and candidate/restrained fixture variants must produce a demonstrated failing-versus-passing distinction for the intended restraint contract.

### Acceptance
#### Scenario: Speculative wrapper and mirrored test are rejected
- GIVEN a sanitized boats-cloud-derived page-private state change with an existing behavioral check
- WHEN one variant adds a single-caller wrapper and wrapper-only test while another changes only the page owner
- THEN the same evaluator rejects the overbuilt variant and accepts the restrained variant from workspace and command evidence

#### Scenario: Deep-interface coverage replaces redundant shallow tests
- GIVEN a module deepening change whose public behavior test covers the same shallow forwarding path
- WHEN one variant retains the redundant forwarding test and another removes it
- THEN the evaluator distinguishes duplicate coverage without requiring one test per touched file

#### Scenario: Independent consequences survive localized review output
- GIVEN identity and native-side-effect tests that protect different regressions
- WHEN equivalent English and Chinese reports are independently adjudicated as preserving both consequences
- THEN both score identically through hash-bound enums, including Chinese text containing `代码: clean` and `不应合并或删除`

## Design
- Approach:
  - Implement one deterministic `skill-restraint-eval` owner for fixture discovery, contained workspace preparation, exact Git/file checks, command execution, and structured adjudication validation.
  - Reuse `hashSkillEvaluationValue` and emit observations compatible with the existing Skill candidate dimensions rather than introducing another comparison receipt.
- Boundaries:
  - Fixture prose may be localized, but the adjudication schema uses stable enum values and binds `case_id`, variant, output SHA-256, and contract SHA-256.
  - Fixture workspaces are temporary, path-contained, non-symlink inputs; retained repository fixtures contain no provider credentials or raw runs.
- Affected areas:
  - `scripts/skill-restraint-eval.mjs` and declaration
  - `test/skill-restraint-eval.test.ts` and `test/skill-restraint-eval/fixtures/**`
- Constraints:
  - Keep the fixture suite at three cases and test only independent evaluator risks.
  - A structured adjudication is evidence input, not self-proving truth; promotion still requires the existing candidate comparison and review boundaries.

## Tasks
- [x] Implement contained fixture loading, preparation, evidence scoring, and locale-independent adjudication binding.
- [x] Add three boats-cloud-derived fixtures with current/overbuilt and candidate/restrained variants.
- [x] Add focused tests proving discrimination, locale invariance, containment, and fail-closed receipt validation.
- [x] Run focused tests, build, lint, full suite, RSP checks, and diff checks.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skill-restraint-eval.test.ts test/skill-candidate-evaluation.test.ts` — 2 files and 15 tests passed; proves real-derived fixture discrimination and compatibility with the existing candidate dimensions.
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run test` plus `mise exec -- pnpm run lint` — build and lint passed; 74 files and 828 tests passed; proves repository-wide implementation integrity.
  - [x] `node dist/cli.mjs check skill-restraint-real-project-evaluation --json && git diff --check` — focused Change check and patch hygiene passed.
### Optional
- Manual or environment:
  - [ ] Future provider run against the retained fixtures — deferred until a new Skill candidate requires promotion evidence.
- Coverage:
  - Deterministic fixture and scorer behavior now; provider/model generality remains outside this Change. The first full-suite attempt observed a transient clean-install package inventory failure while `dist/` was unavailable; a fresh documented `build -> test` rerun passed all 828 tests.

## Blockers
- none
