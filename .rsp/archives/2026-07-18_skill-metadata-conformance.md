---
kind: "fix"
---

# Change: skill-metadata-conformance

## Proposal
- Summary: Make the published RSP skill conform to Agent Skills metadata and version independently
- Why:
  - The published skill uses a mapping for `compatibility`; Agent Skills requires a string, while an active target-client validator rejects the optional field entirely.
  - Skill provenance should remain useful when copied independently from the npm package, without coupling skill changes to the RSP CLI release cadence.
- Scope:
  - Implement selected recommendations R1-R4 from the pinned `agent-skills-spec` research report.
  - Use `metadata.author` and an independent content CalVer, add `license: MIT`, and add a local conformance gate.
  - Correct the unaccepted research recommendation so it records the selected CalVer policy.
- Non-goals:
  - Using metadata version for installation or update detection.
  - Adding the upstream reference validator as a dependency.
  - Changing other upstream or third-party skills.

## Spec
<!-- Describe expected correct behavior. Implementation notes belong in ## Design. -->
### MODIFIED
- Requirement: The published RSP skill conforms across the Agent Skills contract and active target-client validation.
  - The optional `compatibility` field is omitted, `license` is `MIT`, and all custom metadata values are strings.
- Requirement: The published skill versions its content independently from the CLI.
  - `metadata.author` identifies the maintainer and `metadata.version` uses quoted `YYYY.MM.DD` or `YYYY.MM.DD.N` CalVer, updated only for meaningful skill-content changes.
- Requirement: Local tests guard the applicable normative metadata shape without executing or depending on upstream code.

### Acceptance
#### Scenario: validate the distributed skill
- GIVEN the standalone `skills/rsp` artifact
- WHEN the repository test suite checks its `SKILL.md` frontmatter
- THEN only portable top-level fields are present, metadata values are strings, and name, license, author, and CalVer are valid
- AND the skill version is not required to equal the npm package version

## Design
- Approach:
  - Use the intersection of Agent Skills normative prose and active target-client validation, then implement a small repository-owned test at the published artifact seam.
  - Keep exact installation identity in Git and folder hashes; use metadata CalVer only as human-facing content provenance.

### Research provenance
- Source report: `research/upstreams/agent-skills-spec/38a2ff82958afee88dadf4831509e6f7e9d8ef4e.md`
- Recommendations: R1, R2, R3, R4
- Adoption: `independent-reimplementation`

- Affected areas:
  - `skills/rsp/SKILL.md`
  - `test/helpers.test.ts`
  - `research/upstreams/agent-skills-spec/`
  - `.rsp/specs/design.md`
- Constraints:
  - Preserve skill routing semantics and keep the main skill body unchanged.
  - Do not couple skill CalVer to `package.json`, execute cached upstream code, or add a runtime dependency.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Add a failing published-skill conformance test
- [x] Apply the four selected metadata recommendations and correct the research recommendation
- [x] Update durable design facts and run focused and full verification

## Verify
- Automated:
  - [x] `mise exec -- pnpm vitest run test/helpers.test.ts`
  - [x] `mise exec -- pnpm run release:check`
  - [x] `uv run --with pyyaml python /Users/oevery/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/rsp`
- Manual:
  - [x] Inspect the published `SKILL.md` frontmatter and npm dry-run contents.
- Durable updates:
  - [x] Decide whether this change produced durable knowledge that belongs in `.rsp/specs/` or `.rsp/rules/`
  - [x] Record the standalone skill metadata contract in `.rsp/specs/design.md`.

## Blockers
- none
