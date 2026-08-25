---
kind: feature
---

# Change: config-inspection-command

## Proposal
- Outcome: Add a narrow read-only config projection for effective project settings
- Why:
  - Give Skills and operators a small, deterministic source of effective project configuration without scanning the complete work tree.
- Scope:
  - Add `rsp config` and `rsp config --json` as read-only commands, with `--compact` as the JSON presentation modifier.
  - Project effective kinds, Decision Records path, language, and Manage values with stable diagnostics.
  - Remove duplicated Manage and language projections from `rsp status`; keep configuration inspection in `rsp config`.
  - Add command routing, JSON/plain presentation, documentation, and focused tests.
- Non-goals:
  - Do not mutate `.rsp/config.yaml`.
  - Do not expose response-language settings or add Git/commit authority.
  - Do not change status work-state fields, filters, dependency planning, archive trend, or invalid configuration diagnostics.

## Spec
### ADDED
- Requirement: The command reads only the project configuration and does not inspect Changes, focus markers, dependency graphs, archives, or Git state.
  - Invalid or unreadable configuration fails closed with the existing configuration diagnostic shape.
- Requirement: Plain output shows the config path, validity, and effective durable settings concisely.
  - Effective commit language must be visible when configured through `language.default` inheritance.
- Requirement: JSON output is deterministic and machine-readable.
  - Successful JSON returns a single-layer effective summary for kinds, Decision Records path, Manage, and durable language; invalid configuration keeps the stable diagnostic result.

### Acceptance
#### Scenario: Read effective language configuration without work-tree state
- GIVEN a valid `.rsp/config.yaml` with `language.default: zh-CN` and no explicit language overrides
- WHEN `rsp config --json` is executed in a project with no Changes or with unrelated invalid work files
- THEN the command succeeds and reports effective `artifacts: zh-CN` and `commit: zh-CN` without reporting work-tree diagnostics

#### Scenario: Keep status focused on work state
- GIVEN a valid project configuration
- WHEN `rsp status --json` and `rsp status --verbose` are executed
- THEN status omits effective Manage and language projections while retaining work-state output

#### Scenario: Preserve status configuration diagnostics
- GIVEN an invalid `.rsp/config.yaml`
- WHEN `rsp status --json` is executed
- THEN status reports `invalid_config` without projecting Manage or language values

## Design
- Approach:
  - Reuse the existing config inspection and effective-policy resolvers, then add a presentation-neutral config result and a dedicated CLI command.
- Boundaries:
  - Configuration inspection is independent from project status inspection.
  - The command is read-only; it grants no lifecycle, product, Git, or publication authority.
- Affected areas:
  - CLI command registry and presenters.
  - Config inspection/projection types and tests.
  - CLI contracts and Chinese/English configuration reference documentation.
- Constraints:
  - Preserve status work-state output and effective language semantics while making `rsp config` the single configuration summary entry point.
  - Keep canonical command names, keys, paths, and machine values stable.
  - Default plain output must remain concise; `--json` is the canonical automation surface.

## Tasks
- [x] Define the config projection and isolated command execution path.
- [x] Register only `rsp config` and `rsp config --json`, with JSON limited to the effective summary and optional compact presentation.
- [x] Add focused tests for effective inheritance, invalid config, and isolation from invalid work-tree state.
- [x] Update CLI contracts and configuration reference documentation.
- [x] Run build, typecheck, lint, focused tests, and the full test suite.
- [x] Remove duplicated configuration projections from status and refresh the frozen status CLI oracles.

## Verify
### Required
- Automated:
  - [x] Config command tests pass — proves: effective projection, deterministic JSON, invalid-config handling, and work-tree isolation.
  - [x] Status boundary and CLI equivalence tests pass — proves: status no longer duplicates valid configuration while preserving diagnostics and public work-state output.
  - [x] Build/typecheck/lint/full test suite pass — proves: integration with the packaged CLI and no regressions.
### Optional
- Manual or environment:
  - [x] Run `rsp config`, `rsp config --json`, and `rsp config --json --compact` against the repository configuration — proves: concise human output and lightweight machine output.
- Coverage:
  - Browser, Broker, SQLite, remote services, Git delivery, and publication are out of scope.

## Blockers
- none
