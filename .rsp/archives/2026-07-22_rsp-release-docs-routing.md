---
kind: "fix"
---

# Change: rsp-release-docs-routing

## Proposal
- Summary: Rename the release-documentation Skill to `rsp-release-docs` and route eligible release Changes to it from Core.
- Why:
  - The capability is published but the Core stage router does not currently select it, and its existing name is inconsistent with the RSP suite and narrower than its changelog, release-note, and migration scope.
- Scope:
  - Rename the canonical Skill directory, metadata, documentation, inventory, and contracts from `prepare-release-notes` to `rsp-release-docs`, and omit unconsumed host-specific UI metadata from the portable package.
  - Add a Core route that selects the capability only when a selected Change explicitly owns a confirmed release identity or range and still has release-documentation work.
- Non-goals:
  - Automatically running release documentation for ordinary completed Changes.
  - Granting commit, tag, push, publication, deployment, or approval authority.

## Spec
### MODIFIED
- Requirement: RSP exposes one consistently named release-documentation capability and can select it as a bounded release-stage next action.
  - The published Skill is named `rsp-release-docs` and continues to cover changelogs, release notes, and migration notes.
  - Core selects it only from explicit release ownership plus confirmed release identity/range and unfinished release-documentation work; lifecycle stage alone is insufficient.
  - Routing names one next action and does not recursively invoke the Skill or infer external-action authority.

### Acceptance
#### Scenario: change is complete
- GIVEN a selected Change explicitly owns a confirmed release identity or range and has unfinished release-documentation work
- WHEN Core derives the next action and `rsp-release-docs` is available
- THEN Core selects `rsp-release-docs` as the one next capability and returns its result to that Change
- AND an ordinary completed Change without explicit release ownership proceeds to durable review without selecting release documentation

## Design
- Approach:
  - Rename the authored Skill and update every canonical inventory and reference.
  - Insert a release-documentation gate after implementation/verification readiness and before Core durable review.
  - Contract-test positive routing, negative routing, canonical naming, package discovery, and external-action boundaries.
- Affected areas:
  - `skills/rsp-release-docs/`, `skills/rsp/`, package inventory scripts, documentation, Specs, and Skill contract tests.
- Constraints:
  - Preserve existing dirty work and the Skill's evidence-led behavior; do not widen it into release execution.

## Tasks
- [x] Rename the Skill, remove the unconsumed host-specific UI projection, and synchronize published inventories, documentation, and stable Specs.
- [x] Add the bounded release-documentation branch to Core routing and its fallback protocol.
- [x] Add focused contracts for positive and negative routing and the renamed Skill.
- [x] Run focused and full project verification.

## Verify
- Automated:
  - [x] RED: `mise exec -- pnpm exec vitest run test/rsp-core-routing-contract.test.ts test/rsp-release-docs-skill-contract.test.ts` — failed because `skills/rsp-release-docs/SKILL.md` and the Core release-documentation route did not exist.
  - [x] GREEN: `mise exec -- pnpm exec vitest run test/rsp-core-routing-contract.test.ts test/rsp-release-docs-skill-contract.test.ts` — 2 files, 10 tests passed.
  - [x] `mise exec -- pnpm exec vitest run test/rsp-core-routing-contract.test.ts test/rsp-release-docs-skill-contract.test.ts test/skill-contract.test.ts test/clean-install-check.test.ts test/daily-workflow-product-surface.test.ts test/project-skill-dogfood.test.ts test/helpers.test.ts` — 7 files, 72 tests passed.
  - [x] `uv run --with pyyaml python /Users/oevery/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/rsp-release-docs` — Skill is valid.
  - [x] `mise exec -- pnpm exec vitest run test/rsp-release-docs-skill-contract.test.ts test/skill-contract.test.ts test/clean-install-check.test.ts test/daily-workflow-product-surface.test.ts test/project-skill-dogfood.test.ts` — 5 files, 17 tests passed after removing `agents/openai.yaml`.
  - [x] `mise exec -- pnpm run build` — passed; `dist/cli.mjs` built successfully.
  - [x] `node dist/cli.mjs update` — synchronized `.rsp/rsp-rules.md` and generated indexes.
  - [x] `node scripts/native-design-composition-eval.mjs` — passed all retained integrity, exact-package, runtime-isolation, phase-boundary, output, and durable-artifact gates; recommendation `resume-release-preparation`.
  - [x] `mise exec -- pnpm run lint` — passed.
  - [x] `mise exec -- pnpm run test` — final standalone run passed 30 files and 345 tests. Earlier runs exposed unrelated transient `dist/cli.mjs` rebuild and 5-second Git-fixture timeout races; affected files passed in isolation before the final full pass.
  - [x] `git diff --check` — passed.
- Manual:
  - [x] Inspected the Core gate: explicit confirmed release identity/range and owned unfinished documentation are both required; lifecycle stage, completed implementation, or archive readiness alone continues to durable review.
- Durable updates:
  - [x] Decided that the canonical Skill name and bounded Core routing are stable product facts.
  - [x] Updated `.rsp/specs/design.md`; no Decision Record or additional scoped instruction is needed.

## Blockers
- none
