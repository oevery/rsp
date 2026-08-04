---
kind: "refactor"
---

# Change: clarify-core-manage-boundary

## Proposal
- Outcome: Make Core the sole owner-resolution and route-selection kernel, while a selected Manage run owns same-goal execution through acceptance and eligible closeout without returning to Core after ordinary receipts.
- Why:
  - Core currently declares ownership of route derivation while Manage Intake also resolves owner state, so automatic routing can produce a Core → Manage Intake → Core → Shape → Core → Manage loop before execution begins.
  - A managed evidence receipt currently triggers fresh Intake selection and qualification through Core even when WorkRef, goal, authority, and topology are unchanged, increasing control turns and long-context replay without improving the authority boundary.
  - Equivalent `auto + local` runs have produced inconsistent terminal behavior: some complete archive and local commit automatically, while others stop and wait for a repeated commit request.
- Scope:
  - Move ready-owner resolution and Shape return handling to Core and its managed-routing reference.
  - Start Manage only with one selected shape-ready Change or shallow Group and a bounded transient goal/authority handoff.
  - Keep same-goal status, authority, diff, receipt, review, and acceptance revalidation inside Manage; return to Core only for a real owner, topology, route, scope, or authority boundary.
  - Make the configured `local` closeout behavior unambiguous: a currently qualified clean terminal non-small managed boundary archives and routes exactly once to local Commit without another user request.
  - Update stable Specs, Skills, documentation, behavior fixtures, and contract tests.
- Non-goals:
  - Make Manage the executor for specialist, report-only, release, isolated Design, tiny, or direct work.
  - Let Manage create or reshape durable owners, absorb product decisions, mutate without authority, or persist controller state.
  - Change worker limits, retry limits, acceptance result schemas, push/publication authority, or CLI configuration values.
  - Claim a fixed token-saving percentage without a controlled replay benchmark.

## Spec
### MODIFIED
- Requirement: Core resolves ownership before selecting execution
  - Core derives whether the requested goal has one unambiguous shape-ready Change or shallow Group.
  - Missing or non-ready ownership routes to Shape under independently granted planning-artifact authority; Shape returns the ready WorkRef to Core for fresh route derivation.
  - Only a ready owner may enter Manage qualification. Manage has no pre-owner Intake and never creates or focuses an owner.
- Requirement: Manage owns the selected goal until a true route boundary
  - Core hands a selected Manage run the goal, WorkRef, authority envelope, decisive qualification evidence, closeout ceiling, and return boundaries as transient control data.
  - After worker or Discipline evidence, Manage rereads status, owner, authority, diff, blockers, and decisive evidence internally before further mutation or dispatch.
  - Same-goal corrections, verification, review convergence, acceptance, interruption/resume, and eligible closeout do not return to Core merely to repeat selection.
  - Manage returns to Core only when owner identity, topology, requested route, behavior, acceptance, public interface, scope, mutation authority, or external-action authority changes.
- Requirement: Configured local closeout is deterministic
  - `manual` performs neither automatic archive nor commit.
  - `lifecycle` archives an eligible managed boundary but performs no Git commit.
  - `local` archives an eligible terminal non-small managed boundary and routes its exact clean paths to one local Commit without requiring another user request.
  - Push, tag, publication, deployment, approval, and human acceptance remain separately explicit.

### Acceptance
#### Scenario: Non-small work has no ready owner
- GIVEN automatic Manage activation and an authorized non-small requested completion with no shape-ready WorkRef
- WHEN Core derives the route
- THEN Core routes Shape directly without entering Manage
- AND Shape returns a ready owner to Core before any Manage qualification

#### Scenario: A selected managed run receives ordinary evidence
- GIVEN a qualified Manage run whose goal, WorkRef, topology, and authority remain unchanged
- WHEN a Fix, Verify, Review, or Resolve Findings result returns
- THEN Manage revalidates current evidence internally and continues or stops under its own bounds
- AND Core route selection is not repeated solely because a receipt arrived

#### Scenario: Managed discovery changes the boundary
- GIVEN a selected Manage run
- WHEN evidence changes owner identity, topology, requested route, behavior, acceptance, interface, scope, or authority
- THEN Manage stops mutation and returns the evidence to Core for fresh routing
- AND Shape is entered only through Core when durable owner refinement is authorized

#### Scenario: Automatic local closeout
- GIVEN `manage.closeout: local` and a currently qualified terminal non-small managed owner with review-clean acceptance, fresh verification, known exact paths, and no nearer denial
- WHEN Manage derives closeout eligibility
- THEN it archives first and routes exactly once to local Commit
- AND it does not ask the user to repeat `commit`

## Design
- Approach:
  - Replace Manage Intake with a Core-owned ready-owner preflight in the conditional managed-routing reference.
  - Keep `RouteDisposition` in Core. Reframe `OwnershipDisposition` as Core/Shape owner-resolution vocabulary rather than a Manage phase.
  - Give Manage one explicit selected-goal entry contract and internal same-goal revalidation loop.
  - Preserve fail-closed returns to Core and the existing transient-only control model.
- Boundaries:
  - Core owns owner resolution, initial Manage qualification, the `selected | declined` route result, rerouting, and specialist/direct/Shape exceptions.
  - Shape owns durable Change/Group clarification and readiness.
  - Manage validates the selected handoff against current owner, authority, and owned-diff evidence, then owns selected-goal frontier, dispatch, evidence acceptance, review convergence, resume, acceptance, and eligible closeout without repeating direct-versus-managed eligibility.
  - Workers and Discipline Skills remain actual bounded action executors.
  - Changes and Group Briefs remain the only durable work owners.
- Affected areas:
  - `.rsp/specs/skill-control-model.md`, `.rsp/specs/skill-system.md`, and stable Spec navigation
  - `skills/rsp/SKILL.md`, `skills/rsp/references/managed-routing.md`, `skills/rsp-shape/SKILL.md`, and `skills/rsp-manage/SKILL.md`
  - English and Chinese Skill/configuration documentation
  - authored/generated fallback wording and managed routing, runtime-context, Shape, and closeout contract tests and fixtures
- Constraints:
  - Preserve progressive disclosure and one detailed procedure owner per active phase.
  - Keep configured closeout as an authority ceiling narrowed by nearer restrictions.
  - Do not add persisted sessions, controller records, hidden state, numeric routing scores, or recursive Skill loading.
  - Token measurements may validate motivation but never become a routing, authority, dispatch, acceptance, or closeout input.

## Tasks
- [x] Move owner preflight and Shape routing out of Manage and into Core.
- [x] Make selected-goal revalidation, review convergence, and acceptance fully Manage-owned.
- [x] Clarify deterministic `local` closeout without expanding remote or external authority.
- [x] Update stable Specs, documentation, fixtures, and semantic contract tests.
- [x] Resolve the fixed review findings and refresh focused verification.
- [x] Run focused routing/Manage contracts, build, lint, full tests, and diff hygiene checks.

## Verify
- Automated:
  - [x] Fixed-review resolution contracts — 7 files / 143 tests passed after moving initial qualification and `selected | declined` ownership exclusively to Core/managed-routing, limiting Manage to selected-handoff/current-evidence validation, correcting bilingual owned-boundary wording, and refreshing beta composition/holdout locks.
  - [x] `mise exec -- pnpm run build`, `node dist/cli.mjs check --focused --json`, and `git diff --check HEAD` — build passed; focused check reported 0 errors / 0 warnings; diff hygiene passed.
  - [x] Focused Core, Shape, Manage, runtime-context, helper/documentation, assisted-loop, and beta controller contracts — 8 files / 149 tests passed for ready-owner routing, selected-goal continuation, and closeout semantics; independent Verify also passed its 8-file / 151-test selection and the beta composition lock passed 10/10.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm exec vitest run --no-file-parallelism` — build and lint passed; the complete stable run passed 55 files / 660 tests. The ordinary parallel run passed 659/660 while one pre-existing Group-reopen test exceeded its 5-second limit at 5.178 seconds; that exact test passed independently at 4.636 seconds and the complete low-parallelism run passed.
  - [x] `node dist/cli.mjs check --focused --json` and `git diff --check` — proves: Change validity and diff hygiene.
- Manual or environment:
  - [x] Final fixed-scope Code and Document re-review was `clean`: Core and managed-routing solely own initial qualification, Manage only validates selected handoff/current evidence, bilingual owned-boundary wording is unambiguous, and no ordinary receipt re-enters Core.
  - [x] Independent Verify confirmed English and Chinese docs consistently describe ready-owner routing, internal same-goal receipt revalidation, automatic `local` archive plus exactly-once local Commit, and separately explicit push/external authority.
- Coverage:
  - No controlled provider replay benchmark is required for acceptance; structural token savings remain an expected consequence, not a completion claim.

## Blockers
- none
