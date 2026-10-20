---
name: rsp-review
description: Judge a fixed change or file set, or discover evidenced structural risks in an explicitly bounded repository or subtree. Authorized supporting checks are part of this read-only review; declared-check reporting alone belongs to Verify. No repair or approval.
license: MIT
metadata:
  author: oevery
  version: "2026.10.16.5"
---

# RSP Review

For tracked work, read the [shared work model](../rsp/references/work-model.md) when its identity and ownership definitions are missing from the current context. Use logical WorkRefs in commands and reports; cite file locations separately. Direct invocation needs no prior Core execution.

Review one fixed change/file set or bounded structural scope read-only. Apply relevant perspectives and report each issue once. Run supporting checks within this review; named checks alone require no separate Verify pass. Honor combined requests and independent-evidence obligations. Judging implementation completeness grants no lifecycle completion or closeout authority.

## Fix scope and authority

Resolve before judging:

- one immutable comparison point or explicit fixed file set for change review; for structural discovery, one explicit repository/subtree boundary and its observed checkout state, without requiring a diff;
- content being judged, including relevant untracked files named by the user, distinguished from reference-only authority and evidence;
- the selected WorkOwner when tracked: a Change WorkRef, or a Group reference with its Group Brief and direct child Changes; an untracked review may use the explicit request and fixed file set without creating a Change;
- nearest project instructions and only relevant Specs and Decision Records;
- any caller-supplied implementation summary.

Do not switch branches or mutate the worktree to discover scope. If a required change-review comparison point is unavailable, report the review as blocked. If the selected WorkOwner, included WorkRefs, or authorities select different intent, name the conflict, mark dependent pipelines blocked, and do not guess; multiple focus markers alone are only candidate context. Continue only pipelines whose inputs remain authoritative.

The user request fixes the requested outcome and allowed operations subject to nearest project instructions. The selected WorkOwner defines the intended delta: a Change uses its WorkRef, while a Group uses its Brief and direct child Changes. Specs define current contracts, boundaries, and necessary constraints; Decision Records define lasting rationale. Implementation and tests are evidence, not authority for missing requirements. Report missing authority instead of inventing a rule, acceptance criterion, or preference.

## Select perspectives before loading

After fixing an explicit structural-discovery scope, load [structural review](references/structural-review.md) for ownership, dependency, production-path and verification lenses; no diff is required. Within fixed-change review, use those lenses only for a concrete structural risk in the same boundary; do not expand into a repository audit. Return evidenced findings and the smallest correction or unresolved design question, not a replacement design or implementation. Keep the report and verdict semantics below.

Select methods from the judged content and its risks. Supporting references inform the judgment without becoming additional review targets. Respect narrower requested scope and reuse applicable instructions already in context.

- **[Code](references/code-review.md):** behavior, contracts, safety and failures of reviewed executable instructions/code, runnable recipes, algorithmic logic or tool-interpreted content. A prose behavior claim alone can remain Document grounding.
- **[Document](references/document-review.md):** factual explanation, usability, navigation and maintenance of reviewed content, including API/TSDoc comments, requirements and human- or agent-facing guidance.
- Mixed targets receive both applicable perspectives; complete Skill instruction reviews normally need both. Ordinary implementation comments need local accuracy/clarity checks, not an automatic full Document pass; bounded wording changes need only affected perspectives. Illustrative pseudocode needs logical consistency, not an invented runtime or production test gate.

When fixed reviewed artifacts include changelogs, release notes, migration guides or public release descriptions, also use [release communication checks](references/release-communication.md) within the Document pipeline. Ordinary documents and release evidence read only as authority do not select this method.

## Inspect the fixed scope

Inspect checkout state and the selected diff or structural boundary, then authority, then the smallest behavior chain and evidence needed for the question. Match checks to each perspective, actual content and changed risk. Report a comment/implementation or example/contract discrepancy once, with evidence from both sides; presume neither correct. Stop when applicable judgments are supported. Do not broaden scope or execute snippets without authority.

Reuse traceable test evidence while its tested scope and relevant code, dependencies, configuration, tools, inputs and environment still apply. Run authorized checks only for gaps, invalidated results, changed risk or explicitly required execution. Distinguish reused evidence from new observations.

For re-review, inspect the actual correction and affected behavior against the original scope, expanding within it for evidenced consequences. Earlier clean verdicts do not establish a changed target; unchanged tests need no rerun solely for a new judgment. Perform the requested semantic review: neither passing tests nor an implementer summary supplies that judgment or required independence.

Recover a tool-only fault within the fixed scope using another permitted read-only method after inspecting its scope and effects. Preserve the comparison, authority, named checks, required evidence and independence; project mutation and unsafe probes remain prohibited.

Missing comparison or authority blocks dependent pipelines; other gaps follow the applicable gate. Keep supported findings and identify affected judgments without inventing a product defect or whole-review blocker. An unestablished required judgment is not clean.

## Report

Responses follow explicit language instruction, personal instructions, then conversation language, never project artifact-language settings. Preserve paths, commands, identifiers, WorkOwner/WorkRefs, `P0`-`P3` and `issues_found | clean | skipped | blocked`; use localized narration with differing machine values as secondary exact tokens.

Preserve the information below without mandatory headings or one line per field. Use a compact report for a clean bounded review, omit empty Findings and unrelated no-op fields, and honor explicitly required formats:

- Scope: WorkOwner or direct request, fixed comparison, authoritative intent, applicable perspectives and material exclusions.
- Findings when present: severity/title, kind (`code | document | cross-artifact`), review axis, location, authority, evidence, impact, smallest correction and confidence (`high | medium | low`). Combine related information in sentences; report one root issue once even when both perspectives are affected.
- Coverage: each perspective's checked content, material omissions and unverified scope, including non-actionable gaps; distinguish reused evidence from new observations.
- Verdict: `blocked | findings | clean`; give the next action only when an issue, blocker or requested follow-up remains. Do not repeat the findings or evidence.

Use `clean` only for an applicable judgment with no actionable issue, `skipped` for an inapplicable perspective when the requested format requires it, and `blocked` when required scope, authority or decisive evidence is missing. Findings require a demonstrated defect or explicit-requirement violation; missing evidence alone is a coverage limit. Retain supported findings while blocking only affected judgments. Two perspectives require neither two reports nor two reviewers.

Order findings by severity and path: P0 critical security/data/breakage risk; P1 normal-path contract failure; P2 meaningful edge/maintenance risk; P3 narrow actionable improvement.

Illustrative compact finding, not an observed defect:

> [P1] Failure is reported as success — `src/save.ts:42` (`code`, failure contract, high confidence). The selected Spec requires rejection, but this catch returns success after a failed write, so callers acknowledge unsaved data. Preserve rejection and verify the failure path.

Return a report only. Do not edit files, apply fixes, change focus, create RSP artifacts, switch branches, stage, commit, push, open a PR, publish, delete, trigger external review, or approve. Later actions require separate explicit authority.
