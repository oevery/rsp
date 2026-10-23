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

Bundled workflow Skills are authored under `skills/`. Rules are no longer shipped
or generated; there is no alternate fallback protocol. Repository-local
`.agents/skills/` includes discovery projections and maintainer-only packages;
those maintenance capabilities are not part of the published inventory. The
[Workflow contract](workflow.md#capability-ownership) owns the default capability set.

Init installs the complete environment. Update reconciles project files and the
seven core Skills from one selected package, including recognized retired names.
Optional dry run previews changes; differences from the target package are normal
updates, not local conflicts requiring force. There is no standalone Skill install
or installation terminal. Diagnostics remain read-only.

Only exact package-owned Skill names, retired Rules files and the managed AGENTS
block are replacement/removal targets. Unknown Skills and project-owned content
remain untouched. Users preserve needed local modifications inside managed assets
before update and keep ongoing customizations in project-owned instructions or
separately named Skills. No installation baseline, merge engine or first-migration
backup workflow is introduced.

Init creates missing user scaffolding; update never rewrites config or repairs
user directories. Runtime defaults do not require YAML migration. Only the managed
AGENTS block changes; a consumer project's version pin is written last. The RSP
development checkout instead selects its own local source through `.rsp/source`;
init/update retain that choice and do not write a published-version pin. The
[CLI contract](cli.md#project-runtime-selection) owns selection and rejection rules.

New file and Skill content is prepared before publication. No old-content backups,
whole-update rollback or recovery entry exist. A failed update leaves completed
managed changes in place and reports the failure; retry the same target CLI after
fixing the cause. Concurrent external edits and crash recovery are unsupported.
Installation grants no further workflow, Git or external-action authority.

Doctor reports actual missing/divergent trees and recognized obsolete names rather
than inferring consistency from version strings. Canonical maintainer source links
are recognized as current projections, not replaced. Source metadata does not prove
publication or model compliance.

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
0.2.3 under `tests/skills/`. Package release aggregates local checks and offline
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

Workspace preservation uses trusted initial state captured during isolated setup
before agent execution, not a separately maintained digest table. One shared runtime
image serves independent agent and verifier containers; Harbor loads the frozen
workspace and private tests separately instead of building per-task images. The
separate verifier receives the saved initial state. Behavioral
expectations remain independent; regrading retains the original trusted starting
state and cannot reconstruct it from agent outputs or a newer setup.
Initial state includes protected file permission modes. Missing or invalid mode
metadata leaves preservation evidence unavailable. For inputs Harbor uploads,
new execution and resume reject mode drift or unavailable metadata before
dispatch; resume checks precede attempt backup. Regrade uses recorded artifacts
and skips this unused-upload check.
Before reuse, the saved task must match the source trial's native Harbor execution
lock, which must cover the initial state and its image binding. Calibration uses
the executed sample rather than the unexecuted base template.
Repository commands and evidence-recovery procedures are documented in
[Tests](../../tests/README.md) and [Research](../../research/README.md), not duplicated here.

Publication verifies the complete final tagged candidate, including necessary
release and migration documents. A parent CI result or release commit title cannot
replace those checks. Package checks consume the exact tarball subsequently
published; source and archive bytes are checked again before publication. Shared
workflow references use one verified full toolkit revision. Ordinary CI runs
read-only code/docs jobs in parallel at the same source SHA. Dependency caches
never replace candidate execution or tarball verification. Documentation recovery
is a separate path bound to confirmed published source and cannot republish npm.

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
- [CLI](cli.md) owns the complete project update, including installed Skill reconciliation.
- Research completion, packaging and evaluation grant no product promotion or publication.

## Constraints

Never execute cached upstream code as product behavior, overwrite tracked research
automatically, or discard occupied/ambiguous evidence without its required authority
and preservation. Remote delivery, deployment, approval and human acceptance remain
outside installation and local release-check authority.
