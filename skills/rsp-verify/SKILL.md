---
name: rsp-verify
description: Verify one selected RSP Change against its declared evidence boundary without mutating product or workflow state.
license: MIT
metadata:
  author: oevery
  version: "2026.08.07.1"
---

# RSP Verify

Run one bounded, read-only verification pass for an existing RSP WorkRef. Verify owns evidence collection and the verification result; it is a Discipline, not a router, controller, lifecycle owner, reviewer, or Git delivery capability.

## Require a declared boundary

Require one explicit WorkRef or one unambiguous focus marker, the selected Change or Group context, its declared `Verify` boundary, the comparison baseline, and the authority to run the named checks. Stop when the owner, scope, baseline, required evidence, or environment is ambiguous. A Group Brief is context only; verify the selected executable child or the explicitly named integration boundary.

Read the nearest project instructions, Core or fallback, selected Change and Brief, relevant Specs and Decisions, current diff, blockers, and the smallest production path needed to understand the declared check. Do not invent checks from generic testability or replace an unexplained failure with a guessed assertion; route that case to `rsp-diagnose`.

## Preserve read-only authority

Do not edit product files, Changes, Specs, Decisions, focus markers, archives, configuration, or Git state. Do not start publication, deployment, approval, or human-acceptance actions. Running a declared local test, build, typecheck, lint, browser check, or other environment check is evidence collection only and retains the authority required by that command.

Reuse the invoking Core or Manage contract. Core owns route and continuation; Manage owns the ExecutionFrame, WorkerSession and Assignment, worker identity, independent-verification status, ResourceLease coordination, acceptance, lifecycle closeout, and commit eligibility. Verify does not create or persist those objects, select isolation, derive `review-clean`, or claim `archiveReady`.

## Return one bounded result

Return exactly one canonical result:

- `pass`: every named required check passed within the declared boundary.
- `failed-with-new-evidence`: a check failed and produced evidence that changes the next diagnosis or correction.
- `failed-without-new-evidence`: a check failed without materially new evidence.
- `unavailable`: a required tool, dependency, service, credential, or environment could not be used.
- `boundary-changed`: the observed owner, paths, baseline, behavior, interface, scope, or authority no longer matches the declared boundary.

Every result includes the WorkRef, lane objective, effective authority, named checks, comparison baseline, observed diff boundary, decisive evidence, omissions, and stop boundary. Preserve exact result values as machine-facing values; human-facing narration follows the invoking response-language contract.

`pass` proves only the declared verification boundary. It does not prove semantic review, durable writeback, archive readiness, commit eligibility, publication, deployment, approval, or human acceptance, and it does not grant lifecycle, Git, publication, or acceptance authority. Independent worker identity is reported only when the host and invoking Manage contract establish it; Verify must not infer independence from a successful check, a fresh context, or a different execution directory. Long-running verification remains active while its Assignment boundary and stop conditions hold; elapsed time, heartbeat, polling, and progress messages do not change the result.

## Stop and return

Stop with the invoking contract's canonical stop reason when evidence is missing, the environment is unavailable, the boundary changes, or a required check cannot be observed. On cancellation, retain any exclusive resource claim until the command or owned process acknowledges termination. Return to Core or Manage with the result, decisive evidence, omissions, and the next owner; never turn an unavailable check into success and never retry without new evidence, safe replay under the invoking Assignment, and its bounded correction contract.
