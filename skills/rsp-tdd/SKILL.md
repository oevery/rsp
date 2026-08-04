---
name: rsp-tdd
description: Drive one clear testable behavior owned by a selected RSP Change through observed RED, minimal GREEN, safe REFACTOR, and fresh verification. Use when test-first evidence is the selected next action; return unexplained failures to diagnosis and all results to the same Change.
license: MIT
metadata:
  author: oevery
  version: "2026.07.24.1"
---

# RSP TDD

Implement one clear behavior test-first and return evidence to its selected Change. Follow Core's response-versus-artifact language boundary for all user-visible control narration; when the response language differs, keep exact canonical values only as secondary parenthesized or code-formatted tokens.

## Establish the cycle

Require one selected, ready Change, clear observable behavior, test and production mutation authority, and an executable focused check. Read project authority, current worktree state, and the smallest owning production/test seam.

Stop when behavior or acceptance is unclear, mutation authority is missing, an existing symptom has an unexplained cause, the execution environment is unavailable, or a baseline failure cannot be separated. Return the same Change, evidence, and one needed next action.

## RED

Add the smallest focused test at the real owning seam. Run it before production mutation and observe the expected missing or incorrect behavior.

RED is not a syntax, fixture, environment, or unrelated baseline failure. A passing test disproves the premise; refine it or stop without production mutation. An unexplained failure returns to diagnosis, not a guessed regression test.

## GREEN

Make the minimum production change for GREEN, preserve scope, and rerun the same command. An unexplained failure returns to diagnosis without speculative widening.

## REFACTOR

Refactor only after GREEN for a concrete local improvement; rerun the focused check. Otherwise skip it.

## Retain or remove the test

Keep the test only when it protects observable behavior or a real boundary, adds distinct future confidence beyond existing checks, avoids implementation-detail coupling or duplicate coverage, and has proportionate maintenance cost. A user, Change, or project requirement to retain the test remains authoritative.

Otherwise treat it as a disposable probe: remove it before completion, verify that no disposable fixture or helper remains, and run the cheapest decisive existing check against the final production state. A removed probe is process evidence, not final verification; when automation is insufficient, record applicable manual or environment evidence.

## Verify and return

After cleanup, run fresh required Change checks and narrow risk checks. Failure or unavailability cannot support completion. Update Tasks and Verify with final decisive evidence, omissions, and unresolved risk rather than a chronological test transcript; keep unresolved issues in Blockers.

Return to the same selected Change with WorkRef, final state, artifacts, fresh checks, omissions, Tasks, Blockers, and one next action; do not create parallel lifecycle state or recursively invoke another Skill.

When work remains, use Core's compact continuation fields in order: `WorkRef`, `Authority`, `Current state`, `Changed artifacts`, `Fresh verification`, `Blockers`, and `Next action`. Reopen authority, inspect drift, and refresh verification before resuming; continuation is not durable truth.

Git staging, commit, push, publication, deployment, review, archive, and approval remain separate actions requiring their own authority.
