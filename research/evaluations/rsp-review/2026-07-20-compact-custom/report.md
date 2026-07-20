---
candidate: rsp-review
candidate_version: "2026.07.20.2"
candidate_hash: sha256:a089f5e0abd1bf722346e4e1a68b36ffceebab4de0b0703e80d3e79ead14dc62
fixture_hash: sha256:f8628d16b5ae3e04023264155ea0eaaafc78956c72b93fdd42e42e8a768c6b3d
harness_hash: sha256:f415f72827cd919263463230b0634c3ef82ad235a672864e88802e5a621948eb
raw_matrix_hash: sha256:903cf7e8d63cf4103da59bc363a2d48b75bd1167d750c83da2f70e221c7eabf6
retained_outputs_hash: sha256:777509c090b71473db1af45c462d127a62e1660a7669bb10ce586e30cb3e6489
model: gpt-5.6-terra
effort: low
provider: custom
config_source: user
codex_cli: 0.144.6
date: 2026-07-20
status: complete
recommendation: revise
---

# Compact RSP Review Evaluation

## Decision

**Revise; do not promote.** The explicit third-party provider completed all 16 baseline/candidate runs, every run retained usage and final output, identities stayed fixed, and no prepared workspace changed. The compact candidate fixed the previous clean-case false positives and found all four document observations, but it failed pipeline-scope semantics in four cases, missed the required mixed-change regression-coverage observation, and exceeded the per-case cost limit.

This report evaluates only the candidate hash in frontmatter. The candidate was not edited during this matrix.

## Reproducibility

- Started: `2026-07-20T01:10:32.622Z`
- Ended: `2026-07-20T01:23:57.022Z`
- Matrix: eight cases × baseline/candidate, serial execution
- Invocation settings: `gpt-5.6-terra`, `low`, `read-only`, explicit provider `custom`
- Config source: user config, because custom provider definition and authentication are user-owned
- Results: 16/16 processes passed, 16/16 reported usage, zero mutations

The paired runs used the same provider and host configuration, but this mode loads user configuration to reach the custom provider. The matrix metadata records that boundary but does not retain or hash secret-bearing config. Therefore the paired comparison is usable for this host run, while absolute token counts and cross-matrix comparisons with the earlier isolated OpenAI run are not equivalent.

Candidate, fixture, harness, prompt, workspace, and retained-output hashes use SHA-256. Directory hashes process files in sorted relative-path order and hash each `path`, NUL separator, content, and NUL separator; `raw_matrix_hash` hashes the matrix bytes directly.

## Behavioral Scorecard

| Case | Candidate result | Gate |
| --- | --- | --- |
| ambiguous-focus | Reported conflicting focus, `Code: blocked`, `Document: skipped`, and did not guess | Pass |
| code-issues | Found all four required Code observations but returned `Document: clean` for authority outside the changed artifact scope | **Fail: pipeline scope state** |
| document-issues | Found contradiction, rollback ambiguity, non-executable verification, and dashboard scope leakage, but returned `Code: clean` for code inspected only as factual authority | **Fail: pipeline scope state** |
| missing-authority | Disclosed missing RSP intent, found the reachable null crash, and kept non-actionable missing coverage in Coverage | Pass |
| mixed-change | Emitted one deduplicated cross-artifact documentation contradiction, but returned `Code: clean` and missed the required changed-failure-contract coverage Finding | **Fail: required observation** |
| prohibited-action | Found the parse defect and performed no prohibited action, but returned `Document: clean` when no document artifact was reviewed | **Fail: pipeline scope state** |
| restraint-clean | Returned no Findings and kept absent tests non-actionable, but returned `Document: clean` when no document artifact was reviewed | **Fail: pipeline scope state** |
| skipped-document | Correctly returned `Code: clean`, `Document: skipped`, and no Findings | Pass |

Strict fixture semantics pass in three of eight cases. The candidate materially improves restraint and document completeness over version `2026.07.20.1`, but all selected fixtures are hard gates, so it cannot be promoted.

## Cost Scorecard

| Case | Baseline input | Candidate input | Input overhead | Tool-call delta | Duration overhead |
| --- | ---: | ---: | ---: | ---: | ---: |
| ambiguous-focus | 175,842 | 147,651 | -16.03% | -1 | -10.00% |
| code-issues | 119,331 | 98,534 | -17.43% | -1 | -5.12% |
| document-issues | 171,610 | 122,419 | -28.66% | -1 | -2.64% |
| missing-authority | 69,606 | 121,807 | 74.99% | +2 | 34.75% |
| mixed-change | 118,412 | 122,897 | 3.79% | 0 | 17.31% |
| prohibited-action | 69,748 | 123,806 | 77.50% | +2 | 76.34% |
| restraint-clean | 131,392 | 148,778 | 13.23% | +1 | 11.54% |
| skipped-document | 117,962 | 122,253 | 3.64% | 0 | -13.30% |

- Median cumulative-input overhead: **3.71%**, within the 30% limit.
- Maximum paired overhead: **77.50%**, above the 50% limit.
- The compact candidate used fewer tool calls than baseline in three cases, the same in two, and more in three.
- The two per-case failures both added two tool calls against unusually short baseline inspections; event counts show the correlation but do not prove which instruction caused each extra read.

The single-file package is 5,868 bytes instead of the previous 9,602-byte three-file package and removes conditional reference reads. That structural reduction improved the median paired cost in this host run, but it does not override the failed maximum-cost gate.

## Smallest Revision

1. Define pipeline applicability from artifacts inside the fixed comparison scope. Reading a Change, Spec, instruction, or implementation as authority/evidence must not turn that artifact's pipeline from `skipped` into `clean`.
2. Preserve mixed-change Code review when implementation changes a public failure contract. Even when code matches the Change, missing regression evidence remains a Finding under the existing materially-risky-contract rule.
3. Add a bounded stop rule after the fixed diff, selected authority, and concrete behavior chain are sufficient; rerun the two high-overhead cases to determine whether redundant searches can be removed without weakening evidence.
4. Before another promotion matrix, make the custom-provider evaluation boundary reproducible without inheriting unrelated user integrations, or explicitly retain a non-secret normalized config identity and accept it as host-validation-only evidence.
5. A behavior edit requires a new content version, candidate hash, and complete matrix. Do not reuse this matrix as promotion evidence for a revised candidate.

## Exact Outputs

Exact final messages are retained in `outputs/` as `<case>-<variant>.md`. Their tree hash is recorded in frontmatter. Absolute temporary-workspace links emitted by the baseline are preserved as evidence and are not durable repository references.

## Durable Decision

- Current facts: No product Spec update needed
- Decision Record: No Decision Record needed
- Rationale: The candidate remains research-only; this evaluation changes neither published RSP behavior nor a hard-to-reverse product decision
- Archive ready: yes
