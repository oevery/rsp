---
kind: "research"
---

# Change: skill-capability-research/synthesize-implementation-capability

## Proposal
- Summary: Define a standalone RSP implementation capability with fresh verification evidence.
- Why:
  - Current research identifies implementation mechanisms but still over-associates the loop with a future Managed Controller, leaving the manually composable suite incomplete.
- Scope:
  - Synthesize `research/models/rsp-implementation-capability.md` from selected Matt, Superpowers, Compound, and local authority/verification evidence.
- Non-goals:
  - Building a Controller, making TDD universal, resolving every diagnosis class, or granting commit/push/publish authority.

## Spec
### ADDED
- Requirement: The implementation model defines a stage-independent capability that consumes one selected Change and returns code/tests plus a fresh verification receipt to existing owners.
  - It specifies scope selection, project-rule precedence, dirty-worktree preservation, task/verify synchronization, blocker escalation, optional TDD/diagnosis routing, and completion-language gates.
  - It can run manually without a Controller and cannot recursively orchestrate review or infer Git/publication permission.

### Acceptance
#### Scenario: a selected Change is ready for implementation
- GIVEN explicit implementation authority, settled required decisions, and a bounded Change
- WHEN the proposed implementation contract is applied
- THEN only authorized artifacts are modified and the Change receives truthful task, blocker, and verification evidence
- AND missing authority, failed verification, or unsafe scope stops completion without committing or publishing

## Design
- Approach:
  - Re-evaluate standalone implementation, TDD, debugging, plan execution, verification-before-completion, and feedback-resolution mechanisms against the RSP ownership model.
- Affected areas:
  - `research/models/rsp-implementation-capability.md`
- Constraints:
  - Keep ordinary focused verification inside the initial implementation contract; split TDD or diagnosis only when evidence demonstrates an independent RSP-specific capability gap.

## Tasks
- [x] Select exact implementation and verification rows from the coverage model.
- [x] Define authority, mutation, verification-receipt, blocker, and stop contracts.
- [x] Separate optional TDD/diagnosis behavior from the minimum normal implementation path.
- [x] Define clean, failure, ambiguity, dirty-worktree, prohibited-action, and context-cost fixtures.

## Verify
- Automated:
  - [x] Validate model frontmatter, source references, recommendation IDs, and absence of unresolved placeholders.
- Manual:
  - [x] Confirm every mutation has an owning artifact and every completion claim requires fresh observed evidence.
- Durable updates:
  - [x] Keep the synthesis in research until a separate product Change selects recommendations.

## Blockers
- none
