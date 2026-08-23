---
name: rsp-implement
description: Implement exactly one selected, ready RSP Change within explicit mutation authority. Use when the user asks to implement or fix tracked work and requires code and tests plus truthful Tasks, Blockers, and fresh verification evidence; never infer Git, publication, review, TDD, or diagnosis authority.
license: MIT
metadata:
  author: oevery
  version: "2026.08.23.1"
---

# RSP Implement

Implement one selected Change and return facts.

Follow Core's response-versus-artifact language boundary for all user-visible control narration; when the response language differs, keep exact canonical values only as secondary parenthesized or code-formatted tokens.

## Select and inspect

Require an explicit WorkRef or one unambiguous focus marker. A Group Brief is context, not executable work. Stop when selection, readiness, product authority, acceptance, or required decisions are unresolved.

Read nearest instructions, Core or fallback, Change and Brief, relevant Specs and decisions, current checkout, then the smallest owning code and test chain. Use normal repository discovery; do not guess owners. Operate only in the execution location actually supplied by the host; Implement never selects or migrates execution environments.

## Preserve authority

Identify outcome, owners, verification, and pre-existing work. Modify only Change requirements, Tasks, Verify, and Blockers. Preserve unrelated modified, staged, and untracked work. Stop when overlap would discard, guess, or rewrite pre-existing intent.

Git delivery, publication, deployment, approval, and out-of-scope deletion require separate explicit authority. For conflicts, inspect base/ours/theirs, preserve unrelated work, resolve only evidenced scope, rerun checks, and stop before staging, continuing, aborting, or committing. Verify named findings first.

## Admit boundaries and permanent tests

Before adding a validator, fallback, defensive copy, capability, state machine, compatibility path, or public option, identify its current producer, production consumer, actual trust or lifecycle transition, and material consequence. A typed same-process value, imagined future caller, or test/document-only consumer does not establish a production boundary. Keep an explicitly required seam, but otherwise do not create one when this evidence is missing.

Before creating or extending a permanent test, identify the observable consequence, one distinct plausible regression in the owning production seam, why existing evidence misses it, and the maintenance cost. Prefer an existing test, type or static check, build, or acceptance check when it already owns the risk. When the requested behavior belongs to a consumer and downstream adapters or forwarding hops already have owners and coverage, exercise the consumer through those existing seams to the observable consequence. A nearest-spy, emitted-message, shared-constant, or forwarding assertion that only re-proves the downstream hop is not sufficient, even when added to an existing test file. Do not add one test per touched file, wrapper, forwarding hop, branch, or shared constant. Multiple nearby tests remain justified when each protects an independent consequence.

## Classify implementation evidence

Apply these routes in order before mutation and after failure:

1. Unexplained failure → return `rsp-diagnose`, or Core's manual diagnosis fallback when unavailable.
2. No unexplained failure, plus test-first explicitly required by the user, selected Change, or project instructions, or a concrete changed risk that makes pre-mutation RED materially safer → return `rsp-tdd`, or Core's manual TDD fallback when unavailable. Behavior being testable, a test being possible, or the work being a fix is not sufficient.
3. Otherwise, sufficiently evidenced behavior, cause, and owner → continue ordinary implementation.

Diagnosis precedes TDD. Do not invoke another Skill from inside this Skill. If evidence changes the route, stop mutation and return the next action, evidence, and same selected Change. Do not reproduce either discipline inside Implement or invoke review or delivery.

## Implement and verify

Implement the smallest complete slice. Update Tasks after outcomes exist; keep unresolved issues in Blockers.

After final mutation, run required Change checks and narrower risk checks. Fresh verification is required, but a new test is only one evidence option; prefer the cheapest decisive existing test, static check, build, or acceptance evidence. Record command, scope, result, and omissions. Prior runs are stale; failed or unavailable verification cannot support completion. Rerun after relevant edits.

Keep a new or extended test only when it still satisfies the admission evidence, protects observable behavior or a real boundary, adds distinct future confidence, avoids duplicate or implementation-detail coverage, and has proportionate maintenance cost. Otherwise remove the disposable test, fixture, and helper before completion, then use smallest sufficient final evidence. User, Change, and project retention requirements remain authoritative.

Before returning, reread changed comments, test names, documentation, and handoff prose from the accepted result and each surface's authoritative baseline. Build the final handoff only from the accepted Change, actual changed paths, final verification, material omissions or risks, executed external actions, and pre-existing user work that must be attributed. A rejected session-only alternative, correction, or temporary attempt is not an omission or boundary: do not name it, paraphrase it, or turn it into an unrequested `did not add` or `did not use` compliance claim.

Preserve a negative fact when a reader without the session needs it to understand an actual baseline removal, safety or compatibility boundary, migration, audit result, failed external action, unresolved risk, or explicitly requested comparison. Preserve required facts and pre-existing user work; never change executable behavior, public contracts, tests, snapshots, or diagnostics merely to clean wording.

Record concise fresh evidence when Change Verify owns it.

## Return ownership

Report whether the Change is completed, partial, blocked before implementation, verification-failed, verification-unavailable, or verification-blocked. Use failed for an exercised defect; use unavailable when a missing tool, dependency, service, credential, or environment prevents execution. Use blocked only when scoped checks pass but a required gate fails solely from a confirmed pre-existing or out-of-scope baseline defect; never waive affected gates.

When work remains, return `WorkRef`, `Authority`, `Current state`, `Changed artifacts`, `Fresh verification`, `Blockers`, and `Next action`. They are not durable truth; persistence requires explicit path authority.

Claim completion only when required Tasks and checks pass and no blocker remains. Do not claim review, archive, Git delivery, or release unless separately performed with explicit authority.
