# Research operations

Use for source acquisition, retained evidence and versioned studies in the maintainer checkout. Run scripts/research.mjs from the workspace root with existing dependencies. The tool is not part of the published RSP CLI. For a supplied standalone-report task without these tools, preserve the authorized output boundary and state what was not mechanically checked.

## Select the operation

Command signatures use angle brackets for values and square brackets for optional arguments, not literal shell syntax. Every command supports --json; --help gives the executable contract.

~~~text
node scripts/research.mjs sync <source>
node scripts/research.mjs capture <source> [--revision <commit>] [--path <pattern> ...]
node scripts/research.mjs import --file <file-or-directory> --origin <declared-origin> [--license <text>] [--limitations <text>]
node scripts/research.mjs new <study> --question <text> [--evidence <hash> ...]
node scripts/research.mjs seal <study>
node scripts/research.mjs revise <study> --from <study@hash>
node scripts/research.mjs list
node scripts/research.mjs show <study|study@hash|evidence-hash>
node scripts/research.mjs check <study|study@hash|evidence-hash>
node scripts/research.mjs check <study|study@hash> --history
node scripts/research.mjs compare <study@hash> <study@hash>
~~~

Use full identities returned by the tool. list/show are fast navigation with integrity not-checked. Default check verifies the selected study, its direct evidence and immediate predecessor record identities. It does not recursively require historical evidence; history remains not-checked. compare verifies only the two selected report records, then exposes changed text, questions and evidence references. It returns recordIntegrity: valid, evidenceIntegrity: not-checked and history.integrity: not-checked; missing evidence or predecessor records do not prevent comparison. Invalid selected report bytes still fail. Use check separately for evidence verification. Neither comparison nor checks establish a semantic score, use Git or fetch missing material.

Use check --history on a study or exact study revision for a full historical record/evidence audit. Current integrity and historical audit results are reported separately: an unavailable old payload need not invalidate current direct evidence. A requested failed history audit exits nonzero even when current integrity is valid. The flag does not apply to an evidence-only hash. JSON diagnostics distinguish invalid inputs, unavailable artifacts, corruption and operational errors.

## Acquire and retain evidence

sync needs explicit acquisition authority and one exact source from research/sources.yaml. The registry contains repository, ref and paths; research methods and priorities are selected for the question. sync fetches a candidate into an acquisition cache without creating studies or advancing historical acceptance records. Source commands and examples are never executed.

Each fetch updates its repository/ref-specific candidate directly, without using shared FETCH_HEAD as a provenance handoff. The tool creates full bare caches; recovery of externally seeded partial clones is outside its contract. Missing local objects remain an explicit failure and never trigger implicit acquisition.

capture reads the locally synchronized candidate for the configured repository/ref, or the exact --revision supplied, and copies selected source bytes into a retained evidence bundle. A ref without its own synchronized candidate requires explicit sync; another ref's cached candidate is never relabeled. Explicit --revision capture records the repository and commit with selection: explicit-revision, without asserting membership in the configured branch. --path may be repeated to select a different question's scope without changing the registry. Missing Git objects leave capture unavailable; it never implicitly fetches them. Source synchronization and capture are distinct operations.

import retains supplied local files or a directory with its declared origin. Use --license and --limitations for relevant declarations, and include a provenance file for retrieval dates, URLs, attribution, original/excerpt identities or experiment configuration and scorer details. The importer does not independently authenticate those declarations or retrieve URLs. External parent directories are resolved to their canonical locations, allowing platform aliases such as macOS /var. The selected input itself and entries inside imported directories must not be symlinks; paths inside the workspace also reject linked path components. Select only intended material; do not import whole working directories containing credentials, generated dependencies or private data into this tracked workspace.

Both operations produce research/evidence/<hash>/manifest.json and files/. The hash binds the manifest and its file inventory; checks verify payload bytes. A bundle remains verifiable after the acquisition cache is removed. Keep the complete bundle when relocating it; intact provenance metadata without payload is not recoverable evidence. Existing content-addressed evidence is verified and reused, never silently overwritten.

## Author and revise a study

new creates research/studies/<study>/draft.md with the question and any supplied evidence IDs. Evidence may be omitted so the question, constraints and open questions can be recorded before collection; evidence then starts as an empty array. Names are lowercase kebab-case. Edit the body and evidence references to answer the question; metadata contains question, evidence and supersedes. One source revision can support distinct study names and multiple scopes. One study can reference multiple bundles. No per-source dossier or source acceptance is required.

The body should state its answer, evidence, reasoning and material limits in the form the question needs. Drafts may have no evidence or body and remain readable in list/show. Sealing and current-study verification require a nonempty body and direct evidence with valid references; they do not judge research quality or enforce headings, word counts or recommendation counts.

seal verifies direct evidence and immediate predecessor record identities, then stores the exact draft bytes under revisions/<hash>.md, returning study@hash. This is a frozen revision, not semantic approval, product adoption or publishing outside the workspace. A repeated seal of identical bytes is idempotent.

For a correction, run revise with the exact same-study predecessor. It prepares an editable successor with supersedes pointing to that revision. It refuses to overwrite a draft containing unsealed edits; resolve those edits explicitly before retrying. Later sealed versions retain a verified same-study predecessor rather than silently replacing earlier conclusions. revise verifies the predecessor record itself without requiring its evidence to remain available, allowing a new draft to replace unavailable material. supersedes records historical lineage; if a new conclusion relies on old material, include that material in its direct evidence array. Historical payload gaps are assessed with --history rather than silently becoming current dependencies. Do not manually alter sealed revisions or content-addressed evidence; such changes break identity checks.

Select the actual revision in a handoff or comparison; there is no implicit latest-is-best verdict. If several branches answer different constraints, state which one is relevant. Drafts may be queried before they have a research body, but cannot be sealed as empty research.

## Interpret checks and recover

Stored metadata, byte integrity, research quality, applicability and measured effect are separate facts. A valid check confirms only its retained artifact/reference boundary. Source freshness, an accurate interpretation and reliable model behavior each need their own evidence.

On failure inspect the diagnostic and actual filesystem effects. Missing bytes remain unavailable; corruption is not repaired by rewriting a hash or re-importing under an old identity. Preserve sealed records and retrieve exact missing material only within authorized scope. Operational failures require diagnosis rather than a fabricated research verdict.

The old scripts/upstreams.mjs workflow is retired. The original registry and lock are frozen under research/legacy/upstreams/; historical reports and models remain outside the engine. There is no legacy reader, old-path fallback, automatic migration or accept command. To use historical reasoning in a new study, deliberately import the selected record with its original date, identity and limits. Historical recovery and former root-path mappings follow research/ARCHIVE-RECOVERY.md.
