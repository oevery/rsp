---
kind: "refactor"
---

# Change: refine-managed-execution-recovery-model

## Proposal
- Outcome: Refine managed execution into a host-neutral transient control model that supports efficient longitudinal work, independent verification, resource-safe concurrency, interruption recovery, and commit-safe cross-session Focus Capsules without adding a second durable workflow system.
- Why:
  - The current managed contract conflates a worker's execution lifetime with exclusive-resource ownership, defaults too strongly to one-shot workers, and applies one whole-run dispatch ceiling. In long tasks this can discard useful context, force avoidable message round trips, and make an otherwise converging correction or independent verification unavailable.
  - Elapsed time, polling, and user-facing progress expectations can be mistaken for evidence that a healthy worker should be interrupted. Cancellation and replay safety are not explicit enough for long verification commands or host processes.
  - Worker receipts, verification evidence, Change writeback, and Focus Capsule recovery pointers need one clear retention model. Without it, recovery either loses decisive state or expands `.rsp/` into a runtime ledger.
  - Ordinary current-work execution may correctly use the shared checkout. Workspace isolation is a separately selected boundary and must not be implied merely because a worker performs the mutation.
- Scope:
  - Define canonical transient objects for managed execution: `ExecutionFrame`, `WorkerSession`, `Assignment`, `Receipt`, and narrowly scoped `ResourceLease`.
  - Derive direct, longitudinal, sequential, parallel-wave, read-only-fan-out, bounded-correction, and independent-Verify topologies from current owner, authority, seams, resources, and acceptance needs instead of persisting a run plan.
  - Specify when Manage resumes one worker session, creates a fresh worker, performs semantic rollover, waits, cancels, corrects, or independently verifies.
  - Separate machine heartbeat from user-visible progress narration and define cancellation acknowledgement plus assignment replay safety.
  - Define receipt acceptance, evidence freshness, durable Change writeback, and a minimal commit-safe Focus Capsule for cross-session and cross-device recovery.
  - Update Specs, authored Skills, fallback rules, documentation, and deterministic behavior fixtures to express the refined model consistently.
- Non-goals:
  - Do not add SQLite, JSONL, a controller ledger, worker registry, verification ledger, run directory, event stream, persisted topology, or new RSP lifecycle state.
  - Do not make isolated worktrees mandatory for worker execution, infer that a worker used a worktree, or expose an execution location that was not observed.
  - Do not persist worker identities, process handles, lease holders, retries, raw receipts, raw logs, full diffs, authority grants, acceptance grants, or complete execution history in a Change or Focus Capsule.
  - Do not grant mutation, workspace, Git, push, publication, deployment, approval, or human-acceptance authority.
  - Do not make one primary worker, parallel execution, or three correction passes mandatory when the evidence supports a smaller topology.

## Spec
### MODIFIED
- Requirement: managed execution uses a small transient control vocabulary
  - `ExecutionFrame` contains the current goal, WorkOwner or WorkSet, authority, baseline, observed execution location, resource claims, and acceptance surfaces. It is rederived from durable owners and current evidence and is never persisted as RSP state.
  - `WorkerSession` identifies one worker role and its fresh or resumed context within the current frame. A worker session is not a lease and does not imply an isolated worktree.
  - `Assignment` contains one bounded objective, exact Read/Write/Verify Sets, allowed and prohibited actions, stop conditions, and `resume safety: idempotent | inspect-before-repeat | non-repeatable`.
  - `Receipt` contains the canonical result, actual changed paths, verification and omissions, boundary status, evidence validity, and resource-release outcome. Host worker identity and independence are appended only when observed and required.
  - `ResourceLease` coordinates only a real exclusive resource such as a repository writer boundary, RSP control plane, test runner, generated artifacts, browser, Broker, or hardware/classroom session. It is host/runtime state, not durable project truth.
- Requirement: Manage derives the smallest safe execution topology
  - `direct` handles one bounded action without worker orchestration; `longitudinal` resumes one primary worker across related assignments; `sequential` uses distinct ordered workers; `parallel-wave` runs independent writers or checks only with non-conflicting seams and resources; `read-only-fan-out` gathers independent evidence; `bounded-correction` returns an accepted failure to a suitable Fix worker; and `independent-verify` uses a different worker identity when the acceptance contract requires independence.
  - Topology is derived from the current frame and is not stored in the Change, Focus Capsule, configuration, or a run file. Manage may change topology only after revalidating affected authority, scope, seams, resources, and evidence.
  - A longitudinal primary worker is preferred only for one Change with a shared seam, a single writer boundary, and materially useful continuity. Independent investigation, independent Verify, truly separate slices, a fundamentally rejected strategy, or uncertain prior identity uses a fresh worker.
  - The current checkout is valid when Core did not select workspace isolation. Reports describe only observed execution location and never claim an isolated workspace from worker identity alone.
- Requirement: continuation depends on semantics rather than clocks or message counts
  - Elapsed time, poll count, heartbeat count, token count, and progress-message count do not change an Assignment result, boundary, or acceptance state.
  - Machine heartbeat records liveness for the host; user-visible progress is emitted only when it conveys a material checkpoint, decision, risk, or wait reason. A healthy long-running worker or verification command is not cancelled merely to produce a status update.
  - Explicit cancellation waits for worker and owned background-process acknowledgement. Until acknowledgement, resources remain claimed and no conflicting assignment starts.
  - Repeating work follows its declared resume safety. `idempotent` may be replayed after boundary inspection, `inspect-before-repeat` requires observing effects first, and `non-repeatable` stops for recovery or owner input rather than guessing.
  - When context growth threatens precision, Manage may perform a semantic execution rollover: accept and write back the current slice, inspect the diff and evidence, produce a minimal continuation, then derive a fresh frame. Rollover does not copy the full controller chronology or pretend the prior worker remains available.
- Requirement: correction and verification capacity follow obligations instead of one global dispatch quota
  - Remove the fixed four-dispatch ceiling across an entire managed run. Every dispatch still requires one necessary bounded Assignment and available authority, seams, resources, and acceptance capacity.
  - A failed same-scope Assignment may receive up to three bounded correction passes by default, but Manage stops earlier on the same repeated failure without new evidence, non-convergence, unavailable capability, changed scope or authority, changed behavior or acceptance, or unsafe replay.
  - Independent Verify is a separate required acceptance obligation, uses a different worker identity when the host can establish it, and does not consume the Fix correction allowance. If identity or independence cannot be established after session loss, the claim is downgraded and required verification is rerun when possible.
  - Reuse the same worker only when the frame, role, seam, strategy, and continuation evidence remain compatible. Create a fresh worker when independence or a materially new reasoning frame is the point of the assignment.
- Requirement: accepted evidence is compressed into existing durable owners
  - Raw worker messages, heartbeat, lease state, retry chronology, unaccepted receipts, and process handles remain in the current host session or its native logs. Raw verification logs remain in the host or CI artifact system.
  - After validating actual paths, diff, boundaries, omissions, and freshness, Manage writes only converged outcomes to Change Tasks, decisive verification to Verify, and real unresolved dependencies or risks to Blockers. Specs and Decisions receive only separately justified durable facts or rationale.
  - A Change remains a convergent snapshot rather than an execution diary. No receipt or verification ledger is required for acceptance, review, archive, or recovery.
- Requirement: the Focus Capsule is a sparse, portable recovery projection
  - The focus marker path remains the sole selection truth. Optional marker content is a lossy projection of the latest Manager-accepted frame, not the frame itself and never an authority or acceptance grant.
  - A commit-safe capsule uses the version comment plus only `Current`, `Evidence`, `Next`, and exceptional `Resume check` guidance. It points to existing Change content instead of duplicating tasks, logs, diffs, topology, or chronology.
  - The capsule never contains worker or agent IDs, PIDs, ports, tokens, browser handles, absolute or machine-specific workspace paths, lease holders, raw receipts, raw logs, retry chronology, or transient authority. Workers do not read or write it; Manage replaces it atomically after accepting a meaningful checkpoint.
  - Ordinary intermediate commits for an open Change may include its Change, code, tests, focus marker, and commit-safe capsule. A different device still requires the corresponding Git transfer and must rederive focus, authority, baseline, dirty state, blockers, resource availability, and evidence freshness before mutation.
  - Archive or explicit unfocus removes the marker, so a terminal archived tree retains no active capsule. A missing, stale, malformed, or unavailable capsule never overrides the selected Change or prevents evidence-based recovery from durable owners.

### Acceptance
#### Scenario: a long single-seam Change reuses one primary worker
- GIVEN one focused Change, one shared implementation seam, one writer boundary, compatible successive assignments, and no independent acceptance obligation yet
- WHEN Manage derives execution after each accepted receipt
- THEN it may resume the same WorkerSession with a new bounded Assignment, avoids repeating settled context, and writes only accepted outcomes into the Change

#### Scenario: independent work receives fresh workers
- GIVEN an independent investigation, an unrelated slice, a fundamentally rejected implementation strategy, or a required independent Verify
- WHEN Manage derives the next topology
- THEN it creates a fresh WorkerSession, preserves exact resource and authority boundaries, and never represents context continuity as independence

#### Scenario: shared-checkout execution is reported truthfully
- GIVEN Core selected no isolated workspace and a worker mutates the current checkout
- WHEN Manage validates its receipt
- THEN the execution location is reported as observed shared-checkout work, no worktree is inferred, and unrelated dirty paths remain outside the Assignment

#### Scenario: parallel assignments cannot share an exclusive resource
- GIVEN two otherwise independent assignments claim the same repository writer, test runner, generated artifact, browser, Broker, or hardware resource
- WHEN Manage considers a parallel wave
- THEN it serializes them or obtains distinct evidenced resources, and cancellation does not release a claim before acknowledgement

#### Scenario: a healthy long verification is not interrupted by time alone
- GIVEN a verification command remains live and has not crossed its Assignment boundary or stop conditions
- WHEN heartbeat or user-visible update intervals pass
- THEN its state remains running, heartbeat remains host-level, progress narration stays sparse, and no cancel or redispatch occurs solely because time or message counts increased

#### Scenario: correction stops on non-convergence while Verify remains independent
- GIVEN a same-scope Fix receipt fails with actionable evidence
- WHEN Manage performs bounded correction
- THEN it permits no more than three correction passes by default, stops earlier on repeated evidence or changed boundaries, and reserves a separately identified worker for required independent Verify

#### Scenario: cross-session recovery distrusts transient claims
- GIVEN a session ends after accepted work and a later session or device sees the committed Change and Focus Capsule
- WHEN execution resumes
- THEN Core and Manage rederive authority, baseline, dirty state, resources, blockers, and evidence freshness; unavailable worker identity or independence is downgraded and required Verify is rerun when necessary

#### Scenario: an intermediate commit carries only portable recovery state
- GIVEN an open focused Change has reached a Manager-accepted checkpoint and local commit authority exists
- WHEN the intermediate boundary is committed
- THEN the commit may include the focus marker and bounded capsule with `Current`, `Evidence`, `Next`, and exceptional `Resume check`, contains no prohibited runtime data, and still requires separate push authority for cross-device availability

#### Scenario: terminal closeout removes active focus state
- GIVEN the Change satisfies its acceptance and archive contract
- WHEN lifecycle closeout archives or explicitly unfocuses it
- THEN the marker and capsule are removed, archive and Git retain the durable history, and no runtime ledger is created

## Design
- Approach:
  - Replace the current `WorkerEnvelope`-centered and whole-run quota model with the five transient objects, while preserving existing canonical lane results, stop dispositions, acceptance layering, and authority ceilings. Project only the terms each Skill needs rather than loading a universal runtime schema everywhere.
  - Make topology a deterministic decision table over WorkOwner shape, shared seams, writer and verification resources, context-continuity value, independence requirements, replay safety, and current evidence. Keep the decision and its chronology response-only.
  - Treat worker reuse as a continuity optimization and fresh workers as an independence or reasoning-reset mechanism. Neither choice changes ownership, authority, workspace selection, or acceptance.
  - Keep the existing bounded Markdown marker mechanism and 4096-byte ceiling. Standardize a minimal recommended capsule form without introducing parsed fields or making content mandatory:

    ```md
    <!-- rsp-focus:v1 -->

    Current: {last Manager-accepted slice and remaining work}

    Evidence: {fresh / stale / unavailable summary}

    Next: {one smallest action}

    Resume check: {only exceptional recheck when needed}
    ```

  - Evaluate the change with deterministic contract fixtures and representative holdouts rather than relying on prose inspection alone.
- Boundaries:
  - Core owns WorkOwner, route, authority, and workspace-isolation selection. Manage owns frame derivation, worker topology, session reuse, assignments, receipt acceptance, resource coordination, rollover, and recovery. Disciplines own their bounded actions and result contracts. Verify owns verification execution but not independence or acceptance. Workspace owns only selected isolated-worktree mechanics and cooperative host activity records. Commit owns exact local commit execution.
  - Change, Specs, Decisions, archive, and Git retain durable project facts. Host sessions, workers, processes, leases, raw receipts, logs, and topology remain transient. The Focus Capsule bridges recovery only through sparse non-authoritative pointers.
  - The repository writer boundary covers actual overlapping mutation, not every read-only command. Resource claims are minimal, explicit, released on observed completion or acknowledged cancellation, and never used as a general worker lock.
- Affected areas:
  - `.rsp/specs/skill-control-model.md`, `.rsp/specs/core-model.md`, `.rsp/specs/skill-system.md`, `.rsp/specs/design.md`, and the local-runtime deferral Decision if clarification is needed
  - `skills/rsp/SKILL.md`, `skills/rsp/references/managed-routing.md`, `skills/rsp-manage/SKILL.md`, `skills/rsp-manage/references/interruption-recovery.md`, `skills/rsp-workspace/SKILL.md`, `skills/rsp-verify/SKILL.md`, authored fallback rules, and bilingual user documentation
  - Focus marker/capsule command contracts and focused Core, Manage, Workspace, Verify, interruption, correction, closeout, and cross-session behavior fixtures
- Constraints:
  - Preserve one focused WorkRef, one-file Changes, `open | archived`, existing focus-marker path ownership, the 4096-byte UTF-8 capsule bound, and atomic `rsp focus --capsule-file` replacement.
  - Preserve progressive disclosure, host neutrality, exact scope checking, unrelated dirty-work protection, independent-review requirements, and separate Git/push/publication authority.
  - Do not require hosts to expose worker identity, cancellation, heartbeat, or process APIs they do not have; unavailable capabilities fail or downgrade truthfully instead of being inferred.
  - Build authored package sources first and synchronize the self-hosted `.rsp/rsp-rules.md` only through the repository update flow.

## Tasks
- [x] Update the stable control, core, Skill-system, and design Specs with the transient object boundaries, derived topology rules, correction/independence semantics, receipt retention, and Focus Capsule commit/recovery contract; reconcile the local-runtime deferral Decision only if its wording would otherwise conflict.
- [x] Refactor the authored Core and Manage contracts to derive direct, longitudinal, sequential, parallel, read-only fan-out, bounded-correction, and independent-Verify execution; replace the global four-dispatch rule with Assignment-scoped convergence and correction limits.
- [x] Update interruption recovery to separate heartbeat from progress narration, require cancellation acknowledgement, apply resume-safety classes, support semantic execution rollover, and rederive evidence after session loss.
- [x] Align Workspace and Verify contracts with observed execution location, narrow ResourceLeases, shared-checkout validity, truthful independence downgrade, and fresh verification after recovery.
- [x] Tighten the Focus Capsule contract and documentation around the minimal portable template, Manager-only atomic replacement, ordinary intermediate commit inclusion, cross-device rederivation, prohibited runtime content, and marker removal at unfocus/archive.
- [x] Add deterministic contract tests and representative holdout coverage for shared-checkout work, primary-worker reuse, fresh-worker routing, resource conflicts, sparse progress, acknowledged cancellation, replay safety, bounded correction, independent Verify, stale evidence, semantic rollover, cross-session/device recovery, committed capsules, and terminal marker removal.
- [x] Build the authored package, synchronize the self-hosted fallback rules with `node dist/cli.mjs update`, and reconcile bilingual documentation and generated projections without hand-editing generated Skill copies.

- [x] Resolve reopened concern: Continued the main-model verification after the TUI blocker fix; the prior archive remains retained history and the Change stays open for the requested testing phase.

## Verify
### Required
- Automated:
  - [x] Focused Core/Manage routing and control-contract tests — `test/managed-controller-contract.test.ts`, `test/skill-contract.test.ts`, `test/rsp-workspace-skill-contract.test.ts`, and `test/rsp-verify-skill-contract.test.ts` passed 74 / 74 tests; proves: topology is derived deterministically, compatible longitudinal work reuses a worker, fresh/independent work does not, and shared-checkout execution is not mislabeled as isolated.
  - [x] Focused interruption and recovery fixtures — deterministic controller evaluation passed 21 / 21 cases; proves: elapsed time and message counts do not change assignment state, heartbeat is separate from narration, cancellation retains resources until acknowledgement, resume safety governs replay, and semantic rollover preserves only accepted state.
  - [x] Focused Workspace/resource and Verify fixtures — focused Workspace and Verify contracts passed; proves: exclusive conflicts serialize, narrow leases release truthfully, independent Verify remains a separate obligation, and unavailable identity or stale evidence downgrades instead of silently passing.
  - [x] Focus/capsule command and lifecycle tests — aggregate regression excluding the confirmed baseline TUI file passed 70 files / 777 tests; proves: bounded atomic replacement, portable content guidance, committed open-state recovery, fail-closed cross-session rederivation, and marker removal after unfocus/archive.
  - [x] Representative controller holdouts for a shared checkout, one longitudinal implementation, a fresh strategy reset, parallel independent work, conflicting resources, long verification, cancellation, non-repeatable recovery, failed corrections, stale evidence, cross-device resume, and terminal closeout — added executable harness cases `longitudinal-worker-reuse`, `fresh-strategy-reset`, and `cross-session-reverify`; their preparation contracts plus deterministic fixtures, beta composition contracts, and retained holdout assertions passed.
  - [x] `mise exec -- pnpm run build`, `node dist/cli.mjs update`, authored/fallback synchronization check, docs checks/build, typecheck, lint, and `mise exec -- pnpm run test` — passed after the independently owned TUI canonical-path correction removed the prior baseline blocker; aggregate tests passed 71 files / 780 tests.
  - [x] `mise exec -- node dist/cli.mjs check --focused --json` and `git diff --check` — passed with 0 errors and 0 warnings; proves: the selected Change and repository diff satisfy RSP and whitespace hygiene.
  - [x] Fixed-scope code and document re-review against `HEAD 140e15b` — clean after resolving the stale beta composition snapshot and adding executable harness holdouts for longitudinal reuse, fresh strategy reset, and cross-session re-verification; no unresolved in-scope finding remains.
### Optional
- Manual or environment:
  - [x] Exercise one real host that supports worker resume/cancel and one isolated capability-masked host profile — the current Codex host probe passed: a running worker acknowledged shutdown without a residual `vitest` process, the same worker identity resumed, and a new read-only Assignment passed `rsp check` without reusing the interrupted result. The local `capability-masked-host` holdout removes resume, cancel, identity, heartbeat, and process-acknowledgement capabilities; its deterministic contract and isolated preparation/scoring tests passed without provider access. A fresh read-only live holdout through the user's configured relay also matched every required signal and no forbidden claim: truthful `capability-unavailable`, retained ResourceLeases, no conflicting Assignment, `independence: unavailable`, bounded ordinary Verify, and unavailable heartbeat.
  - [x] Resume one committed open Change on a second checkout or device after an authorized Git transfer — an ephemeral local source commit and second checkout resolved the same commit, recovered the focused Change and 476-byte portable capsule with no machine-specific state, reran `rsp status`, focused `rsp check`, and `rsp ready`, then performed an offline dependency restore and passed 2 focused contract files / 66 tests before any product mutation; the ephemeral commit did not modify the main repository history.
- Coverage:
  - Covers managed control semantics, documentation, deterministic behavior contracts, one real resume/cancel-capable worker lifecycle, one isolated capability-masked negative profile, second-checkout Focus Capsule portability, and repository-wide regression. The masked profile proves controller behavior rather than external-host integration and makes no provider-generality claim; its live holdout inherited the user's configured relay and did not directly select an official-model endpoint. It does not prove every host's lifecycle API, validate a physical second device, validate live browser/Broker/classroom hardware availability, or authorize push, release, publication, or deployment for this Change.

- [x] Verify reopened concern: `mise exec -- pnpm exec vitest run test/managed-controller-contract.test.ts test/managed-controller-beta-contract.test.ts test/rsp-core-routing-contract.test.ts test/rsp-workspace-skill-contract.test.ts test/rsp-verify-skill-contract.test.ts` passed 5 files / 83 tests; `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm run build` passed; `mise exec -- pnpm run test` passed 71 files / 780 tests after the TUI blocker fix.

## Blockers
- none
