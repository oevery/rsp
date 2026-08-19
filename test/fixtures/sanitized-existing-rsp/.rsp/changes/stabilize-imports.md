---
kind: refactor
---

# Change: stabilize-imports

## Proposal
- Outcome: Preserve package imports during a bounded cleanup.
- Why:
  - Existing consumers depend on stable entry points.
- Scope:
  - Verify the current package boundary.
- Non-goals:
  - Publish or deploy the project.

## Spec
### MODIFIED
- Requirement: Stable package imports
  - Existing public imports remain available.

### Acceptance
#### Scenario: Existing consumer imports a package
- GIVEN a supported package entry point
- WHEN the consumer builds
- THEN the import resolves without migration

## Design
- Approach:
  - Keep the compatibility export at the package boundary.
- Boundaries:
  - Internal modules remain private.
- Affected areas:
  - packages/shared
- Constraints:
  - Avoid unrelated package changes.

## Tasks
- [ ] Verify the package entry points.

## Verify
### Required
- Automated:
  - [ ] package build — proves: supported imports still resolve
### Optional
- Manual or environment:
  - [ ] application smoke test
- Coverage:
  - Sanitized fixture only.

## Blockers
- none
