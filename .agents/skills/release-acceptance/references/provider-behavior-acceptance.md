# Skill behavior

Load to plan or interpret behavior evidence; this method grants no model-call authority. Select representative native tasks under `tests/skills/tasks/` for the changed risk. `uv run --project tests/skills python tests/skills/evaluate.py check` validates task schemas offline. Package release runs only this offline Skill check and never automatically starts paid execution.

Before execution, require separate cost and execution authority and confirm candidate source, native job skills, applicable task environments, Docker image, runtime provider credentials, attempts and required semantic judging. Follow `tests/skills/README.md` for the pinned Harbor 0.24.0 and harbor-rewardkit 0.2.3 environment and exact commands.

Run selected tasks through `evaluate.py run --task ID --attempts N --agent codex --allow-live`; repeat `--task` for multiple tasks. `jobs/default.yaml` supplies native job settings and skills. Runtime `OPENAI_BASE_URL`/`OPENAI_API_KEY` route the executor; `RSP_JUDGE_BASE_URL`/`RSP_JUDGE_API_KEY` route the judge. `RSP_EVAL_OFFLINE=1` is limited to oracle/nop calibration, which is not Skill acceptance.

Build the image with `python3 tests/skills/build_image.py` so it contains the actual RSP CLI. Native agent configuration injects only selected candidate Skills; task workspaces contain no baked-in Skills. For loopback proxies, follow the README runtime `host.docker.internal` routing and optional `RSP_API_HOST`/`RSP_JUDGE_HOST` header settings. Never modify global configuration; container connectivity alone is not behavioral acceptance.

Interpret native job/trial results, agent artifacts and verifier details together. For full-score acceptance use threshold aggregation at `threshold = 1` with positive weights. Keep this calibrated policy and historical scoring semantics unchanged when upgrading the verifier. Provider, judge and verifier errors remain ungraded gaps. Reward or printed Skill text cannot establish authority compliance or required independent acceptance.

One candidate is sufficient for task acceptance; baselines and holdouts are optional research choices. A partial selection or interrupted job proves only the observed boundary. Preserve original jobs under ignored `tests/skills/reports/`; keep sanitized conclusions in `research/reports/`. Use the README wrapper resume and regrade paths to preserve retry records and replacement-verifier inputs for authorized reassessment. Neither operation is an automatic response to failure. Local and model results grant no publication authority.
