# Publication lifecycle

Load this reference before finalizing an exact publication candidate or reconciling an observed publication.

## Finalization gate

Require all of the following at the exact candidate:

- target version agrees across manifests, changelog heading/date, release notes, migration guidance, and exact-version assertions;
- the target changelog entry is not labeled `Unreleased`;
- stable comparisons end at the target tag or immutable ref, not `HEAD`;
- shipped surfaces contain no pending-publication, authentication, or unverified-live-state prose;
- package inventory and release checks are fresh, with omissions named;
- required implementation lifecycle closeout is in the candidate revision and its worktree relationship is explicit.

Any missing evidence yields `not ready` with the failed gate and owner. A `ready` result identifies the version, immutable candidate ref, required external actions, checks, and omissions without executing them.

## Reconciliation

After publication, observe the tag target, hosted release, registry version/dist-tags, and exact-version consumer command where applicable. Compare them with the finalization handoff and shipped inventory. Update authorized mutable surfaces only from observed state. Mark unknown facts unverified and record immutable drift with a corrective version or owner; never move tags or rewrite packages.

## Credential boundary

Keep authentication values and URLs out of retained output. A human performs any credential-emitting interactive step in a trusted terminal; the handoff records only credential-free required/completed status.
