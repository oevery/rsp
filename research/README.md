# Research workspace

Research answers a question using retained evidence. It does not authorize product changes or certify that an adopted recommendation works. This workspace is maintenance-only and excluded from the published RSP package.

Start with the decision, relevant constraints and what evidence would be sufficient to answer it. Reuse adequate evidence; collect more only for a concrete gap or freshness question. A source release alone does not require another report.

## Responsibilities

| Owner | Responsibility | Durable record |
| --- | --- | --- |
| Sources | Explicitly acquire a repository revision or identify supplied material | Repository/ref or declared origin |
| Evidence | Retain actual selected bytes, provenance, scope and hashes | Content-addressed bundle under evidence/ |
| Studies | Answer a question, compare alternatives and revise conclusions | Draft and sealed revisions under studies/ |
| Adoption and experiments | Decide what to implement and measure the result | Existing RSP Change and evaluation evidence |

A snapshot can support several questions; a study can cite several bundles, including source text, local observations and experiment results. References carry information between owners; none silently advances another owner's state.

The maintainer [distill-upstream Skill](../.agents/skills/distill-upstream/SKILL.md) owns research method. Its [operations reference](../.agents/skills/distill-upstream/references/managed-sources.md) documents the executable CLI. The current tool is scripts/research.mjs; the old upstreams tool and revision-named source-report workflow are retired.

## Evidence survives its acquisition cache

Each new bundle retains the scoped material it claims to contain, with origin, inventory and byte hashes. Keep the whole bundle when relocating it. Retain and verify needed material before retiring the acquisition checkout. A Git revision identifies history; it is not a backup of its bytes.

Capture reads Git objects without executing the repository. Imported excerpts or experiment artifacts retain their declared origin and limitations; import does not verify the publisher, original retrieval, licensing or experiment. Retain retrieval time, URL, attribution, reuse terms and omissions when relevant. For experiments retain input/configuration identities, raw outcomes, scorer identity and original judgments. Private material belongs in an appropriate private workspace; do not commit credentials or confidential raw evidence here.

Evidence checking works independently of the original checkout. Missing files, changed bytes and tool failures are different findings. Integrity establishes neither freshness, relevance, source truth nor coverage outside the declared scope.

## Studies evolve independently of sources

Use one study identity for a continuing question. Start an editable draft from the question alone when evidence has not yet been collected; add evidence and the answer before sealing. Sealing creates an immutable content-addressed revision after mechanical evidence checks; it does not approve the conclusion. A follow-up draft identifies the exact earlier revision it supersedes. That link records lineage, not an implicit dependency on every old evidence file. Material that still supports the current conclusion belongs in its direct evidence references. Preserve cited revisions and bundles rather than editing old findings to match a new result.

Lead with the answer and applicable conditions. Include decisive evidence, alternatives, reasoning, recommendations and unresolved limits as needed. Distinguish source assertions, inspected implementation, observed execution and inference. Sections, source counts and recommendation counts are not quality gates. Give recommendations stable labels when they will be cited; reuse a label's original revision when its meaning is unchanged.

Compare exact revisions to see changed text and evidence references. compare verifies only the two report records and returns recordIntegrity: valid, evidenceIntegrity: not-checked and history.integrity: not-checked. Missing evidence or predecessor records do not block comparison; invalid selected report bytes still fail. Run check separately when evidence integrity matters. Comparison is traceability, not a quality score. Reliability or speed claims require comparable task outcomes, failures and relevant cost measurements. New evidence may revise a conclusion without changing the underlying source snapshot.

Fast navigation reports stored metadata with integrity unchecked. list returns study metadata and evidence summaries (identity, origin and file count); show returns the selected study or complete evidence manifest. Default study checks verify current direct evidence and immediate predecessor record identities. A missing historical payload does not by itself invalidate replacement evidence or prevent a new research revision. Run check --history when a complete historical record/evidence audit is needed; it reports history separately from current integrity and exits nonzero for an incomplete requested audit. Neither navigation nor checks implicitly fetch objects, scan legacy dossiers or adopt a result.

## Adoption remains with its existing owner

A separately authorized RSP Change cites an exact study revision, recommendation label, concrete local gap and reuse mode. It owns implementation and required validation. Record experiment outcomes through existing test/evaluation owners; retain selected results as evidence for follow-up research. No research acceptance ledger or automatic promotion step is needed.

## Historical research

Existing upstreams/, models/, evaluations/ and local-skills/ records remain dated archives. Their paths and verdicts are preserved. They are not ingested by the new engine, and old complete/accepted labels establish no current acceptance. The [historical model index](models/INDEX.md) is a reading aid, not the active study registry. To reuse an old report, deliberately retain it as evidence, state its date and limits, and verify the claims needed by the new question.

[sources.yaml](sources.yaml) is the active repository/ref/path registry. Research methods and priorities are selected for each question rather than stored as source tiers or strategies. The original root registry and acceptance lock are retained byte-for-byte under [legacy/upstreams/](legacy/upstreams/); the engine never reads them and has no old-path fallback. Historical paths are mapped in the recovery guide. Old caches are retained without automatic migration or deletion.

Use [archive recovery](ARCHIVE-RECOVERY.md) for old evidence references and private run bundles. A hash without its bytes is not recoverability; restoring files does not recreate the original execution environment or upgrade its verdict.
