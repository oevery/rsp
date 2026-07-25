---
kind: "fix"
---

# Change: harden-release-finalization-boundary

## Proposal
- Outcome: Prevent pre-publication state and transient credentials from leaking into public release documentation, and correct the published beta.0 repository surfaces without rewriting its immutable artifacts.
- Why:
  - `3.1.0-beta.0` shipped with an `Unreleased` changelog heading and README/release-note claims that npm, registry-resolved `npx`, the beta dist-tag, and GitHub Release were still unavailable after those actions completed.
  - The existing release-documentation Skill distinguishes preparation from publication but does not make publication finalization a mandatory, checkable handoff.
- Scope:
  - Correct repository-owned changelog, README, and release-note truth while preserving beta.0 as an immutable published identity rather than rewriting its tag or npm artifact.
  - Add publication-invariant surface ownership, mandatory finalization/reconciliation guidance, explicit Core routing, and a deterministic release-metadata gate with focused regression coverage.
  - Add safe publication-handoff guidance that treats OTPs and browser-auth URLs as transient credentials which must not enter durable artifacts or summaries.
- Non-goals:
  - Rewriting or deleting `v3.1.0-beta.0`, unpublishing it, editing existing remote release metadata, pushing, tagging, creating a GitHub Release, publishing npm, moving `latest`, or claiming boats-cloud acceptance.

## Spec
### MODIFIED
- Requirement: package-owned release surfaces are publication-invariant before external delivery
  - README, changelog, packaged release notes, and comparison links remain true both immediately before and after publication; transient registry/authentication status belongs to the focused release Change or temporary evidence, not the tarball.
  - A finalization gate rejects a current package version whose changelog entry is missing a date or marked `Unreleased`, whose release comparison targets `HEAD`, or whose package-owned release surfaces retain known future-publication language.
- Requirement: release documentation has an explicit terminal handoff
  - `rsp-release-docs` distinguishes audit, draft, finalize-for-publication, and reconcile-published-release work, and cannot report publication-ready until every shipped surface passes the publication-invariant audit.
  - Core routes an explicit tag, GitHub Release, or registry publication request through finalization even when release prose was previously prepared, without granting the external action itself.
- Requirement: publication credentials remain transient
  - OTPs, browser-auth URLs, URL tokens, and equivalent credentials are never copied into Changes, Specs, release evidence, command summaries, or final responses; when the host cannot keep interactive output private, authentication remains a human-owned terminal boundary.

### Acceptance
#### Scenario: stale preparation prose blocks a release
- GIVEN a package version with an `Unreleased` target heading, a `HEAD` comparison, or future-publication wording in a package-owned release surface
- WHEN the release metadata gate runs
- THEN it fails with the exact offending surface and reason before packaging or publication

#### Scenario: corrected beta.0 repository surfaces pass the gate
- GIVEN beta.0 remains published and immutable
- WHEN the corrected repository-owned beta.0 surfaces pass the release metadata gate
- THEN package metadata, changelog, README commands, release notes, and comparison links consistently identify `3.1.0-beta.0` without claiming that publication is pending

#### Scenario: release handoff does not leak credentials
- GIVEN publication requires interactive authentication
- WHEN RSP prepares or reports the handoff
- THEN it names the human-owned authentication boundary without retaining or repeating the credential material

## Design
- Approach:
  - Treat publication-invariant as the leading contract for tagged and packaged prose, with volatile preparation and verification state retained only by the release Change or transient response.
  - Add a small repository release-metadata checker before the existing build/test/package gate, driven by the current `package.json` version and explicit repository-owned release surfaces.
  - Keep external publication separately authorized and require a release-focused candidate to rerun finalization against its exact ref.
- Boundaries:
  - `rsp-release-docs` owns release prose and finalization audit, Core owns routing, the project release script owns deterministic repository checks, and external publishers own credentials and registry/forge mutations.
- Affected areas:
  - `skills/rsp-release-docs/`, `skills/rsp/SKILL.md`, and their contract tests
  - `scripts/`, `package.json`, release-check tests, `CHANGELOG.md`, READMEs, and `docs/releases/`
  - immutable native-composition evidence for the changed published Skill suite
  - `.rsp/specs/design.md` only if the final release boundary is a stable product/maintainer fact not already owned elsewhere
- Constraints:
  - Preserve beta.0 tag and npm identity; do not create or mutate external release state.
  - Keep checks deterministic and limited to release-integrity risks; do not turn arbitrary prose into a broad banned-word linter.
  - Keep temporary command output, authentication material, and managed dispatch chronology out of durable artifacts.

## Tasks
- [x] Correct beta.0 publication truth and its package/release documentation and exact-version assertions.
- [x] Harden `rsp-release-docs` and Core routing around publication-invariant finalization, reconciliation, and credential boundaries.
- [x] Add a deterministic release-metadata gate and focused regression coverage, then integrate it into `release:check`.
- [x] Independently review the combined diff, resolve actionable findings, and make the durable-update decision.
- [x] Run the release metadata and package gates for the corrected beta.0 repository state without tag, push, GitHub Release, npm publication, or dist-tag mutation.

## Verify
- Automated:
  - [x] Focused release-metadata, Skill/Core routing, helper, and native-composition tests passed — proves: finalization order, archived-owner routing, stale-state rejection without blocking general workflow guidance or historical commands, and current published-Skill identity
  - [x] `mise exec -- pnpm run release:check` passed metadata integrity, build, typecheck, lint, 44 test files / 480 tests, and exact tarball/clean-install checks for corrected `@oevery/rsp@3.1.0-beta.0` repository state with SHA-256 `96dbc2b90eeadb8ed38d0ee653a44cfe1775bde852a4e592a3cf8a81fca0e93f`.
- Manual or environment:
  - [x] Fixed-scope Code and Document re-review returned clean; package inventory and public release surfaces consistently identify `3.1.0-beta.0`; the final immutable native-composition run passed without retaining credential material
- Coverage:
  - Existing beta.0 npm tarball and tag remain unchanged. The existing hosted beta.0 release body was not edited. Boats-cloud dogfooding, tag/push/GitHub Release creation, npm publication, and dist-tag mutation remain unavailable until separately authorized.

## Blockers
- none
