---
kind: "refactor"
---

# Change: refactor-cli-command-boundary

## Proposal
- Outcome: Refactor the complete CLI registration and execution boundary so command operations return typed results while CLI adapters exclusively own argument mapping, presentation, and process exit decisions.
- Why:
  - `src/cli.ts` currently combines terminal routing, compatibility preprocessing, 34 Citty definitions, domain argument conversion, output policy, and exit handling.
  - Process termination and error rendering are split between `src/cli.ts` and command modules, which permits inconsistent JSON, stderr, cleanup, and composition behavior.
  - Cross-cutting capabilities such as compact JSON are repeated across registration, validation, and tests instead of deriving from one command capability owner.
- Scope:
  - Move all Citty command definitions into cohesive CLI-owned domain modules behind one registry.
  - Introduce one typed adapter/executor contract for command invocation, presentation mode, and exit-code derivation.
  - Migrate every published command to the same final execution model and remove the legacy mixed model before acceptance.
  - Add structural and public-behavior verification for the final boundary.
- Non-goals:
  - Change command names, arguments, help descriptions, output wording, JSON shapes, filesystem behavior, or exit-code semantics.
  - Refactor domain algorithms in `src/core/`, `src/status/`, `src/history/`, `src/specs/`, or `src/workspace/`.
  - Change TUI behavior, localization, ordinary-command loading strategy, release behavior, or package entry points.

## Spec
### MODIFIED
- Requirement: The CLI has one complete command registration and execution boundary.
  - `src/cli.ts` owns process entry, TTY routing, compatibility preprocessing, and the top-level error boundary without embedding command-specific schemas or argument mapping; `src/cli/registry.ts` owns root command assembly.
  - CLI-owned command modules define Citty metadata, parse command arguments, invoke one operation, render the existing human or JSON projection, and return an exit decision through one shared executor.
  - Domain command operations never terminate the process or mutate `process.exitCode`.
  - The accepted final tree contains no partially migrated command or legacy parallel execution path.
- Requirement: Existing public CLI behavior remains compatible.
  - Command names, options, aliases, help descriptions, stdout, stderr, JSON values, compact serialization, exit codes, deterministic filesystem effects, TUI routing, and package entry behavior remain unchanged.
  - Command-specific JSON error shapes remain command-specific; the refactor introduces no universal response schema.
- Requirement: Cross-cutting output capabilities have one declarative owner.
  - JSON and compact support are declared by CLI command metadata and reused by validation and contract verification.
  - Unsupported `--compact` invocations still fail before command behavior.

### Acceptance
#### Scenario: Existing command contracts survive the complete migration
- GIVEN the published root commands, nested commands, help paths, success paths, and representative failure paths
- WHEN the refactored CLI executes them in human, JSON, and compact JSON modes where supported
- THEN their observable stdout, stderr, exit codes, JSON values, and filesystem effects remain compatible with the pre-refactor contract

#### Scenario: Command operations cannot control the host process
- GIVEN any module under `src/commands/`
- WHEN the structural boundary check inspects production imports and calls
- THEN it contains no `process.exit`, `process.exitCode`, or equivalent direct process-termination ownership

#### Scenario: Non-interactive commands remain isolated from interactive dependencies
- GIVEN root help, version, errors, and every registered non-interactive command help path
- WHEN they run outside the interactive TUI
- THEN Ink and other interactive-only dependencies remain unloaded and existing static alternatives remain intact

## Design
- Approach:
  - Keep one `src/cli.ts` process entry and add a small `src/cli/` layer containing the registry, shared execution contract, reusable capability definitions, and cohesive command-definition modules.
  - Preserve domain-specific result types and projections; adapters translate them into the existing output without flattening all commands into one JSON schema.
  - Implement the migration incrementally inside this Change but accept and deliver only the complete final model.
  - Establish the shared adapter, registry, capability metadata, and structural checks first; then migrate the inspection and mutation/delivery command domains against that fixed seam with disjoint write sets before one integration gate.
- Boundaries:
  - `src/commands/` coordinates domain behavior and returns results; `src/cli/` owns Citty, argument mapping, presentation selection, and process exit decisions.
  - Existing presentation-neutral `status`, `history`, and `specs` seams remain authoritative and are not redesigned.
  - TUI and Skills TUI routing stays ahead of ordinary command dispatch and remains lazy.
- Affected areas:
  - `src/cli.ts`, new `src/cli/**`, and command modules that currently emit output or terminate the process.
  - CLI integration, routing, compact JSON, workspace error, package-install, and structural dependency tests.
  - `.rsp/specs/design.md` and `.rsp/specs/cli-contracts.md` if the implemented ownership boundary becomes durable current truth.
- Constraints:
  - No partial architecture may be treated as complete or delivered.
  - Preserve unrelated work and do not stage, commit, archive, push, publish, or release without separate authority.
  - Prefer static ordinary-command registration unless implementation evidence establishes a required loading change.

## Tasks
- [x] Capture and retain focused contract coverage for command registration, capability/help agreement, adapter sequencing, compact validation, and interactive dependency isolation.
- [x] Establish the typed adapter/executor, registry, capability metadata, and cohesive command-definition modules without process interception or behavior changes.
- [x] Migrate inspection commands and presenters: `status`, `show`, `ready`, `check`, `doctor`, `history`, and `specs`.
- [x] Migrate setup, lifecycle, workspace, delivery, and Skills commands and presenters.
- [x] Introduce one genuine typed adapter/executor contract and migrate every published command to it without output capture, control-flow signals, or process monkeypatching.
- [x] Remove direct and indirect process exit ownership and all presentation ownership from domain command operations.
- [x] Update durable CLI ownership facts in `.rsp/specs/design.md` so `src/cli.ts` owns process and TTY routing, `src/cli/**` owns registration, adaptation, presentation, and exit decisions, and `src/commands/**` owns presentation-neutral typed operations.
- [x] Complete focused and repository-wide verification with no unresolved blocker.

## Verify
### Foundation lane
- [x] `mise exec -- pnpm run build` — passed after registration extraction.
- [x] `mise exec -- pnpm run typecheck` — passed after typed adapter and registry extraction.
- [x] `mise exec -- pnpm run lint` — passed for the extracted CLI boundary and structural test.
- [x] `mise exec -- pnpm exec vitest run test/cli-command-boundary.test.ts` — 5 tests passed.
- [x] `mise exec -- pnpm exec vitest run test/tui/cli-routing.test.ts` — 6 tests passed; interactive dependencies remained isolated.
- [x] `mise exec -- pnpm exec vitest run test/integration.test.ts` — 191 tests passed, including compact JSON and rejection-order coverage.
- [x] `git diff --check` — passed.

### Mutation-delivery lane
- [x] `mise exec -- pnpm run build` — passed with the mutation/delivery operation and presenter boundary.
- [x] `mise exec -- pnpm run typecheck` — passed after all scoped commands returned typed results.
- [x] `mise exec -- pnpm run lint` — passed for the scoped commands, presenters, and boundary test.
- [x] `mise exec -- pnpm exec vitest run test/cli-mutation-command-boundary.test.ts test/workspace.test.ts test/commit.test.ts test/compatibility-migration.test.ts test/skills-install.test.ts test/skills-inventory.test.ts` — 6 files / 51 tests passed.
- [x] `mise exec -- pnpm exec vitest run test/integration.test.ts` — 1 file / 191 tests passed.
- [x] `git diff --check` — passed.

### Inspection lane
- [x] `mise exec -- pnpm run build` — passed after all seven inspection operations became presentation-neutral.
- [x] `mise exec -- pnpm run typecheck` — passed for typed inspection results, CLI presenters, and archive dry-run composition.
- [x] `mise exec -- pnpm run lint` — passed for the complete scoped lane.
- [x] `mise exec -- pnpm exec vitest run test/cli-inspection-command-boundary.test.ts test/commands.test.ts test/status test/history-query.test.ts test/specs-query.test.ts test/tui/cli-routing.test.ts` — 9 files / 58 tests passed.
- [x] `mise exec -- pnpm exec vitest run test/integration.test.ts` — 1 file / 191 tests passed, including JSON/compact, failure, help, and archive dry-run contracts.
- [x] Structural scan of `src/commands/**/*.ts` — no `console.*`, `emitJson`, process exit/exitCode/stdout/stderr, or CLI output-option branching remained.
- [x] `git diff --check` — passed.

### Required
- Automated:
  - [x] `mise exec -- pnpm run build` — passed in the independent integration verification.
  - [x] `mise exec -- pnpm run typecheck` — passed in the independent integration verification.
  - [x] `mise exec -- pnpm run lint` — passed in the independent integration verification.
  - [x] `mise exec -- pnpm run test` — passed: 71 files / 778 tests.
  - [x] `mise exec -- pnpm run release:package-check` — passed; clean install valid for `@oevery/rsp@3.2.0`.
  - [x] `mise exec -- node dist/cli.mjs check --focused` and `git diff --check` — passed with no verification-created worktree drift.
### Optional
- Manual or environment:
  - [x] None; no interactive visual behavior changes are in scope.
- Coverage:
  - Public byte-level compatibility is bounded by retained command fixtures and representative success/failure matrices; undocumented terminal coloring outside those fixtures is not a separate acceptance surface.

## Blockers
- none
