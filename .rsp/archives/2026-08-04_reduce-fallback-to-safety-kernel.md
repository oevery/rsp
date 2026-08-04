---
kind: "refactor"
---

# Change: reduce-fallback-to-safety-kernel

## Proposal
- Outcome: Reduce the generated fallback to a discoverable safety kernel
- Why:
  - The fallback is loaded only when the preferred `rsp` Skill is unavailable, but it currently duplicates detailed Core, Manage, Discipline, recovery, and delivery behavior and is larger than the Core Skill.
  - Hosts that do not auto-discover project Skills may incorrectly treat the `rsp` Skill as unavailable even when the package-installed copy exists under `.agents/skills/`.
- Scope:
  - Reduce `rules/rsp-rules.md` to the minimum tool-agnostic ownership, single-action, durable-routing, and authority constraints needed for safe operation without Skills.
  - Tell non-discovering hosts through the managed `AGENTS.md` entry to inspect `.agents/skills/rsp/SKILL.md` before falling back.
  - Update entry/fallback contract tests and synchronized self-hosted output to match the corrected discovery boundary.
- Non-goals:
  - Change Core, Discipline, Manage, artifact, lifecycle, CLI, or Skill installation behavior.
  - Remove the fallback protocol or add host-specific global Skill search paths.
  - Automatically install, refresh, archive, commit, push, or publish anything.

## Spec
### MODIFIED
- Requirement: Discover the project-installed Core Skill before fallback
  - Package-installed RSP Skills remain under `.agents/skills/`.
  - The managed `AGENTS.md` entry directs a host that does not auto-discover project Skills to inspect `.agents/skills/rsp/SKILL.md` before treating Core as unavailable.
  - The fallback assumes that discovery has already failed and does not redirect back to the Skill path.
- Requirement: Keep fallback as a safe compatibility kernel
  - Fallback preserves read order, artifact ownership, focused-work selection, one bounded ordinary action, decisive verification, durable routing, fail-closed behavior, and authority ceilings.
  - Fallback does not reproduce detailed Manage Intake, control vocabulary, Group/dependency/reopen, release, Design, Commit, continuation, or conflict procedures owned by Skills, references, Specs, and deterministic CLI commands.
- Requirement: Degrade safely when advanced capability is unavailable
  - Fallback never emulates Manage or required managed workers.
  - It performs at most one bounded Core or optional Discipline action and stops with the missing capability, required input, next owner, and resume condition when safe continuation is unavailable.

### Acceptance
#### Scenario: Project Skill exists but is not auto-discovered
- GIVEN package-installed RSP Skills exist under `.agents/skills/`
- WHEN a host reads the managed RSP entry but does not auto-discover project Skills
- THEN the entry directs it to inspect `.agents/skills/rsp/SKILL.md` before declaring Core unavailable
- AND fallback is selected only when that project Skill is absent or cannot be used

#### Scenario: Core and advanced Skills are unavailable
- GIVEN the host cannot use the project-installed Core Skill
- WHEN it operates an RSP project through the fallback
- THEN it can derive and verify at most one bounded ordinary action while preserving artifact ownership and all lifecycle, Git, publication, and approval ceilings
- AND any managed or otherwise unsafe continuation stops instead of being manually emulated

## Design
- Approach:
  - Replace the detailed fallback copy with concise sections for Entry, ownership, safe single-action operation, durable review, and safety.
  - Keep Skill discovery in the generated `AGENTS.md` navigation layer and remove the late reverse-discovery hint from fallback.
  - Retain semantic assertions for safety and ownership while removing tests that require duplicated branch-specific wording.
- Boundaries:
  - `skills/rsp/SKILL.md` remains the preferred complete operational owner.
  - `.rsp/specs/skill-system.md` and `.rsp/specs/skill-control-model.md` remain durable owners for detailed capability and transient control semantics.
  - `rsp-manage` and conditional Core references remain the sole detailed owners of managed execution.
- Affected areas:
  - managed `AGENTS.md` block generation
  - `rules/rsp-rules.md`
  - entry/fallback contract tests and generated `AGENTS.md` / `.rsp/rsp-rules.md`
- Constraints:
  - Edit the authored root fallback first, build the CLI, and use `node dist/cli.mjs update` to synchronize the self-hosted generated fallback.
  - Preserve tool-agnostic behavior and do not introduce global host-specific paths.

## Tasks
- [x] Reduce the authored fallback to the accepted safety-kernel boundary.
- [x] Move project Skill discovery guidance to the managed `AGENTS.md` entry without automatic installation behavior.
- [x] Remove late reverse-discovery from fallback and update focused semantic contracts.
- [x] Build and synchronize generated `AGENTS.md` and `.rsp/rsp-rules.md`.
- [x] Rerun focused contracts, full project validation, and diff hygiene checks.

## Verify
- Automated:
  - [x] `mise exec -- pnpm run build && node dist/cli.mjs update` — passed; synchronized the managed `AGENTS.md` entry and `.rsp/rsp-rules.md` through the supported path
  - [x] `mise exec -- pnpm exec vitest run test/helpers.test.ts test/rsp-core-routing-contract.test.ts test/integration.test.ts -t "documentation command examples|keeps generated entry|keeps fallback|creates project guidance"` — 10 selected tests passed
  - [x] `mise exec -- pnpm run lint` — passed
  - [x] `mise exec -- pnpm run test` — 55 files / 660 tests passed
- Manual or environment:
  - [x] Fixed-scope `rsp-review` — clean; Skill discovery is owned by the managed `AGENTS.md` entry, fallback contains no reverse-discovery path, and managed-block-external content is unchanged
  - [x] `cmp -s rules/rsp-rules.md .rsp/rsp-rules.md` — authored and generated fallback are identical
  - [x] `node dist/cli.mjs check --focused --json` — passed with no warning or error
  - [x] `git diff --check` — passed
- Coverage:
  - No live third-party host discovery test; deterministic installation target and generated entry/fallback selection text are covered locally.

## Blockers
- none
