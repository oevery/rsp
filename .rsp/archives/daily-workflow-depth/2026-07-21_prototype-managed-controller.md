---
kind: "research"
---

# Change: daily-workflow-depth/prototype-managed-controller

## Proposal
- Summary: Prototype an optional bounded managed controller
- Why:
  - The stable Skills compose through RSP artifacts, but no generic owner continues an explicitly authorized multi-slice task across bounded delegation, interruption, and recovery.
- Scope:
  - Independently implement a candidate `rsp-manage` Skill under research, then compare current assisted continuation with the candidate on one multi-slice and one interruption/recovery journey.
  - Measure success, user corrections, elapsed time, tokens, tool calls, unauthorized actions, stale-evidence handling, and ordinary-path instruction cost.
- Non-goals:
  - Promotion into the package, a new durable state model, required subagents, hidden unbounded retries, or implicit commit/push/tag/publish authority.

## Spec
<!-- Describe what finding or decision must be captured. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: an optional managed controller candidate has a bounded executable contract
  - The candidate consumes one focused Change, selects direct/assisted/managed depth from task size and explicit user intent, and delegates only with named input, output, mutation, verification, and stop boundaries.
  - It continues through recoverable steps until evidence, environment, human decision, or external-action authority requires a stop; durable facts return to existing RSP owners.
- Requirement: promotion evidence is paired and honest
  - The report compares baseline and candidate on multi-slice and interruption/recovery journeys and records total cost, corrections, unauthorized actions, and stale-evidence handling.
  - The result explicitly recommends promote, revise, or reject without changing the stable suite.

### Acceptance
#### Scenario: authorized managed work reaches a real boundary
- GIVEN one focused multi-slice Change and explicit authority to continue within its mutation scope
- WHEN the candidate coordinates bounded capabilities and recovers from an interruption
- THEN it resumes from fresh repository evidence and continues until completion or a real stop boundary
- AND it never invents durable state or external-action authority

## Design
- Approach:
  - Create the candidate outside package discovery, keep its top-level procedure compact, and disclose only managed-mode mechanics.
  - Use sanitized fixtures and fresh isolated agent runs; preserve unsuccessful or interrupted attempts in the report.
- Affected areas:
  - `research/candidates/skills/rsp-manage/`
  - controller-specific fixtures, harness, contract tests, and evaluation report
- Constraints:
  - Do not edit `skills/`, package surfaces, shared Specs/models, README, or the terminal evaluation harness.
  - Keep transient handoff artifact-scoped and disposable; reread durable files after interruption rather than trusting stale summaries.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Implement the isolated candidate and deterministic contract fixtures.
- [x] Run paired multi-slice and interruption/recovery evaluations and record all attempts and costs.
- [x] Record the `revise` recommendation and leave independent archive to the Group coordinator.

## Verify
- Automated:
  - [x] Run the controller-specific contract tests and paired evaluation harness.
  - [x] `node dist/cli.mjs check --focused`
  - [x] `git diff --check`
- Manual:
  - [x] Inspect delegation envelopes, recovery behavior, real stops, unauthorized actions, and cost comparison.
- Durable updates:
  - [x] Keep the candidate and report under research; terminal validation alone may promote stable behavior.

## Blockers
- none
