# Upstream research sources

This document is for maintainers working from an RSP source checkout. The upstream registry is research tooling, not part of the published `rsp` CLI or npm package.

## Model

- `upstreams.yaml` is the compact source registry: repository, tracked ref, review tier, treatment strategy, and relevant paths.
- `upstreams.lock` is a minimal, timestamp-free mapping of explicitly accepted candidates. An empty `revisions: {}` means every synchronized source still requires initial distillation.
- `.cache/upstreams/` contains disposable checkouts. Synchronization stores the fetched revision in a dedicated Git candidate ref, so moving a checkout's `HEAD` cannot change what `accept` records.
- `.cache/upstream-distillation/` contains regenerable diffs, file inventories, hashes, and other mechanical preparation evidence.
- `research/upstreams/<source>/<revision>.md` contains tracked single-source semantic distillation.
- `research/models/<topic>.md` contains optional cross-source synthesis that cites completed source reports.
- `core` sources are the default survey set. `reference` sources are optional comparison material. Use `all` only for a broad review.
- Cached repositories are never executed. Research is excluded from the npm package and normal RSP runtime context.

Strategies are operational routing values:

- `conform`: check compatibility with a standard.
- `model`: extract domain models, artifact relationships, constraints, and design ideas from a peer system.
- `adapt`: assess a small skill or asset for derived reuse with local modifications and behavioral evaluation.
- `tooling`: study deterministic generation, synchronization, installation, packaging, or distribution mechanisms.

## Workflow

```bash
node scripts/upstreams.mjs sync [source|core|reference|all]
node scripts/upstreams.mjs status [source|core|reference|all]
node scripts/upstreams.mjs diff [source|core|reference|all]
node scripts/upstreams.mjs diff [source|core|reference|all] --patch
node scripts/upstreams.mjs prepare <source> [--initial]
node scripts/upstreams.mjs accept [source|core|reference|all]
```

The selector defaults to `core`. All commands accept `--json`; `--patch` is valid only for `diff`. `prepare` requires one exact source. Use `--initial` only to distill a synchronized baseline with no pending update.

`status` derives `researchState` (`missing`, `draft`, `complete`, or `stale`), `nextAction`, per-glob match counts, and unmatched required paths from existing files. These are diagnostics, not another persisted lifecycle. Fix any `fix-paths` result before preparation.

`prepare` writes mechanical evidence to ignored cache and creates a draft source report without overwriting an existing report. Patch output is streamed to disk, and `diff_sha256` describes the exact bytes in `diff.patch`. Load the repo-local `distill-upstream` skill to complete the report. Initial and later candidates cannot be accepted until report metadata matches the candidate and status is `complete`; `adapt` and `tooling` reports also require `License and Reuse`.

`accept` means the candidate revision has completed source distillation; it does not mean any recommendation has entered RSP. Promote a selected recommendation through a separate normal `.rsp/changes` item that cites the source report, recommendation ID, and adoption mode. `sync`, `prepare`, and `diff` never modify the lock. Repeating `accept` for unchanged candidates leaves the lock byte-for-byte unchanged.

To discard cached checkouts, remove `.cache/upstreams/`; the registry and lock are sufficient to rebuild them.
