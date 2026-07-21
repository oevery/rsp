---
kind: "refactor"
---

# Change: minimum-skill-suite/validate-native-skill-depth

## Proposal
- Summary: Preserve valuable complex shaping branches without bloating runtime context, and validate both concise native Skills on real mutation work.
- Why:
  - The concise Skills retain their core RSP deltas, but read-only forward tests cannot prove that complex shaping and implementation behavior remains sufficient during actual mutations.
  - Multi-round clarification and terminal delivery shaping are valuable conditional branches that fit progressive disclosure better than the main Skill body.
- Scope:
  - Add one conditional complex-shaping reference and a precise context pointer from `rsp-shape`.
  - Execute a small unseen mutation holdout against real historical RSP artifacts for both `rsp-shape` and `rsp-implement`.
  - Add rules only for repeated observed failures; otherwise retain the concise candidate.
- Non-goals:
  - Restoring the old resolver, fixed response tokens, synthetic provider matrix, or copying complete upstream workflows.

## Spec
### MODIFIED
- Requirement: `rsp-shape` progressively discloses complex shaping only when the branch is relevant.
  - Read the reference for multi-round material ambiguity, shallow multi-slice decomposition, or terminal delivery that depends on independently closable semantic owners.
  - Keep ordinary one-Change shaping entirely in the main Skill.
- Requirement: concise native Skills demonstrate mutation sufficiency before suite routing depends on them.
  - Holdouts use real historical project artifacts in isolated temporary workspaces without exposing the expected patch.
  - Evaluation checks owner selection, authorized mutations, preservation, verification truth, and useful completion; it does not require fixed prose.
  - A single stochastic variation is reported, while only repeated capability failures justify new runtime rules.

### Acceptance
#### Scenario: ordinary shaping remains compact
- GIVEN one non-trivial request that fits one executable Change
- WHEN `rsp-shape` runs
- THEN the main Skill is sufficient without loading the complex reference
- AND it retains the existing Shape Ready and authority gates

#### Scenario: terminal delivery needs conditional detail
- GIVEN independently closable upstream owners converge on packaging, migration, authorization, or publication
- WHEN `rsp-shape` reaches that branch
- THEN it loads the complex reference and creates or refines one ordinary terminal Change without copying upstream work or live state

#### Scenario: concise Skill mutates unseen historical work
- GIVEN a temporary workspace built from real project artifacts not used to write the Skill
- WHEN a fresh agent applies the selected Skill
- THEN required owners and RSP work state change correctly, unrelated work is preserved, and completion claims match observed verification

## Design
- Approach:
  - Put only conditional clarification and terminal-delivery mechanics in `references/complex-shaping.md`.
  - Use fresh subagent contexts with raw Skill/artifact paths and temporary workspaces; do not provide expected answers or modify the live checkout.
  - Review artifacts and verification evidence manually, then keep or adjust the concise Skills based on repeated findings.
- Affected areas:
  - `skills/rsp-shape/SKILL.md` and `skills/rsp-shape/references/complex-shaping.md`
  - static Skill contract tests
  - ignored temporary holdout workspaces and this Change's verification evidence
- Constraints:
  - Keep the main Skill under 600 words and the reference one level deep.
  - Do not run a repeated provider matrix or retain temporary holdout repositories.

## Tasks
- [x] Finalize the progressive-disclosure and mutation-holdout contract.
- [x] Add the complex shaping reference and context pointer.
- [x] Run two unseen shaping mutation tasks on real historical artifacts.
- [x] Run two unseen implementation mutation tasks on real historical artifacts.
- [x] Review failures, add only repeated missing capability, and remove temporary workspaces.
- [x] Run Skill schema, contract, project, package, RSP, and diff validation.

## Verify
- Automated:
  - [x] Agent Skills validation, focused Skill contract tests, build, typecheck, lint, and full tests passed; final suite is 11 files and 265 tests.
  - [x] Package dry-run includes `skills/rsp-shape/references/complex-shaping.md` and excludes research, tests, `.rsp`, and temporary artifacts.
  - [x] Focused RSP check and `git diff --check` passed.
- Manual:
  - [x] Two shaping holdouts produced a correct Overall Delivery Change and a truthful owner-decision blocker; conditional reference loading was limited to the complex branch.
  - [x] Two historical implementation holdouts reproduced the required scoped changes without target-commit access, staging, delivery, or live-checkout mutation; targeted checks passed and unrelated full-gate failures remained visible.
  - [x] Repeated findings added only two native rules: restore command-owned focus side effects, and report confirmed unrelated required-gate failures as `verification-blocked` without waiving them. Late publication permission was kept out of active Blockers until it prevents the next executable task.
  - [x] All four temporary holdout workspaces were removed after inspection.
- Durable updates:
  - [x] Updated `.rsp/specs/design.md` with the conditional complex-shaping behavior; the existing unseen-holdout evidence boundary remains authoritative.

## Blockers
- none
