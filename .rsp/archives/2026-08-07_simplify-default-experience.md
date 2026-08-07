---
kind: "refactor"
---

# Change: simplify-default-experience

## Proposal
- Outcome: Remove the redundant lite template path and reduce default CLI information density without changing RSP semantics
- Why:
  - The current `--lite` template keeps the same required sections, readiness gates, and lifecycle as the normal template while providing less useful kind-aware guidance.
  - Plain `rsp status` exposes Manage policy, the full dependency forest, and archive trend on every invocation even when the user only needs current work and the next action.
- Scope:
  - Remove the public `rsp create --lite` option and the dedicated lite renderer.
  - Keep one kind-aware Change scaffold and preserve the canonical six-section Change contract.
  - Make plain status compact by default; expose the existing advanced status details through `rsp status --verbose`.
  - Update CLI reference, getting-started guidance, design philosophy, and the authoritative core/CLI Specs.
- Non-goals:
  - Do not change JSON status values or dependency/readiness derivation.
  - Do not change direct-versus-Manage qualification, lifecycle states, FocusSet semantics, or Git/publication authority.
  - Do not add a persisted Lite/Practice/Managed mode.
  - Do not archive or commit this Change.

## Spec
### MODIFIED
- Requirement: Change creation uses one kind-aware scaffold and exposes no `--lite` option.
  - Existing Change files remain readable; the canonical Proposal, Spec, Design, Tasks, Verify, and Blockers sections remain unchanged.
- Requirement: Plain `rsp status` presents only the compact current-work summary by default.
  - The default view retains diagnostics, focus, Change/Group summaries, progress, blockers, and the derived next action.
  - `rsp status --verbose` additionally presents the resolved Manage policy, dependency forest, detailed dependency legend, and archive trend.
  - JSON output and its values remain unchanged.

### Acceptance
#### Scenario: creating a Change
- GIVEN an initialized project
- WHEN a user runs `rsp create small-fix --kind fix "Fix the small issue"`
- THEN the command creates the existing kind-aware six-section Change scaffold and rejects `--lite` as an unknown option

#### Scenario: compact status
- GIVEN a project with no open Changes
- WHEN a user runs `rsp status`
- THEN the output omits Manage policy, dependency-forest detail, and archive trend while retaining the current summary and next-action guidance

#### Scenario: verbose status
- GIVEN a project with a dependency and configured Manage policy
- WHEN a user runs `rsp status --verbose`
- THEN the output includes the advanced policy and dependency details that were previously shown by default

#### Scenario: machine status compatibility
- GIVEN any valid project status
- WHEN a user runs `rsp status --json`
- THEN the JSON fields and derived dependency/readiness values remain unchanged

## Design
- Approach:
  - Remove the `lite` CLI argument, the `options.lite` plumbing, and `generateLiteChangeContent`; route every Change creation through `getChangeTemplateByKind`.
  - Add a presentation-only `verbose` switch to plain status rendering, reusing the existing command flag and leaving `ProjectStatusView` and JSON projection untouched.
  - Keep advanced dependency data derived in the status view; only its plain-text presentation is conditional.
- Boundaries:
  - CLI parsing owns the removed option and status presentation flag.
  - `generateChangeContent` remains the single scaffold owner.
  - `printStatusPlain` owns compact versus verbose human output; `toStatusJson` remains stable.
- Affected areas:
  - `src/cli.ts`, `src/commands/create.ts`, `src/core/helpers.ts`, `src/status/plain.ts`
  - focused helper/status/integration tests
  - CLI docs, getting-started docs, design philosophy, `.rsp/specs/core-model.md`, and `.rsp/specs/cli-contracts.md`
- Constraints:
  - Preserve unrelated work and all existing open/archive identities.
  - Do not mutate generated `.rsp/rsp-rules.md`.
  - Do not perform lifecycle closeout or Git operations.

## Tasks
- [x] Remove `--lite` from CLI parsing, create plumbing, renderer, output text, tests, and user-facing docs.
- [x] Make plain status compact by default and verbose status explicit without changing JSON/state derivation.
- [x] Update authoritative Specs and design philosophy to describe one scaffold and progressive status detail.
- [x] Run focused tests, full build/lint/test, and `git diff --check`.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/integration.test.ts --maxWorkers=2` — 189 tests passed; proves: `--lite`, `--lite=true`, and `--lite=false` all fail before creating a Change or focus.
  - [x] `mise exec -- pnpm exec vitest run test/helpers.test.ts test/status/status-boundary.test.ts test/status/plain-dense.test.ts test/integration.test.ts --maxWorkers=2` — 245 tests passed; proves: the removed option cannot be used, one scaffold remains, compact status hides advanced detail, verbose status restores it, and JSON remains stable.
  - [x] `mise exec -- pnpm run build` — passed; proves: the CLI and bundled artifacts compile.
  - [x] `mise exec -- pnpm run lint` — passed; proves: source and document edits satisfy repository lint rules.
  - [x] `mise exec -- pnpm run test` — 58 files and 706 tests passed; proves: the complete regression suite remains green.
  - [x] `git diff --check` — passed; proves: the scoped patch has no whitespace errors.
### Optional
- Manual or environment:
  - [x] Ran `node dist/cli.mjs status --focused`, `node dist/cli.mjs status --focused --verbose`, and an attempted `rsp create ... --lite`; compact/verbose output split was observed and the removed option failed without creating a Change.
- Coverage:
  - No real external host or provider validation is needed; this Change only changes local CLI scaffolding and plain presentation.

## Blockers
- none
