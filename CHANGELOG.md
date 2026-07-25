# Changelog

## 3.1.0-beta.0 (2026-07-25)

- **Breaking:** Raise the minimum runtime from Node.js 18 to Node.js 22.
- Reposition the product as Reliable Software Practice: `Rules, Specs, Plans` remains the lightweight repository-native artifact foundation rather than the whole product identity.
- Add a read-only Ink dashboard for bare interactive `rsp` and explicit `rsp ui`, with responsive Change/Group navigation, filtering, detail, refresh, terminal cleanup, and TUI-only English/Simplified Chinese localization.
- Add bounded archive browsing through `rsp history` and a lazy History scope in the dashboard, with deterministic filtering, stable archive identities, structured detail, and fail-closed diagnostics.
- Add `--json --compact` to the JSON-producing inspection commands and expose the derived dependency graph under the stable `status --json` plan contract while keeping ordinary command paths free of Ink, React, and Yoga.
- Improve dense plain status output with a dependency forest, focused/open/prerequisite terminology, stacked long WorkRefs, completed-work guidance, deduplicated blockers, and explicit next actions.
- Separate deterministic readiness from semantic durable review and archive guidance: Core or a human owns the archive recommendation, while archive never grants Git delivery or publication authority.
- Add the explicit-only `rsp-manage` Skill for bounded continuation across genuinely independent slices. Ineligible work returns to the direct Core or Discipline path; eligible work keeps dispatch and retry chronology transient and preserves explicit mutation, lifecycle, Git, publication, environment, and human-acceptance boundaries.
- Add `rsp skills install [--dry-run] [--force]` to install all ten Skills from the exact package that invoked the CLI into `.agents/skills`, with deterministic preflight, idempotence, conflict-safe replacement, symlink rejection, and preservation of unrelated Skills.
- Refine workflow guidance so Changes retain only converged plans and decisive evidence, tests are kept only for distinct lasting confidence, and temporary probes, command transcripts, correction chronology, and AI-centric process prose stay out of durable artifacts.
- Ignore well-formed Markdown HTML comments when deriving `Blockers` and prerequisite edges, while keeping incomplete comments fail-closed and omitting blocker-syntax guidance comments from generated Changes.

This prerelease was published to npm under the `beta` dist-tag and its exact registry-resolved `npx` identity was verified. npm `latest` remained on 2.0.4. Real-project acceptance in boats-cloud remains unverified. Users upgrading directly from 2.x must first follow the [3.0 migration guide](docs/migrations/3.0.md).

See the [3.1.0-beta.0 release notes](docs/releases/3.1.0-beta.0.md).

## 3.0.0 (2026-07-23)

- **Breaking:** Use `.rsp/rsp-rules.md` as the only runtime fallback protocol and project-owned `AGENTS.md` files for stable scoped instructions; the project-rules CLI and templates have been removed. After upgrading from 2.x, run `rsp update`, migrate any residual custom `.rsp/rules/` content deliberately, flatten work paths deeper than one Group level, and finish with `rsp doctor`.
- Add typed WorkRefs and shallow Change Groups with explicit briefs, declared direct-child membership, grouped context, independent child focus and archive behavior, and `rsp group create` / `rsp group close` lifecycle commands. Recursive Groups and persisted progress graphs remain unsupported.
- Derive ready work, exact dependency edges with reasons, blockers, and stable execution waves from Change facts in `rsp status`; apply shared no-follow inspection and mutation preflight across Changes, focus markers, archives, recursive Specs, and generated indexes so invalid or incomplete work trees fail visibly.
- Add one authoritative Decision Record path, including safe external routing, inactive-record diagnostics, Specs-index isolation, and independent pre-archive judgments for current facts and lasting rationale.
- Make `.rsp/config.yaml` fail closed through one shared validation contract, preserve `kinds` replacement semantics, and align generated Change, project-setup, and Group Brief templates with executable Tasks, explicit verification coverage, and separate current-fact and rationale ownership.
- Publish nine independently invocable, host-neutral Skills: `rsp`, `rsp-shape`, `rsp-design`, `rsp-implement`, `rsp-diagnose`, `rsp-tdd`, `rsp-review`, `rsp-address-review`, and `rsp-release-docs`.
- Route tracked work by evidence through shaping, design, diagnosis, test-driven development, implementation, read-only review, review resolution, durable artifact ownership, and, only for Changes with explicit confirmed release ownership and unfinished documentation, `rsp-release-docs`. Every Skill returns results to the existing WorkRef or project owner, localizes human-facing response labels without changing the target artifact language, and preserves explicit mutation, Git, verification, and publication boundaries.
- Strengthen `rsp-review` with fixed comparison scope, separate code and document states, direct production-reachability checks, and report-only handoff; add bounded finding disposition, fresh verification, and re-review through `rsp-address-review`.
- Ship only the CLI, fallback rules, and the nine-Skill suite in the npm package; keep source research, evaluations, self-hosting Change state, maintainer tooling, and the evaluated `rsp-manage` prototype out of the published product. Clean-install package validation now consumes npm 10 JSON output reliably.

See the [3.0.0 release notes](docs/releases/3.0.0.md) and [2.x migration guide](docs/migrations/3.0.md).

## 2.0.4 (2026-05-28)

- Add safe `doctor --fix` behavior that reports only real filesystem changes and stays quiet when no repairs are needed.
- Improve `rsp status`, `rsp show`, and generated AGENTS guidance for no-focus projects without implying that simple current-session tasks should create RSP changes.
- Add durable-review guidance to `rsp ready` and `rsp show`, with writable candidate targets limited to ordinary durable files instead of generated indexes or bundled core rules.
- Add `rsp create --lite` as a shorter template for explicitly tracked small changes while preserving the fixed six-section structure.
- Improve `rsp check` hygiene warnings for unfinished template placeholders and clarification markers.
- Make generated spec and archive indexes idempotent so update/doctor flows do not rewrite unchanged files or report false repairs.
- Refine bundled RSP rules, skill guidance, README content, and design philosophy around the boundary between canonical rules, operational skills, durable specs, archives, and generated files.
- Expand regression coverage for no-focus guidance, doctor repair idempotency, durable-review targets, check hygiene, rules/skill documentation, and generated index behavior.

## 2.0.3 (2026-05-26)

- Clarify the managed `AGENTS.md` entry block with RSP positioning, empty-focus fallback guidance, and optional Agent Skills loading hints.
- Add a cross-platform `Scope` section to `rsp-rules.md` and expand the published RSP skill metadata and usage guidance.
- Enrich change templates with stronger task scaffolding, more concrete affected-area and verification prompts, and better research and project-setup guidance.
- Update `rsp create` output so the next-step hint matches the richer change template workflow.
- Expand regression coverage for the new AGENTS guidance, skill metadata, change template prompts, and create-command messaging.

## 2.0.2 (2026-05-25)

- Add a post-`rsp update` reminder that the published RSP skill should be refreshed separately.
- Simplify the suggested skill refresh command to `npx skills add oevery/rsp` in CLI output and documentation.
- Add regression coverage for the new update hint in both changed and already-up-to-date flows.

## 2.0.1 (2026-05-25)

- Keep `.rsp/specs/INDEX.md` focused on additional spec files by excluding the default `design.md` entry.
- Clarify README, rules, and skill guidance so `design.md` remains the primary durable design file and `specs/INDEX.md` acts as an additional-spec directory.
- Add regression coverage for the updated specs index behavior during `init` and `add spec` flows.

## 2.0.0 (2026-05-25)

- Replace the legacy feature-centric workflow with the new change/focus/archive model, including `rsp create`, `rsp focus`, `rsp unfocus`, `rsp archive`, and `rsp update`.
- Remove deprecated commands and terminology tied to `new`, `close`, `deps`, and older lifecycle naming.
- Add machine-readable `--json` output and `--verbose` runtime diagnostics for `rsp status`, `rsp check`, and `rsp doctor`.
- Tighten durable knowledge guidance, AGENTS managed-block behavior, read order, and the boundary between README, rules, skill, and design philosophy surfaces.
- Improve recovery and consistency for archive/index/update flows, lock handling, and validation diagnostics across the CLI.
- Expand integration and regression coverage for templates, JSON contracts, update repair paths, archive behavior, and locking edge cases.

## 1.2.0 (2026-05-24)

- Add `rsp init --with-project-setup` to seed a project bootstrap feature during initialization.
- Introduce the `project-setup` workflow and align docs, skill guidance, and templates around durable project capture.
- Improve feature template formatting and `Spec` structure for clearer Markdown rendering.
- Keep init-related tests isolated and update the onboarding flow to match the new workflow.

## 1.1.0 (2026-05-24)

- Add `rsp status` filters: `--active`, `--blocked`, and `--stale <days>`
- Add `rsp deps --focus <name>` and `--reverse <name>` for focused dependency inspection
- Tighten lifecycle safety with dependency-aware `rsp close` checks and cleanup of empty parent directories
- Add initialization preflight checks for `rsp new`, `rsp add rules`, and `rsp add spec`
- Improve `rsp doctor` with direct repair hints, config.yaml semantic diagnostics, and archive filename convention checks
- Support CRLF frontmatter parsing and stabilize `rsp check` empty-project return values
- Improve CLI boundary handling for invalid filter combinations and stale-day arguments

## 1.0.3 (2026-05-23)

- Fix npm CLI entrypoint packaging by moving the published bin to `bin/rsp.mjs`
- Keep `dist/cli.mjs` as the built CLI implementation and add a lightweight wrapper for `npx` compatibility
- Include `bin/` in the published package so the wrapper ships with the release

## 1.0.2 (2026-05-23)

- Rename `.rsp/spec/` → `.rsp/specs/` throughout (consistent with plural `rules/`, `features/`)
- Update RSP acronym expansion: Rules, Spec, Plan → Rules, Specs, Plans

## 1.0.1 (2026-05-23)

- Remove auto-generated `AGENTS.md` from repository (belongs in user projects, not the package)
- Use `.rsp/rules/*.md` glob pattern in config examples instead of single file reference

## 1.0.0 (2026-05-22)

- Initial release of RSP (Rules, Specs, Plans) workflow for AI-assisted development
- CLI commands: `init`, `new`, `close`, `status`, `check`, `deps`, `archive-index`
- Feature lifecycle management with `.rsp/` directory conventions
- YAML frontmatter, semantic checkboxes, delta markers, and GIVEN/WHEN/THEN scenarios
- PID-based file locking for concurrent safety
- Customizable statuses, priorities, and required sections via `.rsp/config.yaml`
- Mermaid.js dependency graph support (`rsp deps --mermaid`)
- Archive INDEX.md auto-generation and spec index extraction
