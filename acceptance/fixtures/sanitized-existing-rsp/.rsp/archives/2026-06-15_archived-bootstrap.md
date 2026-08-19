---
kind: ops
---

# Change: archived-bootstrap

## Proposal
- Outcome: Establish the initial repository workflow.
- Why:
  - The project needed explicit durable work boundaries.
- Scope:
  - Initialize repository-local RSP artifacts.
- Non-goals:
  - Change product behavior.

## Spec
### ADDED
- Requirement: Repository workflow
  - Work is represented by repository-native artifacts.

### Acceptance
#### Scenario: A maintainer inspects archived setup work
- GIVEN the initialized repository
- WHEN history is queried
- THEN the archived bootstrap Change remains discoverable

## Design
- Approach:
  - Keep workflow state in versioned files.
- Boundaries:
  - Runtime product state is out of scope.
- Affected areas:
  - .rsp
- Constraints:
  - Preserve project-owned files.

## Tasks
- [x] Initialize the repository workflow.

## Verify
### Required
- Automated:
  - [x] rsp doctor — proves: required artifacts exist
### Optional
- Manual or environment:
  - [x] Maintainer inspected the initialized tree.
- Coverage:
  - Repository setup only.

## Blockers
- none
