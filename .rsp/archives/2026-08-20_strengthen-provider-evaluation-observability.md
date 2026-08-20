---
kind: "refactor"
---

# Change: strengthen-provider-evaluation-observability

## Proposal
- Outcome: Make release provider comparison a strictly serial, contamination-aware paired evaluation that reports correctness, efficiency, and infrastructure quality separately without wasting provider calls on unchanged evidence.
- Why:
  - Current paired runs are serial but always execute baseline before candidate, and the report cannot distinguish model behavior from network, proxy, or runner contamination.
  - Noisy or retried calls can inflate tokens, latency, and turn count, making the current efficiency median easy to misread.
- Scope:
  - Strengthen the release provider comparison plan, runner, sanitized report, evidence validation, tests, and distribution contract.
  - Preserve reusable evidence when Skill composition and comparison identities are unchanged.
- Non-goals:
  - Add provider retries to deterministic acceptance or candidate check.
  - Infer hidden upstream retries that the host does not expose, retain raw provider errors, or establish a token/latency release threshold.
  - Run a live provider comparison as part of this implementation.

## Spec
### MODIFIED
- Requirement: release provider comparison isolates execution and infrastructure noise.
  - Provider arms execute one at a time with effective concurrency fixed at one.
  - Pair order alternates baseline/candidate then candidate/baseline across requested pairs; ordering changes sequencing only and never permits overlap.
  - Every attempt receives a stable pair ID, attempt ID, arm position, and bounded infrastructure classification: `eligible`, `infra-contaminated`, `model-failed`, `harness-failed`, or `incomplete`.
  - Infrastructure contamination is admitted only from predeclared transport or runner evidence, never from high token use, latency, or an efficiency outlier.
  - If either arm is infrastructure-contaminated, the entire pair is excluded from primary efficiency statistics. The runner may replace contaminated pairs up to a bounded attempt limit while retaining sanitized attempt records.
  - At least three complete eligible pairs are required for conclusive efficiency observations. Correctness failures remain failures and are never replaced or hidden as infrastructure noise.
  - Reports separate correctness, efficiency, and infrastructure quality, including attempted, eligible, contaminated, and replacement pair counts plus cache-aware token measurements when available. Missing host telemetry remains explicit.
  - Candidate validation reuses an exact passed report without invoking a provider while the compared Skill compositions and contract, fixture, and harness identities remain unchanged.

### Acceptance
#### Scenario: clean pairs run serially with balanced ordering
- GIVEN a three-pair comparison
- WHEN the provider runner executes all arms successfully
- THEN no calls overlap, pair order is AB/BA/AB, and all three pairs contribute to correctness and efficiency.

#### Scenario: infrastructure contamination does not distort efficiency
- GIVEN one arm exposes predeclared network, proxy, throttling, gateway, or connection evidence
- WHEN the comparison summarizes the attempt
- THEN the entire pair is classified as infrastructure-contaminated, omitted from primary efficiency statistics, retained in infrastructure quality, and replaced only within the bounded attempt limit.

#### Scenario: expensive model behavior is not silently discarded
- GIVEN a completed arm has high tokens or latency without transport contamination evidence
- WHEN the comparison summarizes the attempt
- THEN the pair remains eligible and its measurements remain in the primary statistics.

## Design
- Approach:
  - Add a deterministic serial schedule with alternating arm order and a bounded maximum pair-attempt count.
  - Normalize host and runner observations into a small sanitized infrastructure envelope before release-level classification.
  - Summarize primary measurements from eligible pairs only and render separate report sections for correctness, efficiency, and infrastructure quality.
- Boundaries:
  - The evaluation runner owns observable host events; the release comparator owns pair eligibility and replacement policy.
  - Raw events, error messages, provider identity, session data, prompts, and workspace paths remain outside retained release reports.
- Affected areas:
  - `scripts/release-provider-comparison.mjs` and its declaration file.
  - Managed evaluation observability projection and focused release/evaluation tests.
  - `.rsp/specs/distribution.md` and provider evidence compatibility checks when report schema changes.
- Constraints:
  - All provider execution is serial; implementation verification is offline and deterministic.
  - Do not add automatic provider calls to `release:acceptance` or `release:candidate-check`.
  - Do not retry correctness or model failures, and do not classify by efficiency measurements.

## Tasks
- [x] Add deterministic serial AB/BA scheduling, pair identities, bounded contamination replacement, and fail-closed classification.
- [x] Extend sanitized observability and reports with infrastructure quality and cache-aware measurements without retaining sensitive diagnostics.
- [x] Update evidence compatibility, distribution facts, declaration types, and focused regression coverage.
- [x] Run required deterministic verification without invoking a provider.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/release/release-provider-comparison.test.ts test/release/release-provider-evidence-check.test.ts test/evaluation/skill-evaluation-observability.test.ts test/evaluation/managed-controller-contract.test.ts` — passed 4 files / 105 tests on 2026-08-20; proves serial balanced scheduling, contamination classification/replacement, conservative transport projection, sanitized reporting, and evidence reuse remain deterministic.
  - [x] `mise exec -- pnpm run test` — passed 87 files / 876 tests on 2026-08-20; proves the complete deterministic repository suite remains green without provider execution.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, and `git diff --check` — passed on 2026-08-20; proves build output, declarations, repository style, and patch integrity remain valid.
  - [x] `node scripts/release-provider-comparison.mjs --plan --json --baseline-ref v3.2.0` — reports `concurrency: 1`, alternating AB/BA order, five maximum pair attempts, and two maximum contaminated-pair replacements without invoking a provider.
  - [x] Fixed-scope `rsp-review` against `c4adccd` and the complete Change worktree — final Code and Document verdicts are `clean` after correcting model-invocation inference, transport-evidence admission, and replacement-count reporting.
### Optional
- Manual or environment:
  - [ ] Run one explicitly authorized provider comparison and inspect clean-pair and infrastructure-quality distributions.
- Coverage:
  - Live provider behavior and transparent upstream retries remain unverified unless the host exposes them and a separately authorized comparison runs; token and latency outliers alone remain eligible by policy.

## Blockers
- none
