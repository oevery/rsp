---
kind: "docs"
---

# Change: streamline-docs-and-skills/align-user-docs

## Proposal
- Outcome: Align user-facing and explanatory documentation with current release, managed-continuation, archive, and release-ledger contracts while removing repeated routing prose.
- Why:
  - The README currently requires a selected Release Change and understates shallow Group support, while the design philosophy and release references duplicate operational rules owned elsewhere.
- Scope:
  - `README.md`, `README.zh-CN.md`, `docs/design-philosophy.md`, and `skills/rsp-release-docs/` metadata and references.
- Non-goals:
  - Changing release behavior, Manage eligibility, lifecycle authority, public CLI behavior, or unrelated discipline Skills.

## Spec
### MODIFIED
- Requirement: release and managed routing accuracy
  - Both READMEs state that an explicit confirmed release operation may proceed without a Release Change, while material coordination may use one optionally.
  - Both READMEs state that explicit qualified managed continuation may own one ready Change or a shallow Group.
- Requirement: one navigable Skills explanation
  - Consolidate repeated skill list, composition, reading guidance, and surface mapping while preserving capability boundaries and authority warnings.
- Requirement: explanatory documents stay explanatory
  - Design philosophy keeps lasting principles and removes transient budgets, commands, and operational mechanisms.
  - Archive prose preserves final context, outcomes, decisive evidence, gaps, and risks without promising execution chronology.
- Requirement: release references have one owner per concept
  - `evidence-and-surfaces.md` owns ledger lifetime, surface lifetime, evidence selection, and reference policy; `output-contracts.md` owns output structures and integrity gates.

### Acceptance
#### Scenario: reader follows the updated guidance
- GIVEN the updated documentation
- WHEN a reader routes release work, managed continuation, archive capture, or multi-surface release documentation
- THEN the documented owner and authority boundaries match the executable Skills without duplicated competing rules

## Design
- Approach:
  - Correct semantic drift first, then compress repeated representations into a table and short composition flow.
  - Replace volatile operational detail with links to the owning Skill or Spec.
- Boundaries:
  - User guidance remains in README; rationale remains in design philosophy; executable release behavior remains in `rsp-release-docs`.
- Affected areas:
  - `README.md`, `README.zh-CN.md`, `docs/design-philosophy.md`
  - `skills/rsp-release-docs/SKILL.md`, `skills/rsp-release-docs/references/evidence-and-surfaces.md`, `skills/rsp-release-docs/references/output-contracts.md`
- Constraints:
  - English and Chinese guidance must be semantically equivalent; output templates and integrity gates must remain complete.

## Tasks
- [x] Correct and consolidate the bilingual README Skills guidance.
- [x] Reduce design philosophy to stable principles and correct archive semantics.
- [x] Shorten the release-docs description and remove ledger/reference duplication between its references.

## Verify
- Automated:
  - [x] `mise exec -- pnpm vitest run test/rsp-release-docs-skill-contract.test.ts test/project-skill-dogfood.test.ts test/daily-workflow-product-surface.test.ts` — 3 files and 10 tests pass; proves required routes, reference ownership, and release output contracts remain present.
- Manual or environment:
  - [x] Compared README release/manage wording against `skills/rsp/SKILL.md`, `skills/rsp-manage/SKILL.md`, and `skills/rsp-release-docs/SKILL.md`; the explicit no-Release-Change and shallow-Group routes now agree.
- Coverage:
  - No external publication or model behavior run; this slice changes guidance and reference ownership only.

## Blockers
- none
