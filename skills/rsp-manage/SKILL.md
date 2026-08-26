---
name: rsp-manage
description: Coordinate one eligible long-running, recovery, or multi-slice RSP goal across ready Changes or a shallow Group without expanding its authority.
license: MIT
metadata:
  author: oevery
  version: "2026.08.22.3"
---

# RSP Manage

Manage one requested goal selected by Core from an explicit request or effective `manage.activation: auto`. Enter with one selected shape-ready Change or shallow Group plus a bounded next action, WorkOwner reference, authority pointer, decisive qualification result, closeout ceiling, and return boundaries. Manage owns same-goal coordination, evidence acceptance, review convergence, lifecycle closeout, and delivery-kind orchestration. Exact Git procedure remains owned by `rsp-commit`. Keep artifacts durable and process data transient; do not create a persisted GoalEnvelope or controller record. Automatic activation may complete an authorized Shape → Core → Manage route, but configuration grants no product or delivery authority.

Follow Core's response-versus-artifact language boundary for all user-visible control narration; when the response language differs, keep exact canonical values only as secondary parenthesized or code-formatted tokens.

## Validate the selected goal

Core owns initial Manage qualification and the `selected | declined` route result. Manage never creates, focuses, or reshapes a durable owner and never repeats direct-versus-managed qualification. Before mutation, reread the selected Change or Group, relevant Specs and Decisions, the current authority pointer, plain `rsp status`, current checkout, and decisive evidence. Use `rsp status --json` only when exact dependency fields are needed.

Stop and return to Core when the handoff is incomplete or a true owner, WorkOwner topology, route, declared behavior, acceptance, interface, scope, mutation-authority, or external-action-authority boundary changed. Otherwise continue the selected goal and re-read only the authoritative facts needed by the current checkpoint. Use only the execution location and worker capabilities supplied by the host; never infer isolation, identity, or completion.

Return one bounded managed phase result for Core's response summary:

- `solo`: no worker participates, including a bounded local Discipline action;
- `delegated`: one worker participates;
- `coordinated`: multiple workers participate or acceptance requires a separate verifier.

Mode describes observed participation, not a host lifecycle model. Hosts own worker execution and lifecycle capabilities; Manage consumes those host observations without creating RSP runtime objects.

## Choose the smallest execution strategy

Use only as much coordination as the current evidence requires:

- `control-action`: one Manager-owned control-plane action;
- `longitudinal`: compatible successive work through one worker when the host supports continuation and bounded context handoff;
- `sequential`: ordered work with shared seams, writers, or verification resources;
- `parallel-wave`: independent slices with disjoint mutation and verification resources;
- `read-only-fan-out`: independent evidence gathering;
- `bounded-correction`: an evidenced same-scope correction;
- `independent-verify`: acceptance requires a different worker from the accepted implementation worker.

These names explain Manager strategy only. They are not runtime states, persisted objects, or proof that dispatch occurred.

One selected Change may use one worker for `rsp-implement` and ordinary `rsp-verify` when context isolation, compatible continuation, or multiple phases makes delegation useful. This path is normally `preferred`; it becomes `required` only when the declared acceptance requires worker-owned execution or a separate verifier.

Derive `DispatchDisposition` after selection:

| Value | Use when | If unavailable |
| --- | --- | --- |
| `none` | No useful or required worker seam exists. | Run the bounded local Discipline. |
| `preferred` | Delegation improves focus or continuity without creating an acceptance obligation. | Continue locally within the same owner and authority. |
| `required` | The request or declared acceptance requires delegated work or a separate verifier. | Stop `capability-unavailable`; acceptance remains `incomplete`. |

`required` remains fail-closed for the current phase. Invoke an actual host worker capability before worker-owned work; never perform the assigned work locally and simulate worker participation or a worker result. If the host cannot start or attribute the required worker, stop before worker-owned mutation and keep acceptance incomplete. Convenience, cost, or local capability never downgrades it.

## Resolve the frontier

Classify new unknowns in fail-closed order: `out-of-goal` → `owner-decision` → `fog` → `evidence-needed` → `executable`.

- `out-of-goal`: stop `reroute`.
- `owner-decision`: ask the `DecisionOwner` one highest-impact question; stop `ask-owner`.
- `fog`: create no synthetic work or mutation; stop `return-to-shape`.
- `evidence-needed`: collect one bounded factual answer without crossing an earlier boundary.
- `executable`: choose one Discipline only after ownership, authority, and required evidence are settled.

Use Core's canonical stop vocabulary. No stop permits another dispatch, product mutation, lifecycle closeout, or Git action before its resume rule succeeds.

## Load worker delegation conditionally

For `DispatchDisposition: none`, do not read worker delegation procedure or claim worker participation; invoke the bounded local Discipline. For `preferred | required`, read [delegation and host evidence](references/delegation.md) before preparing a worker task or accepting a worker result.

Derive `AcceptanceDisposition` independently:

```text
accepted required Discipline results + fresh declared verification → evidence-complete
evidence-complete + clean fixed-scope review                   → review-clean
```

Every missing, invalid, unavailable, or boundary-changing required result keeps acceptance `incomplete`. Implementation verification, fixed-scope review, and the durable writeback decision remain separate gates.

The same worker may provide the Fix and ordinary Verify results for one Change. Manage may accept that evidence as `evidence-complete` after checking paths, diff, named verification, omissions, and scope. It never satisfies `independent-verify`; that gate requires distinct worker evidence.

## Dispatch and convergence

Dispatch only for `preferred | required`; `none` invokes the local Discipline without synthetic delegation. Claim worker participation or counts only from host observations. If the host cannot start or attribute a required worker, stop before worker-owned mutation and keep acceptance incomplete.

For a Group, dispatch only children in the current `plan.waves` wave. Keep shared writers, generated artifacts, test runners, browsers, Brokers, provider sessions, hardware, and other conflicting resources sequential unless the host and checkout evidence establish safe isolation. Delegation never implies concurrency. Run lane-local checks first, then at most one affected integration gate.

Do not impose a whole-run dispatch quota. Skip optional Diagnose or Inspect work unless it materially reduces uncertainty. Required independent Verify remains a separate obligation.

## Continue and load low-frequency branches

After inspecting changed paths, local diff, and declared verification, continue only while goal, WorkOwner topology, route, behavior, acceptance, interface, scope, and authority remain unchanged. Same-owner phase results stay in Manage. At closeout, derive one delivery kind: direct, change, integration, group, or release. Return changed boundaries to Core; Core may continue, invoke Shape, ask the owner, or stop.

Load a low-frequency procedure only after its branch trigger is established:

- Read [interruption and recovery](references/interruption-recovery.md) only for a progress or status inquiry, explicit pause, environment or verification stop, or resume.
- Read [managed review convergence](references/review-convergence.md) only after an evidenced same-scope correction is needed or a fixed-scope review returns Findings.
- Read [lifecycle and delivery closeout](references/closeout.md) only when closeout becomes eligible from a valid selected handoff and `AcceptanceDisposition: review-clean`, for an authorized recovery checkpoint, or for an explicit push request. Before `review-clean`, every `manage.closeout` preset remains dormant.

If none of these triggers applies, do not read their references.

Persist only accepted Tasks, decisive Verify evidence, and real Blockers; never transient coordination or acceptance process. Focus Capsules remain recovery pointers, never worker coordination or authority.

Stop on missing authority, unavailable capability, failed verification, drift, unsafe replay, or limits. When work remains, return `WorkOwner reference, Authority, Current state, Changed artifacts, Fresh verification, Blockers, and Next action`; include child WorkRefs when a Group result depends on specific Changes. Do not claim review, archive, Commit, push, publication, deployment, approval, or human acceptance without its owning authority and evidence.
