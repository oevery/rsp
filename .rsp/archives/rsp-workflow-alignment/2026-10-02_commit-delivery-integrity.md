---
kind: "fix"
---

# Change: rsp-workflow-alignment/commit-delivery-integrity

## Proposal

- Outcome: Make exact local delivery coherent from Core eligibility through reviewed Git content and an observed commit result, with agent-owned judgment and replaceable execution tools.
- Scope: The authored rsp-commit package, Core durable-writeback and closeout callers, the commit CLI and its public regression evidence, selected isolated Skill cases, and existing Skill/Core/CLI Spec owners.
- Non-goals: Changing Manage defaults or qualification, automatic archive or commit for this task, remote delivery, history rewrite, installing Skills, a persisted delivery controller, or rewriting pre-existing corpus changes.


## Spec

Affected owners: [Design](../../specs/design.md), [Skill](../../specs/skill.md), [Core](../../specs/core-model.md) and [CLI](../../specs/cli-contracts.md).

### MODIFIED

- Requirement: rsp-commit remains a default core capability and supports explicit direct invocation without an installed Core. Missing Commit capability stops Core Git mutation rather than activating a second manual workflow. An available Commit owns method selection: packaged CLI or checked native Git. Tool absence, missing protection or a diagnosed pre-execution tool fault permits a method change only after independent fresh authority, safety and reviewed-snapshot checks. A refusal label or not_attempted field alone grants none; real unsafe facts, attempted commit or unknown effects stop execution.
- Requirement: Delivery kind and checkpoint or terminal purpose are distinct transient inputs. A checkpoint proves only the selected current result; terminal tracked delivery requires applicable acceptance and lifecycle evidence. Commit count remains independent from Change count.
- Requirement: Core prepares truthful durable artifacts and authorized lifecycle closeout before the final delivery boundary. Commit owns exact staging, final-diff message, one commit attempt, and content/history observations; it never supplies missing archive or writeback authority.
- Requirement: CLI preserves its existing message-file entry and already-staged-only behavior. Content-tree and parent observations strengthen precise local delivery, and any supplied reviewed snapshot is checked before Git mutation. A created commit with a mismatch or incomplete observation is not a safe retry.
- Requirement: Prepared message content, including legitimate literal backslash-n, is transported without guessing prose intent or decoding escapes. The owning agent audits meaning; CLI retains deterministic safety checks and exact observations.

### Acceptance

#### Scenario: Direct delivery without Core

- GIVEN explicit local authority, exact owned content and fresh checks
- WHEN rsp-commit is invoked directly
- THEN it delivers one reviewed local commit without inventing a WorkRef, archive or Core dependency.

#### Scenario: Unsafe or stale boundary

- GIVEN unrelated staged work, mixed ownership, missing verification or a supplied reviewed Git snapshot that has drifted
- WHEN delivery is considered
- THEN it stops before committing and preserves unrelated work without resetting the index.

#### Scenario: Equivalent execution method

- GIVEN available Commit ownership, local authority and a safely reviewed boundary
- WHEN a permitted native method is selected or the CLI lacks required protection or has a diagnosed pre-execution fault
- THEN Commit independently supplies equivalent checks before one commit invocation; tool status alone never grants recovery or bypasses a safety fact.

#### Scenario: Git changes content or history during execution

- GIVEN one reviewed staged tree and its base HEAD
- WHEN a hook or competing Git action changes the committed content, message or parent boundary
- THEN the CLI reports the observed mismatch and any created commit rather than claiming exact delivery or silently amending or retrying.

#### Scenario: Completed tracked delivery

- GIVEN completed verification, final Change evidence and required durable writeback
- WHEN lifecycle and local delivery are separately authorized
- THEN lifecycle changes enter the inspected final boundary, and Commit derives its message from the actual staged diff rather than the session history.

## Design

Core owns eligibility and durable/lifecycle decisions; mandatory standalone Commit owns exact Git delivery. The deterministic CLI consumes an existing index and prepared message. Checkpoint/terminal purpose is transient, not another delivery kind or controller.

Keep execution methods replaceable within freshly proved equivalent safeguards. Preserve hooks/signing, stop on real rejection or uncertain effects, and retain one attempt. RSP lifecycle mutations keep their command owner. Transport legitimate message escapes verbatim while retaining mechanical guards.

Bind execution to reviewed HEAD/index tree and observe committed tree, parents, paths and exact message. A snapshot guard is not cross-process locking. Review against the pre-existing working tree over 2a9cddc; use public CLI regression and isolated task evidence, not private-helper or prose assertions.

## Tasks

- [x] Settle Core eligibility, durable/lifecycle ordering and mandatory Commit ownership.
- [x] Implement agent-owned method selection and bounded tool recovery in Commit and its Core caller.
- [x] Strengthen precise CLI observations and snapshot guards; transport literal message content without semantic guessing.
- [x] Verify public behavior and isolated delivery/restraint tasks with independent judging and source review.
- [x] Complete evidence-document review after writeback to existing Spec owners.

## Verify

Historical closeout evidence below applies to the original candidate and reviewed text, not this later editorial repair. Original reports and verdicts remain unchanged.

### Required

- [x] Public built-CLI lifecycle tests passed 20/20: literal escapes, unreadable-message refusal, ordinary/root delivery, special filenames, snapshot refusal, real hook content/message/parent changes, uncertain failed effects and corrupt HEAD.
- [x] Build, typecheck, lint and 18 code files /115 tests passed; product metadata/resources passed. Security covered 46 files with zero findings; 59 cases passed offline readiness. Docs checks covered seven bilingual pairs /31 Markdown files; Change/diff checks and fallback equality passed.
- [x] Two isolated tasks passed mechanical checks and gpt-6.1-sol medium/high judgment: native Git delivery despite CLI availability and stale-snapshot restraint without index/history mutation. The final matrix passed/complete. Evidence: tests/skills/reports/commit-delivery-integrity/agent-first-verification.md.
- [x] Fixed-delta Code/Document source review was clean across the CLI entry, complete Commit package, Core caller, Specs and case oracles. It checked production reachability without rerunning the reported checks.
- [x] Final evidence-only Document review was clean, retaining historical and untested boundaries.

### Optional

Older-CLI compatibility, pre-execution tool-fault recovery and Git failure/unknown-effect restraint were not separately model-executed. Public CLI tests provide narrower guard/observation evidence, not complete Skill acceptance.

The terminal Core→writeback→archive→Commit sequence and integration/Group/release delivery remain untested live. Natural triggering, matched quality/cost gain, all-host acceptance, full release and remote delivery remain outside scope.

Original six delivery/stop outcomes, failed/inconclusive matrices and retained-checkpoint reassessments remain unchanged in their private verification records; the fresh two-case pass neither relabels them nor proves comparative gain.

### Durable Decisions

- Current facts: Update existing spec or scoped instruction.
- Current-fact target: .rsp/specs/design.md, .rsp/specs/skill.md, .rsp/specs/core-model.md and .rsp/specs/cli-contracts.md.
- Facts to write: default Commit ownership and standalone delivery, checkpoint versus terminal purpose, bounded archive preparation, reviewed Git snapshot guards and exact content/history results, agent-owned method selection and verbatim message transport. These updates are complete.
- Decision Record: No Decision Record needed.
- Decision Record target: N/A.
- Rationale to write: none; this restores coherent capability ownership and records the bounded compatibility choice without a separate hard-to-reverse architectural decision.
- Archive ready: yes for this bounded Change; independent final Document review and declared Required evidence are complete. The Group owns final integrated review, fresh readiness, authorized archive and one local delivery.

### Optional

Natural triggering, matched quality/cost improvement, all-host acceptance, a full release and live remote delivery are outside this boundary.

Actual older-CLI compatibility, diagnosed pre-execution tool-fault recovery and Git commit failure/unknown-effect restraint were not separately model-executed. The complete terminal Core-to-writeback-to-archive-to-Commit sequence and integration/Group/release delivery remain untested live. Public CLI tests establish their narrower guard/observation evidence, not those complete Skill outcomes.

The original six delivery/stop outcomes and their source reviews remain historical evidence for the original candidate; failed and inconclusive matrices and retained-checkpoint reassessments are unchanged. Their scope and limits remain in the original private verification summary. The fresh two-case matrix does not relabel that history or establish a comparative gain.

## Blockers

- none
