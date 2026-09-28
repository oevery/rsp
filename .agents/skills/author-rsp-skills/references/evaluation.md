# Evaluation

Use evidence proportional to the candidate's behavioral risk. Structure-only edits may need deterministic validation; routing, authority, procedure, or output changes need behavior comparison.

## Compose existing owners

1. Run `mise exec -- pnpm run skills:package-check` for published package metadata and resource paths, plus focused `pnpm run test:package` regressions. For a maintainer-only package, call the same `checkSkillPackage` export with its authored directory. Do not validate discovery symlinks as authored packages.
2. Run `scripts/skill-security-preflight.mjs` when scripts, permissions, egress, dependencies, MCP metadata, or release candidacy make security relevant.
3. Use `mise exec -- pnpm run eval:plan -- --case <case>` and `pnpm run eval:check` for local preparation. For authorized live comparisons, use `pnpm run eval:campaign -- --allow-live --baseline-skills <directory|none> --candidate-skills <directory> --case <case> --model <model> --effort <effort> --config-file <isolated-config> --repetitions 2 --max-sessions 4`. Adjust the explicit session bound to the selected case set. Follow `evals/README.md` for authentication, independent review, budgets and retained evidence; do not invent another report schema.
4. Keep observed guidance exposure, local mutation boundaries, task result and independent semantic review separate. Exposure is not a filesystem-read audit or compliance proof. External-action policy is a mandatory semantic dimension, not a command-text regex. Missing observations stay missing.
5. Use exact assertions for stable protocol values, paths and enums; parse metadata and resource structure. Grade replaceable prose, ownership and authority semantically. Use discriminating positive/negative fixtures and wrong-result controls without placing the expected answer in the execution prompt.

## Candidate comparison

- Bind current and candidate to exact identities and the same acceptance contract.
- A case must target the candidate package and exercise its real capability. When no matching case or live authorization exists, report behavior comparison as unverified; local structural checks cannot establish model behavior.
- Use one to three unseen cases when behavior changes: a positive task, a close negative or collision case when routing matters, and a pressure case when authority matters.
- Fail closed on missing dimensions or identity mismatches. A task success cannot waive a trigger, compliance, or boundary failure.
- Prefer the candidate only when required dimensions do not regress. Cost improvements may support a decision but never replace behavioral evidence.
- Retain original reports and decisions. Use `node evals/runner/cli.mjs revalidate --report <campaign-report>` only for compatible deterministic-grader changes. Input, composition, observer, packet or execution changes require fresh execution; do not retroactively upgrade prior acceptance.

Evaluation produces evidence, not promotion authority. Independent review, acceptance, Git delivery, and publication remain separate actions.
