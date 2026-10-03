# Managed-source operations

Use when registered Git research needs registry/ref semantics, command options
or cache recovery. These are maintainer-tool details, not published RSP behavior
or permission to synchronize, accept, clean up or adopt a source.

## Registry and evidence

- `upstreams.yaml` selects repositories, tracked refs, review tiers, treatment
  strategies and relevant paths. `core` is the default survey set;
  `reference` is optional and `all` is for an explicitly broad scope.
- `upstreams.lock` is the timestamp-free mapping of explicitly accepted revisions.
  An empty `revisions: {}` means sources still need initial distillation.
- `.cache/upstreams/` holds checkouts. Synchronization stores each fetched revision
  in its dedicated candidate Git ref, so moving checkout HEAD does not change
  what `accept` records. Cached repositories are never executed.
- `.cache/upstream-distillation/` holds regenerable preparation evidence.
  `research/upstreams/<source>/<revision>.md` owns the semantic source report;
  cross-source recommendations belong in `research/models/`.

## Command surface

Command signatures below use brackets for optional arguments and pipes for
alternatives, not literal shell syntax. Run from the RSP source root after
substituting only the authorized source boundary:

```text
node scripts/upstreams.mjs sync [source|core|reference|all]
node scripts/upstreams.mjs status [source|core|reference|all]
node scripts/upstreams.mjs diff [source|core|reference|all] [--patch]
node scripts/upstreams.mjs prepare <source> [--initial]
node scripts/upstreams.mjs accept [source|core|reference|all]
```

All commands accept `--json`; `--patch` is only for `diff`. The tier selector
defaults to `core`. `prepare` needs one exact source, not a tier; use `--initial`
only for the status-recommended initial/baseline distillation, not a pending update.

`status` derives research state, next action, path match counts and unmatched
required paths. These are diagnostics, not authorization or another lifecycle.
Resolve `fix-paths` before preparation.

Authorized `prepare` creates mechanical evidence and a draft without overwriting
an existing report. The patch is streamed to disk and `diff_sha256` identifies its
exact bytes. Complete the matching report using this Skill's selected strategy.
Report metadata must match the candidate and be `complete` before acceptance;
`adapt` and `tooling` also require License and Reuse.

`accept` requires separate user authority. It validates the matching report and
records the dedicated candidate revision; it does not adopt recommendations into
RSP. Repeating acceptance of unchanged candidates preserves the lock bytes.
`sync`, `prepare` and `diff` never advance the lock.

## Recovery and reuse

Before authorized cache retirement, inspect active research, worktrees and other
consumers. Preserve selected unique commits and evidence, verify recoverability
and retain occupied inputs. The registry/lock can prepare another checkout but
are not an object backup: a pending candidate may exist only in cached refs, and
a later sync need not recover the same revision. Cleanup cannot replace provenance.

Reuse completed source reports for supported claims under their recorded identity,
license and limits. Collect again only for a missing claim or freshness question.
Source completion and local checks establish neither current-model acceptance
nor measured quality or cost improvement; candidate adoption and evaluation keep
their separate owners and authority.
