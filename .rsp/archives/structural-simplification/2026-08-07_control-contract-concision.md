---
kind: "refactor"
---

# Change: structural-simplification/control-contract-concision

## Proposal
- Outcome: Consolidate control ownership and reduce inactive Core Skill context
- Why:
  - `skill-control-model.md` is canonical for transient vocabulary while `skill-system.md` repeats route, stop, acceptance, and closeout contracts.
  - The always-loaded Core Skill retains downstream Workspace, Manage, Land, and language detail beyond initial routing needs.
- Scope:
  - Make the control-model Spec the single durable vocabulary owner.
  - Keep composition and capability ownership in the Skill-system Spec without redefining canonical control fields.
  - Reduce inactive detail in `rsp/SKILL.md` through compact invariants and conditional references.
- Non-goals:
  - Change route behavior, authority, fallback, stop/resume, verification, closeout, or public Skill identities.
  - Optimize for a fixed word-count target or introduce private notation.

## Spec
### MODIFIED
- Requirement: Every transient control contract has one durable and one runtime owner.
  - `skill-control-model.md` owns canonical vocabulary and transition invariants.
  - `skill-system.md` owns suite composition, capability roles, and progressive-disclosure boundaries.
  - `rsp/SKILL.md` eagerly retains only routing, safety, fallback, and output facts required before a conditional owner is loaded.

### Acceptance
#### Scenario: Ordinary Core routing remains complete
- GIVEN an ordinary direct, managed, Workspace, or stopped request
- WHEN the Core Skill derives the next action
- THEN it preserves the same owner, authority, route, stop, fallback, and resume semantics

#### Scenario: Inactive branches do not dominate Core context
- GIVEN a Core invocation that does not enter a downstream branch
- WHEN the authored Skill corpus is measured
- THEN downstream procedures remain in conditional references or owning Skills and the Core body is materially smaller

## Design
- Approach:
  - Remove duplicated canonical definitions from `skill-system.md` while retaining composition invariants.
  - Add or refine conditional Core references where downstream procedure is not needed for initial routing.
  - Update semantic contract tests to assert behavior and owner placement rather than incidental prose.
- Boundaries:
  - Preserve every authority denial, stop disposition, manual fallback, and required output field.
  - Published Skills remain independently usable without repository-only Specs.
- Affected areas:
  - .rsp/specs/skill-system.md and .rsp/specs/skill-control-model.md
  - skills/rsp/, related Skill contract tests, and fallback source when required
- Constraints:
  - Do not move always-needed routing facts behind an unavailable dependency.
  - Historical evaluations and archives remain immutable.

## Tasks
- [x] Retain `skill-control-model.md` as the sole durable owner of canonical transient control vocabulary; no duplicate enum/field definitions remain in `skill-system.md`.
- [x] Reduce inactive downstream detail in `skills/rsp/SKILL.md` and move language detail to `skills/rsp/references/response-language.md`; Workspace/Manage/Land/closeout procedures remain with their owning Skills or conditional references.
- [x] Update focused Skill contract tests and managed-controller fixtures to assert owner placement and observable authority boundaries without word-count correctness gates.
- [x] Confirm no authored `rules/` source changed in this slice; self-hosted fallback regeneration was therefore not required.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/rsp-core-routing-contract.test.ts test/managed-controller-contract.test.ts test/project-skill-dogfood.test.ts test/skill-contract.test.ts test/skill-runtime-context-contract.test.ts` — passed 5 files / 74 tests on 2026-08-07; proves: routing, canonical-owner placement, projection, standalone publication, and authority contracts remain intact.
  - [x] `node dist/cli.mjs check --focused --json` — passed on 2026-08-07 with zero errors and zero warnings; proves the selected Change remains structurally valid and ready.
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run typecheck && mise exec -- pnpm run lint` — passed on 2026-08-07; proves the authored Skill and contract-test changes compile and lint cleanly. `node dist/cli.mjs update` was not needed because no authored `rules/` source changed.
### Optional
- Manual or environment:
  - [x] Retained Core/Manage behavior evaluation — covered by the focused routing, managed-controller, and runtime-context contract suite; 5 files / 74 tests passed on 2026-08-07.
- Coverage:
  - Full tests and Group review cover cross-Skill and documentation drift.

## Blockers
- None.
