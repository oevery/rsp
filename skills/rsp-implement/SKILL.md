---
name: rsp-implement
description: Implement exactly one selected, ready RSP Change within explicit mutation authority. Use when the user asks to implement or fix tracked work and requires code/tests plus truthful Tasks, Blockers, and fresh verification evidence; never infer Git, publication, review, TDD, or diagnosis authority.
license: MIT
metadata:
  author: oevery
  version: "2026.07.22"
---

# RSP Implement

Implement exactly one selected RSP Change and return observed facts to it.

## Select and inspect

Require an explicit WorkRef or one unambiguous focus marker. A Group Brief supplies context but is not executable. Stop when selection, readiness, product authority, acceptance, or required decisions are unresolved.

Read nearest project instructions and context, the RSP core skill or fallback protocol, the selected Change and sibling Brief, relevant Specs and decisions, current worktree state, then the smallest code and test chain needed to establish ownership. Use normal repository discovery; do not guess owners or treat a heuristic projection as complete evidence.

## Preserve authority

Identify the outcome, required owners, verification, and pre-existing work before editing. Modify only what the Change requires plus its Tasks, Verify, and Blockers. Preserve unrelated modified, staged, and untracked work. An overlap is unsafe when the required edit would discard, guess, or rewrite pre-existing intent; stop then instead of overwriting it.

Git delivery, publication, deployment, approval, and out-of-scope deletion require separate explicit authority. For active conflicts, use Core's fallback: inspect base/ours/theirs semantics, preserve unrelated work, resolve only evidenced in-scope content, rerun checks, and stop before staging, continuation, abort, or commit without separate authority. Verify request-named findings before applying them and report each disposition.

## Classify implementation evidence

Before mutation and after verification failure, classify the evidence:

- An unexplained failure returns `rsp-diagnose` as the next action when that Skill is available; otherwise return Core's compact manual diagnosis fallback.
- Clear testable behavior whose gap can be shown by a focused failing test returns `rsp-tdd` as the next action when that Skill is available; otherwise return Core's compact manual TDD fallback.
- Continue ordinary implementation when the cause and edit are evidenced and neither branch applies.

Diagnosis takes precedence over TDD. Do not invoke another Skill from inside this Skill. If new evidence changes the route, stop speculative mutation and return the next action, evidence, and same selected Change to the user, Core, or authorized controller. Do not reproduce either discipline inside Implement or recursively invoke review or delivery.

## Implement and verify

Implement the smallest complete slice that satisfies the Change. Update Tasks only after the corresponding outcome exists. Keep unresolved authority, dependency, environment, or semantics visible in Blockers.

After the final relevant mutation, run the Change's required checks and any narrower project check needed for the actual risk. Preserve the exact command, scope, result, decisive output, and omitted coverage. A prior run is stale; failed or unavailable verification cannot support completion. If a verification failure leads to another relevant edit, rerun the affected check.

Record concise fresh verification evidence in the Change when its Verify section owns that evidence. Do not create a separate receipt store or impose one shell wrapper on every project.

## Return ownership

Report whether the Change is completed, partial, blocked before implementation, verification-failed, verification-unavailable, or verification-blocked. Use failed when a check exercised its intended behavior and found a defect; use unavailable when a missing tool, dependency, service, credential, or environment prevented the check from exercising it. Use blocked only when scoped checks pass but a required gate cannot pass solely because of a confirmed pre-existing or out-of-scope baseline defect; record the evidence and never waive the gate when this Change may contribute.

When work remains, return Core's compact `WorkRef`, `Authority`, `Current state`, `Changed artifacts`, `Fresh verification`, `Blockers`, and `Next action` fields. They are not durable truth; persistence requires explicit path authority.

Claim completion only when required Tasks and checks pass and no blocker remains. Do not claim review, archive, Git delivery, or release unless separately performed with explicit authority.
