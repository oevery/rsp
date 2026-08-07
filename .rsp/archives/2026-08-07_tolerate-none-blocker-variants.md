---
kind: "fix"
---

# Change: tolerate-none-blocker-variants

## Proposal
- Outcome: Treat unambiguous none variants as an empty Blockers section
- Why:
  - A completed Change can be falsely blocked when an editor or generated artifact writes an otherwise unambiguous sentinel such as `- None.` instead of canonical `- none`.
- Scope:
  - Centralize empty-blocker sentinel recognition and use it consistently for readiness and dependency planning.
  - Accept case-insensitive `none` with optional list markers, surrounding whitespace, and a trailing `.` or `。`.
  - Keep generated Change content canonical as `- none`.
- Non-goals:
  - Accepting free-form aliases such as `no blockers`, `N/A`, or localized prose.
  - Changing dependency blocker syntax or weakening fail-closed handling of meaningful content.
  - Emitting warnings for accepted sentinel variants.

## Spec
### MODIFIED
- Requirement: Blocker parsing tolerates unambiguous variants of the canonical empty sentinel.
  - `none` is case-insensitive and may be bare or prefixed by a Markdown `-` or `*` list marker.
  - A single trailing ASCII or Chinese full stop does not make the sentinel meaningful.
  - Accepted variants produce no active blocker, dependency-plan blocker, diagnostic, or readiness warning.
- Requirement: Meaningful and ambiguous blocker content remains fail-closed.
  - Free-form aliases, real blocker prose, malformed dependency declarations, and incomplete HTML comments retain their existing blocking behavior.

### Acceptance
#### Scenario: Punctuated none sentinel
- GIVEN a Change whose Blockers section contains `- None.`
- WHEN readiness and dependency state are derived
- THEN the Change has no active blocker and its completion gate is not blocked by that line

#### Scenario: Meaningful blocker prose
- GIVEN a Change whose Blockers section contains free-form text other than an accepted `none` sentinel
- WHEN readiness and dependency state are derived
- THEN the text remains an active blocker

## Design
- Approach:
  - Add one shared line classifier for the empty sentinel and reuse it from both generic blocker detection and dependency parsing.
- Boundaries:
  - `src/core/helpers.ts` owns semantic empty-sentinel recognition.
  - `src/core/dependency-plan.ts` consumes the shared recognition without maintaining a second regex.
- Affected areas:
  - `src/core/helpers.ts`
  - `src/core/dependency-plan.ts`
  - focused helper and integration tests
- Constraints:
  - Preserve canonical generated output as `- none`.
  - Do not modify the concurrent workspace JSON error Change.

## Tasks
- [x] Add regression coverage for accepted `none` variants and retained real blockers.
- [x] Centralize and apply tolerant empty-sentinel recognition.
- [x] Run focused and repository validation.
- [x] Refresh this Change with final verification evidence.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/helpers.test.ts` — 57 tests passed; proves helper-level accepted variants, legacy empty list markers, and retained real blockers.
  - [x] `mise exec -- pnpm exec vitest run test/integration.test.ts -t "tolerates punctuated none variants"` — 1 focused test passed; proves `status`, `show`, and `ready` share tolerant non-blocking semantics without warnings.
  - [x] `mise exec -- pnpm run build` — packaged CLI build passed.
  - [x] `mise exec -- pnpm run typecheck` — passed.
  - [x] `mise exec -- pnpm run lint` — passed.
  - [x] `mise exec -- pnpm run test` — 61 files and 732 tests passed.
  - [x] `git diff --check` — passed.
### Optional
- Manual or environment:
  - none
- Coverage:
  - Free-form aliases remain intentionally unsupported and blocking.

## Blockers
- none
