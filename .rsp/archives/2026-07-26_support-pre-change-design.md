---
kind: "feature"
---

# Change: support-pre-change-design

## Proposal
- Outcome: Let `rsp-design` answer one explicit bounded design question before a Change exists while preserving the existing tracked-Change path and Shape ownership boundary.
- Why:
  - Design discussions commonly establish evidence and tradeoffs before implementation scope is ready to become a Change, but the current contract blocks every invocation without a WorkRef.
  - Requiring a speculative Change for report-only design advice creates unnecessary state and makes the Core route order contradict Design's independently invocable role.
- Scope:
  - Add a report-only Pre-Change Design mode for one explicit bounded domain, module/seam, or evidence-seeking question.
  - Preserve Tracked Design for an explicit or unambiguously focused Change, including its authorized `Design` writeback and same-WorkRef return.
  - Route broad or materially unclear outcome/scope/acceptance/decomposition work to Shape instead of allowing Design to become an untracked planning owner.
  - Align Core, fallback rules, stable Skill facts, user documentation, and focused contract/behavior coverage.
- Non-goals:
  - Letting Design create Changes, define an entire delivery scope, implement production behavior, or write durable project truth.
  - Relaxing disposable-code authority for reversible exploration or adding a new persisted owner for pre-Change results.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: `rsp-design` supports Pre-Change and Tracked ownership modes.
  - Pre-Change Design requires one explicit bounded design question but no WorkRef, remains report-only, returns to the user, and identifies Shape as the next action only when accepted work needs an executable owner.
  - Tracked Design requires an explicit WorkRef or exactly one focus marker and preserves the current selected-Change read/write and same-WorkRef return contract.
  - Both modes inspect the smallest authoritative evidence chain, separate evidence-driven conclusions from owner decisions, and prohibit production implementation or durable-truth mutation.
- Requirement: Core distinguishes a bounded pre-Change design inquiry from unclear non-trivial shaping.
  - An explicit isolated domain, module/seam, or evidence-seeking question may route to Design without a selected Change.
  - A request whose outcome, scope, non-goals, acceptance, or decomposition remains materially unclear routes to Shape rather than Design.

### Acceptance
#### Scenario: explicit design inquiry precedes tracked work
- GIVEN no selected Change and one explicit bounded module-boundary question
- WHEN the user requests evidence-based design advice without artifact mutation
- THEN `rsp-design` returns a report-only recommendation, alternatives, gaps, owner decisions, artifact-routing candidates, and smallest next action without requiring or inventing a WorkRef

#### Scenario: tracked design still returns to its Change
- GIVEN an explicit or uniquely focused Change with one material design question
- WHEN Design is asked to resolve it
- THEN the selected Change remains the owner and only an explicitly authorized planned-design update may modify its `Design` section

#### Scenario: broad discovery remains Shape work
- GIVEN no selected Change and a request that still needs material outcome, scope, acceptance, or decomposition decisions
- WHEN Core derives the next action
- THEN it routes the request to Shape and does not let Design create an implicit planning owner

## Design
- Approach:
  - Make the question and evidence boundary mandatory, then derive either `Pre-Change` or `Tracked` ownership mode.
  - Represent Pre-Change ownership only in the response; do not invent a WorkRef, continuation, or artifact. Suggest Shape only after a design result is accepted for planned execution.
  - Move Core's isolated-design route ahead of the generic no-selected-Change branch, guarded by the explicit bounded-question condition.
- Boundaries:
  - Shape owns executable outcome/scope/acceptance/decomposition and Change creation; Design owns analysis of exactly one bounded design question.
  - Pre-Change results return to the user; Tracked results return to the selected Change.
- Affected areas:
  - `skills/rsp/SKILL.md`, `skills/rsp-design/SKILL.md`, and `rules/rsp-rules.md`
  - `.rsp/specs/skill-system.md`, `docs/design-philosophy.md`, and `README.md`
  - `test/rsp-design-skill-contract.test.ts`, `test/rsp-design-behavior.test.ts`, and `test/rsp-design-behavior/fixtures/`
- Constraints:
  - Preserve one-question progressive disclosure, report-only defaults, artifact ownership, and non-recursive Skill composition.
  - A missing WorkRef alone is not an authority failure in Pre-Change mode; a missing or materially ambiguous question, owner choice, evidence boundary, or required mutation authority still blocks.
  - Edit authored Skill and fallback sources, then rebuild and sync the generated self-hosted `.rsp/rsp-rules.md` through the documented CLI path.

## Tasks
- [x] Add the dual ownership-mode contract and guarded Core/fallback routing.
- [x] Add focused contract and behavior coverage for Pre-Change, Tracked, and Shape-return cases.
- [x] Update stable Skill facts and user-facing design documentation.
- [x] Build, sync the self-hosted fallback, and run the required verification.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/rsp-design-skill-contract.test.ts test/rsp-design-behavior.test.ts test/skill-contract.test.ts` — passed 3 files / 13 tests; proves: dual-mode contract, authority restraint, and published Skill conformance.
  - [x] `mise exec -- pnpm run build`; `node dist/cli.mjs update`; `mise exec -- pnpm run lint`; `mise exec -- pnpm run typecheck`; `mise exec -- pnpm run test` — passed build, fallback sync, lint, typecheck, and 45 files / 519 tests; proves: authored package and project baseline.
  - [x] `git diff --check`; `node dist/cli.mjs check --focused` — passed after final evidence retention; proves: changed-text hygiene and deterministic focused Change validity.
- Manual or environment:
  - [x] Inspected the final Skill and fallback routing: a bounded no-Change question enters report-only Pre-Change Design before generic no-Change shaping, while unclear outcome/scope/non-goals/acceptance/decomposition remains Shape-owned.
  - [x] Real-host Native Design four-phase composition passed with the new exact package; all phase boundaries, runtime isolation, same-WorkRef return, verification, and durable writeback gates passed under the new run identity.
  - [x] Real-host `auto-lifecycle` product composition passed with the changed Core Skill; three fixed review corrections converged, lifecycle archived, fixture tests passed, and commit/push/publication remained zero. Sanitized evidence was retained under a new identity without raw events or the disposable workspace.
- Coverage:
  - No live host conversation evaluation is required for this concise contract correction; focused behavior fixtures cover the routing and restraint boundary.

## Blockers
- none
