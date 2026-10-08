# Optional comparison

Run only an explicitly authorized comparison. Hold native task definitions, environment inputs, attempts and relevant job settings fixed while selecting candidate package paths through `agents[].skills`. Execute each candidate as a separate Harbor job using the commands and runtime routing in `tests/skills/README.md`; retain each native job configuration and its source revision or recorded local delta. Baseline pairing is not required for ordinary candidate validation.

Use `uv run --project tests/skills python tests/skills/evaluate.py report JOB --baseline BASELINE_JOB` to compare recorded jobs without new agent or judge calls. Compare correctness and authority before token, call or time costs, using only retained metrics. State source, dependencies, task selection, skills, provider/model settings and gaps. Missing or incompatible trials limit comparison; do not synthesize matches or convert ungraded errors into scores.

A verifier-only regrade produces new judging evidence from retained agent artifacts, not fresh execution with a candidate. Oracle/nop offline calibration supplies no semantic Skill result. Native worker claims require attributed execution evidence. Preserve old jobs and verdicts, keep selected sanitized conclusions in `research/reports/`, and never manufacture a release pass by merging independent results.
