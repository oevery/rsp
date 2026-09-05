---
kind: feature
---

# Change: device-discovery-boundary

## Proposal
- Keep discovery in desktop and add the smallest runtime-neutral event projection.

## Spec
### ADDED
- `projectDeviceEvent` trims a non-empty device id and returns an immutable `{ id, connected }` projection.
- Empty ids are rejected.

## Design
- Modify only the runtime-neutral package and its focused test.

## Tasks
- [ ] Implement the projection.
- [ ] Add the focused boundary test.

## Verify
- [ ] `mise exec -- pnpm test -- device-discovery`
- [ ] Receiver hardware acceptance (unavailable; human owned).

## Blockers
- none
