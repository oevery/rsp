---
kind: "feature"
---

# Change: change-groups

## Proposal
- Summary: Add shallow Change Groups as the only composite work shape
- Why:
  - Several independently executable Changes can share one parent goal, shared constraints, and end-to-end completion contract without becoming one oversized Change
  - C3 recognizes bounded grouped identities but deliberately provides no semantic owner or lifecycle for a group directory
- Scope:
  - Add `rsp group create <name>` and `rsp group close <name>` as the explicit Group lifecycle
  - Require every direct grouped Change to have one sibling `brief.md`
  - Derive group membership, validity, blockers, and completion from the brief, open Changes, archives, and focus markers
  - Include a sibling Group Brief in grouped Change context and expose group projections through status
- Non-goals:
  - Do not add recursive groups, cross-repository work, arbitrary attachments, dependency graphs, backlinks, or configurable work roots
  - Do not focus or execute Group Briefs
  - Do not persist group progress, readiness, or completion state
  - Do not force a Change Group when one Change owns the whole verification boundary

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: one shallow Change Group contract
  - `.rsp/changes/<group>/brief.md` owns Goal, Scope, Shared Constraints, Slices, Completion Conditions, Durable Outcomes, and Blockers
  - A group contains only the brief and direct child Change files; every child is declared by the brief and every declared slice resolves to an open child or matching archive entry
- Requirement: child-only execution
  - Group Briefs remain non-executable and non-focusable
  - Grouped Changes retain the normal six-section Change contract, focus independently, include their sibling brief in context, and archive independently
- Requirement: derived completion and explicit close
  - Group readiness is derived from declared membership, child archives, completion conditions, blockers, and focus consistency
  - `rsp group close <group>` archives only the brief and only after the deterministic group completion gate passes

### Acceptance
#### Scenario: create a group before its child Changes
- GIVEN an initialized RSP project without the requested group
- WHEN `rsp group create release` runs
- THEN it creates `changes/release/brief.md`, does not focus the brief, and grouped Changes may then be created directly below it

#### Scenario: reject an unowned group directory
- GIVEN `changes/release/api.md` without `changes/release/brief.md`
- WHEN status, check, doctor, or grouped Change creation inspects the work
- THEN it reports a deterministic missing-brief error

#### Scenario: grouped child receives parent context
- GIVEN a valid `release` Group and an open `release/api` Change
- WHEN `rsp show release/api --json` runs
- THEN the sibling brief is the first group-owned context path while the child remains the executable record

#### Scenario: close only a completed group
- GIVEN a valid Group Brief whose declared children have all archived, whose completion conditions are complete, and whose blockers are empty
- WHEN `rsp group close release` runs
- THEN only the brief moves to `archives/release/YYYY-MM-DD_brief.md` and the archive index is rebuilt

## Design
- Approach:
  - Add a `change-group` domain module that parses the fixed brief contract and derives one group projection from existing WorkRef, archive, focus, and Markdown facts
  - Keep WorkRef responsible for bounded identity and filesystem shape while ChangeGroup owns membership and completion semantics
  - Implement public CLI behavior in vertical red-green slices: create/ownership, context/status, then close
- Affected areas:
  - `src/core/change-group.ts`, `src/core/work-ref.ts`, `src/core/helpers.ts`, and shared output types
  - `src/commands/group.ts`, `status.ts`, `show.ts`, `check.ts`, `doctor.ts`, `archive-index.ts`, and CLI registration
  - Integration tests, fallback rules, published Skill, READMEs, changelog, and `.rsp/specs/design.md`
- Constraints:
  - Group names and child names remain lowercase kebab-case and exactly one directory level deep
  - Brief Slices list identities and boundaries but never duplicate child progress state
  - Close is fail-closed and serialized under the existing RSP lock; deterministic gates run before the brief moves, while recoverable cleanup and index failures remain visible warnings
  - Existing flat Changes remain unchanged

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Add Group Brief generation and explicit group creation
- [x] Require one Group Brief for direct grouped Changes and validate group membership
- [x] Add grouped context and derived status projections
- [x] Add deterministic group close and archive handling
- [x] Update protocol, Skill, README, changelog, and durable design
- [x] Verify the result and update any required durable specs or scoped instructions

## Verify
- Automated:
  - [x] Run focused Change Group integration and domain tests
  - [x] Run `mise exec -- pnpm release:check`
  - [x] Run `node dist/cli.mjs check --focused --json`
  - [x] Run `git diff --check`
- Manual:
  - [x] Create a group and two children through the public CLI seam, archive the children independently, complete the brief gate, then close the group
- Durable updates:
  - [x] Update `.rsp/specs/design.md` with the implemented Change Group contract
  - [x] Record the one-way Group identity tradeoff in `.rsp/specs/decisions/change-group-identity.md`; the remaining C4 behavior implements the already selected shallow-group model

## Blockers
- none
