---
kind: fix
---

# Change: cache-isolation

## Proposal
- Prevent cached values from leaking between classes with the same cache type.

## Spec
### MODIFIED
- Cache identity is the pair `{ classId, type }`.

## Design
- Replace the type-only key with a deterministic composite key.

## Tasks
- [ ] Add a focused regression test.
- [ ] Implement the minimum key correction.

## Verify
- [ ] `mise exec -- pnpm test -- cache-isolation`
- [ ] Authenticated multi-class acceptance (unavailable; human owned).

## Blockers
- none
