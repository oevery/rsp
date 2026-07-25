# Evidence and surfaces

Load this reference before drafting the release ledger, assigning statement lifetime, or deciding exclusions.

## Evidence ledger

Keep a transient table or equivalent notes with: evidence identifiers/links, net user or operator outcome, audience, breaking/deprecation/security/compatibility/migration impact, changelog and release-note dispositions, reference choice, and exclusion or uncertainty owner.

The ledger is an analysis device, not a new project state store. Persist it only in an existing release-fragment system or explicitly authorized destination. It describes the released net state rather than commit chronology.

## Surface lifetime

- **Shipped surfaces:** package metadata and release communication captured by the tag or package, including README, changelog, repository notes, manifests, and migration guides. Internal workflow records keep their own artifact lifetime. Shipped statements must be publication-invariant: exclude “not yet published,” “available after publication,” pending authentication, unverified registry state, and comparisons ending at `HEAD`.
- **Mutable public surfaces:** hosted release descriptions, safely mutable registry metadata, and other external records. Keep stable narrative aligned with shipped surfaces; add live verification only after observing it.
- **Transient release state:** credentials, authentication, command progress, pending publication, and unverified availability. Keep it in an authorized tracker, temporary ledger, or response handoff—never shipped prose.

When immutable published content is wrong, preserve it, explain the discrepancy on an authorized mutable surface, and name a corrective version or owner.

## References

Follow repository policy first. Otherwise add a version-level tag or comparison link, prefer PRs for implementation context, issues or tracked work for rationale and migration, and commits when no better semantic anchor exists or exact provenance is required. Links are optional per bullet and must be stable and public; do not expose private tracker identifiers.
