---
kind: "refactor"
---

# Change: typed-work-ref

## Proposal
- Summary: Introduce a typed WorkRef before Change Groups
- Why:
  - Change identity, path construction, focus eligibility, and directory depth are currently interpreted independently by each command
  - C4 cannot add a shallow Change Group safely while commands still treat every recursive Markdown path as an executable Change
- Scope:
  - Add one typed WorkRef resolver for flat Changes, direct grouped Changes, and Group Briefs
  - Route create, focus, show, ready, check, status, doctor, init, and archive behavior through the shared resolver where they consume open work identities
  - Reject unsupported recursion, reserved Group Brief execution, and file/directory identity collisions deterministically
  - Preserve flat Change and direct grouped Change behavior
- Non-goals:
  - Do not add Group Brief templates, validation, lifecycle, completion derivation, or close/archive behavior
  - Do not require a Group Brief for direct grouped Changes until C4
  - Do not add recursive groups, cross-workspace references, dependency graphs, or configurable core paths

## Spec
<!-- Describe the desired structural outcome. Implementation notes belong in ## Design. -->
### MODIFIED
- Requirement: authoritative work identity resolution
  - Open work identities resolve through one typed interface as a flat Change, direct grouped Change, or Group Brief
  - Only flat and direct grouped Changes are executable; Group Briefs are recognized but rejected by Change commands
- Requirement: bounded work paths
  - Allowed paths are exactly `changes/<change>.md`, `changes/<group>/<change>.md`, and `changes/<group>/brief.md`
  - Deeper paths and file/directory identity collisions produce deterministic machine-readable errors
- Requirement: compatibility before Change Groups
  - Existing flat Changes and one-segment subdirectory Changes retain their current create, focus, show, ready, check, status, and archive behavior
  - C3 recognizes Group Brief identity without implementing the Change Group lifecycle

### Acceptance
#### Scenario: supported work identities resolve explicitly
- GIVEN a flat Change, a direct grouped Change, and a Group Brief identity
- WHEN the WorkRef resolver classifies them
- THEN each produces a distinct typed reference with a deterministic path and group owner

#### Scenario: executable commands reject a Group Brief
- GIVEN `changes/release/brief.md`
- WHEN a command that operates on an executable Change resolves `release/brief`
- THEN it fails with a machine-readable non-executable WorkRef error

#### Scenario: unsupported hierarchy fails closed
- GIVEN `changes/release/backend/api.md` or both `changes/release.md` and `changes/release/`
- WHEN the workspace or explicit identity is resolved
- THEN resolution fails with an unsupported-depth or identity-collision diagnostic

#### Scenario: current Change behavior remains stable
- GIVEN a flat Change or direct grouped Change
- WHEN existing create, focus, show, ready, check, status, and archive flows run
- THEN their observable behavior remains compatible

## Design
- Approach:
  - Introduce a deep `work-ref` module whose small interface owns parsing, path derivation, executable filtering, existence checks, and collision checks
  - Test the resolver through its public interface, then migrate commands away from ad hoc `join(CHANGES_DIR, name + '.md')` and recursive-name interpretation
  - Keep Group Brief execution and lifecycle deliberately unavailable until C4
  - Promote recommendation C3 from `research/models/rsp-engineering-domain-model.md` through independent reimplementation rather than importing upstream runtime code
- Affected areas:
  - `src/core/work-ref.ts`, `src/commands/`, and focused-name helpers
  - `test/work-ref.test.ts`, CLI integration tests, rules, skill, README, and `.rsp/specs/design.md`
- Constraints:
  - WorkRef paths remain rooted in the fixed `.rsp/changes` directory
  - The resolver must not infer focus or create missing work
  - Unsupported structures fail closed without partial filesystem mutation

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Add failing public-interface tests for WorkRef classification, executable filtering, depth, collision, and existence
- [x] Implement the typed WorkRef resolver
- [x] Migrate open-work commands and workspace diagnostics to the shared resolver
- [x] Update protocol guidance and durable design to describe the implemented C3 boundary
- [x] Verify the result and complete durable review
- [x] Make status fail visibly on structural WorkRef diagnostics
- [x] Reject existing WorkRef targets that are not regular files
- [x] Revalidate create identity inside the mutation lock
- [x] Centralize work-tree discovery for check, status, and doctor
- [x] Re-run verification and durable review after review fixes
- [x] Reject symlinked and non-directory open-work roots
- [x] Fail closed when open-work inspection is incomplete
- [x] Validate grouped path prefixes before filesystem mutation
- [x] Keep status JSON success and error envelopes structurally aligned
- [x] Re-run verification and durable review after final hardening
- [x] Prevent focus marker reads and writes through invalid roots or group prefixes
- [x] Prevent archive moves through invalid roots or group prefixes
- [x] Treat missing or unreadable current work as unhealthy status
- [x] Diagnose and repair a missing open-work root deterministically
- [x] Re-run verification and review after managed-path hardening
- [x] Prevent init and index generation through invalid managed roots
- [x] Inspect archive roots and direct groups without following symlinks
- [x] Share managed-directory validation across WorkRef and lifecycle commands
- [x] Re-run verification and review after core-directory hardening
- [x] Prevent Spec creation through symlinked parent directories
- [x] Inspect recursive Specs without following symlinked entries
- [x] Create additional Specs atomically inside the mutation lock
- [x] Re-run verification and review after Specs-path hardening
- [x] Reject symlinked focus marker targets before writing
- [x] Validate fixed managed files before init, update, and doctor reads or writes
- [x] Centralize safe create-or-replace behavior for managed files
- [x] Re-run verification and review after managed-file hardening
- [x] Reject a symlinked project AGENTS.md before initialization, update, or doctor reads
- [x] Consolidate managed directory and file primitives under one managed-path abstraction
- [x] Re-run verification and review after project-file hardening

## Verify
- Automated:
  - [x] Run focused WorkRef and CLI integration tests
  - [x] Run `mise exec -- pnpm release:check`
  - [x] Run `node dist/cli.mjs check --focused --json`
  - [x] Run `git diff --check`
- Manual:
  - [x] Confirm flat and direct grouped Changes retain their behavior while Group Brief and recursive identities fail deterministically
- Durable updates:
  - [x] Update `.rsp/specs/design.md` because supported work shapes and resolver invariants are stable product facts
  - [x] No Decision Record needed; this implements the already selected C3 model without adding a new hard-to-reverse tradeoff

## Blockers
- none
