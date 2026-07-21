---
kind: fix
---

# Change: long-running-delivery

## Proposal
- Normalize receiver device ids without numeric coercion.

## Spec
### MODIFIED
- Accept only non-empty ASCII decimal strings and preserve leading zeroes.

## Design
- Reject stale handoff claims and verify current code before mutation.

## Tasks
- [ ] Add focused alternative-syntax tests.
- [ ] Implement strict string validation.

## Verify
- [ ] `mise exec -- pnpm test -- long-running-delivery`
- [ ] Human receiver acceptance (unavailable; user owned).

## Blockers
- none
