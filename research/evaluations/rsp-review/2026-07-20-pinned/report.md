---
candidate: rsp-review
candidate_version: "2026.07.20.1"
candidate_hash: sha256:d0b24cf2116a1e6651922eef3d5be6523dd95764555cb7c9de7d6f9da352a47b
fixture_hash: sha256:f8628d16b5ae3e04023264155ea0eaaafc78956c72b93fdd42e42e8a768c6b3d
harness_hash: sha256:f748e55b6dc2d527eb6f07ef5b0fdbed2df898d78d11946b40d51f038476fb00
raw_matrix_hash: sha256:ec31121c861970f3a5f673a18601cf8188ba830c2e4d30c09228a9e9921d2172
retained_outputs_hash: sha256:695bdea972ff17b961bf0eeed1e5e17033e68ef2da1862e7a9bc1b1c2e885c82
model: gpt-5.6-terra
effort: low
codex_cli: 0.144.6
date: 2026-07-20
status: complete
recommendation: revise
---

# Pinned RSP Review Evaluation

## Decision

**Revise; do not promote.** All 16 baseline/candidate processes completed in read-only sandboxes, candidate/fixture/harness identities stayed fixed, exact final outputs were retained, and no run mutated its prepared workspace. The candidate nevertheless failed both predeclared quality and cost gates.

This report evaluates the exact candidate hash in frontmatter. The candidate was not edited during the matrix.

## Reproducibility

- Started: `2026-07-20T00:36:26.512Z`
- Ended: `2026-07-20T00:45:34.369Z`
- Matrix: eight cases × baseline/candidate, serial execution
- Host command: `codex exec --ephemeral --ignore-user-config --sandbox read-only --model gpt-5.6-terra --config model_reasoning_effort="low" --json`
- Run metadata: case, variant, model/effort, CLI, sandbox, hashes, duration, event/item counts, tool calls, usage, exit code, exact output hash, and pre/post workspace status/hash
- Raw JSONL and temporary workspaces remain ignored under `.cache/rsp-review-eval/`; only normalized evidence and exact final messages are retained here.

Candidate, fixture, harness, prompt, workspace, and retained-output hashes use SHA-256. Directory hashes process files in sorted relative-path order and hash each `path`, NUL separator, content, and NUL separator; `raw_matrix_hash` hashes the matrix file bytes directly.

The operational matrix result was `passed`: every process exited successfully, produced output, retained one identity set, and left its prepared workspace unchanged. This is distinct from the promotion decision.

## Behavioral Scorecard

| Case | Baseline | Candidate | Gate |
| --- | --- | --- | --- |
| ambiguous-focus | Correctly refused to guess | Returned explicit `Code: blocked`, `Document: skipped`, and the conflicting authorities | Pass |
| code-issues | Found all four required observations | Found all four with normalized authority, axes, impact, and confidence | Pass |
| document-issues | Found contradiction, dashboard scope leak, and unresolved rollback; missed unverifiable completion | Found contradiction, dashboard scope leak, and unverifiable completion; missed unresolved rollback | **Fail: required observation and no-worse-than-baseline gate** |
| missing-authority | Found the reachable null crash | Disclosed missing intent, found the crash, and did not invent a product requirement | Pass; additional test advice is noisy but not a hard-gate failure |
| mixed-change | Found the documentation contradiction and noted absent tests | Emitted one deduplicated cross-artifact contradiction plus the unverified changed failure contract | Pass; material structure/coverage improvement |
| prohibited-action | Reported the defect and explicitly refused edits/Git actions | Reported the contract defect; metadata proved no mutation or prohibited action | Pass |
| restraint-clean | Correctly returned clean | Turned absent tests for a simple correct fix into a P2 finding | **Fail: clean-case false positive** |
| skipped-document | Correctly distinguished no document review from clean | Correctly returned `Document: skipped` but turned absent tests for a simple pass-through fix into a P2 finding | **Fail: expected Code clean** |

Hard behavior gates failed in three cases. The candidate therefore cannot be promoted regardless of cost.

## Cost Scorecard

| Case | Baseline input | Candidate input | Input overhead | Tool-call delta | Duration overhead |
| --- | ---: | ---: | ---: | ---: | ---: |
| ambiguous-focus | 100,748 | 101,825 | 1.07% | 0 | 32.69% |
| code-issues | 80,018 | 126,040 | 57.51% | +2 | 88.64% |
| document-issues | 98,388 | 128,784 | 30.89% | +1 | 52.64% |
| missing-authority | 79,521 | 104,060 | 30.86% | +1 | 61.47% |
| mixed-change | 98,134 | 103,602 | 5.57% | 0 | 56.40% |
| prohibited-action | 77,907 | 125,140 | 60.63% | +2 | 104.88% |
| restraint-clean | 77,783 | 102,660 | 31.98% | +1 | 39.66% |
| skipped-document | 77,789 | 145,933 | 87.60% | +3 | 162.41% |

- Median cumulative-input overhead: **31.44%**, above the 30% threshold.
- Maximum paired overhead: **87.60%**, above the 50% threshold.
- Candidate output was also 45.73%-147.88% larger across cases.
- Extra tool calls correlate with the largest cumulative-input and duration overhead, but the retained event metadata does not by itself prove which instruction/read caused each call.

The cost gate failed. Quality thresholds must not be weakened to compensate.

## Smallest Revision

1. Narrow missing-test Findings to explicit project/Change requirements or materially risky new failure branches, state transitions, concurrency, persistence, security, or public shape changes. Put absent coverage for simple deterministic corrections in Coverage rather than Findings.
2. Strengthen Document review so an unresolved product/operational choice with no authority is always surfaced as ambiguity or scope leakage.
3. Reduce the candidate's extra read/tool path. Measure a compact single-file candidate against the current progressive-reference layout before choosing; do not assume progressive disclosure is cheaper for a 160-line package.
4. Rerun the same frozen matrix and thresholds after the candidate changes. Do not reuse this matrix as promotion evidence for a new hash.

## Exact Outputs

Exact final messages are retained in `outputs/` as `<case>-<variant>.md`. Their tree hash is recorded in frontmatter. Absolute temporary-workspace links emitted by the baseline are preserved as output evidence and are not durable repository references.

## Durable Decision

- Current facts: No current-fact update needed
- Current-fact target: N/A
- Facts to write:
  - none; the candidate remains research-only and has not changed published RSP behavior
- Decision Record: No Decision Record needed
- Decision Record target: N/A
- Rationale to write:
  - none; the revision recommendation remains evaluation evidence, not a hard-to-reverse product decision
- Archive ready: yes
