---
kind: "fix"
---

# Change: enforce-change-closeout-structure

## Proposal
- Outcome: Make ordinary Change closeout fail closed whenever the Change document is structurally invalid.
- Why:
  - `rsp check` and the shared `ready`/`archive` readiness path currently inspect different document invariants, so a malformed Change can appear archive-ready.
- Scope:
  - Share one per-Change document validation seam across `check`, `ready`, and `archive`.
  - Block readiness and archival for invalid frontmatter, kind, title identity, or canonical section cardinality.
  - Add focused regression coverage for read-only readiness and lifecycle mutation behavior.
- Non-goals:
  - Changing archive authorization, durable review semantics, dependency blockers, or optional verification policy.
  - Adding runtime, Broker, SQLite, Web Observatory, provider, seal, or publication behavior.

## Spec
### MODIFIED
- Requirement: Ordinary Change closeout must consume the same strict document-validity result as `rsp check`.
  - A Change document must have parseable frontmatter, one configured valid `kind`, one matching `# Change:` title, and exactly one canonical occurrence of every required Change section.
  - Structural diagnostics remain visible through `rsp check`; readiness warnings explain why the completion gate is blocked.
  - `rsp ready` remains read-only and reports `completionGate: blocked` plus `archiveReady: no` for structurally invalid documents.
  - `rsp archive` must return a blocked result and leave the Change and focus marker untouched when document validity fails.

### Acceptance
#### Scenario: Invalid Change structure cannot pass closeout
- GIVEN an ordinary Change with missing or duplicate canonical sections, or invalid frontmatter, kind, or title identity
- WHEN the operator runs `rsp check`, `rsp ready`, or `rsp archive`
- THEN `check` reports the shared structural error, `ready` reports a blocked completion gate, and `archive` does not move the Change

#### Scenario: A valid completed Change retains existing readiness behavior
- GIVEN a structurally valid Change with completed Tasks and Required Verify items and no active blockers
- WHEN the operator runs `rsp ready`
- THEN the completion gate passes and archive readiness remains `yes`

## Design
- Approach:
  - Extract a pure per-Change document inspection result that owns frontmatter, configured kind, title identity, and canonical section cardinality diagnostics.
  - Reuse that result from `rsp check` and feed its errors into the existing readiness warning and archive gate.
- Boundaries:
  - Keep worktree, focus, dependency, scenario, placeholder, and config diagnostics in their current command owners.
  - Preserve existing public readiness fields; structural failures project through warnings, `completionGate`, and `archiveReady`.
- Affected areas:
  - `src/core/` Change document inspection and readiness.
  - `src/commands/check.ts`, `src/commands/ready.ts`, and `src/commands/archive.ts`.
  - Focused unit and integration tests.
- Constraints:
  - Valid custom kinds from `.rsp/config.yaml` remain authoritative.
  - No archive mutation may occur after a structural validation failure.

## Tasks
- [x] Add one shared strict Change document inspection seam.
- [x] Make `check`, `ready`, and `archive` consume the shared structural result.
- [x] Add regression tests for invalid structure and preserve valid closeout behavior.
- [x] Record the stable shared closeout-validation contract in `.rsp/specs/cli-contracts.md`.
- [x] Run focused tests and the repository-required validation gates.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/change-document-inspection.test.ts test/integration.test.ts` — passed: 2 files and 195 tests cover shared inspection, blocked readiness, non-mutating archive behavior, and the existing integration surface.
  - [x] `mise exec -- pnpm run build` — passed: authored TypeScript compiled and bundled CLI assets built.
  - [x] `mise exec -- pnpm run lint` — passed: repository static rules reported no errors.
  - [x] `mise exec -- pnpm run test` — passed: 74 files and 800 tests.
### Optional
- Manual or environment:
  - [-] none
- Coverage:
  - No browser, provider, Broker, SQLite, or external service coverage is required for this repository-native CLI boundary.

## Blockers
- none
