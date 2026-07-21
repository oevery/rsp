---
kind: "feature"
---

# Change: 3-0-skill-readiness/integrate-diagnosis-tdd-routing

## Proposal
- Summary: Add deterministic, host-neutral routing from implementation evidence to diagnosis, TDD, or ordinary implementation.
- Why:
  - The minimum suite currently treats diagnosis and TDD as external but does not define when either is the one next action or how work proceeds when the optional Skill is absent.
  - Failed verification must not trigger a guessed regression test or speculative fix when the cause is still unknown.
- Scope:
  - Define evidence-based branch precedence in `rsp` and reinforce it inside `rsp-implement` when new implementation evidence appears.
  - Provide manual diagnosis and TDD fallbacks that preserve the selected Change as owner.
  - Add focused contract tests for routing, availability, fallback, owner return, and non-recursive composition.
- Non-goals:
  - Publish RSP-owned diagnosis or TDD Skills, implement a controller, or add hidden run state.
  - Broaden Git, review, release, deployment, approval, or external-action authority.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: RSP routes implementation evidence through exactly one diagnosis, TDD, or ordinary implementation branch.
  - An observed failure with an unexplained cause or owning layer routes to diagnosis before TDD.
  - A clear testable behavior routes to TDD only when a focused test can demonstrate the expected missing behavior and new behavioral evidence is required.
  - Work with an evidenced cause and no required test-first cycle continues through ordinary implementation.
- Requirement: Optional disciplines preserve portable fallback and RSP authority.
  - `diagnosing-bugs` or `tdd` may be named only when present in the loaded Skill inventory; otherwise the route names a concrete manual fallback.
  - Every branch returns results to the same selected Change and grants no additional mutation, Git, review, publication, or approval authority.
  - `rsp-implement` never recursively invokes another user-facing Skill; new evidence is returned to Core, the user, or an authorized controller for selection.

### Acceptance
#### Scenario: failed verification has no evidenced cause
- GIVEN a ready selected Change whose implementation check produces an observed failure but does not establish the cause or owning layer
- WHEN Core derives the next action
- THEN diagnosis is selected before TDD when `diagnosing-bugs` is available, otherwise Core provides the manual diagnosis fallback, and the selected Change remains the returned owner

#### Scenario: required behavior is clear and testable
- GIVEN a ready selected Change with no unexplained failure and a clear behavior that a focused failing test can demonstrate
- WHEN Core derives the next action
- THEN TDD is selected when `tdd` is available, otherwise Core provides the manual TDD fallback before production mutation

#### Scenario: ordinary implementation remains sufficient
- GIVEN the required edit and cause are evidenced and neither diagnosis nor a new test-first cycle is required
- WHEN Core derives the next action
- THEN ordinary implementation is selected without enumerating or recursively invoking optional capabilities

## Design
- Approach:
  - Add one compact implementation-evidence classifier to Core with diagnosis-before-TDD precedence and exact host-inventory availability rules.
  - Mirror the classifier at the `rsp-implement` mutation boundary so newly discovered failures cannot silently continue down the wrong path.
  - Encode the stable semantic contract in focused source-level tests without fixing complete response wording.
- Affected areas:
  - `skills/rsp/SKILL.md`
  - `skills/rsp-implement/SKILL.md`
  - `test/rsp-core-routing-contract.test.ts`
  - `test/rsp-implement-skill-contract.test.ts`
- Constraints:
  - Canonical behavior remains host-neutral and useful with only ordinary filesystem, project commands, and RSP artifacts.
  - Availability never implies invocation authority; no Skill recursively invokes another user-facing flow.
  - Classification and fallback create no state outside the selected Change and preserve all existing mutation and external-action boundaries.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Implement deterministic diagnosis, TDD, and ordinary implementation routing with manual fallbacks
- [x] Add focused Core and implementation contract coverage
- [x] Verify the result and write the stable routing contract to `.rsp/specs/design.md`

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/rsp-core-routing-contract.test.ts test/rsp-implement-skill-contract.test.ts` — 2 files and 6 tests passed
  - [x] `node dist/cli.mjs check --focused` — this Change produced no error or warning; the command reported one transient template warning in the independently owned sibling slice
- Manual:
  - [x] Confirmed the Core contract routes an unexplained failure to diagnosis, a clear testable behavior to TDD, and an evidenced low-risk edit to ordinary implementation, with an executable manual fallback when the named optional Skill is absent
- Durable updates:
  - [x] Decided that the shipped routing and non-recursive implementation behavior are stable product facts owned by `.rsp/specs/design.md`
  - [x] Wrote only the stable current behavior to `.rsp/specs/design.md`; no Decision Record is needed because this slice applies the Group's existing authority and host-neutrality constraints

## Blockers
- none
