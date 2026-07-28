---
kind: "fix"
---

# Change: harden-adoption-routing/stabilize-owner-routing

## Proposal
- Outcome: Bounded Pre-Change Design selects `rsp-design`, and switching WorkRefs never silently overlays overlapping dirty work.
- Why:
  - One adoption run manually emulated Pre-Change Design despite the installed capability, while another started a new Change over uncommitted product paths owned by an archived Change.
- Scope:
  - Strengthen capability selection and add a dirty owner-transition preflight with focused contract coverage.
- Non-goals:
  - Do not require Git commits, forbid all concurrent Changes, or make report-only Design create artifacts.

## Spec
<!-- Describe expected correct behavior. Implementation notes belong in ## Design. -->
### MODIFIED
- Requirement: owner and capability transitions are explicit.
  - A bounded report-only design question with no focus selects installed `rsp-design`; manual fallback is used only when unavailable.
  - Before focusing or mutating another WorkRef, Core inspects dirty paths against the prior owner; overlapping product or durable-truth paths require continuation/reopen, an explicit integration owner, or a stop for boundary resolution.
  - Disjoint authorized work may proceed without forcing a commit.

### Acceptance
#### Scenario: design and dirty owner transition
- GIVEN `rsp-design` is installed and no Change is focused
- WHEN the user asks one bounded module/seam question
- THEN Core selects report-only Pre-Change Design without creating a Change
- AND when later selecting a different WorkRef, overlapping uncommitted paths are resolved before mutation

## Design
- Approach:
  - Make installed-capability selection normative and add a compact dirty-path ownership gate before selection changes.
- Boundaries:
  - Core routing and worktree ownership; no new persisted controller state.
- Affected areas:
  - `skills/rsp/SKILL.md`, `skills/rsp-design/SKILL.md`, and `skills/rsp/references/managed-routing.md`
  - Skill composition and managed-controller contract coverage
- Constraints:
  - Preserve direct tiny work, report-only Design, disjoint dirty work, and explicit Git authority boundaries.

## Tasks
- [x] Add capability/owner-transition guards and regression coverage.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/rsp-design-skill-contract.test.ts test/rsp-core-routing-contract.test.ts` — 18 tests passed; proves installed Design selection, missing-capability fallback, and Core dirty-overlap routing.
  - [x] `mise exec -- pnpm exec vitest run test/managed-controller-contract.test.ts -t 'keeps dirty product and durable-truth paths with an explicit owner across transitions'` — 1 test passed; proves the managed preflight preserves explicit owner transitions.
- Manual or environment:
  - [x] Inspected the authored Core, Design, and managed preflight together: bounded Pre-Change Design selects the installed Skill without a synthetic Change, overlapping owned paths require an explicit resolution, and disjoint authorized dirty work remains non-blocking.
- Coverage:
  - Git staging/commit behavior remains owned by `rsp-commit`.

## Blockers
- none
