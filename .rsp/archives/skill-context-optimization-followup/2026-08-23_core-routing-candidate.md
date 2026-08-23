---
kind: "refactor"
---

# Change: skill-context-optimization-followup/core-routing-candidate

## Proposal
- Outcome: Core keeps a smaller eager route and safety kernel after semantic contracts and branch ownership are stable.
- Why:
  - Core is high-frequency, but its compression must be evaluated against current HEAD behavior rather than token count alone.
- Scope:
  - Condense duplicated routing prose and move only evidenced low-frequency detail to explicit owned references.
- Non-goals:
  - Changing route enums, qualification policy, Discipline behavior, lifecycle authority, version identity, or release/commit boundaries.

## Spec
### MODIFIED
- Requirement: The eager Core surface exposes the next routing decision, essential authority, required stops, and return boundary; uncommon detail remains directly reachable through explicit conditions.
  - Adding a reference is permitted when it owns a coherent low-frequency branch. A candidate fails only when it loses required facts, changes observable behavior, or reads branch detail on a route without its trigger.

### Acceptance
#### Scenario: Direct route remains direct
- GIVEN one ready owner, one writer, one execution phase, one decisive check, no recovery, no independent acceptance, and no successor
- WHEN Core derives the route
- THEN it selects direct without reading Manage or review branch detail

#### Scenario: Conditional reference is reachable
- GIVEN a matching low-frequency trigger such as Manage qualification, recovery, Group, conflict, Focus Capsule mutation, or durable writeback
- WHEN Core reaches that branch
- THEN the owned reference is read and the current authority, stop, and verification result is preserved

## Design
- Approach:
  - Use the current HEAD package as the baseline; evaluate one identity-bound candidate at a time with deterministic contracts and serial provider holdouts.
- Boundaries:
  - New Markdown references are allowed; unconditional common-path reads and missing required facts are hard failures.
- Affected areas:
  - `skills/rsp/SKILL.md` and directly owned references
  - deterministic contracts and provider comparison harness
- Constraints:
  - Preserve negative authority, stop/resume, Required/Optional Verify, durable review, and archive/commit separation.

## Tasks
- [x] Rebase the candidate plan on the accepted results of the semantic, Manage, and review children.
- [x] Produce one candidate with explicit reference triggers and deterministic contract coverage.
- [x] Run direct, final-output, and Manage-pressure provider holdouts serially against current HEAD and the final identity-bound candidate.
- [x] Run required security, build, typecheck, lint, tests, focused RSP check, and diff hygiene.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skills/rsp-core-routing-contract.test.ts test/skills/skill-runtime-context-contract.test.ts test/skills/skill-contract.test.ts test/architecture/documentation-contract.test.ts --reporter=dot --no-file-parallelism` — passed 4 files / 29 tests; proves trigger-to-reference ownership, required contracts, reachability, package independence, and representative negative mutations.
  - [x] Current HEAD versus candidate provider holdouts with default local routing, `combo/gpt-5.6-terra`, and `high` effort — baseline and candidate passed for `auto-integrated-direct`, `release-final-output-correction`, and `auto-multisurface-routing`; every arm had `result: passed`, `product_result: passed`, and no unauthorized paths.
  - [x] Final identity-bound candidate provider replay — all 3 candidate arms passed with composition `4085f7e1f6146cda09265fce2eae956b02e54372ccf8792452b85dd3bb9b44c7`; direct reported `direct` / `direct` / `none` with 0 workers, and Manage-pressure reported `selected` / `coordinated` / `independent-verify` with 2 workers. Final-output and final resource-event capture were absent or incomplete, so first-fix and complete route-local reads remain explicit observability omissions.
  - [x] `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run build`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm run skills:security-check` — passed; security checked 40 files with 0 findings.
  - [x] `mise exec -- pnpm exec vitest run --no-file-parallelism --reporter=dot` — passed 89 files / 881 tests.
  - [x] `node dist/cli.mjs check --focused --json` and `git diff --check` — passed after final writeback.
  - [x] Final fixed-scope Group review — Code and Document are clean after the accepted `.rsp/specs/skill-system.md` durable writeback; the focused follow-up contract run passed 4 files / 24 tests.
### Optional
- Manual or environment:
  - [ ] Broader managed and real-host acceptance if the changed branches require it.
- Coverage:
  - The accepted candidate moves incomplete/failed implementation evidence and Focus/continuation recovery to two directly linked references, and moves the durable output template into the already conditional durable-review owner.
  - Routinely loaded `skills/rsp/SKILL.md` decreased from 1,793 words / 13,445 bytes at HEAD to 1,413 words / 10,769 bytes. The complete reachable package increased from 4,973 words / 37,101 bytes across 9 Markdown files to 5,165 words / 38,609 bytes across 11 files, with no unreachable Markdown; counts are diagnostic only.
  - Candidate versus baseline observations were lower in tool calls for direct (8 vs 20), final-output (13 vs 14), and Manage-pressure (14 vs 16), with lower total tokens in the same three pairs; elapsed time and cache behavior varied and are not correctness gates. Correction count, first-fix result, and model-invocation count were unavailable.
  - The discarded candidate reduced Core text but introduced an extra `managed-routing.md` read on direct; this remains a diagnostic rejection, not a ban on adding references. The accepted candidate's final direct resource-event capture was unavailable, so the no-common-path regression claim rests on deterministic trigger contracts plus the passed structured direct route, not inferred host reads.

## Blockers
- none
