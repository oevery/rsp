# Research operations

Run scripts/research.mjs from the maintainer root with existing dependencies. These maintenance commands do not execute source instructions. Use --help for signatures and --json for machine output. On completion, return outcomes, a task identity when available, failures and actionable gaps in conversation. Existing configuration, index and task records carry operational state; no report-writing step is required. Follow the [Skill entrypoint](../SKILL.md#establish-the-research-boundary) when deciding whether the request also calls for analysis or an artifact.

## Acquire and retry

~~~text
node scripts/research.mjs refresh --all
node scripts/research.mjs refresh --source <name> [--source <name> ...]
node scripts/research.mjs refresh --resume refresh@<UTC-time>
node scripts/research.mjs refresh --resume refresh@<UTC-time> --update-config
node scripts/research.mjs sync <source>
node scripts/research.mjs capture <source> [--revision <full-commit>] [--path <glob> ...]
~~~

sources.yaml owns current configuration. A new refresh freezes its selected source configurations, saves each pre-fetch commit and persists progress per source. A null baseline means no previous commit was recorded. Partial acquisition exits 1 with its task identity; resume retries incomplete sources and preserves successes. Explicit --update-config retries changed configurations without adding sources to that task. Prior attempt statuses and failures remain; unchanged configuration is not copied into every attempt.

Locks reject concurrent execution of the same task and recover dead local process owners. Foreign-host or damaged locks require inspection. Clone allows 300 seconds, fetch 120 seconds and local Git reads 60 seconds; transient network failures receive bounded retries. Failed clone retries remove only their temporary clone. Successful retained material is not discarded when another source fails.

sync explicitly fills the Git cache. capture reads local objects only; --revision selects an exact commit. Glob selection supports *, ** and ?. Selected symlinks/submodules are rejected; select ordinary files explicitly. Empty Git selections are allowed. Capture pins its commit in the Git cache so a later branch rewind does not leave it unreferenced.

Git material uses source@full-commit, stored under captures/source@commit-prefix. index.json records repository and selection, with a directory override only for a prefix collision. No file inventory or content hash is recorded. Repeated capture reuses matching destination bytes, rejects conflicting files and can expand selection at the same commit.

## Import material

~~~text
node scripts/research.mjs import --file <file-or-directory> --name <slug> --origin <provenance> [--license <text>] [--limitations <text>]
~~~

Imports retain original bytes at name@UTC-time. Record URL, original retrieval/run date, attribution and limitations as relevant. The tool's time identifies retention, not verified web freshness. Each invocation creates an observation; there is no content-based deduplication. Selected symlinks and special files are rejected; external location aliases are allowed. Keep secrets out of retained material.

## Inspect and compare

~~~text
node scripts/research.mjs list
node scripts/research.mjs show <capture|refresh@timestamp>
node scripts/research.mjs diff <capture> <capture>
node scripts/research.mjs compare-refreshes <refresh> <refresh>
~~~

list/show report local directory presence, not completeness or byte integrity. diff compares whole-repository Git changes between indexed commits. Refresh output compares each source to its pre-fetch commit; --from on a new task explicitly selects another refresh baseline. compare-refreshes uses the two selected task results and their configurations. Selected/outside-selection classifications guide exploration, not research coverage. A scope-only configuration change is reported separately from content changes.

Comparison is offline, independent of materialized captures. A missing cache or object is unavailable comparison, never an empty diff. Explicit sync/recover may acquire the needed objects. Researcher-selected baselines remain in report citations rather than a mutable reviewed cursor.

## Reports

When the entrypoint selects an authorized research report, write ordinary Markdown under research/reports/<UTC-time>.md, for example 2026-10-07T14-30-00Z.md. Use enough time precision for unique filenames. A report has no required metadata, state, parser, seal or revision chain. Keep editing it during the same investigation; Git records edits. Start another time-named file for a new investigation and cite earlier reports when useful.

Use a descriptive title and source references in prose: repository, full commit and relevant path, or a URL with retrieval date and retained location. State reading limits and missing sources honestly. Read current local RSP directly; note its base commit and relevant dirty scope when local conclusions depend on them. Preserve a patch only when needed for reproduction. Report meaning is not certified by a format checker.

## Recover and clean

~~~text
node scripts/research.mjs recover <capture>
node scripts/research.mjs clean <capture> [<capture> ...]
node scripts/research.mjs clean <capture> [<capture> ...] --apply
~~~

recover explicitly fetches the indexed exact commit and selection without depending on current registry configuration. Existing conflicting bytes are not replaced. Imported historical material must come from a retained copy or archive; revisiting a URL cannot restore an old response.

Copy directories and recovery metadata with ordinary tools for portability. Preserve Git objects or material if a remote may drop a historical commit. There is no custom bundle format or report-dependency export. When combining copies, reconcile only intended index entries and destination conflicts.

clean requires explicit capture IDs, previews their directories and sizes, and removes only the selected payloads with --apply. The index remains. It does not inspect report citations or decide which evidence is unused. Treat Git cache, refresh tasks and original non-Git material separately when deciding cleanup.

Previous layout conversions are completed maintenance operations, not permanent runtime commands. Useful historical conclusions are consolidated in time-named reports; cite old documents by Git revision and path when needed. Consolidation does not revalidate historical verdicts or recreate discarded private evidence.
