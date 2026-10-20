# Tests

Choose evidence for the changed boundary. Run commands from the repository root with locked dependencies installed; coordinate shared build and Docker resources before execution.

Install mise first, inspect the project configuration, then prepare the selected maintainer tools and dependencies:

```sh
mise trust
mise install
mise exec -- pnpm install --frozen-lockfile
mise exec -- uv sync --project tests/skills --frozen
```

Root mise.toml selects Node and pnpm major lines and Python and uv minor lines. Patch updates stay within these ranges; use mise upgrade deliberately when updating installed tools. uv uses the selected mise Python rather than downloading another interpreter. Package locks own library dependencies; package.json engines remains the consumer compatibility range. Docker and Compose are host prerequisites for container evaluation, not prerequisites for code tests. Change runtime ranges in mise.toml and rebuild the evaluation image through its helper; agent/judge versions remain with their evaluation configuration.

- `mise exec -- pnpm test` builds and runs observable CLI/domain/TUI, package installation and maintenance-tool checks under `tests/code/`.
- `mise exec -- uv sync --project tests/skills --frozen` installs Harbor 0.24.0 and harbor-rewardkit 0.2.2. Then `mise exec -- uv run --project tests/skills python tests/skills/evaluate.py check` validates native task schemas offline, without containers or models. See [Skill evaluation](skills/README.md) for task selection, calibration and separately authorized execution.

For targeted CLI checks, build first: `mise exec -- pnpm run build && mise exec -- pnpm exec vitest run --no-file-parallelism tests/code/integration/cli-lifecycle.test.ts`. The `test:code` entry does not refresh CLI artifacts; appending `-- path` to that package script does not reliably restrict Vitest selection, so use the direct command for a focused run. Skill prose and reading patterns are not code-test assertions; parsed metadata and resource closure remain package contracts.

`release:check` and `prepublishOnly` aggregate local checks. Their `pnpm run test:skills check` step performs only offline native task schema checks, with no `--suite` argument: no image build, agent execution, judge calls or automatic paid acceptance. Passing schemas is not behavioral evidence. Release and publication require separate authority. Package installation tests use a temporary consumer and offline cache; missing cached dependencies mean unavailable verification. Explicit `RSP_INSTALL_ALLOW_NETWORK=1` permits authorized cache population.

Native jobs and preserved historical evidence remain private under ignored `tests/skills/reports/`. Keep selected sanitized conclusions in time-named Markdown under `research/reports/`. Retain records needed for active investigations; historical verdicts do not establish current acceptance.

## Maintainer tools

Root scripts own deterministic maintenance; `tests/code/tooling/` checks observable CLI results. Diagnostics cannot waive required checks, replace independent evidence or authorize replay of uncertain mutations.

- [Skill context scanner](../scripts/scan-skill-context.mjs): `node scripts/scan-skill-context.mjs --root . --package .agents/skills/author-rsp-skills --json`. Repeat `--package` for explicit targets or omit it for discovery. Counts, reachability and repetition are diagnostics, not quality gates.
- [Internal target preparation](../scripts/prepare-internal-targets.mjs): pass real authored package directories as positional arguments. JSON returns `root`, `composition`, `skills` and `fileCount`. Use the prepared root for security checks and selected package paths for native Harbor agent skills. The helper emits no hash identity. Root tools retain code-test/lint coverage.

Run focused regressions with `mise exec -- pnpm exec vitest run --no-file-parallelism tests/code/tooling/skill-context.test.js tests/code/tooling/internal-targets.test.js`. Metadata/resource validation remains with `scripts/skill-package-check.mjs`.
