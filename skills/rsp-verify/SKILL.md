---
name: rsp-verify
description: Verify one selected RSP WorkOwner against its declared evidence boundary without mutating product or workflow state.
license: MIT
metadata:
  author: oevery
  version: "2026.08.21.1"
---

# RSP Verify

Run one bounded, read-only verification pass for an existing RSP WorkOwner. Verify owns evidence collection and the verification result; it is a Discipline, not a router, controller, lifecycle owner, reviewer, or Git delivery capability. A Change WorkOwner uses its WorkRef and declared `Verify` boundary. A Group WorkOwner uses its Group reference and a named `Integration:` condition from the Group Brief's `Completion Conditions`; child Change evidence remains attached to each child WorkRef.

## Require a declared boundary

Require one explicit WorkOwner reference or one AI-resolved candidate from the open FocusSet, the selected Change or Group, its declared boundary, the comparison baseline, and the authority to run the named checks. Multiple focus markers are valid candidates; resolve one from user intent and current status before verification. A Change boundary comes from its `Verify` section. A Group boundary comes from a named `Integration:` condition in the Group Brief's `Completion Conditions`; an explicit request may supply a temporary boundary for an in-progress pass, but that boundary must be written back before Group closeout. Stop when the owner, scope, baseline, required evidence, or environment is ambiguous, or when a Group has no named boundary for the requested verification.

Read the nearest project instructions, Core or fallback, selected Change and Brief, relevant Specs and Decisions, current diff, blockers, and the smallest production path needed to understand the declared check. Do not invent checks from generic testability or replace an unexplained failure with a guessed assertion; return that symptom for Implement's read-only diagnosis mode.

## Preserve read-only authority

Do not edit product files, Changes, Specs, Decisions, focus markers, archives, configuration, or Git state. Do not start publication, deployment, approval, or human-acceptance actions. Running a declared local test, build, typecheck, lint, browser check, or other environment check is evidence collection only and retains the authority required by that command.

Reuse the invoking Core contract. Core owns the optional response summary and, on a qualified coordination branch, dispatch, result validation, acceptance and closeout. Verify's result is nested phase evidence. Verify does not select worker identity or isolation, derive `review-clean`, or claim `archiveReady`; identity and independence come from the host.

## Return one bounded result

Return exactly one canonical result:

- `pass`: every named required check passed within the declared boundary.
- `fail`: at least one named required check failed.
- `unavailable`: a required tool, dependency, service, credential, or environment could not be used.

Every result includes `evidence_delta: new | none` to state independently whether the pass, failure, or unavailability produced evidence that changes the next diagnosis or correction. It also includes `boundary: unchanged | changed` to state independently whether the observed owner, paths, baseline, behavior, interface, scope, or authority still matches the declared boundary. Include the WorkOwner reference, the Change WorkRef or Group `Integration:` boundary when applicable, lane objective, effective authority, named checks, comparison baseline, observed diff boundary, decisive evidence, omissions, and stop boundary. Preserve exact result and field values as machine-facing values; human-facing narration follows the invoking response-language contract.

`pass` proves only the declared verification boundary. It does not prove semantic review, durable writeback, archive readiness, commit eligibility, publication, deployment, approval, or human acceptance, and it does not grant lifecycle, Git, publication, or acceptance authority. Verify never self-reports worker identity or independence; Core uses host observations when required. Long-running verification remains active while its declared boundary and stop conditions hold; elapsed time, heartbeat, polling, and progress messages do not change the result.

## Stop and return

Stop with the invoking contract's canonical stop reason when evidence is missing, the environment is unavailable, the boundary changes, or a required check cannot be observed. On cancellation, do not begin conflicting work until the command or owned process is observed stopped. Return the result, decisive evidence, omissions, and next action to Core; never turn an unavailable check into success and never retry without new evidence and safe replay inside the declared boundary.
