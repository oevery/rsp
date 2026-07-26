---
kind: "feature"
---

# Change: interactive-skill-manager

## Proposal
- Outcome: Add an interactive Skill manager while preserving deterministic install commands
- Why:
  - Package-owned optional Skills are installable by exact name but are not discoverable from the CLI without reading documentation or the package tree.
  - `rsp skills install --interactive` would expose the capability, but it is unnecessarily long and would mix an interaction-mode flag into a deterministic mutation command.
- Scope:
  - Make bare `rsp skills` a dual-TTY interactive manager for the exact invoking package's default and optional Skills.
  - Add a presentation-neutral packaged/installed inventory and `rsp skills list [--json]` for static discovery.
  - Keep `rsp skills install` and `rsp skills install <name>` deterministic and non-interactive.
- Non-goals:
  - Adding mutation to the existing read-only `rsp ui` dashboard.
  - Remote sources, marketplace/search, global installation, update/remove commands, a lockfile, persisted selection, telemetry, or host-specific installation directories.
  - Installing before confirmation, changing the default ten-Skill suite, installing every optional Skill by default, or changing Skill invocation routing.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: RSP exposes one source-of-truth inventory for package-owned Skills.
  - Every validated packaged Skill is classified as `default` or `optional` from the fixed default set and compared with its exact `.agents/skills/<name>` target as `missing`, `unchanged`, or `divergent`.
  - `rsp skills list` renders default lifecycle and optional project Skills as separate human-readable groups without mutation; `rsp skills list --json` keeps one flat exact machine-readable inventory with an explicit `kind` per item for agents and CI.
- Requirement: bare `rsp skills` is the explicit interactive Skill-management entry.
  - On a real dual TTY outside CI and `TERM=dumb`, it lazy-loads an Ink manager for the exact invoking package and current project target.
  - The default lifecycle Skills are selected and locked; optional Skills start unselected and can be toggled.
  - The manager displays package identity, target, installed status, and separate default lifecycle / optional project groups, supports English and Simplified Chinese labels, and requires confirmation before returning an install selection.
  - Cancellation, signals, render failure, invalid package inventory, and preflight failure leave the project unchanged and restore terminal state.
  - Non-TTY, CI, redirected, and `TERM=dumb` invocation prints static Skills help and performs no installation.
- Requirement: interactive choice composes with the existing installer rather than owning mutation.
  - After the interactive terminal session is fully closed, the CLI passes the fixed default names plus selected optional names to one existing preflight/atomic-install operation.
  - A divergent selected target requires a separate replacement confirmation; declining replacement cancels without mutation.
  - `rsp skills install`, `rsp skills install <name>`, `--dry-run`, and `--force` retain their current non-interactive behavior and output contracts.

### Acceptance
#### Scenario: human selects an optional Skill
- GIVEN an interactive terminal where the package contains the ten default Skills and one missing optional Skill
- WHEN the user runs `rsp skills`, selects the optional Skill, and confirms
- THEN the manager closes before filesystem mutation
- AND one atomic install writes the ten defaults plus that optional Skill
- AND the final static result reports installed and unchanged names

#### Scenario: interactive cancellation is non-mutating
- GIVEN an interactive terminal with missing or divergent package-owned Skills
- WHEN the user cancels the manager or declines divergent replacement
- THEN no project path is created, removed, or replaced
- AND terminal state is restored

#### Scenario: automation remains deterministic
- GIVEN stdin or stdout is not a TTY, CI is active, or `TERM=dumb`
- WHEN `rsp skills` runs
- THEN it prints static help without mutation
- WHEN `rsp skills install`, `rsp skills install <name>`, or either dry-run form runs
- THEN the existing deterministic CLI contract is preserved without loading Ink

#### Scenario: static inventory supports discovery
- GIVEN a package with default and optional Skills in mixed installed states
- WHEN `rsp skills list` or `rsp skills list --json` runs
- THEN it reports every validated package-owned Skill with kind and exact installed status
- AND does not modify installation state

## Design
- Approach:
  - Extract a presentation-neutral inventory/preflight seam from the current packaged-tree and installed-tree inspection. Static list, interactive presentation, and installation consume the same classification and status values.
  - Register `list` as an ordinary `skills` subcommand. Route only exact bare `rsp skills` through a dual-TTY/CI guard before Citty dispatch, mirroring the existing bare-root TTY policy without changing `skills install`.
  - Lazy-load a separate Skills manager component. It returns either cancellation or `{ names, force }`; it never writes files. Close and clean the terminal session before calling `installPackagedSkills` once and printing its ordinary result.
  - Reuse or extract the generic alternate-screen/signal cleanup host from the dashboard entry, while keeping `DashboardApp` and its project-status surfaces read-only.
- Boundaries:
  - Package inspection owns validated inventory and installed status; it does not persist catalog or selection state.
  - The Skills TUI owns selection and confirmation only. `src/commands/skills.ts` remains the sole installation mutation owner.
  - The existing dashboard remains read-only and does not import Skill installation behavior.
- Affected areas:
  - `src/commands/skills.ts`, `src/cli.ts`, and a presentation-neutral Skills inventory/output module if separation is needed
  - A lazy `src/skills-tui/` entry, reducer/component, localized messages, and shared terminal-host extraction where justified
  - Focused CLI route, inventory, installer, Ink interaction, terminal lifecycle, and clean-package tests
  - `.rsp/specs/distribution.md`, `.rsp/specs/tui.md`, `.rsp/specs/design.md`, README command and installation guidance
- Constraints:
  - Preserve exact default/named installation, selected-target safety, atomic activation, rollback, unrelated Skills, and zero-write failure behavior.
  - React, Ink, and Yoga must remain outside static list/install/help evaluation.
  - The 40-column minimum, terminal cleanup, locale selection, and non-TTY error/output discipline must match the established terminal host.
  - Do not create a second inventory, manifest, workflow state, or optional-Skill routing registry.

## Tasks
- [x] Add the shared packaged/installed Skill inventory and stable human/JSON list output
- [x] Add exact bare-`rsp skills` TTY routing while preserving every explicit install path
- [x] Implement the localized optional-Skill selector and divergent-replacement confirmation as a non-mutating UI
- [x] Connect confirmed selection to one existing atomic installer call after terminal cleanup
- [x] Add focused route, reducer/presentation, cancellation, safety, and package tests
- [x] Reconcile durable Specs and English/Chinese user guidance
- [x] Group human-facing default lifecycle and optional project Skills without changing the flat JSON inventory

## Verify
- Automated:
  - [x] Focused inventory/list tests cover default/optional classification, missing/unchanged/divergent status, exact JSON, invalid trees, and zero mutation — 2026-07-26: focused Skills/TUI suite passed 45 tests, including grouped human output, unchanged flat JSON, and missing-default fail-closed behavior
  - [x] Route matrix tests cover dual TTY, CI, `TERM=dumb`, redirected streams, bare `rsp skills`, and unchanged explicit install commands without eager Ink loading — 2026-07-26: static help/list/install paths passed the interactive-dependency rejection loader
  - [x] Ink/reducer and terminal-host tests cover selection, locked defaults, cancellation, replacement confirmation, 40-column rendering, signals, errors, and cleanup — 2026-07-26: component/host tests and real-terminal cancel, `Ctrl-C`, and 40-column smoke passed
  - [x] Installer integration tests prove confirmed defaults plus optional names use one preflight/atomic transaction while cancellation and declined replacement write nothing — 2026-07-26: isolated real-terminal install wrote the ten defaults plus `rsp-codebase-audit`; divergent decline preserved the project-owned extra file
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run typecheck && mise exec -- pnpm run lint && mise exec -- pnpm run test` — 2026-07-26: build, typecheck, lint, and all 49 test files / 543 tests passed
  - [x] `mise exec -- pnpm run release:package-check` — 2026-07-26: clean packed install passed with exact package SHA-256 `93dd30efad948411a10ff19ed97311836f690d3b005d49e9eaa4381ff306c6ba`
- Manual or environment:
  - [x] In a clean isolated project and real terminal, exercise install, cancel, divergent-decline, resize, `Ctrl-C`, English/Chinese, and a new Codex task discovering the installed optional Skill — 2026-07-26: `/tmp/rsp-skills-tui-*` covered real Ink lifecycle and optional installation; the project-discovered Skill inventory exposes `rsp-codebase-audit` to this fresh task
- Coverage:
  - Remote Skill sources, non-Codex host directories, global installation, update/remove, marketplace search, and persisted selection remain delegated to external tooling and are not part of this slice.

## Blockers
- none
