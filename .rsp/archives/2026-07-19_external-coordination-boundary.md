---
kind: "docs"
---

# Change: external-coordination-boundary

## Proposal
- Summary: Keep external coordination outside the RSP product
- Why:
  - Shallow Change Groups now complete the core work model, so coordination beyond that boundary must not become an implied future extension surface
  - Source: `research/models/rsp-engineering-domain-model.md` recommendation C5 (`model-only`)
- Scope:
  - Audit runtime, configuration, public types, fallback rules, and the published Skill for reserved external-coordination concepts
  - Record the complete negative boundary in the authoritative project design
- Non-goals:
  - Do not add commands, configuration, schema, adapters, extension points, or lifecycle state
  - Do not specify managed delivery; recommendation C7 owns that later single-Workspace concern

## Spec
<!-- Describe what the reader should see or experience. Implementation notes belong in ## Design. -->
### MODIFIED
- Requirement: the largest modeled coordination shape is a non-recursive Change Group
  - Cross-repository dependencies, recursive groups, tracker synchronization, backlinks, and multi-workspace orchestration receive no reserved entity, field, resolver, synchronization state, extension point, or lifecycle
  - Ordinary Markdown may reference external context without granting it protocol semantics or authority

### Acceptance
#### Scenario: work depends on an external repository or tracker
- GIVEN one RSP Change needs human context from an external repository or tracker
- WHEN the author records that context
- THEN it remains an ordinary Markdown reference and creates no RSP entity, backlink, resolver, or synchronized state

## Design
- Approach:
  - Treat C5 as a model-boundary audit and durable clarification, not a runtime feature
  - Keep the boundary in the existing project design instead of adding a new document, registry, schema, or speculative test abstraction
- Affected areas:
  - `.rsp/specs/design.md`
  - Product runtime and distribution surfaces are audited but intentionally unchanged
- Constraints:
  - Preserve one local RSP Workspace; within it, the largest modeled coordination shape is a non-recursive Change Group containing direct child Changes
  - Do not turn examples, links, or controller concepts into reserved product vocabulary

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Audit runtime and distribution surfaces for external-coordination schema or extension points
- [x] Record the complete external-coordination boundary in the authoritative project design
- [x] Verify the result and update any required durable specs or scoped instructions

## Verify
- Automated:
  - [x] Run `mise exec -- pnpm release:check`
  - [x] Run `node dist/cli.mjs check --focused --json`
  - [x] Run `node dist/cli.mjs doctor --json`
  - [x] Run `git diff --check`
  - [x] Run `! rg -n '(crossRepository|cross_repository|tracker(Id|Url|Sync)|tracker_(id|url|sync)|backlinks?|multiWorkspace|multi_workspace|orchestratorId|orchestrator_id)' src/cli.ts src/types.ts src/core/config.ts`
- Manual:
  - [x] Inspect CLI commands, configuration, public types, fallback rules, and the published Skill for reserved cross-repository, tracker, backlink, recursive-group, or multi-workspace mechanisms
- Durable updates:
  - [x] Update `.rsp/specs/design.md`; no scoped instruction change is needed
  - [x] No Decision Record is needed because the boundary is visible in the authoritative design and can be changed explicitly later without migration debt

## Blockers
- none
