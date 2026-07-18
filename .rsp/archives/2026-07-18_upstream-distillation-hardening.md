---
kind: "fix"
---

# Change: upstream-distillation-hardening

## Proposal
- Summary: Close integrity and usability gaps in the upstream distillation workflow
- Why:
  - Initial candidates can currently be accepted without any completed source distillation.
  - Declared source paths can silently match nothing, evidence hashes do not describe the exact patch bytes, and status does not expose the research step required next.
- Scope:
  - Require complete candidate-matched research for initial and later acceptance.
  - Validate declared path coverage, make evidence hashes byte-accurate, and expose derived research state and next action.
  - Add explicit license/reuse and research-provenance guidance without adding another persisted workflow state.
- Non-goals:
  - Automatically distilling upstream sources or promoting recommendations into RSP product artifacts.
  - Adding another lock, promotion command, daemon, or runtime upstream overlay.

## Spec
<!-- Describe expected correct behavior. Implementation notes belong in ## Design. -->
### MODIFIED
- Requirement: acceptance always represents completed source distillation.
  - A pending candidate with no accepted baseline uses a report whose base is `null` and cannot be accepted without that complete matching report.
- Requirement: preparation evidence is complete and verifiable.
  - Every required source path matches at least one candidate file and the recorded patch hash describes the exact bytes written to `diff.patch`.
- Requirement: status identifies the next maintainer action.
  - Status derives research state and next action from the cache, lock, candidate, and candidate report without adding persisted lifecycle state.
- Requirement: research promotion remains separate and traceable.
  - Direct adaptation records license and reuse constraints, and a selected recommendation is cited by its normal RSP change.

### Acceptance
#### Scenario: initial candidate requires distillation
- GIVEN a synchronized candidate with no accepted baseline
- WHEN a maintainer attempts to accept it
- THEN acceptance fails until an initial complete candidate-matched report exists

#### Scenario: preparation validates its evidence scope
- GIVEN a source with a required path that matches no candidate file
- WHEN a maintainer prepares the source
- THEN preparation fails with the unmatched path and status exposes the coverage problem

#### Scenario: status routes the workflow
- GIVEN a synchronized pending candidate
- WHEN a maintainer requests status
- THEN the result reports `missing`, `draft`, `complete`, or `stale` research and one deterministic next action

## Design
- Approach:
  - Deepen the existing `status`, `prepare`, and `accept` interface; derive state instead of introducing new state files or commands.
  - Test behavior through exported maintainer functions and CLI JSON output.
- Affected areas:
  - `scripts/upstreams.mjs`, `upstreams.yaml`, and `upstreams.lock`
  - `test/upstreams.test.ts`, `.agents/skills/distill-upstream/`, `research/`, and maintainer documentation
- Constraints:
  - Preserve Node.js 18 support, deterministic output, ignored disposable evidence, and explicit lock mutation.
  - Never execute cached upstream code or overwrite existing semantic research.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Add regression tests for initial acceptance, evidence integrity, path coverage, and research routing
- [x] Harden the maintainer script and migrate the unreviewed accepted baseline
- [x] Update the distillation skill, registry scopes, research guidance, and durable design facts
- [x] Run focused and full verification and self-review the complete diff

## Verify
- Automated:
  - [x] `mise exec -- pnpm vitest run test/upstreams.test.ts`
  - [x] `mise exec -- pnpm run release:check`
  - [x] `uv run --with pyyaml python /Users/oevery/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/distill-upstream`
- Manual:
  - [x] Inspect real registry status and path coverage without network access.
  - [x] Confirm the package dry run excludes upstream tooling, research, and caches.
- Durable updates:
  - [x] Decide whether this change produced durable knowledge that belongs in `.rsp/specs/` or `.rsp/rules/`
  - [x] Update the existing upstream-maintenance facts in `.rsp/specs/design.md`.

## Blockers
- none
