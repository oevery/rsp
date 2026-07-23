---
kind: feature
---

# Change: guide-archive-before-final-commit

## Proposal
- Outcome: Guide explicit archive before the final Git commit
- Why:
  - Completed Changes can remain under `changes/` when implementation is committed before the explicit lifecycle transition, leaving repository history inconsistent with RSP state.
  - Machine consumers can observe `archiveReady` but currently must invent the concrete archive action.
- Scope:
  - Add a successful `nextActions` contract to `rsp ready --json` and `rsp show --json` that recommends the exact archive command only when deterministic archive readiness is `yes`.
  - Mirror that action in human `ready` and `show` output.
  - Guide agents and maintainers to archive completed RSP work before the final Git commit while preserving separate Git authority.
- Non-goals:
  - Automatically archive, stage, commit, or install a Git hook.
  - Recommend archive while readiness is `judgment` or `no`.
  - Add a combined finish command or another lifecycle state.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: Archive-ready inspection returns an explicit bounded next action.
  - Successful `ready` and `show` results include `nextActions: string[]`.
  - `nextActions` is exactly `Run: rsp archive <work-ref>` when `archiveReady` is `yes`, and empty otherwise.
- Requirement: Completion guidance orders RSP lifecycle before final Git delivery.
  - Core guidance and public workflow documentation say to run explicit archive before the final Git commit.
  - Archive readiness and archive mutation do not grant Git commit, push, or publication authority.

### Acceptance
#### Scenario: Ready Change exposes archive action
- GIVEN a Change with completed Tasks and Verify, at least one Scenario, and no active blocker
- WHEN an agent runs `rsp ready <name> --json` or `rsp show <name> --json`
- THEN the result contains `nextActions: ["Run: rsp archive <name>"]`

#### Scenario: Unready Change does not encourage archive
- GIVEN a Change whose deterministic archive readiness is `judgment` or `no`
- WHEN an agent runs `rsp ready <name> --json` or `rsp show <name> --json`
- THEN the result contains `nextActions: []`

#### Scenario: Final commit remains separately authorized
- GIVEN implementation and required verification are complete
- WHEN Core derives the completion action
- THEN it guides explicit archive before the final Git commit without inferring Git authority or performing either operation automatically

## Design
- Approach:
  - Derive the successful next action from the shared archive-readiness value and expose it through both inspection commands.
  - Render the same returned action in human output so JSON and interactive guidance remain aligned.
  - Strengthen Core and public workflow text with the archive-before-final-commit ordering and explicit authority boundary.
- Boundaries:
  - CLI inspection derives advice only; `rsp archive` remains the sole lifecycle mutation.
  - RSP owns lifecycle guidance; the host project or user retains Git authority.
- Affected areas:
  - `src/core/helpers.ts`, `src/commands/ready.ts`, and `src/commands/show.ts`
  - `test/integration.test.ts` and `test/helpers.test.ts`
  - `skills/rsp/SKILL.md`, `rules/rsp-rules.md`, README files, and `.rsp/specs/design.md`
  - built CLI and retained exact-package native-design evidence
- Constraints:
  - Keep `open -> archived` as the complete lifecycle and preserve explicit archive mutation.
  - Do not emit the archive action for `judgment` merely because `rsp archive` itself permits a warning override.
  - Keep pretty and compact JSON semantically identical.

## Tasks
- [x] Add readiness-derived `nextActions` to successful `ready` and `show` output.
- [x] Align human output and archive-before-final-commit guidance without granting Git authority.
- [x] Update durable design facts, generated fallback/build output, and retained exact-package evidence.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/integration.test.ts test/helpers.test.ts` — proves: 200 focused CLI and Core guidance tests passed after observed RED.
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run lint && mise exec -- pnpm run typecheck && mise exec -- pnpm run test` — proves: build, lint, typecheck, and all 359 tests passed.
  - [x] `node scripts/native-design-composition-eval.mjs --run-real && node scripts/native-design-composition-eval.mjs` — proves: real-host and retained re-score passed for exact package `becfe2c099656c1907d7a295ad890b3057994165b123ed8ba5d2cd8be264c47c`.
- Manual or environment:
  - [x] Inspect pretty and compact `ready/show` JSON for one ready and one incomplete Change — proves: ready output exposed only `Run: rsp archive guide-archive-before-final-commit`; incomplete output exposed `nextActions: []`.
- Coverage:
  - No automatic Git/archive behavior is tested because it is explicitly out of scope.

## Blockers
- none
