---
kind: "feature"
---

# Change: language-commit-configuration

## Proposal
- Outcome: Keep shared project language configuration limited to durable artifact and commit prose while leaving response language under each user and session.
- Why:
  - A repository-level response language constrains every collaborator even though different people converse with AI in different languages.
  - Artifact and commit language are durable shared conventions and benefit from one stable project default.
- Scope:
  - Remove `language.response` from the supported project schema and from every status projection.
  - Make `language.default` supply both artifact and commit prose, with optional surface-specific overrides.
  - Route response language only through explicit current instruction, user/host personal instruction, and conversation language.
  - Keep CLI-generated artifact scaffolds language-neutral while preserving canonical structural tokens and verbatim user input.
  - Keep this self-host's durable artifact and commit prose in English.
- Non-goals:
  - Adding an RSP-owned user preference file, localizing CLI/TUI machine contracts, or translating existing artifacts/history.
  - Creating a commit, changing Git authority, or translating Conventional Commit types/scopes/trailers.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: Project language configuration owns only durable shared prose.
  - `language.default` supplies effective artifact and commit language.
  - Optional `language.artifacts` and `language.commit` override their respective durable surfaces.
  - `language.response` is unsupported and fails closed instead of silently constraining collaborators.
- Requirement: Response language remains user/session-owned.
  - Response priority is explicit current response language, user/host personal instructions, then conversation language.
  - Project config, artifact language, commit language, and repository history never select response language.
- Requirement: Durable language remains inspectable without granting actions.
  - Plain status shows only artifact and commit language when configured.
  - JSON status always exposes stable `language.artifacts` and `language.commit` string-or-null values and has no response-language field.
  - Language configuration grants no staging, commit, push, publication, or translation authority.
- Requirement: Deterministic CLI scaffolds do not invent natural-language artifact prose.
  - Generated Changes, Group Briefs, project setup, and Specs contain canonical structural tokens, neutral unfinished placeholders, and verbatim user-supplied summaries or goals.
  - Core and discipline Skills fill authorized artifact prose according to the effective artifact language; the CLI does not maintain a locale catalog or silently fall back to English prose.

### Acceptance
#### Scenario: collaborators converse independently under one durable project language
- GIVEN `.rsp/config.yaml` contains only `language.default: en`
- WHEN one collaborator converses in Chinese and another converses in English
- THEN both artifact and commit prose default to English while each response follows that collaborator's explicit, personal, or conversational language

#### Scenario: project response configuration fails closed
- GIVEN `.rsp/config.yaml` contains `language.response: zh-CN`
- WHEN RSP inspects project configuration
- THEN it reports the unsupported field and projects no effective durable language from the invalid mapping

#### Scenario: a non-English project creates deterministic scaffolding
- GIVEN `.rsp/config.yaml` resolves `language.artifacts` to `zh-CN`
- WHEN RSP creates a Change, Group Brief, project-setup Change, or Spec scaffold
- THEN canonical headings and machine values remain stable
- AND neutral placeholders contain no authored English guidance prose
- AND an explicitly supplied summary or goal is preserved verbatim

## Design
- Approach:
  - Narrow strict config and effective status policy to artifact and commit values only.
  - Reuse `default` for both durable surfaces and remove response from public status types and oracles.
  - Keep CLI generation deterministic and language-neutral instead of adding a bounded locale catalog beneath an arbitrary BCP 47 configuration surface.
  - Treat canonical headings, structural labels, machine values, and verbatim user input as scaffold structure; route natural-language filling to Core and discipline Skills.
  - Update Core, fallback, commit Skill, Specs, READMEs, and contract tests with the ownership split.
- Boundaries:
  - RSP project config owns repository-shared durable conventions; the host and user own conversation preference.
  - `rsp-commit` still derives message syntax, scope, authority, and delivery behavior.
- Affected areas:
  - `src/types.ts`, `src/core/config.ts`, `src/status/**`, `src/commands/init.ts`
  - `src/core/helpers.ts`, `src/core/change-group.ts`, and the `create`, `group create`, `init --with-project-setup`, and `add spec` production paths
  - `rules/rsp-rules.md`, `skills/rsp/SKILL.md`, `skills/rsp-commit/SKILL.md`
  - `.rsp/specs/**`, README language guidance, and focused config/status/Skill tests
- Constraints:
  - Invalid legacy `language.response` fails closed; it is not ignored or treated as a local preference.
  - Configuration cannot grant translation, staging, commit, push, release, or publication authority.

## Tasks
- [x] Remove response language from project config types, parsing, status, and templates.
- [x] Make the durable default resolve artifact and commit language with independent overrides.
- [x] Update Core and `rsp-commit` ownership/priority without coupling response language to repository state.
- [x] Update durable Specs, README guidance, self-host config, and focused contract tests.
- [x] Replace authored English template guidance with neutral unfinished scaffolds across every CLI-created RSP artifact.
- [x] Remove duplicated config-resolution semantics from `rsp-commit` while retaining its effective-language precedence.
- [x] Verify non-English policy, canonical-token stability, verbatim input, placeholder readiness, and complete repository compatibility.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/helpers.test.ts test/integration.test.ts test/rsp-commit-skill-contract.test.ts --reporter=dot` — 3 files / 231 tests passed; proves: neutral generation, kind delta markers, canonical tokens, verbatim input, placeholder readiness, and Commit Skill ownership
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm run test` — build and lint passed; 51 files / 587 tests passed, proving complete repository compatibility
- Manual or environment:
  - [x] Inspect built compact JSON status and representative generated Change, Group, project-setup, and Spec scaffolds — observed `artifacts: en`, `commit: en`, no response field, canonical structure, neutral `<…>` placeholders, and verbatim Chinese summary/goal fixtures
- Coverage:
  - Actual multilingual conversations remain host/user behavior; contracts verify that project configuration cannot select response language.
  - Natural-language generation remains Skill/host behavior; CLI tests prove that deterministic scaffolds do not inject conflicting prose.
  - Durable facts were updated in existing Core, CLI, and Skill Specs; no Decision Record is needed for this ownership correction.

## Blockers
- none
