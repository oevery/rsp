---
kind: "feature"
---

# Change: promote-rsp-review-skill

## Proposal
- Summary: Promote the qualified `rsp-review` candidate into the published, host-neutral Skill surface.
- Why:
  - The frozen candidate passed the full quality and repeated cost gates, but users cannot install it from the package while it remains under maintainer research.
  - Keeping both a research candidate and a published copy would create two canonical payloads that can drift.
- Scope:
  - Move the exact qualified payload into `skills/rsp-review/`.
  - Make evaluation fall back to the stable Skill when no research candidate is present.
  - Document, contract-test, package, and install-smoke-test the new published surface.
- Non-goals:
  - Publishing to npm, tagging, pushing, or changing package/release versions.
  - Adding host-specific metadata, plugins, commands, controllers, or automatic fixes.
  - Redesigning the already-qualified review instructions.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: The published RSP package provides a portable `rsp-review` Skill for read-only review of code, document, and mixed Changes.
  - `skills/rsp-review/SKILL.md` is the single canonical payload and preserves the qualified candidate tree hash `399619e81e40cd16a29bf64a88bb7ca214410097a7d3d61adb927a28dc47c69c`.
  - The Skill is included in the npm package, installs with the package, and has no runtime dependency on research or host-specific metadata.
  - Research evidence remains tracked, while the promoted candidate copy is removed.

### Acceptance
#### Scenario: user installs RSP and discovers the review capability
- GIVEN the locally packed `@oevery/rsp` artifact
- WHEN a user installs the artifact into a clean temporary project
- THEN both `rsp` and `rsp-review` contain portable `SKILL.md` entrypoints under the installed package's `skills/` directory
- AND the artifact excludes `research/`, `.rsp/`, and maintainer evaluation tooling

## Design
- Approach:
  - Move the frozen candidate without changing its bytes or independent content CalVer.
  - Treat `skills/rsp-review/` as the default evaluation source, while allowing an explicit research candidate path to override it when a future candidate exists.
  - Update human onboarding, durable product facts, and static package contracts.
- Affected areas:
  - `skills/rsp-review/`, `research/candidates/skills/rsp-review/`
  - `scripts/rsp-review-eval.mjs`, `test/skill-contract.test.ts`
  - `README.md`, `README.zh-CN.md`, `.rsp/specs/design.md`, `research/models/rsp-skill-system.md`
- Constraints:
  - Preserve the accepted payload hash and `2026.07.20.5` Skill CalVer.
  - Keep canonical behavior host-neutral and read-only; do not add `agents/openai.yaml` without a concrete host consumer.
  - Do not touch or stage package and changelog version edits already present in the worktree.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Move the qualified payload to the stable published Skill surface without content drift
- [x] Update evaluation fallback, package contracts, onboarding, and durable product facts
- [x] Run focused, full-project, package-content, and clean-install verification

## Verify
- Automated:
  - [x] `uvx --from skills-ref agentskills validate skills/rsp-review`
  - [x] `mise exec -- pnpm exec vitest run test/skill-contract.test.ts test/skill-behavior.test.ts`
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run typecheck && mise exec -- pnpm run lint && mise exec -- pnpm run test`
  - [x] `node dist/cli.mjs check`
  - [x] `npm pack --dry-run --ignore-scripts`
- Manual:
  - [x] Packed into ignored cache, confirmed only package-owned surfaces, installed into a clean temporary prefix, found both Skill entrypoints, and ran installed CLI `--version`
- Durable updates:
  - [x] Durable product distribution facts belong in `.rsp/specs/design.md`; no project instruction change is needed
  - [x] Record only the stable published Skill facts in `.rsp/specs/design.md`

## Blockers
- none
