# Tests

There are two verification lanes. Run commands from the repository root after installing the locked dependencies.

- `mise exec -- pnpm test`: builds first, then runs the complete code suite for observable CLI/domain/TUI behavior, package installation and small runner reliability regressions under `tests/code/`.
- `mise exec -- pnpm run test:skills -- check --suite full`: offline case and project readiness. This does not call models. See [Skill validation](skills/README.md) for separately authorized execution and review.

For targeted CLI verification, explicitly build first: `mise exec -- pnpm run build && mise exec -- pnpm run test:code -- tests/code/integration/cli-lifecycle.test.ts`. The `test:code` entry does not build or automatically refresh CLI artifacts. `dev` remains a development build watcher, not a test runner. Skill prose and fixed reading patterns are not code-test assertions. Parsed metadata and resource closure remain package contracts.

`release:check` and `prepublishOnly` only aggregate existing checks. They do not create a third test system or certify Skill quality. The package test installs a tarball into a temporary consumer with an offline cache; missing cached dependencies are unavailable verification, not a pass. Explicit `RSP_INSTALL_ALLOW_NETWORK=1` permits cache population when authorized.

Historical raw runs remain ignored under `evals/reports/`; new raw results go to ignored `tests/skills/reports/`. Retained research conclusions are not rewritten by a harness migration.
