---
kind: "fix"
---

# Change: fix-review-output-and-eval-runner

## Proposal
- Summary: Remove an unsafe one-off diagnosis runner and make review-facing Skill output follow the user's language without destabilizing protocol tokens.
- Why:
  - `test/rsp-diagnose/run-forward.mjs` copies a provider section from the user's Codex config into a repository cache path and may leave credentials or headers behind after interruption.
  - `rsp-review` and `rsp-address-review` present fixed English report templates even when the user and project conversation use another language.
- Scope:
  - Delete the unreferenced one-off runner.
  - Define a concise localization rule for human-facing review and review-resolution output while preserving stable identifiers and enums.
  - Add contract coverage and record the stable behavior in the design Spec.
- Non-goals:
  - Rebuilding the historical forward-evaluation harness or changing review semantics.
  - Translating paths, commands, code identifiers, WorkRefs, severity labels, or machine-consumed enum values.

## Spec
<!-- Describe expected correct behavior. Implementation notes belong in ## Design. -->
### MODIFIED
- Requirement: review-related Skills produce localized human-facing output without exposing local provider configuration.
  - Human-facing headings, labels, explanations, and verdict prose follow an explicitly requested language, then nearest project instructions, then the conversation language.
  - Stable technical tokens remain unchanged so reports continue to compose deterministically.
  - Published test and evaluation sources do not copy a user's provider configuration into repository-local cache files.

### Acceptance
#### Scenario: a Chinese conversation requests review
- GIVEN no different output language is explicitly requested or required by nearer project instructions
- WHEN `rsp-review` or `rsp-address-review` returns a human-facing report or handoff
- THEN human-facing headings, labels, explanations, and conclusions use Chinese
- AND paths, commands, WorkRefs, severity labels, and result/disposition enums remain canonical

#### Scenario: diagnosis evaluation sources are inspected
- GIVEN the repository is prepared for commit or packaging
- WHEN tracked and untracked test helpers are reviewed
- THEN no helper reads a broad user provider configuration and writes it into repository-local cache state

## Design
- Approach:
  - Remove the unused runner rather than hardening a non-product harness with its own configuration parser and secret lifecycle.
  - Treat the existing English report shapes as semantic field order, not mandated wording, and add one explicit language-precedence rule to each review-related Skill.
- Affected areas:
  - `test/rsp-diagnose/run-forward.mjs`
  - `skills/rsp-review/SKILL.md`, `skills/rsp-address-review/SKILL.md`
  - `test/skill-contract.test.ts`, `.rsp/specs/design.md`
- Constraints:
  - Preserve canonical pipeline results (`issues_found`, `clean`, `skipped`, `blocked`) and finding dispositions (`accepted`, `rejected`, `needs-clarification`).
  - Preserve all existing review authority, mutation, re-review, and completion boundaries.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Delete the unsafe unreferenced diagnosis runner
- [x] Localize human-facing review and review-resolution output while preserving stable technical tokens
- [x] Add focused contract coverage and update the durable design Spec
- [x] Run focused and project-required verification, then self-review the fixed scope

## Verify
- Automated:
  - [x] `mise exec -- pnpm vitest run test/skill-contract.test.ts test/rsp-address-review-contract.test.ts test/rsp-diagnose-skill-contract.test.ts`
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run lint && mise exec -- pnpm run test`
  - [x] `node dist/cli.mjs check && git diff --check`
- Manual:
  - [x] Inspect the fixed Skill clauses and confirm human labels are localizable while canonical tokens remain unchanged.
  - [x] Confirm no executable repository source still references or reproduces the removed provider-copy runner.
- Durable updates:
  - [x] Decide whether this change produced durable knowledge that belongs in `.rsp/specs/` or stable instructions that belong in the nearest project-owned `AGENTS.md`
  - [x] If yes, write only stable facts to the smallest correct target file before archive; do not promote task history, debugging notes, or one-off implementation context

## Blockers
- none
