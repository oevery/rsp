---
kind: "feature"
---

# Change: manage-orchestration-beta/evidence-frontier-execution

## Proposal
- Outcome: For an Intake-confirmed ready managed owner, coordinate a transient decision frontier that resolves runtime uncertainty with bounded evidence lanes, one authorized Fix writer, and independent risk verification without inventing product decisions or durable controller state.
- Why:
  - Managed execution needs to distinguish a factual question that can be inspected from a material owner choice, unformulable fog, and work outside the selected goal before it dispatches a worker or permits a mutation.
  - Existing diagnosis, implementation, review, and closeout boundaries remain useful; the missing contract is the Manager's bounded selection and acceptance of those capabilities.
- Scope:
  - Define deterministic execution classification order, lane envelopes and receipts, requalification, mutation and verification boundaries, retry limits, and stops.
  - Reuse `rsp-diagnose` for Diagnose and `rsp-implement` for Fix; add private Manager-only read-only Inspect and Verify lanes without introducing public Skills.
  - Preserve current worker, corrective-retry, review-convergence, authority, and Group concurrency limits.
- Non-goals:
  - Do not move the frontier into Core, create `rsp-inspect` or `rsp-verify`, introduce numeric scores, persist dispatch history, or replace `rsp-review`.
  - Do not grant workers focus, topology/planning, lifecycle, Git, publication, deployment, approval, or human-acceptance authority.

## Spec
### ADDED
- Requirement: execution classifies newly surfaced unknowns before work selection
  - For an Intake-confirmed ready owner, Manager classifies each newly surfaced unknown in this exact order: `out-of-goal`, `owner-decision`, `fog`, `evidence-needed`, then `ready-to-execute`.
  - `out-of-goal` stops for topology or authority resolution. `owner-decision` stops with the single highest-impact owner question. `fog` creates no synthetic Task, Change, Blocker, or worker dispatch and returns to Core/Shape unless an independently ready owned slice can continue.
  - `evidence-needed` is a precise factual question answerable without choosing behavior, acceptance, public interface, scope, mutation authority, external action, or human acceptance; evidence that crosses any of those boundaries becomes the applicable stop instead of Fix selection.
- Requirement: every lane has a bounded authority envelope
  - Every `WorkerEnvelope` contains `WorkRef`, lane, objective, current hypothesis when one exists, known evidence, allowed paths, allowed actions and commands, prohibited actions, comparison baseline, expected result schema, and stop conditions.
  - Token counts or token limits are not envelope fields and never influence dispatch, authority, continuation, completion, or acceptance.
  - A Diagnose lane reuses `rsp-diagnose` and is read-only until it returns a discriminating cause or an explicit no-cause result.
  - A private Inspect lane may gather one independent read-only evidence packet only when its paths and verification resources are demonstrably isolated from other active lanes.
  - A Fix lane reuses `rsp-implement`, receives explicit in-scope mutation authority, and is the sole product writer at its mutation boundary.
  - A private Verify lane is read-only and runs only for the Change-declared risk or after failed correction; fixed-scope review remains owned by `rsp-review`. Independent Verify requires a worker identity distinct from the accepted Fix worker. If the host cannot establish that identity boundary, Manager records `independence: unavailable`, may perform ordinary read-only verification, and must not claim independent verification.
- Requirement: result acceptance and recovery are deterministic
  - Diagnose and Inspect return exactly `confirmed-same-scope`, `unresolved-same-scope`, or `boundary-changed`, plus decisive evidence and the next safe discriminating check when one exists.
  - Fix returns exactly `changed-same-scope`, `no-change`, or `boundary-changed`, plus changed paths, fresh verification evidence, and its stop boundary.
  - Verify returns exactly `pass`, `failed-with-new-evidence`, `failed-without-new-evidence`, `unavailable`, or `boundary-changed`, plus the named checks, observed diff boundary, and `independence: established | unavailable`.
  - Every receipt also contains WorkRef, lane objective, effective authority, decisive evidence, and stop boundary. Manager inspects the actual diff and fresh verification before accepting it.
  - Evidence returns trigger preflight and qualification rederivation before later mutation or dispatch. A failed correction may use at most one evidenced corrective retry; total worker dispatch remains at most four across the managed run.
  - Dispatch limits protect completion capacity dynamically rather than allocating token or fixed per-lane quotas. Manager must not start an optional Diagnose or Inspect dispatch if doing so would leave insufficient remaining dispatch capacity for the currently required Fix and Verify obligations. A corrective retry may start only when the remaining capacity and verification resources can still produce decisive acceptance evidence; otherwise Manager stops.
  - Managed review convergence remains at most three Resolve Findings passes per Change and is separate from worker retry accounting. Repeated no-evidence correction, missing verification, capability unavailability, drift, or any authority boundary stops dispatch.
- Requirement: execution state remains transient
  - Frontier classification, lane selection, parallel/sequential reasoning, receipts, dispatch counts, retry accounting, and resume chronology remain response-only process data.
  - Converged requirements and design belong in the selected Change, real dependencies in `Blockers`, and durable facts/rationale in ordinary durable review; no frontier file, ticket map, ledger, run registry, ambient hook, or numeric routing score is created.

### Acceptance
#### Scenario: factual evidence precedes a single writer
- GIVEN an Intake-confirmed ready Change with an unexplained but precise in-scope technical failure
- WHEN Manager classifies it as `evidence-needed`
- THEN it dispatches only permitted read-only Diagnose or isolated Inspect work, rederives qualification from returned evidence, and permits at most one authorized Fix writer after a cause is confirmed

#### Scenario: decision, fog, and scope cases do not become fake execution
- GIVEN the next managed step needs a material human choice, cannot yet be formulated precisely, or lies outside the selected goal
- WHEN Manager evaluates its frontier
- THEN it returns the matching owner/Shape/topology stop without synthesizing work or mutating durable state

#### Scenario: verification and correction remain bounded
- GIVEN a Fix with a declared regression risk or failed decisive verification
- WHEN Manager accepts its receipt
- THEN independent Verify is limited to that risk or correction result, worker dispatch stays within four, at most one evidenced corrective retry runs, and repeated or unverifiable failure stops

#### Scenario: optional evidence cannot consume required completion capacity
- GIVEN an optional additional Diagnose or Inspect lane and known remaining Fix or Verify obligations
- WHEN the total dispatch ceiling cannot accommodate both
- THEN Manager skips the optional lane and preserves the required completion path, or stops when no decisive completion path fits

#### Scenario: independent verification is never fabricated
- GIVEN a Fix result that requires independent Verify
- WHEN the host cannot establish a different Verify worker identity
- THEN Manager records `independence: unavailable`, may report ordinary read-only verification separately, and does not claim independent verification

## Design
- Adoption basis:
  - Independently reimplement `research/models/rsp-engineering-domain-model.md` Recommendation C7 inside one RSP Workspace: Managed delivery remains removable, authority-bounded, and subordinate to existing Change/Group owners.
  - Use `research/models/rsp-capability-coverage.md` C11 only as model-level evidence for fog, precise questions, and frontier movement; do not adopt Wayfinder's external tracker, ticket map, persistent decision state, or multi-session hierarchy.
  - Preserve the decisions from `codex://threads/019fca54-f6c4-79e0-a3c1-6d47601a442d` and `codex://threads/019fca5e-f905-7e22-bb49-4cd701d96229`: deterministic decision rules, complete transient packets, single-writer Fix, truthful independent Verify, execution-count bounds, and no token budget or scoring route.
- Approach:
  - Keep the decision frontier wholly inside Manage Execution, after Intake's `ready` return. The classification order prevents a factual investigation from hiding an owner decision or scope change.
  - Use Diagnose and Inspect only for read-only evidence; rederive authority after evidence; sequence all product mutation through one Fix writer; verify independently only when the declared risk needs it.
  - Treat `WorkerEnvelope` and lane-specific receipts as transient domain messages between Manager and workers. They are not Tasks, lifecycle state, or a second work store.
  - Use dispatch-count, retry, concurrency, evidence-progress, and authority stops as execution bounds. Token consumption is intentionally outside the control model because task complexity is not comparable across goals.
  - Adopt Wayfinder's useful distinction between a precise question, fog, owner decision, evidence, and frontier only as internal control semantics; RSP remains artifact- and authority-centered.
- Boundaries:
  - Core selects a route and owns Shape re-entry; it does not hold a frontier. Manager owns classification, envelope construction, receipt acceptance, requalification, and stop behavior.
  - `rsp-diagnose`, `rsp-implement`, and `rsp-review` retain their existing public discipline contracts. Inspect and Verify are private Manager lanes and must not be independently invoked or documented as public Skills.
- Affected areas:
  - `skills/rsp-manage/SKILL.md`, `skills/rsp/references/managed-routing.md`, and only the necessary Core route language
  - `rules/rsp-rules.md`, generated fallback synchronization, `test/managed-controller-contract.test.ts`, `test/managed-controller/**`, and `scripts/managed-controller-eval.mjs`
- Constraints:
  - Preserve total worker dispatch `≤ 4`, corrective retry `≤ 1`, managed review convergence `≤ 3` passes per Change, and serial-by-default mutation safety.
  - Optional evidence work never consumes capacity already required by the current acceptance path. Stop rather than start a correction that cannot still be decisively verified.
  - Group children run in parallel only with isolated paths and verification resources; all overlaps, dependent work, real hosts, provider sessions, generated outputs, and shared locks are sequential.
  - Missing host capability is a no-dispatch/manual fallback, never an invitation for Manager to absorb an unauthorized implementation task.

## Tasks
- [x] Define the execution frontier classification order and exact stops in Manager, keeping Core free of runtime discovery classification.
- [x] Implement the complete token-independent `WorkerEnvelope` and exact Diagnose, Inspect, Fix, and Verify receipt schemas.
- [x] Enforce dynamic Fix/Verify capacity protection, single-writer mutation, isolated-only read concurrency, corrective/review limits, and truthful independent-Verify downgrade behavior.
- [x] Synchronize fallback rules and add focused behavioral contracts for packet completeness, lane results, capacity protection, independent verification, boundary stops, retry exhaustion, and absence of persisted controller state.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/managed-controller-contract.test.ts test/rsp-core-routing-contract.test.ts test/skill-runtime-context-contract.test.ts` and `node scripts/managed-controller-eval.mjs contract` — 73 focused tests and all 17 deterministic fixtures passed; proves classification order, complete packet fields, exact result schemas, capacity protection, independent-Verify truthfulness, Core separation, and no durable frontier.
  - [x] `mise exec -- pnpm run build`, `node dist/cli.mjs update`, fallback byte comparison, `mise exec -- pnpm run lint`, `mise exec -- pnpm run test`, and `git diff --check` — build/update/fallback/diff passed, lint passed after correcting fixture quoting, and all 55 files / 643 tests passed.
- Manual or environment:
  - [x] A Verify worker with identity distinct from the accepted Fix worker inspected the exact diff and lane contracts. It established independent verification, confirmed the token-independent execution model, and found one missing `ManagedControllerCase.sources` declaration; the declaration was added and the focused contracts were rerun.
- Coverage:
  - Does not establish beta rollout outcome, multi-provider generality, release safety, or external tracker interoperability; the bounded beta evidence is owned by the dependent evaluation Change. Full-project typecheck currently reaches only the separate beta-evaluation boundary and fails because `scripts/managed-controller-beta.mjs` has no declaration file.

## Blockers
- requires `manage-orchestration-beta/managed-intake-routing`: Execution begins only after Intake has confirmed one ready owner and established the Shape return contract.
