---
kind: "refactor"
---

# Change: minimum-skill-suite/simplify-native-skills

## Proposal
- Summary: Restore a gap-driven path from upstream distillation to concise RSP-native Skills.
- Why:
  - The shaping and implementation candidates accumulated exhaustive research layers, fixture-shaped output contracts, repeated provider matrices, and a capability-specific resolver that cost more than the demonstrated RSP-specific behavior delta.
  - Upstream distillation and native ownership remain valid; candidate extraction and evaluation need a smaller stopping rule.
- Scope:
  - Define the minimal research-to-candidate handoff and release-candidate evidence boundary.
  - Reduce `rsp-shape` and `rsp-implement` to their demonstrated RSP-specific behavior.
  - Remove implementation-only resolver and per-candidate provider harnesses while retaining static package and hard-boundary checks.
- Non-goals:
  - Reverting upstream reports, removing provenance/license evidence, changing the four-Skill suite, or weakening mutation/Git/verification authority boundaries.

## Spec
### MODIFIED
- Requirement: Candidate work begins from one demonstrated RSP gap and a concise capability delta, not from exhaustive capability coverage.
  - A candidate delta names the baseline failure, three to five non-default behaviors, hard authority boundaries, and one returned owner.
  - Cross-source models and complete path inventories are optional audit evidence rather than candidate prerequisites.
- Requirement: Candidate iteration uses evidence proportional to maturity.
  - Draft candidates receive portable static validation, deterministic hard-boundary checks, and a small unseen real-task holdout.
  - Repeated provider matrices, cost calibration, and broad compatibility evidence are reserved for an explicitly selected release candidate.
  - Evaluation measures task success, corrections, total tokens, elapsed time, and tool calls; input-token overhead alone is insufficient.
- Requirement: Runtime Skills contain only RSP-specific procedure and hard safety boundaries.
  - `rsp-shape` preserves evidence-first clarification, the Shape Ready gate, and existing Change/Group ownership without fixed evaluator-facing response tokens.
  - `rsp-implement` preserves selected-Change authority, unrelated-work safety, truthful task/blocker state, and fresh verification while allowing bounded repository discovery.

### Acceptance
#### Scenario: maintainer extracts a future native Skill
- GIVEN one or more complete upstream reports and an observed RSP workflow failure
- WHEN the maintainer starts a candidate Change
- THEN the Change can cite only the reports and recommendations needed for a three-to-five-item capability delta
- AND no exhaustive catalog, cross-source model, or repeated provider matrix is required during drafting

#### Scenario: an agent uses the simplified implementation Skill
- GIVEN one selected ready Change and project instructions
- WHEN the agent discovers the required implementation owners
- THEN it may inspect the smallest relevant repository behavior chain instead of relying on a capability-owned heuristic resolver
- AND it still preserves unrelated work, explicit authority, and fresh verification truthfully

## Design
- Approach:
  - Treat existing upstream reports and capability models as retained research evidence, not mandatory productization stages.
  - Rewrite each runtime Skill from its demonstrated capability delta and delete evaluator-specific wording that does not change general behavior.
  - Keep schema/package/provenance checks; remove synthetic model-run harnesses and the implementation resolver from the published package.
- Affected areas:
  - `.agents/skills/distill-upstream/SKILL.md`
  - `research/README.md` and `research/models/rsp-skill-system.md`
  - `skills/rsp-shape/` and `skills/rsp-implement/`
  - Skill contract/evaluation tests and minimum-suite RSP artifacts
- Constraints:
  - Preserve license notices, host-neutral metadata, package boundaries, no implicit Git/publication authority, and truthful verification.
  - Do not delete historical research reports or evaluation evidence.

## Tasks
- [x] Finalize the gap-driven candidate and maturity-proportional evidence contract.
- [x] Simplify `rsp-shape` and its static contract checks.
- [x] Simplify `rsp-implement`, remove the resolver, and update its static contract checks.
- [x] Remove per-candidate model harnesses and fixture-shaped behavior tests.
- [x] Update maintainer research guidance and stable design facts.
- [x] Run focused Skill validation, project gates, and package boundary checks.

## Verify
- Automated:
  - [x] Agent Skills validation passed for `skills/rsp-shape` and `skills/rsp-implement`.
  - [x] Focused Skill contract tests passed; build, typecheck, lint, and full test passed with 11 files and 264 tests.
  - [x] Package dry-run includes only canonical Skill payloads and no research/test/resolver artifact; focused RSP check and `git diff --check` passed.
- Manual:
  - [x] Two independent read-only unseen passes confirmed both Skills permit normal bounded repository reasoning; concise clarifications were added for artifact authority, Group closure, unsafe overlap, and failed versus unavailable verification.
- Durable updates:
  - [x] Updated `.rsp/specs/design.md` with the gap-driven candidate and release-candidate evidence boundary.

## Blockers
- none
