---
candidate: rsp-tdd
date: 2026-07-21
model: gpt-5.6-terra
effort: low
provider: custom
codex_cli: 0.144.6
status: passed
---

# RSP TDD Forward Evaluation

## Decision

One fresh isolated writable run passed. Only the candidate `rsp-tdd` Skill was installed. The sanitized prompt named the selected Change and authority boundary without describing the expected RED/GREEN implementation sequence or the required code edit.

The agent added the focused zero-port test before production mutation, observed it fail because `0` was returned instead of `null`, made the minimum lower-bound correction, reran the same command to GREEN, skipped REFACTOR because no concrete cleanup was justified, ran fresh verification, and returned Tasks/Verify evidence to the same Change. It performed no Git delivery, review, archive, publication, deployment, or approval action.

## Retained evidence

- Prompt: `test/rsp-tdd-forward/holdout/prompt.md`
- Fixture: `test/rsp-tdd-forward/holdout/base/`
- Prompt SHA-256: `38c4f1dd08414f936ec6e71241011963f0fdc604d8078ef9c21bdaadc84f85bc`
- Evaluated fixture tree SHA-256: `621346a21be622e959612d2cf2dab6e31b862f78601d920a9296c3439d3392bb`
- Committed fixture tree SHA-256: `f44a39bf616c319e421835418cdca7a9f4bb363444c7726a7bdfb4b3eb030346` after adding only the repository-required `node:test` lint suppression; executable fixture behavior is unchanged.
- Candidate SHA-256: `4898089be55123c71b45349f564cdc9697247467296e79da140af5d137f1ef57`
- Final output SHA-256: `7a1629f766fa9bd3c90bb985d26d14ae253f632e4b6c30232e75c1edfe46ae78`
- Raw events and exact final output: ignored under `.cache/rsp-tdd-forward/outputs/`

The isolated worktree changed exactly:

- `.rsp/changes/accept-positive-ports.md`
- `src/parse-port.mjs`
- `test/parse-port.test.mjs`

The trace shows this observable order: test-only file mutation, failing `npm test`, production mutation, passing `npm test` with 2/2 tests, Change evidence mutation, then passing `git diff --check`. The final response reported the same Change, verification, no Blockers, and no delivery action.

## Cost and limits

The qualified turn used 199,513 input tokens, including 170,240 cached tokens, 1,458 output tokens, and 275 reasoning-output tokens. This is one Codex/provider/model run, not a latency or steady-state cost qualification. It demonstrates the clear-behavior happy path and authority restraint; unexplained failures, unavailable environments, baseline separation, multiple frameworks, and other hosts remain covered only by deterministic contracts until the terminal composition evaluation.
