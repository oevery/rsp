# Project Design: @oevery/rsp

## Purpose
- RSP is Reliable Software Practice, a repository-native engineering workflow for humans and AI agents.
- Its composable Skills guide work from unclear intent through implementation, review, verification, durable review, and archive without hidden workflow state or replacement of Host Project authority.
- Rules, Specs, Plans is the lightweight artifact foundation beneath the workflow, not the product-name expansion.
- The repository keeps durable knowledge, open work, product runtime, distribution, maintainer knowledge, and generated state in explicit owners.

## Stable Facts
- The canonical domain Specs are:
  - [Core Model](./core-model.md): artifacts, WorkRefs, Change Groups, lifecycle, dependencies, focus, and durable writeback.
  - [CLI Contracts](./cli-contracts.md): deterministic commands, filesystem safety, inspection, JSON, history, indexes, and repair.
  - [Skill System](./skill-system.md): the default fourteen-Skill suite, optional project Skills, orthogonal distribution/role/invocation classification, composition, progressive disclosure, Core-owned ready-owner routing, isolated workspace and landing boundaries, bounded managed execution-frontier behavior, and authority boundaries.
  - [Skill Control Model](./skill-control-model.md): canonical transient route, work-owner, frontier, stop/resume, acceptance, and closeout vocabulary shared across Core, Shape, Disciplines, and Manage.
  - [Interactive TUI](./tui.md): dashboard routing, state, presentation, localization, history, layout, and terminal lifecycle.
  - [Distribution and Maintainer Research](./distribution.md): package inventory, Skill installation, releases, evaluation provenance, repository layering, and upstream research.
- Decision Records under the configured authoritative path own lasting rationale for hard-to-reverse choices; Specs own current facts.
- `docs/maintainers/design-philosophy.md` is explanatory maintainer rationale, not a normative protocol source.

## Boundaries
- In scope:
  - Repository-native engineering workflow artifacts, deterministic CLI support, portable Skills, read-only interactive inspection, package distribution, and maintainer research that promotes through normal RSP Changes.
- Out of scope:
  - Replacing Git or project trackers; OpenSpec-style multi-file Changes; recursive work hierarchy; automatic scheduling or durable workflow engines; plugin-platform schemas; automatic Spec/Decision promotion; and binding RSP to one IDE, agent, forge, or host.

## Structure

| Repository area | Directories | Ownership |
| --- | --- | --- |
| Product runtime | `src/`, `bin/` | CLI registration, commands, domain interpretation, status/history inspection, filesystem safety, diagnostics, and interactive UI |
| Product distribution | `rules/`, `skills/` | Bundled fallback source, the default fourteen-Skill suite, and independently installed optional project Skills |
| Project host integration | `.agents/skills/` | Live published-Skill projections and maintainer-only research capability |
| Maintainer tooling | `scripts/` | Deterministic repository and upstream maintenance workflows |
| Public guidance | `docs/site/` | Paired English and Simplified Chinese user guides rendered by VitePress |
| Repository records | `docs/maintainers/`, `docs/migrations/`, `docs/releases/`, `research/` | Explanatory maintainer material, version records, source distillations, cross-source models, and recommendations |
| Verification | `test/` | Observable product and maintainer-tooling checks |
| Self-hosting protocol | `.rsp/` | Durable facts, open work, focus, and archive history for this repository |
| Transient/generated | `.cache/`, `dist/`, dependency directories | Disposable preparation evidence, build output, and installed dependencies |

Key runtime owners:

- `src/cli.ts` registers the CLI and owns argument validation, command-error emission, and exit decisions.
- `src/commands/` owns command coordination and mutations; `src/core/` owns shared filesystem, configuration, output, helpers, locking, WorkRef classification, and Group interpretation.
- `src/status/` owns the internal project snapshot, filesystem-backed inspection, pure derivation, exact public JSON adapter, and plain presentation.
- `src/history/` owns presentation-neutral archive-history inspection, validation, filtering, bounds, and detail projection.
- `src/specs/` owns presentation-neutral current-file Specs and Decision Record inspection, tree/detail/search projections, bounds, diagnostics, source identity, and generated-index migration classification.
- `src/commands/specs-index-migration.ts` owns recognized-only generated Specs-index removal, quarantine/postcheck, and rollback.
- `src/workspace/` owns isolated Git worktree records, bounded fact inspection, recoverable host-activity registration and cooperative resource leases, exact local landing, and safe disposal; project-semantic planning and command execution remain outside the CLI.
- `src/tui/` owns interactive routing state, Ink presentation, localization, layout, and terminal lifecycle.
- `scripts/upstreams.mjs`, `.agents/skills/distill-upstream/`, and `research/` are maintainer-only owners; `rules/rsp-rules.md` and `skills/` are published sources.

## Dependency Direction
- `bin/` loads built runtime. CLI registration delegates to commands, which use domain interpretation and core filesystem/output support.
- Status may depend on core, while core does not depend on status. Pure status derivation and presenters do not inspect the filesystem or depend on commands or TUI.
- The TUI may depend on presentation-neutral status, history, and Specs seams; those domain modules and core do not depend on presenters. Ink and Yoga remain isolated to lazy terminal paths and all presentation dependencies stay outside ordinary command evaluation.
- Product runtime does not import research, caches, host Skill projections, self-hosting `.rsp/` state, or maintainer-only scripts.
- Published rules and Skills operate without a source checkout, research corpus, or upstream cache.
- Maintainer tooling and research may inspect product artifacts but reach product surfaces only through a selected normal RSP Change.
- Self-hosting `.rsp/` artifacts govern this repository's development and are not consumer runtime configuration.

## Constraints
- Prefer the smallest model and artifact owner that correctly solves the workflow problem.
- Create a new directory or protocol surface only for a selected capability with a distinct owner, not for symmetry or speculative future use.
- Preserve deterministic, platform-agnostic, human-readable artifacts and machine output without introducing hidden lifecycle state.
- Keep normative runtime details in their domain Spec or owning Skill; keep explanations in README and design philosophy rather than duplicating executable contracts here.
