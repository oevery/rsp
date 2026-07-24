---
kind: "fix"
---

# Change: ignore-blocker-template-comments

## Proposal
- Outcome: Ignore non-semantic template comments when deriving Blockers
- Why:
  - Full and lite Change templates place an HTML guidance comment inside `Blockers`, while both blocker parsers treat every non-`none` line as a real external blocker. Newly created Changes therefore appear blocked before users add any blocker.
- Scope:
  - Give blocker derivation one comment-aware line extractor, remove redundant guidance comments from generated Changes, and cover the real CLI path plus positive blocker cases.
- Non-goals:
  - Changing dependency syntax, archive warning policy, blocker prose semantics, Change section structure, or automatically rewriting existing project files.

## Spec
### MODIFIED
- Requirement: blocker derivation ignores non-semantic Markdown comments
  - A well-formed `<!-- ... -->` comment in `Blockers` does not create an external blocker or dependency edge.
  - `none`, real external prose, valid `- requires \`<work-ref>\`: <reason>`, and malformed or unterminated input retain their current fail-open or fail-closed semantics as applicable.
  - Newly generated full and lite Changes do not persist blocker-syntax guidance comments and start unblocked until a real blocker is added.

### Acceptance
#### Scenario: generated Change starts unblocked
- GIVEN a newly generated full or lite Change whose `Blockers` value is `none`
- WHEN `status`, `show`, `ready`, or archive readiness derives blocker state
- THEN the Change has no active blocker

#### Scenario: existing comments remain non-semantic
- GIVEN `Blockers` contains `none` and a well-formed single-line or multiline HTML comment, including text shaped like `requires`
- WHEN blocker state and dependency edges are derived
- THEN the comment creates neither an external blocker nor a dependency edge

#### Scenario: real blocker behavior is preserved
- GIVEN external blocker prose, a valid prerequisite, malformed dependency syntax, or an unterminated comment outside any completed HTML comment
- WHEN blocker state is derived
- THEN the existing blocker, edge, or fail-closed diagnostic remains visible

## Design
- Approach:
  - Strip only well-formed HTML comments before extracting and normalizing the `Blockers` section, then make `hasMeaningfulBlockers` and dependency parsing consume that shared normalized line set.
  - Remove the redundant comment from full and lite Change templates so new persistent artifacts contain only user-owned blocker state.
- Boundaries:
  - `src/core/helpers.ts` owns section normalization and templates; `src/core/dependency-plan.ts` owns prerequisite/external classification; CLI commands consume their derived result unchanged.
- Affected areas:
  - `src/core/helpers.ts`, `src/core/dependency-plan.ts`
  - focused helper/integration tests and `.rsp/specs/design.md`
- Constraints:
  - Preserve real external prose, valid prerequisite edges, malformed dependency diagnostics, group inheritance, and archive command behavior; incomplete comments remain visible rather than being silently discarded.

## Tasks
- [x] Add one shared comment-aware Blockers line extractor and route both blocker classifiers through it.
- [x] Remove blocker guidance comments from generated full and lite Changes.
- [x] Add focused regression coverage for generated Changes, comments, real prerequisites, external prose, and fail-closed malformed input.
- [x] Record the implemented stable blocker-comment behavior and run fixed-scope review plus required verification.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/helpers.test.ts test/integration.test.ts` — 2 files and 212 tests passed; proves helper semantics and real CLI blocker projection.
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run typecheck && mise exec -- pnpm run lint && mise exec -- pnpm run test` — all gates passed; full suite: 42 files and 448 tests.
  - [x] `node dist/cli.mjs check --focused && git diff --check` — focused Change valid; diff hygiene passed.
- Manual or environment:
  - [x] Generate full and lite Changes in an isolated project and confirm `show --json` reports `blockers: false` and `activeBlockers: false` before real blockers are added.
- Coverage:
  - Focused tests cover both classifier owners and their production CLI consumers. Fixed-scope Code and Document review was clean. Immutable real-host run `device-discovery-boundary-ignore-blocker-template-comments` passed every score gate for the changed package identity; no migration is required.

## Blockers
- none
