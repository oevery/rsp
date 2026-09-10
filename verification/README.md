# Verification

Code verification and provider evaluation answer different questions. Local success does not establish model behavior; an unavailable provider does not fail the code suite.

## Commands

| Command | Scope | Provider calls |
| --- | --- | --- |
| `mise exec -- pnpm test` | Build and default product regression tests | None |
| `mise exec -- pnpm run test:acceptance` | Full serial deterministic checks, all Vitest tests, package and disposable-project acceptance | None |
| `mise exec -- pnpm run eval:behavior -- --list` | List focused behavior cases | None |
| `mise exec -- pnpm run eval:workflow -- --list` | List complete workflow cases | None |

Run a focused code test with `mise exec -- pnpm exec vitest run <test-path>`. Harness tests under `verification/tests/harness/` use fake processes or synthetic observations, not a model.

Preview a provider case with `eval:behavior -- --case preserve-user-files --plan` or `eval:workflow -- --case implement-and-verify --plan`. Omitting `--run` never starts a provider. See [evaluations](evaluations/README.md) for explicit live execution.

## Ownership

- `tests/`: deterministic tests grouped by the code they exercise.
- `acceptance/`: isolated package, installation, CLI and project fixtures; no model required.
- `evaluations/behaviors/`: one decisive behavior per active case.
- `evaluations/workflows/`: complete tasks judged by artifacts, boundaries and semantic criteria.
- `harness/`: shared execution and reporting. The existing provider process adapter remains in `scripts/managed-controller-eval.mjs`; both evaluation commands use its outcome mode.
- `artifacts/`: ignored local runs. Retained research reports remain under `research/evaluations/`.

Active cases keep their manifest, private fixture or explicit shared-fixture reference, and trusted result check together. There is no second global registry, scenario index or synthetic all-layer score.

## Verdicts

Provider execution is `completed`, `infrastructure-failed`, or `evidence-insufficient`. Acceptance is separately `passed`, `failed`, or `inconclusive`. Wording and tool-order differences are not failures unless they are the selected requirement. Observable product errors or authority violations cannot be overridden by a success claim.

Cases with a semantic rubric remain inconclusive until their artifacts, final response and recorded events are reviewed. No extra model is silently invoked as a judge. Missing evidence is never a pass.

Evaluation exit codes: `0` for evidenced automatic acceptance, `1` for observed behavior failure, `2` for unavailable execution or insufficient evidence, including pending semantic review. Listing and planning return `0` without claiming acceptance.

## Migration

The former `verify:*`, `test:extended` and `test:evaluation` entry points are retired. Use `test:acceptance` for complete deterministic verification, `test:release` for release-tool tests, and the explicit evaluation commands for model behavior. Old local and synthetic campaign reports are historical observations, not current readiness.

Existing `release:provider-behavior`, `release:provider-compare` and exact release-evidence reuse remain explicit historical/release operations. Their fixed comparison identities and legacy receipt rules do not apply to the new case commands. New outcome reports do not silently satisfy the existing exact release gate. Publication policy and historical reports are not rewritten by this migration.

Run shared build, package and Git-fixture checks serially. Do not delete raw evidence needed for replay or commit credentials, private traces, provider sessions or temporary workspaces.
