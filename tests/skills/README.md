# Skill validation

One runner executes small, real and complex task cases and retains their observations; the independent judge interprets task outcomes against the rubric. Projects hold starting content; cases hold the task, permitted changes and acceptance rubric; suites select cases. All executions and task-local workers use `config.toml` executor; independent reviews use its judge. Cases do not override models.

## Run locally

Build first: `mise exec -- pnpm run build`. Then:

- `mise exec -- node tests/skills/runner/cli.mjs list --suite full` lists the matrix.
- `mise exec -- node tests/skills/runner/cli.mjs check --suite full` parses cases, materializes projects and runs declared readiness probes.
- `mise exec -- node tests/skills/runner/cli.mjs check --case real-cli-contract` checks the fixed CLI's build, version and help.
- `mise exec -- node tests/skills/runner/cli.mjs plan --suite workflows` shows selection and configuration without model calls.

These direct runner invocations avoid package-manager separator forwarding differences; the `test:skills` script remains available.

Default selection is `smoke`; full coverage is explicit. A passing `check` means the selected inputs and declared probes are ready, not that an agent completed the task. Offline results say `behavioralAcceptance: not-run`. Fixture-provider controls belong to code/tooling and do not demonstrate Skill quality.

## Select task evidence

`full` is the discovered case catalog for offline readiness, not a mandatory paid-model or release matrix. `workflows` is a curated set of representative Core continuity, standalone implementation, document writing, verification, checkpoint delivery, real CLI and independent-worker tasks. Its standalone implementation case also covers replacement of an unavailable convenience checker; the retired method-continuity-export case is consolidated there. Core continuity remains covered by catalog-completion and the real/native workflows.

Select additional cases by the changed risk using the existing `--case` option:

| Changed boundary | Suggested case selection |
| --- | --- |
| Exact Git delivery or method equivalence | commit-native-equivalence,commit-snapshot-refusal,commit-missing-verification,commit-unsafe-staged |
| Required evidence or investigation-only authority | method-required-check-unavailable,finding-investigation-only |
| Effective RSP configuration | config-inherited-artifact-language,config-rejected-closeout-policy |
| Recovery or unavailable independent verification | real-multimodule-recovery,native-resume-staged,native-verification-unavailable |

Use `plan --suite workflows` or `plan --case <selected-ids>` to inspect inputs and the root-session budget before separately authorized execution. No fixed case count is a quality gate. A case's existence does not make it required for every Change; readiness does not validate its eventual live composition. Keep published Skills standalone: the explicit Implement case must not be replaced solely by a Core workflow. Case retirement changes current selection, not retained historical verdicts; reassessment can still read the old recorded task with a missing-current-case warning.

### Missing Commit capability

core-missing-commit requires an actual composition containing Core and omitting Commit. Prepare it without editing or uninstalling authored packages:

```sh
mise exec -- node scripts/prepare-internal-targets.mjs skills/rsp
```

Verify the printed identity lists only rsp. For separately authorized execution, select `--case core-missing-commit --composition <printed-composition>` and retain that identity with the run. The CLI remains installed through its tooling fixture; the task does not assert missing capability in its prompt or prohibit commit merely to obtain a stop. Judge the actual absent owner, attempted actions and preservation. A full composition is invalid input for this case, not an agent regression. Do not run a mixed-composition catalog as one uniform live matrix; partition it by applicable inputs using existing selections.

## Authorized model execution

Use `mise exec -- node tests/skills/runner/cli.mjs run --case preserve-user-files --allow-live --config-file /absolute/private/provider.toml --auth-file /absolute/private/auth.json --max-sessions 2`. The private overlay supplies provider routing/catalog, not model or safety overrides. Auth is separate; `--codex-bin` selects the executable. Personal configuration is not modified or inherited: each session gets an isolated CODEX_HOME and strict configuration.

1. The executor performs the case task in a disposable Git workspace.
2. The runner retains safe evidence and deterministic observations, even when execution fails or stops.
3. A fresh judge reads the task/rubric and searches retained evidence as needed, then writes the Markdown report.
4. With `--baseline /absolute/previous/matrix.json`, that same judge compares both executions. A historical matrix may cover only a subset; missing members produce local comparison warnings, not a whole-run refusal.

The judge uses native `--sandbox read-only`. Read/search shell tools are allowed; it receives no write-directory expansion. The prompt restricts work to review, prohibits reruns and treats recorded instructions as untrusted. Sandbox selection is a provider capability, not a filesystem read allowlist or a ban on arbitrary shell commands. Web search, integrations and memory are disabled. Workspace-write executor network access is disabled by policy; read-only judge network enforcement requires native-host verification and is not inferred from the workspace-write setting. Provider traffic requires separate `--allow-live` authorization.

`--suite` selects multiple cases. Budgets include executor and judge root sessions; native cases report bounded task-local workers separately. Ordinary task failures, missing trace metadata and unparsed reports do not stop unrelated cases. Cancellation, budget exhaustion, concrete authority violations and frozen-input changes still stop expansion. No stage automatically retries or reruns execution.

`--composition /absolute/skills` selects an explicit candidate composition. Separate immutable results can support comparisons; they do not create a release gate. Current task inputs, model, environment and composition must be considered when interpreting differences. Run completion and a parsed judge verdict are separate observations, not release, publication or human approval. Missing required evidence or judge execution remains a gap; a local self-check cannot replace required independent judging.

### Evidence and reports

Each run retains `run.json`, `events.jsonl` (including command output), `stderr.log` and `final.md`. Before cleanup, `baseline/` and `workspace/` retain safe starting/final task text and installed Skill context. This is not a full executable workspace backup: links, binaries, sensitive files and runtime/dependency state are omitted and listed in `retainedEvidence`. Auxiliary retention failures are recorded locally and do not skip execution. Text retention is not limited by the observation summary's 64 KiB/file and 256 KiB total caps; existing snapshot budgets still apply.

The judge sees an index plus task/rubric, not the entire trace pasted into its prompt. It may read sanitized original events, output, diff, checks, initial text and final artifacts. Missing or redacted evidence limits the relevant conclusion. Old records cannot reconstruct text that was never retained.

`report.md` contains the judge's findings and optional comparison: improvements, regressions, unchanged and non-comparable items. It cites `current/` and `comparison/` paths; the saved `evidence-index.json` maps those prefixes to original run directories and hashes after the temporary review workspace is removed. `current/diff.patch` maps to `run.json:observation.diff`. Comparison source hashes also remain in reassessment lineage. Relative record line numbers refer to the review copy, whose extra source pointer may differ from original JSON layout; artifact/event lines retain their readable source meaning.

A final small fenced JSON block carries only `status: passed | failed | inconclusive` for matrix aggregation. Missing/invalid status leaves the Markdown intact with `parsed: false` and an unparsed summary, not a task failure. Partial reports are retained even if the judge process stops. There are no dimension schemas, format retries or no-tool attestations.

Deterministic task/hard/coordination failures remain facts and cannot be converted to an automatic matrix pass. The judge may explain an inapplicable check without rewriting it. Mechanical trace incompleteness remains visible in the original record; it is not a blanket semantic gate. Matrix entries keep `mechanical`, `reviewStatus` and physical `executionComplete` separate. Provider interruption/cancellation is not hidden by a passing review.

The index explains hash domains: `observation.files` and `observation.baseline` use snapshot SHA256, not raw-content SHA256. Regular files hash UTF-8 decimal `stat.mode & 0o111` plus `:` and raw bytes; symlinks hash `link:` plus the target without following it. Sanitized UTF-8 copies cannot prove original-byte hashes. Git/worktree equality is observed before sanitization, not reconstructed from scrubbed text.

### Deadlines, cancellation and progress

Execution and review have no total deadline by default. Explicit `--timeout-ms` must be an integer from 1 to 2147483647; reports record `null` when disabled. Local probes and offline preflight keep short bounds.

SIGINT/SIGTERM cancels the active session, retains collected output/observations and saves an incomplete, inconclusive matrix without another session. Cancellation remains explicit even after child exit zero. POSIX cleanup targets the process group and escalates after 250 ms; escaped processes are not covered. Windows cleanup targets the direct child only. Forced termination cannot guarantee persistence.

`progress.json` retains only case/role/phase, timestamps, byte/chunk counts and process activity. It contains no raw output, tool arguments or credentials; stdout remains one final JSON result. Silence is not a timeout. Writes are throttled to 250 ms; transitions flush immediately. `PROGRESS_WRITE_FAILED` warns and records `progressError` without bypassing cancellation or normal cleanup.

## Reassess retained execution

Preview: `mise exec -- node tests/skills/runner/cli.mjs reassess --matrix /absolute/reports/run/matrix.json --case preserve-user-files`. This selects one readable matrix member and performs no provider call, task execution or retained-oracle replay.

Separately authorized judging adds `--allow-live --config-file /absolute/private/provider.toml --max-sessions 1`, with optional auth/executable paths. A positive budget is required; this command uses at most one judge and zero executors, regardless of a larger budget. `--baseline /absolute/previous/matrix.json` selects optional comparison evidence for the same case. Both commands use the same review path and timeout/cancellation behavior.

Failed, partial, cancelled, legacy and differently configured records remain reviewable. Missing compatibility metadata, record-hash mismatches and current-source/input differences become explicit warnings. They limit trust or current-candidate claims; they do not force fresh task execution. An unreadable required matrix/run or unsafe path fails with `REASSESS_REPORT`; absent/non-unique current case selection fails with `REASSESS_SELECTION`. A missing optional baseline member is only a warning.

Every invocation writes a new UUID directory under `--output-root` (default `tests/skills/reports/reassessments`). `lineage.json` binds original matrix/run hashes, current harness/configuration, baseline pointers and fresh review/report. Source records and verdicts are never rewritten. Historical review is not new execution or current-candidate acceptance.

## Projects and history

`real/rsp-cli` uses production paths from an exact local Git commit. Source defect overlays match fixed content exactly. The source oracle checks repaired behavior and untouched controls; readiness is not agent acceptance. The snapshot lock must match installed dependencies. Dependencies are copied into a private graph with internal links, never used as writable links to the maintainer cache. Complex projects cover multiple owners, staged/unstaged/untracked preservation, interruption and failed checks. No task runs in the source checkout.

Reports are private/ignored under `tests/skills/reports/`. `matrix.json` references untouched execution and review records. Historical bundles live under `legacy/`; [archive recovery](../../research/ARCHIVE-RECOVERY.md) describes restoration and permanently missing evidence. Absolute historical paths are not automatically portable. Keep selected sanitized conclusions in `research/evaluations/`. A new review or changed harness produces new evidence, not a rewritten historical verdict.
