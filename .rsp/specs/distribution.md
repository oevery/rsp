# Distribution

## Purpose

Define shipped package contents, installation safety, release evidence and the
boundary between the product and maintainer research.

## Current facts

The Specs in this checkout describe its adopted source-level contracts, not proof
that those contracts have shipped or passed model acceptance. For a released
version, consult that version's assets and corresponding release or migration
materials; historical versions do not redefine the current source contract.

### Authored sources and installation

Bundled Rules and Skills are authored under `rules/` and `skills/`. Repository-local
`.agents/skills/` includes discovery projections and maintainer-only packages;
those maintenance capabilities are not part of the published inventory. The
[Workflow contract](workflow.md#capability-ownership) owns the default capability set.

Installation validates package-owned files and preserves unrelated/unknown Skills.
A dry run previews differences; replacing or removing recognized package-owned
identities requires explicit `--force`. Customized trees need inspection before
force, which replaces or removes their local customizations. Confirm that any
content you need to retain is recoverable; a Git commit containing that content
suffices, without another backup. Activation failure rolls back; incomplete
rollback retains and reports a recovery location. Temporary installation backups
support rollback, not permanent retention. Inspect actual trees and backups before
retry or cleanup. Installation grants no workflow or action authority.

The retired `rsp-release-docs` identity is not a packaged selection. Installing
Doc, directly or through the default suite, includes that identity in the protected
migration; other named selections do not remove it. `rsp update` neither refreshes
nor removes installed Skills. The
[ownership decision](decisions/release-document-ownership.md) owns the rationale.

### Skill package boundaries

Published Skills are standalone runtime closures. Ordinary execution requires no
other installed Skill, repository Spec, shared glossary, research corpus, generated
index or hidden state. Each entrypoint carries the necessary authority, preservation,
action and stop guidance locally; conditional resources remain in its own package.
An unavailable required capability or independent worker remains a real gap,
not permission to emulate it or install a replacement implicitly.

Source-level Spec ownership guides maintenance without creating runtime references
to the RSP checkout. [Workflow](workflow.md) owns capability collaboration;
[Writing quality](writing-quality.md#instruction-and-resource-design) owns the
instruction and resource contract.

### Verification and retained evidence

There are two verification lanes: observable code/package/runner checks under
`tests/code/` and task-based Skill evaluation under `tests/skills/`. Release checks
aggregate them; publication remains separately authorized. Shared projects,
cases, suites and executor/judge configuration support both individual capabilities
and natural workflows. Comparison and holdout experiments are optional research
methods, not universal release gates.

Skill acceptance evaluates task outcomes, authority boundaries and independent
semantic judgment, not Skill wording or reading fingerprints. Offline readiness,
local adapters and package validity do not establish model acceptance. Retained
execution evidence identifies its source, dependencies, composition, cases and
effective settings; historical verdicts cannot be upgraded by new harness checks.
Task-level reuse and execution obligations belong to [Workflow](workflow.md#methods-and-evidence).
Repository commands and evidence-recovery procedures are documented in
[Tests](../../tests/README.md) and [Research](../../research/README.md), not duplicated here.

### Research, provenance and cache

Research supplies pinned source evidence, comparisons and recommendations, never
current product authority. An adopted behavior enters through a selected Change
and its smallest Spec owner; lasting rationale belongs in a Decision Record.
Completing research or advancing a managed source baseline does not adopt it.

Product runtime and published Skills do not depend on research or upstream caches.
Raw sessions, credentials and private execution evidence are not shipped.
Regenerable cache and unique retained evidence have different lifecycles: preserve
occupied inputs and recoverable provenance before authorized retirement, and do
not infer disposability from names, size or dirty status. Detailed retention,
relocation and disposal procedures stay with their repository maintenance owners.

## Boundaries

- Distribution owns the shipped inventory, protected installation and release checks.
- Maintainer Skills own research preparation, source interpretation and candidate methods.
- [CLI](cli.md) owns project update/repair, not installed Skill migration.
- Research completion, packaging and evaluation grant no product promotion or publication.

## Constraints

Never execute cached upstream code as product behavior, overwrite tracked research
automatically, or discard occupied/ambiguous evidence without its required authority
and preservation. Remote delivery, deployment, approval and human acceptance remain
outside installation and local release-check authority.
