# Work model

## Purpose

Define work identity, durable artifacts, lifecycle, dependencies and the
conditions for knowledge writeback and archive.

## Current facts

### Identity and durable state

A WorkOwner is the selected Change or shallow Group. A WorkRef identifies one
executable Change by its logical name, `<change>` or `<group>/<change>`, resolving
to `.rsp/changes/<change>.md` or `.rsp/changes/<group>/<change>.md`. A Group
reference identifies its Brief and direct children, not an executable WorkRef.
Deeper identities are invalid. Installed Skills share these runtime definitions through
Core references/work-model.md; the maintainer Spec is not a runtime dependency.

A Change is one Markdown file with six sections:

| Section | Responsibility |
| --- | --- |
| Proposal | Outcome, scope and non-goals |
| Spec | Contract delta and acceptance, referencing existing authority |
| Design | Approach, boundaries and necessary tradeoffs |
| Tasks | Current checkable work, actual completion and remaining work |
| Verify | Declared acceptance checks, applicable scoped results and remaining limits |
| Blockers | Unresolved dependencies or decisions, or none |

A Change owns one outcome and its acceptance, verification, review, archive and
rollback boundary. RSP persists only `open` and `archived`, derived from Change
placement. Focus, readiness, blockers, routing and delivery status are not
additional lifecycle states. Git commit count does not select Change granularity.

### Groups, focus and prerequisites

- A Group has one `00-brief.md` and direct executable children. Its logical
  identity is `<group>/brief`. The Brief owns the shared goal, slices and
  completion conditions; it is not executable, focused or a duplicate child log.
  Children remain independently executable, verifiable, archivable and deliverable.
- A named `Integration:` completion condition owns the Group evidence boundary.
  Applicable integration evidence, not merely child passes, is required before
  completion. A request-only boundary must be written back before Group closeout.
- Focus marker paths form the FocusSet of open Change candidates. Optional
  Capsules carry bounded recovery snapshots, not ownership or authority. Multiple
  markers are valid; explicit user intent or WorkRef selects first, otherwise
  current status, dependencies and evidence resolve the next owner.
- Core writes an authorized Capsule only when information absent from the Change,
  current workspace and existing evidence is needed for safe continuation or to
  avoid costly repeated discovery. At a pause, handoff or recovery-relevant
  checkpoint, create or replace only an insufficient or stale snapshot and
  revalidate it on recovery; ordinary progress needs no update. Retain unfinished
  experiments, cleanup obligations or uncertain effects only as needed to resume.
  No command/attempt timeline or second
  task, verification or blocker list belongs here. Delivery blockers stay in Change.
- Remove recovery notes only when their obligations are discharged, obsolete or
  safely transferred. Unresolved effects cannot be discarded merely for brevity.
  Empty capsule replacement retains focus; cleanup grants no unfocus or closure.
  Group recovery uses a selected child's Capsule, not a Brief marker; bounded
  direct work needs no new Capsule.
- Blockers contains only unresolved dependencies or decisions preventing required
  work. Write standalone `None` when none remain; put non-blocking verification
  limits in Verify. Exact prerequisites use ``- requires `<work-ref>`: <reason>``
  entries. Other prose remains an external blocker, not an inferred dependency
  edge. Dependency waves are derived, not a persisted schedule.
- Artifact order does not prescribe execution order. The
  [Workflow coordination contract](workflow.md#control-boundaries) owns conditional
  sequential or parallel work; Group shape alone does not dispatch workers.

### Evidence and closeout

Verification establishes the declared outcome's evidence; review supplies its
own bounded semantic judgment. Reuse and independent-execution obligations are
owned by [Workflow methods and evidence](workflow.md#methods-and-evidence), not a
separate evidence registry.

A Change states current authorized intent, approach and actual progress during
work, then the delivered outcome at closeout. Update affected content when facts
change instead of appending dates, rounds or session summaries; dates remain when
needed for provenance or applicability. Cleanup grants no authority to remove unmet
scope or acceptance obligations.

Tasks can be replaced, split or merged within authorized scope. Reopen or rewrite
invalidated completed work; routine attempts, fixes, retries and check runs are not
new tasks. Task completion establishes neither verification nor independent or
human acceptance.

Verify permits only Required/Optional checklists and an optional `### Conclusions`
containing short, non-nested bullets. Prose paragraphs, tables, logs and process
subsections are not permitted. Applicable passes are checked; failures, unrun
checks and invalidated coverage are unchecked. Check items may be added or revised
when authorized scope or acceptance changes, without dropping unmet obligations.
An item may carry a brief result or evidence locator, not repeated results, run
counts or repair history.

Conclusions retain only current acceptance limits, evidence applicability conditions
or required failure dispositions that the checklist cannot express, one fact per
bullet. Replace stale conclusions instead of appending rounds. Preserve full-review,
correction-only re-review and human-acceptance scope. Remove resolved findings unless
they still affect acceptance, evidence reuse or required audit. Shared evidence
appears once; detailed records keep their owner. No numeric item or word limit
replaces these content rules.

Decision rationale and useful outcome comparisons stay in their owning sections;
they do not exempt Verify text from its admission rule. Do not relocate discarded
narration into another section, Focus, an appendix or a new report. Prose cleanup
does not remove tests, raw evidence, reports, conversation or Git history.

Before archive, establish verified outcome facts, distill useful Focus information,
write necessary stable knowledge to its owner, and converge the entire Change.
Then check the final document and knowledge owners, complete any required Review,
and obtain current readiness before authorized archive. These are dependency
constraints, not persisted stages or mandatory separate tool calls.

No useful knowledge delta requires no writeback; a stale authoritative contract
still requires correction. Whole-Change convergence retains the delivered delta,
useful outcome comparisons and actual knowledge-update references, with Verify
subject to its admission rule above. It removes superseded plans, duplicate current
Specs, operation permissions, session chronology and response-only handoff blocks.
Detailed records and original verdicts stay with their evidence owner. A material
contradiction returns to its decision, implementation or verification owner rather
than being edited away.

Completed Tasks, applicable passing Required Verify, no active blockers, necessary
writeback and required review are archive preconditions. Optional omissions remain
explicit but do not block. CLI readiness is deterministic evidence, not semantic
acceptance. Archive preserves the final Change and clears its Focus; it never
promotes Spec deltas or Decision Records automatically.

For example, a Change with completed Tasks, passing Required Verify and no blockers
can still lack lifecycle authority. Report the established completion boundary and
leave it open; readiness alone permits neither archive nor clearing its Focus.
Any separately authorized Git delivery retains its own boundary.

## Boundaries

| Artifact | Owner of information |
| --- | --- |
| Specs | Current capabilities, collaboration contracts and necessary constraints |
| Decision Records | Significant choices, alternatives and consequences |
| Root/local CONTEXT | Domain vocabulary, relationships and navigation |
| Nearest project AGENTS | Scoped instructions and operating rules |
| Change/Group Brief | Selected work, its final outcome and evidence summary |
| Focus Capsule | Replaceable ongoing-work and recovery snapshot |
| Archives and reports | Historical outcome snapshots and detailed evidence |

README supplies introduction and usage. Placement follows meaning, not file shape;
short summaries and normative design references may link owners without duplicating
full definitions. The [Decision Record ownership decision](decisions/decision-record-ownership.md)
explains the separate rationale path.

Relevant legacy context remains usable until an authorized migration preserves
meaning, fixes active references and retires the old owner. Discovery or a successful
managed update alone does not authorize migration.

Lifecycle authority and Git authority are separate. Direct delivery and checkpoints
need no invented archive gate. One exact reviewed commit may include several real
WorkRefs without merging their lifecycles. Successful archive followed by failed
Git delivery remains archived but undelivered; failure grants no automatic reopen,
rollback, retry or history rewrite.

## Constraints

- Preserve single-file Changes, one shallow Group level and canonical sections.
- Keep the sole configured Decision Record path; switching it does not migrate
  or delete existing records automatically.
- Focus and artifact selection grant no product, lifecycle, Git or external authority.
- Keep host sessions, workers, worktrees, execution environments and integration
  outside RSP durable state.
- Persist no controller, session, run, receipt, event ledger or automatic promotion.

## Completion and delivery

Direct work needs no durable owner. Change retains one recoverable acceptance and
delivery boundary. Group needs independently acceptable/deliverable child Changes
with dependencies or integration; effort and agent count alone do not justify it.

Ordinary completion and checkpoint commits leave Change open. A tracked commit
whose Tasks are complete selects the workflow closure policy even when verification
is incomplete or failed; an explicit applicable checkpoint choice is retained.
Established final delivery or an explicit close request also selects the policy.
Task completion triggers the decision, not archive eligibility. Required
checks and reviews must remain applicable; necessary knowledge is written before
final Change reconciliation. These are dependencies, not mandatory separate calls
or repeated full tests. Closure never authorizes Git. Reopen is exceptional recovery.
