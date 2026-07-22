---
candidate: rsp-manage
date: 2026-07-22
candidate_skill_hash: sha256:b9d9d2036d592a3758a7aee609bdf980c97853d40d993b1e33031bf33de28253
model: gpt-5.6-terra
effort: low
provider: custom
codex_cli: 0.144.6
status: complete
recommendation: revise
---

# Lightweight RSP Manage Evaluation

## Decision

Retain the revised `rsp-manage` as a research candidate and do not add it to the 3.0 package yet. The 600-word-or-smaller body now provides an explicit-only eligibility gate, zero-mutation decline path, exact bounded dispatch envelope, four-dispatch/one-retry default budget, fresh-evidence continuation, stale-handoff recovery, and existing authority stops. It removes direct/assisted modes and non-portable invocation metadata.

The candidate proved ordinary-path restraint and real disjoint worker mutation, but the paired host matrix showed equal observable quality and higher aggregate cost: +34.15% input tokens, +19.93% elapsed time, +14.35% output tokens, and one tool call. It therefore does not satisfy the Change's promotion requirement for a demonstrated quality or recovery delta at acceptable cost.

## Evidence

- Deterministic contract: seven focused assertions pass across explicit eligibility, ordinary restraint, dispatch, fresh return, interruption recovery, and authority stop fixtures.
- Portable validation: Agent Skills validation passes; the candidate has no `agents/openai.yaml` and no `disable-model-invocation` field.
- Ordinary restraint: a fresh final-source run changed zero files, created no dispatch/receipt state, and returned the work to the ordinary implementation path. An earlier revision sometimes executed the named next action after declining management; that behavior caused the stronger pre-mutation eligibility gate.
- Paired matrix: baseline and candidate both completed multi-slice and interruption-recovery work, stayed inside allowlists, passed external `npm test`, avoided Git/delivery actions, and stopped at manual device acceptance.
- Real worker forward test: two workers operated concurrently in one isolated workspace. Header changed only `src/header.mjs` and passed 2/2 focused tests; retry changed only `src/retry.mjs` and `test/retry.test.mjs` and passed 4/4. Each noticed but did not touch the other's concurrent changes. Controller integration passed 6/6 tests and `git diff --check`.

| Journey | Variant | Result | Duration | Input | Output | Tools |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| Independent slices | baseline | pass | 60.32s | 150,969 | 2,042 | 5 |
| Independent slices | candidate | pass | 97.51s | 285,141 | 3,099 | 7 |
| Recovery and human stop | baseline | pass | 69.88s | 155,563 | 1,979 | 4 |
| Recovery and human stop | candidate | pass | 58.63s | 126,077 | 1,499 | 3 |

Recovery improved on this one run, while multi-slice overhead dominated aggregate cost. This single-host result is directional and does not establish a general performance claim.

## Failed and corrected attempts

1. The initial ordinary oracle required fixed wording (`rsp-implement`, `不需要`) even when the model correctly declined. That attempt is excluded as oracle calibration.
2. The pre-gate candidate then executed the one-slice implementation in two runs after correctly classifying it as ineligible. Those are genuine candidate failures and motivated the fail-closed pre-mutation gate.
3. With the final candidate hash, one ordinary run correctly changed zero paths but missed another exact Chinese phrase oracle; the observable-path gate was already correct. The retained fresh rerun uses a minimal text oracle plus the authoritative zero-changed-path check and passes.
4. The four paired runs initially scored 0/4 only because exact final phrases required file paths and one specific Chinese expression. All process, allowlist, external verification, and boundary checks passed. The unchanged outputs rescore 4/4 against frozen semantic oracles retained here. No model run was replaced.

## Remaining promotion gate

- Demonstrate a quality, recovery, or elapsed-time advantage on a genuinely long task where host worker dispatch is available to the invoked skill, not merely to a manually coordinated forward test.
- Exercise an evidenced corrective retry and an exhausted retry or authority budget without weakening the four-dispatch/one-retry bound.
- Repeat ordinary restraint enough to establish stability under an unchanged candidate and frozen oracle.
- Only then move the candidate to `skills/rsp-manage`, update the nine-Skill product surface, and regenerate exact-package release evidence.

The current eight-Skill 3.0 checkpoint remains independent and release-ready; this research result does not change package, release, or publication truth.
