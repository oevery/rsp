# Evaluation

Select evidence by candidate risk and the claim being made. Metadata/resource checks cover structure; changed authority, routing or task behavior needs actual execution before behavioral claims. Keep candidate, baseline, native tasks and required evidence fixed while choosing permitted methods.

## Establish the static target

- Validate product packages with `pnpm run skills:package-check`. For maintainer-only packages, import `checkSkillPackage(directory)` from `scripts/skill-package-check.mjs` and require `{ status: 'passed', errors: [] }`. Pass real authored directories, not discovery projections. Package behavior changes use focused code checks, building first when CLI artifacts are exercised.
- Run security preflight when permissions, egress, dependencies or executable content change. Its default `root/skills` excludes maintainer-only packages; use [internal targets](internal-targets.md) for selected real packages.

## Prepare and execute task evidence

From the repository root, run `uv sync --project tests/skills --frozen`, then `uv run --project tests/skills python tests/skills/evaluate.py check`. This validates native task schemas offline; it neither runs an agent nor proves container readiness or internal package/tool closure.

Follow `tests/skills/README.md` for Harbor 0.24.0 and harbor-rewardkit 0.2.3 setup, Docker image preparation, runtime credentials and separate execution authority. Select repeatable `--task ID`, `--attempts N` and `--agent codex|oracle|nop` with `evaluate.py run`. Codex requires `--allow-live`. Configure candidate skills through native job `agents[].skills`; internal candidates use [internal targets](internal-targets.md).

Use `RSP_EVAL_OFFLINE=1` only for oracle/nop calibration. It skips semantic judging and cannot establish Skill acceptance. Missing authority, authentication, applicable tasks, provider capability or required independent judging leaves behavior unverified.

## Interpret and return

Judge actual task outcomes, scope and truthful verification. Stable metadata, paths and output values may have exact assertions; Skill prose, reading commands and activation fingerprints are not acceptance gates. For review tasks, assess whether Code/Document responsibilities match the fixed content and whether findings agree with observed behavior. A material authority violation cannot pass merely because the main defects were found or the workspace stayed unchanged.

Use Reward Kit `aggregation = "threshold"` with `threshold = 1` and positive weights for full-score acceptance. Keep this calibrated policy and historical scoring semantics unchanged when upgrading the verifier. Judge/provider/verifier errors remain ungraded evidence gaps. Inspect native trial artifacts and verifier details, not reward alone.

For authorized comparative claims, run candidate and baseline separately with matched native tasks, environments and settings. `evaluate.py report JOB --baseline BASELINE_JOB` compares recorded evidence without new execution. Comparisons and holdouts are optional research choices. For efficiency comparisons, distinguish shell-command batches from model/tool interactions and cached from noncached input; cumulative input is not unique read content or monetary cost. Separate failed/incomplete trials from matched successful-task aggregates while retaining all outcomes, and attribute changes to task and actor where records permit. One pair does not establish causality or reliability; counts are diagnostics, not acceptance gates. Preserve original jobs under ignored `tests/skills/reports/` and selected sanitized conclusions under `research/reports/`. Changed candidate inputs need new execution; verifier regrade produces a new job, not a rewritten verdict or fresh agent run. Follow the README for resume and regrade preservation and authority.

Return candidate-bound results and gaps to the caller, using the selected Change when tracked; do not copy run history. Diagnose tool-only obstacles without waiving named checks; inspect partial effects before safe continuation. Evaluation grants no promotion, Git, archive or publication authority.
