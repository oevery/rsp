---
kind: "feature"
---

# Change: minimum-skill-suite/refine-rsp-core-routing

## Proposal
- Summary: Make the Core Skill derive one stage and next action without becoming a router catalog.
- Why:
  - A suite of independent Skills needs deterministic navigation from current RSP/project evidence while remaining useful when optional capabilities are absent.
- Scope:
  - Refine `skills/rsp/`, its content version, hard-boundary checks, and user guidance from the selected capability delta.
- Non-goals:
  - Persisting stage state, preloading every Skill, or orchestrating implementation/review loops.

## Spec
### MODIFIED
- Requirement: The Core Skill resolves current authority and returns one next action: direct RSP operation, manual engineering action, or at most one available optional capability.
  - Selection derives from user intent, focus, Change completeness, verification evidence, and blockers rather than hidden mode state.
  - Missing optional Skills degrade to explicit manual guidance without invalidating the protocol.

### Acceptance
#### Scenario: agent enters an RSP project with open work
- GIVEN nearest project authority and deterministic RSP status
- WHEN the Core Skill derives the current step
- THEN it names one justified next action and required input/returned owner
- AND it does not enumerate or invoke unrelated capabilities

## Design
- Approach:
  - Implement only the routing contract selected by completed research, keep deterministic checks to hard routing boundaries, and forward-test a small unseen real-task holdout.
  - Select `rsp-skill-system` S3/S8 and capability coverage C01/C45/C46; route only to installed promoted capabilities and preserve an explicit manual fallback.
- Affected areas:
  - `skills/rsp/SKILL.md`
  - Skill contract checks under `test/`
- Constraints:
  - Preserve host neutrality, compactness, and independent content CalVer.

## Tasks
- [ ] Select exact research recommendation IDs and adoption mode.
- [ ] Define and test the minimal stage/next-action contract.
- [ ] Update the Core Skill without adding a catalog or hidden lifecycle.
- [ ] Run static/hard-boundary checks and a small unseen real-task holdout; add repeated host/cost evidence only after selecting a release candidate.

## Verify
- Automated:
  - [ ] Agent Skills validation, focused contract checks, build, typecheck, lint, and full tests.
- Manual:
  - [ ] Forward-test unseen no-focus, ambiguous-focus, incomplete-shape, implementation-ready, review-requested, and archive-ready cases without fixed response wording.
- Durable updates:
  - [ ] Update `.rsp/specs/design.md` only with stable promoted behavior.

## Blockers
- requires `skill-capability-research/reconcile-skill-system`: needs the reconciled routing recommendations
- requires `minimum-skill-suite/build-rsp-shape`: routes only after the shaping capability is promoted
- requires `minimum-skill-suite/build-rsp-implement`: routes only after the implementation capability is promoted
- requires `minimum-skill-suite/simplify-native-skills`: routes only after the promoted Skills are reduced to their demonstrated native deltas
- requires `minimum-skill-suite/validate-native-skill-depth`: routes only after concise Skill depth is validated on unseen mutation work
