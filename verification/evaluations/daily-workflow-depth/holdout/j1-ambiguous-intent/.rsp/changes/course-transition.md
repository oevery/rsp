---
kind: "research"
---

# Change: course-transition

## Proposal

- Summary: Make course transitions predictable without changing the public course-session identity.
- Why:
  - Competing transition authorities leave migration ordering and stale-work acceptance unresolved.
- Scope:
  - Settle `transition-owner`, migration ordering, and stale activity acceptance.
- Non-goals:
  - redesigning course persistence
  - changing the public course-session identity

## Spec

### MODIFIED Requirements

- A transition replaces the current activity without replacing the course session.
- Stale activity work must not publish after the replacement becomes current.

#### Scenario: Replace a running activity

- GIVEN one `CourseSession` has a current `ActivitySession`
- WHEN a new activity replaces the current activity
- THEN stale work from the previous activity cannot publish into the new activity

## Design

The transition owner is intentionally unresolved. Current callers include both the course coordinator and activity adapters. Migration ordering depends on whether the coordinator exclusively owns transitions or adapters retain transition authority.

## Tasks

- [ ] Settle `transition-owner`.
- [ ] Define the migration sequence after ownership is settled.

## Verify

- Owner-confirmed transition authority.
- Acceptance covers stale activity work after replacement.

## Blockers

- Owner decision: `transition-owner`.
