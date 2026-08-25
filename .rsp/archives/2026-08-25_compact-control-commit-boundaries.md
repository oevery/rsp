---
kind: "refactor"
---

# Change: compact-control-commit-boundaries

## Proposal
- Outcome: Compact control outcomes and commit handoff fields
- Why:
  - ControlOutcome still presents a full receipt for every phase, even when most fields are empty or irrelevant.
  - Commit still describes a broad transient handoff and uses long field names that repeat facts already owned by the Change, Group, config, and Git checkout.
  - The existing delivery model does not name a first-class integration boundary for one local commit covering multiple real WorkRefs.
- Scope:
  - Shorten the response-only ControlOutcome vocabulary while preserving exact stop, evidence, and authority semantics.
  - Make Core compose the outer outcome; leaf Skills and Manage return only bounded phase results.
  - Rename optional receipt labels to concise, unambiguous names and omit them unless active.
  - Replace the broad Commit handoff wording with a compact delivery request and make rsp-commit reread owner facts itself.
  - Add integration as a delivery kind for one exact local commit covering multiple existing WorkRefs without manufacturing a Group.
  - Restore lightweight FocusSet semantics so multiple open focused Changes remain valid candidates and AI/Core can resolve a default WorkRef from user intent and status without introducing persisted run state.
  - Update paired docs, Specs, fixtures, and contract tests.
- Non-goals:
  - Do not add a new persisted receipt, controller, JSON state model, or runtime transport protocol.
  - Do not remove fail-closed checks for owner, paths, verification, authority, lifecycle, or Git state.
  - Do not change commit message trailers, push/publication authority, or the local commit command behavior.
  - Do not infer that multiple WorkRefs always belong in one integration commit.

## Spec
### MODIFIED
- Requirement: ControlOutcome is compact and Core-composed
  - Core may compose the outer response with Work, Mode, State, Phase, Result or Stop, Evidence, Changed, Next, and conditional Resume. Changed, Mode, State, and Resume are omitted when inactive; Next combines next owner and action.
  - Shape, Manage, and Discipline Skills return only their bounded phase result and evidence; they do not reproduce the complete outer receipt.
- Requirement: Commit uses a compact delivery request
  - The request names kind, work, refs, paths, verify, auth, and conditional life only when needed. rsp-commit rereads the selected Change, Group, Specs, config, lifecycle evidence, and Git checkout before staging.
- Requirement: Integration is an explicit delivery kind
  - integration represents one exact local commit for multiple existing WorkRefs that share an evidenced integration boundary. It does not create a Group or change WorkRef lifecycle.
- Requirement: FocusSet remains lightweight
  - `focus.d/` contains open-work candidates; multiple markers are valid. Focus and automatic focus select a default action but grant no mutation, lifecycle, Git, publication, or approval authority.
- Requirement: Short names preserve semantic distinctions
  - State remains the outer lifecycle flow, Stop remains the phase-specific stop disposition, Resume is only recovery guidance, and Changed means actual changed artifacts. No shortened field may merge authority, acceptance, route, or topology into an ambiguous value.

### Acceptance
#### Scenario: Ordinary phase returns a compact result
- GIVEN a bounded Implement, Verify, Review, or Shape phase with no pause and no worker participation
- WHEN the phase returns to Core or Manage
- THEN it returns result, evidence, and next action only
- AND Core may omit mode, state, changed artifacts, and resume guidance from the user-facing ControlOutcome

#### Scenario: Pause returns conditional recovery fields
- GIVEN a selected goal is paused or blocked by an environment or verification boundary
- WHEN the phase returns its result
- THEN the outer outcome includes State, Stop, and Resume as needed
- AND it does not reproduce unrelated route, acceptance, topology, or lifecycle fields

#### Scenario: Multiple WorkRefs use integration delivery
- GIVEN multiple existing WorkRefs have one evidenced local integration boundary, exact owned paths, fresh verification, and local commit authority
- WHEN Manage routes delivery
- THEN it sends rsp-commit with kind integration, the WorkRefs, and exact paths
- AND rsp-commit rechecks the facts and creates at most one local commit without creating a Group

#### Scenario: Ambiguous multi-WorkRef boundary stops
- GIVEN multiple WorkRefs have mixed owners, mixed acceptance, stale evidence, or unrelated paths
- WHEN delivery is considered
- THEN rsp-commit stops before staging
- AND it does not guess an integration boundary or merge the WorkRefs

## Design
- Approach:
  - Keep one response-only ControlOutcome, but reduce its default labels to Work, Phase, Result or Stop, Evidence, and Next.
  - Use Mode, State, Changed, and Resume only as conditional fields. Keep canonical machine values unchanged where existing evaluators consume them; the optimization is primarily the human-facing and Skill handoff vocabulary.
  - Replace Commit envelope with delivery request in the Skill contract. Use short names kind, work, refs, paths, verify, auth, and life.
  - Add integration to the accepted commit owner variants and require at least two real WorkRefs plus an evidenced shared boundary.
  - Keep exact Git staging and post-commit observation unchanged.
  - Keep `show --focused` deterministic for explicit CLI use while letting Core/Skills resolve one default WorkRef from a multi-marker FocusSet using user intent, status, and dependencies.
- Boundaries:
  - Core owns outer ControlOutcome composition.
  - Manage owns delivery classification and closeout eligibility.
  - rsp-commit owns owner revalidation, exact staging, message construction, one local commit, and post-commit observation.
  - Change and Group remain durable owners; integration is a transient Git delivery kind unless a real Group already owns the work.
- Affected areas:
  - skills/rsp/references/control-outcome.md, .rsp/specs/skill-control-model.md, skills/rsp-manage/SKILL.md, and skills/rsp-manage/references/closeout.md.
  - skills/rsp-commit/SKILL.md, skills/rsp/references/durable-review.md, paired docs, evaluation fixtures, and contract tests.
- Constraints:
  - Do not introduce new persisted fields or a second source of truth.
  - Preserve exact canonical mode and status values for current machine consumers unless a test proves the consumer is human-facing only.
  - Keep prior dirty changes from simplify-managed-continuation intact and treat overlapping files as an explicit follow-up boundary.

## Tasks
- [x] Audit current ControlOutcome, closeout, Commit, and multi-WorkRef contracts for producers and consumers.
- [x] Compact ControlOutcome labels and phase-result guidance without weakening stop or evidence semantics.
- [x] Compact Commit request wording and add the integration delivery kind.
- [x] Restore lightweight multi-marker FocusSet selection and automatic default WorkRef resolution guidance.
- [x] Update Specs, paired docs, fixtures, and contract tests.
- [x] Run focused contracts, build, typecheck, lint, full tests, and diff hygiene.

## Verify
### Required
- Automated:
- [x] ControlOutcome, closeout, Commit, and multi-WorkRef contract tests — proves: compact naming, conditional fields, fail-closed delivery, and integration routing. Fresh evidence: `mise exec -- pnpm exec vitest run test/skills/rsp-commit-skill-contract.test.ts test/skills/rsp-core-routing-contract.test.ts test/skills/artifact-continuation-contract.test.ts test/skills/skill-contract.test.ts test/architecture/documentation-contract.test.ts --reporter=dot --no-file-parallelism` — 5 files, 39 tests passed.
- [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, and `mise exec -- pnpm run lint` — proves: package and authored Skill consistency; all passed on 2026-08-25.
- [x] `mise exec -- pnpm exec vitest run --no-file-parallelism` — proves: stable suite compatibility; completed without failures on 2026-08-25.
- [x] `node dist/cli.mjs check --focused --json` and `git diff --check` — proves: Change validity and diff hygiene; `ok: true`, 0 errors, 0 warnings, and clean diff check on 2026-08-25.
### Optional
- Manual or environment:
- [x] Re-read Core/Manage/Commit boundaries for field leakage and multi-WorkRef authority ambiguity; compact outer receipt remains Core-owned, same-goal phase results remain in Manage, and `integration` remains fail-closed in `rsp-commit`.
- Coverage:
  - No provider campaign; deterministic contracts prove portable Skill semantics, not model efficacy.
- Fresh follow-up evidence:
  - FocusSet/default-WorkRef contract and generated AGENTS/fallback synchronization — `mise exec -- pnpm exec vitest run test/skills/rsp-core-routing-contract.test.ts test/skills/rsp-design-skill-contract.test.ts test/skills/rsp-verify-skill-contract.test.ts test/architecture/documentation-contract.test.ts test/integration/inspection-and-safety.ts --reporter=dot --no-file-parallelism` — 4 files / 21 tests passed.
  - Full repository verification — `mise exec -- pnpm run test -- --no-file-parallelism` — 92 files / 891 tests passed; `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `node dist/cli.mjs check --focused --json`, and `git diff --check` passed.

## Blockers
- none
