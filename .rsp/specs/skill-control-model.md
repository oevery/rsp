# Skill Control Model

## Purpose
- Define the transient vocabulary by which Core, Shape, Disciplines, and Manage route work, stop safely, accept evidence, and derive closeout eligibility.
- Keep control decisions observable without adding a persisted controller, runtime protocol, worker registry, event ledger, or host lifecycle model.

## Distribution Boundary
- This maintainer-facing Spec is not published and is never a runtime dependency of an installed Skill.
- Installed Skills own only their portable semantic behavior. Host scheduling, worker identity, sessions, cancellation, isolation, structured transport, and provider evaluation remain outside RSP product semantics.

## Control Outcome
- `ControlOutcome` is one response-only result for the current WorkRef and phase. Its modes are exactly `solo | delegated | coordinated`; its statuses are exactly `running | waiting | completed`.
- `solo` means no worker participated, `delegated` means one worker participated, and `coordinated` means multiple workers participated or acceptance required a separate verifier. Mode records observed participation, not host runtime state.
- Route, strategy, lane result, acceptance, and closeout remain nested details or gates. No control object is persisted.
- `WorkOwner` is the selected Change or shallow Group. `DecisionOwner` supplies a material decision. `NextOwner` owns the next control or execution action.

## Route and Ownership
- Core derives exactly one `RouteDisposition`: `specialist | direct | managed | shape | stop`.
- Direct execution requires one ready owner, one writer, one execution phase, one integrated decisive check, no recovery, no independent acceptance obligation, no managed lifecycle coordination, and no ready successor.
- Only a shape-ready WorkOwner may enter Manage qualification. Shape clarifies ownership and returns it to Core; it never executes product work.
- Manage-to-worker communication is bounded delegation, not phase-control transfer. Manage retains selected-goal control and acceptance.

## Frontier and Stops
- After Manage selection, `FrontierDisposition` is exactly `owner-decision | fog | evidence-needed | executable | out-of-goal`, with fail-closed precedence `out-of-goal` → `owner-decision` → `fog` → `evidence-needed` → `executable`.
- `StopDisposition` is exactly `ask-owner | return-to-shape | reroute | retry-with-evidence | environment-blocked | verification-blocked | capability-unavailable`.
- Every stop names the next owner, required input, and resume rule. No stop permits further mutation, delegation, lifecycle closeout, Git action, publication, deployment, approval, or human-acceptance claims.

## Managed Delegation
- Manage derives `DispatchDisposition: none | preferred | required` after selection. `none` permits a local Discipline action, `preferred` permits truthful local fallback, and `required` fails closed when the declared worker boundary cannot be established.
- Strategy names such as `longitudinal`, `sequential`, `parallel-wave`, `read-only-fan-out`, `bounded-correction`, and `independent-verify` explain Manager reasoning only. They are neither runtime states nor evidence that dispatch occurred.
- A delegated task carries only the WorkRef, bounded objective, authority, read/write/verify boundaries, decisive known facts, prohibited actions, stop conditions, and replay caution when needed. It carries no host lifecycle schema, correlation identity, evaluator contract, or acceptance fields.
- Each delegated Discipline owns its result. Diagnose returns cause evidence, Fix returns changed paths and verification, Verify returns named checks and evidence, and Review owns fixed-scope findings. Manage adds no universal worker receipt schema.
- A required worker result must be worker-authored, attributable through available host evidence, within authority, and validated against actual paths, diff, verification, omissions, and scope. Manager never authors, repairs, reconstructs, or substitutes it.
- Host observations may establish dispatch, attribution, activity, cancellation, completion, isolation, or distinct workers. Missing observations remain unavailable. Workers never self-certify identity, independence, resource release, evidence validity, or acceptance.
- Required independent Verify needs host evidence that the accepted implementation and verification came from different workers. A fresh context, different directory, successful check, or worker claim does not establish independence.
- Conflicting writers, generated artifacts, test runners, browsers, Brokers, provider sessions, hardware, and other shared resources remain sequential unless current host and checkout evidence establish safe isolation. No portable lease object is defined.
- Host completion, transport validity, provenance, or absence of an error never substitutes for a valid required Discipline result and Manager acceptance.

## Acceptance and Closeout
- `AcceptanceDisposition` is exactly `incomplete | evidence-complete | review-clean`.
- Accepted required Discipline results plus fresh declared implementation verification may derive `evidence-complete`. Only a clean fixed-scope review may then derive `review-clean`.
- Missing, invalid, unavailable, unattributable, or boundary-changing required results keep acceptance `incomplete`.
- `CloseoutEligibility` is exactly `not-eligible | lifecycle-ready | local-commit-ready`. Only `review-clean` plus fresh owner, authority, exact diff, decisive verification, and the durable writeback decision may produce a ready value.
- Closeout presets are authority ceilings. Push, publication, deployment, approval, and human acceptance remain separately authorized.

## Recovery and Persistence
- On pause, use host interruption when available and avoid conflicting work until active workers and owned background processes are observed stopped. Cancelling a wait does not itself stop accepted work.
- On resume, inspect effects before replay. Cross-session or cross-device recovery distrusts transient worker and liveness claims and rederives current authority, focus, checkout, blockers, resources, and evidence freshness.
- Raw worker messages, host events, retries, chronology, topology, and unaccepted evidence remain in the host session or evaluator artifacts. RSP persists only accepted outcomes in Tasks, decisive evidence in Verify, and real unresolved dependencies or risks in Blockers.

## Transition Invariants
1. Core derives one route and never persists it.
2. Shape returns a ready owner and never executes product work.
3. Manage delegates bounded tasks while retaining goal control and acceptance.
4. Required delegated work needs an attributable worker-authored Discipline result.
5. Acceptance derives from current authority and fresh evidence, never from host completion or absence of failure.
6. Independent verification depends on host-observed distinct workers, never worker self-report.
7. Closeout follows acceptance and durable review; remote delivery remains explicit.
8. Runtime and evaluator implementation details never become RSP durable or published protocol.

## Boundaries
- Core owns route derivation and rerouting.
- Shape owns clarification and ready-owner return.
- Each Discipline owns its bounded action and result.
- Manage owns selected-goal coordination, result validation, review convergence, acceptance, lifecycle closeout, and eligible Commit orchestration.
- Hosts own worker execution and lifecycle capabilities. Evaluators own machine schemas, correlation, parsing, event extraction, and provider scoring.
- Commit owns exact staging, message construction, one local commit, and post-commit observation.
