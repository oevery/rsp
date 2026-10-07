# Research workspace

Research discovers improvement opportunities and investigates focused questions using retained evidence. Start from a brief: an intent and a scope, not necessarily a known problem. For example, explore updates across the registered upstreams and assess what could improve RSP. A useful outcome can be a new question, a supported recommendation, or a reason to keep the current design. Research does not authorize product changes or certify effectiveness.

This workspace is maintenance-only and excluded from the published RSP package.

## Responsibilities

| Owner | Responsibility | Durable record |
| --- | --- | --- |
| Sources | Explicit acquisition and selected source inventory | sources.yaml; immutable refresh batch |
| Evidence | Retain scoped bytes, provenance and hashes; compare snapshots | Content-addressed evidence bundle |
| Studies | Explore, investigate, compare with RSP and revise findings | Brief, direct references and sealed report revisions |
| Adoption and experiments | Select changes, implement and measure outcomes | Existing RSP Change and evaluation evidence |

The maintainer [distill-upstream Skill](../.agents/skills/distill-upstream/SKILL.md) owns research method. Its [operations reference](../.agents/skills/distill-upstream/references/managed-sources.md) owns CLI contracts and examples. scripts/research.mjs is the maintenance entrypoint.

## Refresh, then decide what to study

An explicitly requested full refresh acquires all registered sources and retains their scoped content. Each immutable batch records source configuration, exact resolved revisions, full repository file inventories, retained evidence and per-source failures. Successful sources remain usable when others fail; a partial batch is not full coverage. The registry is captured at the start of acquisition. A batch records an observation window, not an atomic point in time across repositories.

Full refresh does not require a report per source or equal analysis depth. Examine repository-wide changes as well as selected paths so newly introduced mechanisms remain discoverable. Inventories identify files and Git objects; bytes outside the captured scope are not retained. Expand capture deliberately when needed. Initial snapshots support initial assessment without claiming a prior delta. Existing practices can be revisited even when upstream commits have not changed.

Use three distinct reference points:

- An exact earlier refresh for changes since the last selected observation.
- An exact study revision's declared coverage for changes not yet researched. Refreshing B and C must not advance a study that still covers A.
- Retained local RSP material for applicability. Upstream freshness does not establish that the local comparison is still current.

There is no mutable global reviewed/accepted cursor or automatic latest-is-best selection. Batch comparison, research coverage and report comparison answer different questions.

Use compare-refreshes for offline comparison of exact observation batches. Research coverage additionally matches cited batch inventories to each reviewed commit, separating changes inside the reviewed scope from changes outside it. A skipped intermediate refresh cannot hide a new mechanism outside selected paths. Missing matching inventory is reported as a gap, not no change.

## Evidence survives acquisition

Each bundle retains selected bytes, origin, inventory and hashes. A Git revision is not a backup. Keep the whole bundle when moving it, and retain needed material before removing caches. Capture uses local Git objects without executing source code or fetching missing data. Imports retain declared provenance without authenticating the publisher or experiment.

For community discussions and web material, retain selected text, URL, retrieval time and limitations. For experiments, retain relevant inputs, raw outcomes, scorer identity and original judgments. For a local RSP comparison, retain selected source files or a base-linked patch with affected paths and dirty-state limits; an arbitrary label alone is not a reproducible local baseline. Keep private material in an appropriate private workspace.

Scope differences are not automatically source additions/deletions. Offline evidence comparison distinguishes added, deleted, modified, entered-scope and left-scope files. Repository or tracked-ref changes require a matching baseline. An empty Git capture is valid when the selected scope contains no files; confirm whether content disappeared or selection needs updating.

## Studies and coverage

One Study supports exploration and focused investigation. Start with a brief-only draft; evidence and body may be added later. Seal only after adding a substantive report and direct evidence. No finding count, prescribed headings or mandatory recommendation is required.

Metadata separates direct evidence, reviewed source coverage, local baseline evidence, refresh records and predecessor revisions. Merely citing evidence does not declare all of it reviewed. Coverage means the study has assessed the retained scope for its brief, not every possible question about that source. For partial reading, capture a narrower reviewed scope or leave the bundle pending and explain the limit in prose. Multiple scopes may have separate coverage entries; comparison reports each without merging them into a global verdict.

For a smaller scope at an already retained version, use subset on its evidence identity. It copies selected retained files with their original Git provenance and exact file scope, independent of the current cache revision. The smaller bundle survives removal of parent payloads; keep the original batch record when repository-wide discovery is needed.

Local applicability claims should cite baseline evidence as well as upstream material. Preserve stable finding labels when conclusions continue across revisions. Distinguish source claims, local observations, inference, recommendations and measured effects; popularity or byte integrity supplies none of the latter. A fresh local baseline may justify revising a study even when upstream evidence stays unchanged.

Sealed revisions are immutable and content-addressed. Successors name exact predecessors; directly cite old evidence only when it still supports the current conclusion. A study's default check verifies direct evidence, cited refresh records and immediate predecessor identities. It does not require every unexamined source payload in a cited batch. Explicit historical auditing checks prior studies and their direct evidence; check a refresh separately to verify all successful captures in that batch.

Fast navigation leaves integrity unchecked unless stated otherwise. Report comparison checks the selected report records, not their evidence or history, and exposes brief/body/reference changes without scoring quality. Coverage compares declared source evidence with a selected refresh and reports gaps. It never fetches, alters reports or certifies semantic coverage.

## Adoption and history

A separately authorized RSP Change cites the exact report, selected finding, concrete local gap and reuse mode. Implementation and existing evaluations establish effects. Selected results can become evidence for follow-up research; no duplicate adoption ledger is needed.

The brief schema replaces the former question field and --question option. Old sealed bytes are not rewritten or implicitly migrated. Existing upstreams/, models/, evaluations/ and local-skills/ records remain dated archives; deliberately import selected historical material to reuse it. Old complete/accepted labels establish no current acceptance.

[sources.yaml](sources.yaml) contains repository/ref/path defaults, not research priorities or acceptance. Retired registry/lock files under [legacy/upstreams/](legacy/upstreams/) are frozen and never read by the engine. See [archive recovery](ARCHIVE-RECOVERY.md) for historical paths and private evidence limits.
