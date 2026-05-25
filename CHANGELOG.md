# Changelog

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
