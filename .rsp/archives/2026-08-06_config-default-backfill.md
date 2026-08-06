---
kind: "fix"
---

# Change: config-default-backfill

## Proposal
- Outcome: Make `rsp init` and `rsp update` materialize supported configuration defaults without overwriting project customizations.
- Why:
  - Newly added config fields currently remain absent from existing `.rsp/config.yaml` files.
  - The generated template mixes active YAML defaults with commented examples, so the effective project configuration is not self-contained.
- Scope:
  - Define one complete default config shape for generated and upgraded projects.
  - Keep the canonical Manage default at `auto + local`, while naming legacy missing-config and invalid-config policies separately.
  - Safely merge missing default fields into existing valid config files while preserving explicit values, comments, and formatting where possible.
  - Stop with a diagnostic for malformed or semantically invalid configuration instead of rewriting it.
- Non-goals:
  - Migrating or normalizing existing custom values.
  - Removing unknown fields or rewriting unrelated project files.
  - Expanding Manage, Git, publication, or external-action authority.

## Spec
### ADDED
- Requirement: generated config is self-contained
  - A new config template writes every default-bearing field as active YAML.
  - Optional `language.artifacts` and `language.commit` overrides remain visible as commented examples until configured.
- Requirement: update safely backfills missing defaults
  - `rsp update` fills only absent top-level and nested supported fields.
  - Existing explicit values and comments are retained; unsupported fields remain visible validation errors and are not rewritten.
  - Invalid YAML, invalid field shapes, invalid enum values, unsafe Decision Record paths, and unsupported fields fail without writing the config.

### Acceptance
#### Scenario: valid config with custom values
- GIVEN an existing valid config that customizes kinds, language, Manage, or Decision Record path
- WHEN `rsp update` reconciles configuration defaults
- THEN missing defaults are added and every existing custom value remains unchanged.

#### Scenario: invalid config
- GIVEN an existing config with malformed YAML or an invalid supported field
- WHEN `rsp update` runs
- THEN it reports the configuration issue and leaves the file untouched.

## Design
- Approach:
  - Rebuild files containing only recognized generated comments from the canonical template while overlaying every explicit configuration value.
  - Use YAML AST comments and document-level backfill for files with custom block or inline comments so authored comments and existing scalar/list values are preserved.
  - Name canonical config defaults, legacy missing-config compatibility, and invalid-config fail-closed policy as separate constants.
  - Reconcile defaults during `init`/`update` through one shared helper; normalization never overwrites an explicit configuration value.
- Boundaries:
  - `src/core/config.ts` owns default shape and safe reconciliation.
  - `src/commands/init.ts` and `src/commands/update.ts` own when the reconciliation is persisted.
- Affected areas:
  - `src/core/config.ts`, `src/commands/init.ts`, `src/commands/update.ts`
  - `test/config.test.ts`, `test/integration.test.ts`, configuration documentation
- Constraints:
  - Preserve fail-closed validation and existing compatibility semantics.
  - Do not overwrite a config file when reconciliation would require changing an existing value.

## Tasks
- [x] Define complete defaults and shared safe config reconciliation.
- [x] Apply reconciliation from init/update without overwriting custom values.
- [x] Add focused tests for backfill, preservation, comments, and invalid-config restraint.
- [x] Align canonical Manage defaults and policy constant names with `auto + local`.
- [x] Normalize generated layouts while preserving files with custom comments.
- [x] Expose optional language overrides as commented fields while retaining `language.default` inheritance.
- [x] Run focused and full verification.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/config.test.ts test/integration.test.ts` — passed; 2 files, 214 tests prove config defaults, safe merge, init/update behavior, and regression coverage.
  - [x] `mise exec -- pnpm run build` — passed; rebuilt the CLI used by integration tests.
  - [x] `mise exec -- pnpm run typecheck && mise exec -- pnpm run lint && mise exec -- pnpm run test` — passed; 58 files, 705 tests prove the complete authored package remains valid.
  - [x] `mise exec -- pnpm run docs:check` — passed; 7 bilingual page pairs and 30 Markdown files remain synchronized.
### Optional
- Manual or environment:
  - [x] `node dist/cli.mjs update` — passed; current `.rsp/config.yaml` safely added `kinds: []` and `decisions.path` while retaining configured language and Manage values.
  - [x] `node dist/cli.mjs update` after canonical-layout reconciliation — passed; current `.rsp/config.yaml` now follows the default template order and comments.
  - [x] Second `node dist/cli.mjs update` — passed with `Already up to date`; proves reconciliation is idempotent.
  - [x] `node dist/cli.mjs status --json` — passed; current project resolves `auto + local`, while legacy missing-config compatibility remains separate in code.
  - [x] `node dist/cli.mjs check --focused && git diff --check` — passed; proves focused Change structure and changed-text hygiene.
- Coverage:
  - Verify malformed YAML and invalid semantic config remain untouched.

## Blockers
- none
