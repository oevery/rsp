# Design

## Purpose

Define RSP system layering, artifact ownership, dependency direction, and boundaries with the Host Project and Git.

## Current facts

- RSP is a repository-native workflow for humans and AI agents. It guides work through durable files, Skills, deterministic CLI operations, verification, review, archive, and delivery.
- The formal Spec model has six modules: `core`, `skill`, `design`, `cli`, `tui`, and `distribution`. Each module has one authoritative Markdown file.
- Product runtime lives under `src/` and `bin/`. Published distribution sources live under `rules/` and `skills/`. Maintainer tooling lives under `scripts/`. Research lives under `research/`. Self-hosting workflow state lives under `.rsp/`.
- Product runtime owns command behavior, artifact interpretation, status, history, Specs inspection, and TUI presentation. It consumes current product artifacts and host evidence.
- Published Rules and Skills work without a source checkout, research corpus, or upstream cache.
- Maintainer tooling may inspect product artifacts and research evidence. Product changes enter through a selected normal RSP Change.
- Root maintainer scripts own executable diagnostics and preparation; code tests verify their results, while maintainer Skills own invocation and interpretation. Context counts, static reachability and repeated prose are diagnostic leads, not quality or behavioral-acceptance gates. Package/resource and security validation retain their existing owners.
- The Host Project owns code, tests, project instructions, module context, Git, execution environments, and external delivery systems. RSP may read these boundaries but does not replace them.
- Git owns staging, commit history, branches, remotes, tags, publication, and cross-branch integration. RSP can provide exact reviewed inputs without becoming Git authority.

## Modules

- [Core](./core-model.md) owns WorkRef, Change, Group, FocusSet, lifecycle, dependencies, verification, archive, and durable writeback.
- [Skill](./skill.md) owns capability ownership, composition, routing, delegation, and control boundaries.
- [Design](./design.md) owns system layering, artifact ownership, and Host/Git/RSP boundaries.
- [CLI Contracts](./cli-contracts.md) owns deterministic commands, inspection, JSON, history, Specs queries, repair, and local commit boundaries.
- [TUI](./tui.md) owns interactive scopes, presentation, localization, and terminal lifecycle.
- [Distribution](./distribution.md) owns package, installation, release, provenance, and the product/research boundary.

## Dependency direction

- Configuration and filesystem safety support artifact interpretation and commands.
- Core domain interpretation supports status, history, Specs inspection, and command operations.
- Presentation layers consume presentation-neutral projections. Domain and command layers do not depend on TUI presenters.
- Research and maintainer tooling may depend on product artifacts for evidence, never the reverse.
- Self-hosting `.rsp/` artifacts guide repository maintenance and are not consumer runtime configuration.

## Constraints

- Prefer the smallest owner and the smallest stable artifact surface.
- Keep current truth, planned work, rationale, research evidence, and transient execution state separate.
- Do not introduce a hidden workflow engine, durable controller, runtime protocol, or second authority store.
