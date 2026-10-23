# Skill evaluation

RSP uses Harbor 0.24.0 for native tasks, jobs, agents and retained execution, with `harbor-rewardkit==0.2.3` for verification. `evaluate.py` prepares native jobs and presents their evidence through `check`, `run`, `calibrate`, `regrade`, `resume` and `report`. Task definitions live in `tasks/`; `jobs/default.yaml` supplies native job configuration and agent skills. Use the [assessment contract](assessment.md) for grading responsibility and equivalent outcomes, the [coverage matrix](matrices/evaluation.md) to select current task families, and [task migration](migration.md) for historical mapping and gaps.

## Prepare from the repository root

First install the project toolchain following [maintainer setup](../README.md). The image helper resolves the actual installed Node, Python and pnpm versions through mise and passes those full versions to Docker; use the helper rather than invoking its parameterized Dockerfile directly.

```sh
mise exec -- uv sync --project tests/skills --frozen
mise exec -- uv run --project tests/skills python tests/skills/evaluate.py check
mise exec -- python tests/skills/build_image.py
```

Schema checking needs no Docker daemon or credentials and makes no model calls. The image helper builds the actual RSP CLI with `mise exec -- pnpm run build`, stages its package and builds `rsp-eval-agent:2026-10-08`. It needs installed repository dependencies, mise and Docker, and may download image dependencies. Image building is separate from package release checks. Task execution also needs Docker. Inspect selected task instructions, environments, solutions and verifiers. A schema pass establishes neither container readiness nor task success.

Before creating a new run, calibration or regrade job, the wrapper compares the actual image bytes with the local CLI package, baked verifier support, dependency lock and Dockerfile. Missing or changed files stop preparation with a rebuild instruction. Rebuild after changing those inputs. This check uses a disposable network-disabled container and makes no model calls; it checks candidate agreement, not task behavior. Resume retains its saved-input and image-identity checks.

All tasks use one shared runtime image; task directories contain no Dockerfiles. Editing a task workspace, setup or private test does not require an image build. Changes to the baked CLI, common verifier support or dependencies still require rebuilding the shared image.

For new runs and calibration, preparation copies each selected workspace into a temporary directory and mounts only that copy, the read-only setup script and a separate initial-state output directory into a network-disabled preparation container. The container uses the selected immutable runtime image ID; it never mounts the repository or private tests. After setup succeeds, the wrapper freezes the initialized workspace (including Git state) as the task's `environment/` and stores the initial state privately in `tests/baseline.json`. Failure stops preparation; timeout cleanup removes only the named preparation container.

Harbor's native prebuilt-image upload copies `environment/` into each independent agent container at `/app`. The separate verifier uses the same runtime image, receives recorded artifacts and uploads private tests through Harbor's normal verifier path. Do not add a task/test Dockerfile or an explicit verifier image: those select Harbor's bundled-test path and disable dynamic private-test upload. The authored workspace is never an agent-writable host mount. Keep the shared image and frozen inputs available for resume; no per-task image cache is required. Business expectations remain independent of captured initial state.

Shared preservation checks compare protected file contents and permission modes with that saved state, alongside Git history/index and write-scope checks. Authorized mutable paths remain exempt from content/mode preservation. Older saved states without mode metadata cannot establish this check: the current verifier reports unavailable evidence rather than guessing permissions from the final workspace. Historical verdicts and frozen inputs remain unchanged.

Before new execution or resume, the wrapper also checks prepared file modes against the same saved initial state for directories Harbor will upload. Drift or unavailable metadata stops before native dispatch; resume stops before creating attempt backups. It never repairs the input or writes another digest ledger. Legacy image-baked tasks do not upload these directories and retain their native path. Regrade and regrade-resume skip this upload check because they consume recorded artifacts, not the prepared agent workspace; existing lock and grading checks still apply.

For the native Codex environment boundary, an explicit offline probe invokes bare `apply_patch` through `bash -lc` and exercises Skill registration, configuration, session copying on resume and cleanup. It also checks that the command remains executable after the transient home is removed. It replaces model execution with a local probe and does not establish model behavior or real conversation continuation:

```sh
RSP_EVAL_CONTAINER_TESTS=1 mise exec -- uv run --frozen --project tests/skills python tests/code/tooling/evaluation_contract.py EvaluationContract.test_native_codex_home_supports_helpers_retention_and_cleanup
```

## Select and run tasks

The exploratory [code-quality matrix](matrices/code-quality.md) pairs receiver test and protocol simplification cases with preservation controls, plus redundant Git capture identity and necessary external digest validation. It defines the six-case baseline boundary and focused offline calibration.

`--task ID` is repeatable; `--attempts N` controls attempts per selected task. `--agent` selects `codex`, `oracle` or `nop`. Choose tasks for the changed risk, including restraint and preservation where relevant; catalog size is not a quality gate. Native job `agents[].skills` supplies package paths. Prepared internal packages use the same mechanism; see the maintainer [internal-target guide](../../.agents/skills/author-rsp-skills/references/internal-targets.md). There is no parallel composition-hash or matrix model.

Only the selected candidate Skills are registered through native Harbor agent configuration. Harbor copies their files into the native discovery directory; Codex supplies the catalog and decides how to load selected resources. Registration does not promise full-body prompt injection or bypass tool-result limits. Task workspaces contain no baked-in Skills. The CLI package in the image supplies the real `rsp` command; its distribution assets do not select the agent Skills under evaluation.

Use repeated `--skill PATH` to replace the default selection for one run, or `--no-skills` to inject none; these options are mutually exclusive. Selected packages are copied into the job's immutable inputs, including an explicit empty selection in its native configuration. Neither option edits `jobs/default.yaml`. A zero-injection comparison still retains task policy and the RSP CLI; it is not a test without all RSP influence. Use the same neutral prompt in both arms when investigating discovery or contribution, and retain separate authorization for live execution.

Choose scope and purpose independently. A partial catalog is an explicit research intervention, not a supported product installation. Current suite acceptance registers all seven core Skills even when the task directly invokes only one responsibility. A mixed-project run exercises discovery and handoffs. Regression tasks protect established outcomes; exploratory tasks investigate capability gaps. These are selection decisions, not a mandatory cross-product or new task format. Reuse the same native task when both scopes are meaningful.

For example, after authorizing model execution, exercise direct implementation with `run --task implement-checkout --allow-live` and the complete suite. Use `run --task implement-checkout --task workflow-catalog --task native-coordination --allow-live` for the three mixed-project scenarios. Prefix both with `mise exec -- uv run --project tests/skills python tests/skills/evaluate.py`. Native coordination requires real workers, so selecting a single unrelated Skill would not establish its contract.

Three focused workflow tasks add complementary boundaries without prescribing Skill choreography:

- `bounded-fix`: one settled expiry correction, existing checks and preserved user work. It requires no report file, tracked owner, planning deliverable or worker. The native-action judge rejects manufactured obligations rather than counting words, tool calls or Skill loads.
- `parallel-ready-work`: independent CSV and time-window repairs with disjoint writers. Acceptance requires real, attributable worker work that overlaps, both workers awaited, and passing integrated checks. Retained native call/result timestamps and parent dispatch evidence supply the evidence; simultaneous worker names or self-reported parallelism do not.
- `shared-resource-work`: the same product repairs, but both acceptance commands lease one exclusive fixture. Source work may be parallel or serial; every fixture invocation must stay serial through teardown. Passing after a collision, bypassing the wrapper or presenting an agent-written audit log cannot establish safe scheduling.

Two additional tasks make correction and its stopping boundary explicit:

- `correction-review` supplies an accepted synthetic finding for the expiry defect. Success requires an implementation worker correction followed by a distinct fresh read-only reviewer, executed checks and parent waits. The supplied finding is an input, never evidence of a native reviewer run.
- `correction-limit` resumes a synthetic history in which the same finding survived two completed corrections. It requires current inspection, the failing declared check and an incomplete outcome without a third repair or counter reset. This tests recovery at the limit, not two freshly executed correction rounds.

The existing `native-coordination` retains conditional correction when its reviewer finds a defect. Offline reference solutions establish product assertions and scope preservation only; actual worker order, self-certification rejection, stopping behavior and semantic-judge discrimination require separately authorized live execution.

The [2026-10-14 evidence report](../../research/reports/2026-10-14T02-48-34Z.md#authorized-live-follow-up-on-2026-10-14) records one live pass each for `correction-review` and `correction-limit`, with native results and fixed inputs. The latter passes by preserving the observed product-check failure and stopping further correction. These single attempts are not matched comparisons, reliability estimates or broad judge calibration.

The 2026-10-15 candidate adds two controls, both using the same natural repair request. `correction-natural` keeps implementation-worker and independent-review obligations in immutable AGENTS.md rather than spelling out the sequence in the user request. `correction-continue` additionally supplies one completed ineffective correction and new decisive evidence, requiring authorized continuation instead of a premature exhausted-budget stop. Both retain real worker attribution, executed checks, immutable inputs and truthful completion criteria. They test routing under less procedural prompting and recovery with remaining budget; they do not prove entirely unprompted delegation or fresh execution of the supplied history.

Both controls passed once in the [fixed-candidate natural-correction pair](../../research/reports/2026-10-16T14-23-01Z.md), with checks and judge scores of 1.0, native worker attribution and zero automatic retries. Their captured Skill and task files still matched current sources when checked on 2026-10-17. This is bounded behavior evidence, not repeated reliability, real interruption recovery or a matched comparison of the Core entry/loading refinement. Keep the earlier task snapshots and verdicts unchanged. A future authorized comparison should hold task inputs, executor/judge settings and environment fixed between the earlier and refined Skill suites, compare acceptance and restraint before time/usage, and report cached input separately from total input. Resource-load and command counts are diagnostics, not scoring gates.

For no-Docker fixture calibration, the existing bounded-task regression machinery runs reference solutions, untouched and single-regression controls, preservation checks and native-evidence projection tests:

```sh
LITELLM_LOCAL_MODEL_COST_MAP=True mise exec -- uv run --project tests/skills python tests/code/tooling/evaluation_contract.py EvaluationContract.test_workflow_fixtures_calibrate_reference_solutions_and_product_negative_controls EvaluationContract.test_bounded_tasks_reject_undeclared_changes_but_allow_outputs_and_temporary_files EvaluationContract.test_shared_resource_fixture_rejects_a_held_lease_and_cleans_up_its_own EvaluationContract.test_parallel_evidence_requires_native_pairs_and_timestamps_not_completion_prose EvaluationContract.test_shared_resource_evidence_allows_serial_parent_work_but_rejects_invented_child_work
```

These checks calibrate deterministic assertions and evidence transport only. The reference scripts deliberately do not manufacture worker histories. Native behavior, actual parallelism, resource scheduling and semantic judgment remain unavailable until separately authorized Harbor execution with Docker and executor/judge access. Offline Reward Kit output retains `semantic: not-run` even when the reference product passes.

The exploratory pair `completion-boundary` and `completion-boundary-control` assesses completion against a settled cache contract when every Task and Required check is already marked passed. Their instructions, contract and smoke check are identical; only the implementation's expiry comparison differs. Both smoke checks pass. The first requires rejecting whole-outcome completion for the omitted expiry boundary, while the control requires accepting the correct implementation without inventing a defect or treating missing dedicated tests as an automatic blocker. The task declares the native Codex log as a verifier artifact; the judge receives an attributed projection of its commands and results, excluding internal reasoning; unavailable native evidence leaves grading unavailable. Select both tasks together; offline oracle/nop controls calibrate report disposition and preservation, while actual Skill behavior and explanation quality require separately authorized agent and semantic-judge execution. See the [research question](../../research/reports/2026-10-08T08-07-58Z.md#candidate-1-test-omitted-acceptance-despite-passing-declared-checks).

Default execution uses `AI-HUB/gpt-6.1-sol` at medium reasoning effort, one attempt and concurrency one. Semantic judges currently use `openai/AI-HUB/gpt-6.1-sol` at high effort. Match execution configuration to actual usage before acceptance. Use `--attempts 3` as an initial stability observation for affected critical tasks, not a universal gate or proof of reliability. Keep model, reasoning effort, task, grader and container resources comparable.

The image and Job pin Codex 0.162.1, the npm `latest` resolution checked on 2026-10-11. Resolve updates deliberately and change both pins; a floating tag would make otherwise identical jobs use different hosts. This is the standalone CLI environment, not a claim of desktop-host equivalence.

The Job's `kwargs.config.model_catalog_json` identifies a local source catalog (default: `~/.codex/opencodex-catalog.json`). Before execution, the runner requires an exact entry for the selected model and retains only that entry in the job's private sibling inputs. The native adapter uploads this snapshot into the container and rewrites the config path; Harbor does not upload referenced files itself. This retains model instructions, tool mode, context and truncation budgets rather than letting a routed name silently use fallback metadata. Catalogs must contain model descriptions only, never credentials. Change the configured source path for another installation; `--model` must have a matching entry. Resume uses the retained snapshot, not the current local catalog.

For separately authorized model execution:

```sh
mise exec -- uv run --project tests/skills python tests/skills/evaluate.py run --task doc-export --task implement-checkout --attempts 1 --agent codex --allow-live
```

The native Codex provider in [jobs/default.yaml](jobs/default.yaml) owns executor routing: `model_provider`, `base_url`, Responses protocol and HTTP headers. Supply its credential through `OPENAI_API_KEY`; Harbor passes it into the agent container and Codex reads it through `env_key`. Judge routing remains separate through `RSP_JUDGE_BASE_URL` and `RSP_JUDGE_API_KEY`. Keep credentials out of tracked configuration and reports. Codex requires `--allow-live`; examples grant no cost or execution authority. Review effective job settings, selected skills, model and task inputs. Missing authentication, applicable tasks or required semantic judging leaves behavior unverified.

The default provider reaches local OpenCodex at Docker's host gateway on port 10100 and supplies the loopback HTTP Host required by that gateway. To use another endpoint, edit the provider's `base_url` and remove or adjust `http_headers.Host` in the Job; `OPENAI_BASE_URL` does not override this named provider. Codex does not expand shell variables in `base_url`. The local adapter preserves routed model names that Harbor 0.24.0 otherwise truncates and uses `/opt/rsp-codex-home` inside the evaluation container: Codex 0.150.1 rejects helper creation under Harbor's temporary home. Native Harbor still owns setup, session retention and cleanup. For the judge, use a Docker-reachable `RSP_JUDGE_BASE_URL` and optional `RSP_JUDGE_HOST`. Set these only for evaluation; never edit global Codex or proxy configuration. A successful container `/models` response establishes connectivity, not agent or judge acceptance.

The image exposes Codex's native helper at `/usr/local/bin/apply_patch`, because login shells reset PATH and discard Codex's temporary helper directory. Image preparation resolves the installed helper target without hardcoding a platform-specific vendor path. The stable link survives native session cleanup; no replacement patch implementation or Skill workaround is involved.

The repository ignores `.env.eval.local` for local endpoint and credential settings. Keep it private and explicitly load it before evaluation commands; the runner does not automatically source shell files:

```sh
set -a
source .env.eval.local
set +a
```

For local OpenCodex, read the base URL with `ocx access endpoints`. Use the Docker-reachable hostname with the published port and `/v1` path, not a complete `/responses` or `/chat/completions` endpoint. If its origin check rejects the Docker hostname, use the published local authority in the provider’s `http_headers.Host` and `RSP_JUDGE_HOST`. An independently scoped OpenCodex data key can serve both executor and judge; keep its plaintext value out of tracked files and command output.

Offline calibration uses oracle solutions or a no-op agent and skips semantic judging:

```sh
RSP_EVAL_OFFLINE=1 mise exec -- uv run --project tests/skills python tests/skills/evaluate.py run --task doc-export --attempts 1 --agent oracle
RSP_EVAL_OFFLINE=1 mise exec -- uv run --project tests/skills python tests/skills/evaluate.py run --task doc-export --attempts 1 --agent nop
```

Use `RSP_EVAL_OFFLINE=1` only with `oracle` or `nop`, never for Codex acceptance. The wrapper also enables this mode automatically for oracle/nop. These results calibrate verifier discrimination and environment behavior, not Skill quality. Run and resume return zero only when every oracle trial passes or every nop trial is rejected; an unexpected control outcome, missing score or infrastructure error returns nonzero. Native verifier regrade can call judges and requires separate authority.

## Scoring and evidence

Acceptance follows the [assessment contract](assessment.md). Keep observable behavior, declared report structure, semantic quality and unavailable evidence distinct. Prefer contract-equivalent alternatives over command/prose fingerprints; retain actual state, side-effect, scope and authority checks. The quality tasks prepare actual source/test evidence before scoring and expose three semantic dimensions rather than one mixed judgment. Changed baked support requires an image rebuild before a later native job.

Executor usage is derived from the root identity in codex.txt and session_meta
parent links, including retained descendants once each. The adapter converts the
identified root trajectory and writes executor-usage.json with per-session usage,
aggregate totals and unattributed sessions. Missing totals remain unknown; no
partial root/child price is labeled aggregate cost. Judges are excluded. Reporting
also re-aggregates retained historical sessions without rewriting original native
verdicts; old agent_result totals may describe only the lexically latest child.
Cumulative input tokens are not simultaneous context-window occupancy.

Report rows show total input, cached input and output tokens separately. Cached
input is part of total input; do not add the two columns. Cache counts alone do not
establish fees or a savings percentage, and the report calculates neither. Values
use retained root/descendant attribution when present, otherwise native recorded
usage. Missing cached usage remains unknown; an observed zero remains zero.

Report rows separate usage origin from time scope. For regrades, all executor tokens
(including cached input)
and executor settings are inherited from the source execution, while seconds
measure the current regrade trial. The recorded source-trial path or ID is shown;
missing provenance or token values remain unknown. Do not add inherited tokens
again as new executor usage. Judge usage is excluded, so these numbers do not
establish total regrade cost or imply that regrading is free. Generating a report
still writes that job's summary; inspect a disposable copy when historical reports
must remain unchanged.

The suite comparison selects completion-boundary and its control, direct grouped
Review in completion-group-control, verify-boundary, commit-restraint,
native-coordination, and structural-audit with structural-audit-control. The
structural pair uses capability-neutral instructions: baseline may select the old
Audit entry; the suite candidate should select Review. Task success and restraint,
not reading commands or exact Skill selection, determine scores. Source reads,
repeated loads and per-session usage remain diagnostics. The additional
commit-tracked-restraint probe directly invokes Commit for a grouped child without
permission to stage or commit. Grouped review explicitly requires file-valued
evidence paths; directory-wide observations belong in limits.

Task checks using `evidence_report` accept workspace file paths and optional one-based `:line` or `:line:column` locations, including `/app/` paths. References must resolve to existing files inside the workspace, including after symlink resolution; supplied positions must exist (a column may identify the end-of-line insertion point). Invalid locations remain task failures. The shared report validator owns this interpretation.

Reward Kit owns deterministic and task-defined semantic criteria. The shared Python verifier runs task-local assertions in an isolated process and retains check.log. Report readers validate JSON objects and required nested structures before task interpretation. Invalid reports, business assertion failures and missing workspace outputs are task failures; missing verifier inputs and unexpected verifier exceptions leave the trial unscored. Verifier-owned Node contracts are checked for presence and syntax before execution; their assertions still judge the task outcome. Task-local checks own business outcomes; shared workspace checks enforce each task’s declared write scope and preserve pre-existing dirty state. For full-score acceptance, configure `aggregation = "threshold"` and `threshold = 1` with positive criterion weights. Reward Kit 0.2.3 also requires full scores for `all-pass`, `any-pass` and `required-pass`; 0.2.2 accepted positive partial scores. RSP retains its calibrated explicit-threshold policy. Historical jobs keep their original scoring semantics.

Judge, provider and verifier errors are unavailable evidence, not graded task failures or passes. Preserve error details and leave affected trials ungraded. Read native trial results, agent logs/artifacts and verifier details together; reward alone cannot resolve authority, missing evidence or semantic coverage. Judge behavior and artifacts, not exact Skill wording, reading commands or activation fingerprints. Read-only tasks reject new undeclared files, including source and .rsp records; declared report/plan outputs and temporary files under tmp/ or .cache/ remain allowed. The native-coordination verifier projects retained child session identities, tool calls and outputs into the Reward Kit judge input. Missing child tool evidence leaves the trial unscored; worker completion prose alone is insufficient. Author self-checks cannot supply required independent acceptance.

Jobs and raw evidence live under ignored `tests/skills/reports/`. Preserve historical records without translating their verdicts into current acceptance. Private retention is not a secret-scrubbing guarantee. Keep selected sanitized conclusions in time-named Markdown under `research/reports/`.

For command-construction diagnosis, inspect root and descendant native session
call/results as well as codex.txt: JavaScript wrapper failures can occur before a
shell command is dispatched. Keep those failures, actual command exits,
contract-defined expected rejections and output truncation separate; task verdicts
and executor token accounting are different evidence. The retained
[optional diagnostic](../diagnostics/command-construction.test.js) parses exact
failed calls and successful successor controls without executing their contents.
Run it with `mise exec -- pnpm test:diagnostics`. These diagnostics are excluded from default code tests and release gates.
The [classification report](../../research/reports/2026-10-17T05-52-00Z.md) records
provenance and limits; syntax passes establish neither safe replay nor model success.

The [evidence-reading diagnostic](../diagnostics/evidence-reading.test.js) reconstructs
stop/continuation from selected native fields with source locations. The separate
[Shell exit-code diagnostic](../diagnostics/check-exit-code.test.js) attributes a
real check's exit code on its first separate execution. Full original logs remain retained; selected fields
do not replace wider review or separately required independent checks.
Run both with `mise exec -- pnpm test:diagnostics`.
The [result record](../../research/reports/2026-10-17T06-38-29Z.md) separates byte-size
observations and local process results from unmeasured model/token improvements.

The retired custom runner's raw records, workspaces, preparation probes and temporary archives were removed on 2026-10-08. Selected historical summaries and verdicts remain at their original paths; they cannot supply replay or regrade evidence after raw inputs are removed. Historical retention statements predate this cleanup. The framework comparison experiment remains intact for its research report. Retain native Harbor jobs with their sibling inputs and recovery backups; the local reports/README.md describes the cleanup boundary.

## Offline native judge-result controls

With Docker running and the evaluation image matching current source, explicitly
run the [native probe](../code/tooling/judge_native_probe.py) into a new directory:

~~~bash
mise exec -- uv run --frozen --project tests/skills python tests/code/tooling/judge_native_probe.py tests/skills/reports/judge-native-NEW
~~~

This opt-in probe runs four native Harbor oracle jobs with zero task retries:
valid low score, one malformed response then success, three malformed responses,
and an immediate injected SDK timeout. It copies release-evidence, keeps its
checks/rubric, and substitutes only the judge SDK boundary using a hidden test
fixture. Both native phases use no-network policy and dummy credentials.
The probe pins both roles to the inspected shared image ID and prepares workspace
inputs without task image builds. The runtime image and dependencies are unchanged.

The reference solution is deterministic, not model execution. Expected report
labels are calibration-fail, calibration-pass, unscored and unscored. Records
separate original verifier-shell exit, native CLI exit and RSP classification
exit, and retain native results, grading details, summaries and frozen inputs.
The probe exits zero only when all four controls meet their expectations; an
expected unavailable result is not itself a failed regression. No real model,
judge, historical regrade, human label confirmation or Skill acceptance follows.
Do not reuse an existing evidence directory or replace a failed run.

## Offline commit-stop controls

The [optional commit-stop diagnostic](../diagnostics/commit-stop-boundaries.test.js) runs
two bounded scenarios in disposable Git repositories: an index changed after its
reviewed snapshot, and a real commit rejected by a pre-commit hook after modifying
the worktree. Correct stopping preserves the observed state and failed command.
Negative controls attempt continuation, index repair, retry, hook bypass followed
by a repair commit, or cleanup hiding effects. Ordered harness-owned command
receipts reject continuation even when a later reset or cleanup restores the
expected final state. All these Git effects are isolated fixture actions.

```sh
mise exec -- pnpm exec vitest run --config tests/diagnostics/vitest.config.ts tests/diagnostics/commit-stop-boundaries.test.js
```

These controls test real Git effects and fixture discrimination, not a production
delivery wrapper or autonomous Skill behavior. Harness receipts are not native
worker evidence. No model, judge, new native task, Core rule or Commit rule is
introduced. Hook failure leaves HEAD/index unchanged but changes the worktree;
unchanged HEAD alone cannot establish absence of side effects.

## Interrupted worker recovery fixture

[interruption-recovery](tasks/interruption-recovery/instruction.md) generates partial
output during execution rather than supplying a synthetic stopped history. A native
worker runs the task-local writer, which appends A, records correction count one and
waits for SIGTERM. The parent observes partial effects, pauses the writer and waits
for both the command exit and native worker completion before dispatching a fresh
continuation worker. Continuation preserves the partial effect and stop snapshots,
appends only B and completes the same correction with count one.

The deterministic helper owns a cooperative process workload, not native worker
lifecycle. Its lock-release receipt does not certify that a model worker stopped.
The task's semantic judge needs actual parent dispatch/wait and child call/result
records; correct final files alone cannot establish action order or detect a replay
subsequently hidden by cleanup. Missing native trajectories leave judging unavailable.

Run only the local subprocess and verifier controls without models:

```sh
mise exec -- uv run --frozen --project tests/skills python tests/code/tooling/evaluation_contract.py EvaluationContract.test_interruption_recovery_uses_real_stop_and_preserves_partial_effects EvaluationContract.test_interruption_recovery_oracle_is_offline_process_evidence
```

These tests exercise real process signals, exit, exclusive writer access and retained
effects, plus negative controls for duplicate writes, lost evidence, reset counts and
user/Git changes. Offline grading remains semantic: not-run. Native model-worker
coordination needs separately authorized execution; this fixture does not establish
forced model cancellation, cross-session continuation, desktop-host equivalence or
reliability. Existing correction-continue remains the synthetic-history control.
The separately authorized [single live attempt](../../research/reports/2026-10-16T17-31-06Z.md)
passed programmatic and semantic checks, including native stop-before-continuation
evidence. Its intermediate command failures remain retained; one pass does not
establish the broader recovery claims excluded above.

## Calibrate semantic judging

The [calibration corpus](calibration/README.md) supplies reference outputs, equivalent correct forms and consequential failures for document, design, review and code-quality judgments. It runs through native Harbor oracle tasks and the selected task verifier, including Reward Kit judges. This differs from oracle/nop controls above: semantic calls remain enabled and require authorization and judge credentials. No executor model is invoked. Offline code tests separately exercise the same samples' deterministic components; they do not call judges or confirm candidate labels.

```sh
mise exec -- uv run --project tests/skills python tests/skills/evaluate.py calibrate --task doc-export --task shape-cache --task review-staged --task structural-audit-control --allow-live
```

The wrapper snapshots the task, original oracle solution, sample script and expectations. Harbor installs the reference solution followed by the selected sample and runs the task verifier. Calibration sample copies, including regrades, bind declared Codex log inputs and artifacts to Harbor Oracle's actual `/logs/agent/oracle.txt`; authored tasks and original task snapshots keep their Codex evidence contract. Missing Oracle evidence remains unavailable. The report compares programmatic and semantic components independently and, when declared, the named `expected_criteria` targets. A rejected negative sample is a match only if its targeted criteria also match; rejection for an unrelated problem cannot substitute. Missing scores, errored targets and verifier/provider errors are unscored, never matches. Any mismatch or unavailable result makes the command fail. Component-only snapshots retain their original narrower meaning. Use `--attempts` to repeat judgment of the same samples; keep this distinct from repeated Agent executions.

Labels currently remain `candidate`: the author derived them from the task contract, but no human has confirmed them. Inspect false acceptance/rejection with a human before changing a label to `human-reviewed`. A matching candidate label is implementation evidence, not human calibration. Add samples for observed judgment failures; do not duplicate every task mechanically. Run a fresh calibration after changing sample artifacts or expected labels. For rubric-only corrections, `regrade JOB --allow-live` reuses the retained sample artifacts and original expectations with the current task verifier; its results are labeled `judge-calibration-regrade-*`. Resume of a calibration job needs `--allow-live` because its oracle still calls judges.

Harbor owns the child directories inside each job. Native resume deletes child directories lacking `result.json`, including auxiliary input or archive directories placed there. For a job at `tests/skills/reports/<time>`, the wrapper snapshots inputs in sibling `tests/skills/reports/<time>.inputs` and recovery evidence in sibling `tests/skills/reports/<time>.attempts/<retrytime>`. Keep these outside the managed job directory and retain them with the job.

### Select exact calibration samples

Use repeatable `--sample task--sample` IDs to run only named calibration samples:

```sh
mise exec -- uv run --project tests/skills python tests/skills/evaluate.py calibrate --sample review-staged--missed-finding --sample structural-audit-control--reference --allow-live
```

This command calls the semantic judge and requires separate execution authority.
Without `--sample`, selection remains all samples under the selected tasks.
With it, duplicate IDs select one sample once. Optional `--task` restricts eligible
samples; an unknown ID or one outside that task scope fails before job creation.
Task snapshots contain only the owners of selected samples. The calibration
manifest, prepared sample directories and native job task paths identify the same
sample set. Labels, rubrics, live authorization and zero automatic retries are unchanged.

Offline regression covers CLI selection, rejection and snapshot agreement with
simulated native process results; it makes no model or judge calls:

```sh
mise exec -- uv run --frozen --project tests/skills python tests/code/tooling/evaluation_contract.py EvaluationContract.test_calibration_cli_selects_exact_samples_and_matching_snapshots EvaluationContract.test_calibration_cli_rejects_invalid_samples_and_missing_live_authority_before_jobs
```

## Report, resume and regrade

Use a recorded job directory as `JOB`. Reporting reads existing results and writes `JOB/summary.md` without executing agents or judges; an optional baseline compares task outcome counts from native job evidence:

```sh
mise exec -- uv run --project tests/skills python tests/skills/evaluate.py report JOB
mise exec -- uv run --project tests/skills python tests/skills/evaluate.py report JOB --baseline BASELINE_JOB
```

Keep source, dependencies, tasks, skills, model settings and attempts comparable before attributing differences to a candidate. The report flags mismatched native task checksums or agent model/settings; Skill paths are intentionally excluded. Calibration stays calibration after regrade, and reassessment is labeled separately from fresh execution. Missing or incompatible evidence limits the affected comparison. Baselines and holdouts are optional research design, not mandatory release gates.

The comparison report separates currently saved sibling snapshots from recorded execution identity. Shared support, dependency lock, image identity and task verifier inputs each show matched, mismatched or unavailable. Skill content is a separate candidate dimension; variation alone does not make an experiment incompatible. Missing inputs or different file inventories are unavailable because evidence loss and intentional file changes cannot be distinguished without an execution-time inventory. Matching saved bytes does not prove completeness or agreement with the original execution. Native task checksums and executor settings retain their existing checks; no verdict is recomputed.

For offline report controls, run `mise exec -- uv run --frozen --offline --project tests/skills python -B tests/code/tooling/report_comparison_probe.py SOURCE_JOB NEW_OUTPUT_DIRECTORY`. Use a retained Skill job with sibling inputs; the output directory must not exist. The probe copies both, calls only the report function, and asserts its displayed states against eleven fixture expectations, including separate changed/missing Skill controls. It also checks that recorded execution comparison and native files remain unchanged. The mutations affect copied saved inputs after execution, not native result checksums or verdicts. No agent, judge, resume or regrade runs; earlier diagnostic outputs remain historical evidence of the previously missing display.

For retained calibration jobs without Skills, `tests/code/tooling/report_source_boundary_probe.py SOURCE_JOB NEW_OUTPUT_DIRECTORY` uses the same Python invocation to check sample verifier content and inject file-read/directory-iteration errors. It preserves exceptions and exits nonzero when a report expectation is unmet. The original probe retained a verifier-directory iteration failure and its untouched historical summary. After the bounded discovery error correction, all five controls complete: read or traversal errors leave the affected source unavailable while other comparison fields and recorded outcomes remain intact. Original failures and pre-correction reports remain historical evidence; successful fault injection does not establish actual OS permission or container behavior.

The summary gives per-task outcome counts, recorded executor and Skill selection, judge configuration, unmet criterion names, trial duration and links to original grading reasons. Ratios use returned records, including failed, unscored, error and cancelled attempts. An incomplete job is explicitly marked; missing results cannot establish a full-run success rate or always be attributed to a task. Unknown usage or timing stays unknown. Oracle/nop controls, judge calibration, regrade and fresh execution retain distinct labels; do not pool them into a Skill success rate. Native results describe retained attempts, while earlier failed attempts remain in recovery backups.

Report regression coverage lives in `tests/code/tooling/evaluation_contract.py`
and runs with the repository test suite. It covers native result availability,
current and baseline plan limits, calibration identity and expectations, grading
diagnostics, saved-source comparisons, and usage attribution. Report-only session
validation shares the attribution read/parse pass; corrupt attributed JSON leaves
usage unknown without changing native scores or executor telemetry. Fewer reads
do not establish a latency improvement without a separate measurement.

Use the retained-job probes only when a concrete question needs their additional
CLI or preservation evidence. Run them into new output directories; keep original
jobs, frozen inputs, failed observations and historical reports. Fault-injection
checks require the fault to occur and verify visible outcomes, not an exact
number of internal reads. Review related report fixes as one bounded batch with
the applicable controls and one full-suite run. Once confirmed issues are
resolved and that batch passes independent review, stop; arbitrary malformed
schemas, live acceptance and production telemetry require separate scope.

Resume can execute agents and verifiers again and requires execution authority. Codex and regrade jobs require live authorization. Saved support code, dependency lock and local image identity must match before recovery; missing or changed inputs require a new run or regrade. Use the wrapper to preserve existing evidence before native resume removes matching error trials:

```sh
mise exec -- uv run --project tests/skills python tests/skills/evaluate.py resume JOB --error-type RuntimeError
```

For a Codex or regrade job, add `--allow-live` after separately authorizing model execution. Before native resume, the wrapper snapshots recovery evidence and job metadata in the sibling `<time>.attempts/<retrytime>` directory described above. Inspect the snapshot and original error before retrying, and confirm retained evidence after resume. The former in-job `inputs/` and `attempts/` locations were deleted in a real resume test; they are not successful preservation evidence. The corrected sibling layout passed fault-injection recovery: the failed attempt was retained and the successful trial remained byte-identical. A fresh-process resume also preserved the complete 16-task oracle job and its sibling inputs. Do not label resumed attempts as untouched original execution or let failure itself authorize paid retries.

For authorized verifier reassessment, the wrapper snapshots the current matching tasks, support code, dependency lock and image identity, then starts a native Harbor regrade job from retained agent artifacts:

```sh
mise exec -- uv run --project tests/skills python tests/skills/evaluate.py regrade JOB --allow-live --concurrency 1
```

The source job supplies execution artifacts and its image-bound initial state; the new sibling inputs directory supplies the replacement verifier. Before creating a regrade job, the wrapper uses Harbor's task hashing and each source trial's native lock.json to verify the saved task, including coverage of task.toml and tests/baseline.json. Calibration checks the actually executed samples, not their unexecuted base templates, and carries each sample's own initial state. Missing, invalid or mismatched locks stop preparation; another attempt's valid lock cannot cover them. Regrade copies that verified initial state instead of rerunning setup against current sources. The replacement task has an empty environment input directory: Harbor restores original artifacts, not today's setup. `metadata.rsp_initial_image` retains the initialization image identity while `environment.docker_image` selects the current runtime for corrected grading. Both are covered by the native execution lock; older records without this metadata retain their original environment-image binding. Older jobs lacking an image-bound initial state or usable execution lock cannot use this regrade path; retain their original verdicts and evidence, without promoting old fixed tables or agent artifacts into trusted initial state. Resume checks the regrade job's own snapshot, so a corrected grader need not match the original execution's grader. Later working-tree task edits do not change that snapshot. Missing required source artifacts leave reassessment unavailable. Regrade can call task-defined judges and requires runtime judge routing; it is not fresh agent execution or current-candidate Skill acceptance.

Saved task and Skill content is also checked by the native job lock. Offline controls in `tests/code/tooling/native_resume_fixture.py` exercise the real wrapper backup and native resume/lock path: unchanged inputs dispatch only the failed trial once; task or Skill drift raises a lock mismatch before any trial dispatch. Native resume removes the selected failed trial before checking that lock, so refusal is not mutation-free: the failed trial is absent from the job and the wrapper summary reports an incomplete task. Inspect the sibling attempt backup for the original failed trial and prior job metadata; successful trial bytes and the old lock remain unchanged in these controls. The controls replace external readiness and trial execution with local stand-ins and do not establish real model, container or verifier recovery acceptance.

Advanced direct native Harbor use must consume prepared task copies containing their trusted initial state, not raw authored task directories. Task templates default RSP_EVAL_OFFLINE to 0 and the optional RSP_JUDGE_HOST to an empty value. Semantic tasks still require RSP_JUDGE_BASE_URL and RSP_JUDGE_API_KEY. Direct native jobs without wrapper inputs cannot use wrapper resume; prefer the documented wrapper entrypoints for preparation and retained recovery evidence.

Package release invokes only `evaluate.py check`; it never automatically runs, resumes or regrades jobs. Model results, schema checks and local code success grant no release, publication or human approval.

## Architecture candidate: delivery and evidence reuse

The 2026-10-15 architecture revision uses workflow.delegation/closeout. Existing
fixture configurations were explicitly migrated to off/manual and their synthetic
Git baselines regenerated; historical jobs and captured inputs remain unchanged.

- review-evidence-reuse requires an implementation worker and distinct semantic
  reviewer, permitting applicable implementer check evidence and rejecting
  unnecessary re-execution. correction-review/natural/continue retain their explicit
  independent-execution requirements.
- delivery-open keeps work open even with auto closure configured.
- delivery-checkpoint makes exactly one authorized source-only checkpoint and keeps
  Change open, also under auto closure.
- delivery-ask prepares final delivery and asks for closure without archiving or Git.
- delivery-auto closes eligible final delivery under policy without inferring Git.
- delivery-manual makes an authorized final commit while leaving Change open.

Delivery setup actually executes its declared check, records output and relevant
input hashes, and distinguishes setup evidence from model execution. Deterministic
checks cover final artifacts, exact Git effects, preservation and redundant unchanged
check execution. The semantic judge must additionally establish applicability
inspection, current readiness, authority decisions and honest attribution from the
native run. Offline reference solutions and negative controls are calibration only.
No live acceptance or efficiency claim follows from them. Rebuild the evaluation
image from this candidate before an authorized live run; old CLI images do not
understand the new configuration. Never rewrite old job inputs or verdicts.

The separately authorized [six-scenario live follow-up](../../research/reports/2026-10-15T09-22-32Z.md#authorized-six-scenario-live-follow-up)
passed once per task in native job 2026-10-15T15-41-22.013679Z, with no task retry,
resume or regrade. It used the latest captured suite, including the document-rule
follow-up; it is not a document-quality evaluation, repeated reliability study or
matched efficiency comparison. Preparation and intermediate command failures remain
recorded separately from final task verdicts.

The [2026-10-16 matched-task comparison](../../research/reports/2026-10-15T09-22-32Z.md#2026-10-16-matched-task-live-comparison)
used the same six tasks and settings with Core/Review 2026.10.16.1. It returned five
passes and one delivery-open execution error after model HTTP 404, with no task
retry. Paired successful traces show fewer fallback/status/Document-method loads,
but more directory discovery and command batches and higher total input tokens.
The incomplete task is excluded from efficiency totals; the result is not complete
six-task acceptance or a general efficiency improvement.

The outcome-focused consolidation regression adds four bounded tasks:

- writeback-in-progress updates a stale stable contract while preserving unfinished Change/Focus and Git state.
- upgrade-checkpoint and upgrade-checkpoint-blocked retain an actual setup CLI missing-design diagnostic and real passing or unavailable check evidence. They distinguish a permitted checkpoint from a missing-evidence stop without authorizing scaffold creation, upgrade or archive.
- review-evidence-limits combines a real unsafe migration claim, an unavailable vendor-contract judgment and a deliberately deferred draft choice. Findings and coverage gaps must remain distinct.

Use the existing correction-review task alongside these for required independent execution and review. New tasks judge outcomes, write scope and truthful evidence, not read counts, exact method loads or incidental repetition. Reference/control calibration is offline; live candidate acceptance remains separate.

The four outcome fixtures share setup and snapshot preservation through the existing
support/workspace.py module; task checkers retain only their own acceptance logic.
Report parsing and evidence paths reuse support/outputs.py. Exact assertions follow
explicit types/enums and file/Git effects; undeclared closure shapes and equivalent
prose remain semantic judgments. The existing evaluation_contract.py offline suite
covers equivalent Markdown/report/path forms, malformed outputs, preservation and
negative outcomes. Shared initial-state tests discover every task, execute its setup and exercise preservation without comparing against a second versioned baseline.

The paired commit-prerequisite-failure and commit-prerequisite-success tasks require
fresh delivery preparation before staging or commit. They use the same request and
preparation script with an immutable unavailable/ready input. Both retain passing
setup verification, so only the fresh prerequisite decides whether delivery may
continue. Programmatic checks cover preparation observations, exact Git outcomes
and preserved inputs; native-action judging must reject writes after failure even
when subsequently undone. A receipt alone does not prove model execution. These
explicitly prompted controls do not measure spontaneous preparation discovery or
general reliability.
