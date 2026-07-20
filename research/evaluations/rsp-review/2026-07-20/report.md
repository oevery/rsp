---
candidate: rsp-review
candidate_version: "2026.07.20.1"
evaluated_candidate_hash: sha256:9d6592d619f5e39c94dc103432c339daa7552a108f99f88e2e074f487341abf4
current_candidate_hash: sha256:97a92ec8d72f3c7018fd5c439e046dbab8e0c089cbf4f6d9f9845ca3d09aafe0
fixture_hash: sha256:ec42a84e73005938a27fc558535fc6b953c0c784430965eebd937dd9a0b5a085
harness_hash: sha256:dbfb7feb6f8683d008e042735802a047314fbc890bdb8e521f063cb1860ffe2d
date: 2026-07-20
status: complete
recommendation: revise
---

# RSP Review Candidate Evaluation

## Decision

**Revise; do not promote.** The candidate produced more explicit scope states, stronger document coverage, stable finding fields, and correct restraint. It also exposed two unresolved promotion risks: the initial run set did not capture a reproducible model/candidate identity for every call, and candidate executions consumed substantially more cumulative input tokens than their paired baselines.

The mixed-change miss was corrected in candidate `2026.07.20.1`: a changed public return/failure contract without focused verification is now an actionable Code finding. The rerun passed the fixture, but the complete current candidate still needs one pinned, instrumented rerun across all cases before promotion.

After the run, package-link validation was tightened and the two reference links gained heading fragments. This changed the current payload hash without changing review semantics; the evaluated and current hashes are recorded separately rather than treating them as identical.

## Method

- Harness: `scripts/rsp-review-eval.mjs` prepared fresh Git repositories from `test/skill-behavior/fixtures/`.
- Baseline: no review Skill installed.
- Candidate: copied only into the isolated workspace at `.agents/skills/rsp-review/`.
- Both variants used `HEAD` as the fixed comparison point and a read-only prompt.
- Host: `codex-cli 0.144.6`, `--ephemeral`, `--ignore-user-config`, `--sandbox read-only`.
- Code, document, and mixed initial pairs used `model_reasoning_effort="low"`; restraint used the CLI default effort.
- The CLI default model was not explicitly pinned or retained in the filtered event stream. This is a reproducibility defect in the evaluation method, not evidence about candidate behavior.

Exact fixture inputs are committed under `test/skill-behavior/fixtures/`. Exact retained final messages are under `outputs/`. Temporary workspace links inside baseline messages are preserved as emitted and are not durable references.

## Results

| Case | Baseline | Candidate | Assessment |
| --- | --- | --- | --- |
| restraint-clean | Correctly returned clean | Returned `Code: clean`, `Document: skipped`, with bounded coverage | Both pass; candidate expresses scope state better |
| code-issues | Found contract, `any`, unnecessary API, and missing coverage | Found all four with authority, axis, impact, and confidence | Both pass; candidate is more actionable and normalized |
| document-issues | Found contradiction, scope leak, and unverifiable completion; missed unresolved rollback choice | Found all four expected document issues | Candidate improves semantic document coverage |
| mixed-change v1 | Found cross-artifact documentation contradiction and mentioned missing tests without a finding | Found the contradiction but incorrectly reported Code clean | Both missed one expected actionable coverage finding |
| mixed-change v2 | Same baseline | Found one deduplicated cross-artifact contradiction plus the missing public-contract regression test | Current candidate passes the mixed fixture |

The candidate did not mutate the evaluated workspaces in the retained runs. Ambiguity, missing-authority, prohibited-action, and explicit skipped fixtures are defined and deterministically prepared, but were not executed through a pinned real-host run in this evaluation. They remain a promotion gap.

## Usage

These are cumulative usage values emitted by `turn.completed`; cached input is included separately and the values do not equal raw Skill text size.

| Case | Variant | Input | Cached input | Output | Reasoning output |
| --- | --- | ---: | ---: | ---: | ---: |
| restraint-clean | baseline | 58,977 | 48,384 | 424 | 122 |
| restraint-clean | candidate v1 | 105,482 | 91,392 | 1,116 | 301 |
| code-issues | baseline | 58,301 | 47,872 | 793 | 203 |
| code-issues | candidate v1 | 124,673 | 100,864 | 1,848 | 439 |
| document-issues | baseline | 100,461 | 87,808 | 946 | 183 |
| document-issues | candidate v1 | 168,312 | 153,088 | 2,131 | 443 |
| mixed-change | baseline | 99,383 | 96,000 | 927 | 189 |
| mixed-change | candidate v1 | 127,505 | 112,128 | 1,667 | 522 |
| mixed-change | candidate v2 | 130,402 | 114,688 | 1,991 | 741 |

Candidate input overhead versus baseline was approximately 79% for restraint, 114% for code, 68% for document, and 31% for the current mixed rerun. The candidate payload itself is 160 lines and 1,362 words across the entry and two progressively loaded references, so raw instruction size alone does not explain the observed cumulative usage. Full event/tool-call traces were not retained; attribution would be speculation.

## Promotion Gaps

1. Pin and record model identifier, reasoning effort, candidate/fixture/harness hashes, timestamps, durations, event counts, and tool calls before each run.
2. Rerun the current candidate and baseline under identical explicit settings; do not combine v1 and v2 candidate results in a promotion score.
3. Execute ambiguity, missing-authority, prohibited-action, and skipped cases on the real host.
4. Retain raw run metadata while keeping secrets and host-local session state out of research artifacts.
5. Measure which reads/tool calls cause the cumulative context overhead before simplifying instructions or references.
6. Require all current fixtures to pass and set an acceptable cost threshold before a promotion Change.

## Retained Outputs

- `outputs/restraint-baseline.md`
- `outputs/restraint-candidate.md`
- `outputs/code-issues-baseline.md`
- `outputs/code-issues-candidate.md`
- `outputs/document-issues-baseline.md`
- `outputs/document-issues-candidate.md`
- `outputs/mixed-change-baseline.md`
- `outputs/mixed-change-candidate-v1.md`
- `outputs/mixed-change-candidate-v2.md`
