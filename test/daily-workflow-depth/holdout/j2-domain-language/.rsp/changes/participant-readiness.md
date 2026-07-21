---
kind: "research"
---

# Change: participant-readiness

## Proposal

- Summary: Settle whether `ActiveParticipant` and `EnrolledParticipant` are separate domain concepts before changing readiness behavior.
- Why:
  - Durable enrollment and runtime presence currently lack authoritative terminology.
- Scope:
  - Return a bounded project capability result to the same WorkRef for owner confirmation.
- Non-goals:
  - implementing readiness behavior
  - adding another glossary owner

## Spec

### MODIFIED Requirements

- Readiness terminology must distinguish durable enrollment from runtime presence without inventing unsupported identities.

#### Scenario: Enrolled participant is absent

- GIVEN a participant has durable classroom enrollment
- WHEN an enrolled participant has not joined the live session
- THEN enrollment remains true while runtime readiness does not apply

## Design

Domain language is unresolved. The existing Spec and `CONTEXT.md` remain authoritative inputs.

## Tasks

- [ ] Obtain a bounded `domain-modeling` result for the same WorkRef.
- [ ] Ask the owner to settle the proposed language before mutation.

## Verify

- Return envelope names the authoritative inputs and mutation boundary.
- No domain document changes before owner confirmation.

## Blockers

- Owner decision on the relationship between `ActiveParticipant` and `EnrolledParticipant`.
