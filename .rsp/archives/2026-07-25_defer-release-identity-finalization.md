---
kind: "fix"
---

# Change: defer-release-identity-finalization

## Proposal
- Outcome: Keep implementation Changes and commits independent from release identity, and finalize versioned package surfaces only in a separately owned Release Change after the target identity is confirmed.
- Why:
  - Real development often does not know the next version until release time; early manifest, changelog, README, or release-note mutation creates stale identity, mixed commits, and leakage-prone public prose.
  - Managed continuation needs an explicit boundary between completing one Change and preparing a release candidate.
- Scope:
  - Make confirmed release identity an owner-supplied prerequisite rather than an agent inference.
  - Keep versioned shipped surfaces unchanged during ordinary implementation and version-neutral drafting.
  - Require independently reviewable Change delivery before a separately owned Release Change and release-finalization commit when Git authority exists.
  - Align Core, `rsp-release-docs`, and `rsp-manage` guidance and contract tests.
- Non-goals:
  - Do not require automatic commits, infer Git authority, or prescribe one universal release tool.
  - Do not select the beta.1 identity or prepare its package surfaces in this Change.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: release identity is confirmed late and never inferred
  - Until the user or authoritative release configuration confirms the target version and range, RSP may keep a version-neutral ledger but does not mutate version manifests, target changelog headings, exact-version README commands, versioned release-note paths, or tag comparisons.
  - A guessed next semantic version, prior prerelease sequence, planned changelog, or package manager convention is not confirmation.
- Requirement: implementation and release delivery remain independently reviewable
  - Each completed Change reaches its own review and lifecycle closeout before a separate Release Change owns version finalization.
  - With explicit Git authority, managed continuation commits each completed Change as a logical unit before opening or finalizing the Release Change; without it, the workflow returns the exact commit boundary to its owner.
  - The release identity and versioned shipped surfaces are finalized in a dedicated release commit before tag, registry, or hosted-release actions.

### Acceptance
#### Scenario: implementation completes before a version is chosen
- GIVEN an ordinary focused Change and no confirmed release identity
- WHEN implementation, verification, and review complete
- THEN version manifests and versioned release documentation remain unchanged and the Change can be archived and independently committed

#### Scenario: autonomous work includes explicit Git authority
- GIVEN multiple completed Changes followed by a confirmed release request
- WHEN managed continuation reaches each lifecycle boundary
- THEN it commits each completed Change separately and prepares the confirmed version in a distinct Release Change and release commit

## Design
- Approach:
  - Add a release-identity ownership gate before draft projection and publication finalization.
  - Express the Change-to-commit-to-Release-Change sequence as an authority-sensitive handoff rather than automatic Git behavior.
- Boundaries:
  - Ordinary Changes own product/workflow deltas; Release Changes own version identity and versioned shipped surfaces; Git delivery remains separately authorized.
- Affected areas:
  - `skills/rsp-release-docs/SKILL.md`
  - `skills/rsp/SKILL.md`
  - `skills/rsp-manage/SKILL.md`
  - corresponding Skill contract tests and `.rsp/specs/design.md`
- Constraints:
  - Preserve explicit Git/publication authority and repository-specific versioning conventions.
  - Do not force a commit when authority is absent or the worktree cannot be separated safely.

## Tasks
- [x] Add late identity and version-neutral draft boundaries to release documentation guidance.
- [x] Add independent Change/release delivery sequencing to Core and managed continuation.
- [x] Add focused contract coverage and update the stable workflow fact.

## Verify
- Automated:
  - [x] `mise exec -- pnpm vitest run test/rsp-release-docs-skill-contract.test.ts test/rsp-core-routing-contract.test.ts test/managed-controller-contract.test.ts test/helpers.test.ts` (4 files / 84 tests passed) — proves: identity ownership and commit/release sequencing remain explicit across the published Skills.
  - [x] `node scripts/native-design-composition-eval.mjs --run-real` passed all composition, isolation, package, phase, and retained-evidence gates under immutable final run `device-discovery-boundary-defer-release-identity-finalization-final`; the earlier successful pre-fallback-sync run remains immutable historical evidence and is not selected by the evaluator.
- Manual or environment:
  - [x] Fixed-scope review confirms `package.json`, `CHANGELOG.md`, READMEs, and versioned release notes remain unchanged in this Change.
- Coverage:
  - Real-host composition evidence is required after final Skill text converges; external publication remains out of scope.

## Blockers
- none
