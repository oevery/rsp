---
kind: "refactor"
---

# Change: workspace-control-ownership

## Proposal
- Outcome: RSP gives Core sole ownership of workspace-isolation selection while treating `rsp-workspace` as execution infrastructure that is loaded only after isolation is selected.
- Why:
  - The current Skill System says Workspace is Core-selected, while other surfaces also allow qualified Manage to select it.
  - Workspace reuses another owner's control and result contracts and hosts existing Disciplines, so classifying it as a Discipline obscures its infrastructure role.
- Scope:
  - Align Core, Manage, Workspace, the Skill System Spec, generated fallback rules, and focused contract tests.
  - Keep Workspace conditionally loaded so ordinary direct work pays no Workspace Skill context cost.
- Non-goals:
  - Do not change workspace CLI behavior, records, Git mechanics, default installation, or Manage qualification.
  - Do not merge Workspace with Manage, Commit, Land, or any product Discipline.

## Spec
### MODIFIED
- Requirement: Single workspace-isolation selector
  - Core alone selects whether an explicit ready WorkRef requires workspace isolation before product mutation.
  - Core keeps only the selection invariant and trigger conditions eager; it loads `rsp-workspace` only after isolation is selected.
  - Manage consumes Core's selected isolation boundary and allocates or reuses one workspace session per executable WorkRef without reselecting isolation.
  - Newly discovered evidence that invalidates the isolation choice returns to Core for fresh route derivation.
- Requirement: Infrastructure runtime role
  - The runtime-role model includes Infrastructure alongside Core, Shape, Discipline, Controller, and Discovery.
  - `rsp-workspace` is classified as Infrastructure because it supplies an execution environment while existing Disciplines retain project-semantic actions and results.
  - Distribution kind and invocation mode remain orthogonal and unchanged as machine contracts.

### Acceptance
#### Scenario: Ordinary direct work does not load Workspace
- GIVEN one ready local Change with no parallel work, unrelated dirty paths, independent runtime boundary, or explicit isolation request
- WHEN Core derives the route
- THEN Workspace is not selected or loaded and the ordinary direct or managed route continues

#### Scenario: Managed execution consumes Core selection
- GIVEN Core selected isolation for a qualified managed WorkRef
- WHEN Manage prepares its executable lanes
- THEN Manage requests and reuses the required Workspace sessions without independently selecting isolation

#### Scenario: Workspace has an infrastructure role
- GIVEN the published Skill classification
- WHEN Workspace is described or routed
- THEN it is Infrastructure rather than Discipline and still defines no parallel control or result contract

## Design
- Approach:
  - Preserve the existing four Core selection signals and state explicitly that evaluating them does not load the Workspace Skill.
  - Replace every Core-or-Manage selection statement with Core-only selection and Manage allocation language.
  - Extend the documented semantic runtime-role vocabulary with Infrastructure without adding a manifest or JSON field.
- Boundaries:
  - Core owns isolation selection and rederivation.
  - Manage owns per-WorkRef session allocation only after selection.
  - Workspace owns preparation, inspection, operation support, activity recovery, and disposal.
  - Existing Disciplines own diagnosis, implementation, verification, review, and commit behavior.
- Affected areas:
  - Authored Skills and generated fallback rules.
  - Skill System Spec and focused Skill contract tests.
  - Public bilingual Skill guidance and current managed-controller product-composition lock.
- Constraints:
  - Keep `rsp-workspace` in the default distribution suite.
  - Preserve direct explicit isolation requests by routing their selection through Core.
  - Do not introduce persisted workspace-selection state or a new runtime manifest field.

## Tasks
- [x] Align Core, Manage, and Workspace ownership and conditional-loading language.
- [x] Classify Workspace as Infrastructure in the Skill System.
- [x] Add focused cross-surface contract assertions for selector and role consistency.
- [x] Rebuild the CLI and synchronize `.rsp/rsp-rules.md`.
- [x] Run full project verification.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skill-contract.test.ts test/rsp-workspace-skill-contract.test.ts` — 2 files, 12 tests passed; proves: published Skill ownership, conditional loading, and Infrastructure classification remain aligned
  - [x] `mise exec -- pnpm run build && node dist/cli.mjs update` — build passed and the self-hosted fallback is synchronized
  - [x] `mise exec -- pnpm run lint && mise exec -- pnpm run typecheck` — static and TypeScript checks passed
  - [x] `mise exec -- pnpm run test` — 58 files and 695 tests passed after updating contract expectations and the current product-composition lock; retained historical evidence was unchanged
  - [x] `mise exec -- pnpm run docs:check && mise exec -- pnpm run docs:build` — 7 bilingual page pairs and 30 Markdown files passed; the VitePress site built successfully
  - [x] `node dist/cli.mjs check --focused && git diff --check` — focused Change valid; final tracked diff has no whitespace errors
  - [x] `mise exec -- pnpm exec eslint test/skill-contract.test.ts test/rsp-workspace-skill-contract.test.ts` — focused test sources pass static lint
  - [x] Fixed-scope re-review of `HEAD` against the complete Change boundary — Code `clean`, Document `clean`; the original conditional-handoff and stale-evidence findings are resolved with no new findings
- Manual or environment:
  - [x] Inspected the final Core → Manage → Workspace wording: Core is the sole selector, Manage is the post-selection allocation/reuse owner, and Workspace remains execution infrastructure.
- Coverage:
  - Skill routing, fallback, public documentation, and contract composition are covered; no workspace CLI runtime behavior changes.

## Blockers
- none
