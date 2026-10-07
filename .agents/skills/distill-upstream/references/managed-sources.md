# Research operations

Run scripts/research.mjs from the maintainer checkout with existing dependencies. It is not a published RSP command. Use full identities returned by the tool; --help gives the executable contract. For a standalone answer, preserve its write boundary rather than creating managed artifacts automatically.

## Commands

The signatures below use placeholders, not literal shell arguments. Every command supports --json.

~~~text
node scripts/research.mjs sync <source>
node scripts/research.mjs refresh --all [--from refresh@<hash>]
node scripts/research.mjs refresh --source <name> [--source <name> ...] [--from refresh@<hash>]
node scripts/research.mjs capture <source> [--revision <commit>] [--path <pattern> ...]
node scripts/research.mjs subset <evidence-hash> --path <pattern> [--path <pattern> ...]
node scripts/research.mjs import --file <file-or-directory> --origin <declared-origin> [--license <text>] [--limitations <text>]
node scripts/research.mjs new <study> --brief <text> [--evidence <hash> ...] [--refresh refresh@<hash> ...] [--baseline <hash> ...]
node scripts/research.mjs seal <study>
node scripts/research.mjs revise <study> --from <study@hash>
node scripts/research.mjs list
node scripts/research.mjs show <study|study@hash|evidence-hash|refresh@hash>
node scripts/research.mjs check <study|study@hash|evidence-hash|refresh@hash>
node scripts/research.mjs check <study|study@hash> --history
node scripts/research.mjs compare <study@hash> <study@hash>
node scripts/research.mjs diff <evidence-hash> <evidence-hash>
node scripts/research.mjs compare-refreshes <refresh@hash> <refresh@hash>
node scripts/research.mjs coverage <study@hash> <refresh@hash>
~~~

## Refresh a source set

refresh requires --all or repeated --source, never both. It freezes registry selection, explicitly syncs each source and retains the exact returned commit with its scoped bytes. A batch under research/refreshes/<hash>.json records the observation window, source configuration, resolved revisions, evidence IDs, full repository file inventories and failures. A failed source does not stop others. Partial acquisition returns a batch and exits 1; complete acquisition exits 0. An interrupted process may leave usable evidence without a finished batch; inspect effects before retrying.

--from names an exact prior refresh. Its record is checked before acquisition; evidence comparison happens after the new batch is published. Missing old evidence becomes comparison-unavailable without discarding fresh acquisition. No baseline means initial observation. repositoryChanges lists changed paths across the full tree, including outside captured scope; those extra bytes are not retained. Different repositories or tracked refs are not comparable. No latest baseline is selected implicitly.

show refresh@<hash> verifies the batch record, leaving evidence unchecked. check refresh@<hash> also verifies all successful captures. A valid partial record still means partial acquisition. list includes exact refresh references without inferring completion, recency or research quality.

compare-refreshes compares two retained batches offline, with the same comparison used by refresh --from. It reports full repository inventory changes independently of scoped payload availability; missing payloads can make the scoped comparison unavailable without hiding repository changes. Sources absent from the later batch appear in notSelected. Neither inventory comparison nor file discovery proves those files were read.

## Acquire and retain evidence

sources.yaml contains repository, ref and path defaults. Research priorities and reading depth belong to the brief. sync explicitly acquires one source into a repository/ref-specific cache candidate; it does not advance research coverage. Full bare caches are used; externally seeded partial-clone recovery is outside the contract.

capture reads local objects and retains selected files. It never fetches missing objects. Another ref's candidate cannot stand in for an unsynchronized ref. --revision must be an exact commit and records explicit selection without asserting branch membership. Repeated --path overrides capture scope without changing the registry. Missing objects are unavailable evidence. An empty Git selection is retained, allowing complete deletion of selected files to be compared; check whether the scope needs adjustment. Source code and examples are never executed.

import retains selected local files with their declared origin. Include retrieval dates, URLs, attribution, reuse terms, original/excerpt identities and omissions in a provenance file when relevant. For experiments include configuration, raw outcomes and scorer identity. Imports do not authenticate provenance, licensing or experiment execution. Empty imports are rejected.

Selected files and directory entries cannot be symlinks or special files. External parent directories may resolve platform aliases; workspace-internal linked paths remain rejected. Select intended material rather than an entire working tree containing private data.

Evidence lives under research/evidence/<hash>/{manifest.json,files/}. Its identity binds origin, scope and inventory; checks verify payload bytes independently of caches. Keep complete bundles when relocating. Existing content-addressed evidence is verified and reused, never overwritten. A hash without bytes is not recoverability.

subset verifies a retained Git bundle and copies matching files into a self-contained smaller bundle. It preserves the original repository, source, commit and any observed tracked ref; it never consults the cache or infers branch membership. The derivedFrom identity records provenance without making parent payloads a runtime dependency. origin.selectedFiles defines the exact retained file scope, including literal wildcard characters in filenames; origin.paths retains the original acquisition selection. Patterns select only files already retained, never prove anything about omitted files, and a selection matching no files fails. A subset of an explicit-revision bundle still cannot invent tracked-ref membership.

## Author and revise a study

new creates research/studies/<study>/draft.md from a nonempty brief, which may describe exploration rather than a question. Names use lowercase kebab-case. Drafts may omit evidence and body; list/show can read them. Complete the research before seal: a nonempty report and direct retained evidence are required, but headings, finding counts and recommendation counts are not.

Metadata arrays have distinct roles:

- evidence: direct support for the current findings.
- coverage: tracked Git evidence assessed for this brief. Each ID must also occur in evidence. Multiple scopes are allowed.
- baseline: retained local comparison material. Each ID must also occur in evidence; --baseline populates both.
- refreshes: exact refresh@<hash> records describing acquisition coverage. --refresh adds a reference without declaring any source reviewed.
- supersedes: exact predecessor study revisions.

Set coverage after investigation. For partial reading, use subset on the original retained snapshot, even after caches advance or disappear, or leave coverage undeclared with its limits explained in prose. Cite the originating refresh to enable full-repository discovery from that reviewed revision. Explicit-revision capture alone asserts no tracked-ref membership and cannot be used as coverage; subset preserves an existing ref but does not invent one. For a local RSP comparison, import relevant files plus provenance identifying the base commit, dirty paths or patch and omissions; assign those IDs to baseline. This declares relevance, not independently authenticated origin.

seal checks direct evidence, coverage references, cited refresh records and immediate predecessor identities, then publishes immutable report bytes as study@<hash>. It does not require all unexamined source payloads in a referenced batch. Repeated sealing of identical bytes is idempotent; sealing grants no semantic approval, adoption or publication authority.

revise requires an exact predecessor of the same study and refuses to overwrite unsealed draft edits. It prepares a successor with supersedes set to that revision. Missing old payloads do not prevent a new draft from replacing unavailable evidence; the predecessor record must still be valid. Include old evidence directly only when it supports the new findings. Do not edit sealed reports or bundles. There is no implicit latest-is-best verdict.

## Compare and check

diff verifies two retained Git bundles offline and returns content/mode inventory changes. added/deleted apply within both selections; entered-scope/left-scope identify selection effects without inventing upstream history. Different repositories or tracked refs return comparable: false. This compares endpoints, not intervening commits; read retained payloads for content and explicitly inspect Git history when transient changes matter.

coverage compares declared coverage in a sealed study with a selected refresh. It reports changed, unchanged-in-scope, scope-changed, baseline-mismatch, not-reviewed, acquisition-failed and unavailable comparisons. Multiple covered scopes produce separate comparisons; covered sources outside the batch appear in notSelected. Missing covered evidence produces diagnostics rather than a fabricated baseline. Local baseline identity is checked, but localFreshness remains not-checked: the current working tree is not silently inspected. The command neither fetches nor advances coverage.

Each source comparison also reports repository discovery separately. It selects a cited refresh matching the reviewed source, repository, ref and commit, rather than the most recently cited batch. reviewedScopeChanges and outsideReviewedScopeChanges partition complete inventory changes against the reviewed scope. Without a matching retained batch it reports no-baseline; an unavailable batch produces a diagnostic. unchanged-in-scope never implies no new mechanisms elsewhere in the repository.

compare verifies only the two selected report records and exposes brief, body, coverage, local baseline, refresh-reference and direct-evidence differences. Evidence and history remain not-checked; missing historical payloads do not block record comparison. Changed text or identities do not establish improved outcomes.

list/show are metadata navigation with integrity unchecked unless stated otherwise. Default study check verifies current direct evidence, cited refresh records and immediate predecessors. check --history additionally audits prior reports and their direct evidence and returns nonzero when that requested history is incomplete. Refresh references in a study audit check batch records; check a refresh separately to audit all its successful captures. --history applies only to studies. Current and historical integrity are reported separately.

JSON errors distinguish invalid input, unavailable material, corruption and operational errors. Successful checks establish their artifact/reference boundary, not freshness, truthful interpretation, local applicability or model effectiveness. A missing payload is not repaired by changing its recorded hash. Preserve partial effects and exact identities before recovery.

## Historical records

The brief field and --brief replace question and --question without a compatibility reader. Never rewrite old sealed bytes to fit the new schema. Import selected historical reports explicitly with their original date and limits when needed. The retired scripts/upstreams.mjs workflow and legacy registry/lock are not read or migrated. Historical locations and recovery limits remain in research/ARCHIVE-RECOVERY.md.
