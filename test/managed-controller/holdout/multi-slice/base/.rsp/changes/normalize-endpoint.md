---
kind: implementation
---

# Change: normalize-endpoint

## Proposal
- Normalize endpoint parsing and formatting.

## Spec
- Hosts are lowercase and ports are integers from 1 through 65535.

## Design
- Keep the public functions in `src/endpoint.mjs`.

## Tasks
- [ ] Parse and validate normalized endpoints.
- [ ] Format endpoints with a normalized host.

## Verify
- [ ] `npm test`

## Blockers
- none
