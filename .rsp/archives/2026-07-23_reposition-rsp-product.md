---
kind: "docs"
---

# Change: reposition-rsp-product

## Proposal
- Outcome: Reposition RSP as Reliable Software Practice and make the English and Chinese product documentation lead with the complete repository-native engineering workflow rather than only its file protocol.
- Why:
  - RSP 3.0 publishes a composable nine-Skill engineering workflow, while the current product name and README opening still describe only the Rules, Specs, Plans artifact model.
  - Readers should understand the product promise, workflow, and differentiators before encountering detailed file and CLI reference material.
- Scope:
  - Update the English and Chinese README product narrative and information hierarchy.
  - Align the durable product design, design philosophy, package metadata, and current 3.0 release narrative with the new interpretation.
- Non-goals:
  - Do not change the CLI, `.rsp/` artifact schema, lifecycle, Skill behavior, or generated consumer protocol.
  - Do not rewrite historical Changelog entries or turn normative Skill and fallback-protocol content into marketing copy.

## Spec
<!-- Describe what the reader should see or experience. Implementation notes belong in ## Design. -->
### MODIFIED
- Requirement: layered product identity
  - RSP expands to Reliable Software Practice in current product-facing and durable identity surfaces.
  - RSP is categorized as a repository-native engineering workflow for humans and AI agents.
  - Rules, Specs, Plans remains the named lightweight artifact foundation rather than the product expansion.
- Requirement: product-led bilingual onboarding
  - Both READMEs introduce the problem, workflow, product boundary, and quick start before detailed artifact and CLI reference material.
  - English and Chinese prose is native to each audience while preserving the same claims, canonical technical terms, commands, and boundaries.
- Requirement: truthful compatibility
  - The repositioning does not imply hidden workflow state, automatic orchestration, Git or publication authority, or changes to existing project files and commands.

### Acceptance
#### Scenario: a new reader evaluates RSP
- GIVEN the updated documentation
- WHEN a reader reviews either README from the top
- THEN they can identify the product promise, repository-native workflow, nine composable capabilities, lightweight artifact foundation, and first runnable commands without mistaking RSP for only a file protocol

#### Scenario: an existing user encounters the new interpretation
- GIVEN a project already using Rules, Specs, Plans under `.rsp/`
- WHEN the user upgrades or reads the repositioned documentation
- THEN the existing artifact model and commands remain valid and the old phrase is clearly retained as the foundation rather than presented as a breaking rename

## Design
- Approach:
  - Use a three-layer narrative: Reliable Software Practice as the product promise, repository-native engineering workflow as the category, and Rules, Specs, Plans as the artifact foundation.
  - Reorder README onboarding around value, workflow, boundaries, quick start, then detailed concepts and reference.
- Boundaries:
  - Product-facing prose may change; canonical WorkRefs, artifact headings, commands, file ownership, and normative operating behavior remain unchanged.
  - Durable current identity belongs in `.rsp/specs/design.md`; explanatory rationale belongs in `docs/design-philosophy.md`.
- Affected areas:
  - `README.md` and `README.zh-CN.md`
  - `.rsp/specs/design.md` and `docs/design-philosophy.md`
  - `package.json`, `src/cli.ts`, and `docs/releases/3.0.0.md`
  - Retained native-composition evidence required by the changed published CLI artifact identity
  - `scripts/native-design-composition-eval.mjs`, its focused test, and the newly retained real-run evidence identity
- Constraints:
  - Keep the English and Chinese claims semantically aligned without forcing sentence-by-sentence translation.
  - Preserve historical Changelog wording and keep agent-distributed normative surfaces in English.
  - Avoid claiming managed orchestration, delivery authority, or a heavyweight platform.

## Tasks
- [x] Reframe and reorganize both README openings around the new layered product identity and workflow.
- [x] Align durable design, explanatory philosophy, package metadata, and the current release narrative.
- [x] Requalify the changed published CLI artifact through the retained exact-package native-composition gate.
- [x] Verify bilingual claims, legacy-name usage, RSP structure, and project documentation/build gates.

## Verify
- Automated:
  - [x] `node dist/cli.mjs check --focused` — passed for both focused Changes; proves: the shaped and implemented Change remains structurally valid.
  - [x] `node scripts/native-design-composition-eval.mjs --run-real` — passed all four phases and retained gates under `device-discovery-boundary-reposition-rsp-product`; proves: the renamed published CLI artifact still passes the retained real-host composition contract.
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run lint && mise exec -- pnpm run test` — passed build and lint with 30 test files and 352 tests passing; proves: documentation and package metadata changes preserve required project gates.
  - [x] `rg -n "Rules, Specs, Plans|Rules、Specs、Plans|Reliable Software Practice|repository-native|仓库原生" README.md README.zh-CN.md package.json src/cli.ts docs .rsp/specs/design.md` — current identity appears in product surfaces and the legacy phrase remains only as the artifact foundation or historical Changelog context.
- Manual or environment:
  - [x] Compared both README openings and section order; product claims, workflow, runnable commands, artifact foundation, and authority boundaries are equivalent while the prose remains native to each language.
- Durable review:
  - [x] Updated current product identity and artifact-foundation facts in `.rsp/specs/design.md`.
  - [x] Recorded the lasting naming alternatives, rationale, and consequences in `.rsp/specs/decisions/reliable-software-practice-identity.md`.
- Coverage:
  - External brand, trademark, and search-position validation is not included; this Change owns repository product language only.

## Blockers
- none
