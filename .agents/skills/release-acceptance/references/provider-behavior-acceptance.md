# Skill behavior

Load only with authorized model cost. Select representative `tests/skills/cases` and preview `pnpm run test:skills -- plan --suite <suite>`.

Before execution, confirm the composition, applicable case/project fixtures, provider/auth configuration, session budget and independent read-only judge capability in `tests/skills/README.md`. Missing prerequisites leave behavior unverified; plan/check readiness or adapter success cannot replace them.

Use that README's `run --allow-live --config-file <private-provider-overlay> --max-sessions <root-budget>` command. Shared config supplies executor, task-local worker and judge defaults.

One candidate is sufficient for task acceptance; baseline and holdout are research choices, not obligatory gates. The shared runner retains separate execution and independent judge reports, linked by `matrix.json`. Preserve task, scope, failure, timeout and missing-evidence dimensions. No printed Skill text is required as activation proof. Unsupported action observations remain inconclusive.

Continue independent cases within the authorized budget after ordinary failure or inconclusive results. Stop for cancellation, exhausted budget, concrete authority violations or changed frozen inputs. Keep original execution and judge artifacts. A partial suite is partial evidence, not full matrix acceptance. Neither model nor local success grants publication authority.
