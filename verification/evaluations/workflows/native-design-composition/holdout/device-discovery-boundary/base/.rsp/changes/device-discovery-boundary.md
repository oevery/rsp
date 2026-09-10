---
kind: feature
---

# Change: device-discovery-boundary

## Proposal
- Keep physical discovery in desktop and add the smallest runtime-neutral event projection.

## Spec
### ADDED
- `projectDeviceEvent` trims a non-empty device id and returns an immutable `{ id, connected }` projection.
- Empty ids are rejected.

## Design
- Resolve the owner, dependency direction, and module seam before implementation.

## Tasks
- [ ] Complete the module design in this Change.
- [ ] Implement the projection and focused test.
- [ ] Perform a read-only fixed-scope review.
- [ ] Route implemented stable facts through Core durable review.

## Verify
- [ ] `mise exec -- pnpm test -- device-discovery`
- [ ] Receiver hardware acceptance (unavailable; human owned).

## Blockers
- none
