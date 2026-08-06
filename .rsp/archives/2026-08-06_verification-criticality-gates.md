---
kind: "feature"
---

# Change: verification-criticality-gates

## Proposal
- Outcome: Separate mandatory verification from optional coverage so RSP can tighten completion gates without making additional confidence checks obstruct normal delivery.
- Why:
  - Treating every incomplete Verify item as a warning allows acceptance-critical risks to pass through archive, Manage closeout, and terminal commit.
  - Treating every incomplete verification item as blocking would make additional environment matrices and confidence coverage obstruct otherwise complete work.
- Scope:
  - Add Required and Optional levels under a Change's Verify section, with a fail-closed default for legacy formats.
  - Make readiness, archive, Manage closeout, and terminal commit distinguish completion gates from optional coverage warnings.
  - Add regression coverage proving incomplete Required verification cannot pass archive or terminal commit boundaries.
- Non-goals:
  - Do not change the business acceptance content of product Changes.
  - Do not introduce a general verification DSL, external service state machine, or new persisted lifecycle.
  - Do not rewrite historical archives.

## Spec
### ADDED
- Requirement: Required and Optional verification are distinct.
  - A Change may contain `### Required` and `### Optional` subsections under `## Verify`.
  - Required evidence proves an Acceptance Scenario, a changed material risk, or a project-mandated boundary.
  - Optional evidence extends environment, compatibility, scale, or confidence coverage without being necessary to claim the Change outcome.
  - Tasks remain required; Optional applies only to verification coverage.
- Requirement: Readiness separates completion from coverage.
  - Any incomplete or failed Required verification, incomplete Task, or active blocker produces a blocked completion gate and `archiveReady: no`.
  - Incomplete Optional verification produces warnings but does not block an otherwise complete Change.
  - Unclassified Verify items in an existing or legacy open Change default to Required.
  - `judgment` is reserved for ambiguous or structurally invalid classification, not ordinary Optional omissions.
- Requirement: Lifecycle and Git boundaries consume the same gate.
  - `rsp archive` must fail closed and leave the Change unmoved when the completion gate is blocked.
  - Manage lifecycle closeout must require a fresh machine-readable completion pass.
  - Terminal `rsp-commit` must reject an archived terminal owner with incomplete Required verification; checkpoint commits remain separately classified.
- Requirement: Classification changes remain explicit.
  - An agent may not downgrade an incomplete Required item to Optional for closeout convenience.
  - Moving an item between levels changes the acceptance boundary and requires an explicit Change update followed by fresh readiness and review evidence.
- Requirement: Status exposes the useful distinction.
  - Readiness output reports required verification completion, optional coverage warnings, blockers, and archive eligibility separately.
  - Optional warnings must not make a complete Change appear incomplete in ordinary progress summaries.

### Acceptance
#### Scenario: Required verification blocks archive
- GIVEN a Change has one incomplete Required Verify item and no Optional items
- WHEN `rsp ready` and `rsp archive` inspect the Change
- THEN readiness reports a blocked completion gate and archive leaves the Change open with a non-zero result

#### Scenario: Optional coverage warns without blocking
- GIVEN all Tasks and Required Verify items pass while one Optional Verify item remains incomplete
- WHEN the Change is inspected and archived
- THEN readiness reports completion as passed with an Optional warning and archive succeeds

#### Scenario: Legacy Verify defaults to required
- GIVEN an existing open Change has Verify checkboxes without Required/Optional classification
- WHEN readiness is derived
- THEN every unclassified Verify item is treated as Required and cannot bypass the completion gate

#### Scenario: Terminal commit has a second defense
- GIVEN an archived terminal Change still contains an incomplete Required Verify item
- WHEN `rsp-commit` audits the owner envelope
- THEN it stops before staging and reports the verification boundary as incomplete

#### Scenario: Explicit reclassification is visible
- GIVEN an owner decides that a previously Required environment check is outside the current outcome
- WHEN the Change moves that item to Optional and updates its acceptance boundary
- THEN fresh readiness and review evidence are required before archive

## Design
- Approach:
  - Parse `### Required` and `### Optional` as the smallest structural vocabulary under Verify.
  - Treat legacy unclassified Verify items as Required for backward-compatible safety.
  - Return separate completion-gate and optional-coverage fields while retaining concise human output.
  - Keep archive as a deterministic lifecycle operation only after the machine completion gate passes.
- Boundaries:
  - `src/core/helpers.ts` owns classification and readiness derivation.
  - `src/commands/ready.ts`, `src/commands/archive.ts`, status projections, and related types expose the same result.
  - RSP and Manage Skills own lifecycle routing language; `rsp-commit` owns terminal commit envelope validation.
  - Tests own observable CLI output, exit behavior, and no-mutation guarantees.
- Affected areas:
  - `src/core/helpers.ts`, `src/commands/ready.ts`, `src/commands/archive.ts`, `src/types.ts`, status models.
  - `skills/rsp/SKILL.md`, `skills/rsp-manage/**`, `skills/rsp-commit/SKILL.md`, fallback rules and relevant contract tests.
  - `test/integration.test.ts`, readiness/status/skill contract tests.
- Constraints:
  - Preserve existing open/archive identities and unrelated dirty work.
  - Do not rewrite historical archives.
  - Do not add an override flag in this Change; acceptance reclassification is the explicit escape hatch.
  - Keep Optional warnings visible but non-blocking.

## Tasks
- [x] Add Required/Optional Verify parsing and legacy-safe classification.
- [x] Separate required completion gate from Optional coverage warnings in readiness and status output.
- [x] Make archive fail closed for incomplete Required verification, Tasks, or blockers.
- [x] Align rsp, rsp-manage, and rsp-commit contracts with the shared completion gate.
- [x] Add focused regression tests for archive no-mutation, Optional warning success, legacy fallback, status output, and terminal commit defense.
- [x] Run build, typecheck, lint, focused tests, full tests, and `rsp check --focused`.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/helpers.test.ts test/integration.test.ts test/status/status-boundary.test.ts test/status/plain-dense.test.ts test/tui/dashboard-component.test.ts test/tui/tui-core.test.ts test/skill-contract.test.ts test/managed-controller-contract.test.ts --reporter=dot` — 8 files and 342 tests passed; proves Required blocks lifecycle and terminal delivery while Optional coverage does not.
  - [x] `mise exec -- pnpm run lint`, `mise exec -- pnpm run typecheck`, and `mise exec -- pnpm run build` — passed; proves source, test, and public CLI types remain coherent.
  - [x] `mise exec -- pnpm run test` — 58 files and 699 tests passed after refreshing the current managed-controller product-composition lock; proves the full repository remains green.
  - [x] `mise exec -- pnpm run docs:check`, `mise exec -- pnpm run docs:build`, `node dist/cli.mjs check --focused --json`, and `git diff --check` — passed; proves bilingual docs, generated site, focused Change structure, and patch whitespace are valid.
- Manual or environment:
  - [x] Disposable CLI fixtures exercised incomplete Required, incomplete Optional, legacy unclassified, duplicate archive, and Unicode normalization collision paths — proves blocked work stays open, Optional warnings permit archive, legacy remains fail-closed, and precise archive errors remain visible.

### Optional
- None currently.

- Coverage:
  - Legacy unclassified Change parsing, Required/Optional classification, readiness JSON/human projections, archive exit/mutation boundary, and terminal commit contract.

## Blockers
- none
