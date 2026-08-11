---
kind: "feature"
---

# Change: rsp-4-runtime/web-content-presentation

## Proposal
- Outcome: Present complete repository documents and history through a modern lightweight Web Observatory
- Why:
  - Current Specs detail silently truncates ordinary source at 12,000 code points, then may replace the parsed result after a 32 KiB serialized Markdown ceiling, so rendered and source modes can both omit valid repository content.
  - History detail projects only bounded task, verification, and blocker text instead of the archived Change Markdown, so it cannot provide the same readable document experience as current Specs.
  - The current shell is functional but visually conservative and dense. Treating tens or hundreds of KiB as a product budget now costs more usability than it saves for a local-only Observatory.
- Scope:
  - Return and render complete redacted Specs and archived Change Markdown for every document accepted by the existing safe file-inspection boundary.
  - Reuse one server-owned safe Markdown projection and one React rendered/source presentation across Specs and History.
  - Remove ordinary Markdown block, inline, and serialized-projection truncation, and raise Broker response and static asset ceilings to generous MiB-scale abnormal-input guards rather than product budgets.
  - Modernize the shell, cards, navigation, document typography, History detail, and Runs presentation with a lighter visual system, clearer hierarchy, and responsive internal scrolling.
  - Make exceptional oversize or unsupported content explicit; never silently present a partial document as complete.
- Non-goals:
  - Remove redaction, file identity checks, no-follow reads, CSP, exact route authorization, dangerous-link rejection, or raw-HTML/image blocking.
  - Add a client-side Markdown parser, remote assets, a component framework beyond the existing React root, graph-layout packages, document mutation, or hosted multi-user behavior.

## Spec
### ADDED
- Requirement: Every accepted Specs or archived Change document is presented completely.
  - The Web service reads the entire document up to the existing explicit file inspection maximum, redacts it before parsing, and returns both the complete safe source and complete safe Markdown projection.
  - Rendered and source modes cover the same safe content. Ordinary document length never sets `contentTruncated` or collapses the Markdown projection to an omission marker.
  - A document beyond the explicit file limit fails with a bounded visible error instead of returning a silent prefix.
- Requirement: History uses the same safe document presentation as Specs.
  - History detail retains its date, kind, scenario, task, verification, and blocker metadata while also exposing the complete redacted archived Markdown.
  - Rendered/source switching, safe links, unsupported-content markers, code, lists, task markers, headings, and responsive typography behave consistently in both views.
- Requirement: Resource limits protect against abnormal input without constraining normal UI evolution.
  - The identity-checked 512 KiB file read bounds Markdown input, and Broker JSON responses use a 16 MiB ceiling sufficient for the complete safe source plus typed projection overhead.
  - Markdown projection does not apply separate block-count, inline-count, or serialized-size truncation inside the accepted file boundary.
  - HTML, CSS, and JavaScript assets keep separate generous package-integrity ceilings. Size remains observable in tests but is not treated as a feature budget.
- Requirement: The Observatory uses a modern lightweight responsive visual system.
  - Navigation, controls, cards, master/detail panes, documents, History metadata, and run graphs use consistent spacing, typography, surfaces, focus states, and hierarchy.
  - Desktop and 390px layouts avoid page-level horizontal overflow, keep primary controls reachable, and confine long collections, documents, code, and graphs to their owning scroll surfaces.

### Acceptance
#### Scenario: complete long Spec
- GIVEN a valid 100 KiB Spec containing content beyond the former 12,000-code-point and 32 KiB projection ceilings
- WHEN its rendered and source modes open
- THEN both modes retain the final unique paragraph and the projection is not marked truncated or bounded

#### Scenario: rendered archived Change
- GIVEN an archived Change with headings, paragraphs, lists, task markers, code, links, verification, and blockers
- WHEN its History detail opens
- THEN the complete safe archive renders as Markdown, source mode exposes the same redacted text, and retained metadata remains available

#### Scenario: abnormal oversize document
- GIVEN a document beyond the explicit inspection file maximum
- WHEN the Web detail route reads it
- THEN the operation fails visibly and the existing complete snapshot remains live

#### Scenario: modern responsive shell
- GIVEN any view in English or Chinese at desktop or 390px width
- WHEN the Observatory renders
- THEN controls, cards, documents, History, and Runs retain a coherent modern hierarchy without page-level horizontal overflow or unreachable detail content

#### Scenario: frontmatter and RSP metavariables
- GIVEN a Decision Record with YAML frontmatter and inert RSP placeholders such as `<change-work-ref>` and `<reason>`
- WHEN its rendered and source modes open
- THEN rendered mode presents allowlisted metadata separately, omits frontmatter from the document body, preserves the placeholders as inert code, and source mode retains the complete safe text without permitting repository HTML

## Design
- Approach:
  - Remove the separate 12,000-code-point Specs detail prefix and parse the complete redacted content returned by the existing no-follow 512 KiB document read.
  - Let the identity-checked 512 KiB file boundary bound Markdown input directly, and increase the Broker response envelope to cover the complete typed projection while retaining deterministic hard failure above the abnormal-input ceiling.
  - Add complete source plus `WebMarkdownProjection` to History detail, derived from the same archive read used for structured metadata.
  - Separate leading YAML frontmatter from the rendered Markdown body, project only bounded allowlisted metadata, and preserve narrowly recognized RSP metavariables as inert code without admitting general repository HTML.
  - Generalize the React document presenter so Specs and History share rendered/source interaction and safety behavior.
  - Refine authored CSS and existing components; do not add a UI kit or runtime-loaded asset graph.
- Boundaries:
  - Repository files remain authoritative; complete display does not turn the browser projection into workflow truth.
  - Redaction precedes parsing. Raw HTML, images, unsafe URLs, credentials, checkout roots, and excessive structural depth remain blocked or explicitly marked.
  - File inspection stays bounded and identity-checked. Raising transport and package bounds does not permit unbounded reads or remote content.
- Affected areas:
  - Specs/history inspection and Web projection models, Broker response/asset limits, React document and History components, localization, and CSS.
  - Runtime/Web Specs, React Web Decision Record, focused projection/browser/security tests, clean-install inventory, and release dependency.
- Constraints:
  - Preserve the current one-use fragment bootstrap, in-memory Web bearer, exact origin/path/query allowlists, atomic snapshot behavior, and scoped detail failure.
  - Keep the browser bundle self-contained, authored, no-follow served, and free of remote imports, inline scripts/styles, cookies, storage, or unsafe HTML injection.

## Tasks
- [x] Replace ordinary Specs source/Markdown truncation with complete safe document projection.
- [x] Add complete safe Markdown and source presentation to History while preserving metadata.
- [x] Remove ordinary Markdown projection truncation and raise transport and static asset abnormal-input ceilings with exact boundary tests.
- [x] Modernize shared React presentation and responsive CSS without new UI dependencies.
- [x] Render Decision Record frontmatter and benign RSP metavariables without weakening raw HTML blocking or exact source fallback.
- [x] Update stable facts, focused regression evidence, and release dependency.
- [x] Preserve bounded redacted child-process status, signal, stdout, and stderr when the installed Web smoke fails.

## Verify
### Required
- Automated:
  - [x] Focused Specs/History projection and browser tests with content beyond former limits — proves: rendered/source completeness, redaction, safe Markdown, exact archive selection, and metadata retention.
    - Fresh evidence: `mise exec -- pnpm exec vitest run test/web-observatory.test.ts test/web-react-browser.test.tsx test/broker-protocol.test.ts test/manage-runtime-integration.test.ts test/clean-install-check.test.ts --no-file-parallelism` passed 5 files and 69 tests on 2026-08-10, including a 9,000-paragraph Spec beyond the removed 8,192-block projection limit.
    - Fresh correction evidence: `mise exec -- pnpm exec vitest run test/web-observatory.test.ts test/web-react-browser.test.tsx --no-file-parallelism` passed 2 files and 40 tests on 2026-08-10, including exact frontmatter/source separation, structured metadata, inert RSP metavariables, and retained hostile-HTML blocking.
  - [x] Broker boundary and clean-install tests — proves: MiB-scale response/assets remain exact, no-follow, bounded, and packaged without remote/runtime-loaded content.
    - Fresh evidence: the focused 69-test run above passed the Broker protocol, Web asset boundary, and clean-install package checks on 2026-08-10.
    - Fresh diagnostic evidence: `mise exec -- pnpm exec vitest run test/web-react-browser.test.tsx test/web-observatory.test.ts test/clean-install-check.test.ts --no-file-parallelism` passed 3 files / 50 tests on 2026-08-11, including a forced installed Web smoke failure that retained bounded redacted `status`, `signal`, `stdout`, and `stderr`.
  - [x] Build, typecheck, lint, serial full suite, and `git diff --check` — proves: the modernized complete presentation does not regress CLI, Broker, runtime, or Web behavior.
    - Fresh evidence: `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `mise exec -- pnpm run test -- --no-file-parallelism` (69 files, 824 tests), `mise exec -- pnpm run docs:check`, and `git diff --check` all passed on 2026-08-10.
    - Fresh closeout evidence: the same build, typecheck, lint, serial full suite (69 files / 831 tests), documentation check, and whitespace check all passed on 2026-08-11 after the managed corrections.
### Optional
- Manual or environment:
  - [ ] Inspect representative long Specs, archived Changes, and Runs in both locales at desktop and 390px.
    - Not run: the currently running user Broker uses protocol 1.2 while this Change requires 1.3; the singleton was not stopped or replaced without explicit runtime authority.
- Coverage:
  - Documents above the explicit inspection maximum, embedded remote media, executable HTML, client-side Markdown parsing, document editing, and hosted/multi-user operation remain outside this Change.

## Blockers
- none
