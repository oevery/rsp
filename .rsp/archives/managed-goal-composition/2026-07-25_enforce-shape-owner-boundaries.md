---
kind: "fix"
---

# Change: managed-goal-composition/enforce-shape-owner-boundaries

## Proposal
- Outcome: Keep independently closable outcomes in separate Changes.
- Why:
  - Shape preferred one ordinary Change for four unrelated maintenance outcomes after identifying independent mutation and verification scopes, producing one oversized review, archive, and commit boundary.
- Scope:
  - Make consistency, focused verification, review, archive, and rollback boundaries decisive before the default preference for one Change.
  - Clarify that shared broad verification, package identity, or execution convenience does not by itself justify one Change.
  - Require shallow Group selection when at least two outcomes remain independently closable under those tests.
- Non-goals:
  - Do not force tiny standalone work into RSP tracking.
  - Do not split cohesive cross-file behavior or create Groups for implementation steps sharing one acceptance boundary.

## Spec
### MODIFIED
- Requirement: Shape selects the smallest sufficient durable owners before scheduling execution.
  - One Change requires one observable outcome plus one consistency and focused-verification boundary.
  - Independently reviewable, archivable, and rollback-safe outcomes remain separate Changes even when they share a goal or final integration gate.
  - A shallow Group owns their shared goal and aggregate completion without copying child tasks or live status.

### Acceptance
#### Scenario: several maintenance outcomes share one release gate
- GIVEN at least two outcomes with distinct affected paths, focused checks, and independent archive or rollback boundaries
- WHEN Shape chooses the smallest sufficient owner
- THEN it creates separate direct Changes under a shallow Group
- AND a shared full-suite or package gate remains aggregate completion rather than a reason to merge owners

## Design
- Approach:
  - Replace the unconditional one-Change preference with explicit cohesion and independent-closeability tests.
  - Add a real-derived multi-outcome contract based on the pre-dogfood maintenance case.
- Boundaries:
  - Shape owns durable decomposition; Manage may optimize execution only after owner selection.
- Affected areas:
  - `skills/rsp-shape/SKILL.md`, `skills/rsp-shape/references/complex-shaping.md`, and Shape contract fixtures.
- Constraints:
  - Group creation still requires at least two independently executable, verifiable, focusable, and archivable children.
  - Dependencies remain only in child Blockers; no nested hierarchy or persisted wave plan is added.

## Tasks
- [x] Tighten ordinary Change and shallow Group selection criteria.
- [x] Add deterministic multi-owner and cohesive-single-owner coverage.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/rsp-shape-contract.test.ts test/rsp-shape-skill.test.ts` (2 files, 10 tests passed) — proves: independent closeability wins over execution convenience while cohesive work stays single-owner.
- Manual or environment:
  - [x] Compared the new gate with `.rsp/archives/2026-07-25_pre-dogfood-maintenance-hardening.md` — proves: its independently verifiable and archivable outcomes now require separate child owners despite the shared release gate.
- Coverage:
  - Actual multi-worker scheduling is owned by the sibling Manage Change.

## Blockers
- none
