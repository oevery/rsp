---
kind: "refactor"
---

# Change: skill-context-concision/manage-delegation-progressive-disclosure

## Proposal
- Outcome: Solo Manage execution no longer loads worker delegation and host-evidence procedures.
- Why:
  - The current entrypoint loads roughly five hundred words of worker-only detail even when `DispatchDisposition: none`.
- Scope:
  - `skills/rsp-manage/SKILL.md`
  - One directly linked delegation reference
  - `.rsp/specs/skill-system.md` progressive-disclosure fact
  - Manage context and evaluator contract tests
- Non-goals:
  - Change dispatch qualification, worker task shape, evidence ownership, acceptance, retries, lifecycle closeout, or host behavior.

## Spec
### MODIFIED
- Requirement: The entrypoint must retain `DispatchDisposition`, required-delegation fail-closed behavior, acceptance derivation, and the trigger for loading delegation detail.
  - Delegation envelopes, Discipline result ownership, and host-fact validation must load only for `preferred | required`.

### Acceptance
#### Scenario: Solo managed execution
- GIVEN a selected managed goal with `DispatchDisposition: none`
- WHEN Manage invokes a bounded local Discipline
- THEN it does not load delegation detail and does not claim worker participation.

#### Scenario: Required worker execution
- GIVEN `DispatchDisposition: required`
- WHEN Manage prepares and validates worker work
- THEN it loads the delegation reference and retains task, attribution, independence, and acceptance failure boundaries.

## Design
- Approach:
  - Add `references/delegation.md` and replace the two worker-only entrypoint sections with an explicit conditional-loading rule plus the compact acceptance relationship.
- Boundaries:
  - Dispatch classification remains eager; worker mechanics and host evidence become branch-specific.
- Affected areas:
  - `skills/rsp-manage/`
  - `.rsp/specs/skill-system.md`
  - `test/skills/skill-runtime-context-contract.test.ts`
  - `test/evaluation/managed-controller-contract.test.ts`
- Constraints:
  - Preserve standalone publication and semantic negative-mutation coverage.

## Tasks
- [x] Move delegation and host-evidence procedures into one direct reference.
- [x] Keep branch trigger and acceptance summary in the entrypoint.
- [x] Update context and evaluator tests, fixtures, holdout resource expectations, package inventory, and current beta composition identity.
- [x] Update the durable Skill-system fact to reflect conditional delegation loading.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skills/skill-runtime-context-contract.test.ts test/evaluation/managed-controller-contract.test.ts` — 27 focused tests passed; conditional loading and worker evidence boundaries remain intact.
  - [x] `node .agents/skills/author-rsp-skills/scripts/scan-skill-context.mjs` — all five package Markdown files are reachable; the delegation reference is included in the published inventory.
### Optional
- Manual or environment:
  - [ ] Provider-managed holdouts — deferred to release acceptance unless deterministic semantic contracts regress.
- Coverage:
  - Entry point reduced from 1,460 to 1,024 words. Deterministic managed contracts pass 8/8; current beta and holdout identities were refreshed without modifying prior retained reports. Live host attribution remains release evidence.

## Blockers
- none
