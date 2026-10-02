---
name: rsp-verify
description: Verify one selected RSP WorkOwner against its declared evidence boundary without mutating product or workflow state.
license: MIT
metadata:
  author: oevery
  version: "2026.10.01.2"
---

# RSP Verify

Collect evidence and return one bounded read-only result for an existing RSP WorkOwner. Verify is a Discipline, not a router, controller, lifecycle owner, reviewer or Git delivery capability.

## Require a declared boundary

Require one selected WorkOwner, declared boundary, comparison baseline and authority for the named checks. An explicit reference wins; otherwise resolve one FocusSet candidate from user intent and status. Multiple markers are valid.

- **Change:** use its WorkRef and `Verify` section.
- **Group:** use its Group reference and named `Integration:` condition in the Brief's `Completion Conditions`; child evidence stays with each child WorkRef. An explicit request may supply an in-progress temporary boundary, which must be written back before Group closeout.

Stop for ambiguous owner, scope, baseline, required evidence or environment, or a Group without a named boundary for the requested verification.

Read nearest project instructions and the available project protocol, selected Change and Brief, relevant Specs and Decisions, current diff, blockers, and the smallest production path needed to understand the declared check. This package needs no installed Core Skill. Do not invent checks from generic testability or replace an unexplained failure with a guessed assertion; return that symptom for read-only diagnosis.

## Preserve read-only authority

Do not edit product files, Changes, Specs, Decisions, focus markers, archives, configuration, or Git state. Do not start publication, deployment, approval, or human-acceptance actions. Running a declared local test, build, typecheck, lint, browser check, or other environment check is evidence collection only and retains the authority required by that command.

Reuse a caller's result contract when supplied; otherwise the result below is sufficient for direct invocation. When Core invokes Verify, Core owns response coordination, dispatch, result validation, acceptance and closeout; Verify supplies the bounded evidence. Verify never selects worker identity or isolation, derives `review-clean`, or claims `archiveReady`. Identity and independence come from the host.

## Collect the declared evidence

Run the named checks and retain their commands, scope and observed results against the declared comparison baseline. Interpret the observations rather than treating a tool's exit or recommendation as acceptance. A failed required check remains failure evidence; an unavailable check remains a gap.

For a tool-only obstacle, diagnose read-only and inspect actual effects before continuing:

- Change a permitted collection method only with unchanged goal, owner, scope, baseline, authority and required evidence, and demonstrably safe replay.
- Run a named mandatory command/check as required; substitutes supply no pass.
- Do not repair product/workflow state, manually replace command-owned RSP operations, replay one-shot work or continue with unknown mutation effects.
- This pass cannot supply missing required independent-worker evidence.

## Return one bounded result

Return exactly one canonical result:

- `pass`: every named required check passed within the declared boundary.
- `fail`: at least one named required check failed.
- `unavailable`: a required tool, dependency, service, credential, or environment could not be used.

Include these independent fields and their evidence:

- `evidence_delta: new | none`: whether the result changes the next diagnosis or correction.
- `boundary: unchanged | changed`: whether observed owner, paths, baseline, behavior, interface, scope and authority still match the declared boundary.
- WorkOwner and applicable Change WorkRef or Group `Integration:` condition; lane objective and effective authority.
- Named checks, comparison baseline, observed diff, decisive evidence, omissions and stop boundary.

Preserve exact machine values. Human-facing narration follows a supplied response-language contract; otherwise use explicit user instruction, then personal instructions, then conversation language.

`pass` proves only the declared checks, not semantic review, durable writeback, archive readiness, commit eligibility, publication, deployment, approval or human acceptance. It grants no lifecycle, Git, publication or acceptance authority. Identity and independence require host observations, not Verify's self-report.

Long-running verification remains active while its boundary and stop conditions hold. Elapsed time, heartbeat, polling and progress messages do not change the result.

## Stop and return

Stop when evidence is missing, the environment is unavailable, the boundary changes or a required check cannot be observed. Use the caller's canonical stop reason only when supplied. For direct invocation, identify the missing input or changed boundary and the required next action; do not invent a completed verification result before the declared boundary is established.

On cancellation, wait until the command or owned process is observed stopped before beginning conflicting work. Return the result, decisive evidence, omissions and next action to the caller or user. Never turn an unavailable check into success or retry without new evidence and safe replay inside the declared boundary.
