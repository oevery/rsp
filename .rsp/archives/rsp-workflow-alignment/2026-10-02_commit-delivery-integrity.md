---
kind: "fix"
---

# Change: rsp-workflow-alignment/commit-delivery-integrity

## Proposal

- Outcome: Make exact local delivery coherent from Core eligibility through reviewed Git content and an observed commit result, with agent-owned judgment and replaceable execution tools.
- Scope: The authored rsp-commit package, Core durable-writeback and closeout callers, the commit CLI and its public regression evidence, selected isolated Skill cases, and existing Skill/Core/CLI Spec owners.
- Non-goals: Changing Manage defaults or qualification, automatic archive or commit for this task, remote delivery, history rewrite, installing Skills, a persisted delivery controller, or rewriting pre-existing corpus changes.


This Change was explicitly re-homed from `commit-delivery-integrity` to `rsp-workflow-alignment/commit-delivery-integrity` for the authorized grouped local delivery. Original candidate identities, reports and verdicts retain their historical scope.

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

Core owns eligibility and durable/lifecycle decisions; the default Commit capability owns Git delivery; the deterministic CLI consumes only an existing index and prepared message. Preserve existing kinds and add phase-local purpose rather than another delivery kind or persisted state.

Keep capability ownership mandatory and execution mechanisms replaceable. Select or repair a method before commit execution, prove equivalent checks independently, preserve hooks and signing, and stop on substantive rejection or uncertain mutation. Do not extend native-Git equivalence to command-owned RSP artifacts. Remove only the literal-escape message heuristic, not mechanical Git guards.

Normalize obsolete Change content before deciding writeback, then converge final evidence after writeback and required review. Preserve mandatory review boundaries; neither author self-check nor Commit audit replaces them. No general archive-before-every-commit rule applies to direct work, checkpoints or a terminal boundary without lifecycle authority.

Bind execution to the final reviewed index tree and HEAD, compare committed tree, parents and exact message, and expose decisive observations in the compact result. Preserve the existing command for old callers; any new pre-mutation guard has Commit as its real producer and CLI as its real consumer, not a test-only option. No stronger cross-process locking claim follows from a snapshot check.

Baseline: the pre-existing working tree over 2a9cddc, retained separately for fixed-scope review. Shared paths retain corpus expression changes; the behavior delta belongs here. Review the risky Git boundary through the public CLI, including real hook effects, rather than private-helper or prose-string assertions. Model execution uses isolated projects and the shared gpt-6.1-sol medium executor and high judge.

## Tasks

- [x] Settle Core eligibility, durable/lifecycle ordering and mandatory Commit ownership.
- [x] Implement agent-owned method selection and bounded tool recovery in Commit and its Core caller.
- [x] Strengthen precise CLI observations and snapshot guards; transport literal message content without semantic guessing.
- [x] Verify public behavior and isolated delivery/restraint tasks with independent judging and source review.
- [x] Complete evidence-document review after writeback to existing Spec owners.

## Verify

### Required

- [x] Fresh public built-CLI lifecycle tests passed 20/20, covering literal escape preservation and unreadable-message refusal, ordinary/root delivery, special filenames, snapshot refusal, real hook content/message/parent changes, failed uncertain effects and corrupt HEAD.
- [x] Fresh build, typecheck and lint passed; full code tests passed 18 files / 115 tests. Product packages/resources passed; security covered 46 files with zero findings; all 59 Skill cases passed offline readiness. Documentation checks covered seven bilingual pairs /31 Markdown files, and Change/diff checks and authored/generated fallback equality passed. Offline readiness is not model acceptance.
- [x] Two fresh isolated tasks passed mechanical checks and independent judging with gpt-6.1-sol medium execution and high judging: native Git delivery despite CLI availability, and stale-snapshot restraint without index/history mutation. All four runner root sessions completed; the final matrix passed. Bounded evidence: tests/skills/reports/commit-delivery-integrity/agent-first-verification.md.
- [x] Independent high-effort fixed-delta source review is clean for Code and Document, including the shipped CLI entry, complete Commit package, Core caller, Specs and new case oracles. This reviewer inspected production reachability but did not rerun the reported checks.
- [x] Final evidence-only independent Document review is clean; current, historical and untested boundaries remain explicit.

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
