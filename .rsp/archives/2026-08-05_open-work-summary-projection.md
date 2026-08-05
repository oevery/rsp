---
kind: "feature"
---

# Change: open-work-summary-projection

## Proposal
- Outcome: Project open Change outcomes and Group goals as human-readable summaries across status and TUI surfaces.
- Why:
  - Open-work status and the dashboard currently repeat the WorkRef identity while archive History already presents a separate human-readable summary.
  - Projects that keep stable English ASCII WorkRefs and author outcomes in another language therefore lose the readable outcome until work is archived.
- Scope:
  - Add one shared semantic summary extractor for open and archived Changes, preserving the existing frontmatter `summary` → Proposal `Outcome` → Proposal `Summary` precedence.
  - Project the first meaningful Group `Goal` item as the Group summary.
  - Expose nullable summaries in status JSON and plain status, and consume them in TUI Change/Group lists, details, and filtering.
  - Update the smallest owning Specs and focused status/history/TUI tests.
- Non-goals:
  - Add persisted display-name metadata, translate summaries, rename WorkRefs, or change artifact-language policy.
  - Change archive selection identity, history bounds, dependency planning, lifecycle, or command mutation behavior.
  - Require a completed summary for unfinished placeholder scaffolds.

## Spec
### MODIFIED
- Requirement: Read-only work projections keep canonical WorkRef identity and human-readable summary separate.
  - An open or archived Change summary uses frontmatter `summary`, otherwise Proposal `Outcome`, otherwise Proposal `Summary`.
  - A Group summary is the first meaningful authored item in `Goal`.
  - Empty, malformed, or untouched placeholder summary content projects as `null` for open work without changing structural diagnostics.
  - Status JSON exposes `summary: string | null` for every open Change and Group.
  - Plain status and TUI Change/Group surfaces show a present summary while preserving exact WorkRefs as identity.
  - TUI filtering matches WorkRef, summary, and existing relevant fields.

### Acceptance
#### Scenario: Localized outcome with stable WorkRef
- GIVEN an open Change named `mock-exam-flow`
- AND its Proposal Outcome is Chinese
- WHEN status JSON, plain status, or the TUI presents the Change
- THEN the exact WorkRef remains `mock-exam-flow`
- AND the Chinese Outcome is exposed as its summary

#### Scenario: Group goal
- GIVEN an open Group Brief with an authored Goal
- WHEN status or the TUI presents the Group
- THEN the exact Group WorkRef remains its identity
- AND the first meaningful Goal item is exposed as its summary

#### Scenario: Summary search
- GIVEN a Change or Group whose WorkRef does not contain the localized summary text
- WHEN the user filters the TUI by that summary text
- THEN the corresponding item remains visible

#### Scenario: Unfinished scaffold
- GIVEN a new open Change or Group still contains an empty or `<…>` summary placeholder
- WHEN status derives its projection
- THEN its summary is `null`
- AND existing validation and readiness behavior remains unchanged

#### Scenario: Archive parity
- GIVEN an archived Change with frontmatter summary or Proposal Outcome/Summary
- WHEN History derives its summary
- THEN it uses the same shared semantic precedence as open status
- AND existing history truncation and search behavior remains unchanged

## Design
- Approach:
  - Introduce a presentation-neutral core summary seam consumed by status, Group inspection, and archive history instead of maintaining separate string lookup logic.
  - Add nullable `summary` fields to open Change and Group status outputs; keep WorkRef fields as the sole identity and selection keys.
  - Render summaries as secondary human-readable lines or fields so narrow terminal layouts do not sacrifice identity, state, or command visibility.
- Boundaries:
  - Core document semantics own extraction; status and history own projection; plain CLI and TUI own presentation.
  - Summary extraction never becomes lifecycle, readiness, dependency, or identity state.
- Affected areas:
  - `src/core/`, `src/status/`, `src/history/`, `src/tui/`, and shared output types
  - `.rsp/specs/cli-contracts.md`, `.rsp/specs/tui.md`, and focused status/history/TUI tests
- Constraints:
  - Preserve existing behavior other than the additive nullable summary projection; keep 40-column TUI support and bounded History output.

## Tasks
- [x] Add shared Change/Group summary extraction with placeholder-safe semantics.
- [x] Project summaries through status JSON/plain output and TUI list/detail/search surfaces.
- [x] Reuse the Change extractor in archive History without changing bounds or search.
- [x] Update durable Specs and focused regression tests.
- [x] Run focused tests, build, lint, full tests, focused RSP check, and diff whitespace verification.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/status test/tui test/history-query.test.ts` — 13 files, 84 tests passed; proves: open status, Group, TUI, and History summary behavior.
  - [x] `mise exec -- pnpm run build` — passed; proves: additive output types and all consumers compile and bundle.
  - [x] `mise exec -- pnpm run lint` — passed; proves: changed source and tests satisfy repository static rules.
  - [x] `mise exec -- pnpm run test` — 55 files, 671 tests passed; proves: the complete CLI, status, History, and TUI suite remains green.
  - [x] Independent read-only Verify reran the focused 84 tests, build, typecheck, lint, full 671-test suite, focused RSP check, and diff whitespace check; all passed with a distinct worker identity.
  - [x] Fixed-scope Review against `HEAD` found Code and Document clean with no P0–P3 findings; production callers reach the shared summary seam.
- Manual or environment:
  - [x] Inspected wide plain output plus 40-column TUI regression coverage; WorkRef remains first and summaries render as secondary text.
  - [x] Inspected the final diff boundary; no boats-cloud path, WorkRef rename, language-policy change, or lifecycle mutation is present.
- Coverage:
  - Extraction precedence, placeholder handling, additive JSON shape, plain output, Change/Group TUI display and filtering, History parity, narrow terminal identity preservation, and unrelated dirty-work isolation.

## Blockers
- none
