---
kind: group
---

# Change Group: delivery

## Goal
- Normalize delivery inputs and expose a summary after its prerequisite closes.

## Scope
- Own the four direct delivery children and their shared completion boundary.

## Shared Constraints
- Direct children keep independent lifecycle and evidence.
- `package-lock.json` is a shared affected path and must remain unchanged.

## Slices
- `delivery/header`: normalize header names.
- `delivery/retry`: normalize retry counts.
- `delivery/summary`: expose a delivery summary after header closes.
- `delivery/blocked`: decode a schema that is not yet available.

## Completion Conditions
- [ ] Every direct child reaches its own review and lifecycle boundary.

## Durable Outcomes
- Child Changes retain their focused behavior and evidence.

## Blockers
- none
