---
kind: "feature"
---

# Change: agent-evaluation-suite/agent-worker-routing-evaluation

## Proposal
- Outcome: Evaluate worker dispatch, lifecycle, ownership, recovery, and serialization across supported routing topologies.
- Why:
  - Worker claims alone do not prove host dispatch, lifecycle settlement, resource release, independent evidence, or safe shared-resource ordering.
- Scope:
  - Cover direct, solo, delegated, coordinated, sequential, and parallel-safe journeys.
  - Observe worker identity, invocation, topology, lifecycle events, resource ownership, cancellation/recovery, and final evidence handoff.
- Non-goals:
  - Do not introduce a persisted RSP worker registry, receipt protocol, scheduler, or runtime state store.
  - Do not change Manage, host, or worker semantics; do not evaluate providers or real projects.

## Spec
### ADDED
- Requirement: Worker scenarios MUST compare declared dispatch and lifecycle expectations with host observations, not worker self-report alone.
- Requirement: The worker matrix MUST cover direct, solo, delegated, and coordinated topologies plus interruption/recovery and shared-resource serialization; each applicable topology MUST have a declared host-observation case.
- Requirement: Shared writers, generated artifacts, and conflicting verification resources MUST be tested as sequential boundaries unless host isolation is explicitly evidenced.
- Requirement: Missing worker settlement, resource release, independent verification identity, or recovery evidence MUST remain visible as deterministic findings or unverified coverage.

### Acceptance
#### Scenario: Dispatch topology is host-verifiable
- GIVEN a direct, delegated, or coordinated assignment
- WHEN the worker campaign records host lifecycle events
- THEN dispatch count, topology, ownership, settlement, and final handoff agree with the declared contract or produce findings

#### Scenario: Shared resources serialize safely
- GIVEN two workers that touch a shared writer or verification resource
- WHEN the campaign runs
- THEN the report proves safe serialization or records missing isolation evidence without accepting worker claims as proof

#### Scenario: Recovery preserves ownership
- GIVEN a worker interruption or cancellation
- WHEN the campaign resumes
- THEN the managed goal remains owned by Manage/Core, prior evidence is retained, and no duplicate or fabricated settlement is reported

## Design
- Approach:
  - Reuse managed-controller fixtures and add host-observation assertions for dispatch, lifecycle, resources, and recovery.
  - Keep worker execution transient and reports sanitized; no worker protocol becomes product state.
- Boundaries:
  - Host owns worker identity, lifecycle, isolation, cancellation, and resource observations. This Change owns evaluation cases and assertions.
- Affected areas:
  - verification/evaluations/worker-routing/; managed-controller fixtures; and verification/tests/evaluation/worker-routing-evaluation.test.ts.
- Constraints:
  - Preserve the existing host-owned worker boundary and unrelated capacity-recovery changes.

## Tasks
- [x] Define topology and lifecycle scenario manifests.
- [x] Add deterministic host-observation assertions for dispatch, settlement, ownership, resources, and recovery.
- [x] Add serialization and independent-verification cases.
- [x] Add interrupted-run and exact-resume reports without persisted runtime state.

## Verify
### Required
- Automated:
  - [x] mise exec -- pnpm exec vitest run verification/tests/evaluation/worker-routing-evaluation.test.ts verification/tests/evaluation/managed-controller-contract.test.ts verification/tests/evaluation/managed-controller-beta-contract.test.ts --no-file-parallelism — worker matrix and compatibility tests passed; proves topology, lifecycle, recovery, and compatibility.
  - [x] mise exec -- pnpm run typecheck — passed; worker evidence and report types remain consistent.
  - [x] git diff --check — passed; changed artifacts contain no whitespace errors.
### Optional
- Manual or environment:
  - [x] Review a coordinated trace with a stopped worker — integrated local report distinguishes recovered settlement from ordinary settlement.
- Coverage:
  - Real provider and cross-host behavior remain unverified.

## Blockers
- none
