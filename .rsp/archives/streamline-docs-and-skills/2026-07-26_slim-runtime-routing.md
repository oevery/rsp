---
kind: "refactor"
---

# Change: streamline-docs-and-skills/slim-runtime-routing

## Proposal
- Outcome: Keep Manage details out of default Core and fallback context while preserving safe qualification, delegation, convergence, lifecycle, and authority behavior.
- Why:
  - Core, fallback, and `rsp-manage` currently repeat the controller protocol; the fallback is larger than Core despite being the minimal compatibility path.
- Scope:
  - `skills/rsp/SKILL.md`, a conditional Core reference, `rules/rsp-rules.md`, synchronized `.rsp/rsp-rules.md`, and owning static/behavior tests.
- Non-goals:
  - Redesigning Manage, changing authority, adding retries, changing discipline Skills, or accepting lower behavior quality merely for fewer tokens.

## Spec
### MODIFIED
- Requirement: progressive Manage routing
  - Core keeps the explicit trigger, preflight, eligibility, stopping, and owner-return contract, and loads detailed managed continuation only on that route.
  - The conditional reference uses explicit leading phases and testable completion conditions.
- Requirement: safe minimal fallback
  - Without the Skill suite, fallback performs one bounded Core action and does not emulate multi-step Manage dispatch or review convergence.
  - Fallback retains all authority, safety, selection, verification, durable-decision, archive-advice, and Git/publication boundaries needed for safe ordinary work.
- Requirement: regression protection
  - Static tests assert routing ownership and a meaningful `fallback < core` size relationship rather than requiring duplicated controller phrases.
  - Existing real-derived behavior, restraint, and ambiguity fixtures remain green in a fresh immutable evaluation run when the harness supports the changed prompt identity.

### Acceptance
#### Scenario: behavior is preserved after restructuring
- GIVEN the existing Core, fallback, Manage Skill, and evaluation fixtures
- WHEN ordinary and explicit managed requests are routed after the refactor
- THEN ordinary requests avoid controller detail, managed requests load the owning path, fallback degrades to one safe action, and authority boundaries remain unchanged

## Design
- Approach:
  - Extract detailed Core managed routing into `skills/rsp/references/managed-routing.md` and keep a compact entry route in Core.
  - Replace fallback controller duplication with a conservative no-controller rule and update tests to validate ownership and behavior.
- Boundaries:
  - Core owns stage selection; `rsp-manage` owns controller execution; fallback owns safe operation when Skills are unavailable.
- Affected areas:
  - `skills/rsp/SKILL.md`, `skills/rsp/references/managed-routing.md`, `rules/rsp-rules.md`, `.rsp/rsp-rules.md`
  - Skill contract, evaluation, and fallback synchronization tests under `test/`
- Constraints:
  - Authoritative source is edited before generated fallback; retained evidence is never overwritten; any fresh model run gets a new run ID.

## Tasks
- [x] Extract and structure the detailed managed route behind a conditional Core reference.
- [x] Reduce fallback to safe single-action behavior and update size/ownership assertions.
- [x] Build the CLI, synchronize `.rsp/rsp-rules.md`, and run static plus behavior verification.

## Verify
- Automated:
  - [x] `mise exec -- pnpm vitest run test/rsp-core-routing-contract.test.ts test/helpers.test.ts test/artifact-integrity.test.ts test/rsp-release-docs-skill-contract.test.ts test/project-skill-dogfood.test.ts` — 83 static contract tests pass.
  - [x] Fresh native Design evaluation passed all 16 gates under run `device-discovery-boundary-streamline-docs-and-skills-2026-07-26-final`; fresh Manage review-convergence run `review-convergence-product-aPq8hO` completed three correction passes, clean re-review, archive, and 3/3 fixture tests without commit, push, or publication.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `mise exec -- pnpm run test`, and `git diff --check` — all pass; the full suite reports 45 files and 511 tests.
- Manual or environment:
  - [x] Core is 1,491 words, its conditional managed reference is 559 words, and fallback is 1,415 words; inspected trigger → owner preflight → Manage qualification → continuation/convergence → lifecycle/Git separation end to end.
- Coverage:
  - One provider/model qualification per fresh evaluation only; results establish current-path compatibility, not cross-provider performance.

## Blockers
- none
