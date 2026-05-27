---
kind: "feature"
---

# Change: rsp-roadmap-agent-readiness

## Proposal
- Summary: Improve RSP agent readiness and archive guidance
- Why:
  - RSP already has a strong single-file change model, but agents need clearer pre-archive signals and focused context loading.
  - OpenSpec users may misread RSP delta markers as an automatic spec merge mechanism, creating wrong archive expectations.
  - The current change template can guide behavior specification more strongly without adopting OpenSpec's multi-file artifact model.
- Scope:
  - Clarify that RSP does not automatically merge `ADDED` / `MODIFIED` / `REMOVED` sections into durable specs.
  - Add a deterministic archive-readiness check through `rsp ready <name>` or `rsp archive --dry-run`.
  - Add focused validation through `rsp check --focused`.
  - Add context-oriented inspection through `rsp show <name|--focused> --json`.
  - Strengthen the change `Spec` template so it favors observable behavior and acceptance scenarios.
- Non-goals:
  - Do not introduce multi-file change bundles.
  - Do not add OpenSpec-style automatic delta spec merging.
  - Do not add workflow schemas, profiles, workspace coordination, or dashboard/TUI functionality.
  - Do not make archive blocking; archive may continue to warn without preventing the move.

## Spec
### ADDED
- Requirement: explicit non-merge delta guidance
  - RSP documentation and agent guidance MUST state that change `Spec` delta markers are planning aids only and are not automatically merged into `.rsp/specs/` by `rsp archive`.

- Requirement: archive readiness preview
  - RSP SHALL provide a deterministic pre-archive preview for a named change that reports incomplete tasks, incomplete verify items, active blockers, and missing scenario blocks without moving the change.

- Requirement: focused change checking
  - RSP SHALL support checking only currently focused changes so agents can validate current work without unrelated open changes affecting the result.

- Requirement: context inspection
  - RSP SHALL provide a read-only show command that returns a named or focused change's path, kind, focus state, progress, blockers, scenario count, deterministic readiness signals, and relevant context paths in JSON.

- Requirement: behavior-first change specs
  - New change templates SHALL guide authors to write observable behavior, requirements, and acceptance scenarios in `## Spec` rather than implementation notes.

### MODIFIED
- Requirement: archive workflow remains semantic-light
  - Archive readiness output MUST remain deterministic and MUST NOT decide whether durable knowledge should be promoted to `.rsp/specs/` or `.rsp/rules/`; that semantic decision remains owned by the RSP skill or a human reviewer.

- Requirement: core model remains single-file
  - All five optimizations MUST preserve the single-file change model and fixed six-section structure.

### REMOVED
- none

### Acceptance
#### Scenario: OpenSpec-style delta confusion is avoided
- GIVEN a user reads RSP guidance after seeing `ADDED`, `MODIFIED`, or `REMOVED` in a change file
- WHEN they review archive behavior
- THEN the guidance states that `rsp archive` does not automatically merge those sections into durable specs
- AND durable writeback remains an explicit semantic decision

#### Scenario: agent previews archive readiness
- GIVEN `.rsp/changes/example.md` contains incomplete tasks or verify items
- WHEN an agent runs `rsp ready example` or `rsp archive --dry-run example`
- THEN the command reports the incomplete deterministic items
- AND the change remains in `.rsp/changes/`
- AND the focus marker is not removed

#### Scenario: focused validation ignores unrelated open changes
- GIVEN one focused change and one unrelated unfocused open change
- WHEN an agent runs `rsp check --focused`
- THEN only the focused change is validated
- AND diagnostics from the unfocused change do not fail the focused check

#### Scenario: focused context is machine readable
- GIVEN exactly one focused change exists
- WHEN an agent runs `rsp show --focused --json`
- THEN the output includes the focused change path, kind, progress, blocker status, scenario count, and recommended RSP context paths

#### Scenario: new changes encourage behavior-first specs
- GIVEN a user creates a new RSP change
- WHEN the generated template is reviewed
- THEN the `## Spec` section prompts for observable behavior and acceptance scenarios
- AND implementation strategy remains in `## Design`

## Design
- Approach:
  - Keep the implementation incremental and CLI-first.
  - Prefer read-only or dry-run commands over new lifecycle states.
  - Reuse existing deterministic helpers where possible, especially archive checklist, checkbox counting, blocker detection, scenario parsing, focus lookup, and JSON output utilities.
- Affected areas:
  - `rules/rsp-rules.md` and `skills/rsp/SKILL.md` for archive/delta clarification and durable-decision boundaries.
  - `README.md`, `README.zh-CN.md`, and `docs/design-philosophy.md` for user-facing positioning and OpenSpec contrast where appropriate.
  - `src/commands/archive.ts` or a new `src/commands/ready.ts` for dry-run readiness reporting.
  - `src/commands/check.ts` and `src/cli.ts` for `rsp check --focused`.
  - A new `src/commands/show.ts` plus `src/cli.ts` for `rsp show <name|--focused> --json`.
  - `src/core/helpers.ts` and related tests for behavior-first template wording.
  - `test/` coverage for new CLI flags, JSON output, and template expectations.
- Constraints:
  - Do not add new lifecycle states beyond `open` and `archived`.
  - Do not treat readiness as archive approval.
  - Do not promote task history or temporary implementation notes into durable specs or rules.
  - Do not make `Spec` section structure project-configurable.
  - Preserve existing command behavior unless a new flag is explicitly used.

## Tasks
- [x] Clarify in rules, skill, and README that RSP delta markers do not trigger automatic durable spec merging.
- [x] Implement `rsp ready <name>` using deterministic archive readiness checks without moving files or clearing focus.
- [x] Implement `rsp archive --dry-run <name>` as an alias for readiness preview from archive.
- [x] Implement `rsp check --focused` so only focused changes are validated when requested.
- [x] Implement `rsp show <name|--focused> --json` for machine-readable context loading.
- [x] Update change templates so `## Spec` explicitly asks for observable behavior, requirements, and acceptance scenarios.
- [x] Add or update tests for delta guidance, readiness preview, focused checks, show JSON output, and template wording.
- [x] Update README CLI reference and Chinese README after command behavior is finalized.

## Verify
- Automated:
  - [x] `pnpm run build`
  - [x] `pnpm run lint`
  - [x] `pnpm run test`
  - [x] `node dist/cli.mjs check --focused` (validates only focused changes)
  - [x] `node dist/cli.mjs show --focused --json` (machine-readable focused context)
  - [x] `node dist/cli.mjs ready rsp-roadmap-agent-readiness` (readiness preview without archiving)
  - [x] `node dist/cli.mjs archive --dry-run rsp-roadmap-agent-readiness` (archive dry-run)
- Manual:
  - [x] Verified `rsp ready` reports warnings for incomplete changes without archiving them.
  - [x] Verified `rsp check --focused` ignores unfocused changes (tested in integration tests).
  - [x] Reviewed generated change templates — `## Spec` includes behavior-first HTML comment guidance, `## Design` remains for implementation.
  - [x] Reviewed documentation — delta non-merge guidance is explicit in rules, skill, and README.
- Durable updates:
  - [x] Decide whether this change produced durable knowledge that belongs in `.rsp/specs/` or `.rsp/rules/`: yes — CLI guidance and archive/delta semantics belong in rules and README; repository-specific bundled-rule workflow belongs in `.rsp/rules/project-rules.md`.
  - [x] If yes, write only stable facts to the smallest correct target file before archive; do not promote task history, debugging notes, or one-off implementation context. Updated `rules/rsp-rules.md`, synced `.rsp/rules/rsp-rules.md` via `node dist/cli.mjs update`, and added `.rsp/rules/project-rules.md` for the local workflow rule.

## Blockers
- none
