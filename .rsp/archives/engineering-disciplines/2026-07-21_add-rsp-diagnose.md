---
kind: "feature"
---

# Change: engineering-disciplines/add-rsp-diagnose

## Proposal
- Summary: Publish a concise host-neutral `rsp-diagnose` Skill that establishes a confirmed cause before production correction.
- Why:
  - The current suite can route unexplained failures but has only a minimal fallback and no demonstrated standalone diagnosis capability.
- Scope:
  - Define reproducibility, layer localization, competing hypotheses, discriminating evidence, confirmation, stop conditions, and return ownership.
- Non-goals:
  - Applying the production fix, running TDD, reviewing, delivering Git changes, or encoding domain-specific debugging tutorials in the main Skill.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: `rsp-diagnose` returns a confirmed cause or a truthful unresolved diagnosis for one selected Change without speculative production mutation.
  - Confirmation requires a smallest discriminating check whose observed result distinguishes the leading hypotheses and explains the failure.
  - Missing reproduction, environment, authority, or evidence must remain visible and return one bounded next action.

### Acceptance
#### Scenario: unexplained verification failure is diagnosed
- GIVEN one selected Change with a reproducible but unexplained failure
- WHEN `rsp-diagnose` localizes the failing layer and tests competing hypotheses
- THEN it returns the confirmed cause, decisive evidence, affected owner, and one correction entrypoint without modifying production code or claiming completion

## Design
- Approach:
  - Use compact REPRODUCE, LOCATE, HYPOTHESIZE, DISCRIMINATE, and CONFIRM steps; progressively disclose only demonstrated special branches such as flaky, concurrency, or performance diagnosis.
- Affected areas:
  - `skills/rsp-diagnose/`
  - focused contract and behavior fixtures under `test/`
  - package documentation and stable design facts after promotion
- Constraints:
  - Keep the canonical body concise and host-neutral; distinguish investigation authority from production mutation authority.

## Tasks
- [x] Create and validate the concise canonical `rsp-diagnose` Skill.
- [x] Add contract and forward behavior evidence for reproduction, discrimination, confirmation, stops, restraint, and return ownership.
- [x] Verify the result and update only required durable models/specs.

## Verify
- Automated:
  - [x] Run focused portable contract and behavior tests selected by this slice.
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run lint && mise exec -- pnpm run test` — passed after shared routing integration; 18 test files and 287 tests passed.
- Manual:
  - [x] Inspect a fresh-context run and confirm it establishes or truthfully fails to establish cause before any production correction.
- Durable updates:
  - [x] Decide whether this change produced durable knowledge that belongs in `.rsp/specs/` or stable instructions that belong in the nearest project-owned `AGENTS.md`
  - [x] If yes, write only stable facts to the smallest correct target file before archive; do not promote task history, debugging notes, or one-off implementation context

Durable decision: the terminal composition slice owns the shared model/spec promotion after both independent discipline Skills are proven. This slice adds no competing shared fact or Decision Record.

## Blockers
- none
