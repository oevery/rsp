# Deterministic acceptance

Load this reference before judging local release validation. Run shared build, package and terminal checks serially.

1. Inspect `release/runner.mjs`, `release/suites/required-cases.json` and `release/README.md` for the current steps, required scenarios and installation boundary. Preview cases with `mise exec -- pnpm run eval:plan`; this does not execute a provider or claim behavioral acceptance.
2. Run `mise exec -- pnpm run release:acceptance`. It builds, checks Skill package structure/security and docs, runs typecheck/lint/code tests, validates case/oracle wiring and exercises the packed installation. The runner emits its aggregate JSON report to stdout; retain authorized logs under ignored `evals/reports/`. Diagnose the first failing step rather than skipping it.
3. Interpret `mode: local-validation` and `status: passed` as local evidence only. Provider evidence is checked when supplied, but `releaseReady` remains false unless the independently reviewed campaign also satisfies the current release gate.

Ordinary `pnpm test` builds and runs deterministic tests under `tests/`; it does not execute model evaluations. Cases/oracles under `evals/` and the suite under `release/` have separate owners. Local adapters validate the harness, not Skill quality.

The tarball installation is isolated and offline by default. If dependencies are not cached, report verification unavailable; obtain explicit network authority before setting `RSP_INSTALL_ALLOW_NETWORK=1`. Preserve user content and never validate by mutating a real consumer checkout. No local result authorizes publication.
