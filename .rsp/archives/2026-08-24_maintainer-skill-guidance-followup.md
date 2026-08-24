---
kind: "refactor"
---

# Change: maintainer-skill-guidance-followup

## Proposal
- Outcome: Maintainer Skill guidance captures the accepted conditional-loading, semantic-contract, and provider-observability rules from the completed Skill context optimization work.
- Why:
  - The mechanisms are proven in product Skills and release evidence but are not yet available to future Skill authors or release-acceptance operators.
- Scope:
  - Refine `author-rsp-skills` authoring/evaluation guidance and `release-acceptance` provider evidence interpretation, with focused maintainer contract tests.
- Non-goals:
  - Reopening the archived Group, changing provider execution/scoring, exposing evaluator metadata shapes, or running a new provider campaign.

## Spec
### MODIFIED
- Requirement: Skill authoring guidance preserves explicit classification gates and semantic contract evidence while release acceptance keeps unavailable host observations explicit.
  - Branch references load only after the entrypoint fixes authority and completes any classification required to choose that branch; authority-only inputs do not activate detailed pipelines.
  - Replaceable prose uses structural semantic assertions plus representative negative mutations, while exact assertions remain for stable protocol values and critical denials.
  - Missing final, resource-event, first-fix, or similar provider observations remain explicit omissions unless they leave a declared hard dimension or required structured evidence unevaluable.

### Acceptance
#### Scenario: Future maintainer guidance preserves proven boundaries
- GIVEN an RSP Skill candidate or provider-backed release report
- WHEN the maintainer follows the matching Skill guidance
- THEN conditional loading, semantic contract evidence, and missing-observation interpretation retain their established authority and fail-closed boundaries

## Design
- Approach:
  - Add concise rules to the existing owning references and provider interpretation section, then protect them with deterministic contract tests.
- Boundaries:
  - Keep scripts responsible for metadata schemas and scoring mechanics; do not duplicate product Skill prose.
- Affected areas:
  - `.agents/skills/author-rsp-skills/references/{authoring,evaluation}.md`
  - `.agents/skills/release-acceptance/SKILL.md` and maintainer Skill contract tests
- Constraints:
  - Preserve report-only audit boundaries, provider hard dimensions, and separate Git/publication authority.

## Tasks
- [x] Add classification-gated progressive-disclosure and semantic-test guidance to `author-rsp-skills`.
- [x] Add explicit provider observability-omission interpretation to `release-acceptance`.
- [x] Add focused contract tests and run repository verification.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/tooling/author-rsp-skills.test.ts test/tooling/release-acceptance-skill.test.ts --reporter=dot --no-file-parallelism` — passed 2 files / 7 tests; proves classification-gated loading, semantic evidence, negative mutation, and provider omission interpretation.
  - [x] `node .agents/skills/author-rsp-skills/scripts/scan-skill-context.mjs --root . --json` — both maintainer packages have complete reachable Markdown with no unreachable resources.
  - [x] `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm run build` — passed.
  - [x] `mise exec -- pnpm exec vitest run --no-file-parallelism --reporter=dot` — passed 91 files / 886 tests.
### Optional
- Manual or environment:
  - [x] none
- Coverage:
  - No provider run is required because execution, scoring, fixtures, and candidate Skill composition are unchanged.

## Blockers
- none
