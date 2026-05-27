---
kind: "fix"
---

# Change: fix-npx-package-bin

## Proposal
- Summary: Ensure `bin/rsp.mjs` is shipped with executable permissions.
- Why: `bin/rsp.mjs` had mode 0644 in git and in the published tarball. Making it 0755 is standard packaging practice and ensures the shebang works when npm creates the bin symlink.
- Scope: `chmod +x` on `bin/rsp.mjs`, git mode update only.
- Non-goals: No CLI or packaging behavior changes. No postinstall or dev-symlink hacks.

## Spec
### ADDED
- Requirement: package-name npx invocation works
  - Running `npx @oevery/rsp --help` MUST execute the RSP CLI without shelling out to a missing `rsp` command.

### Acceptance
#### Scenario: invoke package by name
- GIVEN the package is installed or executed through `npx`
- WHEN a user runs `npx @oevery/rsp --help`
- THEN help text is printed and no `rsp: command not found` error appears

## Design
- Approach:
  - Change `bin/rsp.mjs` file mode from 0644 to 0755. Git tracks the executable bit separately from content, so `npm pack` will include it with correct permissions.
- Affected areas:
  - `bin/rsp.mjs` (mode only, no content change)
- Constraints:
  - Preserve `rsp` as the installed binary name.
  - No build or workflow changes needed.

## Tasks
- [x] Create concise RSP change.
- [x] Diagnose why `npx @oevery/rsp` resolves to a missing `rsp` command.
- [x] Fix package invocation and add focused verification.

## Verify
- Automated:
  - [x] `pnpm run build`
  - [x] `npm pack --dry-run --ignore-scripts`
- Manual:
  - [x] `npx @oevery/rsp --help` prints CLI help without `rsp: command not found`
- Durable updates:
  - [x] No durable writeback expected — packaging invariants unchanged.

## Blockers
- none

## Root Cause

The original symptom (`sh: rsp: command not found`) only occurs when running `npx @oevery/rsp` from inside the rsp source repo itself. npm resolves the package locally when the local `package.json` has matching `name` + `version`, but pnpm doesn't create `node_modules/.bin/rsp` for the root package. This is a maintainer-only edge case — end users outside the repo are unaffected.

Separately, `bin/rsp.mjs` was tracked with mode 0644 in git, which is not standard for bin scripts. Making it executable (0755) is correct packaging hygiene regardless of the original symptom.

## Fix

- **`bin/rsp.mjs`**: `chmod +x` + `git update-index --chmod=+x`. File mode 0644 → 0755. No content change.
