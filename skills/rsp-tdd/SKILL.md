---
name: rsp-tdd
description: Drive one clear testable behavior owned by a selected RSP Change through observed RED, minimal GREEN, safe REFACTOR, and fresh verification. Use when test-first evidence is the selected next action; return unexplained failures to diagnosis and all results to the same Change.
license: MIT
metadata:
  author: oevery
  version: "2026.07.22"
---

# RSP TDD

Implement one clear behavior test-first and return observed evidence to its selected Change.

## Establish the cycle

Require one selected, ready Change, a clear observable behavior, authority to modify its test and production scope, and an executable focused check. Read the nearest project instructions, the Change and sibling Group Brief when present, relevant Specs or decisions, current worktree state, and the smallest production/test seam that owns the behavior.

Stop before mutation when behavior or acceptance is unclear, mutation authority is missing, an existing symptom has an unexplained cause, the execution environment is unavailable, or an unrelated baseline failure cannot be separated. Return the same Change, decisive evidence, and the single clarification, environment repair, baseline owner, or diagnosis needed next.

## RED

Add the smallest focused test that exercises the real owning seam. Run it before production mutation and observe it fail for the expected missing or incorrect behavior. Record the exact command, scope, result, and decisive failure.

RED is not established by a syntax, fixture, environment, or unrelated baseline failure. A passing test means the proposed test does not demonstrate missing behavior; refine the test or return the disproved premise without changing production code. An unexplained or conflicting failure returns to diagnosis rather than becoming a guessed regression test.

## GREEN

Make the minimum production change that satisfies the observed RED while preserving the Change boundary and unrelated work. Run the same focused command and require it to pass. If it fails for an unexplained reason, stop and return the evidence for diagnosis; do not widen the implementation speculatively.

## REFACTOR

Refactor only after GREEN and only when a concrete local improvement is justified. Keep behavior fixed and rerun the focused check after every relevant edit. Skip REFACTOR when no useful cleanup exists; green behavior is the gate, not permission for unrelated redesign.

## Verify and return

After the final mutation, run fresh required Change checks plus the narrow checks needed for the changed risk. A failed or unavailable check cannot support completion. Update Tasks and Verify only with observed facts, and keep unresolved authority, environment, baseline, or semantic issues in Blockers.

Return the WorkRef, behavior exercised, RED/GREEN/REFACTOR evidence, changed artifacts, fresh required checks, omissions, remaining Tasks and Blockers, and one next action. Return to the same selected Change; do not create parallel lifecycle state or recursively invoke another Skill.

When work remains, return Core's compact continuation fields in order: `WorkRef`, `Authority`, `Current state`, `Changed artifacts`, `Fresh verification`, `Blockers`, and `Next action`. Put behavior and RED/GREEN/REFACTOR evidence in `Current state`, and the exact fresh commands, results, and omissions in `Fresh verification`. Reopen authority pointers, inspect drift, and refresh verification before resuming. The continuation is not durable truth and must not be persisted without explicit path authority.

Git staging, commit, push, publication, deployment, review, archive, and approval remain separate actions requiring their own authority.
