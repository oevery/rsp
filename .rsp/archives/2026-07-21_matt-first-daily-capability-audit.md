---
kind: "research"
---

# Change: matt-first-daily-capability-audit

## Proposal
- Summary: Audit the complete stable Matt engineering suite against RSP's seven-Skill assisted suite and real daily project journeys before 3.0 release preparation.
- Why:
  - The minimum suite is structurally complete, but daily use exposed uncertainty around deep clarification, design documents, module/domain reasoning, long-session continuity, and whether those concerns need new Skills or smaller progressive layers.
  - Copying Matt or Superpowers wholesale would conflict with RSP's compact, deterministic product boundary; the release needs an evidence-backed capability decision instead of a skill-count comparison.
- Scope:
  - Map every stable Matt capability family to the current RSP owner, an optional progressive reference, a future Controller, or an external project/host owner.
  - Compare five daily journeys: ambiguous product intent, domain vocabulary, module seam design, ordinary implementation, and long multi-session continuation.
  - Select the smallest candidate deltas that could make RSP sufficient for the maintainer's daily workflow.
- Non-goals:
  - Editing published Skills, changing the CLI/protocol, importing Matt's full suite, or promoting a candidate without a separate selected Change.
  - Treating boats-cloud's `.scratch` tracker as an RSP WorkRef or creating duplicate project state.

## Spec
<!-- Describe what finding or decision must be captured. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: the 3.0 daily-capability decision is traceable to accepted upstream reports, current RSP behavior evidence, and representative project journeys.
  - Every Matt capability family is accounted for without equating consideration with adoption.
  - Recommendations distinguish Skill, progressive reference, Controller, evaluation, and project/host ownership.

### Acceptance
#### Scenario: maintainer decides whether to expand the 3.0 suite
- GIVEN the seven-Skill assisted suite passes its declared gates but does not yet feel sufficient for daily project work
- WHEN Matt-first capability coverage and five representative journeys are compared
- THEN the audit identifies the smallest justified pre-release candidates and explicit non-candidates
- AND release preparation remains blocked until the maintainer selects or rejects the recommended daily-depth follow-up

## Design
- Approach:
  - Use the accepted Matt report/revision and complete capability ledger rather than re-reading unrelated upstream repositories.
  - Compare current Skill contracts and retained evaluation limits with Matt's exact stable Skill mechanisms.
  - Use boats-cloud-derived workflow facts only as local gap evidence; keep project names and private details out of future portable fixtures.
- Affected areas:
  - `research/upstreams/matt-skills/9603c1cc8118d08bc1b3bf34cf714f62178dea3b.md`
  - `research/models/rsp-capability-coverage.md`, `research/models/rsp-skill-system.md`
  - `skills/rsp*`, current promotion/composition reports, and representative project workflow artifacts
- Constraints:
  - Research remains intermediate and cannot change product truth or authorize candidate promotion.
  - Prefer capability-family conclusions over a one-to-one Matt-to-RSP Skill inventory.
  - Do not claim paired runtime performance where only contract and retained evaluation evidence exist.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Map the full stable Matt capability inventory to current RSP owners and layers
- [x] Audit five representative daily journeys against current contracts and retained behavior evidence
- [x] Record candidate recommendations, rejected expansions, and the release decision in `research/models/rsp-matt-first-daily-capability-audit.md`
- [x] Verify the report, perform semantic review, and record any required follow-up without promoting product changes

## Verify
- Automated:
  - [x] `node scripts/upstreams.mjs status matt-skills --json`
  - [x] `node dist/cli.mjs check && git diff --check`
  - [x] Confirm the audit contains no unresolved template markers and every named local path exists
- Manual:
  - [x] Confirm every stable Matt capability family has one owner/disposition and every recommendation names one RSP gap, owner, boundary, and next evidence gate
- Durable updates:
  - [x] Decide whether this change produced durable knowledge that belongs in `.rsp/specs/` or stable instructions that belong in the nearest project-owned `AGENTS.md`
  - [x] No durable Spec or instruction update: the audit remains a candidate research decision until the maintainer selects or rejects D1-D5

## Blockers
- none
