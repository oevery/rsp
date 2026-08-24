---
name: rsp-manage
description: Coordinate one eligible long-running, recovery, or multi-slice RSP goal across ready Changes or a shallow Group without expanding its authority.
license: MIT
metadata:
  author: oevery
  version: "2026.08.22.3"
---

# RSP Manage

Manage one requested goal selected by Core from an explicit request or effective `manage.activation: auto`. Enter only with one selected shape-ready Change or shallow Group plus the goal, WorkRef, authority envelope, decisive qualification evidence, closeout ceiling, and return boundaries. Manage owns same-goal coordination, evidence acceptance, review convergence, lifecycle closeout, and eligible Commit orchestration. Exact Git procedure remains owned by `rsp-commit`. Keep artifacts durable and process data transient. Automatic activation grants selection, not mutation.

Follow Core's response-versus-artifact language boundary for all user-visible control narration; when the response language differs, keep exact canonical values only as secondary parenthesized or code-formatted tokens.

## Validate the selected goal

Core owns initial Manage qualification and the `selected | declined` route result. Manage never creates, focuses, reshapes, or requalifies a durable owner. Before mutation, reread the selected Change or Group, relevant Specs and Decisions, authority envelope, `rsp status --json`, current checkout, and decisive evidence.

Stop and return to Core when the handoff is incomplete or a true owner, WorkRef topology, route, declared behavior, acceptance, interface, scope, mutation-authority, or external-action-authority boundary changed. Otherwise continue the selected goal without repeating qualification. Use only the execution location and worker capabilities supplied by the host; never infer isolation, identity, or completion.

Return one bounded managed phase result for Core's outer `ControlOutcome`:

- `solo`: no worker participates, including a bounded local Discipline action;
- `delegated`: one worker participates;
- `coordinated`: multiple workers participate or acceptance requires a separate verifier.

Mode describes observed participation, not a host lifecycle model.

## Choose the smallest execution strategy

Use only as much coordination as the current evidence requires:

- `control-action`: one Manager-owned control-plane action;
- `longitudinal`: compatible successive work through one worker when the host supports continuation;
- `sequential`: ordered work with shared seams, writers, or verification resources;
- `parallel-wave`: independent slices with disjoint mutation and verification resources;
- `read-only-fan-out`: independent evidence gathering;
- `bounded-correction`: an evidenced same-scope correction;
- `independent-verify`: acceptance requires a different worker from the accepted implementation worker.

These names explain Manager strategy only. They are not runtime states, persisted objects, or proof that dispatch occurred.

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

## Dispatch and convergence

Dispatch only for `preferred | required`; `none` invokes the local Discipline without synthetic delegation. Claim worker participation or counts only from host observations. If the host cannot start or attribute a required worker, stop before worker-owned mutation and keep acceptance incomplete.

For a Group, dispatch only children in the current `plan.waves` wave. Keep shared writers, generated artifacts, test runners, browsers, Brokers, provider sessions, hardware, and other conflicting resources sequential unless the host and checkout evidence establish safe isolation. Delegation never implies concurrency. Run lane-local checks first, then at most one affected integration gate.

Do not impose a whole-run dispatch quota. Skip optional Diagnose or Inspect work unless it materially reduces uncertainty. Required independent Verify remains a separate obligation.

## Continue and load low-frequency branches

After inspecting changed paths, local diff, and declared verification, continue only while goal, WorkRef topology, route, behavior, acceptance, interface, scope, and authority remain unchanged. Return changed boundaries to Core.

Load a low-frequency procedure only after its branch trigger is established:

- Read [interruption and recovery](references/interruption-recovery.md) only for a progress or status inquiry, explicit pause, environment or verification stop, or resume.
- Read [managed review convergence](references/review-convergence.md) only after an evidenced same-scope correction is needed or a fixed-scope review returns Findings.
- Read [lifecycle and delivery closeout](references/closeout.md) only when closeout becomes eligible from a valid selected handoff and `AcceptanceDisposition: review-clean`, for an authorized recovery checkpoint, or for an explicit push request. Before `review-clean`, every `manage.closeout` preset remains dormant.

If none of these triggers applies, do not read their references.

Persist only accepted Tasks, decisive Verify evidence, and real Blockers; never transient coordination or acceptance process. Focus Capsules remain recovery pointers, never worker coordination or authority.

Stop on missing authority, unavailable capability, failed verification, drift, unsafe replay, or limits. When work remains, return `WorkRef, Authority, Current state, Changed artifacts, Fresh verification, Blockers, and Next action`. Do not claim review, archive, Commit, push, publication, deployment, approval, or human acceptance without its owning authority and evidence.
