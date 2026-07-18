---
kind: "docs"
---

# Change: peripheral-domain-architecture

## Proposal
- Summary: Define peripheral domain contexts, capability boundaries, and repository directory ownership
- Why:
  - The cross-source model currently mixes settled Core Protocol concepts with derived orchestration, optional capabilities, and maintainer-only research concepts without an explicit maturity boundary
  - The durable design lists directories but does not yet define architectural layers, ownership, or allowed dependency direction
- Scope:
  - Define the peripheral Engineering Orchestration and Maintainer Research contexts
  - Classify peripheral concepts as derived, candidate, or maintainer-only
  - Define repository directory ownership and dependency direction in the durable project design
  - Record how optional capabilities and research may interact with product/runtime artifacts
- Non-goals:
  - Do not settle or modify the RSP Project core aggregate, its owned entities, relationships, or invariants
  - Do not implement an L2 capability, managed controller, new CLI behavior, or source-code directory refactor
  - Do not promote source-specific recommendations directly into runtime artifacts

## Spec
### MODIFIED
- Requirement: peripheral domain maturity
  - The research model distinguishes existing Core Protocol assumptions from derived orchestration concepts, candidate capabilities, and maintainer-only research concepts
- Requirement: repository architecture ownership
  - The durable project design identifies product runtime, product distribution, maintainer tooling, research, transient cache, self-hosting protocol, and generated output surfaces
- Requirement: dependency direction
  - Product runtime cannot depend on maintainer research or transient cache; research recommendations reach product surfaces only through a selected normal RSP Change

### Acceptance
#### Scenario: maintainer places a new capability
- GIVEN an optional skill, helper script, or controller experiment
- WHEN a maintainer reads the peripheral model and durable directory architecture
- THEN the artifact can be assigned to one owner and capability level
- AND it does not create a competing Core Protocol state owner

#### Scenario: core model has a separate owner
- GIVEN the core protocol is modeled through `rsp-workspace-core-model`
- WHEN this peripheral Change is reviewed
- THEN it does not claim ownership of core definitions, relationships, or invariants
- AND later core-model changes may evolve them without invalidating the peripheral ownership boundaries

## Design
- Approach:
  - Add explicit model-scope and maturity language around the existing cross-source synthesis
  - Define peripheral vocabulary and ownership without changing the existing Core Protocol vocabulary or invariant text
  - Promote only stable repository architecture boundaries into the existing durable design
- Affected areas:
  - research/models/rsp-engineering-domain-model.md
  - .rsp/specs/design.md
- Constraints:
  - Research remains non-authoritative until selected through this Change
  - Do not create a new durable spec when the architecture belongs in design.md
  - Do not add new directories merely to illustrate a future capability

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Define peripheral contexts, maturity classes, vocabulary, and ownership boundaries in the research model
- [x] Define durable repository layers, directory owners, generated/transient surfaces, and dependency direction
- [x] Confirm the peripheral model does not claim ownership of core definitions or invariants
- [x] Verify the documentation and focused RSP Change

## Verify
- Automated:
  - [x] Run `node dist/cli.mjs check --focused`
  - [x] Run `git diff --check`
- Manual:
  - [x] Map a published skill, maintainer skill, repository script, research report, cache artifact, and future controller state to exactly one documented owner
  - [x] Confirm core-model ownership is delegated to `rsp-workspace-core-model`
- Durable updates:
  - [x] Decide whether this change produced durable knowledge that belongs in `.rsp/specs/` or `.rsp/rules/`
  - [x] Update `.rsp/specs/design.md` with stable repository architecture facts; no rule update is needed

## Blockers
- none
