---
kind: "fix"
---

# Change: stabilize-release-test-build

## Proposal
- Outcome: Make Vitest build the shared CLI before parallel workers and refresh it before watch reruns so root `dist` remains stable and current.
- Why:
  - `release:check` builds `dist/cli.mjs` before Vitest, but `test/integration/harness.ts` runs another root `pnpm build` inside one worker.
  - `tsup` cleans `dist/` before writing, so concurrent tests that execute `dist/cli.mjs` intermittently observe a missing file or empty CLI output.
- Scope:
  - Build the shared CLI in Vitest global setup before parallel workers start.
  - Rebuild it through the same serialized hook before each watch rerun.
  - Remove the worker-local integration build.
- Non-goals:
  - No production CLI, package inventory, Skill, release sequence, worker-count, or test-behavior change.
  - No global serialization of the test suite.

## Spec
### MODIFIED
- Requirement: every Vitest run prepares the root CLI before test workers execute.
  - No test worker may rebuild or clean the shared root `dist/` while another worker can consume it.
  - Existing parallelism remains enabled.

### Acceptance
#### Scenario: parallel CLI consumers
- GIVEN tests that execute the built CLI and integration tests that require the same artifact
- WHEN Vitest runs them concurrently with the configured worker pool
- THEN the CLI is built before workers start and remains available for the full run

#### Scenario: direct focused Vitest run
- GIVEN a checkout without a current `dist/cli.mjs`
- WHEN a maintainer runs a focused `vitest run` command directly
- THEN global setup builds the CLI before the selected tests execute

#### Scenario: watch rerun after source change
- GIVEN Vitest watch mode is active and source changes invalidate a CLI-consuming test
- WHEN Vitest prepares the rerun
- THEN the registered rerun hook rebuilds `dist/cli.mjs` before test workers execute

## Design
- Approach:
  - Register one Vitest global setup module that runs the existing repository build command.
  - Register the same build through `TestProject.onTestsRerun` for watch mode.
  - Delete the integration harness `beforeAll` build while retaining its fixture setup.
- Boundaries:
  - Vitest configuration owns pre-worker test preparation; individual suites own only their fixtures.
  - `release:check` continues to own its existing build, typecheck, lint, test, and package sequence.
- Affected areas:
  - `vitest.config.ts` and one test setup module.
  - `test/integration/harness.ts`.
- Constraints:
  - Reuse `pnpm run build`; do not duplicate tsup configuration.
  - Preserve `maxWorkers: 2` and avoid test-wide serialization.

## Tasks
- [x] Move the root CLI build to Vitest global setup.
- [x] Rebuild the CLI before watch reruns without moving the build back into workers.
- [x] Remove the integration worker-local build.
- [x] Reproduce the previously conflicting suites in parallel and run the release gate.

## Verify
### Required
- Automated:
  - [x] Move the existing root `dist/` aside, then run `test/integration.test.ts`, `test/issue-relationship.test.ts`, and `test/author-rsp-skills.test.ts` together three times with `--maxWorkers=2` — all three runs exited 0; the first rebuilt `dist/cli.mjs` from global setup and no run lost the shared CLI.
  - [x] `mise exec -- pnpm exec vitest run test/global-setup.test.ts --reporter=dot` plus typecheck — passed 1 test; proves setup builds before initial workers, registers one watch-rerun callback, and invokes the same build through that callback.
  - [x] Final `mise exec -- pnpm run skills:security-check` plus `mise exec -- pnpm run release:check` — security scanned 40 files with zero findings; metadata, docs, build, typecheck, lint, normal parallel 75 files / 832 tests, and clean-install package validation passed; SHA-256 `915bfb9e73c7c36634e4812642dcedcef09d0817988a935560a4f714decf49dc`.
### Optional
- Manual or environment:
  - [x] No additional manual or environment validation required for this test-runner-only correction.
- Coverage:
  - No timing or cross-platform performance claim beyond the existing supported test environment.

## Blockers
- none

## Durable Decision
- Current facts: No current-fact update needed
- Current-fact target: N/A
- Facts to write: none; Vitest configuration and the test harness are the executable owners
- Decision Record: No Decision Record needed
- Decision Record target: N/A
- Rationale to write: none; pre-worker preparation is a local test-runner correction
- Archive ready: yes
