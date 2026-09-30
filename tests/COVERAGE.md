# Verification boundaries

| Risk | Owner | Limit |
| --- | --- | --- |
| Domain state, readiness and path rules | code/unit | Deterministic contracts only |
| CLI lifecycle, preservation and locks | code/integration | Disposable local projects; explicitly build before targeted CLI checks |
| Terminal interaction | code/integration/tui | Simulated terminal; real host acceptance is separate |
| Metadata/resource closure, install migration and packed CLI | code/package | No semantic Skill acceptance |
| Process failures, observations, Git scope, dependency isolation, judge contamination | code/tooling | Local adapters, no model-quality claim |
| Individual capabilities and natural workflows | skills/cases and skills/suites | Only executed, independently reviewed cases support acceptance |
| Fixed real CLI source and complex multi-owner workflows | skills/projects/real and skills/projects/complex | Offline readiness is not agent completion |

Choose tests by changed risk, not file count. Do not mirror Skill prose, historical report fields or internal call structure. Native coordination requires host-attributed workers; successful task output alone does not prove dispatch. Full suites select representative cases rather than a cross product of every Skill and project.

`pnpm test` builds before running the complete code suite. Targeted CLI checks require an explicit `pnpm run build` before `pnpm run test:code -- <test-file>`; automatic rebuild-on-test-watch is not a coverage contract.
