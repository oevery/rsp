# Deterministic code tests

The tests directory contains tests for RSP production code and the deterministic evaluation engine. Tests assert public values, errors, persisted artifacts and observable side effects.

Skill behavior belongs under evals/. Release candidate orchestration belongs under release/.

pnpm run test:watch builds the CLI before the first run and before every rerun.
Changes under src/, bin/, rules/ or skills/, or to the build configuration, trigger
the suite even when a test only accesses the built CLI through a subprocess.

The current regression set covers CLI initialization, completion/archive/reopen,
dependency completion, update preservation and managed-path symlink refusal,
live-lock protection, Group/history and recovery-capsule behavior, Specs/config
boundaries, terminal routing and interactive Skill replacement confirmation,
package boundaries, and the evaluation engine's process, artifact, pairing,
offline replay, workflow fixtures, holdout, independent review and release
evidence contracts. Provider tests use an explicit local executable fixture;
they do not contact a model or establish real provider acceptance.

The installer migration tests exercise the seven-default inventory, explicit
old-name conflicts/force preview, optional audit mapping, rollback, unrelated
content and symlink refusal. They do not install into an external project or
establish real interactive continuation through a user decision.

This set is not a claim of equivalence to every removed legacy assertion.
Add coverage for observable risk at the owning seam, not copies of Skill prose
or generated artifacts. External/hardware/UI acceptance remains separate.

See COVERAGE.md for the production risk, decisive evidence and remaining acceptance
boundary. Evaluation fixture source is test data and is excluded from lint/format
passes so intentionally broken or differently formatted samples remain intact.
