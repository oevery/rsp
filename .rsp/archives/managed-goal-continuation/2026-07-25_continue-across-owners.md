---
kind: "feature"
---

# Change: managed-goal-continuation/continue-across-owners

## Proposal
- Outcome: Continue a managed goal through successive owners and in-run Shape
- Why:
  - Current Manage owns one Change or shallow Group and returns after that boundary, so a clear long-running goal cannot naturally continue when execution reveals another required owner.
- Scope:
  - Treat the explicit managed goal and its allowed mutations as a transient authority envelope across successive executable WorkRefs.
  - After accepted progress, re-derive status and either continue the next clear in-scope owner, stop naturally when none remains, or return missing ownership to Shape and resume after it becomes ready.
  - Classify discovered work as a cohesive update, an independently closable Change, a justified shallow Group, or a material owner decision.
- Non-goals:
  - Do not persist a WorkSet, execution phase, controller state, nested Group, inferred product scope, or speculative backlog item.
  - Do not continue through a material product, acceptance, external-action, or mutation-authority decision.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: a managed goal continues through the smallest sufficient durable owner
  - The original explicit goal bounds transient continuation authority while each current Change or Group remains the sole durable owner of its requirements, evidence, lifecycle, and dependencies.
  - After a current owner reaches an accepted boundary, Core re-derives status and Manage continues only a clear in-scope ready owner; terminal short work stops without manufacturing another owner or controller artifact.
- Requirement: execution evidence can return to Shape without ending a clear goal
  - A cohesive correction stays in the current Change; an independently verifiable and archivable result receives a new Change, or a shallow Group when at least two such results share one goal.
  - Clear in-scope planning uses the original managed request's planning-artifact authority, then reruns focused checks and Manage eligibility without another authorization round.
  - Any discovery that changes behavior, acceptance, public interfaces, scope, or external authority stops at the single highest-impact owner decision.

### Acceptance
#### Scenario: a long goal crosses existing and newly shaped owners
- GIVEN an explicit managed goal with one ready owner and bounded planning plus implementation authority
- WHEN accepted execution exposes another clear independently closable in-scope result
- THEN Manage suspends dispatch, Shape creates or refines the smallest owner, Core re-checks readiness, and Manage resumes against that WorkRef
- AND no nested Group, persistent WorkSet, repeated authorization prompt, or copied live state is created

#### Scenario: terminal short work has no successor
- GIVEN the current Change or Group completes and no in-scope ready or clearly missing owner remains
- WHEN status is re-derived
- THEN the managed goal stops with completed evidence and no synthetic continuation work

## Design
- Approach:
  - Extend Core's existing managed preflight into a reusable post-progress transition: re-derive, classify missing ownership, Shape when settled, requalify, and resume.
  - Keep the goal envelope and discovered-work classification response-only; persist only converged Changes and Group Brief membership.
- Boundaries:
  - Core owns stage selection and Shape routing; Shape owns Change/Group topology; Manage owns transient dispatch and continuation only.
- Affected areas:
  - `skills/rsp/SKILL.md`, `skills/rsp-manage/SKILL.md`, and `skills/rsp-shape/SKILL.md`
  - `rules/rsp-rules.md`, `.rsp/specs/design.md`, and `docs/design-philosophy.md`
  - focused Core, Shape, and managed-controller contract tests
- Constraints:
  - Preserve ordinary direct work, explicit-only managed invocation, shallow Group identity, four-dispatch/one-retry limits per continuation run, and truthful authority stops.

## Tasks
- [x] Add the transient managed-goal and post-progress owner transition to Core and Manage.
- [x] Add in-run discovered-work classification and Shape re-entry without duplicating shaping behavior.
- [x] Update stable product truth and focused contracts for terminal, successor, re-shape, and owner-decision paths.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/managed-controller-contract.test.ts test/rsp-core-routing-contract.test.ts test/rsp-shape-contract.test.ts test/rsp-shape-skill.test.ts test/artifact-continuation-contract.test.ts test/assisted-loop.test.ts test/helpers.test.ts` — 97/97 passed; proves: owner transitions remain bounded, derived, compact, and artifact-safe.
  - [x] `mise exec -- pnpm run build` and `mise exec -- pnpm run lint` — passed; proves: authored product and project static checks remain valid.
  - [x] `node dist/cli.mjs check --focused` — all three focused Group Changes valid, including this WorkRef.
- Manual or environment:
  - [x] Inspected terminal and re-shaped transitions across final Core, Manage, Shape, fallback, Spec, and design-philosophy sources — terminal work stops without a synthetic owner; missing ownership re-enters Shape and resumes without persisted controller state or repeated authorization.
- Coverage:
  - Fresh real-host long-goal execution belongs to `managed-goal-continuation/validate-long-goal`.
  - `mise exec -- pnpm run test` — 492/495 passed; the three failures are the Group-level native-design exact-package gate. The previous retained run no longer matches because this Change intentionally modifies executed Skills and `rules/rsp-rules.md`; the immutable evidence was not overwritten, and final refresh belongs to `managed-goal-continuation/refresh-native-composition-evidence` after all Skill changes settle.

## Review Resolution
- All accepted findings resolved: every qualified WorkRef receives a complete owner and authority snapshot before dispatch; actual diffs and fresh decisive verification gate acceptance; isolated workspaces require explicit authority and availability; workers receive no implied focus; Manage returns discovery evidence to Core and Shape without owning topology; ready-successor, missing-owner, and terminal-stop branches are mutually exclusive; whole-run dispatch and retry limits do not reset across owners.
- Fresh fixed-scope re-review: clean with no new blocking finding; `rsp-manage` remains within its 600-word product limit.

## Blockers
- none
