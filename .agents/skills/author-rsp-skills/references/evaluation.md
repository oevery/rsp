# Evaluation

Use evidence proportional to the candidate risk. Structure-only changes may need metadata/resource checks; changed authority, routing or task behavior needs actual task execution before behavioral claims.

1. Run `pnpm run skills:package-check` and focused `pnpm run test:code -- tests/code/package` for package contracts. Maintainer-only packages use the same checkSkillPackage export with their authored directory. Do not validate discovery projections as authored sources.
2. Run the existing security preflight when permissions, egress, dependencies or executable content change.
3. Use `pnpm run test:skills -- plan --case <ids>` and `pnpm run test:skills -- check --case <ids>` for offline preparation. Follow `tests/skills/README.md` for separately authorized execution with the shared executor/judge configuration and retained evidence.
4. Judge actual task outcomes, scope and truthful verification. Stable metadata, paths, enums and output values may have exact assertions; Skill prose, reading commands and activation fingerprints must not be acceptance gates.
5. For comparative claims, run current and candidate compositions separately with the same cases, projects and shared settings. Comparison and unseen/holdout cases are optional research design, not ordinary test or release prerequisites.

A local adapter or readiness pass is not Skill acceptance. Missing model execution, observations or independent review remain unverified. Preserve original reports; changes to inputs or execution require new runs, not retroactive relabelling. Evaluation grants no promotion, Git, archive or publication authority.
