---
kind: refactor
summary: Select work by shared obligations and resolve completed-task delivery before verification is complete.
---

# Change: work-selection-closeout

## Proposal
Keep explicit local modifications Direct while retaining Changes for outcomes
with related decisions and acceptance obligations. Before a tracked commit,
completed Tasks trigger a closeout decision even when verification has gaps.
Scope is authored workflow Skills, owning contracts, public guides, Change template guidance and native evaluation cases, plus the reviewed maintainer acceptance guidance.
Verify records use checklists and optional short Conclusions bullets only.
No CLI schema, new work tier, automatic archive or consumer upgrade is included.
Live evaluation covers the selected workflow cases.

## Spec
### MODIFIED
- Requirement: Work selection uses actual authorized impact and matching owners.
  Local interface edits and strict checks do not alone require a Change.
  A coupled outcome may need a Change without independent slices or multiple sessions.
- Requirement: Tracked commit classification checks Tasks and actual remaining work.
  Completed Tasks trigger the configured closeout decision before staging;
  missing checks do not defer an ask-policy question. Explicit applicable choices
  are reused, while verification and fresh readiness still gate actual archive.

- Requirement: Verify uses Required/Optional checklists and optional short Conclusions
  bullets; it retains current limits without paragraphs or repair history.

### Acceptance
#### Scenario: Local maintenance and coupled implementation
- GIVEN a bounded parameter edit, a coordinated runtime redesign and existing work
- WHEN classifying their actual scope
- THEN local maintenance stays Direct, the redesign uses one Change, and matching
  work retains its owner without inferring ownership from paths or session length.

#### Scenario: Completed tasks with verification gaps
- GIVEN ask policy, completed Tasks and incomplete Required verification
- WHEN the user requests a commit without a closure choice
- THEN inspect and explain the gaps and ask before staging; neither archive nor
  an automatic checkpoint bypasses the decision.

#### Scenario: Explicit checkpoint
- GIVEN an applicable request to commit only a verified slice and keep work open
- WHEN Tasks are complete
- THEN preserve that choice without another closure question or archive.

## Design
Core owns work selection; Commit routes completed-task delivery to the shared
closeout method. That method separates the user's direction from archive eligibility.
Specs and shared work definitions retain the same boundaries. Keep Group eligibility
distinct from child completion. Advice creates no implementation owner.

The design follows the user's reviewed RSP, qysg and boats-cloud examples rather
than importing an upstream workflow or copying upstream assets. No session-count
or line-count threshold is introduced.

## Tasks
- [x] Reconcile authored Skills and owning contracts with shared rules referenced from their callers.
- [x] Add work-selection and task-state delivery cases, retaining checkpoint controls.
- [x] Constrain Verify records and template guidance to checklists and short conclusions.
- [x] Align public delivery summaries and consolidate maintainer acceptance instructions without changing authority or evidence gates.
- [x] Complete affected package, document, offline task and author checks.

## Verify
### Required
- [x] Skill package/resource, security and documentation checks.
- [x] Native task schemas and isolated reference-solution assertions.
- [x] Protected-file checks reject permission changes and symlink replacement.
- [x] Build, lint and code regression checks for template changes.
- [x] Change consistency and diff checks.
- [x] Independent review and correction re-review of work selection, closeout and task assertions.
### Optional
- [x] Selected live model evaluation: six cases passed; see `research/reports/2026-11-09T01-29-49Z.md`.
### Conclusions
- Live evidence covers one attempt per selected workflow case, not stability, Verify-record writing or maintainer acceptance Skills.
- The latest documentation consolidation and evaluation artifact declaration have not received independent re-review.

## Blockers
None
