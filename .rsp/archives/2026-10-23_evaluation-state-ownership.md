---
kind: "refactor"
summary: "Share one evaluation runtime and preserve trusted execution-time state, native locks, file modes and historical evidence."
---

# Change: evaluation-state-ownership

## Proposal

Migrated task preparation and grading to one shared runtime image and one trusted initial state captured before agent execution. Native Harbor loads frozen workspaces and private tests into independent containers. Preservation checks now use that execution's contents, permission modes and Git state, while business expectations remain independent.

Consolidated duplicated guards and Focus recovery guidance, and moved historical Shell/Git and evidence replays to optional diagnostics. Historical jobs, failed verdicts and captured command/evidence fixtures remain unchanged. The selected four-task live run passed once per task with semantic grading; its scope and limits are recorded below.

## Spec

### MODIFIED

- Prepare each task in an isolated container from the shared runtime image before agent execution. Freeze its initialized workspace and initial state together; Harbor loads only the workspace into an independent agent container and the private tests/state into a separate verifier. Never accept a post-execution workspace manifest.
- Missing trusted initial state is unavailable grading, not a behavioral failure. Before regrading, verify the saved task against every source trial's native Harbor lock, including lock coverage of the baseline and image binding. Calibration verifies the executed sample, not its base template. Retain the original image-bound state rather than deriving it from current setup; legacy jobs without usable evidence remain historical records.
- Preserve user content, protected file modes, Git state and authorized write boundaries. Missing or invalid historical mode metadata makes preservation evidence unavailable. For directories Harbor uploads, new execution and resume reject prepared-mode drift or unavailable metadata before dispatch; resume checks precede attempt backup. Regrade consumes recorded artifacts and skips this unused-upload check.
- Historical replay remains optional diagnostics rather than current-product release evidence. Keep final-candidate, tarball, permission and source-identity checks.
- Consolidate Focus recovery instructions without changing authority, replay safety or completion conditions.

### Acceptance

#### Scenario: Setup diagnostics change with the candidate

- GIVEN setup produces a new diagnostic before the agent starts
- WHEN the verifier checks preserved inputs
- THEN unchanged inputs pass against that execution's initial state, while unauthorized changes still fail.

## Design

The wrapper prepares a frozen copy using an isolated, network-disabled container from the shared runtime image. It mounts only the copied workspace, read-only setup script and separate initial-state output directory. It freezes the initialized workspace, including Git state, as the task's environment input and stores the initial state privately in tests/baseline.json. Native task locks cover these inputs and image provenance.

Removed 94 task/verifier Dockerfiles and 47 hand-maintained baselines. Harbor's prebuilt-image upload and separate-verifier paths own container startup, input transfer, artifact collection and grading. Regrade retains each executed task or calibration sample's verified original state while selecting the current replacement-verifier runtime; it never reruns setup.

Shared workspace support captures initial contents and modes, validates metadata before report assertions, and owns common note/Git preservation. Task-local functions retain their policy differences. New execution and resume check uploaded modes because Harbor's content lock alone does not cover permission changes. Legacy image-baked tasks retain their native non-upload path. Offline preservation tests execute real setup for all tasks; default preparation-orchestration tests substitute the external container boundary.

Historical command/evidence, Shell exit-code and Git commit-stop controls live under tests/diagnostics with an explicit optional entrypoint. Original evidence fixtures remain unchanged. Release wiring retains consequential contracts rather than incidental cache/layout assertions. Focus links to the existing recovery method instead of restating it.

Current contracts are reflected in [Distribution](../specs/distribution.md), the [test guide](../../tests/README.md), [evaluation guide](../../tests/skills/README.md) and [assessment contract](../../tests/skills/assessment.md). This retains native Harbor ownership and existing workflow policy; no separate Decision Record is needed for the maintainer implementation change.

## Tasks

- [x] Replace per-task image builds with shared-runtime preparation and native workspace/private-test upload.
- [x] Replace maintained baselines with captured initial state and consolidate 22 duplicated note/Git guards.
- [x] Preserve calibration, regrade/resume, per-source execution locks and failure isolation; bind each executed sample to its own state.
- [x] Capture protected modes, validate metadata before scoring, and reject uploaded-mode drift before execution/resume dispatch or backup.
- [x] Separate optional historical diagnostics, remove the unused installation lock hash and incidental workflow assertions, and consolidate recovery prose.
- [x] Complete applicable offline checks, native Oracle controls and the authorized four-task live validation without task reruns.
- [x] Reconcile stable contracts and final evidence while retaining material failures and acceptance limits.

## Verify

### Required

- [x] Build, lint, typecheck and the complete code suite passed before the follow-up corrections: 16 files, 109 tests. Unchanged CLI/package coverage is reused. Subsequent affected Harbor integration and quality-matrix coverage passed after the final corrections: three Vitest tests, including 14 workspace-state methods and the 75-method evaluator suite; one opt-in container probe was skipped.
- [x] Initial-state controls exercise all 47 setups, generated diagnostics, allowed/forbidden writes, forged or missing private state, file-mode changes, missing/malformed mode metadata, preparation failure/cleanup, image binding, native-lock drift/coverage and distinct calibration sample states. The metadata/report matrix covered all 28 combinations; unavailable metadata exits 2 rather than scoring a model failure.
- [x] Eighteen new-execution/resume combinations cover ordinary tasks and calibration samples, unchanged inputs, mode drift, missing mode metadata, legacy non-upload tasks and regrade. Focused orchestration controls cover calibration, regrade/resume, Oracle/nop outcomes and Skill selection.
- [x] All 47 native task schemas, seven Skill packages, security preflight and documentation checks passed. The final four optional diagnostic files passed all ten tests separately; these remain outside default release gates.
- [x] Two native Oracle controls passed twice on distinct retained candidates with semantic grading disabled. The later four-task Codex job passed all deterministic and semantic criteria once per task, with zero execution exceptions. Native execution locks match each retained initial state.
- [x] Historical reports, verdicts and retained source fixtures were preserved. No historical job was regraded. Fresh closeout checks passed: documentation checks covered eight bilingual page pairs and 32 Markdown files, local-file checks covered 43 references in five affected documents, and git diff --check passed.

### Candidate and live execution

The live candidate is source commit 622fcb1448e0ae9e520217b7a0c488d966bca691 plus the uncommitted diff captured in tests/skills/reports/2026-10-23T13-35-33.635616Z.inputs/candidate.patch. Its sibling source.json, native job configuration and copied Skills/tasks/support retain the execution inputs. The inspected image was sha256:efa98296860f559db6d6dea39885e87bf9b4f441f700078ed68435b628936c5e on linux/arm64. The tracked diff still matched this candidate before closeout; later work-record/Spec edits do not alter executed CLI, Skill, task or verifier bytes.

The executor was AI-HUB/gpt-6.1-sol at medium reasoning effort with all seven candidate Skills. The semantic judge was openai/AI-HUB/gpt-6.1-sol at high effort, one sample. The job used one attempt per task, concurrency one and zero Harbor automatic trial retries. No manual task rerun was performed. Runtime was about 9 minutes 18 seconds.

| Task | Deterministic checks | Semantic score | Outcome |
| --- | ---: | ---: | --- |
| bounded-fix | 1.0 | 1.0 | passed |
| review-staged | 1.0 | 1.0 | passed |
| commit-prerequisite-success | 1.0 | 1.0 | passed |
| commit-restraint | 1.0 | 1.0 | passed |

Evidence: tests/skills/reports/2026-10-23T13-35-33.635616Z/summary.md, each native result.json and verifier/reward-details.json. Every evaluation-status.json records semantic task-defined with no errors. Read-only validation confirmed all four execution locks match their saved task and image-bound state. Evaluation containers were cleaned up.

The two earlier Oracle jobs each ran commit-prerequisite-success and commit-restraint once, with calibration-pass and zero exceptions. Their summaries and sibling frozen inputs remain at tests/skills/reports/2026-10-23T07-43-56.645578Z and tests/skills/reports/2026-10-23T09-38-32.729042Z. They establish real container preparation and deterministic grading for their captured candidates; semantic grading was not run.

### Retained failures and corrections

- Initial regressions exposed raw-TOML equality assumptions, a regrade fixture without trusted initial state and a missing success-task negative branch. Shared-runtime migration also exposed a temporary setup import path and former environment/workspace layout assertions. Corrected fixtures passed the affected checks; original task expectations and historical verdicts were not rewritten.
- The P2 follow-up reproduced acceptance of changed baseline content and dependence on an unexecuted calibration base. Reuse now checks every source trial's native lock, its baseline/image coverage and each executed sample's own state. A retained two-trial Oracle job passed read-only lock validation; an in-memory baseline mutation was rejected without editing or regrading historical files.
- A legacy fixture deleted context after recording execution. The corrected control rejects that loss and separately accepts a lock that records original absence. Repeated calibration-regrade and context-preservation controls pass without backfilling evidence.
- Review reproduced a permission-only change invisible to Harbor's content lock. Protected-mode checks now reject executable-bit addition/removal, accept original modes and authorized output changes, and report unavailable evidence for missing old metadata. Verifier-entry validation also prevents malformed/missing reports from masking unavailable mode evidence. The final execution/resume guard rejects drift before upload and before resume backup without repairing retained inputs.
- Live preflight detected stale baked verifier.py and workspace.py before any task started. The failed observation is retained in tests/skills/reports/2026-10-23T13-35-21Z-four-task-live-preflight.json, including the initial record command's SyntaxError before writing. The image was rebuilt and the runner's byte comparison passed before the single live job began; this did not rerun a task.

### Limits

The four live passes are bounded single-attempt evidence, not full-corpus container/model coverage or a reliability estimate. The skipped opt-in native helper probe is not claimed as executed. Legacy jobs without usable image-bound state, native locks or mode metadata remain historical records and cannot gain preservation evidence through reconstruction or current setup. No performance, token-reduction, publication or broad Skill-acceptance claim is made.

## Blockers

None
