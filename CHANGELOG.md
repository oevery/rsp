# Changelog

## 3.1.1 (2026-07-30)

- Make structured commit-message transport preserve real line boundaries across tool, shell, and Git layers by requiring actual newlines or a safely prepared message file.
- Treat unintended literal `\n` sequences in the observed commit body as a post-commit mismatch and stop without inferring amend or second-commit authority.

RSP 3.1.0 remains available as a GitHub release but was not published to npm. Version 3.1.1 is the first stable 3.1 package published to the registry.

See the [3.1.1 release notes](docs/releases/3.1.1.md).

## 3.1.0 (2026-07-30)

- **Breaking:** Require Node.js 22 or later. Registry users upgrading from RSP 2.x must follow the [3.0 migration guide](docs/migrations/3.0.md) before applying the [3.1 migration](docs/migrations/3.1.md).
- Add a read-only terminal dashboard, bounded archive history, compact JSON output, dependency-plan projections, and clearer plain-text status and readiness surfaces.
- Add policy-controlled managed execution for long-running work, shallow Group waves, review convergence, automatic routing, explicit pause/resume recovery, and lifecycle or eligible local-commit closeout without broadening external authority.
- Add exact-package project Skill installation, interactive Skill management, bounded commit preparation, pre-change design, structural audit, and renamed review-resolution capabilities.
- Add safe Change and Group recovery, hierarchical Specs navigation, explicit issue relationships, Unicode WorkRefs, durable artifact and commit language policy, and one lossless semantic document model.
- Improve release integrity with exact-candidate metadata checks, bounded test concurrency, typecheck and clean-install gates, publication-invariant release surfaces, and stable-package `@latest` documentation checks.
- Add a bilingual documentation site and concise public guides while keeping maintainer records and repository evidence separate from user documentation.
- Preserve existing Change and archive compatibility where documented; recovery, issue lifecycle, Git delivery, publication, deployment, approval, and human acceptance remain explicit operations.

The 3.1 workflow was dogfooded in the RSP repository and exercised in boats-cloud across automatic Manage routing, lifecycle closeout, Group recovery, multi-slice work, Windows/Electron acceptance, and full client gates. Live host scheduling across a real multi-turn pause/resume interaction, stochastic provider behavior, and broad comparative productivity claims remain outside the verified release claims.

See the [3.1.0 release notes](docs/releases/3.1.0.md).

## 3.1.0-beta.5 (2026-07-29)

- Add validated external issue relationships to Changes, including offline `rsp create --issue`, explicit `relates` or `closes` intent, fail-closed metadata checks, and traceability through status, show, history, Shape, and terminal commit preparation without adding provider credentials or remote mutation to the CLI.
- Add explicit `rsp group reopen <group> --reason <text> [--from <archive-path>]` recovery for one retained Group Brief, preserving immutable archives and requiring a separate child reopen instead of silently restoring grouped work.
- Distinguish managed status updates, explicit pause, owner release, blockers, and drift-safe resume while preserving one focused owner and returning a complete continuation contract for incomplete work.
- Reduce ordinary Skill runtime context through conditional branch ownership while preserving standalone capability, authority, recovery, and release behavior; fixed provider cases passed with lower measured input usage.
- Restore typecheck as a passing release gate and retain the bounded Vitest worker configuration for repeatable full-suite and clean-install candidate verification.

This prerelease remains opt-in and does not promote npm `latest`. Existing Changes and archives without issue metadata remain compatible, and Group recovery requires an explicit two-step Group-then-child reopen. The exact package is validated by the complete self-host release gate and clean-install package check. Live host scheduling across a real multi-turn pause/status interaction and broader independent-project productivity remain unverified. Users upgrading within 3.1 should follow the [3.1 migration guide](docs/migrations/3.1.md); users upgrading directly from 2.x must first follow the [3.0 migration guide](docs/migrations/3.0.md).

See the [3.1.0-beta.5 release notes](docs/releases/3.1.0-beta.5.md).

## 3.1.0-beta.4 (2026-07-28)

- Add a strict durable language policy: project configuration selects artifact and commit prose independently while response language remains user/session-owned, and CLI scaffolds keep canonical structure with neutral placeholders instead of generated English guidance.
- Support safe Unicode WorkRefs with NFC normalization, bounded Unicode/UTF-8 lengths, exact stored-path validation, and fail-closed collision handling while preserving ASCII kebab-case identities.
- Centralize Change and Group Brief structure in one lossless semantic document model so readers and surgical writers use stable section identities without changing canonical Markdown, diagnostics, CRLF behavior, or existing artifact bytes.
- Make `manage.activation: auto` classify every selected ready continuation as either fully one-step direct work or managed non-small work, requalify expanded report/design/small routes, and report the decisive routing result.
- Require qualified Manage to delegate at least one implementation worker when available while keeping overlapping paths, providers, real hosts, hardware, and dependent verification sequential unless both mutation and verification are isolated.

This prerelease remains opt-in and does not promote npm `latest`. The exact package is validated by the complete self-host release gate and clean-install package check. The new automatic Manage threshold has been dogfooded in the RSP checkout; broader independent-project routing frequency, comparative token cost, and productivity claims remain unverified. Users upgrading within 3.1 should follow the [3.1 migration guide](docs/migrations/3.1.md); users upgrading directly from 2.x must first follow the [3.0 migration guide](docs/migrations/3.0.md).

See the [3.1.0-beta.4 release notes](docs/releases/3.1.0-beta.4.md).

## 3.1.0-beta.3 (2026-07-28)

- Replace the generated global Archive Index with bounded `rsp history` queries and the recursive Specs index with generated per-directory `00-index.md` navigation. `rsp update` migrates only recognized generated files and preserves unrecognized paths for owner review.
- Add `rsp reopen <work-ref> --reason <text>` to restore incomplete archived work under the same WorkRef while retaining exact archive snapshots, requiring explicit selection when history is ambiguous, and keeping new scope in a separate corrective Change.
- Harden Manage routing for long-running and recovery continuations, rederive materially expanded direct work, and make eligible clean local closeout deterministic without broadening lifecycle, Git, publication, deployment, approval, or human-acceptance authority.
- Rename the review-resolution Skill to `rsp-resolve-findings` and the optional audit Skill to `rsp-structural-audit`; package installation migrates obsolete real directories only with explicit `--force` and transactional rollback.
- Make `rsp ready` the canonical read-only archive-readiness projection while retaining `rsp archive --dry-run` as a deprecated compatibility route, and strengthen structural-audit restraint with deterministic behavior holdouts.
- Replace mechanical Skill body word caps with shared portable metadata and semantic-contract coverage so concise instructions retain their trigger, authority, action, stop, return, and conditional-loading behavior.

This prerelease remains opt-in and does not promote npm `latest`. The exact package is validated by the complete self-host release gate and clean-install package check. Broader real-project lifecycle acceptance, provider-backed structural-audit evaluation, and comparative productivity claims remain unverified. Users upgrading within 3.1 should follow the [3.1 migration guide](docs/migrations/3.1.md); users upgrading directly from 2.x must first follow the [3.0 migration guide](docs/migrations/3.0.md).

See the [3.1.0-beta.3 release notes](docs/releases/3.1.0-beta.3.md).

## 3.1.0-beta.2 (2026-07-27)

- Add policy-controlled managed execution: projects can opt into automatic Manage routing and choose manual, lifecycle, or eligible local-commit closeout while invalid configuration fails closed and effective policy remains visible in status output.
- Extend managed goals across shallow Group waves, interruption-safe long-running continuation, and bounded review-correction convergence without broadening mutation, lifecycle, Git, publication, deployment, approval, or human-acceptance authority.
- Add an interactive project Skill manager for dual-TTY use, deterministic `rsp skills list [--json]` discovery for scripts, eleven default lifecycle Skills, and exact-name installation for optional project Skills.
- Add report-only Pre-Change Design for already-bounded questions and an optional evidence-backed codebase-audit Skill for discovering structural risks before work is shaped.
- Add `rsp-commit` as a bounded local-commit capability that requires an already-derived owner, exact paths, fresh verification, lifecycle state, and explicit commit authority.
- Harden release preparation with exact candidate identity checks, publication-invariant release surfaces, smaller release-operation ownership, and stricter package maintenance gates.
- Split the self-hosted project model into focused domain Specs and progressively loaded Core references while preserving the generated fallback protocol and runtime behavior.

This prerelease remains opt-in and does not promote npm `latest`. The exact package is validated against the RSP self-host; packaged CLI startup, Skill inventory, and installation preflight were also smoke-tested from boats-cloud, which is not RSP-initialized. Real-project RSP lifecycle acceptance and productivity claims remain unverified. Users upgrading directly from 2.x must first follow the [3.0 migration guide](docs/migrations/3.0.md).

See the [3.1.0-beta.2 release notes](docs/releases/3.1.0-beta.2.md).

## 3.1.0-beta.1 (2026-07-25)

- Decouple retained native-composition behavior evidence from release-only version identity while preserving exact-package provenance and fail-closed Skill, inventory, behavior-file, input, and integrity checks.
- Harden release finalization so package-bound documentation uses publication-invariant wording, rejects stale identity and comparison surfaces, and keeps temporary publication or authentication state out of durable artifacts.
- Defer version manifests, changelog targets, exact-version documentation, and versioned release notes until an explicit user or authoritative repository source confirms the release identity.
- Keep completed implementation Changes independently reviewable and deliverable before a separate Release Change and dedicated release commit finalize versioned shipped surfaces.

This prerelease remains an opt-in beta and does not promote npm `latest`. Real-project acceptance in boats-cloud remains unverified. Users upgrading directly from 2.x must first follow the [3.0 migration guide](docs/migrations/3.0.md).

See the [3.1.0-beta.1 release notes](docs/releases/3.1.0-beta.1.md).

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
