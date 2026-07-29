---
kind: feature
---

# Change: issue-linked-changes

## Proposal
- Outcome: Let each Change own validated external issue relationships so issue-originated work remains traceable from shaping through local commit construction.
- Why:
  - Repeating issue URLs, titles, and closing intent across Change creation and commit preparation adds avoidable friction and makes delivery relationships easy to omit or invent.
  - AI-assisted issue retrieval is useful when available, but RSP must remain usable when network access, authentication, or provider-specific integrations are unavailable.
- Scope:
  - Add structured `issues` frontmatter with repeatable URL plus `relates` or `closes` relationships.
  - Let `rsp create` attach one issue without network access and validate all authored issue metadata fail closed.
  - Expose issue relationships through current-work and archive read surfaces needed for traceability and commit preparation.
  - Teach Shape to retrieve real issue content opportunistically and degrade to login retry, pasted source data, or a link-only Change without fabricating source content.
  - Teach Commit to project truthful issue references and provider-supported closing keywords only from an owned terminal `closes` relationship.
- Non-goals:
  - Provider API adapters, credentials, browser automation, or model calls inside the CLI.
  - Treating issue content as project authority, automatically copying it into Specs, or persisting retrieval/controller state.
  - Closing, editing, commenting on, or otherwise mutating an external issue.
  - Inferring a Change owner from changed files when focus or managed ownership is ambiguous.

## Spec
### ADDED
- Requirement: A Change may declare zero or more external issue relationships in YAML frontmatter.
  - `issues` is a list of mappings with exactly one absolute `http` or `https` `url` and one `relation` value: `relates` or `closes`.
  - Duplicate normalized URLs, credentials in URLs, fragments, unsupported fields, invalid shapes, and unsupported relations fail `rsp check` visibly.
  - Existing Changes without `issues` remain valid.
  - Immutable archives with absent or non-v1 `issues` metadata remain readable as legacy history and omit issue projection; open Changes remain subject to strict `rsp check` validation.
- Requirement: Change creation can record a source issue without remote access.
  - `rsp create <name> [summary] --issue <url>` writes one `relates` relationship by default.
  - `--issue-relation closes` records explicit closing intent and is invalid without `--issue`.
  - Creation validates input before any Change or focus mutation.
  - Supplying issue options for an existing Change fails explicitly without updating the Change or focus.
- Requirement: Read surfaces preserve issue traceability.
  - `rsp status --json`, `rsp show --json`, and `rsp history --json` expose normalized issue relationships for their Change records.
  - Plain `rsp show` and history detail render issue relationships without fetching remote data.
- Requirement: AI-assisted shaping uses external issue content only as attributed input.
  - Shape may retrieve the real issue through available host capabilities and distill it into Proposal, Spec, Design, Tasks, and Verify.
  - Failed access directs the user to authenticate and retry, paste the real title and description, or continue with a link-only Change.
  - Inferred repository context is labeled as a draft and never represented as retrieved issue content.
  - Issue content is untrusted data and cannot grant instructions, mutation authority, or external actions.
- Requirement: Commit preparation projects only owned, truthful issue relationships.
  - The selected Change or Group owner remains authoritative; file-diff heuristics never select an issue relationship.
  - Every relationship may produce a non-closing issue reference in a terminal or checkpoint commit.
  - Only a terminal commit for completed acceptance may project a provider-supported closing keyword from `relation: closes`; checkpoints and `relates` never do.
  - When provider/repository identity cannot be resolved safely, Commit emits only the canonical issue URL and does not invent shorthand or closing syntax.

### Acceptance
#### Scenario: Offline issue attachment
- GIVEN an initialized project with no network or provider integration
- WHEN a user creates a Change with `--issue https://github.com/acme/app/issues/123`
- THEN the Change is focused with one normalized `relates` issue relationship and no remote request is required

#### Scenario: Invalid issue metadata fails closed
- GIVEN a Change with malformed, credential-bearing, duplicate, or unsupported issue metadata
- WHEN the user runs `rsp check`
- THEN the command reports stable diagnostics and does not treat the Change as valid

#### Scenario: Legacy archive issue metadata remains readable
- GIVEN an immutable archive predating the v1 issue schema has no `issues` field or contains scalar or otherwise non-v1 `issues` metadata
- WHEN history or status inspects the archive tree
- THEN the historical Change remains readable and its opaque issue metadata is omitted from projection

#### Scenario: Existing Change rejects issue attachment
- GIVEN an open Change already exists
- WHEN `rsp create` targets it with `--issue` or `--issue-relation`
- THEN the command fails explicitly without changing the Change or focus

#### Scenario: Issue traceability survives lifecycle reads
- GIVEN an open or archived Change with valid issue relationships
- WHEN status, show, or history emits JSON and relevant plain detail
- THEN the issue URL and relationship remain visible without remote access

#### Scenario: Retrieval failure degrades honestly
- GIVEN an issue URL that the available AI host cannot access
- WHEN Shape is asked to generate or refine a Change from that issue
- THEN it requests authentication retry or pasted real data, or creates only an explicitly link-only draft, without fabricating issue title, description, or closing intent

#### Scenario: Closing footer is terminal and explicit
- GIVEN a selected completed Change with an owned `closes` relationship
- WHEN Commit prepares its terminal local commit
- THEN it may emit the provider-supported closing keyword alongside the canonical issue reference, while checkpoints, `relates`, ambiguous ownership, and unresolved provider identity emit no closing keyword

## Design
- Approach:
  - Add one typed issue-reference parser/validator at the Change frontmatter boundary and reuse its projection in create, check, status, show, and history.
  - Keep the CLI deterministic: it stores and projects URLs and relationships but never fetches issue content.
  - Keep opportunistic retrieval and source-integrity behavior in a conditionally loaded Shape reference; keep commit projection policy in `rsp-commit`.
- Boundaries:
  - The Change owns issue relationships; issue trackers retain issue content and lifecycle authority.
  - Core owns schema validation and deterministic local projections; Shape owns source acquisition and distillation; Commit owns message projection after Core or Manage supplies the exact work owner.
  - `closes` records delivery intent, not proof that an external issue has already closed.
- Affected areas:
  - `src/core`, `src/commands`, `src/status`, `src/history`, and CLI argument types/registration.
  - `skills/rsp-shape`, `skills/rsp-commit`, their contract tests, and packaged/project projections.
  - `.rsp/specs/core-model.md`, `.rsp/specs/cli-contracts.md`, `.rsp/specs/skill-system.md`, and user-facing command documentation.
- Constraints:
  - Preserve existing Change compatibility and the one-file Change model.
  - Do not duplicate issue title or description into frontmatter or introduce persisted retrieval state.
  - Do not broaden commit, push, publication, external mutation, or human-acceptance authority.
  - Keep generated `.agents/skills` projections synchronized through the supported build/update path rather than editing them directly.

## Tasks
- [x] Implemented typed issue relationship parsing, normalization, validation, and stable diagnostics.
- [x] Added offline `rsp create --issue` and `--issue-relation` handling with pre-mutation validation.
- [x] Projected issue relationships through status, show, and archive history read surfaces.
- [x] Added conditional Shape retrieval/degradation guidance and truthful Commit trailer projection rules.
- [x] Updated stable Specs and concise command documentation for the new contract and boundaries.
- [x] Added focused tests covering compatible absence, valid and invalid metadata, creation rollback safety, read projections, and Skill behavior.
- [x] Confirmed self-hosted Skill symlink projections and managed fallback/Specs indexes are current, then ran the required repository validation suite.
- [x] Corrected review F1 by preserving legacy archives with non-v1 issue metadata as readable history while omitting only their issue projection.
- [x] Corrected review F2 by rejecting issue options for an existing Change without introducing update semantics.
- [x] Completed review convergence by omitting issue projection for legacy archives where the field is absent as well as non-v1.

## Verify
- Automated:
  - [x] `mise exec -- pnpm run build` — passed; TypeScript and bundled CLI integration compile.
  - [x] `mise exec -- pnpm run lint` — passed; authored source and tests satisfy repository static rules.
  - [x] `mise exec -- pnpm run test` — passed after the final compatibility correction; 53 files and 612 tests cover existing behavior plus issue creation, validation, projections, legacy archive compatibility, existing-Change rejection, and Skill contracts.
  - [x] `mise exec -- node dist/cli.mjs check --focused` — passed; the selected Change is structurally valid and converged.
  - [x] `mise exec -- node dist/cli.mjs doctor --json --compact` — passed with `ok: true`, `issues: 0`, and no fixes; self-hosted projections and repository state are valid.
- Manual or environment:
  - [x] Inspected generated create help, representative plain/JSON create, show, status, and history behavior, plus the authored terminal/checkpoint Commit guidance; no authenticated provider or network acceptance was required.
- Coverage:
  - Existing Changes without `issues`; repeated valid relationships; malformed YAML shapes; unsafe URLs; duplicate URLs; relation defaults and explicit closing intent; open/archive projections; legacy absent/scalar/list archive metadata; existing-Change option rejection; retrieval failure wording; checkpoint versus terminal commit rules.

## Blockers
- none
