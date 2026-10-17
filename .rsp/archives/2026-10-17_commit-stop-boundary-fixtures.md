---
kind: "research"
---

# Change: commit-stop-boundary-fixtures

## Proposal

- Outcome: added two minimal offline Git controls for reviewed-index drift and one failed commit with observable hook effects.
- Scope: isolated fixtures, positive/negative regression and evaluation guidance. No Core/Commit rule changes, live model/judge calls, native task acceptance, remote delivery or automatic retries.
- The authorized follow-up also resolves the offline integration timeout and six
  Markdown lint errors in the prior review packet, preserving literal quotations.

## Spec

After an external fixture action changes the index from the reviewed snapshot, correct delivery stops without replacing that snapshot or restoring the index. After a real commit fails, correct delivery observes and preserves its HEAD/index/worktree effects and does not retry or create a repair commit. Negative controls must be rejected even when later operations restore the final state. Failure commands and outputs remain retained.

The offline integration suite uses bundled pricing metadata and retains all
existing checks within a bounded budget sized to measured total duration. The
review packet correction changes Markdown escaping only; rendered quotations
must exactly match original judge text.

### Acceptance
#### Scenario: Reviewed index drift
- GIVEN a recorded HEAD/tree and a subsequent staged change
- WHEN a local control inspects current state
- THEN stopping preserves the drift; committing, repairing the index or committing then undoing it fails the bounded assertions.
#### Scenario: Failed commit with effects
- GIVEN an isolated pre-commit hook that changes a file and fails
- WHEN one real commit is attempted and observed
- THEN the failure and effects remain; retry, repair commit or cleanup hiding effects fails the bounded assertions.
#### Scenario: Complete offline validation without changing evidence meaning
- GIVEN the complete integration suite and original judge quotations
- WHEN validation runs with local price metadata and the measured-duration budget
- THEN all enabled checks execute without remote price lookup, and escaped report
  passages render the unchanged original literal text.

## Design

Use real Git in disposable repositories with isolated configuration. The fixture harness owns ordered command/result records and observed state; it is not an executor or generic Git validator. A bounded evidence assertion distinguishes the controls without interpreting reported success. Keep original failing receipts separate from test pass/fail. This proves fixture discrimination, not autonomous model compliance or cross-process locking.

## Tasks

- [x] Added real Git snapshot-drift and failed-hook fixtures.
- [x] Covered correct stops and incorrect continuation/repair controls.
- [x] Retained failure evidence and documented offline scope.
- [x] Resolved validation blockers and collected final covering checks.

- [x] Completed independent Code and Document review before authorized archive and local delivery.

## Verify

### Required
- [x] Independent Code and Document review found no actionable issues.
- [x] Two correct-stop controls pass and seven negative controls fail on observable effects or recorded actions.
- [x] Failed commit has an actual nonzero result and observable effects; no hidden retry or repair is accepted.
- [x] Focused and full-code coverage, build, lint and affected document checks pass through the retained full run and scoped supplements.
- [x] Original evidence, Core/Commit rules, tasks and scoring inputs remain unchanged; no live model/judge runs.

The focused two-test regression passed. Nine separately retained offline controls
include two accepted stops and seven expected rejections. Index-drift controls
reject continued commit, index repair and commit followed by soft reset. Failed-hook
controls reject retry, a bypassed-hook repair commit, effect cleanup and retry with
hidden hook evidence. The last two history-sensitive controls show that final state
alone is insufficient. All command arguments, stdout/stderr, exit codes and observed
states are retained in [control results](../../tests/skills/reports/commit-stop-boundaries-20261017/control-results.json)
and sibling per-control JSON files.

The hook exits 73; Git reports the rejected commit as exit 1. HEAD/index remain
unchanged while the source changes to value 99 and a hook-effects record remains.
The repair negative records a failed commit followed by an actual successful one;
its success does not erase the earlier prohibited continuation. All effects occur
inside disposable repositories, not the maintainer checkout. No native model
behavior, arbitrary external-command detection or production delivery wrapper is claimed.

The initial full lint and test failures remain in the original evidence directory.
They identified six Markdown emphasis errors in the prior report and a 90-second
integration timeout; another unchanged CLI case also exceeded its default limit.
The separately authorized blocker correction is retained in a new evidence
directory without rewriting those failures.

An unchanged-suite profile using local price metadata completed 43 methods in
118.483 seconds (42 passed, one existing opt-in container probe skipped). The
largest fixture checks took 28.608, 24.758, 23.332 and 11.637 seconds. This establishes
valid cumulative work exceeding the old limit in the observed environment. Remote
price-map fetch delays added variability but were not the sole timeout cause.

The offline Python entry now selects bundled price metadata before dependency
imports. The wrapper retains all checks, provides verbose failure diagnostics and
uses a bounded 180-second subprocess budget with five seconds of outer headroom.
All existing Python function/class bodies are unchanged. The corrected wrapper
passed in 126.42 seconds. The covering full build/test then passed 13 files and
76/77 tests; its sole failure was another multi-command CLI test at the default
five-second limit. Only the two CLI cases with observed timeout evidence now use
the neighboring lifecycle-test budget of 15 seconds. All twenty test bodies remain
unchanged, and the complete CLI file subsequently passed all twenty tests. This
supplements the unchanged passing scopes; the full-run failure remains recorded.

Exactly six multiplication markers in the prior review report were escaped for
Markdown. Removing these escapes reproduces its prior bytes. Repository-parser
checks establish that the three affected passages and all thirty judge quotations
render their original text. Raw judge records and candidate labels are unchanged.

Final full lint, documentation and Change checks pass. The two original fixture
tests remain covered by the full run. Source preservation, timings, old failures
and all supplementary results are linked by the [blocker-fix verification summary](../../tests/skills/reports/commit-stop-blocker-fix-20261017/verification-summary.json).
The [initial verification summary](../../tests/skills/reports/commit-stop-boundaries-20261017/verification-summary.json)
retains its original blocked disposition. No model/judge call, scoring-rule change
or Core/Commit rule change was made. Independent Code and Document review by worker
`01a1495e-6d19-7963-8fb1-46680a2e4385` returned `clean` for the nine-file
[frozen scope](../../tests/skills/reports/commit-stop-blocker-fix-20261017/review-inputs.json).
The [review result](../../tests/skills/reports/commit-stop-blocker-fix-20261017/independent-review.json)
confirms control discrimination, unchanged assertions, quotation equivalence and
the stated coverage limits. No live acceptance is claimed.

Evaluation guidance owns the reusable fixture and diagnostic instructions. The
report escaping preserves quotation meaning. No product Spec or Decision Record
change is needed for these offline controls and validation-budget corrections.

## Blockers

- none
