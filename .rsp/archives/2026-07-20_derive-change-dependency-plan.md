---
kind: "feature"
---

# Change: derive-change-dependency-plan

## Proposal
- Summary: Derive a deterministic dependency plan from explicit Change blockers
- Why:
  - Boolean blocker status tells agents that work cannot proceed but not which prerequisite owns the blockage or which work becomes executable next.
- Scope:
  - Add an exact `requires` WorkRef form to Change `Blockers`, validate its graph, and project ready work, dependency edges, and stable execution waves through `rsp status`.
- Non-goals:
  - Persisting a graph file, adding dependency metadata to YAML, parsing dependencies from arbitrary prose, scheduling work, recursive groups, or making Group Briefs executable.

## Spec
### ADDED
- Requirement: deterministic Change dependency projection
  - A blocker line shaped as `- requires \`<change-work-ref>\`: <reason>` declares one dependency edge; other meaningful blocker prose remains an external blocker and is never guessed into an edge.
  - Open, archived, missing, self-referential, and cyclic dependencies are distinguished deterministically from bounded WorkRefs and archive identities.
  - `rsp status --json` exposes one derived plan containing exact edges with their reasons, ready Changes, blocked Changes, and stable executable waves. Human status renders the same projection compactly.
  - Archived prerequisites stop blocking without rewriting the dependent Change. Readiness and archive guidance use the same derived result.
  - A Group Brief blocker is inherited by its direct child Changes as an external blocker without creating dependency edges.
  - `rsp check` and `rsp doctor` fail visibly on malformed structured dependency lines, missing targets, self-dependencies, and cycles.

### Acceptance
#### Scenario: agent asks for the next executable work
- GIVEN several open Changes use exact `requires` blockers and some prerequisites are already archived
- WHEN the agent runs `rsp status --json`
- THEN the output returns known dependency edges, currently ready Changes, active blockers, and deterministic topological waves
- AND free-form blockers remain visible without becoming inferred edges

#### Scenario: dependency graph is invalid
- GIVEN a dependency target is malformed, missing, self-referential, or part of a cycle
- WHEN the maintainer runs `rsp check` or `rsp doctor`
- THEN the command reports a stable diagnostic and does not recommend execution from the invalid graph

## Design
- Approach:
  - Introduce one internal dependency-plan module that reads authoritative Change and archive files, validates exact references, and returns a side-effect-free projection consumed by CLI commands.
- Affected areas:
  - `src/core/dependency-plan.ts`, CLI status/check/doctor/readiness consumers, and public output types
  - tests, authored protocol/Skill sources, stable design facts, and user documentation
- Constraints:
  - Keep Markdown as the only dependency fact owner; derive rather than persist state. Limit dependency targets to executable Change WorkRefs in the first version.
  - Treat incomplete archive inspection as an invalid dependency projection, emit no ready work or execution waves, and derive every open Change as actively blocked for readiness.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Add public CLI behavior tests for valid, archived, external, malformed, missing, self, and cyclic blockers.
- [x] Implement exact blocker parsing, graph validation, active-blocker derivation, and stable waves.
- [x] Expose the plan through status and share active-blocker truth with show, ready, and archive guidance.
- [x] Update rules, Skill, Specs, and user documentation without adding a second graph artifact.

## Verify
- Automated:
  - [x] `mise exec -- pnpm run build`
  - [x] `mise exec -- pnpm run typecheck`
  - [x] `mise exec -- pnpm run lint`
  - [x] `mise exec -- pnpm run test`
- Manual:
  - [x] Run status on a dependency chain with an external blocker, archive its first prerequisite, and confirm the next ready work changes without editing the dependent blocker.
- Durable updates:
  - [x] Update `.rsp/specs/design.md`, authored fallback rules, the RSP Skill, and public documentation with only the stable dependency contract.

## Blockers
- none
