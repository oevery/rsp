---
kind: group
---

# Change Group: minimum-skill-suite

## Goal
- Deliver and compose the minimum useful RSP Skill Suite before 3.0 release

## Scope
- Refine the Core Skill, promote shaping and implementation Discipline Skills, and prove the installed suite composes with the existing `rsp-review` capability.
- Stop at a manually composable host-neutral suite; managed delivery and host projections remain later optional layers.

## Shared Constraints
- Begin implementation only from completed, selected recommendations in the closed `skill-capability-research` group.
- Move from research to a candidate only for one demonstrated RSP gap. Extract the smallest capability delta first; exhaustive source coverage and cross-source models remain optional audit evidence rather than candidate prerequisites.
- Develop candidates under `research/candidates/skills/`. During iteration, use deterministic safety checks and a small unseen real-task holdout; reserve repeated provider matrices and cost calibration for an explicitly selected release candidate.
- Keep one canonical host-neutral behavior package per capability and preserve project instructions, focused Change, Specs/Decisions, code/tests, and Git/publication authority as separate owners.
- Do not add a suite manifest, runtime router overlay, plugin, host-required metadata, second workflow state model, or Managed Controller.

## Slices
- `minimum-skill-suite/build-rsp-shape`: evaluate and promote the selected shaping/slicing contract.
- `minimum-skill-suite/build-rsp-implement`: evaluate and promote bounded implementation with fresh verification evidence and no implicit Git authority.
- `minimum-skill-suite/simplify-native-skills`: correct the research-to-candidate path and reduce shaping/implementation Skills to their demonstrated RSP-specific deltas.
- `minimum-skill-suite/validate-native-skill-depth`: preserve complex shaping through progressive disclosure and validate both concise Skills on unseen mutation holdouts.
- `minimum-skill-suite/refine-rsp-core-routing`: derive stage and one next action against the promoted capabilities without turning `rsp` into a catalog.
- `minimum-skill-suite/validate-skill-composition`: prove `rsp`, `rsp-shape`, `rsp-implement`, and `rsp-review` compose through existing RSP artifacts.

## Completion Conditions
- [ ] The published suite provides a usable manual loop from scoped request through shaping, implementation, review, durable decision, and archive.
- [ ] Each Skill remains independently invocable and returns results to existing artifact owners without hidden state or recursive Skill orchestration.
- [ ] Cross-skill fixtures pass for a normal Change, ambiguous authority, missing inputs, unrelated dirty work, failed verification, and prohibited Git/publication actions.
- [ ] Full project gates and package/install discovery smoke tests pass with the complete minimum suite.
- [ ] Stable product facts and user documentation describe the final suite without exposing research or evaluation artifacts.

## Durable Outcomes
- `.rsp/specs/design.md` records the stable minimum-suite boundary and composition contract.
- `README.md` and `README.zh-CN.md` describe only promoted capabilities and their installation/use boundaries.

## Blockers
- none
