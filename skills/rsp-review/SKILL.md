---
name: rsp-review
description: Review a fixed change or explicit file set read-only against project authorities. Return separate Code and Document judgments; not open-ended discovery, implementation or approval.
license: MIT
metadata:
  author: oevery
  version: "2026.10.02.7"
---

# RSP Review

Review one fixed change scope without modifying it. Be concise, separate Code and Document judgment, and emit one deduplicated report.

## Fix scope and authority

Resolve before judging:

- one immutable comparison point or explicit fixed file set;
- reviewed files, including relevant untracked files named by the user;
- the selected WorkOwner when tracked: a Change WorkRef, or a Group reference with its Group Brief and direct child Changes; an untracked document review may use the explicit request and fixed file set without creating a Change;
- nearest project instructions and only relevant Specs and Decision Records;
- any caller-supplied implementation summary.

Do not switch branches or mutate the worktree to discover scope. If the comparison point is unavailable, report the review as blocked. If the selected WorkOwner, included WorkRefs, or authorities select different intent, name the conflict, mark dependent pipelines blocked, and do not guess; multiple focus markers alone are only candidate context. Continue only pipelines whose inputs remain authoritative.

The user request fixes the requested outcome and allowed operations subject to nearest project instructions. The selected WorkOwner defines the intended delta: a Change uses its WorkRef, while a Group uses its Brief and direct child Changes. Specs define current contracts, boundaries, and necessary constraints; Decision Records define lasting rationale. Implementation and tests are evidence, not authority for missing requirements. Report missing authority instead of inventing a rule, acceptance criterion, or preference.

## Select perspectives before loading

Code and Document are complementary review perspectives, not exclusive file kinds. Fix scope and authority first; select from the reviewed content and its risk, not the extension, code fence or presence of a comment. A narrower request wins over whole-file defaults.

- **Code:** behavior, contracts, safety and failures of reviewed executable instructions/code, runnable recipes, algorithmic logic or tool-interpreted content. A prose behavior claim alone can remain Document grounding.
- **Document:** factual explanation, usability, navigation and maintenance, including API/TSDoc comments, requirements and human- or agent-facing guidance.
- Complete Skill instruction reviews normally apply both. Ordinary implementation comments need local accuracy and clarity checks, not an automatic full Document pass; bounded wording changes apply only affected perspectives. Illustrative pseudocode needs logical consistency, not an invented runtime or production test gate.
- Inputs read only as authority or evidence remain outside the reviewed set. Reading implementation to check a documented claim does not turn that implementation into a Code target. With no applicable reviewed content, a perspective is `skipped`, never `clean`; missing authority belongs in Scope, Coverage and Verdict, not a Finding from a skipped perspective.
- Load [Code review](references/code-review.md) for applicable behavior/tool checks and [Document review](references/document-review.md) for applicable explanation/usage checks. Mixed content loads both with bounded responsibilities; incidental exposure to a reference is not proof of selection or misrouting.

When fixed reviewed artifacts include changelogs, release notes, migration guides or public release descriptions, also load [release communication checks](references/release-communication.md) within the Document pipeline. Ordinary documents and release evidence read only as authority do not select this method.

## Inspect the fixed scope

Inspect in order: fixed status and diff, selected authority, then the smallest direct behavior chain and evidence needed for a concrete question. Apply the checks relevant to each selected perspective and match verification to the actual content and changed risk. A comment/implementation or example/contract discrepancy yields one finding with both sides of the evidence; do not presume either side correct. Stop when applicable judgments are supported; do not broaden scope or execute snippets without authority.

Choose read/search tools within that scope. If inspection fails because of a tool-only fault, use another read-only method against the same comparison, authorities and evidence requirement; establish its actual scope and effects before continuing. A tool switch cannot replace a missing comparison or authority, waive a named required check, or supply required independent acceptance. Missing comparison or authority blocks dependent pipelines; other missing evidence follows the applicable pipeline's gate. Do not repair tools through project mutation or run unsafe probes.

## Report

Render headings, field labels, explanations, and verdict prose in the language explicitly requested by the user; otherwise follow nearest project instructions, then the conversation language. Treat the shape below as semantic field order rather than fixed English wording: translate its human-facing labels when the output language differs. Preserve paths, commands, identifiers, WorkOwner references, WorkRefs, severity labels `P0`-`P3`, and the values `issues_found`, `clean`, `skipped`, and `blocked` unchanged; when their language differs from the response, retain those values only as secondary exact tokens beside localized narration.

Use this semantic shape with localized headings and labels:

```md
## Review Scope
- WorkOwner: <Change WorkRef, Group reference, or direct document request>
- Comparison: <fixed ref, range, or file set>
- Intent: <authorities, missing, or ambiguous>
- Code: <issues_found | clean | skipped | blocked>
- Document: <issues_found | clean | skipped | blocked>
- Excluded: <paths and reasons, or none>

## Findings
### [P0-P3] <title>
- Artifact kind: <code | document | cross-artifact>
- Axis: <applicable review axis>
- Location: <path:line or precise section>
- Authority: <authority or observed invariant>
- Evidence: <conflicting behavior or text>
- Impact: <real consequence>
- Suggested action: <smallest correction; no edit>
- Confidence: <high | medium | low>

## Coverage
- <checked and unverified scope, including non-actionable missing coverage>

## Verdict
<blocked | findings | clean, with the smallest next action>
```

Omit Finding entries when none exist. `clean` means applicable checks were completed with no actionable issue; `skipped` means no applicable reviewed content; `blocked` means required scope or authority was unavailable. State each perspective's checked content and material limits in Coverage; two perspective results require neither two reports nor two reviewers. Artifact kind describes affected content, not its extension or the number of perspectives. A root issue affecting both perspectives is reflected in both results but reported once. Order findings by severity and path. Use P0 for critical security, data, or breakage risk, P1 for normal-path contract failure, P2 for a meaningful edge or maintenance risk, and P3 only for narrow actionable improvement.

Return a report only. Do not edit files, apply fixes, change focus, create RSP artifacts, switch branches, stage, commit, push, open a PR, publish, delete, trigger external review, or approve. Later actions require separate explicit authority.
