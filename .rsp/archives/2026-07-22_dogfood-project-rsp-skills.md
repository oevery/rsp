---
kind: "ops"
---

# Change: dogfood-project-rsp-skills

## Proposal
- Summary: Dogfood every published RSP Skill through repository-local discovery and route overlapping engineering work away from global Matt Skills inside this repository.
- Why:
  - The authored Skills under `skills/` are package sources but are not discovered by Codex from the RSP checkout, so normal maintainer work still falls back to global workflow Skills.
  - RSP 3.0 should receive real daily usage in its own repository before release instead of relying only on isolated evaluation workspaces.
- Scope:
  - Expose all nine published Skills under repository `.agents/skills/` without duplicating their content.
  - Disable the globally installed Matt engineering suite in the maintainer's user configuration for the RSP 3.0 dogfood period.
  - Keep `distill-upstream` available for its existing maintainer-research boundary.
  - Add deterministic checks for discovery projection and canonical targets.
- Non-goals:
  - Uninstalling or globally disabling personal Skills for other repositories.
  - Changing the published Skill payloads, CLI runtime, or package contents.
  - Disabling unrelated global Skills, plugins, MCP servers, or capabilities.
  - Claiming that `skills.config` supports the same project-scoped enable/disable behavior as MCP configuration; current Codex verification disproves that assumption.

## Spec
<!-- Describe the reliable operational outcome. Implementation notes belong in ## Design. -->
### MODIFIED
- Requirement: the RSP source checkout uses its own published Skills as the default engineering workflow surface.
  - Every directory under root `skills/` has one repository-discovered `.agents/skills/<name>` projection to the canonical authored directory.
  - Projections are relative symlinks so edits are exercised immediately and no copied Skill can drift.
  - Root project guidance identifies the repository-local RSP suite as the normal project workflow surface.
  - The maintainer dogfood environment disables the overlapping global Matt suite through reversible user configuration, and `distill-upstream` retains its separate maintainer-research role.

### Acceptance
#### Scenario: maintainer starts ordinary RSP work
- GIVEN Codex is launched anywhere in the RSP repository and both project and global Skills are discoverable
- WHEN a task matches shaping, design, implementation, diagnosis, TDD, review, review resolution, or release-documentation work
- THEN the matching project-installed RSP Skill is the default workflow capability
- AND a fresh maintainer task does not expose the disabled global Matt engineering suite

#### Scenario: published Skill changes during dogfooding
- GIVEN `.agents/skills/<name>` projects to `skills/<name>`
- WHEN a maintainer edits the canonical published Skill
- THEN project discovery reads that exact authored tree without synchronization or copy steps

## Design
- Approach:
  - Add one relative symlink per published Skill from `.agents/skills/<name>` to `../../skills/<name>`; Codex officially supports symlinked Skill folders.
  - Add reversible `enabled = false` entries to the maintainer's user configuration for the globally installed Matt engineering suite. Do not delete its files.
  - Add concise root `AGENTS.md` guidance that identifies project RSP Skills as the active dogfood workflow surface.
  - Test the projection inventory, symlink targets, canonical identity, and routing text. Verify user-config isolation through a fresh Codex task because personal configuration is outside repository test authority.
  - Narrow the rsp-review evaluation's root-cleanliness assertion so an intentional project-installed `rsp-review` projection is not mistaken for evaluation contamination.
- Affected areas:
  - `.agents/skills/`, `AGENTS.md`, maintainer `~/.codex/config.toml`
  - `.rsp/specs/design.md`, `.rsp/changes/release-3-0-0.md`
  - dogfood and rsp-review behavior tests
- Constraints:
  - Published `skills/` remains the single authored source and package root.
  - `.agents/skills/` remains excluded from package distribution and product runtime dependencies.
  - Do not mutate global Skill directories or the personal Skills repository; disablement must remain reversible configuration.
  - Do not use copied payloads or absolute symlink targets.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Project every published RSP Skill into `.agents/skills/` with relative symlinks
- [x] Add reversible maintainer Skill isolation and RSP dogfood guidance
- [x] Add deterministic dogfood coverage and adapt the evaluation contamination assertion
- [x] Run focused and full repository verification

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/project-skill-dogfood.test.ts test/skill-behavior.test.ts test/clean-install-check.test.ts` (18 tests passed)
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm run test` (30 files and 341 tests passed)
  - [x] `node dist/cli.mjs check --focused --json`, `node dist/cli.mjs doctor --json`, and `git diff --check` (0 errors, 0 warnings, and clean whitespace check before archive)
- Manual:
  - [x] A fresh independent Codex process discovered all nine project RSP Skills and omitted the user-disabled Matt engineering suite; an already-open task retains its startup inventory until a new task is opened.
- Durable updates:
  - [x] Stable routing belongs in root `AGENTS.md`; self-hosting ownership and package exclusion belong in `.rsp/specs/design.md`.
  - [x] Wrote those stable facts; no Decision Record is needed because this is a reversible discovery projection.

## Blockers
- none
