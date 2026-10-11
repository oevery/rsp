---
name: rsp-review
description: Judge a fixed change or file set, or discover evidenced structural risks in an explicitly bounded repository or subtree. Authorized supporting checks are part of this read-only review; declared-check reporting alone belongs to Verify. No repair or approval.
license: MIT
metadata:
  author: oevery
  version: "2026.10.11.3"
---

# RSP Review

For tracked work, read the [shared work model](../rsp/references/work-model.md) when its identity and ownership definitions are missing from the current context. Use logical WorkRefs in commands and reports; cite file locations separately. Direct invocation needs no prior Core execution.

Review one fixed change/file set or explicitly bounded structural scope without modifying it. Be concise, separate Code and Document judgment, and emit one deduplicated report. Checks supporting the requested judgment stay within this review; do not add a separate verification pass merely because checks are named. Explicit combined requests and independent-evidence obligations still apply. A judgment about implementation completeness grants no overall lifecycle completion or closeout authority.

## Fix scope and authority

Resolve before judging:

- one immutable comparison point or explicit fixed file set for change review; for structural discovery, one explicit repository/subtree boundary and its observed checkout state, without requiring a diff;
- reviewed files, including relevant untracked files named by the user;
- the selected WorkOwner when tracked: a Change WorkRef, or a Group reference with its Group Brief and direct child Changes; an untracked review may use the explicit request and fixed file set without creating a Change;
- nearest project instructions and only relevant Specs and Decision Records;
- any caller-supplied implementation summary.

Do not switch branches or mutate the worktree to discover scope. If a required change-review comparison point is unavailable, report the review as blocked. If the selected WorkOwner, included WorkRefs, or authorities select different intent, name the conflict, mark dependent pipelines blocked, and do not guess; multiple focus markers alone are only candidate context. Continue only pipelines whose inputs remain authoritative.

The user request fixes the requested outcome and allowed operations subject to nearest project instructions. The selected WorkOwner defines the intended delta: a Change uses its WorkRef, while a Group uses its Brief and direct child Changes. Specs define current contracts, boundaries, and necessary constraints; Decision Records define lasting rationale. Implementation and tests are evidence, not authority for missing requirements. Report missing authority instead of inventing a rule, acceptance criterion, or preference.

## Select perspectives before loading

For an explicit structural-discovery request, load [structural review](references/structural-review.md) after fixing scope. It supplies ownership, dependency, production-path and verification lenses; no diff is required. Ordinary review does not expand into a repository audit. A concrete structural risk in a fixed change may use those lenses only within the existing boundary. Return evidenced findings and the smallest correction or unresolved design question, not a replacement design or implementation. Keep the report and verdict semantics below.

Code and Document are complementary review perspectives, not exclusive file kinds. Fix scope and authority first; select from the reviewed content and its risk, not the extension, code fence or presence of a comment. A narrower request wins over whole-file defaults. Reuse applicable instructions already available; obtain missing or changed entrypoint/method text before relying on it.

- **Code:** behavior, contracts, safety and failures of reviewed executable instructions/code, runnable recipes, algorithmic logic or tool-interpreted content. A prose behavior claim alone can remain Document grounding.
- **Document:** factual explanation, usability, navigation and maintenance, including API/TSDoc comments, requirements and human- or agent-facing guidance.
- Complete Skill instruction reviews normally apply both. Ordinary implementation comments need local accuracy and clarity checks, not an automatic full Document pass; bounded wording changes apply only affected perspectives. Illustrative pseudocode needs logical consistency, not an invented runtime or production test gate.
- Inputs read only as authority or evidence remain outside the reviewed set. Reading implementation to check a documented claim does not turn that implementation into a Code target. With no applicable reviewed content, a perspective is `skipped`, never `clean`; missing authority belongs in Scope, Coverage and Verdict, not a Finding from a skipped perspective.
- Use [Code review](references/code-review.md) for applicable behavior/tool checks and [Document review](references/document-review.md) for applicable explanation/usage checks. Mixed content selects both with bounded responsibilities; incidental exposure to a reference is not proof of selection or misrouting.

When fixed reviewed artifacts include changelogs, release notes, migration guides or public release descriptions, also use [release communication checks](references/release-communication.md) within the Document pipeline. Ordinary documents and release evidence read only as authority do not select this method.

## Inspect the fixed scope

Inspect in order: checkout state and the selected diff or structural boundary, selected authority, then the smallest direct behavior chain and evidence needed for a concrete question. Apply the checks relevant to each selected perspective and match verification to the actual content and changed risk. A comment/implementation or example/contract discrepancy yields one finding with both sides of the evidence; do not presume either side correct. Stop when applicable judgments are supported; do not broaden scope or execute snippets without authority.

Reuse traceable test evidence whose tested scope and relevant code, dependencies, configuration, tools, inputs and environment remain applicable. Run authorized checks only to fill evidence gaps or cover invalidated results and changed risk, unless execution is explicitly required. Still perform the requested fixed-scope semantic review: passing tests or an implementer summary cannot supply that judgment or required independence. Report reused evidence separately from new observations.

Choose read/search tools within the fixed scope. Recover a tool-only fault with another read-only method against the same comparison, authority and required evidence, after checking its scope and effects. Missing comparison or authority blocks dependent pipelines; other gaps follow their pipeline's gate. Report affected judgments, not an invented product defect or whole-review blocker. Supported findings remain valid, but an unestablished required judgment is not clean. Preserve named checks and required independence; do not repair through project mutation or unsafe probes.

## Report

Responses follow explicit language instruction, personal instructions, then conversation language, never project artifact-language settings. Preserve paths, commands, identifiers, WorkOwner/WorkRefs, `P0`-`P3` and `issues_found | clean | skipped | blocked`; use localized narration with differing machine values as secondary exact tokens.

Preserve this information, not mandatory headings or one line per field. Use a compact report for a clean bounded review; honor an explicitly required format:

- Scope: WorkOwner or direct request, fixed comparison, authoritative intent and exclusions with reasons; separate Code and Document results (`issues_found | clean | skipped | blocked`).
- Findings when present: severity/title, kind (`code | document | cross-artifact`), review axis, location, authority, evidence, impact, smallest correction and confidence (`high | medium | low`). Combine related information in sentences; report one root issue once even when both perspectives are affected.
- Coverage: each perspective's checked content, material omissions and unverified scope, including non-actionable gaps; distinguish reused evidence from new observations.
- Verdict: `blocked | findings | clean`; give the next action only when an issue, blocker or requested follow-up remains. Do not repeat the findings or evidence.

Use `clean` only after applicable checks find no actionable issue, `skipped` for no applicable content and `blocked` for missing required scope or authority. Omit empty Findings and unrelated no-op fields. Artifact kind follows affected content, not extension; two perspectives require neither two reports nor two reviewers. Order findings by severity and path: P0 critical security/data/breakage risk; P1 normal-path contract failure; P2 meaningful edge/maintenance risk; P3 narrow actionable improvement.

Illustrative compact finding, not an observed defect:

> [P1] Failure is reported as success — `src/save.ts:42` (`code`, failure contract, high confidence). The selected Spec requires rejection, but this catch returns success after a failed write, so callers acknowledge unsaved data. Preserve rejection and verify the failure path.

Return a report only. Do not edit files, apply fixes, change focus, create RSP artifacts, switch branches, stage, commit, push, open a PR, publish, delete, trigger external review, or approve. Later actions require separate explicit authority.
