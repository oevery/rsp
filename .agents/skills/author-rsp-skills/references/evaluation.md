# Evaluation

Select evidence by candidate risk and the claim being made. Structure-only changes may need metadata/resource checks; changed authority, routing or task behavior needs actual task execution before behavioral claims. Keep the selected candidate, baseline, cases and required evidence fixed while choosing permitted methods.

## Establish the static target

- Validate product packages with `pnpm run skills:package-check`. For maintainer-only packages, import `checkSkillPackage(directory)` from `scripts/skill-package-check.mjs` and require `{ status: 'passed', errors: [] }`; the default inventory covers only `skills/`. Pass the real authored directory, not a discovery projection. Run focused `pnpm run test:code -- tests/code/package` when package behavior changes, building first when CLI artifacts are exercised.
- Run the existing security preflight when permissions, egress, dependencies or executable content change. Its default `root/skills` target excludes maintainer-only packages; use [internal targets](internal-targets.md) to bind security and composition checks to selected real packages.

## Prepare and execute task evidence

Prepare cases/projects with `pnpm run test:skills -- plan --case <ids>` and `pnpm run test:skills -- check --case <ids>`. They do not consume `--composition` or establish internal-candidate evaluation.

Before executing:

- Follow `tests/skills/README.md` for separate execution authority, shared executor/judge configuration and retained evidence.
- For internal candidates, use the explicit composition and applicable project/tool fixtures in [internal targets](internal-targets.md).

Missing authority, authentication, applicable cases, provider capability or required independent judging leaves behavior unverified; offline readiness supplies none of these.

## Interpret and return

- Judge actual task outcomes, scope and truthful verification. Stable metadata, paths, enums and output values may have exact assertions; Skill prose, reading commands and activation fingerprints must not be acceptance gates.
- For review tasks, judge whether Code/Document responsibilities match fixed reviewed content and whether claims, behavior and findings agree. Complete Skill instructions normally need both perspectives; incidental reference exposure proves neither correct selection nor failure. A material scope or contract violation cannot pass merely because the main defects were found or the workspace stayed unchanged.
- For comparative claims, run current and candidate compositions separately with the same cases, projects and shared settings. Comparison and unseen/holdout cases are optional research design, not ordinary test or release prerequisites.

A local adapter or readiness pass is not Skill acceptance. Diagnose tool-only obstacles without waiving named checks or changing their target. Inspect partial outputs and side effects before safe continuation; unknown mutation or unsafe replay stops recovery. Preserve original reports and verdicts; return candidate-bound results and gaps for Core's Focus/Change writeback, not copied run history. Changed inputs or execution need new runs, not retroactive relabelling; paid reruns need authorization. Evaluation grants no promotion, Git, archive or publication authority.
