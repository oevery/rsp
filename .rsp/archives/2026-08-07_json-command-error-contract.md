---
kind: "fix"
---

# Change: json-command-error-contract

## Proposal
- Outcome: Return structured JSON for workspace CLI command failures
- Why:
  - The real workspace smoke test showed `rsp workspace dispose --json` and missing-workspace queries printing stack traces instead of machine-readable JSON.
- Scope:
  - Catch workspace command failures at the command boundary when `--json` is requested, emit the existing `{ command, ok: false, error }` shape, and preserve human-readable errors for non-JSON invocation.
- Non-goals:
  - Redesigning Citty error handling for unrelated commands.
  - Changing workspace lifecycle safety rules or error messages.

## Spec
### MODIFIED
- Requirement: Workspace commands with `--json` return one JSON error document on failure.
  - The response contains the command identity, `ok: false`, and an `error` object with a stable code and human-readable message.
- Requirement: Non-JSON workspace failures retain the existing human-readable failure behavior.
  - This Change does not alter Citty's existing non-JSON error rendering.

### Acceptance
#### Scenario: JSON dispose rejects dirty workspace
- GIVEN a recorded workspace with uncommitted changes
- WHEN `rsp workspace dispose <work-ref> --json` runs
- THEN it exits non-zero, writes no stack trace, and emits parseable JSON with `ok: false`

#### Scenario: JSON status reports missing workspace
- GIVEN no recorded workspace for the requested WorkRef
- WHEN `rsp workspace status <work-ref> --json` runs
- THEN it exits non-zero and emits parseable JSON with a stable `workspace_not_found` error code

## Design
- Approach:
  - Catch expected workspace command errors inside the public command wrappers, emit the existing JSON envelope, and return a failed command result so the CLI preserves the non-zero exit code.
- Boundaries:
  - `src/commands/workspace.ts` owns workspace JSON error projection.
  - `src/cli.ts` owns translating failed command results into the process exit code.
- Affected areas:
  - `src/commands/workspace.ts`
  - `src/cli.ts`
  - `test/workspace-json-error.test.ts`
  - `.rsp/specs/cli-contracts.md`
- Constraints:
  - Do not alter workspace session safety checks.
  - Do not expose stack traces in machine-readable output.
  - Keep error messages credential-free and preserve existing human CLI output.

## Tasks
- [x] Add focused public CLI regression tests for dirty dispose and missing workspace JSON failures.
- [x] Observe RED against the current CLI.
- [x] Implement the smallest workspace command-boundary JSON error projection.
- [x] Run focused tests, build, typecheck, lint, and the full test suite.
- [x] Refresh this Change with final verification evidence.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/workspace-json-error.test.ts` — proves public JSON failure output and non-zero exit codes; 2 tests passed.
  - [x] `mise exec -- pnpm run build` — proves the packaged CLI contains the fix; passed.
  - [x] `mise exec -- pnpm run typecheck` — proves the command result types remain valid; passed.
  - [x] `mise exec -- pnpm run lint` — proves style and static checks pass; passed.
  - [x] `mise exec -- pnpm run test` — proves no regression across the repository; 61 files and 722 tests passed.
### Optional
- Manual or environment:
  - [x] Re-run the real temporary workspace smoke path for missing workspace status; exit code 1, parseable JSON, empty stderr.
- Coverage:
  - Land conflict behavior and activity lifecycle remain covered by existing workspace tests and are not changed here.

## Blockers
- none
