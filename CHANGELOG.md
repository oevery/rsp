# Changelog

## 3.0.0 (Unreleased)

- Move the consumer fallback protocol to `.rsp/rsp-rules.md` as the only runtime path; `rsp update` migrates and removes the obsolete generated path.
- Move stable scoped instructions to project-owned `AGENTS.md` files and remove the project-rules CLI and templates.
- Keep arbitrary old `.rsp/rules/` contents untouched for explicit semantic migration, prune empty directory trees, and report every residual entry through `rsp doctor`.
- Add one authoritative Decision Record path with safe external routing, mutation preflight, inactive-record diagnostics, Specs-index isolation, and independent current-fact/rationale review guidance.
- Add typed WorkRef resolution, shared no-follow managed-path checks, safe Spec parent resolution, and shared inspection for Changes, project `AGENTS.md`, focus markers, archives, and recursive Specs; reserve Group Brief identity without enabling its lifecycle, preflight lifecycle and index mutations, repair missing work roots, and make status/check/doctor fail visibly on recursive paths, unsupported entries, missing or unreadable current work, invalid roots or prefixes, incomplete reads, and identity collisions.
- Add shallow Change Groups with explicit brief creation and close commands, declared direct-child membership, child-only focus and archive behavior, grouped context, derived completion projections, and one-way Group identities without recursive hierarchy or persisted progress state.
- Add concise RSP-native shaping and implementation Skills, with gap-driven candidate extraction, bounded repository discovery, hard authority and verification boundaries, and release-candidate-only provider calibration.
- Make `rsp-review` verify direct production reachability before recommending an adapter, wrapper, validator, or normalizer correction, while preserving skipped pipeline states and restraint for simple deterministic fixes.

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
