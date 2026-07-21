---
kind: "research"
---

# Change: skill-capability-research/reconcile-skill-system

## Proposal
- Summary: Reconcile the frozen Skill System model with completed capability-level research.
- Why:
  - The existing model selected review deeply but leaves shaping and standalone implementation at coarse maturity and contains assumptions that may no longer match the minimum-suite decision.
- Scope:
  - Update `research/models/rsp-skill-system.md`, its source list, capability map, selected recommendations, and delivery sequence.
- Non-goals:
  - Editing product Specs, implementing Skills, or expanding the minimum suite to every useful engineering discipline.

## Spec
### MODIFIED
- Requirement: The Skill System model names one coherent minimum useful suite and an evidence-backed promotion order.
  - It distinguishes stable capabilities, selected next candidates, external interoperable Skills, deferred RSP capabilities, and rejected duplication.
  - Managed delivery remains blocked until at least two stable Discipline Skills compose reliably.

### Acceptance
#### Scenario: maintainer selects the next implementation group
- GIVEN complete capability coverage, shaping synthesis, and implementation synthesis
- WHEN the Skill System model is reconciled
- THEN every child in `minimum-skill-suite` cites selected recommendations with clear adoption mode and provenance
- AND no Controller or host projection is required to complete the manual suite

## Design
- Approach:
  - Resolve disagreements between the old frozen sequence and new capability evidence explicitly; preserve rejected system shapes unless new evidence demonstrates a concrete gap.
- Affected areas:
  - `research/models/rsp-skill-system.md`
  - `research/models/INDEX.md`
- Constraints:
  - Do not present research selection as already implemented product fact.

## Tasks
- [x] Add the capability coverage and selected synthesis models as inputs.
- [x] Reconcile capability maturity, ownership, sequence, and release threshold.
- [x] Record superseded assumptions and preserve rationale for deferred/rejected capabilities.
- [x] Validate every selected recommendation has an executable follow-on owner.

## Verify
- Automated:
  - [x] Validate model frontmatter, source paths, selected recommendation IDs, and research index entries.
  - [x] `node scripts/upstreams.mjs status all --json`
- Manual:
  - [x] Confirm the model supports direct/manual use first and does not silently introduce a second workflow or authority.
- Durable updates:
  - [x] No product durable update; the model remains an intermediate research authority only.

## Blockers
- requires `skill-capability-research/map-capability-coverage`: needs the completed capability coverage model
- requires `skill-capability-research/synthesize-shaping-capability`: needs the completed shaping contract
- requires `skill-capability-research/synthesize-implementation-capability`: needs the completed implementation contract
