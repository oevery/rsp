---
kind: feature
summary: Add architecture scenarios with shared module identities, filtered views and stable document reading.
---

# Change: architecture-reading

## Proposal
CLI and Web now expose filtered structural views and ordered runtime scenarios from shared module identities, so consumers can distinguish interactions from dependencies without duplicating modules. The viewer provides a shared navigation/steps panel, stable canvas and document reading, local Mermaid rendering and source locators.
The additive schema remains compatible with existing consumers. qysg was used only through an isolated preview; consumer migration, automatic code discovery and complex scenario control flow remain outside this change.

## Spec
### ADDED
- Requirement: Named structural views filter relation types/IDs before adding optional external boundaries; existing views retain incident-edge behavior.
- Requirement: Relations separate type from optional display label. Scenarios contain local participants referencing stable module IDs and ordered call/return/event steps; return references identify an earlier reversed call.
- Requirement: CLI and Web expose the same view semantics and scenario data. Scenarios support sequence and collaboration presentation, step inspection and module navigation.
- Requirement: Markdown Mermaid blocks render with source/error fallback; safe local source links provide copyable locators without granting source-file read access.
- Requirement: Navigation/step switching preserves canvas and panel state; breakpoint changes preserve document reading position. Controls and floating surfaces respect reduced motion.

### Acceptance
#### Scenario: Shared runtime
- GIVEN App and replay scenarios referencing the same runtime module
- WHEN a reader selects either scenario
- THEN only its participants and ordered messages appear, without duplicated module definitions or unrelated build dependencies.

#### Scenario: Existing consumer
- GIVEN a schemaVersion 1 model without new fields
- WHEN queried or opened
- THEN existing selection and identity behavior remains unchanged.

## Design
Extend schemaVersion 1 additively. Views own scenario participants/steps; local participant identities map to module nodes and do not enter the global node registry. Use the existing LikeC4 builder and diagram runtime, with derived leaf aliases for scenario roles. Neutral selection owns filters and boundary semantics; viewer state owns presentation choices.
Keep document authorization unchanged; Mermaid renders in strict mode into inert images, with its bundled runtime loaded only when a document contains a diagram. Source links expose locators only.
Panel changes preserve graph screen position, while window resizing preserves the reading center without changing zoom. Document position capture ignores stale layout geometry during breakpoint remounts. Motion affects feedback surfaces, not canvas or desktop panel geometry; menus and tooltips close immediately to release keyboard dismissal.
Current contracts are maintained in `.rsp/specs/cli.md`, `.rsp/specs/design.md` and both architecture guides.

## Tasks
- [x] Implement compatible model validation, filtered projections and CLI scenario output.
- [x] Implement scenario layouts, step inspection and related-view navigation.
- [x] Unify navigation/steps, toolbar and motion while preserving canvas, selection and panel state on desktop and narrow screens.
- [x] Render document diagrams and source locators; preserve reading positions across breakpoint remounts.
- [x] Update contracts/guides, strengthen behavioral tests, remove obsolete styles and complete independent review.

## Verify
### Required
- Automated:
  - [x] Build, typecheck, lint and full code tests.
  - [x] Architecture regression coverage: legacy selection, filters/boundaries, scenario references/order/returns, CLI/Web equivalence and document safety.
  - [x] Browser checks: scenario reading, presentation switching, module navigation, Mermaid/source fallback and existing reader behavior.
  - [x] Documentation check and doctor.
  - [x] Package contents and isolated installation, including the bundled Mermaid resource.
  - [x] Independent Code and Document review of the final implementation.

Document-only closeout edits reuse the implementation checks and review; package and offline isolated-install evidence cover the unchanged packaging boundary.

Earlier Harbor fixture preparation, document-position and Escape-dismissal checks failed; the final full code and browser runs passed after correction, with the original document-position assertions retained.

qysg evidence is limited to an isolated preview; document bindings have separate regression coverage. No consumer files or bindings were migrated.
### Optional
- Manual or environment:
  - [ ] Human acceptance of qysg-style reading tasks.

## Blockers
None
