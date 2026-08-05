---
kind: "refactor"
---

# Change: skill-context-optimization/manage-progressive-disclosure

## Proposal
- Outcome: Routine Manage execution loads only its eager execution kernel and conditionally reads inactive interruption, review-convergence, and closeout procedures.
- Why:
  - `rsp-manage/SKILL.md` currently loads every branch on every managed run.
- Scope:
  - Move detailed interruption/recovery, managed review convergence, and lifecycle/commit closeout procedures into package-local references.
  - Keep entry validation, frontier classification, worker schemas, acceptance fail-safes, dispatch, and return boundaries eager.
- Non-goals:
  - Changing Manage qualification, worker limits, retry limits, acceptance values, closeout policy, or remote authority.

## Spec
### MODIFIED
- Requirement: `rsp-manage` uses progressive disclosure without splitting semantic ownership.
  - The main Skill names exact load conditions and retains the fail-safe needed before each reference is read.
  - Each detailed procedure remains inside the `rsp-manage` package and is loaded only when its path is active.

### Acceptance
#### Scenario: Ordinary managed implementation
- GIVEN a selected managed owner that does not pause, enter finding correction, or reach closeout
- WHEN Manage executes and verifies the owned work
- THEN interruption, convergence, and closeout procedure bodies are not part of the eager Skill body

## Design
- Approach:
  - Add package-local conditional references with explicit load guards.
  - Preserve a compact eager safety kernel for incomplete acceptance and dormant closeout.
- Boundaries:
  - Core retains initial qualification; Commit retains exact Git execution.
- Affected areas:
  - `skills/rsp-manage/SKILL.md`
  - `skills/rsp-manage/references/`
  - Manage and runtime-context contract tests
  - `.rsp/specs/skill-system.md` when the stable loading contract changes
- Constraints:
  - All references must remain portable within the Skill package.

## Tasks
- [x] Extract inactive procedure owners and add explicit load conditions.
- [x] Update structural contracts without weakening behavior holdouts.
- [x] Measure eager and branch-loaded word/token proxies against the starting body.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/managed-controller-contract.test.ts test/skill-runtime-context-contract.test.ts test/skill-contract.test.ts test/artifact-continuation-contract.test.ts test/rsp-core-routing-contract.test.ts --reporter=dot --no-file-parallelism` — 5 files and 100 tests passed; proves ownership, portability, stop, acceptance, source-closure, and loading contracts.
  - [x] `mise exec -- pnpm exec eslint test/managed-controller-contract.test.ts test/rsp-core-routing-contract.test.ts test/skill-runtime-context-contract.test.ts test/artifact-continuation-contract.test.ts` — scoped lint passed.
  - [x] `git diff --check` — tracked diff has no whitespace errors.
- Manual or environment:
  - [x] Record eager-body and conditional-branch size before and after — eager Manage fell from 2710 to 2125 words (585 fewer, 21.6%); interruption-only loads 2322, review-only 2284, and closeout-only 2531 words including the selected reference.
- Coverage:
  - Deterministic controller fixtures and source-closure contracts remained unambiguous; no provider comparison was required.

## Blockers
- requires `skill-context-optimization/semantic-contract-tests`: contract structure must support procedure movement without broad wording churn.
