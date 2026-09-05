---
kind: "feature"
---

# Change: agent-evaluation-suite/agent-rsp-routing-evaluation

## Proposal
- Outcome: Evaluate RSP Core routing and Skill composition across explicit WorkOwner, Focus, authority, ambiguity, and stop conditions.
- Why:
  - A Skill can pass in isolation while Core selects the wrong owner, grants the wrong authority, or loses the stop/return contract.
- Scope:
  - Cover direct Change, Group, FocusSet, readiness, ambiguity, design, review, implementation, verification, Manage, and Skill composition journeys.
  - Capture Core route, dispatch disposition, authority, WorkRef, evidence handoff, and stop disposition. Actual worker dispatch, lifecycle, and resource observations belong to the worker child.
- Non-goals:
  - Do not redefine foundation evidence or scorer semantics.
  - Do not evaluate worker scheduling internals, project acceptance, or real provider quality.

## Spec
### ADDED
- Requirement: Each routing journey MUST declare the intended WorkOwner, authority boundary, next owner, required evidence, and stop/resume rule.
- Requirement: The routing matrix MUST cover direct Change, Group, Focus ambiguity, authority stop, Shape/Design/Review/Verify phase composition, and Manage qualification; each applicable journey MUST include a positive route and a fail-closed or near-miss route.
- Requirement: The evaluator MUST distinguish valid direct routing, required Shape/Design/Review/Verify routing, Manage qualification, and fail-closed stops.
- Requirement: Focus markers MUST be treated as candidates rather than authority, and routing reports MUST retain conflicts between Core decisions and host observations.
- Requirement: Routing findings MUST stop at the Core decision boundary; they MUST NOT duplicate host worker lifecycle or resource findings owned by the worker child.

### Acceptance
#### Scenario: Explicit WorkOwner wins candidate ambiguity
- GIVEN an explicit Change or Group reference plus multiple Focus candidates
- WHEN Core routing is evaluated
- THEN the selected WorkOwner matches the explicit reference and the report records Focus only as candidate context

#### Scenario: Missing authority stops safely
- GIVEN a request requiring missing product, acceptance, or external authority
- WHEN the route is evaluated
- THEN Core stops for the named owner/input and does not continue mutation or acceptance claims

#### Scenario: Skill composition returns bounded results
- GIVEN Core routes to a Discipline Skill or Manage
- WHEN the selected phase returns
- THEN phase-local route, dispatch, evidence, and acceptance details remain bounded and the next owner is explicit

## Design
- Approach:
  - Build scenario journeys from rsp, rsp-shape, rsp-design, rsp-review, rsp-verify, and rsp-manage contracts.
  - Use deterministic route assertions plus foundation-compatible AI trajectory analysis for semantic omissions.
- Boundaries:
  - This Change owns Core-route scenarios, phase composition, and expected authority outcomes; it does not change Core behavior or score host worker lifecycle.
- Affected areas:
  - verification/evaluations/rsp-routing/ and verification/tests/evaluation/rsp-routing-evaluation.test.ts.
- Constraints:
  - No external publication, approval, or real provider execution.

## Tasks
- [x] Build route journey manifests for direct, Shape, Design, Review, Verify, Manage, Group, Focus, and ambiguity cases.
- [x] Implement host-observed route/authority/evidence capture and deterministic route assertions.
- [x] Add composition, stop, recovery, and omission cases with foundation-compatible reports.
- [x] Add exact resume and coverage accounting for interrupted routing campaigns.

## Verify
### Required
- Automated:
  - [x] mise exec -- pnpm exec vitest run verification/tests/evaluation/rsp-routing-evaluation.test.ts --no-file-parallelism — 2 tests passed; proves 10 routing journeys covering direct, Group, Focus, authority stop, phase composition, and Manage.
  - [x] mise exec -- pnpm run typecheck — passed; route fixtures and reports remain typed.
  - [x] git diff --check — passed; changed artifacts contain no whitespace errors.
### Optional
- Manual or environment:
  - [x] Review a route trace with an ambiguity stop — integrated local report retains the stop reason and bounded resume rule.
- Coverage:
  - Real provider quality and project acceptance remain unverified.

## Blockers
- none
