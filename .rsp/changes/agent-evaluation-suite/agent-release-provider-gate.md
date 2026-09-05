---
kind: "feature"
---

# Change: agent-evaluation-suite/agent-release-provider-gate

## Proposal
- Outcome: Define and locally validate the fake-provider baseline/candidate release-gate contract; real provider acceptance remains a separately authorized follow-up Change.
- Why:
  - Local fake tests cannot establish provider compatibility, token usage, capacity behavior, or release-gate confidence.
- Scope:
  - Define provider arm configuration, baseline/candidate comparison, token and cost accounting, capacity/unavailable handling, leakage/error inspection, and release-gate interpretation.
  - Consume sibling reports and foundation evidence without changing provider configuration or release state. Do not claim real provider compatibility from this Change.
- Non-goals:
  - This planning Change does not authorize real provider execution, credential access, publication, tagging, approval, or release.
  - Do not redefine foundation scoring, evidence identity, sanitization, campaign dispositions, or child ownership.

## Spec
### ADDED
- Requirement: Provider runs MUST record model/provider identity, configuration provenance without secrets, token usage when supplied, latency, retries, errors, capacity responses, and sanitized evidence references.
- Requirement: Usage accounting MUST use a canonical schema with input_tokens, output_tokens, total_tokens, source, status, price_snapshot, estimated_cost, currency, and confidence. Missing provider usage MUST be marked unavailable or unverified; it MUST NOT be inferred from self-report or text length.
- Requirement: Baseline and candidate arms MUST use the same declared case/arm/repetition plan and report comparable metrics without treating provider capacity as product success.
- Requirement: The gate MUST inspect the entire run for errors, omissions, spec/Skill violations, leakage, incorrect artifacts, and deterministic hard failures; a final result alone is insufficient.
- Requirement: Real provider execution MUST require separate explicit execution authority and a fresh provider-availability check; a capacity response MUST produce infrastructure unavailable and preserve resume state.

### Acceptance
#### Scenario: Provider campaign compares equivalent arms
- GIVEN fake provider responses, baseline/candidate configuration, and an immutable campaign plan
- WHEN both arms run with the same cases and repetitions
- THEN the report compares usage, errors, latency, dimensions, evidence completeness, and AI analysis without hiding arm differences

#### Scenario: Provider capacity fails closed
- GIVEN the fake provider reports capacity or unavailability
- WHEN the campaign attempts a run
- THEN the run is recorded as infrastructure unavailable, no product pass/failure is inferred, and the exact resume point remains available

#### Scenario: Release gate is evidence-driven
- GIVEN provider results with a plausible final answer but a process error, forbidden action, missing evidence, leakage, or spec violation
- WHEN the gate is evaluated
- THEN deterministic findings and missing evidence block the gate, while AI analysis explains rather than overrides them

## Design
- Approach:
  - Add a fake-provider adapter around the foundation campaign runner and aggregate Skill, routing, worker, and project reports into one release-gate projection.
  - Keep provider credentials and raw responses outside tracked artifacts; persist only sanitized metrics, findings, provenance, and resume metadata.
- Boundaries:
  - Host/provider owns transport, capacity, credentials, and raw session data. This Change owns comparison and gate interpretation.
  - Release, publication, approval, and user acceptance remain separate authority stages.
- Affected areas:
  - verification/evaluations/providers/; provider adapter/report scripts; and verification/tests/evaluation/release-provider-gate.test.ts.
- Constraints:
  - Real provider execution remains separately authorized; local verification MUST use fake provider responses.

## Tasks
- [x] Define provider adapter, arm, usage, retry, capacity, and provenance schemas without secrets.
- [x] Implement baseline/candidate comparison and full-trajectory error/leakage/spec analysis.
- [x] Implement unavailable handling, exact resume, and deterministic release-gate blocking.
- [x] Add fake-provider contract tests and record the handoff boundary for a separately authorized real-provider acceptance Change.

## Verify
### Required
- Automated:
  - [x] mise exec -- pnpm exec vitest run verification/tests/evaluation/release-provider-gate.test.ts --no-file-parallelism — 3 tests passed; proves canonical usage, secret-free provenance, fake baseline/candidate comparison, capacity/incomplete handling, and gate semantics.
  - [x] mise exec -- pnpm run typecheck — passed; provider report and gate types remain consistent.
  - [x] git diff --check — passed; changed artifacts contain no whitespace errors.
### Optional
- Manual or environment:
  - [x] Review the follow-up handoff for a separately authorized provider campaign — integrated report records `real_provider: false` and the separate authorization boundary.
- Coverage:
  - Real provider compatibility, transport, and provider-specific behavior remain outside this Change and require a separate WorkRef with execution authority.

## Blockers
- none
