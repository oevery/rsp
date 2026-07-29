---
kind: docs
---

# Change: separate-public-docs-from-repository-records

## Proposal
- Outcome: Separate public documentation pages from repository-only records
- Why:
  - VitePress currently builds every Markdown file below `docs/`, so maintainer rationale, upstream instructions, migrations, and release records become public pages and search results even when they are not part of the bilingual guide.
  - The Chinese site links to English-only version records, weakening the documented bilingual page boundary.
  - Directory ownership should distinguish public guidance from repository and release records without duplicating content.
- Scope:
  - Move the paired English and Simplified Chinese guide into `docs/site/` and make it the only VitePress source root.
  - Move maintainer-only `design-philosophy.md` and `upstreams.md` into `docs/maintainers/`.
  - Keep `docs/migrations/` and `docs/releases/` at their existing release-owned paths, but exclude them from site generation, navigation, and search.
  - Update README links, deterministic documentation checks, tests, and durable repository facts for the new ownership boundary.
- Non-goals:
  - Do not rewrite migration, release, design-philosophy, or upstream content beyond path-relative links required by the move.
  - Do not change CLI, Skill, release, or upstream-research behavior.
  - Do not publish or deploy the site.

## Spec
### ADDED
- Requirement: The public documentation build consumes only bilingual user guidance.
  - English and Simplified Chinese pages retain matching relative routes beneath `docs/site/`.
  - Generated routes and local-search entries exclude repository-only maintainer, migration, and release records.
- Requirement: Repository records retain explicit owners and discoverability.
  - Migration and release paths remain stable for existing release tooling.
  - Maintainer documents live under `docs/maintainers/` and remain linked from the READMEs.
- Requirement: Documentation validation distinguishes public-site parity from repository-wide link integrity.
  - Bilingual pairing applies only to `docs/site/en/` and `docs/site/zh-CN/`.
  - Internal-link validation continues across READMEs and every tracked Markdown file under `docs/`.

### Acceptance
#### Scenario: Build the public documentation site
- GIVEN the repository contains public guides and repository-only records under `docs/`
- WHEN `pnpm docs:build` runs
- THEN only the paired guide routes are generated and indexed

#### Scenario: Read repository-only records
- GIVEN a maintainer starts from either README
- WHEN they follow a migration, release, design-philosophy, or upstream link
- THEN the tracked repository file remains reachable without being part of the public site

#### Scenario: Validate documentation ownership
- GIVEN a public locale page pair or any internal Markdown target is missing
- WHEN `pnpm docs:check` runs
- THEN it fails with the missing public pair or broken repository link

## Design
- Approach:
  - Set VitePress `srcDir` to `docs/site/` while keeping configuration and generated output under `docs/.vitepress/`.
  - Move current `docs/en/` and `docs/zh-CN/` trees to `docs/site/en/` and `docs/site/zh-CN/`; preserve the English-root rewrite and `/zh-CN/` routes.
  - Remove the migration navigation item so the site exposes only Start, Guides, and Reference.
  - Move maintainer documents with `git mv` and update every tracked path consumer.
- Boundaries:
  - `docs/migrations/` and `docs/releases/` remain package-facing release records and keep their current paths.
  - README remains the repository-level index for public guides, version records, and maintainer material.
  - VitePress remains a presentation layer with no content database or runtime service.
- Affected areas:
  - `docs/site/`, `docs/maintainers/`, and `docs/.vitepress/config.mts`
  - `README.md`, `README.zh-CN.md`, `scripts/docs-check.mjs`, and documentation-contract tests
  - `.rsp/specs/design.md` and `.rsp/specs/distribution.md`
- Constraints:
  - Preserve release tooling paths and canonical documentation semantics.
  - Keep all generated VitePress output ignored.
  - Avoid compatibility redirects because no site has been published or deployed.

## Tasks
- [x] Move public locale pages under `docs/site/` and maintainer material under `docs/maintainers/`.
- [x] Restrict VitePress navigation, generation, and search to public-site sources.
- [x] Update README, checker, test, and durable Spec references.
- [x] Verify public route inventory, bilingual parity, repository links, and repository regression checks.

## Verify
- Automated:
  - [x] `mise exec -- pnpm run docs:check` — passed with 7 bilingual page pairs and 27 checked Markdown files.
  - [x] `mise exec -- pnpm run docs:build` — passed with VitePress 1.6.4.
  - [x] Inspect generated HTML paths and local-search chunks — emitted only 7 English and 7 Simplified Chinese guide routes plus `404.html`; maintainer, migration, and release names were absent.
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run typecheck && mise exec -- pnpm run lint && mise exec -- pnpm run test` — passed; 54 test files and 630 tests passed.
- Manual or environment:
  - [x] Started the local VitePress preview and inspected English and Simplified Chinese route responses and navigation; public routes returned 200, while maintainer, migration, and release routes returned 404. Generated local-search indexes contain only public guide route keys.
- Coverage:
  - Public-site source isolation, bilingual routes, repository record reachability, link integrity, and unchanged release/upstream behavior.

## Blockers
- none
