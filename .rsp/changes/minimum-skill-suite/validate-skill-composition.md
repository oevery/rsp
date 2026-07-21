---
kind: "feature"
---

# Change: minimum-skill-suite/validate-skill-composition

## Proposal
- Summary: Prove the minimum Skill Suite composes through existing RSP artifacts before 3.0 release.
- Why:
  - Individually passing Skills do not prove authority, state ownership, handoff, context cost, or stop behavior across a complete engineering loop.
- Scope:
  - Validate `rsp`, `rsp-shape`, `rsp-implement`, and `rsp-review` on a small unseen end-to-end holdout, plus deterministic package/install discovery checks.
- Non-goals:
  - Building a Controller, automatically retrying findings, or benchmarking every host/model.

## Spec
### ADDED
- Requirement: The installed minimum suite supports a manual `shape -> implement -> review -> durable decision -> archive` loop with explicit artifact ownership.
  - Each transition records the selected input, returned owner, verification evidence, and stop reason without hidden state.
  - Direct invocation of any one Skill remains valid and does not require preceding Skills.

### Acceptance
#### Scenario: user completes one representative RSP Change with the installed suite
- GIVEN a clean installed package and an unseen project task with project authority
- WHEN the four capabilities are invoked only as required by observed state
- THEN the Change reaches archive readiness with coherent implementation and review evidence
- AND ambiguity, failed gates, unrelated dirty work, and prohibited Git/publication actions stop safely

## Design
- Approach:
  - Exercise the installed suite on a small unseen holdout and inspect artifact ownership directly; measure the whole loop separately from individual static gates.
  - Select `rsp-skill-system` S8, shaping S1/S5, and implementation I1/I6 as the cross-capability ownership, restraint, and evaluation boundary.
- Affected areas:
  - suite composition holdout evidence under maintainer research paths
  - package/install validation
  - user documentation and stable design facts after gates pass
- Constraints:
  - Composition tests may drive Skills manually but cannot introduce persistent controller state or recursive invocation semantics.

## Tasks
- [ ] Select unseen normal, ambiguity, failure, dirty-worktree, direct-invocation, and prohibited-action tasks.
- [ ] Run the installed suite once across the holdout with recorded host settings.
- [ ] Measure correctness, corrections, mutation authority, handoff coherence, total tokens, elapsed time, and tool calls.
- [ ] Resolve material composition defects in their owning Skill; select a release candidate before any repeated calibration.

## Verify
- Automated:
  - [ ] Static Skill contracts, full project gates, npm pack, and clean-prefix installation.
- Manual:
  - [ ] Inspect the unseen holdout and confirm every artifact mutation and stop decision has exactly one owner.
- Durable updates:
  - [ ] Record only the stable suite boundary and composition contract in `.rsp/specs/design.md` and published README files.

## Blockers
- requires `minimum-skill-suite/refine-rsp-core-routing`: needs the refined Core Skill
- requires `minimum-skill-suite/build-rsp-shape`: needs the promoted shaping Skill
- requires `minimum-skill-suite/build-rsp-implement`: needs the promoted implementation Skill
