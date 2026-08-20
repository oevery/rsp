---
kind: "refactor"
---

# Change: skill-symbol-semantics-normalization

## Proposal
- Outcome: Make symbol usage across the authored and maintainer Skill entrypoints semantically consistent without expanding prose or changing workflow authority.
- Why: `/`, `|`, `&`, `→`, `:`, and list syntax currently mix compact labels, alternatives, and ordinary prose; ambiguous use increases interpretation cost even when the underlying contract is unchanged.
- Scope:
  - Normalize all authored `skills/*/SKILL.md` entrypoints and the three maintainer entrypoints under `.agents/skills/`.
  - Keep paths, Markdown links, established paired labels, canonical values, and tables unchanged unless the symbol is semantically ambiguous.
  - Add one maintainer rule describing when prose, `|`, `/`, `→`, `:`, and lists are appropriate.
  - Apply the normalization on top of the current `manage-execution-path-optimization` candidate and validate the resulting combined Skill composition.
- Non-goals:
  - No intended change to routing ownership, activation semantics, authority, stop dispositions, lifecycle ownership, or runtime behavior. Frontmatter descriptions may change only when deterministic routing remains green.
  - No broad rewrite of references or generated projections.
  - No mechanical replacement of every slash or textual `or`.

## Spec
### MODIFIED
- Requirement: Use English words for ordinary conjunctions and alternatives in explanatory prose.
- Requirement: Use `|` only for a closed set of canonical alternatives or protocol values.
- Requirement: Use `/` only for an established paired term or compact label whose two components are jointly named; otherwise expand it to `and` or `or`.
- Requirement: Use `→` only for a compact process summary, `:` for a field/label boundary, and Markdown lists for independent items.
- Requirement: Preserve Markdown paths, links, tables, code identifiers, and established technical pairs such as `request/response`, `input/output`, `base/ours`, and `baseline/candidate`.

### Acceptance
#### Scenario: Canonical alternatives
- GIVEN a finite protocol or enum choice
- WHEN the Skill presents the allowed values
- THEN it uses backticked values joined by `|` and does not introduce a new value.

#### Scenario: Explanatory prose
- GIVEN a sentence describing joint or alternative concepts
- WHEN no established paired label applies
- THEN it uses `and` or `or` unless the phrase is an established paired label.

#### Scenario: Projection and contract safety
- GIVEN authored Skill sources and their `.agents/skills` projections
- WHEN symbol semantics are normalized
- THEN projections remain symlinks, links and paths remain valid, and existing contract/security/acceptance checks remain green.

## Design
- Apply a bounded semantic pass to ambiguous slash compounds and centralize the rule in `author-rsp-skills`; do not create a new lint rule that would reject valid established pairs.
- Keep existing compact flow summaries and mapping tables where they improve scanning.
- Treat line/word reduction as diagnostic only; correctness is contract preservation.

## Tasks
- [x] Snapshot corpus and projection state: 13 published and 3 maintainer canonical packages; published `.agents/skills/rsp*` entries remain symlink projections.
- [x] Normalize ambiguous symbols in authored and maintainer Skill entrypoints.
- [x] Add the maintainer symbol-semantics rule.
- [x] Run Skill security, metadata, docs, focused contracts, typecheck, lint, and full release acceptance.
- [x] Review the exact diff and re-check projection reachability.

## Verify
### Required
- Automated:
  - [x] `node dist/cli.mjs check` — 2 open Changes valid.
  - [x] Focused Skill and managed-controller contracts — 19 files and 178 tests passed.
  - [x] Deterministic Skill routing — 13 published Skills, no failed cases, no description collisions.
  - [x] `mise exec -- pnpm run release:acceptance` — passed on 2026-08-20: 9/9 stages, 86/86 files, 860/860 tests, and packed installed-package workflows. Report: `.cache/release-acceptance/20260820T003524262Z-a8fc9ba4ff-36544/report.md`.
  - [x] Skill security — 40 files, 0 findings; metadata, docs, build, typecheck, lint, and `git diff --check` passed inside the acceptance campaign or focused checks.
- Manual:
  - [x] Canonical values, established technical pairs, links, paths, and authority boundaries remain unchanged; exact contract-owned slash phrases were retained after focused tests identified them.
  - [x] Fixed-scope Code and Document re-review — clean; published projections remain symlinks, one exact-text assertion was synchronized, and no semantic symbol replacement changed workflow behavior.
  - Coverage: deterministic lexical routing does not prove host- or provider-specific trigger behavior; this Change makes no provider-general routing claim.

## Blockers
- none
