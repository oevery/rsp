---
name: rsp-implement
description: Implement exactly one selected, ready RSP Change within explicit mutation authority. Use when the user asks to implement or fix tracked work and requires code/tests plus truthful Tasks, Blockers, and fresh verification evidence; never infer Git, publication, review, TDD, or diagnosis authority.
license: MIT
metadata:
  author: oevery
  version: "2026.07.29.1"
---

# RSP Implement

Implement one selected Change and return facts.

## Select and inspect

Require an explicit WorkRef or one unambiguous focus marker. A Group Brief is context, not executable work. Stop when selection, readiness, product authority, acceptance, or required decisions are unresolved.

Read nearest instructions, Core or fallback, Change and Brief, relevant Specs and decisions, worktree, then the smallest owning code/test chain. Use normal repository discovery; do not guess owners.

## Preserve authority

Identify outcome, owners, verification, and pre-existing work. Modify only Change requirements, Tasks, Verify, and Blockers. Preserve unrelated modified, staged, and untracked work. Stop when overlap would discard, guess, or rewrite pre-existing intent.

Git delivery, publication, deployment, approval, and out-of-scope deletion require separate explicit authority. For conflicts, inspect base/ours/theirs, preserve unrelated work, resolve only evidenced scope, rerun checks, and stop before staging, continuing, aborting, or committing. Verify named findings first.

## Classify implementation evidence

Apply these routes in order before mutation and after failure:

1. Unexplained failure → return `rsp-diagnose`, or Core's manual diagnosis fallback when unavailable.
2. No unexplained failure, plus test-first explicitly required by the user, selected Change, or project instructions, or a concrete changed risk that makes pre-mutation RED materially safer → return `rsp-tdd`, or Core's manual TDD fallback when unavailable. Behavior being testable, a test being possible, or the work being a fix is not sufficient.
3. Otherwise, sufficiently evidenced behavior, cause, and owner → continue ordinary implementation.

Diagnosis precedes TDD. Do not invoke another Skill from inside this Skill. If evidence changes the route, stop mutation and return the next action, evidence, and same selected Change. Do not reproduce either discipline inside Implement or invoke review or delivery.

## Implement and verify

Implement the smallest complete slice. Update Tasks after outcomes exist; keep unresolved issues in Blockers.

After final mutation, run required Change checks and narrower risk checks. Fresh verification is required, but a new test is only one evidence option; prefer the cheapest decisive existing test, static check, build, or acceptance evidence. Record command, scope, result, and omissions. Prior runs are stale; failed or unavailable verification cannot support completion. Rerun after relevant edits.

Keep a new test only when it protects observable behavior or a real boundary, adds distinct future confidence, avoids duplicate or implementation-detail coverage, and has proportionate maintenance cost. Otherwise remove the disposable test, fixture, and helper before completion, then use smallest sufficient final evidence. User, Change, and project retention requirements remain authoritative.

Record concise fresh evidence when Change Verify owns it. Do not create a receipt store or mandate one shell wrapper.

## Return ownership

Report whether the Change is completed, partial, blocked before implementation, verification-failed, verification-unavailable, or verification-blocked. Use failed for an exercised defect; use unavailable when a missing tool, dependency, service, credential, or environment prevents execution. Use blocked only when scoped checks pass but a required gate fails solely from a confirmed pre-existing or out-of-scope baseline defect; never waive affected gates.

When work remains, follow Core's response-versus-artifact language boundary and return `WorkRef`, `Authority`, `Current state`, `Changed artifacts`, `Fresh verification`, `Blockers`, and `Next action`. They are not durable truth; persistence requires explicit path authority.

Claim completion only when required Tasks and checks pass and no blocker remains. Do not claim review, archive, Git delivery, or release unless separately performed with explicit authority.
