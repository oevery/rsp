---
kind: "refactor"
---

# Change: extract-project-status-boundary

## Proposal
- Outcome: Extract the current project-status collection, derivation, v3 JSON adaptation, and plain-text presentation into explicit one-way modules that preserve every existing `rsp status` behavior and provide the stable internal snapshot required by the later Ink dashboard.
- Why:
  - `src/commands/status.ts` currently combines filesystem inspection, status semantics, filtering, recommendations, public JSON construction, and terminal rendering in one module.
  - Adding a second human renderer directly to that command would either duplicate inspection logic, make TUI components depend on command code, or let internal dashboard needs drift the public 3.0 JSON schema.
  - A behavior-preserving prerequisite keeps architectural movement independently reviewable and prevents the TUI Change from mixing refactor risk with new terminal behavior.
- Scope:
  - Freeze the current success, filter, diagnostic, failure, stdout/stderr, exit-code, plain-text, and JSON behavior of `rsp status` with focused fixtures.
  - Introduce `src/status/` modules for the internal `ProjectStatusSnapshot`, filesystem-backed inspection, pure filtering/recommendation derivation, exact v3 JSON adaptation, and plain-text rendering.
  - Reduce `src/commands/status.ts` to command orchestration over those modules.
  - Move status-specific JSON error construction out of generic `src/core/output.ts` while retaining generic JSON emission and runtime-diagnostic helpers there.
  - Add focused status module and dependency-boundary tests outside the monolithic integration test.
  - Requalify the changed packaged CLI with one fresh retained native-design composition run under a new immutable run identity.
- Non-goals:
  - Adding Ink, React, TSX, TUI routing, interactive state, localization, terminal lifecycle behavior, or any other dashboard code.
  - Changing `rsp status` output, filters, diagnostics, recommendations, exit behavior, performance policy, or public `StatusJsonShape`.
  - Refactoring unrelated commands, reorganizing all of `src/core/`, splitting every type in `src/types.ts`, or cleaning up `src/core/helpers.ts`.
  - Changing RSP protocol, Skills, generated project files, or persisted `.rsp/` content.
  - Rewriting, relabeling, or deleting any prior retained native-design run.

## Spec
<!-- Describe the desired structural outcome. Implementation notes belong in ## Design. -->
### MODIFIED
- Requirement: Project-status dependencies flow from core inspection primitives through one internal snapshot to explicit presentation adapters.
  - `ProjectStatusSnapshot` is an internal serializable model containing the change titles, blocker entries, readiness, diagnostics, progress, dependency facts, archive trend, and suggested-command inputs needed by current and planned human renderers.
  - Snapshot collection may read the filesystem and invoke existing `core` inspection capabilities, but it does not print, exit, colorize output, inspect terminal state, or import command or TUI modules.
  - Status filtering, dependency-plan closure, readiness guidance, and next-action recommendation are pure derivations over explicit inputs and the collected snapshot.
  - The v3 JSON adapter is the only new status module that constructs the complete public `StatusJsonShape`, including command-boundary error payloads.
  - The plain-text renderer consumes derived status data and owns color and formatting without rereading `.rsp/` or re-deriving dependency state.
  - `src/cli.ts` retains status argument validation, command-boundary error emission, and exit decisions; `src/commands/status.ts` coordinates collection and adapters and returns the result without owning CLI policy, status semantics, or layout.

- Requirement: The refactor is behavior preserving.
  - Existing `rsp status`, filtered status variants, and `rsp status --json [--compact] [--verbose]` retain their current stdout, stderr, parsed JSON, diagnostic ordering, recommendations, and exit codes for the same filesystem and environment inputs.
  - The public `StatusJsonShape` field set, nesting, nullability, canonical values, and success/error envelopes remain unchanged.
  - No new production dependency or CLI entry point is introduced, and ordinary status startup does not load future TUI modules.

- Requirement: The changed package artifact is freshly requalified.
  - The official native-design evaluator runs the exact locally packed CLI through its four real-host phases and persists a new immutable retained-run identity.
  - Prior retained runs remain byte-preserved; no hash or model output is manually reconstructed.

### Acceptance
#### Scenario: existing human status output is preserved
- GIVEN frozen fixtures for empty, focused, grouped, filtered, blocked, completed, long-WorkRef, diagnostic, and archive-trend projects
- WHEN `rsp status` is executed before and after the refactor with equivalent environment and terminal-color settings
- THEN stdout, stderr, exit code, recommendation semantics, blocker placement, and dependency presentation are unchanged

#### Scenario: existing machine status contract is preserved
- GIVEN frozen success, compact, verbose-runtime, invalid-filter, and invalid-work-tree fixtures
- WHEN `rsp status --json` is executed after the refactor
- THEN each result deep-equals the frozen 3.0 envelope for field presence, value semantics, ordering, stdout/stderr, and exit code

#### Scenario: status layers keep one-way dependencies
- GIVEN the completed `src/status/` modules
- WHEN their static imports and focused tests are inspected
- THEN model and derivation code import no Node filesystem, terminal, color, command, or TUI modules
- AND inspection imports core primitives but no presenter
- AND JSON/plain presenters import the model or derived view without importing filesystem or command modules
- AND no production module imports a future `src/tui/` path

## Design
- Approach:
  - Create `src/status/model.ts` for internal snapshot and query/view types, distinct from the public v3 DTOs already exposed through `src/types.ts`.
  - Create `src/status/inspect.ts` by extracting the filesystem composition currently inside `showStatus()`. It composes `work-ref`, Change Group, dependency-plan, config, and parsing capabilities and returns data rather than writing output.
  - Create `src/status/derive.ts` for pure filtering, dependency-plan closure, group/change recommendation, summaries, and next-action construction.
  - Create `src/status/v3-json.ts` for exact `StatusJsonShape` success/error adaptation; keep generic `emitJson`, `recordRuntimeDiagnostic`, and `toErrorMessage` in `src/core/output.ts`.
  - Create `src/status/plain.ts` for the current text renderer without changing its strings or layout in this prerequisite.
  - Keep `src/commands/status.ts` as the thin status orchestration adapter and retain argument validation, invalid-filter emission, and exit decisions in `src/cli.ts`. Do not create a general service container, repository abstraction, barrel hierarchy, or speculative TUI interface.
- Boundaries:
  - Existing `src/core/*` modules remain the low-level owners of WorkRef safety, managed paths, group inspection, dependency analysis, config, and parsing behavior.
  - `src/status/*` may depend on `src/core/*` and public DTO types; `src/core/*` must not depend on `src/status/*`.
  - Future `src/tui/*` and current `src/commands/status.ts` are sibling consumers of the status boundary; neither imports the other.
  - Internal snapshot fields may be richer than v3 JSON. Only the v3 adapter decides which fields cross the public JSON boundary.
  - `src/types.ts` retains public output contracts during this Change. Internal interactive, viewport, locale, and component types do not belong there.
- Affected areas:
  - `src/commands/status.ts`
  - `src/core/output.ts`
  - `src/types.ts` only where a public compatibility type needs a minimal re-export or unchanged reference
  - New `src/status/model.ts`, `src/status/inspect.ts`, `src/status/derive.ts`, `src/status/v3-json.ts`, and `src/status/plain.ts`
  - New focused tests under `test/status/` plus only the minimum updates to existing integration assertions
  - Frozen declarative status fixtures and complete HEAD-derived stdout, stderr, exit, and canonical-JSON hash oracles under `test/status/fixtures/`
- Constraints:
  - No observable CLI or JSON behavior change is allowed in this prerequisite; plain-text improvements remain owned by `add-ink-tui-dashboard`.
  - Preserve diagnostic order, archive-index behavior, filesystem fail-closed behavior, filtering semantics, public nullability, and exact machine values.
  - Avoid an `index.ts` barrel unless a real consumer needs a smaller explicit public surface after the modules exist.
  - Do not introduce dependency injection infrastructure. Tests may pass explicit environment/time/filesystem inputs only where current nondeterminism requires a seam.
  - The extracted non-presentation modules must remain free of React, Ink, ANSI control sequences, picocolors, and process exit calls.

## Tasks
- [x] Add focused characterization fixtures for current plain, JSON, compact, verbose, filtered, diagnostic, recommendation, and failure behavior before moving production logic.
- [x] Define internal `ProjectStatusSnapshot` and query/view types without changing or replacing the public `StatusJsonShape`.
- [x] Extract filesystem-backed status collection into `src/status/inspect.ts` while retaining the current fail-closed and runtime-diagnostic behavior.
- [x] Extract pure filters, dependency-plan closure, summaries, recommendations, and next actions into `src/status/derive.ts` with focused tests.
- [x] Extract exact success/error v3 JSON construction into `src/status/v3-json.ts` and remove status-specific envelope knowledge from `src/core/output.ts`.
- [x] Extract the byte-compatible current plain renderer into `src/status/plain.ts`, reduce that module to orchestration, and retain argument validation and exit behavior in `src/cli.ts`.
- [x] Add import-boundary tests for the one-way status layers and keep new focused cases out of further growth in `test/integration.test.ts` where practical.
- [x] Update the prerequisite and dependent Change Tasks/Verify evidence if the final extracted paths or compatibility findings differ from this design; no path or compatibility drift required a dependent-Change edit.
- [x] Select the final immutable retained native-design run identity `device-discovery-boundary-status-equivalence` and execute the official real-host evaluator for the review-corrected package without rewriting the earlier successful status-boundary run.
- [x] Confirm the default retained evaluator and full suite accept the fresh exact-package evidence without rewriting prior runs.
- [x] Resolve the fixed review findings by adding the complete replayable status CLI equivalence matrix, restoring the HEAD `—` progress display when Change content is unavailable, correcting CLI/command ownership prose, and correcting the real-host gate count.
- [x] Resolve the fixed re-review resource-lifecycle finding by cleaning every temporary fixture, symlink target, and package root on success or failure without changing the frozen oracle.

## Verify
- Automated:
  - [x] `mise exec -- pnpm run build` — passed; the extracted modules bundle through the existing single CLI entry without requiring TUI or new runtime dependencies.
  - [x] `mise exec -- pnpm run typecheck` — passed; internal snapshot types, public v3 DTOs, and adapter boundaries are statically coherent.
  - [x] `mise exec -- pnpm run lint` — passed; the extracted modules and imports satisfy repository static rules.
  - [x] `mise exec -- pnpm run test` — 32 files and 369 tests passed, including the frozen CLI equivalence matrix, focused status boundaries, integration compatibility, and the fresh retained exact-package gate.
  - [x] `node scripts/native-design-composition-eval.mjs --run-real` followed by `node scripts/native-design-composition-eval.mjs` — all 16 real-host scoring gates and all 13 retained re-score gates passed for exact package SHA-256 `8e1ae94639707038e17a39db39b2fbf7e81c71630f91a9d5253c003b40509d94`; prior retained runs remain unchanged.
  - [x] `mise exec -- pnpm exec vitest run test/status/status-cli-equivalence.test.ts test/status/status-boundary.test.ts` — 2 files and 5 tests passed; the replayable fixed-input matrix matches complete HEAD-derived stdout, stderr, exit, and canonical full-JSON oracles without runtime Git access.
  - [x] `node dist/cli.mjs check --focused` — passed with one informational `MODIFIED` delta marker; the focused prerequisite and its dependency declarations remain structurally valid.
  - [x] `git diff --check` — passed; the refactor introduces no whitespace errors.
- Manual or environment:
  - [x] Run `rsp status`, `rsp status --json`, `rsp status --json --compact`, and one invalid `--stale` invocation against the repository before and after extraction — byte-identical stdout/stderr and matching exit codes were observed from independent baseline and extracted builds.
- Coverage:
  - TUI rendering, locale behavior, Node.js 22 migration, terminal lifecycle, plain-output improvements, packaging-size changes, and TUI-specific startup gates remain owned by `add-ink-tui-dashboard` and are intentionally not verified here.
  - This prerequisite owns only the fresh exact-package qualification required by its rebuilt CLI; the dependent TUI Change must requalify its later package independently.

## Blockers
- none
