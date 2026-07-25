---
kind: "feature"
---

# Change: rsp-manage-beta/install-packaged-skills

## Proposal
- Outcome: Let one exact RSP npm package safely install its bundled Skills into a project's `.agents/skills`.
- Why:
  - `rsp init` currently scaffolds artifacts but does not install Skills, while `npx skills add oevery/rsp` resolves GitHub rather than the exact npm prerelease identity needed for reproducible beta dogfooding.
- Scope:
  - Add `rsp skills install` with deterministic inventory, dry-run, conflict detection, and explicit replacement of only package-owned Skill directories.
- Non-goals:
  - A general Skill manager, implicit installation during `rsp init`, global installation, background updates, hidden installation state, or mutation of unrelated project Skills.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: packaged Skills install from the invoking package identity
  - `rsp skills install` copies every regular bundled Skill tree from the running package into `.agents/skills/<name>` and reports installed, unchanged, replaced, or conflicting names deterministically.
  - `--dry-run` performs the complete source, destination, and content preflight without mutation.
- Requirement: project-owned paths fail closed
  - The command rejects symlinked or unsupported source and destination entries, preflights every package-owned target before mutation, and leaves unrelated `.agents/skills` entries untouched.
  - Identical installed trees are no-ops; divergent package-owned targets stop the whole operation unless `--force` is explicit, in which case only those exact validated target directories are replaced.
  - No manifest, controller state, or other durable workflow truth is created.

### Acceptance
#### Scenario: exact beta package installs its suite
- GIVEN an isolated project with no conflicting package-owned Skill directories
- WHEN the user runs the exact package's `rsp skills install`
- THEN all ten bundled Skills are copied into `.agents/skills`, unrelated entries remain unchanged, and a repeated run reports every installed Skill unchanged

#### Scenario: conflicting project Skill fails without partial writes
- GIVEN one divergent package-owned destination and one missing destination
- WHEN the user runs `rsp skills install` without `--force`
- THEN the command reports the conflict, exits unsuccessfully, and installs or replaces nothing

#### Scenario: dry-run and explicit replacement are bounded
- GIVEN divergent package-owned targets plus unrelated project Skills
- WHEN the user first runs `--dry-run` and then explicitly runs `--force`
- THEN dry-run changes nothing, force replaces only exact package-owned targets from the invoking package, and unrelated Skills remain byte-for-byte unchanged

## Design
- Approach:
  - Inspect package and destination trees using no-follow filesystem checks, compare normalized relative file inventories and bytes, and complete global preflight before writing.
  - Stage replacement content under the validated `.agents/skills` root, revalidate ancestor and replacement identities at mutation time, and rename only exact package-owned directories after successful copies.
  - Roll back every moved directory on activation failure; remove backups only after complete restoration, otherwise retain the original trees under the reported staging path for recovery.
- Boundaries:
  - The CLI owns package-to-project copying; installed `.agents/skills` directories become explicit project artifacts, while RSP workflow truth remains under `.rsp` and project-owned files.
- Affected areas:
  - `src/commands/skills.ts`, `src/cli.ts`, managed filesystem helpers
  - focused CLI integration tests, package smoke checks, and install guidance
- Constraints:
  - Do not follow symlinks, delete broad roots, overwrite without explicit `--force`, partially install after a known conflict, or require network access.
  - Preserve executable modes where present and package only authored Skill files; ignore dot-prefixed transient entries.

## Tasks
- [x] Implement deterministic source/destination inspection, content comparison, and all-target preflight.
- [x] Add `rsp skills install [--dry-run] [--force]` with bounded copy/replacement and concise output.
- [x] Add focused integration coverage for initial install, idempotence, conflicts, dry-run, force replacement, unrelated preservation, symlink rejection, ancestor drift, activation failure, and incomplete rollback recovery.

## Verify
- Automated:
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm exec vitest run test/skills-install.test.ts`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, and `node scripts/clean-install-check.mjs --json` pass; nine focused cases cover normal behavior plus path drift and rollback failures, and the clean package contains the exact ten-Skill inventory and built CLI.
- Manual or environment:
  - [x] At final identity `3.1.0-beta.0`, the clean-install gate invoked the locally packed exact CLI from an isolated project, installed and inspected all ten `.agents/skills` entries, and repeated installation unchanged.
- Coverage:
  - Registry-resolved `npx` remains unavailable until separately authorized publication; the local tarball proves the same packaged command and payload.

## Blockers
- none
