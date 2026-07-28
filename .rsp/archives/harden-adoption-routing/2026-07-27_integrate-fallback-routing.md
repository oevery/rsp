---
kind: "fix"
---

# Change: harden-adoption-routing/integrate-fallback-routing

## Proposal
- Outcome: The minimal fallback and self-hosted projection preserve the four adopted routing invariants, and the integrated package has a fresh verified identity.
- Why:
  - The authored fallback still allows manual Design emulation and lacks later-turn escalation, dirty-owner transition, and qualified-closeout guidance; syncing it now would reproduce stale behavior.
- Scope:
  - Align `rules/rsp-rules.md`, focused fallback contracts, self-hosted `.rsp/rsp-rules.md`, and final integrated verification.
- Non-goals:
  - Do not add fallback controller behavior, rewrite immutable retained evidence, or change CLI runtime semantics.

## Spec
<!-- Describe expected correct behavior. Implementation notes belong in ## Design. -->
### MODIFIED
- Requirement: fallback parity preserves routing and authority boundaries.
  - The fallback rederives materially expanded direct work, selects installed `rsp-design`, blocks overlapping dirty-owner transfer, and keeps all closeout presets advisory because it never emulates Manage.
  - Self-hosted projection matches the authored fallback after build/update.
  - Historical retained evidence remains immutable; final validation records current composition drift instead of overwriting old runs.

### Acceptance
#### Scenario: Skill-unavailable fallback
- GIVEN the host cannot load `rsp` or `rsp-manage`
- WHEN a direct task expands, a bounded design question appears, or dirty WorkRef ownership overlaps
- THEN the fallback derives the same owner boundary without emulating managed continuation
- AND it never executes closeout from project configuration

## Design
- Approach:
  - Update the compact authored fallback, extend existing Core/fallback contracts, build, run `rsp update`, and execute the project validation suite.
- Boundaries:
  - Portable fallback and package integration only.
- Affected areas:
  - `rules/rsp-rules.md` and generated self-host `.rsp/rsp-rules.md`
  - Core routing/fallback contracts and integrated package checks
- Constraints:
  - Keep the fallback minimal, non-controller, and free of automatic lifecycle or Git actions.

## Tasks
- [x] Align fallback routing, sync the self-hosted projection, and complete integrated validation.

## Verify
- Automated:
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm vitest run --maxWorkers=1` pass; 50 files and 573 tests prove the integrated package behavior. The default parallel full run had four unrelated 5-second timeouts, and all four affected files passed when rerun with one worker.
  - [x] Focused fallback contracts pass (18 tests), `git diff --check` passes, and `node dist/cli.mjs check --focused` validates the selected Change.
- Manual or environment:
  - [x] After `node dist/cli.mjs update`, `cmp -s rules/rsp-rules.md .rsp/rsp-rules.md` confirms deterministic projection.
- Coverage:
  - No provider replay or retained-evidence rewrite; current composition drift is reported explicitly.

## Blockers
- none
