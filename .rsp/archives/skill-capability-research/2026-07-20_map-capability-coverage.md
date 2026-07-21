---
kind: "research"
---

# Change: skill-capability-research/map-capability-coverage

## Proposal
- Summary: Account for upstream and local Skills by capability instead of only by source repository.
- Why:
  - The source reports are complete, but only review received a deep cross-source path from mechanisms to a promoted RSP capability.
- Scope:
  - Create `research/models/rsp-capability-coverage.md` as the selection ledger for the minimum suite and deferred capabilities.
- Non-goals:
  - Copying Skill prose, producing candidates, or treating catalog completeness as an adoption requirement.

## Spec
### ADDED
- Requirement: The capability coverage model classifies every discovered Skill path from adapt-strategy sources and local research inputs.
  - Each row records source report/revision, exact path or explicit grouped paths, behavior, trigger, input/output, mutation and authority boundary, RSP gap, decision, target owner, evidence depth, and required follow-up.
  - Model/tooling sources contribute only mechanisms or exact stage capabilities relevant to an identified RSP gap.
  - Decisions use `adapted`, `independent-reimplementation`, `model-only`, `external`, `defer`, or `reject`; grouped rejection is allowed only with an explicit shared reason and complete path list.

### Acceptance
#### Scenario: maintainer asks whether an upstream Skill was considered
- GIVEN an exact relevant upstream or local Skill path
- WHEN the coverage model is queried
- THEN the path resolves to one explicit classification and rationale
- AND adopted or deferred entries name one potential RSP owner without creating that owner

## Design
- Approach:
  - Generate a mechanical inventory for coverage checking, then make semantic classifications manually from accepted reports and only the exact source files needed to resolve gaps.
- Affected areas:
  - `research/models/rsp-capability-coverage.md`
  - accepted reports under `research/upstreams/` and `research/local-skills/`
- Constraints:
  - Keep mechanical inventory evidence in ignored cache; track only the synthesized model.
  - Generic value alone is insufficient for RSP adoption; prefer `external` when an existing host/project Skill already composes safely with RSP.

## Tasks
- [x] Inventory exact Skill paths and capability families from accepted adapt sources and local inputs.
- [x] Classify every relevant path and record explicit grouped exclusions without omissions.
- [x] Identify only the demonstrated gaps needed by the minimum suite and later optional capabilities.
- [x] Cross-check model coverage against the inventory and source reports.

## Verify
- Automated:
  - [x] `node scripts/check-capability-coverage.mjs`
  - [x] `node scripts/upstreams.mjs status all --json`
- Manual:
  - [x] Review every `adapted` or `independent-reimplementation` row for license, exact source eligibility, RSP gap, and one owning target.
- Durable updates:
  - [x] Keep the coverage ledger in research; do not update product Specs.

## Blockers
- requires `skill-capability-research/accept-research-baselines`: needs the accepted revisions used by the inventory
