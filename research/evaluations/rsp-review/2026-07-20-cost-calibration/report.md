---
candidate: rsp-review
candidate_version: "2026.07.20.5"
candidate_hash: sha256:399619e81e40cd16a29bf64a88bb7ca214410097a7d3d61adb927a28dc47c69c
fixture_hash: sha256:f8628d16b5ae3e04023264155ea0eaaafc78956c72b93fdd42e42e8a768c6b3d
harness_hash: sha256:111313085367f5384a73c422dbfe37f61659e757b4fe84ca6d3144129871c377
calibration_hash: sha256:7c55c0beca07befe053586bea12ef2dedd34410e02ec100395ea9a3e0ff4f712
model: gpt-5.6-terra
effort: low
provider: user-default
config_source: user
repetitions: 3
timeout_ms: 180000
date: 2026-07-20
status: complete
cost_status: passed
recommendation: promote
---

# RSP Review Cost Calibration

## Decision

**The repeated context-cost gate passes.** Three fresh complete matrices produced 48 valid runs with one candidate, fixture, and harness identity. Every per-case median cumulative-input overhead is at most 50%, and the median across the eight case estimates is 11.01%, below the 30% aggregate limit.

Combined with the separate eight-of-eight [quality-pass evaluation](../2026-07-20-quality-pass-user/report.md), candidate `2026.07.20.5` is ready for a normal promotion Change. This report does not itself move the candidate into `skills/` or publish anything.

## Predeclared Method

- Use exactly three new serial eight-case baseline/candidate matrices.
- Keep candidate, fixture, harness, model, effort, provider source, sandbox, and timeout fixed.
- Compute `(candidate_input / baseline_input - 1) × 100` for every paired case.
- Use the median of the three ratios as each case estimate.
- Pass when every case estimate is at most 50% and the median of the eight estimates is at most 30%.
- Fail closed for any failed run, timeout, mutation, missing usage, or identity drift.
- Do not reuse matrices observed before the method was declared.

## Operational Integrity

- Started: `2026-07-20T03:46:17.722Z`
- Ended: `2026-07-20T04:21:33.530Z`
- Runs: 48/48 passed
- Timeouts: 0
- Workspace mutations: 0
- Missing usage: 0
- Identity sets: one candidate, one fixture, one harness
- Matrix hashes: three retained in `calibration.json`

## Cost Results

| Case | Repetition overheads | Case median | Gate |
| --- | --- | ---: | --- |
| ambiguous-focus | -30.12%, 55.51%, 0.46% | 0.46% | Pass |
| code-issues | -17.23%, 32.78%, 115.86% | 32.78% | Pass |
| document-issues | 51.58%, -0.16%, 6.71% | 6.71% | Pass |
| missing-authority | 3.87%, 4.70%, -0.91% | 3.87% | Pass |
| mixed-change | 25.58%, 15.62%, 51.45% | 25.58% | Pass |
| prohibited-action | 28.40%, 26.82%, 76.60% | 28.40% | Pass |
| restraint-clean | 11.38%, 40.70%, -18.01% | 11.38% | Pass |
| skipped-document | 10.63%, 5.67%, 31.99% | 10.63% | Pass |

- Aggregate median of case medians: **11.01%**, within the 30% limit.
- Maximum case median: **32.78%**, within the 50% limit.

Individual samples range from -30.12% to 115.86%, confirming that the earlier single-run maximum gate was dominated by baseline/model variance. The repeated median preserves a hard budget while avoiding a promotion decision based on one unusually short baseline inspection.

## Limitations

- Evidence covers the configured user provider, `gpt-5.6-terra`, and `low` effort on the selected fixture set.
- Reported cumulative input is a Codex usage metric, not provider billing.
- Three repetitions reduce but do not eliminate stochastic variance; future candidate behavior or harness changes require fresh evidence.

## Durable Decision

- Current facts: No product Spec update before promotion
- Decision Record: No Decision Record needed
- Rationale: The estimator and evidence are maintainer evaluation mechanics; published behavior remains unchanged
- Archive ready: yes
- Next action: create a promotion Change that moves the exact candidate hash into `skills/rsp-review/` and runs package/install host smoke tests
