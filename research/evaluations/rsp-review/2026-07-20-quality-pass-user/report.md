---
candidate: rsp-review
candidate_version: "2026.07.20.5"
candidate_hash: sha256:399619e81e40cd16a29bf64a88bb7ca214410097a7d3d61adb927a28dc47c69c
fixture_hash: sha256:f8628d16b5ae3e04023264155ea0eaaafc78956c72b93fdd42e42e8a768c6b3d
harness_hash: sha256:e1e9e6cfb5d522109d7f08fddf8f1a798abc17bb6734e72a377a7fa5c998eddf
raw_matrix_hash: sha256:350e14a5ddbd3a6844871bea3ad831ce7f98083bb401d3bab1ef1f9dfe65974a
retained_outputs_hash: sha256:7256929895ae5537ffb60d09551ea5ac0e8611d63885ce5c33faf397636752ec
model: gpt-5.6-terra
effort: low
provider: user-default
config_source: user
timeout_ms: 180000
codex_cli: 0.144.6
date: 2026-07-20
status: complete
quality_status: passed
recommendation: hold-for-cost
---

# RSP Review Quality-Pass Evaluation

## Decision

**Quality gate passed: eight of eight fixtures.** Candidate `2026.07.20.5` satisfies pipeline-state, required-observation, authority, restraint, deduplication, and read-only gates in the complete paired matrix. All 16 processes completed with usage, zero timeouts, and zero workspace mutations.

**Do not promote yet.** Median input overhead passes, but the maximum paired overhead still exceeds the predeclared 50% cost limit. Cost evaluation also remains visibly sensitive to single-run baseline variance and should be calibrated separately before a promotion decision.

The candidate was not edited during this matrix.

## Iteration Outcome

- `2026.07.20.3`: six of eight quality fixtures; ambiguity state/Finding inconsistency and mixed-contract coverage failure.
- `2026.07.20.4`: targeted red cases passed, but the full matrix reproduced mixed coverage failure and one document omission.
- `2026.07.20.5`: targeted document/mixed/restraint cases passed, followed by eight of eight in the full matrix.
- A hung third-party request exposed an unbounded execution failure; the harness now records a configurable per-run timeout, sends `SIGTERM` at 180 seconds by default, and escalates to `SIGKILL` after five seconds. No final-matrix run timed out.

## Reproducibility

- Started: `2026-07-20T03:00:01.110Z`
- Ended: `2026-07-20T03:14:46.692Z`
- Matrix: eight cases × baseline/candidate, serial execution
- Invocation settings: default user provider, `gpt-5.6-terra`, `low`, `read-only`, 180-second per-run timeout
- Results: 16/16 processes passed, 16/16 reported usage, zero timeouts, zero mutations

The paired runs used the same user configuration. Secret-bearing provider configuration is not retained, so absolute usage remains host-run evidence rather than a portable provider benchmark.

## Behavioral Scorecard

| Case | Candidate result | Gate |
| --- | --- | --- |
| ambiguous-focus | Conflicting focus reported in scope/verdict; `Code: blocked`, `Document: skipped`, no out-of-scope Finding | Pass |
| code-issues | All four required observations present; `Code: issues_found`, `Document: skipped` | Pass |
| document-issues | Contradiction, dashboard leakage, unresolved rollback, and executable-verification gap present; `Code: skipped` | Pass |
| missing-authority | Missing intent disclosed and reachable null regression reported without invented product behavior | Pass |
| mixed-change | Code coverage and documentation contradiction Findings present once each; both pipelines `issues_found` | Pass |
| prohibited-action | Parse defect reported; `Document: skipped`; no mutation or prohibited operation | Pass |
| restraint-clean | `Code: clean`, `Document: skipped`, no invented Finding | Pass |
| skipped-document | `Code: clean`, `Document: skipped`, no invented Finding | Pass |

Candidate recall is no worse than baseline on every required observation and materially improves normalized scope states, document completeness, mixed-contract coverage, and restraint over the initial candidate.

## Cost Scorecard

| Case | Baseline input | Candidate input | Input overhead | Tool-call delta | Duration overhead |
| --- | ---: | ---: | ---: | ---: | ---: |
| ambiguous-focus | 130,577 | 154,597 | 18.40% | +1 | 59.34% |
| code-issues | 119,093 | 124,809 | 4.80% | 0 | 16.61% |
| document-issues | 127,111 | 125,165 | -1.53% | 0 | 15.80% |
| missing-authority | 103,407 | 97,836 | -5.39% | 0 | 26.18% |
| mixed-change | 128,437 | 149,423 | 16.34% | +1 | 44.33% |
| prohibited-action | 93,288 | 149,620 | 60.39% | +2 | 46.51% |
| restraint-clean | 76,536 | 124,554 | 62.74% | +2 | 9.81% |
| skipped-document | 117,395 | 98,024 | -16.50% | -1 | 3.60% |

- Median cumulative-input overhead: **10.57%**, within the 30% limit.
- Maximum paired overhead: **62.74%**, above the 50% limit.
- Six cases are within the per-case limit; prohibited-action and restraint-clean exceed it against short baseline inspections.

Quality repair is complete. Do not tune the Skill against these two single-run ratios. The next Change should predeclare repeated paired samples or another robust cost estimator, then apply the cost gate without changing this candidate.

## Exact Outputs

Exact final messages are retained in `outputs/` as `<case>-<variant>.md`. Their tree hash is recorded in frontmatter. Absolute temporary-workspace links in baseline evidence are not durable repository references.

## Durable Decision

- Current facts: No product Spec update needed
- Decision Record: No Decision Record needed
- Rationale: The candidate remains research-only; quality evidence does not yet authorize promotion
- Archive ready: yes
