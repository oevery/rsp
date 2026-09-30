# Skill validation

One runner owns small, real and complex tasks. Projects hold reusable starting content; cases hold user requests, permitted changes and observable/semantic acceptance; suites select cases without duplicating execution. All model tasks and task-local workers use `config.toml` executor; fresh independent judges use its judge. Cases and role files do not override models.

## Run locally

Build first: `mise exec -- pnpm run build`. Then:

- `mise exec -- pnpm run test:skills -- list --suite full` lists the matrix.
- `mise exec -- pnpm run test:skills -- check --suite full` parses cases, materializes isolated projects and runs declared readiness probes.
- `mise exec -- pnpm run test:skills -- check --case real-cli-contract` builds the fixed real CLI and checks its actual version/help.
- `mise exec -- pnpm run test:skills -- plan --suite workflows` shows selection and shared configuration, without model calls.

Default selection is `smoke`; full coverage is explicit. Offline output says `behavioralAcceptance: not-run`. Model-free oracle controls belong to code/tooling and never demonstrate Skill quality.

## Authorized model execution

Use `mise exec -- pnpm run test:skills -- run --case preserve-user-files --allow-live --config-file /absolute/private/provider.toml --auth-file /absolute/private/auth.json --max-sessions 2`. The private provider-only overlay supplies routing/catalog, not model or safety overrides; auth is separate. `--codex-bin` may select the local executable. Personal global configuration is never modified or inherited. The adapter builds a fresh CODEX_HOME and invokes strict configuration plus workspace-write sandbox; unavailable capabilities fail closed.

This evaluates one candidate without baseline or holdout. `--composition /absolute/skills` selects a different explicit composition for research comparisons using the same runner; compare separate immutable results under equal inputs rather than manufacturing a release gate. `--suite` selects multiple cases; budgets include task and judge root sessions. Native cases additionally dispatch bounded task-local workers (at most two concurrent, depth one); their invocations are reported separately and are not implied to fit a root-session count.

Each successful mechanical execution receives a fresh, no-tool judge session. Failures or inconclusive evidence stop expansion; there are no hidden retries. Missing host observations stay missing. The report binds case/project, source/build, dependencies, composition, effective executor/judge settings and retained results. A model report is not trusted merely because its summary says passed: local file/Git observations and packet-bound independent review remain separate evidence.

## Project and safety boundaries

`real/rsp-cli` uses production paths from an exact local Git commit, shared by CLI contract verification, a natural maintainer walkthrough, an injected issue-URL defect and two-module interrupted recovery. Source defect overlays are exact and fail if the fixed source no longer matches. The source oracle tests repaired behavior and rejects untouched regressions; readiness checks both controls without claiming agent completion. Its lock must match the installed dependency lock. Required dependency packages are copied into a private graph, with only internal links; their content identity is retained. Build and task execution do not write through links to the maintainer dependency cache. Additional complex checkout projects cover multiple owners, staged/unstaged/untracked preservation, interruption and failed verification. Every case gets a fresh Git workspace; no task runs in the source project checkout.

Provider network traffic is separately authorized by `--allow-live`. Tool workspace-write sandboxing, disabled integrations and default-disabled workspace network reduce capabilities; configuration is not filesystem read isolation or a proof of no external effects. Unsupported tool evidence makes semantic review inconclusive. No real project external checkout is modified.

## Results and history

New raw reports are private/ignored under `tests/skills/reports/`. `matrix.json` references untouched execution and review results; local adapters are labelled separately. Keep meaningful sanitized conclusions in `research/evaluations/`. Original `evals/reports/` remains an inactive ignored historical location so embedded paths are preserved. Old campaign/release/replay commands are intentionally removed; rerunning a changed harness yields new evidence, never upgrades old failures.
