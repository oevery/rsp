---
kind: "refactor"
---

# Change: semantic-document-model

## Proposal
- Outcome: Route RSP Change and Group Brief structure through one lossless semantic document model while preserving the existing canonical Markdown format and public behavior.
- Why:
  - Section headings and structural labels are currently repeated as raw strings across parsing, validation, status, history, readiness, reopen, and generation paths.
  - A typed semantic boundary should let consumers depend on stable section identities without turning localized display labels into persisted protocol tokens.
- Scope:
  - Define canonical Change and Group Brief schemas with stable semantic section identifiers.
  - Parse canonical Markdown into a source-preserving semantic index with exact section spans and bounded structural diagnostics.
  - Migrate production readers and surgical writers away from scattered heading-string lookup.
  - Generate canonical scaffolds from the same structural vocabulary and remove superseded parsing helpers.
  - Record the implemented internal ownership boundary in the existing Core and CLI Specs.
- Non-goals:
  - Localized persisted headings, configurable heading aliases, a translation catalog, or a second serialized document format.
  - General-purpose Markdown parsing, whole-document re-rendering, automatic migration, or a public plugin/schema API.
  - Changing CLI JSON, diagnostics, lifecycle semantics, canonical headings, generated scaffold prose, or existing artifact bytes without a separately accepted reason.

## Spec
### MODIFIED
- Requirement: RSP document structure has one internal semantic owner.
  - Change sections use stable semantic identifiers for Proposal, Spec, Design, Tasks, Verify, and Blockers.
  - Group Brief sections use stable semantic identifiers for Goal, Scope, Shared Constraints, Slices, Completion Conditions, Durable Outcomes, and Blockers.
  - Canonical English headings remain the only persisted protocol representation and are not selected from project language configuration.
- Requirement: Parsing and surgical mutation preserve authored Markdown.
  - Parsing retains the original source and exact section spans so consumers can inspect structure without re-rendering unrelated content.
  - Section mutations operate on exactly one canonical section and preserve unknown sections, comments, whitespace, and authored body content outside the changed span.
  - Missing or duplicate required sections remain visible and fail closed wherever the current lifecycle contract requires them.
- Requirement: Existing observable contracts remain compatible.
  - Current Change, Group, history, status, readiness, archive, reopen, dependency, and scaffold behavior remains stable.
  - Historical Proposal `Summary` remains an explicit read compatibility alias for semantic outcome, while new scaffolds continue to emit `Outcome`.
  - Canonical near-matches and localized headings are not silently accepted as protocol sections.

### Acceptance
#### Scenario: consumers read canonical sections through semantic identities
- GIVEN a canonical Change or Group Brief with authored Markdown and unknown non-protocol content
- WHEN check, status, ready, history, dependency, and Group inspection consume it
- THEN each consumer resolves required structure through stable semantic identifiers
- AND public diagnostics and projections remain compatible

#### Scenario: reopen performs a lossless semantic edit
- GIVEN an archived Change with exactly one canonical Tasks section and one canonical Verify section
- WHEN RSP reopens it with a reason
- THEN unfinished items are inserted through semantic section spans
- AND all content outside those two insertion points remains byte-for-byte unchanged

#### Scenario: canonical serialization remains language-independent
- GIVEN any valid configured artifact language
- WHEN RSP generates a Change, Group Brief, project-setup Change, or Spec scaffold
- THEN the existing canonical headings and neutral scaffold content remain unchanged
- AND no localized heading alias or format version is introduced

## Design
- Approach:
  - Add a small `document-model` core module containing typed schemas, canonical tokens, a line-oriented source-preserving parser, semantic accessors, and exact-span insertion support.
  - Represent each parsed section with its semantic ID, canonical heading, body, and source offsets; retain duplicate and unknown headings as structural evidence instead of discarding source.
  - Keep validation separate from parsing: parsing indexes observed structure, while existing commands continue to decide severity and lifecycle consequences.
  - Migrate read consumers first, then reopen and scaffold generation, while compatibility tests hold public behavior fixed.
- Boundaries:
  - The semantic model owns persisted RSP document structure; domain commands own readiness, lifecycle, dependencies, and diagnostics.
  - Canonical Markdown remains the storage and interchange format. TUI, CLI, and response localization remain presentation concerns.
  - Frontmatter parsing and free-form Markdown prose remain outside the new model except for document title and canonical section indexing.
- Affected areas:
  - New core document model plus `helpers`, Change Group inspection, check, status, history, readiness, dependency, archive, and reopen consumers.
  - Change, Group Brief, project setup, Design, and Spec scaffold renderers.
  - Focused helper/integration/history/status/Group tests and stable Core/CLI Specs.
- Constraints:
  - Do not add a Markdown parsing dependency or regenerate complete user-authored documents.
  - Preserve exact canonical heading matching; a heading such as `## Design Constraints` must not satisfy `design`.
  - Preserve existing JSON shapes, diagnostic codes, WorkRef behavior, and command output unless current tests expose an already-owned incompatibility.

## Tasks
- [x] Characterize canonical parsing, near-match rejection, unknown-content preservation, and current scaffold output.
- [x] Introduce typed Change and Group schemas plus a lossless semantic document index.
- [x] Migrate read-side consumers from raw section headings to semantic identifiers.
- [x] Migrate reopen insertion and canonical scaffold rendering to the shared structural vocabulary.
- [x] Remove superseded heading-string helpers and add a bounded remaining-token allowlist check.
- [x] Update stable Core/CLI Specs with the implemented semantic ownership boundary.
- [x] Run focused and complete repository verification, then resolve review findings within the accepted scope.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/document-model.test.ts test/history-query.test.ts test/integration.test.ts --reporter=dot` — 3 files / 200 tests passed; proves: semantic indexing, legacy title diagnostics, CRLF insertion compatibility, history, reopen, and lifecycle integration.
  - [x] `mise exec -- pnpm run build` — proves: typed production boundaries compile.
  - [x] `mise exec -- pnpm run lint` — proves: repository static contracts pass.
  - [x] `mise exec -- pnpm run test` — 52 files / 594 tests passed; proves: complete observable compatibility.
  - [x] `git diff --check` — proves: changed files contain no whitespace errors.
- Manual or environment:
  - [x] Inspect generated Change, Group Brief, project-setup, Design, and Spec scaffolds in a temporary initialized project — observed canonical headings, neutral placeholders, and verbatim Chinese summary/goal input.
  - [x] Fixed-scope managed re-review — clean after resolving CRLF insertion-boundary and archive-title diagnostic compatibility findings.
- Coverage:
  - No localized persisted-heading or external schema-extension behavior is included; those require separate product evidence and acceptance.

## Blockers
- none
