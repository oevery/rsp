---
kind: "fix"
---

# Change: release-handoff-material-actions

## Proposal
- Outcome: Make `rsp-release-docs` return material migration actions directly in the final handoff instead of replacing them with a generic reference to release notes.
- Why:
  - A Sunday, 2026-08-23 provider run produced complete release notes but summarized the final handoff as merely containing a migration example, omitting the exact required `run("tool", ["--flag"])` action.
- Scope:
  - Tighten the final return contract for breaking removals, migrations, security actions, rollback, and other reader-required facts, then add deterministic Skill coverage.
- Non-goals:
  - Repeating full release notes, requiring English wording, or changing release artifact content rules.

## Spec
### ADDED
- Requirement: A final release-docs handoff directly states every material user or operator action needed to use, migrate, validate, rollback, or remain safe.
  - A file link or generic phrase such as “migration example included” may accompany the action but cannot replace it.

### Acceptance
#### Scenario: Breaking API migration
- GIVEN release notes remove string commands and require `run("tool", ["--flag"])`
- WHEN the final handoff reports completed release documentation
- THEN it directly names the migration action and material safety reason without reproducing the whole note

## Design
- Approach:
  - Add one evidence-complete final-handoff rule beside the existing final return checklist.
- Boundaries:
  - Keep wording concise and localized; preserve exact commands, API forms, versions, and other canonical actions.
- Affected areas:
  - Authored `rsp-release-docs` Skill and its deterministic contract test.
- Constraints:
  - Edit canonical `skills/rsp-release-docs/`, update its content version, and leave `.agents/` projection untouched.

## Tasks
- [x] Revise the evidence-complete final handoff contract.
- [x] Add deterministic coverage and run Skill/package verification.

## Verify
### Required
- Automated:
  - [x] Focused `rsp-release-docs` Skill contract tests — 7 tests passed after observing the new contract test fail before the Skill change.
  - [x] Skill security, build, lint, and repository tests — security passed for 38 files with 0 findings; build and lint passed; 88 test files and 873 tests passed.
  - [x] Focused RSP check and diff hygiene — focused check passed with no warnings or errors; `git diff --check` passed.
### Optional
- Manual or environment:
  - [ ] Targeted `material-negative-fact-control` provider rerun.
- Coverage:
  - The material-negative scenario is the decisive pressure case; other matching scenario evidence remains composition-bound.

## Blockers
- none

## Durable Decision
- Current facts: No current-fact update needed
- Current-fact target: N/A
- Facts to write: The canonical authored Skill owns this bounded return-contract behavior.
- Decision Record: No Decision Record needed
- Decision Record target: N/A
- Rationale to write: none
- Archive ready: yes
