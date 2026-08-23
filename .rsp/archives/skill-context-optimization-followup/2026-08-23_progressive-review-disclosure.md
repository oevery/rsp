---
kind: "refactor"
---

# Change: skill-context-optimization-followup/progressive-review-disclosure

## Proposal
- Outcome: Review procedures load after review scope classification while fixed-scope review ownership and findings semantics remain intact.
- Why:
  - Code and Document review branches are inactive for most Core and implementation routes.
- Scope:
  - Separate eager review selection and authority from conditional Code and Document review procedures.
- Non-goals:
  - Changing review acceptance, finding resolution, or implementation behavior.

## Spec
### MODIFIED
- Requirement: Review remains independently invocable, but inactive review pipelines are not read on non-review routes.

### Acceptance
#### Scenario: Non-review work remains unaffected
- GIVEN the request is not an explicit fixed-scope review
- WHEN Core derives and executes the route
- THEN review pipeline detail is not loaded and no review authority is inferred

#### Scenario: Review pipeline remains reachable
- GIVEN an explicit Code or Document review scope
- WHEN the review is routed
- THEN only the matching pipeline is loaded and findings remain read-only and fixed-scope

## Design
- Approach:
  - Classify scope first, then conditionally load the matching existing owner reference.
- Boundaries:
  - Do not broaden review scope or merge Code and Document procedures.
- Affected areas:
  - `skills/rsp-review/SKILL.md` and directly owned references
  - Review contracts and fixed-scope fixtures
- Constraints:
  - Preserve no-product-mutation and finding-resolution authority boundaries.

## Tasks
- [x] Measure route-local reads on non-review and review provider holdouts; deterministic diagnostics establish the static loading boundary and the merged provider campaign preserves skipped, Code, Document, mixed, and prohibited-action behavior.
- [x] Introduce the smallest conditional-loading boundary: fix scope and authority, classify only fixed reviewed artifacts, then load only the applicable Code or Document reference.
- [x] Run non-review, Code review, Document review, mixed review, and finding-resolution acceptance plus the parent-owned serial full suite; 10 baseline/candidate review provider arms passed, the existing `resolve-fixed-report` routing contract preserves the finding-resolution owner, and repository build/lint/full-suite gates pass.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skills/skill-contract.test.ts test/skills/rsp-review-progressive-disclosure-contract.test.ts test/skills/rsp-resolve-findings-contract.test.ts test/evaluation/skill-behavior.test.ts test/evaluation/skill-routing-evaluation.test.ts --reporter=dot --no-file-parallelism` — passed 5 files / 35 tests; proves fixed-scope classification order, conditional Code/Document loading, authority-only `skipped`, mixed findings, read-only authority, resolution routing, and evaluator containment.
  - [x] Provider non-review and review holdouts with default local routing, `combo/gpt-5.6-terra`, and `high` effort — 10 baseline/candidate arms passed across `skipped-document`, `code-issues`, `document-issues`, `mixed-change`, and `prohibited-action`, preserving conditional pipeline reachability, cross-artifact deduplication, and the read-only boundary.
  - [x] `mise exec -- pnpm run build` — passed.
  - [x] `mise exec -- pnpm run lint` — passed.
  - [x] `mise exec -- pnpm exec vitest run --no-file-parallelism --reporter=dot` — passed 89 files / 880 tests after review corrections and sibling merge.
### Optional
- Manual or environment:
  - [ ] One real fixed-scope review replay — owned by the parent Manager's independent first-wave review before archive.
- Coverage:
  - Static diagnostics: `skills/rsp-review/SKILL.md` decreased from 810 to 768 words; the complete three-file package decreased from 1467 to 1425 words. Counts are diagnostic only.
  - Provider outcomes are measured for all five review cases. The campaign validates behavior and boundaries; host resource-event capture is not treated as proof of every expected read.

## Blockers
- none
