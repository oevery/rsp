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
Interactive installation uses the installer's read-only preflight to list exact
replacement and deletion directories. Either action requires a separate confirmation
that warns about lost local customizations; cancellation leaves files unchanged.

The retired rsp-release-docs identity maps to Doc; rsp-structural-audit and
rsp-codebase-audit map to Review. Full-suite installation includes all recognized
obsolete identities in protected migration. Partial named installation is rejected
before mutation. Preserve customized obsolete content until explicit forced
migration; rsp update does not refresh or remove installed Skills.

### Skill package boundaries

The seven core Skills form one runtime distribution closure and install/update
together from one package version. A capability can be invoked directly without
executing Core. Shared work identity definitions belong to Core's
references/work-model.md; consumers load that file only when the definitions are
needed and missing from their current context. Separate workers have separate
contexts. Missing shared resources stop dependent operations as an incomplete
installation, not permission to invent definitions or install implicitly.

Each entrypoint retains its action, authority and stop conditions. Conditional
methods remain with their capability. Cross-Skill resource links may target Core's
references inside the suite; arbitrary sibling dependencies and package-external
paths are rejected. Validate both authored sources and installed package resources.
Product execution requires no maintainer Spec, research corpus or generated index.
An unavailable required capability or independent worker remains a real gap.

Source-level Spec ownership guides maintenance without creating runtime references
to this checkout. Workflow owns collaboration and Writing quality owns instruction
design. Maintainer Skills are not part of the published suite. No optional extension
or independent Skill dependency manager is introduced.

### Verification and retained evidence

There are two verification lanes: observable code/package/tooling checks under
`tests/code/` and native Harbor 0.24.0 task/job evaluation with harbor-rewardkit
0.2.2 under `tests/skills/`. Package release aggregates local checks and offline
native task schema validation only; it never automatically starts agents or paid
judges. Native job configuration selects agent skills and execution settings.
Task environments and verifiers cover individual capabilities and natural
workflows. Comparison and holdout experiments are optional research methods,
not universal release gates; publication remains separately authorized.

Skill acceptance evaluates task outcomes, authority boundaries and independent
semantic judgment, not Skill wording or reading fingerprints. Offline readiness,
local adapters and package validity do not establish model acceptance. Retained
native job evidence identifies its source, dependencies, selected skills, tasks
and effective settings. Provider, judge and verifier errors remain ungraded gaps;
full-score acceptance uses threshold aggregation at 1 rather than treating partial
positive scores as passing. Oracle/nop offline calibration does not establish
semantic acceptance. Preserve historical evidence; resumed or regraded results do
not rewrite original verdicts or by themselves establish fresh candidate execution.
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
