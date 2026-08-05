---
kind: "fix"
---

# Change: ascii-workref-default

## Proposal
- Outcome: Make ASCII lowercase kebab-case the default inferred WorkRef convention while preserving explicit Unicode identities.
- Why:
  - RSP currently separates WorkRefs from artifact-language configuration and permits safe Unicode identities, but it does not state which identity form Shape or the fallback should infer when neither the user nor the project supplies a naming convention.
  - Multilingual collaboration can therefore produce inconsistent English and localized WorkRefs even though stable machine identity and localized human-readable outcomes are separate concerns.
- Scope:
  - Define one naming precedence for newly inferred WorkRefs across Core, Shape, the fallback protocol, durable Specs, and public concepts/configuration documentation.
  - Keep explicit user-supplied identities and explicit project/domain naming conventions authoritative, including valid Unicode WorkRefs.
  - Keep the full inference algorithm with Shape and the independent fallback while Core retains only the global identity boundary and routes new-name inference to Shape.
  - Add contract coverage proving artifact-language configuration never selects WorkRef language and the unresolved default is ASCII lowercase kebab-case.
- Non-goals:
  - Rename, migrate, translate, or otherwise rewrite any existing open or archived WorkRef.
  - Restrict the existing safe Unicode identity grammar or change CLI WorkRef validation.
  - Add a WorkRef language/style configuration field, synthesize display names, or change TUI/status summary projection.

## Spec
### MODIFIED
- Requirement: WorkRef authoring uses stable identity precedence independent from prose language.
  - Preserve an explicit user-supplied valid WorkRef verbatim after canonical normalization.
  - Otherwise follow an explicit nearest project or domain WorkRef naming convention.
  - Otherwise infer an ASCII lowercase kebab-case WorkRef from stable domain or technical vocabulary.
  - Artifact, commit, response, host locale, and TUI language settings never select or translate WorkRef language.
  - Safe Unicode WorkRefs remain supported when selected explicitly or by project/domain convention.

### Acceptance
#### Scenario: Chinese artifact language without a naming convention
- GIVEN a new project configures `language.default: zh-CN`
- AND neither the user nor project authority supplies a WorkRef naming convention
- WHEN Shape must infer a WorkRef for accepted work
- THEN it uses ASCII lowercase kebab-case
- AND writes the authorized natural-language Change prose in Chinese

#### Scenario: Explicit Unicode identity
- GIVEN the user supplies the valid WorkRef `听说训练/模拟朗读`
- WHEN RSP creates or operates that work
- THEN it preserves the canonical Unicode identity
- AND does not translate it because another prose language is configured

#### Scenario: Project-owned Unicode convention
- GIVEN nearest project authority explicitly requires Chinese domain WorkRefs
- AND no explicit user-supplied WorkRef conflicts with that convention
- WHEN Shape must infer a new WorkRef
- THEN it follows the project convention rather than the ASCII fallback

#### Scenario: Existing identity
- GIVEN an existing open or archived ASCII or Unicode WorkRef
- WHEN language or naming guidance changes
- THEN RSP does not rename or translate that identity

## Design
- Approach:
  - Treat WorkRef naming as authoring policy, not validation or localization. Core states language independence, existing-identity stability, and Shape ownership without repeating the detailed inference algorithm.
  - Keep the full precedence in Shape and the independent fallback; record the stable identity rule in `core-model.md` and only the owner boundary in `skill-system.md`.
  - Explain the complete behavior in both public Concepts and Configuration pages.
  - Protect the executable Skill contracts with focused text assertions rather than changing the already-correct Unicode parser.
- Boundaries:
  - Core owns the separation from response/artifact/commit language policy.
  - Shape solely owns the detailed inference precedence when it must establish a new durable WorkRef.
  - Project authority or explicit user input may opt into valid Unicode identity; configuration alone may not.
- Affected areas:
  - `skills/rsp/`, `skills/rsp-shape/`, and `rules/rsp-rules.md`
  - `.rsp/specs/core-model.md`, `.rsp/specs/skill-system.md`, public EN/zh-CN documentation, and focused Skill contract tests
- Constraints:
  - Preserve safe Unicode grammar, canonical normalization, existing identities, generated fallback synchronization, and current command behavior.

## Tasks
- [x] Keep the complete WorkRef inference precedence in Shape and the independent fallback while Core retains only language independence, existing-identity stability, and routing to Shape.
- [x] Update `core-model.md`, `skill-system.md`, and bilingual public documentation to reflect the final ownership without implying a new config field.
- [x] Add focused contract tests for the Core/Shape ownership boundary, ASCII fallback, explicit/project Unicode authority, language independence, and fallback completeness.
- [x] Rebuild and synchronize the self-hosted fallback projection, then refresh the affected current product-composition lock without changing retained historical evidence.
- [x] Run focused contract, beta contract, build, typecheck, lint, full test, focused RSP check, and diff-check gates.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/rsp-core-routing-contract.test.ts test/rsp-shape-contract.test.ts test/skill-runtime-context-contract.test.ts` — 3 files and 41 tests passed; proves Core retains only language independence, identity stability, and Shape ownership while Shape, fallback, and `core-model.md` retain the detailed precedence.
  - [x] `mise exec -- pnpm run build && mise exec -- node dist/cli.mjs update`, `mise exec -- pnpm run typecheck`, and `mise exec -- pnpm run lint` — passed; the authored and self-hosted `rsp-rules.md` files are synchronized.
  - [x] `mise exec -- pnpm exec vitest run test/managed-controller-beta-contract.test.ts` — 1 file and 11 tests passed after refreshing only the beta plan's current product-composition hash to `d1e1e763de48d4d60a1851ea459173905526411f7652f1a8b20860a076e1b3e6`; retained historical evidence remained unchanged.
  - [x] `mise exec -- pnpm run test` — 55 files and 671 tests passed.
  - [x] `mise exec -- node dist/cli.mjs check --focused` — the selected Change passed focused validation.
  - [x] `git diff --check` — passed.
  - [x] Independent read-only Verify reran the 52 focused tests, build, typecheck, lint, full 671-test suite, focused RSP check, and diff-check with a distinct worker identity; the fixed-scope re-review then found Code and Document clean with the prior P2 resolved and no new findings.
- Manual or environment:
  - [x] The final `ascii-workref-default` Change delta relative to `HEAD` is limited to the selected Change, Core and Shape Skills, authored and self-hosted fallback, `core-model.md` and `skill-system.md`, bilingual Concepts and Configuration documentation, focused Skill contract tests, and the beta plan's current product-composition hash. It does not change CLI Unicode validation, rename an existing WorkRef, modify summary projection, alter retained historical evaluation evidence, or touch boats-cloud.
- Coverage:
  - Naming precedence, language-policy independence, explicit Unicode preservation, project convention override, fallback parity, and documentation consistency.

## Blockers
- none
