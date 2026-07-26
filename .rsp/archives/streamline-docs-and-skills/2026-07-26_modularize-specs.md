---
kind: "refactor"
---

# Change: streamline-docs-and-skills/modularize-specs

## Proposal
- Outcome: Turn `.rsp/specs/design.md` into a compact product-boundary map backed by smaller domain Specs without changing any stable fact.
- Why:
  - The current 6,000-word Spec mixes core model, CLI contracts, Skill behavior, TUI, and distribution facts, forcing unrelated work to load and update one monolith.
- Scope:
  - `.rsp/specs/design.md`, new domain Specs under `.rsp/specs/`, their generated index, and direct documentation links affected by the move.
- Non-goals:
  - Changing runtime behavior, removing facts, rewriting Decision Records, or reorganizing archived Changes.

## Spec
### MODIFIED
- Requirement: smallest stable-fact owner
  - `design.md` retains identity, system boundaries, dependency direction, and navigation.
  - Core model, CLI contracts, Skill system, TUI, and distribution facts move to separate Specs with no duplicated normative statements.
- Requirement: compatibility
  - Existing stable facts, public contracts, WorkRefs, commands, and Decision Record links retain their meaning.

### Acceptance
#### Scenario: behavior is preserved after restructuring
- GIVEN the existing codebase before the refactor
- WHEN a maintainer follows `design.md` to a domain owner and RSP validates the Spec tree
- THEN every existing stable fact has one discoverable owner and existing implementation tests pass unchanged

## Design
- Approach:
  - Classify each current fact by domain, move it verbatim or minimally normalize it, and leave a short boundary summary plus links in `design.md`.
- Boundaries:
  - Specs own current durable truth; Decision Records continue to own lasting rationale.
- Affected areas:
  - `.rsp/specs/design.md`
  - `.rsp/specs/core-model.md`, `.rsp/specs/cli-contracts.md`, `.rsp/specs/skill-system.md`, `.rsp/specs/tui.md`, `.rsp/specs/distribution.md`
- Constraints:
  - Do not weaken or silently reinterpret any stable fact; generated `.rsp/specs/INDEX.md` is updated through the CLI.

## Tasks
- [x] Inventory and classify every stable fact in `design.md`.
- [x] Create five domain Specs through `rsp add spec` and move facts to their smallest owner.
- [x] Reduce `design.md` to cross-domain boundaries and navigation, then regenerate the Spec index.

## Verify
- Automated:
  - [x] `mise exec -- node dist/cli.mjs check --focused`, `mise exec -- node dist/cli.mjs doctor --json --compact`, and `mise exec -- pnpm vitest run test/integration.test.ts test/project-skill-dogfood.test.ts` — RSP checks pass with zero doctor issues; 162 tests pass. Full suite remains at Group integration.
- Manual or environment:
  - [x] Compared the 6,194-word monolith with the 4,709-word navigable Spec set and inspected Decision Record ownership references; product facts now resolve through five domain owners without a second rationale path.
- Coverage:
  - No semantic model evaluation is needed because executable Skill text is unchanged in this slice.

## Blockers
- none
