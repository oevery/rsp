---
kind: docs
---

# Change: documentation-information-architecture

## Proposal
- Outcome: Create a concise bilingual documentation architecture and static documentation site
- Why:
  - The English and Chinese READMEs are each about 30 KB and combine onboarding, concepts, policy, workflow, migration, and complete CLI reference in one page.
  - Existing detail is difficult to discover because the READMEs link to only a small part of the documentation corpus.
  - A shared static site can add navigation and search without creating a third documentation source.
- Scope:
  - Reduce both READMEs to equivalent product overviews, a five-minute quick start, the main workflow, and documentation navigation.
  - Move detailed bilingual guidance into task-oriented pages covering getting started, concepts, Skills and managed work, daily workflow, configuration, and CLI reference.
  - Add a VitePress site that renders the same Markdown sources with English and Simplified Chinese navigation and local search.
  - Add repeatable documentation build and link checks to the repository scripts.
- Non-goals:
  - Do not change RSP CLI, Skill, workflow, authority, or release behavior.
  - Do not add a CMS, server-side application, analytics, deployment credentials, or automatic publication.
  - Do not rewrite versioned migration and release notes beyond navigation fixes required by the new structure.

## Spec
### ADDED
- Requirement: The repository has one concise bilingual entry point.
  - Each README presents the same information architecture and links to the corresponding language documentation.
  - Quick start remains usable directly from GitHub and npm without requiring the site.
- Requirement: Detailed user documentation is organized by reader task.
  - English and Simplified Chinese pages use matching routes and section coverage.
  - Normative behavior is summarized and linked to its existing authoritative repository owner instead of being independently redefined.
- Requirement: The documentation can be browsed as a static website.
  - VitePress provides language-aware navigation, sidebar structure, page outlines, and local search from repository Markdown.
  - The site has no runtime service or separate content database.
- Requirement: Documentation drift has deterministic checks.
  - Repository scripts build the site and verify required bilingual page pairs and internal Markdown links.

### Acceptance
#### Scenario: A new reader starts from the repository
- GIVEN the reader opens either README
- WHEN they follow the five-minute quick start or a task-oriented documentation link
- THEN they can reach the matching-language instructions without reading the complete reference manual

#### Scenario: A reader searches detailed behavior
- GIVEN the documentation site is built
- WHEN the reader searches or browses the sidebar for a CLI command, Skill, configuration option, or workflow stage
- THEN the relevant bilingual reference page is discoverable from the same Markdown source tracked in the repository

#### Scenario: Documentation changes drift between languages
- GIVEN a required user-guide page or internal Markdown link is missing
- WHEN the documentation verification script runs
- THEN it fails with the missing page pair or broken target

## Design
- Approach:
  - Keep `README.md` and `README.zh-CN.md` as distribution entry points, not complete manuals.
  - Store English pages under `docs/en/` and Simplified Chinese pages under `docs/zh-CN/` with identical relative paths.
  - Use VitePress only as a presentation layer over those Markdown files.
  - Keep versioned release and migration documents in their current paths and expose them through site navigation without duplicating their contents.
- Boundaries:
  - Existing Skills, Specs, fallback rules, generated files, archived evidence, and source behavior remain authoritative and unchanged.
  - User documentation may explain those contracts but must not add or weaken authority.
  - GitHub Pages publication remains a separately authorized follow-up; this Change produces a locally buildable site only.
- Affected areas:
  - `README.md` and `README.zh-CN.md`
  - `docs/en/`, `docs/zh-CN/`, and existing maintainer/versioned documentation links
  - `docs/.vitepress/`, repository scripts, dependencies, and focused documentation tests
- Constraints:
  - Preserve canonical headings, commands, identifiers, paths, configuration values, and authority boundaries.
  - Avoid translating canonical CLI output or artifact protocol tokens.
  - Keep the npm package runtime independent from documentation-site dependencies.

## Tasks
- [x] Create the bilingual task-oriented documentation pages from current README content.
- [x] Rewrite both READMEs as concise, structurally equivalent entry points.
- [x] Configure the VitePress bilingual site and local search.
- [x] Add deterministic bilingual-page and internal-link verification.
- [x] Run documentation checks, build, repository lint, and relevant tests.
- [x] Record the stable documentation and distribution boundary in `.rsp/specs/distribution.md`.

## Verify
- Automated:
  - [x] `mise exec -- pnpm run docs:check` — passed; 7 bilingual page pairs and 27 Markdown files have required pairs and valid internal targets.
  - [x] `mise exec -- pnpm run docs:build` — passed; VitePress 1.6.4 built all static pages after the locale correction.
  - [x] `mise exec -- pnpm run lint` — passed; repository ESLint is clean with the added configuration and script.
  - [x] `mise exec -- pnpm run test` — passed; 54 files and 630 tests preserve existing RSP behavior and documentation contracts.
- Manual or environment:
  - [x] Inspected generated `/` and `/zh-CN/` entry HTML; each has the expected locale, navigation, sidebar, local-search surface, and reciprocal language link.
- Coverage:
  - README onboarding, bilingual route parity, internal links, site generation, and regression coverage for unchanged RSP behavior.

## Blockers
- none
