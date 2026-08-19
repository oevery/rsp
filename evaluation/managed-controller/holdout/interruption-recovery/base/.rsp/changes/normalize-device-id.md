---
kind: implementation
---

# Change: normalize-device-id

## Proposal
- Normalize receiver identifiers without accepting alternate numeric syntax.

## Spec
- Preserve complete ASCII decimal strings exactly; reject every other input.

## Design
- Keep validation at the public `normalizeDeviceId` seam.

## Tasks
- [ ] Implement and verify strict decimal validation.

## Verify
- [ ] `npm test`
- [ ] Manual receiver-device acceptance.

## Blockers
- Manual receiver-device acceptance requires physical hardware.
