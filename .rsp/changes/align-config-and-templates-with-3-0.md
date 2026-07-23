---
kind: "fix"
---

# Change: align-config-and-templates-with-3-0

## Proposal
- Outcome: Project configuration fails closed through one validation contract, and newly generated RSP artifacts express the final 3.0 capability and artifact-ownership boundaries without adding lifecycle or Skill state.
- Why:
  - Configuration consumers currently normalize or ignore some invalid values that `rsp doctor` reports separately.
  - Change and bootstrap templates still mix shaping, implementation, verification, and durable-review responsibilities that the promoted Skill Suite now keeps separate.
- Scope:
  - Centralize `.rsp/config.yaml` parsing and semantic validation for all consumers and diagnostics.
  - Clarify existing `kinds` replacement semantics and `decisions.path` ownership without adding new configuration fields.
  - Align ordinary, lite, project-setup, and Group Brief templates with the six-section Change contract, evidence-based verification, and two-axis durable review.
- Non-goals:
  - Adding Skill registration, stage, status, language, host, or managed-orchestration configuration.
  - Changing the six canonical Change sections, Group lifecycle, dependency syntax, or existing valid project configuration.

## Spec
### MODIFIED
- Requirement: configuration validation is authoritative and consistent
  - Every CLI consumer that loads project configuration rejects malformed YAML, unsupported fields, invalid known-field types or values, and unsafe Decision Record paths through one shared configuration inspection result.
  - Commands with structured diagnostic output use the stable `invalid_config` code; other consumers exit non-zero and surface the same validation issue.
  - `kinds` remains an optional replacement allowlist; omission or an empty list retains built-in defaults.
  - Existing valid `kinds` and `decisions.path` configuration remains compatible.

- Requirement: generated artifacts match the 3.0 ownership model
  - Generated Change artifacts retain canonical English headings, keywords, identifiers, and machine-consumed values while allowing project-language prose.
  - Tasks contain executable outcomes rather than shaping, verification, or archive-review chores.
  - Verify records exact evidence scope plus unavailable or omitted coverage without treating durable review as implementation verification.
  - Project setup and Group durable outcomes distinguish current facts from lasting rationale.

### Acceptance
#### Scenario: invalid configuration reaches an ordinary consumer
- GIVEN `.rsp/config.yaml` contains an unsupported field or an invalid `kinds` or `decisions` value
- WHEN a CLI command loads project configuration
- THEN the command exits non-zero and surfaces the shared validation issue instead of coercing the value or silently using a default
- AND commands with structured diagnostic output use the stable `invalid_config` code
- AND `rsp doctor` reports the same underlying issue

#### Scenario: a new project or Change is scaffolded
- GIVEN RSP initializes a project or creates an ordinary, lite, project-setup, or grouped artifact
- WHEN the generated template is inspected
- THEN its canonical structure remains stable
- AND its guidance separates outcome shaping, executable Tasks, verification coverage, current-fact routing, and lasting-rationale routing

## Design
- Approach:
  - Make `src/core/config.ts` the single typed parse-and-validate seam and expose its issues to both command consumers and `doctor`.
  - Keep the existing top-level `kinds` and `decisions` shape; strengthen semantics rather than introduce a schema migration.
  - Keep one language-neutral generated template set with canonical English structure and replaceable prose placeholders.
- Boundaries:
  - Configuration parsing and semantic normalization belong to `src/core/config.ts`; Decision Record path safety remains in `src/core/decisions.ts`.
  - Template generation belongs to `src/core/helpers.ts`, `src/core/change-group.ts`, and the init configuration template.
  - Host capability discovery, Skill availability, model selection, and subagent settings remain outside `.rsp/config.yaml`.
- Affected areas:
  - `src/core/config.ts`, `src/core/decisions.ts`, `src/commands/doctor.ts`, and configuration consumers
  - `src/commands/init.ts`, `src/core/helpers.ts`, `src/core/change-group.ts`, and focused tests
- Constraints:
  - Preserve valid 2.x/3.0 configuration, canonical Change headings, delta markers, Gherkin keywords, and exact dependency syntax.
  - Do not add a second template language, a Skill manifest, persisted stage, or controller state.

## Tasks
- [x] Add focused tests for shared fail-closed configuration semantics and retained valid-config behavior.
- [x] Add focused tests for the optimized ordinary, lite, project-setup, Group Brief, and config templates.
- [x] Implement the shared configuration contract and template changes as one compatible slice.
- [x] Stabilize the existing local-Git upstream lifecycle test with a scoped timeout after repeated full-suite contention.
- [x] Run focused and full project verification, then record observed coverage truthfully.

## Verify
- Automated:
  - [x] `mise exec -- pnpm vitest run test/config.test.ts test/helpers.test.ts test/integration.test.ts test/native-design-composition.test.ts` — 217 tests passed; proves focused configuration, template, and retained-evidence behavior
  - [x] `node scripts/native-design-composition-eval.mjs --run-real` — all 15 external gates passed against the packed 3.0.0 artifact; proves the four-phase Skill composition, language boundary, and durable-fact routing remain valid
  - [x] `mise exec -- pnpm run build` — passed; proves TypeScript and package output remain buildable
  - [x] `mise exec -- pnpm run lint` — passed; proves project lint remains clean
  - [x] `mise exec -- pnpm run test` — 352 tests passed; proves the complete project suite remains compatible
  - [x] `git diff --check` — passed; proves changed text has no whitespace errors
- Manual or environment:
  - [x] Inspected generated project, ordinary, lite, project-setup, and Group Brief contracts through local CLI integration fixtures
- Coverage:
  - Cross-host natural-language filling remains outside deterministic CLI tests; canonical structure and placeholder contracts are covered locally.

## Blockers
- none
