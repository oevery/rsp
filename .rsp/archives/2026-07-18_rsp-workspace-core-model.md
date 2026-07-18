---
kind: "docs"
---

# Change: rsp-workspace-core-model

## Proposal
- Summary: Define the RSP Workspace core model and one-level Change Groups
- Why:
  - The current research model overstates the enclosing project as one RSP-owned aggregate and treats project rules as RSP-owned durable knowledge
  - Earlier design discussion and upstream evidence instead support an embedded protocol that owns current work, stable facts, decisions, and history while external project instructions and module context retain their own owners
  - Multi-Change folders need one parent goal and completion contract without recursive hierarchy or a second lifecycle
- Scope:
  - Distinguish Host Project, RSP-enabled Project, and RSP Workspace
  - Define Work Coordination, Durable Knowledge, History, and Protocol Operations ownership
  - Define Change, one-level Change Group, FocusSet, Spec, Decision Record, Archive Entry, Fallback Protocol, and derived observations
  - Define the target `.rsp/` layout and strict one-level Change Group constraints
  - Reconcile the core model with the completed peripheral model and distilled upstream evidence
- Non-goals:
  - Do not implement or migrate CLI paths, templates, validators, archive behavior, rules, skills, or generated indexes in this Change
  - Do not model cross-repository coordination, recursive groups, dependency graphs, tracker synchronization, backlinks, or multi-workspace orchestration
  - Do not record the target model as already implemented product behavior in `.rsp/specs/design.md`

## Spec
### MODIFIED
- Requirement: protocol ownership
  - The model treats the Host Project as an external owner and the embedded RSP Workspace as the protocol boundary rather than one project-wide aggregate
- Requirement: durable knowledge separation
  - Project Instructions and Module Context remain externally owned; the RSP Workspace owns Specs, Decision Records, a minimal Fallback Protocol, and completed history
- Requirement: work shapes
  - The minimum work shape is one Change file; an optional Change Group contains exactly one `brief.md` and direct child Change files with no recursive subdirectories
- Requirement: bounded coordination
  - Focus selects executable Changes, group completion is derived from direct children and group completion conditions, and system-external coordination remains out of scope

### Acceptance
#### Scenario: simple work stays simple
- GIVEN a task that fits one independently verifiable unit
- WHEN it is represented in the target core model
- THEN it is one flat Change file
- AND no Change Group or parent document is required

#### Scenario: shared goal needs several Changes
- GIVEN multiple independently executable Changes share one goal and completion contract
- WHEN they are represented as a Change Group
- THEN the group directory contains `brief.md` and direct child Change files only
- AND focus still selects a child Change rather than the group

#### Scenario: coordination exceeds the protocol boundary
- GIVEN work requires recursive groups, cross-repository ownership, or a complex dependency graph
- WHEN its fit with RSP is evaluated
- THEN it is declared outside the RSP core model
- AND no extension field or placeholder entity is added for it

## Design
- Approach:
  - Replace the project-wide aggregate framing with an embedded RSP Workspace and explicit external owners
  - Keep Change and FocusSet as separate consistency owners; treat archive as a coordinating domain operation
  - Add Change Group only as a shallow optional coordination entity with `brief.md` as its definition
  - Preserve the peripheral maturity, capability distribution, and maintainer research model
- Affected areas:
  - research/models/rsp-engineering-domain-model.md
  - .rsp/changes/rsp-workspace-core-model.md
- Constraints:
  - Clearly distinguish current authority from target model
  - Keep core paths fixed in the target model except external context routing and one authoritative decision path
  - Do not add persisted workflow status values beyond open and archived

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Replace the RSP Project aggregate framing with Host Project and RSP Workspace ownership
- [x] Define core entities, consistency owners, state, operations, and external boundaries
- [x] Define flat Change and one-level Change Group layouts and completion semantics
- [x] Reconcile scenarios, rejected designs, and recommendations with the new core model
- [x] Verify internal consistency, source provenance, and focused RSP hygiene

## Verify
- Automated:
  - [x] Run `node dist/cli.mjs check --focused`
  - [x] Run `git diff --check`
  - [x] Validate model frontmatter and source-report paths
- Manual:
  - [x] Walk simple Change, Change Group, group completion, external context, durable knowledge, archive, and out-of-scope coordination scenarios
  - [x] Confirm the model never claims the target paths or Change Group behavior are already implemented by the CLI
- Durable updates:
  - [x] Decide whether this change produced durable knowledge that belongs in `.rsp/specs/` or `.rsp/rules/`
  - [x] Defer durable product updates until a later implementation Change makes the target model true in code, rules, and distributed skills

## Blockers
- none
