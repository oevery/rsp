---
kind: "fix"
---

# Change: strengthen-provider-comparison-evidence

## Proposal
- Outcome: Make provider comparison preserve paired efficiency evidence, distinguish transient worker-runtime contamination from model correctness, and retain validated agent-reported execution observations without conflating them with host evidence.
- Why:
  - The current report compares independent arm medians even though execution is paired, which hid one total-token regression behind an aggregate improvement.
  - A transient worker dispatch failure was classified as `model-failed` with no contamination and invalidated an otherwise useful campaign; an isolated retry then passed.
  - New producer metadata retains receipt observations under `agent_reported`, but the beta/comparison summary still reads the intentionally empty legacy receipt fields, leaving dispatch and correction metrics unavailable.
- Scope:
  - Add pair-level efficiency deltas and ranges while retaining existing arm summaries.
  - Admit only structured worker-runtime unavailability evidence as infrastructure contamination and replacement eligibility.
  - Validate and project `agent_reported` receipt observations as a separate evidence source through beta and release summaries.
  - Update focused tests, declarations, the sanitized report, and the distribution contract.
- Non-goals:
  - No provider retry outside the existing bounded contaminated-pair replacement policy.
  - No text-only inference from final responses, arbitrary tool errors, token/latency outliers, or model behavior.
  - No merging of agent-reported observations into host-observed lifecycle facts.
  - No provider execution, release threshold, publication, or release approval.

## Spec
### MODIFIED
- Requirement: Provider efficiency reports shall preserve the paired execution design.
  - Reports retain baseline and candidate arm summaries and additionally calculate each eligible pair's candidate-versus-baseline delta for every complete metric.
  - Pair-delta summaries expose median, minimum, maximum, and range without hiding pair-level direction changes.
- Requirement: Infrastructure classification shall cover explicit host worker-runtime unavailability without weakening correctness gates.
  - Only structured failed worker dispatch, delivery, wait, or settlement evidence with a declared unavailable/runtime category qualifies.
  - Model refusal, malformed receipt, boundary failure, task failure, timeout without admitted infrastructure evidence, and ordinary tool errors remain non-replaceable failures.
- Requirement: Validated agent-reported receipt observations shall remain available as agent-reported evidence.
  - The beta and release summaries consume the new `agent_reported` envelope after identity and receipt-hash validation.
  - Agent-reported trigger, first-fix, correction, and dispatch values remain labeled separately from host-observed lifecycle counts.
  - Legacy retained metadata remains readable.

### Acceptance
#### Scenario: paired deltas expose mixed directions
- GIVEN three eligible pairs where two candidates improve and one regresses
- WHEN the comparison report summarizes efficiency
- THEN it retains arm summaries and reports the three pair deltas plus their median and range.

#### Scenario: worker runtime is transiently unavailable
- GIVEN a structured worker tool result proves that required dispatch or settlement was unavailable before task completion
- WHEN the release comparator classifies the arm
- THEN the pair is `infra-contaminated`, excluded from primary statistics, and replaced within the existing bounded attempt limit.

#### Scenario: correctness failure is not retried
- GIVEN a worker was available but the model omitted implementation, violated a boundary, or produced an invalid receipt
- WHEN the arm fails
- THEN it remains a non-replaceable model or harness failure and the campaign stops.

#### Scenario: new producer receipt observations remain visible
- GIVEN metadata contains a validated `agent_reported.evaluation_receipt` and observations while legacy receipt fields are null
- WHEN beta and release summaries are generated
- THEN agent-reported trigger, first-fix, correction, and dispatch values are preserved without being represented as host-observed facts.

## Design
- Approach:
  - Extend event projection with a narrow structured worker-runtime category based on failed worker tool events and explicit unavailable results.
  - Normalize new and legacy receipt envelopes through one validator before projecting agent-reported observations.
  - Group eligible runs by pair ID, compute per-pair metric deltas, and render a separate paired-delta section.
- Boundaries:
  - The managed evaluation producer owns event and receipt normalization; the beta summary owns validated evidence projection; the release comparator owns pair classification and aggregate rendering.
  - Host-observed and agent-reported fields remain separate in JSON and Markdown.
- Affected areas:
  - `scripts/managed-controller-eval.mjs` and declarations/tests.
  - `scripts/managed-controller-beta.mjs` and declarations/tests.
  - `scripts/release-provider-comparison.mjs` and declarations/tests.
  - `.rsp/specs/distribution.md`.
- Constraints:
  - Preserve existing report identity hashes, evidence reuse gates, serial AB/BA scheduling, sanitized retention, and fail-closed correctness.
  - Do not inspect raw prose to manufacture infrastructure or lifecycle evidence.

## Tasks
- [x] Add deterministic worker-runtime event classification and bounded replacement coverage.
- [x] Consume and validate new `agent_reported` receipt observations while preserving legacy metadata compatibility and evidence separation.
- [x] Add pair-level delta summaries and Markdown/JSON rendering without removing arm summaries.
- [x] Update declarations, distribution facts, and focused regression tests.
- [x] Run focused verification, full deterministic tests, and inspect the exact diff.

## Verify
### Required
- Automated:
  - [x] Focused provider comparison, managed-controller observability, and evidence-reuse tests — `mise exec -- pnpm exec vitest run test/evaluation/managed-controller-contract.test.ts test/evaluation/managed-controller-beta-contract.test.ts test/release/release-provider-comparison.test.ts test/release/release-provider-evidence-check.test.ts` passed 4 files / 117 tests; proves: structured worker-runtime replacement, invalid-argument and cancellation exclusion, correctness fail-closed behavior, agent-reported receipt preservation and Markdown labeling, pair-delta calculation, rendering, and compatibility.
  - [x] `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, and `git diff --check` passed — proves: declarations, repository style, and patch integrity.
  - [x] `mise exec -- pnpm run test` passed 87 files / 880 tests, including the repository build — proves: complete deterministic regression coverage remains green without invoking a provider.
### Optional
- Manual or environment:
  - [ ] Run a separately authorized provider comparison and inspect replacement and pair-delta evidence.
- Coverage:
  - Deterministic verification covers admitted event shapes and summary behavior. Reprojection of the retained failed Terra event classified it as `worker-runtime-unavailable`, while invalid worker arguments and cancellation remained non-contaminating; reprojection of retained current metadata restored agent-reported trigger, first-fix, correction, and dispatch evidence while leaving host dispatch unavailable. Re-summarizing the retained passed report exposed total-token pair deltas of `-27.84%`, `-43.78%`, and `+16.82%`, and Markdown now labels agent-reported observations separately. A fresh fixed-scope code/document re-review was clean. No new provider execution was performed; live replacement behavior remains environment coverage.

## Blockers
- none
