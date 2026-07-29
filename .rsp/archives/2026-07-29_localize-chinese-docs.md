---
kind: docs
---

# Change: localize-chinese-docs

## Proposal
- Outcome: Localize Chinese documentation prose without translating protocol identities
- Why:
  - `README.zh-CN.md` and every page under `docs/site/zh-CN/` currently mix Chinese prose with avoidable English headings, sentences, and explanatory vocabulary.
  - The mixed language makes the Chinese entry path harder to scan even though an independent English README and English documentation tree already exist.
- Scope:
  - Translate natural-language prose, headings, diagrams, examples, labels, and explanatory link text in `README.zh-CN.md` and `docs/site/zh-CN/` into idiomatic Simplified Chinese.
  - Keep the Chinese README and all seven Chinese public pages semantically aligned with their English counterparts and current RSP behavior.
  - Establish and apply one consistent localization boundary for protocol identities and technical literals.
- Non-goals:
  - Do not translate or otherwise edit `README.md` or `docs/site/en/`.
  - Do not localize commands, options, paths, configuration keys or values, WorkRefs, Skill names, code identifiers, machine values, or canonical artifact headings such as `Proposal`, `Spec`, `Design`, `Tasks`, `Verify`, and `Blockers`.
  - Do not change RSP behavior, website information architecture, migration records, release notes, or maintainer documents.

## Spec
### ADDED
- Requirement: Chinese user-facing prose is idiomatic and does not rely on unnecessary English vocabulary.
  - Retained English must identify a product name, acronym, protocol token, code/configuration literal, command surface, path, Skill, WorkRef, or canonical heading.
  - A retained technical term may receive a concise Chinese explanation where that improves comprehension without changing its identity.
- Requirement: Localization preserves the current meaning, links, commands, and documented authority boundaries.
  - Chinese pages remain paired with the same seven English public pages.
  - Examples that are human-authored prose use Chinese; executable syntax and exact machine values remain unchanged.

### Acceptance
#### Scenario: Read the Chinese documentation path
- GIVEN a reader opens `README.zh-CN.md` or a page under `docs/site/zh-CN/`
- WHEN they read headings, paragraphs, diagrams, example descriptions, and navigation labels
- THEN natural-language content is written in idiomatic Simplified Chinese while exact technical identities remain recognizable and unchanged

#### Scenario: Validate the bilingual documentation site
- GIVEN the localized Chinese sources and unchanged English sources
- WHEN documentation checks and the VitePress build run
- THEN all seven language pairs, internal links, and generated public routes remain valid

## Design
- Approach:
  - Translate at sentence level instead of replacing individual English tokens mechanically.
  - Prefer stable Chinese terms such as “当前工作”, “持久化事实”, “验收条件”, “验证”, “归属位置”, and “生命周期”; retain canonical identities in backticks or alongside the Chinese phrase only where precision requires them.
  - Keep exact protocol vocabulary when the documentation explicitly teaches that vocabulary, including Change, Spec, Decision Record, Manage, Skill, and the canonical Change section headings.
- Boundaries:
  - The Chinese source tree owns Chinese explanatory prose; the English source tree remains the independent English entry.
  - `scripts/docs-check.mjs` continues to own bilingual pairing and repository-wide link validation; this Change does not add a brittle natural-language lint rule.
- Affected areas:
  - `README.zh-CN.md`
  - `docs/site/zh-CN/`
  - `test/helpers.test.ts` assertions that protect the localized documentation contract
- Constraints:
  - Preserve Markdown structure, frontmatter keys, links, code fences, commands, paths, configuration snippets, and observable documentation behavior.
  - Avoid introducing a second glossary or durable authority surface; apply the localization boundary directly and consistently in the user documentation.

## Tasks
- [x] Localize natural-language prose in `README.zh-CN.md`.
- [x] Localize natural-language prose in all seven pages under `docs/site/zh-CN/`.
- [x] Compare the Chinese pages with the English pages and current authority to prevent semantic drift.
- [x] Update exact Chinese documentation assertions without weakening their behavioral coverage.
- [x] Run documentation checks, build the site, and inspect the final mixed-language boundary.
- [x] Complete a fixed-scope document review and durable decision.

## Verify
- Automated:
  - [x] `mise exec -- pnpm run docs:check` — proves: bilingual pairing and repository-wide Markdown links remain valid.
  - [x] `mise exec -- pnpm run docs:build` — proves: VitePress accepts the localized Markdown and generates the public site.
  - [x] `mise exec -- node dist/cli.mjs check --focused --json --compact` — proves: the Change remains structurally valid and reports no blockers.
  - [x] `mise exec -- pnpm run test` — proves: repository documentation contracts accept the localized Chinese prose without losing their guarded semantics.
- Manual or environment:
  - [x] Review every retained English phrase in the Chinese surfaces against the declared localization boundary.
  - [x] Compare headings, commands, links, and authority claims with the English pair and current repository behavior.
- Coverage:
  - Chinese README and all seven paired Chinese public pages; English sources are comparison evidence only.

## Blockers
- none
