---
kind: "feature"
---

# Change: minimum-skill-suite/build-rsp-shape

## Proposal
- Summary: Build and promote the host-neutral RSP shaping/slicing Discipline Skill.
- Why:
  - The minimum suite needs a bounded bridge from unclear non-trivial intent to an executable Change.
- Scope:
  - Create, evaluate, revise, and promote one `rsp-shape` candidate from selected shaping recommendations.
- Non-goals:
  - Implementing the shaped work, requiring shaping for tiny tasks, adding another tracker/lifecycle, or interrogating users after the Change is objectively ready.
  - Requiring a separate grilling Skill; installed interview capabilities remain optional escalation for high-risk design choices.

## Spec
### ADDED
- Requirement: `rsp-shape` produces or refines one authorized Change with settled intent, explicit ambiguity, verifiable slices, and no implementation.
  - It preserves the six-section Change contract and shallow Group boundary.
  - Before asking, it inspects available project evidence and distinguishes discoverable facts from owner decisions.
  - It runs a bounded clarification loop: identify material ambiguities, ask the smallest high-value question set, update the authorized Change from answers, and repeat until the Shape Ready Gate passes or one explicit blocker remains.
  - It never treats agent confidence as readiness. The gate requires a clear outcome and non-goals, concrete acceptance scenarios, decision authority, affected boundaries and constraints, no hidden implementation-changing assumption, executable Tasks, truthful Blockers, and verification that can prove the outcome.
  - It stops for unresolved owner decisions, records authorized assumptions explicitly, and preserves unrelated work.

### Acceptance
#### Scenario: user asks to shape a non-trivial change
- GIVEN project authority and explicit permission to create or edit the selected RSP Change
- WHEN `rsp-shape` runs
- THEN Proposal, Spec, Design, Tasks, Verify, and Blockers become coherent and executable
- AND no source implementation, Git operation, or parallel workflow artifact is created

#### Scenario: material ambiguity requires more than one clarification round
- GIVEN repository evidence cannot determine decisions that would change behavior, data, interfaces, authority, compatibility, module boundaries, or acceptance
- WHEN `rsp-shape` prioritizes and asks clarification questions
- THEN each round resolves the highest-impact ambiguity and writes authorized answers into their owning Change sections
- AND shaping continues until the objective Shape Ready Gate passes or returns one explicit unresolved blocker without inventing a choice

#### Scenario: deep product challenge exceeds ordinary shaping
- GIVEN the Change boundary is known but a high-risk product or design choice needs adversarial exploration
- WHEN an installed grilling/interview capability is available and explicitly selected
- THEN `rsp-shape` may return that optional next action and later consume its settled decisions
- AND the external capability does not become a dependency, work owner, or second lifecycle for `rsp-shape`

## Design
- Approach:
  - Follow the candidate-to-stable path proven by `rsp-review`: frozen research contract, isolated fixtures, repeated quality/cost evaluation, normal promotion Change evidence, and one canonical stable payload.
  - Select `rsp-skill-system` S5/S8 and `rsp-shaping-capability` S1-S5; cite the applicable coverage rows, report recommendations, exact paths, and adoption modes in candidate provenance.
  - Treat clarification as core shaping behavior and deep grilling as optional composition: inspect before asking, prioritize questions by implementation impact, ask in small rounds, reflect answers into existing owners, then re-evaluate the deterministic readiness gate.
- Affected areas:
  - `research/candidates/skills/rsp-shape/`
  - shaping behavior/evaluation fixtures
  - promoted `skills/rsp-shape/`
- Constraints:
  - Cite selected report/model recommendations and preserve license/provenance outside runtime context.
  - Keep unresolved questions in the conversation or owning Change Blockers; do not introduce a question ledger, hidden readiness state, or subjective "clear enough" decision.

## Tasks
- [x] Freeze the candidate contract, clarification loop, Shape Ready Gate, optional grilling boundary, and provenance.
- [x] Build the smallest candidate and shaping-specific evaluation matrix.
- [x] Repair and calibrate until all promotion gates pass.
- [x] Promote one canonical Skill and verify the package boundary.
- [x] Update shared package/user documentation during minimum-suite integration.

## Verify
- Automated:
  - [x] Static Agent Skills validation and deterministic behavior/restraint harness tests.
  - [x] Full project build, typecheck, lint, and test gates pass after promotion (13 test files, 285 tests).
  - [x] Complete three fresh real-provider 15-case paired matrices and context-cost calibration for frozen candidate `2026.07.20.11`.
  - [x] Run full project gates and package boundary smoke tests after promotion.
- Manual:
  - [x] Real-host fixtures shape a new Change, refine an existing Change, exercise multi-round clarification, stop on unresolved choice, return an optional deep-grilling handoff, and skip a tiny settled task.
- Durable updates:
  - [x] Update `.rsp/specs/design.md` after promotion succeeds.

## Blockers
- requires `skill-capability-research/synthesize-shaping-capability`: needs the selected shaping contract
- requires `skill-capability-research/reconcile-skill-system`: needs the reconciled minimum-suite decision
