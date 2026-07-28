---
kind: "feature"
---

# Change: project-language-and-unicode-workrefs/language-configuration

## Proposal
- Outcome: Let an RSP project declare one default natural language with independent response and new-artifact overrides, and expose the effective values without repeating language metadata in every Change.
- Why:
  - The current Core hierarchy can drift across Skill and fallback surfaces and may require inspecting existing artifacts to choose a new Change language.
  - Projects commonly need one Chinese default while retaining the option for Chinese responses with English artifacts.
- Scope:
  - Add strict `language.default`, `language.response`, and `language.artifacts` BCP 47-style configuration with deterministic fallback.
  - Project effective response and artifact languages through status JSON/plain output and the generated configuration template.
  - Update Core, fallback, Specs, and Skill contracts so explicit current requests remain highest priority and existing artifact prose is preserved.
  - Keep per-artifact `language` absent by default; an existing explicit override remains an exception only if later supported by its owning artifact contract.
- Non-goals:
  - Translating CLI diagnostics, TUI chrome, existing Changes, archives, Specs, or internal Markdown section headings.
  - Inferring language by scanning archive history, adding a translation service/catalog, or rewriting arbitrary project instructions.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: Project language configuration resolves response and new-artifact defaults independently.
  - `language.default` supplies both effective values unless `language.response` or `language.artifacts` overrides that surface.
  - Omitted language configuration leaves both effective values unset so Core falls back to scoped instructions and conversation language.
  - Unknown language fields, wrong shapes, empty values, and malformed tags fail closed through the shared configuration inspector.
- Requirement: Language ownership does not duplicate project policy into every artifact.
  - Generated Change frontmatter does not add a language field solely because the project has a configured default.
  - Existing artifact prose remains in its current language unless the user explicitly authorizes translation; changing configuration never mass-rewrites durable content.
  - Explicit current response or artifact language takes precedence over configured defaults.
- Requirement: Effective language policy is inspectable without localizing machine contracts.
  - Plain status names the resolved response and artifact defaults when configured.
  - JSON status exposes stable `language.response` and `language.artifacts` string-or-null values; compact JSON is equivalent.

### Acceptance
#### Scenario: one project default applies to both natural-language surfaces
- GIVEN `.rsp/config.yaml` contains only `language.default: zh-CN`
- WHEN status and a new RSP planning operation resolve language
- THEN effective response and artifact defaults are both `zh-CN`, no archive scan is required, and generated Change frontmatter has no repeated language field

#### Scenario: project keeps Chinese responses and English artifacts
- GIVEN `language.default: zh-CN` and `language.artifacts: en`
- WHEN Core responds and creates an authorized artifact
- THEN response prose defaults to Chinese, new artifact prose defaults to English, and machine values remain unchanged

## Design
- Approach:
  - Extend strict config types and inspection with one `language` mapping and a resolver returning nullable effective response/artifact values.
  - Treat language tags as trimmed, non-empty, structurally valid BCP 47-style values while preserving their configured spelling or one documented canonical form consistently.
  - Add the resolved projection to status and use one concise normative language algorithm in Core/fallback with parity tests across authored and bundled surfaces.
- Boundaries:
  - CLI config owns durable project defaults and deterministic projections; user intent and nearest project authority still own per-operation overrides.
  - Artifact generators consume effective defaults only for prose generation behavior; artifact files do not become a second policy store.
- Affected areas:
  - `src/types.ts`, `src/core/config.ts`, `src/status/**`, `src/commands/init.ts`
  - `rules/rsp-rules.md`, `skills/rsp/**`, relevant discipline Skills and behavior contracts
  - `.rsp/specs/core-model.md`, `.rsp/specs/cli-contracts.md`, `.rsp/specs/skill-system.md`
  - Focused config/status/template/Skill tests
- Constraints:
  - Missing configuration remains backward compatible; invalid configuration stays visible and fail-closed.
  - Response and artifact language remain independent and explicit user language remains highest priority.
  - Do not introduce per-Change language metadata as routine generated state.

## Tasks
- [x] Add and validate the `language` config mapping plus deterministic effective-language resolution.
- [x] Expose effective response/artifact language in plain, pretty JSON, and compact JSON status.
- [x] Update init/config templates and tests without adding per-Change language fields.
- [x] Reconcile Core, fallback, Skills, and durable Specs with the final precedence and existing-artifact preservation behavior.
- [x] Add focused compatibility and fail-closed tests for missing, valid, overridden, and invalid language configuration.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/config.test.ts test/status/status-boundary.test.ts test/status/plain-dense.test.ts` — 26 tests passed; proves: missing, valid, overridden, malformed, and fail-closed config behavior plus plain/JSON status and template projection
  - [x] `mise exec -- pnpm exec vitest run test/artifact-continuation-contract.test.ts test/helpers.test.ts test/rsp-release-docs-skill-contract.test.ts test/integration.test.ts` — passed; proves: generated CLI behavior and authored/bundled normative surfaces agree after shared-surface reconciliation
  - [x] `mise exec -- pnpm run build` — proves: public types and CLI production surfaces remain valid
  - [x] `mise exec -- pnpm run lint` — passed after shared integration; proves: the complete implementation satisfies repository lint contracts
  - [x] `mise exec -- pnpm run test` — 593 tests passed; proves: the final integrated tree preserves the complete repository behavior suite
  - [x] `git diff --check` — proves: changed files contain no whitespace errors
- Manual or environment:
  - [x] Run built `rsp status` in a temporary initialized project with no language block, one `zh-CN` default, and an English artifact override — observed `null/null`, `zh-CN/zh-CN`, and `zh-CN/en` respectively in compact JSON, with matching plain output
- Coverage:
  - Translation quality and host-wide conversation settings remain outside RSP; the config controls only RSP natural-language defaults.
  - Durable current facts were written to `.rsp/specs/core-model.md`, `.rsp/specs/cli-contracts.md`, and `.rsp/specs/skill-system.md`; no Decision Record is needed because the accepted configuration and fallback model is directly captured as current behavior.

## Blockers
- none
