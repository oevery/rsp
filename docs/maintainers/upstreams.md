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

Load the repo-local `distill-upstream` skill when preparing or completing source distillation. It owns semantic interpretation and provenance; the script supplies mechanical preparation and diagnostics.

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

Use `accept` only after the owning distillation process has completed the matching source report. The command checks report metadata and records that candidate revision in the lock; command success does not supply semantic approval or mean any recommendation has entered RSP. Promote a selected recommendation through a separate normal `.rsp/changes` item that cites the source report, recommendation ID, and adoption mode. `sync`, `prepare`, and `diff` never modify the lock. Repeating `accept` for unchanged candidates leaves the lock byte-for-byte unchanged.

Before authorized cache cleanup, inspect active distillation, worktrees, other consumers and candidate refs. Keep occupied inputs and preserve selected unique pinned commits and evidence, verifying their recoverability before removing unused copies.

The registry and lock describe how to prepare another checkout; they are not an object backup. The lock records accepted revisions, while a pending candidate may exist only in cached Git refs. A new sync follows the then-current tracked ref and does not guarantee recovery of that original candidate. Cleanup or resynchronization cannot replace its provenance.

## Reuse completed source evidence

The [Matt Skills report's September 30 supplement](../../research/upstreams/matt-skills/c55ee46073ed923f86ce59a5eb3b6d895095d1b7.md#skill-authoring-supplement--2026-09-30), R8–R10, already reconciles the retained OpenAI Astra article, Build skills guidance and local/pinned Skill creators. It covers discriminating descriptions, task-conditioned resources, unnecessary always-loaded teaching, over-prescribed routes, clear completion and evidence-based pruning. The dated web and local snapshots are separate from Matt's pinned revision; their identities, reuse limits and disagreements remain in that report.

For an authorized documentation adoption, reuse this evidence and update the existing [Skill contract](../../.rsp/specs/skill.md#instruction-and-resource-design) and [writing-quality contract](../../.rsp/specs/writing-quality.md), rather than copying source prose or adding another snapshot, synthesis or model-specific Spec. Revisit sources only for a missing claim or a freshness question. Published Skills remain standalone; source reconciliation establishes neither current-model performance nor measured RSP quality or cost gains. Product changes and evaluations retain their own authority and evidence requirements.
