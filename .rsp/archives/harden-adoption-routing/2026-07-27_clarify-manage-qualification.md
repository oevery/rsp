---
kind: "fix"
---

# Change: harden-adoption-routing/clarify-manage-qualification

## Proposal
- Outcome: Manage qualification treats independent slices, prospectively long authorized continuation, and recovery as independent eligibility paths.
- Why:
  - Current wording first allows long/recovery work, then broadly calls coupled work ineligible, which led an adoption run to reject Manage solely because the Change had no parallel slices.
- Scope:
  - Clarify Core and Manage qualification language and add a contract regression for a single coupled but multi-phase authorized Change.
- Non-goals:
  - Do not make elapsed wall-clock time an eligibility signal or make every non-trivial Change managed.

## Spec
<!-- Describe expected correct behavior. Implementation notes belong in ## Design. -->
### MODIFIED
- Requirement: Manage eligibility uses three independent paths.
  - A selected ready Change qualifies through genuinely independent slices, a prospectively multi-phase authorized continuation, or interruption recovery.
  - Lack of parallelizable work does not defeat long/recovery eligibility; only small coupled one-step or worker-only work remains ineligible.
  - “Long” is derived from the authorized objective and expected phases before dispatch, never retrospectively from elapsed minutes.

### Acceptance
#### Scenario: coupled multi-phase Change
- GIVEN one selected ready coupled Change whose authorized completion includes implementation, decisive automated checks, and real-host or durable closeout work
- WHEN Core performs Manage qualification
- THEN the Change may qualify through long authorized continuation without independent parallel slices
- AND elapsed duration alone is not cited as qualification evidence

## Design
- Approach:
  - Rewrite the contradictory clauses as an explicit any-of gate and retain a focused source/contract assertion.
- Boundaries:
  - Core-to-Manage selection only; worker scheduling remains unchanged.
- Affected areas:
  - `skills/rsp/references/managed-routing.md`
  - `skills/rsp-manage/SKILL.md`
  - `test/managed-controller-contract.test.ts`
- Constraints:
  - Automatic activation still grants controller selection only and tiny work remains direct.

## Tasks
- [x] Align qualification wording and add the focused regression coverage.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/managed-controller-contract.test.ts -t 'is compact, portable|uses independent qualification|preserves child owners'` — 3 passed; proves the any-of gate, negative elapsed-time boundary, compact Skill limit, and retained Group path.
- Manual or environment:
  - [x] Inspected `skills/rsp/references/managed-routing.md`, `skills/rsp-manage/SKILL.md`, and `.rsp/specs/skill-system.md` together — all three make long/recovery independent from parallel slices and reject retrospective elapsed-time evidence.
- Coverage:
  - Provider-specific model routing is outside this portable contract.
  - The complete managed-controller file currently passes 35/36; its unrelated retained `rsp-commit` replay rejects the newly changed Core composition hash as designed. Retained evidence stays immutable and requires a fresh identity at the final integrated prompt boundary.

## Blockers
- none
