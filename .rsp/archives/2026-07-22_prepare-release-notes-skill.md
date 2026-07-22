---
kind: "feature"
---

# Change: prepare-release-notes-skill

## Proposal
- Summary: Add a host-neutral RSP Skill that prepares and audits evidence-based changelogs, release notes, and migration notes while adapting to user and repository conventions.
- Why:
  - RSP 3.0 owns a complete change workflow but lacks a reusable product capability for turning shipped evidence into truthful release communication.
  - Commit history alone is too implementation-oriented for public release prose, while projects differ in audience, language, release tooling, link policy, and artifact ownership.
- Scope:
  - Publish `prepare-release-notes` as the ninth host-neutral Skill in the RSP package.
  - Discover user, project, tool, and historical conventions before drafting or auditing changelog, release-note, and migration surfaces.
  - Build one evidence ledger, apply net-release semantics, and use a configurable reference hierarchy with commit links as a deliberate fallback.
  - Update product documentation, durable design truth, and clean-install inventory for the new independently invocable capability.
- Non-goals:
  - Performing commit, tag, push, forge release creation, registry publication, deployment, or approval actions.
  - Replacing project-owned release automation, schemas, fragments, or established artifact formats.
  - Adding runtime orchestration, hidden state, or an RSP-only dependency to the Skill.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: RSP packages a reusable release-documentation Skill that produces evidence-complete, convention-compatible, audience-specific artifacts.
  - The Skill selects audit, prepare, or finalize behavior from explicit authority and treats publication as a separate operation.
  - It covers changelog, release notes, and migration notes from one release evidence ledger while preserving their distinct purposes.
  - It adapts language, voice, categories, paths, version/tag style, references, and detail to user requirements and observed repository configuration.
  - It collapses commit chronology into net released outcomes, records exclusions, and never presents stale verification as current.
  - Formal release preparation always includes release notes; migration guidance is required when users must act.
  - References prefer compare/tag, PR, and issue or tracked work links, using commit links when exact provenance, repository practice, missing semantic anchors, or explicit user policy justifies them.

### Acceptance
#### Scenario: prepare release documentation in an existing project
- GIVEN a project has user requirements, existing release conventions, a bounded release range, and mixed commit and tracked-work evidence
- WHEN an agent uses the installed `prepare-release-notes` Skill to prepare the release
- THEN it derives one release evidence ledger, explains inclusions and exclusions, and produces convention-compatible changelog, release notes, and applicable migration guidance
- AND every public claim maps to net shipped behavior or explicitly labeled historical verification
- AND it stops before any commit, tag, push, release creation, publication, deployment, deletion, or approval action

#### Scenario: audit commit references without forcing them into every entry
- GIVEN a project may expose compare, PR, issue, tracked-work, and commit links
- WHEN the agent selects references for public release prose
- THEN it follows the project's established policy first and otherwise chooses the highest-value semantic anchor
- AND commit IDs or links appear only when they provide useful exact provenance, no better semantic anchor exists, or the user explicitly requires them

## Design
- Approach:
  - Add a compact `SKILL.md` entrypoint with progressively loaded convention-discovery and output-contract references.
  - Add portable Agent Skills metadata consistent with the published RSP suite.
  - Keep package discovery automatic through the existing `skills/` package surface and make the ninth-skill inventory explicit in tests and documentation.
  - Keep the existing native-design retained gate scoped to the eight assisted-engineering Skills; validate the independent release-documentation capability through its own contract, clean-install, and forward evidence.
- Affected areas:
  - `skills/prepare-release-notes/`
  - `README.md`, `README.zh-CN.md`, `.rsp/specs/design.md`
  - clean-install, product-surface, Skill-contract, and native-design inventory-boundary tests
  - `.rsp/changes/release-3-0-0.md`
- Constraints:
  - The Skill must remain host-neutral and useful in repositories that do not use RSP.
  - Existing project instructions, release configuration, and parsable formats outrank generic defaults.
  - No private identifiers or secrets may leak into public artifacts.
  - The new Skill adds no runtime router, manifest, hidden state, implicit cross-Skill invocation, or external-action authority.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Add and validate the portable `prepare-release-notes` Skill and its progressive references
- [x] Integrate the ninth Skill into package inventory, product documentation, and durable design truth without changing Core routing
- [x] Remove the mistaken personal-Skills-repository and Nexus copies while preserving unrelated work
- [x] Run focused, package, and full repository verification

## Verify
- Automated:
  - [x] `uv run --with pyyaml python /Users/oevery/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/prepare-release-notes` — passed.
  - [x] `mise exec -- pnpm exec vitest run test/prepare-release-notes-skill-contract.test.ts test/clean-install-check.test.ts test/daily-workflow-product-surface.test.ts test/skill-contract.test.ts test/native-design-composition.test.ts test/helpers.test.ts` — 6 files, 75 tests passed.
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run lint && mise exec -- pnpm run test` — build and lint passed; 29 files, 339 tests passed.
  - [x] `node dist/cli.mjs check --focused --json && git diff --check` — no errors, warnings, or whitespace failures.
- Manual:
  - [x] Read-only forward exercise against the RSP `v2.0.4...HEAD` 3.0 range produced an English changelog projection and Chinese release notes, separated migration action and exclusions, labeled historical verification, used semantic references, and stopped before external release actions.
- Durable updates:
  - [x] Durable product ownership and capability boundaries belong in `.rsp/specs/design.md`; no new project instruction is required.
  - [x] Update `.rsp/specs/design.md` with the ninth published Skill and its stable boundary before archive.

## Blockers
- none
