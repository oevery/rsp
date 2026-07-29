---
kind: "refactor"
---

# Change: compact-skill-runtime-context

## Proposal
- Outcome: Reduce RSP Skill runtime context through single ownership, conditional loading, and restrained symbol notation without behavior loss
- Why:
  - Core still eagerly repeats branch detail already owned by managed routing or a selected Discipline, so ordinary paths pay context for inactive release, recovery, and managed procedures.
  - Safe local decision flows can be shorter and easier to scan, but notation must not become a glossary, private DSL, or substitute for authority and stop semantics.
- Scope:
  - Audit the authored runtime Skills under `skills/` and assign each repeated normative rule one semantic owner.
  - Keep Core's selection, routing, ownership, safety, fallback, and output contracts eager; conditionally load inactive branch procedures from direct references or selected Disciplines.
  - Use only self-explanatory Markdown structure, numbering, `:`, and `→` where an equivalent local decision flow remains complete without a glossary.
  - Update focused Skill contracts, behavior fixtures, and the Skill System Spec when the stable composition contract needs clarification.
- Non-goals:
  - No new glossary Skill, shared runtime overlay, recursive Skill invocation, hidden state, generated projection edit, or project dependency.
  - No change to RSP product behavior, lifecycle, authority, Git, publication, language, canonical values, or independent Skill invocation.
  - No mechanical rewrite of prose whose qualifiers, exceptions, rationale, or safety meaning would become less explicit.

## Spec
### MODIFIED
- Requirement: Runtime Skill composition minimizes ordinary-path context without weakening standalone capability contracts.
  - Every normative rule has one detailed semantic owner. Core may repeat only the smallest routing or fail-safe invariant needed before a conditional reference or selected Discipline is available.
  - Core keeps selection, routing, ownership, safety, manual fallback, and output contracts eager. Release, managed, reopen/recovery, and other branch-specific procedures load only when their branch is active.
  - A Discipline remains independently invocable and retains its own trigger, inputs, authority, action, output, stop, and verification semantics.
- Requirement: Lightweight notation is optional and local.
  - Only self-explanatory Markdown structure, numbered precedence, `:`, and `→` may replace equivalent workflow prose without a glossary.
  - Notation never abbreviates authority sources, exceptions, negative constraints, irreversible operations, canonical values, or completion claims.
  - A notation rewrite is accepted only when fixed behavior cases remain equivalent and the actual loaded-path token cost does not increase.

### Acceptance
#### Scenario: Ordinary implementation route
- GIVEN a selected ready Change with clear behavior, ownership, authority, and verification
- WHEN Core derives the next action
- THEN it selects ordinary implementation without loading unrelated managed, release, or reopen procedure detail
- AND the loaded Core plus Implement token count is lower than the recorded baseline

#### Scenario: Conditional branch route
- GIVEN a managed continuation, release operation, or incomplete archived acceptance
- WHEN its branch becomes active
- THEN Core preserves the decisive guard and loads or selects the single detailed procedure owner
- AND the resulting route, stop conditions, and authority boundary match the current contract

#### Scenario: Standalone Discipline
- GIVEN a Discipline is invoked without relying on another Skill body
- WHEN authority is missing, evidence changes route, verification fails, or work completes
- THEN the Discipline returns the same safe stop, owner, evidence, and completion semantics as the current version

#### Scenario: Lightweight decision flow
- GIVEN a prose block is replaced with numbering or `→`
- WHEN fixed normal, ambiguity, missing-authority, and failure cases are evaluated
- THEN route and mutation decisions remain equivalent without a notation glossary
- AND the rewritten block uses fewer tokens under the recorded tokenizer

## Design
- Approach:
  - Record current per-file and representative loaded-path token counts before prompt mutation.
  - First move or delete duplicated branch detail while retaining the smallest eager guard and direct conditional-loading instruction.
  - Then compact only remaining closed local decision flows with self-explanatory notation.
  - Evaluate `current`, `structural`, and `structural + notation` separately so regressions and marginal cost remain attributable.
- Boundaries:
  - Authored sources under `skills/` own runtime payloads; `.agents/skills/` projections and `.rsp/rsp-rules.md` are not edited directly.
  - `.rsp/specs/skill-system.md` owns stable composition facts; the Change owns planned work and final evidence.
  - Existing contract and behavior tests remain hard gates, but fixed text assertions alone do not prove semantic equivalence.
- Affected areas:
  - `skills/rsp/SKILL.md` and directly owned references for Core routing, managed detail, release routing, and reopen/recovery.
  - Selected Discipline `SKILL.md` files only where exact duplication or a closed decision flow has a concrete smaller equivalent.
  - `.rsp/specs/skill-system.md` and focused Skill contract/behavior tests.
- Constraints:
  - Preserve all trigger, authority, action, stop, return, verification, language, lifecycle, Git, and publication behavior.
  - Keep references one level from their owning `SKILL.md`; do not create a shared runtime glossary or cross-Skill recursive dependency.
  - Retained evaluation evidence is immutable; prompt changes receive fresh candidate evidence rather than overwriting prior results.
- Recorded ownership and cost baseline (`tiktoken` `o200k_base`):
  - Core eagerly owned release, reopen/recovery, and qualified-Manage interruption/closeout detail before this Change. Detailed owners are now `rsp-release-docs` or Core's direct release fallback, Core's direct reopen-recovery reference, managed-routing PREFLIGHT/QUALIFY/REQUALIFY, and selected `rsp-manage` execution respectively; standalone Disciplines retain their complete safety contracts.
  - Fresh immutable current → structural → structural + notation snapshots: Core `2991 → 2529 → 2529`; Core + Implement `3848 → 3386 → 3371`; all `SKILL.md` payloads `14851 → 14420 → 14405` tokens.
  - Final representative active paths: Core + managed preflight `3626`, selected Core + managed preflight + Manage `5552`, Core + Release Docs `3920`, manual release fallback `2856`, and reopen recovery `2725` tokens. Conditional branches load their direct detailed owner only when active.
  - The retained Implement decision-flow rewrite measured `189 → 174` tokens. A Core decision-flow candidate measured only `197 → 194` and was rejected as insufficient benefit.
  - A fresh immutable evaluation through the user-configured provider reports input usage `29854 → 29310 → 29291` for current → structural → combined. Structural ownership and conditional loading save 544 provider input tokens (1.82% of the full configured request); notation adds only 19 more. Structural and combined pass all eight adjudicated cases, while current has one safe categorical ambiguity on status-update timing.

## Tasks
- [x] Record current structural ownership, duplicated eager rules, representative loaded-path token counts, and fixed behavior cases.
- [x] Establish single detailed owners and conditional loading for inactive Core branches while preserving portable fallbacks and standalone Disciplines.
- [x] Apply lightweight notation only to closed local flows with measured token reduction and equivalent route/mutation decisions.
- [x] Update stable Skill System composition facts and focused contract/behavior coverage without asserting exact prose unnecessarily.
- [x] Run focused and full verification, fixed-scope re-review, and record final token deltas, omissions, and risks.

## Verify
- Automated:
  - [x] `mise exec -- pnpm run build` — passed after the final authored Skill corrections.
  - [x] `mise exec -- pnpm run lint` — passed after excluding immutable raw prompt snapshots from Markdown lint and keeping executable tests lint-clean.
  - [x] `mise exec -- pnpm run test` — executed; the final default-parallel run passed 629/630 tests but the clean-install case transiently packed while another test removed shared `dist/cli.mjs`. The immediately following isolated and non-file-parallel runs below provide the decisive result without that existing shared-build race.
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm vitest run test/clean-install-check.test.ts && mise exec -- pnpm vitest run --no-file-parallelism` — the isolated clean-install case passed 2/2, then all 54 files and 630 tests passed without the shared-`dist/` race.
  - [x] `mise exec -- pnpm vitest run test/skill-runtime-context-contract.test.ts test/rsp-core-routing-contract.test.ts test/rsp-implement-skill-contract.test.ts test/skill-contract.test.ts test/assisted-loop.test.ts test/discipline-composition.test.ts test/managed-controller-contract.test.ts test/artifact-continuation-contract.test.ts test/clean-install-check.test.ts test/helpers.test.ts` — 10 files and 130 tests passed; covers routing, authority, restraint, package references, fixed behavior fixtures, and conditional owners.
  - [x] `mise exec -- pnpm exec vitest run test/skill-runtime-context-contract.test.ts test/rsp-core-routing-contract.test.ts test/managed-controller-contract.test.ts test/artifact-continuation-contract.test.ts` — correction pass 1: 4 files and 71 tests passed after release fallback, selected-Manage ownership, retained evidence, and portable continuation fixes.
  - [x] `mise exec -- node dist/cli.mjs check --focused` — selected Change valid with one expected `MODIFIED` marker.
  - [x] `git diff --check` — passed.
- Manual or environment:
  - [x] Compare exact retained current, structural-only, and combined candidate snapshots with `tiktoken` `o200k_base`; recorded above and in `research/evaluations/rsp-skill-runtime-context/2026-07-29-three-stage-behavior/token-counts.json`.
  - [x] Independent provider fixed-case evaluation: the original `2026-07-29-three-stage-behavior` identity truthfully retains three unavailable official-provider attempts. After the owner clarified the required route, `2026-07-29-three-stage-behavior-user-config-adjudicated` used the user-configured provider without inspecting or retaining private connection values. Structural and combined each passed 8/8 fixed cases; current passed 7/8 with a safe categorical ambiguity on whether managed mutation is described as allowed in the routed Skill or after its required status update. Reported input usage was `29854 → 29310 → 29291`.
- Coverage:
  - Core ordinary implementation, diagnosis/TDD routing, managed select/decline and interruption, release draft/finalize, reopen/recovery, report-only review, standalone Discipline stops, and durable closeout boundaries.
- Review:
  - Fixed comparison: the complete Change-owned worktree against `HEAD`, including new conditional references, package inventory, contract tests, three immutable provider-evaluation identities, and the focused Change.
  - Correction findings for missing release-fallback reachability and duplicated selected-Manage authority are resolved. Final re-review found no remaining correctness, authority, packaging, evidence-integrity, or secret-boundary finding.
  - Residual limitation: provider behavior evidence is one run per variant over prompt-level routing cases; it is not stochastic, latency, repository-discovery, or tool-use calibration.

## Blockers
