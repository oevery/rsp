---
kind: "feature"
---

# Change: rsp-4-runtime/markdown-document-presentation

## Proposal
- Outcome: Present bounded current Specs and Decision Records as readable safe Markdown while retaining exact source text and server-owned parsing
- Why:
  - The current Specs detail displays Markdown in a raw `<pre>`, which preserves safety but makes headings, lists, code, quotations, and links harder to scan.
  - Parsing repository Markdown directly in the browser would widen the current security and semantic boundary, while injecting generated HTML would create an avoidable XSS surface.
- Scope:
  - Add one direct server-side Markdown parser dependency and map an explicitly allowed CommonMark block/inline subset into a bounded JSON block projection.
  - Render headings, paragraphs, emphasis, strong text, lists, task markers, blockquotes, fenced/indented code, thematic breaks, and safe links through typed React components.
  - Keep an exact bounded source view and allow switching between rendered and source presentation without refetching or changing repository state.
  - Apply existing checkout/credential redaction before parsing and retain explicit truncation and unsupported-content indicators.
- Non-goals:
  - Execute or preserve raw HTML, render remote images, Mermaid, math, embedded media, scripts, iframes, styles, mutation controls, or browser-side Markdown parsing.
  - Turn Markdown presentation into authoritative repository interpretation or replace current Specs query/search semantics.

## Spec
### ADDED
- Requirement: Specs detail returns a bounded safe Markdown block projection produced by the server from already redacted source.
  - The parser dependency is direct and package-declared. Raw HTML nodes are omitted and represented by a bounded unsupported-content marker.
  - Text and code remain exact after redaction. Links permit only explicit safe protocols and receive no-referrer external behavior; images and embedded content are never fetched.
  - Block count, nesting depth, text length, link destinations, code content, and serialized response remain under existing Web response and detail bounds.
  - The browser renders blocks as React elements without `dangerouslySetInnerHTML` and preserves one source-mode fallback for unsupported or truncated content.

### Acceptance
#### Scenario: readable current Spec
- GIVEN a bounded Spec containing headings, paragraphs, nested lists, emphasis, a code fence, blockquote, and safe link
- WHEN the user opens its detail
- THEN the rendered view preserves the redacted text and structure, performs no additional network fetch, and permits switching to the exact bounded source

#### Scenario: hostile repository Markdown
- GIVEN Markdown containing raw HTML, script-like text, unsafe link protocols, images, excessive nesting, and credential-shaped content
- WHEN the server projects and the React browser renders it
- THEN no executable HTML, unsafe navigation, image request, credential, checkout root, or unbounded structure reaches the page

#### Scenario: truncated or unsupported document
- GIVEN a document exceeds the detail or block bound or contains unsupported constructs
- WHEN its detail renders
- THEN the page states that presentation is bounded or incomplete and retains the safe source fallback

## Design
- Approach:
  - Add `mdast-util-from-markdown` as a direct runtime dependency and parse only after current Web redaction and text bounding.
  - Map the parsed tree into a repository-owned discriminated block/inline projection rather than returning HTML or exposing parser-specific node shapes.
  - Render that projection with typed React components and local rendered/source mode state.
- Boundaries:
  - Specs inspection and source reading remain current-filesystem owners; Markdown parsing is a Web presentation adapter only.
  - The browser does not parse Markdown and never receives raw HTML instructions.
  - Repository prose remains untrusted presentation data and grants no workflow authority.
- Affected areas:
  - `src/web/model.ts`, Specs detail projection/service, Markdown presentation adapter, package dependencies, React Specs components, CSS, and localization.
  - Web security/response-size tests, hostile Markdown fixtures, stable Web/runtime Specs, and the Web architecture Decision Record.
- Constraints:
  - Requires the React browser foundation.
  - Preserve current redaction order, exact safe source mode, CSP, no-store/no-referrer policies, and 64 KiB response bound.
  - Do not rely on transitive parser packages from docs or lint tooling.

## Tasks
- [x] Add the direct parser dependency and repository-owned bounded Markdown block/inline model.
- [x] Implement redaction-first server parsing, safe link normalization, raw-HTML/image rejection, bounds, and explicit truncation/unsupported diagnostics.
- [x] Render the block projection and rendered/source switch through React without unsafe HTML injection.
- [x] Add hostile and representative Markdown regression coverage, bilingual responsive presentation styling, and stable architecture facts.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/web-observatory.test.ts test/web-react-browser.test.tsx test/clean-install-check.test.ts --no-file-parallelism` — 3 files and 42 tests passed on 2026-08-10; proves: redaction-first allowed-node mapping, unsafe HTML/link/image rejection, nesting and serialized projection bounds, exact safe-source switching, native-button accessibility, localization, no browser-side fetch, HTTP projection, direct package declaration, and compatibility with the parallel Runs presentation.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, and `mise exec -- pnpm run lint` — passed on 2026-08-10; proves: the direct parser, server adapter, React components, CSS, and generated exact browser asset compile and satisfy static checks.
  - [x] `mise exec -- pnpm exec vitest run --no-file-parallelism` and `git diff --check` — 69 files and 817 tests passed on 2026-08-10 with a clean whitespace check; proves: Markdown presentation remains compatible with the complete CLI, Broker, runtime, Web, package, and self-hosting suite.
### Optional
- Manual or environment:
  - [ ] Inspect representative Specs and Decision Records in both locales at desktop and 390px.
- Coverage:
  - Raw HTML, remote images, Mermaid, math, syntax-highlighting dependencies, document mutation, and browser-side Markdown parsing remain outside this Change.

## Blockers
- none
