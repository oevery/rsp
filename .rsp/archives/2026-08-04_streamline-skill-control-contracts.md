---
kind: "refactor"
---

# Change: streamline-skill-control-contracts

## Proposal
- Outcome: Make the Skill control model semantically complete and single-owned at runtime, then remove duplicated projections without weakening authority, stop, failure, acceptance, or closeout behavior.
- Why:
  - Core's optional-capability fallback can be read as permitting substitution for a required managed worker, while Shape does not return a canonical stop and resume contract when its ready gate fails.
  - Intake compatibility mappings and required-worker failure conditions are repeated across always-loaded and conditionally loaded Skills; stale `PREFLIGHT` terminology already demonstrates drift.
- Scope:
  - Scope optional manual fallback to optional Discipline Skills and explicitly exclude required managed workers and required independent verification.
  - Give every non-ready Shape return an applicable `StopDisposition`, next owner, required input, and resume rule.
  - Keep the exact compatibility Intake schema in `rsp-manage`; reduce Core and managed-routing to routing selection and concise outcome consumption.
  - Replace stale `PREFLIGHT` prose with `INTAKE` and centralize required-worker acceptance failure semantics inside `rsp-manage`.
  - Update focused contracts, fallback rules, and the current product composition lock.
- Non-goals:
  - Do not change the canonical disposition sets, Manage qualification, lane result schemas, dispatch or retry limits, closeout tiers, P1 behavior, or external beta evidence.
  - Do not shorten unrelated Skill prose or introduce a runtime glossary dependency.

## Spec
### MODIFIED
- Requirement: optional capability fallback never substitutes for required managed evidence
  - Missing optional Discipline Skills use their bounded manual fallback against the same owner.
  - A required managed worker or required independent Verify that cannot be created or evidenced returns the applicable stop and keeps acceptance incomplete.
- Requirement: Shape returns a complete control outcome
  - A ready Shape result returns `OwnershipDisposition: ready` to Core.
  - A material owner question returns `StopDisposition: ask-owner`, next owner `owner`, and resumes Shape from fresh evidence after the answer.
  - Any other blocker returns its applicable canonical `StopDisposition`, next owner, required input, and resume rule; unresolved fog is never relabeled ready.
- Requirement: Intake has one detailed runtime owner
  - `rsp-manage` owns the exact compatibility labels, canonical mappings, response schema, and resume contracts for Intake.
  - Core selects the route, managed-routing defines selection/requalification and consumes the returned canonical outcome, and neither duplicates the detailed compatibility mapping.
  - All current prose uses `INTAKE`; no named `PREFLIGHT` phase remains.
- Requirement: required-worker failure semantics are defined once
  - The acceptance section owns the complete conditions that force `AcceptanceDisposition: incomplete`.
  - Dispatch applies that rule to `capability-unavailable`; closeout derives only from the resulting acceptance state without repeating the failure set.

### Acceptance
#### Scenario: an optional fallback cannot replace required managed evidence
- GIVEN an optional Discipline Skill is unavailable or a required managed worker cannot be created
- WHEN Core or Manage derives the next action
- THEN only the optional Discipline may use its bounded manual fallback, while the required worker path stops and acceptance remains incomplete

#### Scenario: Shape returns an explicit non-ready control outcome
- GIVEN the Shape Ready gate fails on an owner question or another blocker
- WHEN Shape returns control
- THEN it names the applicable canonical stop, next owner, required input, and resume rule without claiming ready ownership

#### Scenario: Intake detail is loaded from one owner
- GIVEN Core selects a managed completion or continuation
- WHEN the runtime loads managed-routing and `rsp-manage`
- THEN only `rsp-manage` contains the complete compatibility mapping, managed-routing consumes concise canonical outcomes, and no stale `PREFLIGHT` phase remains

#### Scenario: closeout reuses acceptance instead of restating worker failures
- GIVEN required managed evidence is missing or invalid
- WHEN acceptance and closeout are derived
- THEN the complete failure rule is defined once in acceptance and closeout remains `not-eligible` through that result

## Design
- Approach:
  - Correct the P2 semantic boundaries before deleting duplication.
  - Preserve one detailed source per contract and keep only the minimum routing projection needed by each caller.
  - Replace tests that require duplicate paragraphs with tests for ownership boundaries, forbidden stale terms, and preserved behavior.
- Boundaries:
  - Core owns route selection and optional Discipline fallback.
  - Shape owns clarification and complete ready/non-ready returns.
  - `rsp-manage` owns exact Intake and acceptance contracts; managed-routing owns conditional selection, requalification, and dormant closeout.
  - Fallback rules remain conservative and do not emulate Manage.
- Affected areas:
  - `.rsp/specs/skill-control-model.md`
  - `skills/rsp/SKILL.md`, `skills/rsp-shape/SKILL.md`, `skills/rsp-manage/SKILL.md`, and `skills/rsp/references/managed-routing.md`
  - `rules/rsp-rules.md` and generated `.rsp/rsp-rules.md`
  - focused Core, Shape, Manage, and runtime-context contract tests
- Constraints:
  - Preserve every canonical enum and P1 correction.
  - Keep historical retained beta evidence immutable; refresh only the current composition lock if required by the full suite.
  - Use semantic assertions rather than exact duplicated prose.

## Tasks
- [x] Fix optional fallback and Shape non-ready outcome semantics with focused tests.
- [x] Establish `rsp-manage` as the detailed Intake owner and remove duplicate Core/reference mappings.
- [x] Replace stale `PREFLIGHT` terminology and centralize required-worker acceptance failure semantics.
- [x] Synchronize fallback rules and update affected contract tests.

## Verify
- Automated:
  - [x] Focused Core, Shape, Manage, runtime-context, continuation, assisted-loop, and Discipline tests passed; 19/19 managed-controller fixtures and the beta contract passed — proves: semantic boundaries, single-owner projections, and active compatibility coverage.
  - [x] `mise exec -- pnpm run build`, fallback byte comparison, `mise exec -- pnpm run lint`, full 55 files / 657 tests, and `git diff --check` passed — proves: package-wide compatibility.
- Manual or environment:
  - [x] Independent Verify inspected the loaded Core → managed-routing → Manage chain, confirmed `rsp-manage` is the only detailed Intake owner, confirmed complete Shape and required-worker stop/failure behavior, and found no skipped fixture.
- Coverage:
  - Does not rerun or replace external retained beta evidence.

## Blockers
- none
