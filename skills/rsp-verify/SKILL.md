---
name: rsp-verify
description: Collect and report one selected RSP WorkOwner's declared check evidence, including separately required independent verification. Read-only; fixed-scope semantic judgment belongs to Review even when it includes checks.
license: MIT
metadata:
  author: oevery
  version: "2026.10.11.3"
---

# RSP Verify

For tracked work, read the [shared work model](../rsp/references/work-model.md) when its identity and ownership definitions are missing from the current context. Use logical WorkRefs in commands and reports; cite file locations separately. Direct invocation needs no prior Core execution.

Collect evidence and return one bounded read-only result for an existing RSP WorkOwner when declared-check evidence is the requested result or a separate verification obligation. A semantic review may run supporting checks without selecting this capability. Preserve explicit combined requests and required independent evidence; this Skill alone supplies no host independence. Verify is a Discipline, not a router, controller, lifecycle owner, reviewer or Git delivery capability.

## Require a declared boundary

Require one selected WorkOwner, declared boundary, comparison baseline and authority for the named checks. An explicit reference wins; otherwise resolve one FocusSet candidate from user intent and status. Multiple markers are valid.

- **Change:** use its WorkRef and its `Verify` section for the declared boundary.
- **Group:** use its Group reference and named `Integration:` condition in the Brief's `Completion Conditions`; child evidence stays with each child WorkRef. An explicit request may supply an in-progress temporary boundary, which must be written back before Group closeout.

Stop for ambiguous owner, scope, baseline, required evidence or environment, or a Group without a named boundary for the requested verification.

Read nearest project instructions and the available project protocol, selected Change and Brief, relevant Specs and Decisions, current diff, blockers, and the smallest production path needed to understand the declared check. This package needs no installed Core Skill. Do not invent checks from generic testability or replace an unexplained failure with a guessed assertion; return that symptom for read-only diagnosis.

## Preserve read-only authority

Do not edit product files, Changes, Specs, Decisions, focus markers, archives, configuration, or Git state. Do not start publication, deployment, approval, or human-acceptance actions. Running a declared local test, build, typecheck, lint, browser check, or other environment check is evidence collection only and retains the authority required by that command.

Use the caller's result contract when supplied, otherwise the direct result below. Core owns response coordination, dispatch, result validation, acceptance and closeout; Verify supplies evidence, never worker identity/isolation, `review-clean` or `archiveReady`. Identity and independence require host observations.

## Collect the declared evidence

Inspect existing evidence against the declared baseline. Reuse traceable passes while tested scope and relevant content, dependencies, configuration, tools, inputs and environment apply. Run missing, failed or invalidated named checks, plus explicitly required execution, current-environment observations or independent execution. A phase change alone requires no rerun. Match actual targets, inputs, coverage and completion to the declared check; invocation errors or incomplete observations alone prove no product defect. Retain commands, scope, sources and results, distinguishing reuse from new execution. Interpret tool observations: Required failures remain failures, unavailable checks remain gaps, and exit status alone is not acceptance.

For a tool-only obstacle, diagnose read-only and inspect actual effects before continuing:

- Change a permitted collection method only with unchanged goal, owner, scope, baseline, authority and required evidence, and demonstrably safe replay.
- Run a named mandatory command/check as required; substitutes supply no pass.
- Do not repair product/workflow state, manually replace command-owned RSP operations, replay one-shot work or continue with unknown mutation effects.
- This pass cannot supply missing required independent-worker evidence.

## Return one bounded result

Return exactly one canonical result from the collected evidence, with observed failure taking precedence over unavailable coverage:

- `fail`: at least one named required check has observed failure, even when another check is unavailable.
- `unavailable`: no named required check has observed failure, but a required tool, dependency, service, credential, or environment could not be used.
- `pass`: every named required check passed within the declared boundary.

Retain each check's outcome and every missing or unexecuted check separately. A failed result does not imply complete coverage; unavailable evidence never erases an observed failure. Aggregation does not authorize execution beyond a stop boundary.

Include these independent fields and their evidence:

- `evidence_delta: new | none`: whether the result changes the next diagnosis or correction.
- `boundary: unchanged | changed`: whether observed owner, paths, baseline, behavior, interface, scope and authority still match the declared boundary.
- WorkOwner and applicable Change WorkRef or Group `Integration:` condition; lane objective and effective authority.
- Named checks, comparison baseline, observed diff, decisive evidence with reused versus newly executed results, omissions and stop boundary.

Preserve exact machine values and all required result information. Present them concisely without repeated logs or evidence; a requested machine schema remains exact. Human-facing narration follows a supplied response-language contract; otherwise use explicit user instruction, then personal instructions, then conversation language.

`pass` proves only declared checks, not semantic review, writeback, archive/commit eligibility, publication, deployment, approval or human acceptance. It grants no lifecycle, Git, external or acceptance authority.

Long-running verification remains active while its boundary and stop conditions hold. Elapsed time, heartbeat, polling and progress messages do not change the result.

## Stop and return

Stop when evidence is missing, the environment is unavailable, the boundary changes or a required check cannot be observed. Use the caller's canonical stop reason only when supplied. For direct invocation, identify the missing input or changed boundary and the required next action; do not invent a completed verification result before the declared boundary is established.

On cancellation, wait until the command or owned process is observed stopped before beginning conflicting work. Return the result, decisive evidence, omissions and next action to the caller or user. Never turn an unavailable check into success or retry without new evidence and safe replay inside the declared boundary.
