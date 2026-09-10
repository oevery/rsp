# Deterministic tests

This directory tests executable RSP behavior without a model. Vitest collects only test files here, excluding nested fixtures and holdouts.

- `pnpm test` builds the CLI and runs default product suites, including TUI and portable Skill packaging boundaries.
- `pnpm run test:acceptance` runs full deterministic acceptance: all tests here, build, typecheck, lint, documentation, package and isolated installation checks.
- `pnpm exec vitest run verification/tests/harness` checks provider tooling using fake execution.

Assert returned values, errors, persisted state and observable side effects. Exact strings are appropriate for stable machine contracts or explicit product labels, not arbitrary source fragments, Skill prose, final handoff wording or historical inventory counts.

Provider scenarios belong under `../evaluations/behaviors/` and `../evaluations/workflows/`. Fake execution is never provider acceptance.
