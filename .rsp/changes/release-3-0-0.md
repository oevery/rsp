---
kind: "ops"
---

# Change: release-3-0-0

## Proposal
- Summary: Deliver RSP 3.0.0 as a deterministic protocol plus a complete minimum Skill Suite, then perform the authorized external release.
- Why:
  - The major release should ship a usable protocol-to-engineering loop rather than a review-only partial suite.
- Scope:
  - Serve as the Overall Delivery Contract for the research, minimum-suite, and terminal release outcomes required by RSP 3.0.0.
  - Own only the terminal delivery work: finalize version/changelog/migration documentation, run release gates, commit release preparation, then perform separately authorized external release operations.
- Non-goals:
  - Re-owning or duplicating upstream Group tasks, progress, verification, or completion conditions.
  - Adding new capabilities during release preparation or granting implicit push/tag/publish authority.

## Spec
### MODIFIED
- Requirement: RSP 3.0.0 packages the deterministic protocol and the complete promoted minimum Skill Suite with truthful migration and release notes.
  - `skill-capability-research/brief` owns the accepted evidence baseline and selected shaping/implementation models.
  - `minimum-skill-suite/brief` owns the promoted Core, Shape, Implement, and Review composition outcome.
  - `release-3-0-0` owns version identity, packaging, migration communication, and authorized external release operations.
  - The release artifact excludes research, evaluation, cache, self-hosting Change state, and maintainer-only tooling.
  - Push, tag, npm publish, and GitHub Release each require explicit external-action authority.

### Acceptance
#### Scenario: overall delivery contract becomes release-ready
- GIVEN `skill-capability-research` and `minimum-skill-suite` are closed and composition gates pass
- WHEN the maintainer reviews the derived dependency plan and repository history
- THEN every upstream outcome has one semantic owner and `release-3-0-0` contains only terminal delivery work
- AND no upstream task, progress, or verification state is duplicated in this Change

#### Scenario: maintainer releases 3.0.0
- GIVEN the overall delivery contract is release-ready, the worktree release scope is reviewed, and all release checks pass
- WHEN the maintainer performs the explicitly authorized release sequence
- THEN the package, tag, and release notes identify the same 3.0.0 contents
- AND clean installation exposes the CLI and every promoted Skill without research artifacts

## Design
- Approach:
  - Use the existing six-section Change contract as an Overall Delivery Change profile: Proposal, Spec, and Design own the cross-owner delivery outcome while Tasks and Verify remain limited to terminal release operations.
  - Keep release preparation in one reviewed commit, verify the exact tarball, then separate repository/registry mutations behind explicit authorization.
- Delivery ownership:
  - `skill-capability-research/brief`: accepted research baseline, capability coverage, selected capability contracts, and reconciled Skill System model.
  - `minimum-skill-suite/brief`: promoted minimum Skill Suite and verified composition through existing RSP artifacts.
  - `release-3-0-0`: version preparation, package verification, migration communication, and authorized external publication.
  - Current dependency state and execution waves are derived by `rsp status`; this ownership map contains no live status.
- Affected areas:
  - `package.json`, `CHANGELOG.md`, release notes and migration documentation
  - package tarball and external release channels
- Constraints:
  - Do not alter capability behavior during this Change; return defects to their owning archived/follow-up Change.
  - Do not copy upstream Group completion checklists or turn referenced Groups into child entities.

## Tasks
- [ ] Confirm both upstream Groups are closed and repository history contains the accepted models and every promoted capability.
- [ ] Complete 3.0.0 changelog, migration notes, version identity, and release date.
- [ ] Run full release, package-content, clean-install, and CLI/Skill discovery gates.
- [ ] Commit the release preparation as one scoped commit.
- [ ] After separate authorization, push, tag, publish, create release notes, and verify installed registry contents.

## Verify
- Automated:
  - [ ] `mise exec -- pnpm run release:check`
  - [ ] Pack and install the exact artifact into a clean temporary prefix.
- Manual:
  - [ ] Compare Git tag, npm metadata, package file list, changelog, migration notes, CLI version, and installed Skill inventory.
- Durable updates:
  - [ ] Changelog and migration documentation are the durable release record; no additional product Spec is required unless final behavior differs.

## Blockers
- requires `minimum-skill-suite/validate-skill-composition`: needs the installed minimum suite to pass composition gates
- `skill-capability-research` and `minimum-skill-suite` must both be closed.
- External push, tag, npm publish, and GitHub Release operations require separate explicit authorization.
