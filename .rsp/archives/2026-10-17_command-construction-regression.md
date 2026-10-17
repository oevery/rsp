---
kind: "research"
---

# Change: command-construction-regression

## Proposal

- Outcome: retained failures are classified across wrapper, shell and Python
  boundaries, and offline regressions reproduce the seven construction faults.
  The smallest demonstrated correction location is executor tool-input construction;
  original failures remain preserved and no product runtime repair was introduced.
- Scope: the five trials in the three selected fixed-Skill jobs, a provenance-backed
  syntax-only regression corpus, targeted code tests and a new research result.
- Non-goals: model/judge execution, task replay, historical verdict rewriting,
  Core prompt changes, Commit snapshot changes and runtime/adapter changes.

## Spec

No product contract delta. Diagnostics must not treat task acceptance, command
failure, expected refusal, output truncation and unavailable evidence as equivalent.

### Acceptance
#### Scenario: A wrapper fails before a shell command exists
- GIVEN retained root and descendant session call/result pairs
- WHEN a JavaScript parse error prevented command dispatch
- THEN the failure is counted once with its source and layer, even if codex.txt
  contains no command_execution record.
#### Scenario: Replay only command construction
- GIVEN the exact failed call text and its observed successful successor
- WHEN JavaScript, decoded shell and literal Python heredoc are parsed offline
- THEN the first failing layer is reproduced without evaluating JavaScript,
  executing the captured shell/Python, dispatching workers or mutating source jobs.
- AND positive controls preserve literal command bytes through JavaScript encoding;
  syntax success is not semantic execution or model acceptance.

## Design

Read original native sessions and attribute root/child outcomes once per call/result.
Keep expected prerequisite rejection separate using the actual task contract, not
exit code alone. Capture the seven observed construction failures and five distinct
successful successor calls byte-for-byte in a test corpus with source hashes.
Use Node compilation without execution, TypeScript AST literal decoding, bash -n,
and Python compile without execution. Reuse installed dependencies; no new runtime
helper or generic evaluation framework is justified before the owning seam is known.
Store detailed classification and preservation evidence under ignored reports and
record selected conclusions in a new dated research report; do not rewrite archives.
The evaluation guide owns diagnostic usage and evidence limits. No product contract
or significant architecture choice changed, so no Spec or Decision Record update
is needed.

## Tasks

- [x] Classify all observed selected native failures and retain source attribution.
- [x] Add syntax-only regression using exact failures and successful controls.
- [x] Validate, preserve existing evidence and report the minimal correction boundary.
- [x] Complete independent review of the classification, regression and records.

## Verify

### Required
- [x] Wrapper and command outcomes are separated, expected failure and truncation
  remain distinct, and the three original job verdicts are not recomputed.
- [x] All seven failed calls reproduce at the observed first layer, five successful
  successors parse, and byte-preserving construction controls pass offline.
- [x] Applicable build/lint/code/document checks pass; original records and protected
  Core, Commit, rules and evaluation support remain byte-identical.
- [x] Independent reviewer 01a1486d-ea7b-7152-b099-d2fe5f09dc18 returned Code clean
  and Document clean for the five-file boundary against c402ebdc. It checked raw
  call provenance, classification, parse-only safety, evidence applicability and
  preservation, reusing passing checks without replay. [Review record](../../tests/skills/reports/command-construction-20261017/independent-review.json)
  retains the verdict and its limits.

The five selected trials contain five JavaScript syntax failures, two Python syntax
failures, one expected prerequisite exit 73 and one early missing-artifact read.
One output truncation is recorded separately. Full native call/results expose the
wrapper failures missing from command-only views. No historical verdict changed.

Both focused regressions passed; all 12 captured inputs match source bytes and
successor provenance. Full build/code validation passed (12 files, 71 tests), as
did final lint and document/Change checks. Initial lint formatting errors and one
pre-execution authoring error remain separate from native failures. Detailed results
and preservation hashes are in the [verification summary](../../tests/skills/reports/command-construction-20261017/verification-summary.json).

The [research result](../../research/reports/2026-10-17T05-52-00Z.md) identifies the
executor's tool-input construction as the smallest demonstrated correction location.
The repository correction here is diagnostic coverage, not a runtime repair.
Syntax-only controls do not establish functional equivalence, failure short-circuiting,
future model behavior or cost savings. No Core/Commit requirement, adapter, native
task, judge, original failure record or archived result was changed.
The user authorized archive and one local commit after clean independent review,
with no push. This does not authorize live execution or further runtime changes.

## Blockers

- none
