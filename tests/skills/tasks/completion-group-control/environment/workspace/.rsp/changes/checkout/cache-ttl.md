---
kind: feature
---
# Change: checkout/cache-ttl

## Proposal
Add expiring entries to the process-local string cache.

## Spec
Implement the settled behavior in .rsp/specs/cache.md. Preserve string keys/values and independent cache instances. Completion concerns this implementation scope; lifecycle and delivery are separate actions.

## Design
src/cache.mjs owns the entry map and injected clock. tools/check.mjs is the declared smoke check for reads, replacement and missing keys.

## Tasks
- [x] Implement cache creation, writes and reads with TTL support.
- [x] Run the declared smoke check.

## Verify
### Required
- [x] node tools/check.mjs — passed for the current source snapshot.

## Blockers
- none
