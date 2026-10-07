---
kind: refactor
summary: Replace revision-bound upstream distillation with independent retained evidence and versioned question-led studies.
---

# Change: upstream-research-continuity

## Proposal

Replace the maintainer's revision-bound upstream workflow with independent source acquisition, retained evidence and question-led studies. Research must remain traceable without a source acceptance ledger, mandatory intermediate dossiers or compatibility with retired report formats.

Scope covers maintenance tools, research configuration and guidance, and observable code/Skill fixtures. Historical reports, verdicts and original registry/lock bytes are preserved. Published product contracts and the existing model-evaluation runner are unchanged. Real upstream refreshes, model-effectiveness studies and evaluation-framework replacement are outside this delivery.

## Spec

- Acquisition is explicit. Capture reads local scoped Git objects without executing source content or implicitly fetching missing objects. Queries and checks do not mutate acquisition caches.
- Candidates bind to the synchronized repository/ref even during overlapping syncs. Explicit commit capture asserts no branch membership. Normal caches are full bare repositories; recovery of externally seeded partial clones has no dedicated compatibility path.
- Retained evidence binds provenance, actual bytes, inventory, source modes and hashes independently of studies and acquisition caches. Missing material, corruption and operational failures remain distinct; partial captures are not published.
- Capture batches blob reads by byte budget without imposing an evidence/file-size quota. Empty, binary, oversized and unusual-name payloads preserve their identity. External parent aliases are allowed for imports; selected links and link traversal within the workspace remain rejected.
- Studies have editable drafts and immutable content-addressed revisions. A question-only draft is valid to create and view; sealing requires a nonempty answer and valid direct evidence. One bundle can support several studies, and one study can use several bundles.
- Default checks and sealing verify direct evidence and immediate predecessor records. Lineage is not transitive evidence dependency. Revise permits replacing unavailable evidence while protecting unsealed edits. Explicit check --history audits the full graph, reports history separately and exits nonzero for requested audit failures.
- List/show are unchecked navigation. Compare validates only the two selected report records, returning recordIntegrity: valid with evidence/history not-checked. Missing evidence or predecessors do not prevent comparison; corrupt selected records do. None of these operations establishes semantic approval.
- Research hands off exact study/report identity, recommendation label, provenance and reuse mode. Existing RSP Changes own adoption and experiments. Only derived adapted assets requiring ongoing upstream integration need three-way updates; independent reimplementation and model-only learning use local contracts, relevant research and behavioral verification.
- Active source configuration lives in research/sources.yaml and contains repository/ref/paths, without research tiers or strategies. Original registry/lock bytes live in research/legacy/upstreams/ with no old-path fallback. Historical reports and caches are not automatically migrated or rewritten.
- Guidance selects evidence and validation for the question and claimed benefit, without universal report-length, source-count or experiment-matrix gates. The two fixed research fixtures require completed drafts with exactly their supplied evidence set; this fixture boundary does not constrain ordinary research collection.

## Design

scripts/research.mjs composes acquisition and retention. Source acquisition, evidence, study operations and safe publication live in cohesive modules under scripts/research/. Evidence does not depend on acquisition. Retained bundles use research/evidence/<hash>/; studies use research/studies/<name>/draft.md and revisions/<hash>.md. Atomic publication protects existing content-addressed objects.

Git capture inventories blob sizes, then transfers batches with binary frame validation and no-lazy-fetch protection. A 32 MiB transfer target schedules reads; an oversized blob receives its own batch. Retention still buffers the selected payloads, so the optimization does not provide constant-memory capture.

The retired upstream tool and declarations are removed. The empty security-suppression manifest is removed; omitted exceptions retain the scanner's existing behavior. No replacement service, database, dependency or legacy adapter is introduced.

Current maintenance guidance belongs to research/README.md and distill-upstream, with candidate update policy owned by author-rsp-skills. ARCHIVE-RECOVERY maps historical paths and the model index remains historical navigation. Product Architecture/Distribution boundaries are unchanged; no product Spec or separate Decision Record update is needed.

## Tasks

- [x] Replaced the upstream tool with separate acquisition, retained-evidence, study and storage responsibilities.
- [x] Implemented traceable drafts/revisions, targeted integrity checks, independent historical auditing and record-only comparison.
- [x] Separated active configuration from byte-preserved historical records and removed the empty suppression manifest.
- [x] Updated research guidance, adoption handoff and conditional candidate-update policy; supplied two distinct study fixtures sharing retained evidence.
- [x] Added CLI/runner regressions and optimized capture with measured identity-preserving batch reads.
- [x] Reconciled final evidence, limits and maintenance navigation for delivery.

## Verify

### Required

- [x] Before capture optimization, the full build/code run passed 154/154 tests in 20 files (133.81 s), all 79 Skill offline cases passed, and lint, typecheck, documentation, package and security checks passed. Private evidence: tests/skills/reports/local-validation-2026-10-07-1791358249837/summary.json, including input hashes. Its 16-step research-probe.json covers synthetic study revision, comparison, missing evidence, exact-byte recovery and tampering. This full result is reused only for unchanged boundaries.
- [x] Final capture code and tests match tests/skills/reports/capture-optimization-1791362510432/verification.json: 24/24 research/oracle regressions passed across two files; build, lint and typecheck passed. Coverage includes source-ref concurrency, no implicit fetching, draft/history/compare behavior, exact fixture references, binary/empty/oversized blobs and missing objects during transfer without partial publication.
- [x] One warmup and three timed captures per version on the same local 1,000-file synthetic sample yielded medians 10,637.76 ms before and 1,662.22 ms after (6.40x), with identical evidence IDs. Private benchmark.json beside verification.json retains timings and before/after source hashes/copies. This is a local small-file capture measurement, not general throughput, memory or model-effectiveness evidence.
- [x] Both maintainer packages passed resource checks; their composition 97184daa523646e190e919b5b80041c29d0232ae3c778306fe29875148442e9c passed security scanning (15 files, zero findings/suppressions). Published packages passed security scanning (42 files, zero findings/suppressions); documentation checks covered 7 bilingual pairs and 29 files. Original registry/lock bytes and the fixture lock were verified unchanged at their new paths; all 28 active source definitions preserve repository/ref/path configuration.
- [x] Independent AI-HUB/gpt-6.1-sol high Code/Document reviews passed for the redesign corrections, reuse-mode policy and final capture optimization. Follow-up whole-scope review found no actionable defect. Independent final document-convergence review passed, confirming evidence applicability, ownership and explicit evaluation limits.

Resolved regressions included workspace-alias containment, ref provenance under concurrent sync, added/missing fixture references, comparison depending on old evidence, newline-containing filenames and objects disappearing between inventory and transfer. Their failures remain represented by regressions rather than rewritten historical verdicts.

Reports referenced above are private ignored evidence, not package assets. The baseline full suite predates the final capture optimization; the final targeted checks cover that delta. Offline readiness and synthetic probes do not establish model task success. Long-term reliability, real research usability and matched model cost/quality remain unmeasured.

### Optional

- [ ] Execute representative real research and model tasks with comparable inputs, repeated outcomes and retained judgments. This is subsequent evaluation work, not completed acceptance for this delivery.

## Blockers

None.
