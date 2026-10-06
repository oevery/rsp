---
kind: research
summary: Diagnose reading-path sensitivity to project entry context without changing Skills.
---

# Change: reading-path-context-probe

## Proposal

- Outcome: Compare two bounded task pairs to determine whether project-entry context is a useful lead for redundant protocol loading and broad instruction discovery.
- Scope: Catalog completion and grounded Doc writing; frozen existing Skills, task prompts, rubrics, shared model settings and runner. Local research fixtures and retained evaluations only.
- Non-goals: Skill/Spec changes, cost-benefit claims, broad model matrices, upstream acceptance or publication.

## Spec

No stable contract delta. Existing Workflow and Writing quality contracts remain authoritative.

### Acceptance

- Preserve separate task judgments and reading-path observations. Complete at most four executors and four independent judges with no automatic retry.
- Each pair differs only in project AGENTS content (and identifying case/project metadata); preserve prompts, rubrics, product files and Skill composition. Catalog treatment adds the standard repository RSP Entry; Doc treatment adds a minimal project-local authority note without a search recipe.
- Retain exact inputs, commands, outputs, collection gaps and original verdicts. One execution per arm supplies diagnostic observations, not causal proof or reliability estimates.
- Preserve the source checkout, personal settings and historical evidence. Frozen private evaluation copies, not personal credential refresh, determine input stability.

## Design

Use the existing shared runner with temporary treatment projects/cases, not product rule edits or a new evaluator. Run Catalog control/treatment, then Doc control/treatment serially. Each treatment project is a byte-preserving copy except AGENTS.md; copy existing case acceptance unchanged. Validate differences and offline readiness before live execution.

Private run records remain under tests/skills/reports; a concise report under research/evaluations owns conclusions. Remove exact temporary fixtures and private inputs after consumers finish. The prior concise-agent-responses archive remains immutable.

## Tasks

- [x] Prepared both pairs with AGENTS-only project differences and frozen runtime inputs.
- [x] Completed four executions and four independent judgments: four mechanical passes, three judgment passes and one judgment failure, with original verdicts retained.
- [x] Recorded reading paths, literal-evidence analysis and judgment inconsistency in the [research report](../../research/evaluations/rsp-skill-runtime-context/2026-10-05-reading-path-context-probe.md). Retain Skills unchanged; no causal improvement claim.
- [x] Verified preservation and backed up temporary fixtures before removing them and private runtime/composition copies.

## Verify

### Required

- [x] Paired byte/map comparison confirmed only AGENTS content differs; all four offline checks and 48-file composition security passed.
- [x] Candidate-bound records retain all eight roots with no collection gaps. The matrix remains failed (three passed, one failed); the report separates author diagnosis from original judgments. Research completion is not candidate or release acceptance.
- [x] Preservation and cleanup passed. Focused RSP consistency, documentation checks (seven bilingual pairs and 29 Markdown files), all seven local report/Change links and whitespace checks passed. Prior build, lint, typecheck and 132 code tests remain applicable to unchanged product inputs.

### Optional

- [ ] Repeated or randomized comparisons; broader host/model coverage.

## Blockers

None.
