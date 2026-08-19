# Evaluation datasets

This directory owns reusable inputs for evaluating RSP Skills, agents, controllers, and provider-backed workflows. It is separate from executable code tests under `test/` and release-project acceptance inputs under `acceptance/`.

## Dataset semantics

- `fixtures/` contains known, repeatable contract cases.
- `holdout/` contains intentionally separated unseen or forward-evaluation cases.
- `beta/` contains bounded evaluation plans that compose cases and acceptance contracts.
- `base/`, `changed/`, and similar directories are project states consumed by a case; they are data, even when they contain files named `*.test.ts`.
- Fake Codex or provider executables belong beside the evaluation datasets that consume them.

Do not merge fixtures and holdouts, mutate registered source cases during a run, or collect project files in this tree as repository Vitest tests. Historical reports under `research/evaluations/` retain the paths and identities observed when they were created.

## Execution boundary

Deterministic contracts under `test/evaluation/` may load these datasets during `pnpm test`. Provider-backed, token-bearing, retained-evidence, and baseline/candidate campaigns remain explicit maintainer operations owned by their scripts; relocating a dataset does not add them to ordinary code verification or release acceptance.

Release acceptance continues to use only registered projects under `acceptance/`. Add a small fixture under `test/` only when it is exclusively owned by one deterministic test and is not a reusable Skill or agent evaluation case.
