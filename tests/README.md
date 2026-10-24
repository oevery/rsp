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
- `mise exec -- pnpm test:diagnostics` optionally replays retained command-construction and native-evidence examples, isolated Shell exit-code controls and Git commit-stop controls under `tests/diagnostics/`. These checks preserve diagnostic value; they do not exercise current Skill behavior and are not release gates. Original evidence fixtures remain unchanged.
- After building, `mise exec -- pnpm test:pack` checks an isolated installed package. Without `TARBALL` it packs once; an absolute `TARBALL` selects the existing candidate directly. The regression suite checks this path without allowing a replacement pack and verifies unchanged archive bytes.
- `mise exec -- uv sync --project tests/skills --frozen` installs Harbor 0.24.0 and harbor-rewardkit 0.2.3. Then `mise exec -- uv run --project tests/skills python tests/skills/evaluate.py check` validates native task schemas offline, without containers or models. See [Skill evaluation](skills/README.md) for task selection, calibration and separately authorized execution.

For targeted CLI checks, build first: `mise exec -- pnpm run build && mise exec -- pnpm exec vitest run --no-file-parallelism tests/code/integration/cli-lifecycle.test.ts`. The `test:code` entry does not refresh CLI artifacts; appending `-- path` to that package script does not reliably restrict Vitest selection, so use the direct command for a focused run. Skill prose and reading patterns are not code-test assertions; parsed metadata and resource closure remain package contracts.

`release:check` and `prepublishOnly` aggregate local checks. Their `pnpm run test:skills check` step performs only offline native task schema checks, with no `--suite` argument: no image build, agent execution, judge calls or automatic paid acceptance. Passing schemas is not behavioral evidence. Release and publication require separate authority. Package installation tests use a temporary consumer and an explicit npm_config_cache/NPM_CONFIG_CACHE, or the default .cache/rsp-package-install cache. The supplied-candidate regression packs once and uses its successful verification to warm the default cache; both explicit-empty-cache controls consume that same archive offline without repeating successful CLI verification or packing. They use fresh consumers, reject fallback to the warm default, and preserve the archive digest. Installation defaults to offline mode; missing cached dependencies mean unavailable verification. Explicit `RSP_INSTALL_ALLOW_NETWORK=1` permits authorized cache population.

CI runs parallel code/docs jobs at the exact source SHA and always checks/builds the documentation artifact. CI and Publish share configured product checks. Publish reuses complete successful CI only at the exact native SHA; missing or reduced docs-only CI, query failure and timeout require full fallback. Fatal lookup inputs block publication, and full fallback must succeed with a matching SHA. Actual TARBALL installation and byte checks still run before publication. Only ordinary CI enables the documentation-only optimization. Code checks may install consumer dependencies over the network but never run models. Workflow wiring tests require one full toolkit SHA across shared workflow/action calls and cover parallel code/docs jobs, CI-reuse/fallback gates, candidate handoff and credential boundaries, without mirroring incidental cache layouts; generic publication/recovery regressions remain in Xova Actions. Verify changed lockfiles with a fresh frozen installation as well as the required checks. See the [maintainer guide](../docs/site/en/contributing.md) or [中文指南](../docs/site/zh-CN/contributing.md) for workflow entries, npm/Cloudflare setup and documentation recovery.

Native jobs and preserved historical evidence remain private under ignored `tests/skills/reports/`. Keep selected sanitized conclusions in time-named Markdown under `research/reports/`. Retain records needed for active investigations; historical verdicts do not establish current acceptance.

## Maintainer tools

Root scripts own deterministic maintenance; `tests/code/tooling/` checks observable CLI results. Diagnostics cannot waive required checks, replace independent evidence or authorize replay of uncertain mutations.

- [Skill context scanner](../scripts/scan-skill-context.mjs): `node scripts/scan-skill-context.mjs --root . --package .agents/skills/author-rsp-skills --json`. Repeat `--package` for explicit targets or omit it for discovery. Counts, reachability and repetition are diagnostics, not quality gates.
- [Internal target preparation](../scripts/prepare-internal-targets.mjs): pass real authored package directories as positional arguments. JSON returns `root`, `composition`, `skills` and `fileCount`. Use the prepared root for security checks and selected package paths for native Harbor agent skills. The helper emits no hash identity. Root tools retain code-test/lint coverage.

Run focused regressions with `mise exec -- pnpm exec vitest run --no-file-parallelism tests/code/tooling/skill-context.test.js tests/code/tooling/internal-targets.test.js`. Metadata/resource validation remains with `scripts/skill-package-check.mjs`.
