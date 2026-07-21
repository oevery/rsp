---
kind: "feature"
---

# Change: daily-workflow-depth/deepen-rsp-shape

## Proposal
- Summary: Deepen explicit shaping without taxing ordinary runs
- Why:
  - Explicit requests for rigorous questioning and project-owned domain/module design currently require manual host routing even though ordinary clarification is already qualified.
- Scope:
  - Add a progressively disclosed deep-clarification branch to `rsp-shape` and a narrow return contract for a selected project design capability.
  - Qualify the branch against current Shape on ambiguous intent, domain vocabulary, module seams, premature-action restraint, settled-work restraint, and ordinary-run cost.
- Non-goals:
  - A new always-discoverable Skill, a universal domain/architecture doctrine, automatic durable-document mutation, implementation, review, or Git delivery.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: explicit deep clarification is available without taxing ordinary shaping
  - `rsp-shape` loads the deep branch only when the user explicitly asks for rigorous challenge or a high-risk decision remains unresolved after normal shaping.
  - The branch inspects available facts, asks one owner decision at a time with a recommendation, follows dependent decisions, and waits for confirmed shared understanding before mutation.
- Requirement: project design work returns through the same RSP contract
  - When an available project-selected domain or module design capability is needed, Shape names the unresolved question, authoritative inputs, expected artifact, mutation boundary, and returning WorkRef.
  - Shape does not enumerate a capability catalog, require Matt, or duplicate the project's glossary, ADR, or architecture authority.

### Acceptance
#### Scenario: user explicitly asks to be challenged
- GIVEN a high-risk product direction has dependent unresolved owner decisions
- WHEN the user asks Shape to challenge the plan deeply
- THEN Shape inspects repository facts and asks one decision at a time with a recommended answer
- AND no artifact is mutated until the user confirms shared understanding

#### Scenario: ordinary shaping stays lightweight
- GIVEN a bounded request whose material decisions are already settled
- WHEN Shape prepares or updates the Change
- THEN it does not load or imitate the deep branch
- AND its output remains within the current Shape ownership boundary

## Design
- Approach:
  - Keep the default procedure in `SKILL.md`; put branch-only rules in one co-located reference reached by a precise context pointer.
  - Extend the existing Shape evaluation fixtures and run paired baseline/candidate cases with fresh isolated agents.
- Affected areas:
  - `skills/rsp-shape/`
  - `test/rsp-shape-skill.test.ts` and Shape-specific evaluation fixtures/scripts/report
- Constraints:
  - Keep the Skill concise and host-neutral; preserve existing WorkRef, authority, dirty-worktree, Group, and evidence rules.
  - Do not change shared package/docs/spec surfaces in this slice; the terminal Change owns promotion integration.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Implement the progressive deep-clarification reference and project-design return contract.
- [x] Add deterministic contract tests and paired isolated behavior/cost evidence.
- [x] Review the evidence and record qualified limits.
- [ ] Archive this child independently.

## Verify
- Automated:
  - [x] `mise exec -- pnpm vitest run test/rsp-shape-skill.test.ts`
  - [x] Run the focused paired Shape evaluation harness and preserve its report.
  - [x] `node dist/cli.mjs check --focused`
  - [x] `git diff --check`
- Manual:
  - [x] Inspect one explicit challenge output, one project-design return, and one settled ordinary request for premature mutation or unnecessary depth.
- Durable updates:
  - [x] Defer shared model/spec promotion to `daily-workflow-depth/validate-daily-workflow-depth`; keep slice evidence in its evaluation report.

## Blockers
- none
