---
kind: "feature"
---

# Change: group-navigation-ux

## Proposal
- Summary: Make Group Briefs sort first and derive the next executable slice from Brief order
- Why:
  - A real Change Group can sort a child before `brief.md`, hiding the required parent context during direct browsing.
  - `rsp status` currently sorts all Change identities lexically and may recommend a blocked later slice instead of the first executable slice declared by the Group Brief.
- Scope:
  - Store each open Group Brief at `<group>/00-brief.md` while preserving the logical WorkRef identity `<group>/brief`.
  - Make no-focus status navigation respect Group Brief declaration order, group blockers, and child blockers.
  - Migrate the repository's open self-hosted Groups and update authored rules, Skill guidance, documentation, durable design facts, and behavior tests.
- Non-goals:
  - Numbering child Change identities, adding slice directories, dependency graphs, persisted readiness, or recursive work paths.
  - Supporting the unreleased `brief.md` physical layout as a compatibility alias.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### MODIFIED
- Requirement: An open Change Group has one logical Brief identity at `<group>/brief`, physically stored as `<group>/00-brief.md` so required context sorts before direct child Changes.
  - Group creation, inspection, show/context, validation, focus rejection, and close/archive behavior resolve the same logical identity without exposing a second Brief identity.
  - Direct group children remain one-level Markdown files and cannot use the reserved physical filename.
- Requirement: When no Change is focused, `rsp status` recommends an executable next Change rather than the lexically first open identity.
  - A blocked Group contributes no candidate.
  - Within an eligible Group, declaration order in `Slices` is navigation order; the first open child with no meaningful `Blockers` is the candidate.
  - Standalone unblocked Changes remain candidates, and deterministic top-level lexical ordering resolves candidates from different owners.

### Acceptance
#### Scenario: user opens and navigates a staged Change Group
- GIVEN an unfocused Group whose Brief declares a blocked first slice followed by an unblocked second slice
- WHEN the user browses the directory and runs `rsp status`
- THEN `00-brief.md` sorts before every direct child
- AND status recommends the second slice without changing focus or persisting another state

## Design
- Approach:
  - Keep logical identity at the WorkRef seam and centralize the physical filename as one core constant/helper.
  - Preserve parsed Brief slice order and derive one no-focus recommendation from current Group/Change projections.
- Affected areas:
  - `src/core/work-ref.ts`, `src/core/change-group.ts`, `src/commands/group.ts`, `src/commands/status.ts`, `src/commands/doctor.ts`
  - Group integration/unit tests and self-hosted `.rsp/changes/*/00-brief.md`
  - `rules/`, `skills/rsp/`, README files, and `.rsp/specs/design.md`
- Constraints:
  - Preserve the external `<group>/brief` interface and shallow single-file Change model.
  - Derive navigation only from current files; do not add order/status metadata or interpret blocker prose as a dependency graph.
  - Preserve unrelated uncommitted roadmap and version changes.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Add failing public-seam tests for physical Brief paths and group-aware no-focus navigation
- [x] Implement WorkRef/Group path resolution and status recommendation behavior
- [x] Migrate self-hosted Groups and update authored protocol, Skill, docs, and durable design facts
- [x] Run focused and full validation, then review the complete uncommitted scope

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/work-ref.test.ts test/integration.test.ts test/helpers.test.ts`
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run typecheck && mise exec -- pnpm run lint && mise exec -- pnpm run test`
  - [x] `uvx --from skills-ref agentskills validate skills/rsp`
  - [x] `node dist/cli.mjs check && node dist/cli.mjs doctor`
- Manual:
  - [x] Confirm both open self-hosted Group directories sort `00-brief.md` first and no-focus status recommends `skill-capability-research/accept-research-baselines`
- Durable updates:
  - [x] The stable physical/logical Brief mapping and navigation order belong in `.rsp/specs/design.md`; no project-owned instruction change is needed
  - [x] Update only those stable facts before archive

## Blockers
- none
