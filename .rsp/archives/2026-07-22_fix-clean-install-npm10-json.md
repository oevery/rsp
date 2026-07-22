---
kind: "fix"
---

# Change: fix-clean-install-npm10-json

## Proposal
- Summary: Make the clean-install release gate tolerate npm 10 pack lifecycle output on supported Node 18 and 20 runtimes
- Why:
  - npm 10 emits the package `prepare` lifecycle output before `npm pack --json`, so the release checker receives non-JSON stdout and exits with `Unexpected token` on supported Node 18 and 20 runtimes.
- Scope:
  - Make the clean-install checker consume the structured npm pack result without assuming stdout contains JSON only.
  - Add a deterministic regression for lifecycle output preceding the JSON payload and rerun the real Node 18/20 smoke path.
- Non-goals:
  - Changing package contents, supported Node versions, build behavior, release credentials, or publication actions.

## Spec
<!-- Describe expected correct behavior. Implementation notes belong in ## Design. -->
### MODIFIED
- Requirement: correct behavior
  - The clean-install checker requests non-foreground lifecycle handling so supported npm versions keep `npm pack --json` machine-readable.
  - It still parses the complete stdout as one JSON value, fails closed on any mixed or malformed output, and preserves package inventory and identity checks.

### Acceptance
#### Scenario: npm lifecycle output precedes pack JSON
- GIVEN a supported Node runtime whose npm emits `prepare` output before the structured pack result
- WHEN the clean-install release checker packs and installs RSP
- THEN it disables foreground lifecycle output, parses the complete JSON value, and completes the existing package, CLI, and Skill validation
- AND malformed or ambiguous stdout still fails instead of silently accepting an arbitrary fragment

## Design
- Approach:
  - Keep `npm pack --json` as the authoritative producer and pass `--foreground-scripts=false` so npm 10 does not stream `prepare` output into stdout.
  - Preserve strict whole-output JSON parsing rather than accepting arbitrary lifecycle noise.
- Affected areas:
  - `scripts/clean-install-check.mjs`
  - `test/clean-install-check.test.ts`
- Constraints:
  - Preserve the current Node 24 clean-install result, exact eight-Skill inventory, tarball identity, and temporary-directory cleanup.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Add the red npm lifecycle-noise regression and apply the minimal command fix
- [x] Verify the result and update any required durable specs or scoped instructions

## Verify
- Automated:
  - [x] `mise exec -- pnpm vitest run test/clean-install-check.test.ts`
  - [x] `mise exec -- pnpm run release:check`
- Manual:
  - [x] Run `mise exec node@18 -- node scripts/clean-install-check.mjs` and the equivalent Node 20 command.
- Durable updates:
  - [x] Decide whether this change produced durable knowledge that belongs in `.rsp/specs/` or stable instructions that belong in the nearest project-owned `AGENTS.md`
  - [x] No durable product update is required; the maintainer-only compatibility behavior is captured by the regression test.

## Blockers
- none
