---
kind: refactor
summary: Keep current work, applicable acceptance evidence and recovery context without accumulating execution history.
---

# Change: current-work-records

## Proposal
The delivered guidance defines distinct responsibilities for
Tasks, Verify and Focus. Iteration updates current facts instead of appending
attempts; closeout produces a final outcome record without reconstructing sessions.

Scope covers authored Skills, owning Specs and built-in Change template hints.
It preserves six Change sections, Required/Optional verification, Focus v1 syntax,
readiness, independent-evidence obligations and authorization boundaries. It adds
no log, evidence registry or new storage mechanism.

## Spec
### MODIFIED

- Requirement: Tasks represents current authorized work and actual completion.
  Replan or reopen invalidated work without recording routine attempts or silently
  dropping unmet scope or acceptance obligations.
- Requirement: Verify retains applicable scoped conclusions, evidence references
  and limits only when needed for acceptance, applicability or necessary evidence
  lookup; omit repeated check results and details retained merely because they
  occurred. Replace superseded conclusions only within their covered boundary;
  preserve still-applicable reused evidence and full-review/partial-re-review coverage.
- Requirement: Focus contains only additional context needed for safe or costly
  recovery. Replace the current snapshot, never append execution history or
  maintain a second task, acceptance or blocker list. Clear notes only when their
  recovery obligations are discharged, obsolete or safely transferred.
- Requirement: Keep useful outcome comparisons, decision rationale and material
  failure dispositions with their owner. Ordinary chronology stays in conversation;
  existing raw evidence is neither copied nor deleted by document cleanup.

### Acceptance
#### Scenario: Iteration changes the plan and evidence
- GIVEN an authorized outcome with completed tasks and partial reusable evidence
- WHEN the approach changes and invalidates part of the work
- THEN Tasks reflects current remaining work, Verify marks affected coverage as
  incomplete while retaining applicable evidence, and neither records retry history.

#### Scenario: Interrupted work has unresolved effects
- GIVEN unfinished experimental changes or an operation whose effects are uncertain
- WHEN a continuation needs a Focus snapshot
- THEN it retains the minimum safe-resume context without duplicating Change state,
  and cannot be cleared merely to shorten the record.

#### Scenario: Final outcome needs a useful comparison
- GIVEN routine attempts alongside a meaningful before/after result and separate
  full review, correction review and human acceptance
- WHEN the record converges
- THEN it retains those decision-relevant distinctions without an execution timeline.

## Design
The shared work model owns record semantics. Core and direct capabilities apply
that model through their existing writing and review branches; Focus's conditional
method owns snapshot mechanics. Capabilities reference this shared guidance in
place of their previous record-writing rules. Template comments offer short role-specific hints
without changing generated section syntax or deterministic gates.

## Tasks
- [x] Replace owning Specs and Skill guidance for current work and scoped evidence.
- [x] Tighten Focus write, replacement and cleanup rules without a second state store.
- [x] Built-in template hints express the record responsibilities without changing gates.
- [x] Complete affected checks and independent review; resolve actionable findings.

## Verify
### Required

- [x] Build, lint and code checks cover the template and unchanged gates.
- [x] Skill package/resource, documentation and offline task checks pass.
- [x] Independent Code/Document review covers the change and its corrections,
  with no unresolved findings.

Stable contract updates are in [Work model](../specs/work-model.md) and
[Writing quality](../specs/writing-quality.md).

### Optional

- [ ] Live agent trials: not run; behavior across iterations and recovery remains
  unverified, with no efficiency claim.

## Blockers
None
