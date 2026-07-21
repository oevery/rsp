---
kind: "research"
---

# Change: engineering-disciplines/validate-discipline-composition

## Proposal
- Summary: Validate concise `rsp-tdd` and `rsp-diagnose` behavior, Core routing, context cost, and conflict restraint in an installed RSP suite.
- Why:
  - Contract prose alone cannot establish that strong models follow the intended discipline without the latency and conflicts observed in heavier workflow suites.
- Scope:
  - Exercise fresh-context diagnosis and TDD tasks plus routing, authority, and fallback scenarios against the exact packaged Skills.
- Non-goals:
  - Editing capability behavior, qualifying every framework/model/provider, or implementing managed orchestration.

## Spec
<!-- Describe what finding or decision must be captured. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: research outcome recording
  - Record behavioral success, failures, retries, context/latency cost, authority restraint, overlap/conflicts, and the supported 3.0 release recommendation.

### Acceptance
#### Scenario: research question is resolved
- GIVEN both standalone discipline Changes are archived
- WHEN isolated installed-package diagnosis and TDD runs plus deterministic composition cases complete
- THEN the report distinguishes passed behavior from omissions and recommends release preparation only when both disciplines and routing compose without hidden state or unauthorized actions

## Design
- Approach:
  - Prepare fixtures in parallel, then evaluate the final packaged Skills using fresh isolated contexts without leaking expected answers.
- Affected areas:
  - deterministic discipline composition fixtures and harness under `test/`
  - `research/evaluations/rsp-engineering-disciplines/`
- Constraints:
  - Do not substitute source-fragment tests for real behavior; keep raw runs ignored and commit only sanitized prompts, fixtures, hashes, metrics, and conclusions.

## Tasks
- [x] Build deterministic routing, discipline, fallback, and conflict-restraint scenarios.
- [x] Run fresh installed-package diagnosis and TDD behavior holdouts after prerequisites archive.
- [x] Record the supported release recommendation, limitations, and durable model/spec updates.

## Verify
- Automated:
  - [x] Focused discipline composition and shared contract run passed 4 files and 14 tests.
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run lint && mise exec -- pnpm run test` — build and lint passed; 18 files and 287 tests passed.
- Manual:
  - [x] Inspected raw holdout outputs for correct sequence, evidence, return ownership, conflicts, unauthorized actions, and omitted coverage; retained report: `research/evaluations/rsp-engineering-disciplines/2026-07-21/report.md`.
- Durable updates:
  - [x] Updated `.rsp/specs/design.md` with the seven-Skill surface, standalone discipline ownership, and composition seam.
  - [x] Updated `research/models/rsp-skill-system.md` and `research/models/rsp-capability-coverage.md`; no Decision Record or project instruction update is needed.

## Blockers
- requires `engineering-disciplines/add-rsp-tdd`: validate the promoted TDD Skill rather than a speculative fixture contract
- requires `engineering-disciplines/add-rsp-diagnose`: validate the promoted diagnosis Skill rather than a speculative fixture contract
- none
