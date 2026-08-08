---
kind: "refactor"
---

# Change: structural-simplification/core-dependency-layering

## Proposal
- Outcome: Remove Core runtime cycles and establish cohesive utility owners
- Why:
  - `src/core/helpers.ts` mixes parsing, filesystem traversal, templates, readiness, and durable-review guidance.
  - `config.ts -> helpers.ts -> output.ts -> config.ts` is a reachable runtime dependency cycle from the CLI entry.
- Scope:
  - Split the broad helper surface into cohesive Core modules and migrate production consumers.
  - Remove runtime cycles among configuration, output, and shared content utilities.
  - Preserve command output, file safety, and generated artifact bytes.
- Non-goals:
  - Change CLI behavior, persisted schemas, templates, readiness semantics, or package contents.
  - Refactor unrelated large modules or introduce dependency injection.

## Spec
### MODIFIED
- Requirement: Core utility dependencies follow one-way ownership.
  - Configuration may depend on standalone parsing utilities, but parsing and output utilities do not depend back on configuration.
  - Filesystem traversal, artifact rendering, Markdown interpretation, and readiness projection have cohesive owners.
  - Existing callers observe behavior-compatible diagnostics and byte-compatible generated artifacts.

### Acceptance
#### Scenario: Core modules load without a runtime cycle
- GIVEN the production TypeScript import graph
- WHEN runtime imports are inspected
- THEN no strongly connected component contains more than one Core module

#### Scenario: Existing behavior remains compatible
- GIVEN current command, template, readiness, and configuration fixtures
- WHEN focused and full repository tests run
- THEN existing public output and filesystem behavior remain unchanged

## Design
- Approach:
  - Extract cohesive modules for content parsing, artifact rendering, filesystem support, and readiness interpretation.
  - Migrate production imports directly to their owners and remove the catch-all helper.
  - Add a focused import-graph assertion that ignores `import type`.
- Boundaries:
  - Keep `src/core/config.ts` as the owner of RSP paths, defaults, and configuration policy.
  - Keep `src/core/output.ts` presentation-focused.
- Affected areas:
  - src/core/
  - src/commands/, src/status/, src/history/, and focused Core tests
- Constraints:
  - No new public CLI or package API.
  - No generated-file edits or speculative abstraction.

## Tasks
- [x] Extract cohesive Core utility modules and migrate production consumers into `artifacts.ts`, `content.ts`, `filesystem.ts`, and `readiness.ts`.
- [x] Remove the runtime dependency cycle and obsolete `src/core/helpers.ts` catch-all helper.
- [x] Add focused structural and compatibility coverage, including the runtime Core import-graph assertion.
- [x] Update `.rsp/specs/core-model.md` and `.rsp/specs/cli-contracts.md` with the settled module boundary.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/helpers.test.ts test/config.test.ts test/core-dependency-structure.test.ts test/integration.test.ts` — passed 4 files / 278 tests on 2026-08-07; proves utility behavior, representative CLI paths, and the runtime graph remain compatible.
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run typecheck && mise exec -- pnpm run lint` — build, typecheck, and lint passed on 2026-08-07; proves the extracted dependency structure compiles and satisfies repository static checks.
### Optional
- Manual or environment:
  - [ ] Inspect the built bundle chunks for unexpected new eager dependencies.
- Coverage:
  - Full repository tests remain the Group integration gate.

## Blockers
- none
