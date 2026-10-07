# Research workspace

Research explores upstream practices and answers focused questions against the current RSP implementation. A predefined defect is not required; finding no useful change is valid. Research does not authorize product adoption or prove model effectiveness.

The maintainer-only [distill-upstream Skill](../.agents/skills/distill-upstream/SKILL.md) owns research method. Its [operations reference](../.agents/skills/distill-upstream/references/managed-sources.md) lists acquisition commands. This workspace is excluded from the published package.

## Layout

| Location | Responsibility | Git |
| --- | --- | --- |
| sources.yaml | Current repositories, tracked refs and default selections | Tracked |
| index.json | Recovery information for material actually retained | Tracked |
| reports/UTC-time.md | Ordinary Markdown findings and source citations | Tracked |
| captures/source@commit-prefix/ | Selected Git material in original relative layout | Ignored |
| captures/name@UTC-time/ | Imported excerpts or other original material | Ignored |
| refreshes/UTC-time.json | Acquisition progress, failures and retries | Ignored |

Git capture keys contain the source name and full commit. Their index records contain repository and selection; ordinary directories are derived from the identity. A path override is stored only for a shortened-commit collision. Imported records contain origin and any supplied attribution or limitations; their identity includes acquisition time. There are no file inventories, content checksums, latest pointers or per-capture metadata sidecars. Repeated Git capture at the same commit reuses matching files and can expand the selection. Each import is a separate observation; it is not deduplicated by content.

## Refresh and explore

Run node scripts/research.mjs refresh --all for a new observation, or select sources with --source. Each source's configuration is fixed for that task. Before fetching, the task saves the previous locally synchronized commit; after retention it saves the resulting commit. A missing baseline is explicit. Git produces repository-wide differences, including changes outside the capture selection, without storing a copy of its tree. Selection is not a statement of what a researcher actually read.

Resume a failed or interrupted task with refresh --resume refresh@timestamp. Successful source versions remain fixed; only incomplete sources retry. Use --update-config after an intentional configuration correction to retry affected entries. It preserves previous configurations only when they change. A completed source whose material directory is missing must be recovered rather than silently refreshed to a newer commit.

Compare two selected captures with diff, or two tasks with compare-refreshes. Comparison uses local Git objects and does not fetch or read capture payloads. Missing objects are an acquisition gap, not proof of no differences. Cached captured commits are retained with Git refs. A removed cache still needs explicit sync or recover.

## Write reports

Write directly to reports/<UTC-time>.md, for example reports/2026-10-07T14-30-00Z.md. Use finer timestamp precision if needed to avoid a filename collision. The filename locates the observation in time; the title states the topic. There is no required frontmatter, parser, sealing operation, numbered revision or automatic coverage ledger.

Continue editing the same report for the same investigation; Git records edits. Start a new time-named report for another investigation and link earlier reports when useful. Explain findings, local applicability, alternatives and limitations in the form the question needs. Cite the repository and commit/path actually examined, or a locatable URL and retrieval date. Current upstream state cannot stand in for a historical citation.

Read current RSP code directly. When conclusions depend on local state, note its base commit and relevant uncommitted scope. Retain a patch only when reproducing that particular state matters; a full local snapshot is not a prerequisite. Acquisition coverage, research depth and measured behavior are different claims.

## Recover, move and clean

The index locates material; it is not its backup. list and show report directory presence only, not completeness or content verification. recover explicitly fetches the recorded Git commit and re-extracts its recorded selection; it never substitutes a branch tip. Conflicting existing files are preserved and reported. A commit may no longer be available remotely, so preserve the Git cache or original material when historical recoverability matters.

Use ordinary directory copy or archive tools to move material and its index. For an existing destination, reconcile selected index entries and avoid overwriting conflicting material. There is no custom export manifest, report dependency closure or restore protocol. Non-Git historical responses require the saved original material; a URL and time cannot recreate them.

clean <capture> previews that explicit selection and its byte size; --apply removes only those directories, retaining the recovery index. It does not infer that material is unused or parse report references. Never remove ignored material merely because it is ignored. Cache, task and imported-material cleanup remain deliberate operations with different recovery consequences.

The [consolidated research baseline](reports/2026-10-07T14-19-03Z.md) retains useful historical conclusions, their limits and Git locations for replaced documents. Historical verdicts remain historical; discarded private evidence is not recoverable from a summary. Selected recommendations enter a separately authorized RSP Change.
