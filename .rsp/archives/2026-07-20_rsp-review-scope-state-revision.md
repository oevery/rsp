---
kind: "research"
---

# Change: rsp-review-scope-state-revision

## Proposal
- Summary: Correct rsp-review pipeline scope states and mixed-change coverage without regressing restraint or cost
- Why:
  - Candidate `2026.07.20.2` fixed the previous clean false positives and document omissions, but passed only three of eight strict fixtures because authority/evidence files were counted as reviewed artifacts and one mixed public-contract coverage gap was missed.
  - Its median input overhead passed at 3.71%, while two cases still exceeded the 50% per-case limit after extra searches.
- Scope:
  - Iteratively refine one single-file candidate, ending at `2026.07.20.5`, with pipeline applicability derived only from artifacts in the fixed comparison scope.
  - Preserve separate authority/evidence reads without changing a non-applicable pipeline from `skipped` to `clean`.
  - Require focused regression evidence for a changed public failure contract in mixed changes.
  - Add a bounded stop rule after sufficient diff, authority, and behavior evidence is collected.
  - Run targeted red/negative matrices between revisions, then retain the first complete eight-case matrix that passes every quality fixture through the default user provider.
- Non-goals:
  - Promoting or publishing the candidate, adding review categories, changing fixtures or thresholds, or building a general benchmark framework.

## Spec
<!-- Describe what finding or decision must be captured. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: artifact-bounded pipeline state
  - Code and Document applicability is determined from artifacts inside the fixed comparison scope, not from files read only as authority or evidence.
  - An applicable pipeline returns `clean` or `issues_found`; a pipeline with no reviewed artifacts returns `skipped`; unavailable required scope or authority returns `blocked`.
- Requirement: mixed contract coverage
  - A changed public return shape or failure contract without focused regression evidence remains an actionable Code finding even when implementation matches the selected Change.
- Requirement: bounded inspection
  - Stop repository discovery after the fixed diff, applicable project authority, and smallest behavior chain are sufficient to judge all applicable pipelines; do not search for unrelated context merely to fill the report.

### Acceptance
#### Scenario: authority does not widen review scope
- GIVEN a code-only or document-only diff whose selected Change and implementation are read as authority
- WHEN the candidate reports pipeline states
- THEN only the pipeline owning changed artifacts is applicable and the other pipeline is `skipped`

#### Scenario: mixed failure contract retains coverage finding
- GIVEN a mixed change alters a public failure contract without regression evidence
- WHEN Code and Document pipelines run
- THEN Code reports the coverage gap, Document reports the contradictory usage claim, and the cross-artifact contradiction is emitted once

#### Scenario: promotion gates remain fixed
- GIVEN the frozen candidate and complete paired matrix
- WHEN outputs and cost are scored
- THEN all eight fixtures, zero clean false positives, no-worse recall, at least one material improvement, 30% median overhead, and 50% maximum overhead determine promote, revise, or reject

## Design
- Approach:
  - Treat the committed compact-provider matrix as red evidence and change only the rules tied to observed failures.
  - Keep the candidate single-file, increment its CalVer content version, validate statically, then freeze its hash.
  - Run a fresh serial matrix with the default user provider, `gpt-5.6-terra`, `low` effort, and read-only sandbox.
  - Retain exact outputs and normalized quality/cost evidence after all quality fixtures pass; keep promotion held if the independent cost gate still fails.
- Affected areas:
  - `research/candidates/skills/rsp-review/SKILL.md`
  - `research/evaluations/rsp-review/<date>-scope-state/`
  - `scripts/rsp-review-eval.mjs` and focused tests for a bounded per-run timeout after a third-party request hung indefinitely
- Constraints:
  - Do not edit the candidate after matrix start; a behavior change requires another identity and full rerun.
  - Do not change the candidate, harness, fixtures, model, effort, or thresholds during the final matrix.
  - Keep raw events ignored and keep the candidate outside product discovery.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Iteratively implement and statically validate candidates through `2026.07.20.5`
- [x] Add and verify a bounded per-run timeout after an external provider request hung indefinitely
- [x] Run targeted red/negative matrices until their quality gates pass
- [x] Freeze `2026.07.20.5` and run the complete paired matrix through the default user provider
- [x] Confirm all eight quality fixtures pass and score the unchanged cost gates
- [x] Retain exact outputs and the quality-pass/cost-hold report
- [x] Verify the result and update any required durable specs or scoped instructions

## Verify
- Automated:
  - [x] `uv run --with pyyaml python /Users/oevery/.codex/skills/.system/skill-creator/scripts/quick_validate.py research/candidates/skills/rsp-review`
  - [x] `mise exec -- pnpm exec vitest run test/skill-contract.test.ts test/skill-behavior.test.ts`
  - [x] `mise exec -- pnpm run build`
  - [x] `mise exec -- pnpm run typecheck`
  - [x] `mise exec -- pnpm run lint`
  - [x] `mise exec -- pnpm run test`
  - [x] `node dist/cli.mjs check --focused`
- Manual:
  - [x] Confirm retained outputs match matrix hashes and all workspaces remain unchanged
  - [x] Confirm the report applies unchanged behavior and cost gates without post-start candidate edits
- Durable updates:
  - [x] Decide whether this change produced durable knowledge that belongs in `.rsp/specs/` or stable instructions that belong in the nearest project-owned `AGENTS.md`
  - [x] If yes, write only stable facts to the smallest correct target file before archive; do not promote task history, debugging notes, or one-off implementation context

## Blockers
- none
