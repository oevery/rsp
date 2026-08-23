---
name: rsp-verify
description: Verify one selected RSP Change against its declared evidence boundary without mutating product or workflow state.
license: MIT
metadata:
  author: oevery
  version: "2026.08.21.1"
---

# RSP Verify

Run one bounded, read-only verification pass for an existing RSP WorkRef. Verify owns evidence collection and the verification result; it is a Discipline, not a router, controller, lifecycle owner, reviewer, or Git delivery capability.

## Require a declared boundary

Require one explicit WorkRef or one unambiguous focus marker, the selected Change or Group context, its declared `Verify` boundary, the comparison baseline, and the authority to run the named checks. Stop when the owner, scope, baseline, required evidence, or environment is ambiguous. A Group Brief is context only; verify the selected executable child or the explicitly named integration boundary.

Read the nearest project instructions, Core or fallback, selected Change and Brief, relevant Specs and Decisions, current diff, blockers, and the smallest production path needed to understand the declared check. Do not invent checks from generic testability or replace an unexplained failure with a guessed assertion; route that case to `rsp-diagnose`.

## Preserve read-only authority

Do not edit product files, Changes, Specs, Decisions, focus markers, archives, configuration, or Git state. Do not start publication, deployment, approval, or human-acceptance actions. Running a declared local test, build, typecheck, lint, browser check, or other environment check is evidence collection only and retains the authority required by that command.

Reuse the invoking Core or Manage contract. Core owns the single outer `ControlOutcome`, route, and continuation; Manage owns execution mode, delegation, result validation, acceptance, lifecycle closeout, and commit eligibility. Verify's canonical result is nested phase evidence, not a peer outer status. Verify does not select worker identity or isolation, derive `review-clean`, or claim `archiveReady`; any identity or independence evidence comes from the host.

## Return one bounded result

Return exactly one canonical result:

- `pass`: every named required check passed within the declared boundary.
- `fail`: at least one named required check failed.
- `unavailable`: a required tool, dependency, service, credential, or environment could not be used.

Every result includes `evidence_delta: new | none` to state independently whether the pass, failure, or unavailability produced evidence that changes the next diagnosis or correction. It also includes `boundary: unchanged | changed` to state independently whether the observed owner, paths, baseline, behavior, interface, scope, or authority still matches the declared boundary. Include the WorkRef, lane objective, effective authority, named checks, comparison baseline, observed diff boundary, decisive evidence, omissions, and stop boundary. Preserve exact result and field values as machine-facing values; human-facing narration follows the invoking response-language contract.

`pass` proves only the declared verification boundary. It does not prove semantic review, durable writeback, archive readiness, commit eligibility, publication, deployment, approval, or human acceptance, and it does not grant lifecycle, Git, publication, or acceptance authority. Verify never self-reports worker identity or independence; Manage uses host observations when that distinction is required. Long-running verification remains active while its declared boundary and stop conditions hold; elapsed time, heartbeat, polling, and progress messages do not change the result.

## Stop and return

Stop with the invoking contract's canonical stop reason when evidence is missing, the environment is unavailable, the boundary changes, or a required check cannot be observed. On cancellation, do not begin conflicting work until the command or owned process is observed stopped. Return to Core or Manage with the result, decisive evidence, omissions, and the next owner; never turn an unavailable check into success and never retry without new evidence and safe replay inside the declared boundary.
