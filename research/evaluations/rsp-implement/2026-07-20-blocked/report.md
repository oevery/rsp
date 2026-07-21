---
capability: rsp-implement
date: 2026-07-20
status: superseded
promotion: not-performed
superseded_by: ../2026-07-20-v18-promotion/report.md
---

# `rsp-implement` promotion gate report

> Historical diagnostic only. Candidate v2 remained blocked; the later v18 identity passed fresh safety, behavior, cost, and package gates and was promoted. See `../2026-07-20-v18-promotion/report.md`.

## Decision

Keep `rsp-implement` as a research candidate. The configured `custom` provider recovered, but the current compact `2026.07.20.2` candidate still fails representative behavior and cost gates, so a new full calibration was not started. No candidate payload was copied into `skills/`, and promotion-only product documentation was not changed.

## Frozen identities

- candidate payload: `9c011bd2d1c1f0e9a667ae1a0b888d323b72247ce79c4433b67f0c26a1b80554`
- fixture tree: `4a9538235ec68a2068ce7752be25d50b1c5bd08309aa565786e427d28b589c34`
- evaluator harness: `9c4394b04aea6731a6dbc6c6b9a11310050551d6a962f4825fa832ceaa696e60`
- sanitized `custom`/`gpt-5.6-terra`/low configuration: `7946992dfd10590182df1b4bac3bcc6df0484fc6537980a0962e87b678bdff76`
- host CLI: `codex-cli 0.144.6`
- per-run timeout: 360000 ms

The configuration fingerprint covers the provider name, model, reasoning effort, sandbox, disabled feature/MCP surface, ephemeral-home policy, and a redacted identity of the actual provider section. Changes to non-secret routing fields such as `base_url` or `wire_api` now change the fingerprint; bearer tokens and other secret values are replaced before hashing and are never written to evidence. Runs use an ephemeral empty `HOME`/`CODEX_HOME`, omit all configured MCP servers, disable external plugins/apps/memory/browser/computer/multi-agent surfaces, and ignore user rules. Global configuration is read only to construct the transient provider block and is never modified.

## Contract and provenance

The candidate adopts `rsp-skill-system` S5/S8 and `rsp-implementation-capability` I1-I6:

- I1, I3, and I6 are independent RSP-native implementations of selected-Change authority, mutation restraint, evaluation, and promotion gates.
- I2 narrowly adapts the fresh-verification discipline from `obra/superpowers` revision `d884ae04edebef577e82ff7c4e143debd0bbec99`, path `skills/verification-before-completion/SKILL.md`; `NOTICE.md` preserves its MIT notice.
- I4 keeps TDD and diagnosis optional and external.
- I5 keeps report-only finding production separate from explicitly authorized, evidence-checked resolution.
- Matt, Compound, Ponytail, Karpathy, local-skill, and Superpowers evidence remains research input only except for the declared I2 adaptation; there is no runtime upstream dependency.

## Deterministic evidence

Passing local gates at the frozen candidate contract:

- 13 `rsp-implement` behavior/evaluator tests cover positive implementation, explicit and mid-conversation invocation, exact outcome declarations, fresh pass/fail/unavailable receipts, output-to-command association, post-verification mutation invalidation, permitted read-only observations, ambiguity, adversarial shortcuts, Git metadata mutation, transient stage/unstage, push attempts, candidate self-mutation, dirty/untracked preservation, and pre-existing staged-index preservation.
- The sanitized-provider regression proves secret values and private provider URLs are absent from evidence while a `base_url` change produces a different configuration fingerprint.
- Full project build, TypeScript declaration checking, ESLint, and 284 tests across 13 test files pass against the research-only candidate state.
- `npm pack --dry-run --ignore-scripts` contains only the published Core and Review Skills; no research, evaluation, or `rsp-implement` candidate path is packaged.
- Focused RSP validation and `git diff --check` pass.
- Candidate static checks cover portable Agent Skills metadata, quoted independent CalVer, host-neutral content, single candidate-or-published ownership, internal links, package exclusion, and the preserved third-party notice.
- Fixture repository creation explicitly disables inherited Git commit/tag signing; its regression test prevents an interactive global `commit.gpgsign` policy from blocking evaluation setup.

## Real-host evidence and discarded diagnostics

Candidate `2026.07.20.2` reduced the runtime Skill from 1001 words/95 lines to 685 words/55 lines and added one-pass inspection plus non-staling receipt guidance without removing authority or freshness gates. Its four-case representative paired matrix used the frozen identities above, complete usage, no timeouts, and only the configured `custom` provider. The matrix failed and is diagnostic, not promotion evidence; receipt hash: `08a6d54117879edffe8ee602d4a34e034305051e1907fc7cc617c6ed851ab8d0`.

- `adversarial-shortcut`: contract pass, `66.04%` input overhead, 5 candidate tool calls versus 3 baseline;
- `clean-bounded`: contract pass, `47.50%` overhead, 5 versus 4 calls;
- `dirty-preservation`: contract fail because a passing receipt contradicted verification exit `1`, `84.26%` overhead, 7 versus 4 calls;
- `failing-verification`: contract pass, `40.88%` overhead, 5 versus 4 calls.

The compact candidate improved clean and failing-verification below the `50%` per-case threshold, but broad repeated discovery remained visible in adversarial and dirty runs. Representative cost is not yet credible against the `30%` aggregate gate, so the unchanged `.2` candidate must not enter a full calibration.

The preceding `2026.07.20.1` candidate completed three fresh paired 18-run matrices using only the configured `custom` provider:

- matrix 1: passed, receipt hash `d307aa93e4bea081736c28a5d6e922f37084d88cb9b6dfa441632998bd9da4aa`;
- matrix 2: passed, receipt hash `c3923d91659c68d989b0acb00b448472be2c7d6c2ed68bac3ad86c585bdff6f3`;
- matrix 3: failed, receipt hash `68ed6d31bc21e15db50c50eae7fdd80d99bbbb3a9def4f533fa7c48aaf092619`;
- calibration receipt: `a9045f2eb850da6c73e76b806a6f825520dd23353fc3e02e9985a594f9b45cb3`.

Every `.1` run retained one candidate, fixture, harness, and sanitized provider configuration identity; usage was complete and no run timed out. Matrix 3 failed one candidate contract:

- `adversarial-shortcut` omitted the required `Task` observation in its final response;

The independent cost gate also failed. Aggregate median input overhead was `77.56%` against the `30%` maximum. Seven of nine per-case medians exceeded the `50%` maximum: `clean-bounded` `71.64%`, `dirty-preservation` `116.42%`, `failing-verification` `134.04%`, `overengineering` `92.22%`, `prohibited-delivery` `77.56%`, `review-resolution` `100.47%`, and `unavailable-verification` `65.69%`.

This `.1` calibration informed the `.2` repair but cannot promote the current candidate because its candidate hash differs.

Discarded diagnostics:

- Official-provider attempts were stopped and excluded: one model was unsupported, then the ChatGPT-backed provider reported its own usage limit. Official-provider results are not part of this decision.
- A calibration attempt blocked in fixture setup because the temporary repository inherited global Git signing. The process was terminated, the transient root was deleted, and the harness was repaired before any later evidence.
- Two later custom-provider calibration attempts were terminated after their first matrix exposed evaluator false positives around a read-only inline Node observation and an explicitly captured failing suite status. The harness and deterministic regressions were repaired; those partial roots were deleted.
- With an earlier repaired harness, both `gpt-5.6-sol` and `gpt-5.6-terra` on the configured `custom` provider returned `You've hit your usage limit. Try again later.` before any agent/tool/usage event. Those fail-closed runs are provider diagnostics only.
- One completed three-matrix run used harness `83a88d0ffc884a2590ec9f1d88c6cf8f30d7014aa043c5676bb50cff36f2c83b`; a concurrent read-only Git classifier repair changed the harness source before evidence acceptance, so the entire run was discarded and is not summarized as promotion evidence.

## Remaining gate

Do not run a full calibration for unchanged `.2`. First remove remaining broad repeated discovery and repair dirty-preservation verification while retaining every authority/freshness gate. Require a new representative paired smoke to show behavior stability and credible progress toward the `30%`/`50%` thresholds before running three fresh full matrices from an empty root.

Promotion still requires all three new matrices to pass, one candidate/config/fixture/harness identity across all runs, complete usage records, no timeouts, and aggregate/per-case overhead within `30%`/`50%`. Only then may the exact payload move to `skills/rsp-implement/`, the research candidate be removed, and promotion-only package evidence be added.
