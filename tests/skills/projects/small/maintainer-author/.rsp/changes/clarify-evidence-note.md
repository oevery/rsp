---
kind: docs
---
# Change: clarify-evidence-note

## Proposal

Correct the RSP-owned evidence-note candidate's classification of missing checks and partial success. Scope is its SKILL.md and this Change's implementation evidence; no other candidate or tooling changes.

## Spec

### MODIFIED

- Requirement: Apply [the candidate contract](../specs/candidate-contract.md) while retaining report-only authority.

### Acceptance

#### Scenario: A required check has not run

- GIVEN one passing recorded check and one missing Required Verify record
- WHEN the candidate summarizes the evidence
- THEN it distinguishes the missing check from failure and does not claim complete acceptance.

## Design

Revise the existing owner rather than adding another Skill or evaluator. The supplied package checker can verify metadata/resources, not semantic behavior. Keep model execution and independent review explicitly unverified.

## Tasks

- [ ] Revise the candidate to follow the selected contract while preserving its authority.
- [ ] Run available local checks and record decisive results and gaps here.

## Verify

### Required

- [ ] Check the candidate package and focused RSP document structure using the supplied real tools.

### Optional

- Live task execution and independent review are not authorized by this editing task.

## Blockers

- none
