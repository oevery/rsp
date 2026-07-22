---
kind: "fix"
---

# Change: fix-native-durable-semantic-oracle

## Proposal
- Summary: Reject contradictory ownership in retained durable composition evidence
- Why:
  - Focused re-review proved the durable scorer could accept a contradictory statement such as Web owning physical discovery as long as generic keywords remained present.
- Scope:
  - Freeze independently authored durable current facts in the native-design oracle and reject contradictory ownership through the public scorer seam.
  - Add a test-first contradictory-ownership fixture and rerun the retained/default release gates.
- Non-goals:
  - General natural-language fact checking or broader host/hardware qualification.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: the durable native-design composition gate accepts only the independently authored owner and boundary facts for the holdout.
  - Desktop owns physical discovery, the runtime-neutral package only projects normalized state, Web does not perform direct discovery, and hardware acceptance remains unavailable.
  - A contradictory owner statement fails even when generic `desktop` and `runtime-neutral` keywords are present.

### Acceptance
#### Scenario: contradictory durable owner
- GIVEN a durable artifact that says Web owns physical discovery
- WHEN the public native-design evidence scorer evaluates it
- THEN the durable current-fact gate fails with a deterministic blocker

## Design
- Approach:
  - Add independent literal fact requirements and contradictions to `oracle.yaml`, then have the public scorer evaluate that contract.
- Affected areas:
  - `research/evaluations/rsp-native-design-composition/2026-07-22/oracle.yaml`
  - `scripts/native-design-composition-eval.mjs` and `test/native-design-composition.test.ts`
- Constraints:
  - Test the exported scorer/evaluator seam; do not couple the fixture to a private helper or infer facts from the successful model output.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Observe the contradictory-owner test fail before implementation
- [x] Implement oracle-backed durable fact scoring
- [x] Verify the hardened retained and release gates

## Verify
- Automated:
  - [x] `mise exec -- pnpm run release:check`
    - Observed 2026-07-22: build, typecheck, lint, all 332 tests, and exact clean-install package validation passed; package SHA-256 `6b07aaedfa04539013b564eb6640968b3e9b6783dd8259feddcb099155bae4b7`.
- Manual:
  - [x] Confirm the contradictory fixture fails and the retained authentic artifact passes.
    - The public scorer first reproduced RED for contradictory ownership, then passed the authentic retained artifact and rejected the contradiction after the oracle-backed fix.
- Durable updates:
  - [x] Decide whether this change produced durable knowledge that belongs in `.rsp/specs/` or stable instructions that belong in the nearest project-owned `AGENTS.md`
  - [x] The independent evaluation oracle and its README are the correct durable owners; no product Spec or project instruction update was required.

## Blockers
- none
