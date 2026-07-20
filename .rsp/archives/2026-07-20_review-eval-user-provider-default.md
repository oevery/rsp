---
kind: "fix"
---

# Change: review-eval-user-provider-default

## Proposal
- Summary: Use the user's configured model provider by default in rsp-review evaluation
- Why:
  - Defaulting to `--ignore-user-config` silently routes evaluation through the built-in OpenAI provider and can consume the wrong account quota.
- Scope:
  - Load user configuration by default, retain explicit `--provider <id>` selection, and add `--isolated` for runs that intentionally ignore user configuration.
- Non-goals:
  - Copying, printing, hashing, or persisting provider credentials or private endpoints.

## Spec
### MODIFIED
- Requirement: provider selection defaults
  - A run without provider flags uses the provider resolved from the user's Codex configuration.
  - `--provider <id>` selects a named user-config provider; `--isolated` ignores user configuration; the two options are mutually exclusive.
  - Run and matrix metadata distinguish user-config and isolated execution without retaining credentials.

### Acceptance
#### Scenario: default follows the user provider
- GIVEN Codex user configuration selects a third-party provider
- WHEN an evaluation starts without `--provider` or `--isolated`
- THEN it loads user configuration and records `config_source: user`

#### Scenario: isolation remains explicit
- GIVEN a maintainer needs a provider-independent run
- WHEN evaluation starts with `--isolated`
- THEN it passes `--ignore-user-config` and records `config_source: isolated`

## Design
- Approach:
  - Centralize provider argument validation, invert the current default, and cover default, explicit-provider, isolated, and conflicting modes with the fake Codex executable.
- Affected areas:
  - `scripts/rsp-review-eval.mjs`, `scripts/rsp-review-eval.d.mts`, and `test/skill-behavior.test.ts`
- Constraints:
  - Do not change candidate behavior or reinterpret the already committed evaluation matrix.

## Tasks
- [x] Implement the small change
- [x] Verify the result

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skill-behavior.test.ts`
  - [x] `mise exec -- pnpm run typecheck`
  - [x] `mise exec -- pnpm run lint`
  - [x] `mise exec -- pnpm run test`
  - [x] `node dist/cli.mjs check --focused`
- Manual:
  - [x] Confirm CLI usage presents user-config default, explicit provider, and isolated modes without exposing config values
- Durable updates:
  - [x] Decide whether this change produced durable knowledge that belongs in ".rsp/specs/" or stable instructions that belong in the nearest project-owned "AGENTS.md"
  - [x] If yes, write only stable facts to the smallest correct target file before archive

## Blockers
- none
