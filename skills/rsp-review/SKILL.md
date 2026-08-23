---
name: rsp-review
description: Review an RSP-tracked code, document, or mixed change against a fixed comparison scope and project authorities without modifying files. Use for read-only findings before fixes, durable review, archive, or delivery; keep Code and Document states separate and never implement, commit, publish, or approve.
license: MIT
metadata:
  author: oevery
  version: "2026.08.19.1"
---

# RSP Review

Review one fixed change scope without modifying it. Be concise, separate Code and Document judgment, and emit one deduplicated report.

## Fix scope and authority

Resolve before judging:

- one immutable comparison point or explicit fixed file set;
- reviewed files, including relevant untracked files named by the user;
- the selected Change and, for grouped work, its Group Brief;
- nearest project instructions and only relevant Specs and Decision Records;
- any caller-supplied implementation summary.

Do not switch branches or mutate the worktree to discover scope. If the comparison point is unavailable, report the review as blocked. If multiple focus markers or authorities select different intent, name the conflict, mark dependent pipelines blocked, and do not guess. Continue only pipelines whose inputs remain authoritative.

The user request fixes the requested outcome and allowed operations subject to nearest project instructions. The selected Change defines the intended delta, Specs define stable current facts, and Decision Records define lasting rationale. Implementation and tests are evidence, not authority for missing requirements. Report missing authority instead of inventing a rule, acceptance criterion, or preference.

## Classify before loading

Do not read a pipeline reference until scope and authority are fixed. Then:

1. Classify only fixed reviewed artifacts. **Code** includes executable code, tests, configuration, scripts, schemas, executable prompts, Skills, commands, hooks, and workflows. **Document** includes requirements, plans, Changes, Specs, Decision Records, ADRs, explanatory documentation, and user-facing documentation. An executable document may require both.
2. Inputs read only as authority or evidence are authority-only, not reviewed artifacts. With no reviewed artifacts, a pipeline is `skipped`, never `clean`. Record missing, ambiguous, or conflicting authority in Review Scope, Coverage, and Verdict, not as a Finding from a skipped pipeline.
3. Load [Code review](references/code-review.md) only if Code applies and [Document review](references/document-review.md) only if Document applies. A mixed review loads both; authority-only artifacts trigger neither.

Run every applicable pipeline and merge the same underlying issue into one cross-artifact finding. Inspect in order: fixed status and diff, selected authority, then the smallest direct behavior chain and tests needed for a concrete question. Stop when all applicable pipelines can be judged; do not search unrelated files or broaden authority to fill Coverage or Findings.

## Report

Render headings, field labels, explanations, and verdict prose in the language explicitly requested by the user; otherwise follow nearest project instructions, then the conversation language. Treat the shape below as semantic field order rather than fixed English wording: translate its human-facing labels when the output language differs. Preserve paths, commands, identifiers, WorkRefs, severity labels `P0`-`P3`, and the values `issues_found`, `clean`, `skipped`, and `blocked` unchanged; when their language differs from the response, retain those values only as secondary exact tokens beside localized narration.

Use this shape:

```md
## <localized Review Scope heading>
- <localized Comparison label>: <fixed ref, range, or file set>
- <localized Intent label>: <authorities, missing, or ambiguous>
- <localized Code label>: <issues_found | clean | skipped | blocked>
- <localized Document label>: <issues_found | clean | skipped | blocked>
- <localized Excluded label>: <paths and reasons, or none>

## <localized Findings heading>
### [P0-P3] <title>
- <localized Artifact kind label>: <code | document | cross-artifact>
- <localized Axis label>: <pipeline axis>
- <localized Location label>: <path:line or precise section>
- <localized Authority label>: <authority or observed invariant>
- <localized Evidence label>: <conflicting behavior or text>
- <localized Impact label>: <real consequence>
- <localized Suggested action label>: <smallest correction; no edit>
- <localized Confidence label>: <high | medium | low>

## <localized Coverage heading>
- <checked and unverified scope, including non-actionable missing coverage>

## <localized Verdict heading>
<blocked | findings | clean, with the smallest next action>
```

Omit Finding entries when none exist. `clean` means an applicable pipeline was reviewed with no actionable issue; `skipped` means no applicable artifacts; `blocked` means required scope or authority was unavailable. Deduplicate one underlying issue across pipelines, then order by severity and path. Use P0 for critical security, data, or breakage risk, P1 for normal-path contract failure, P2 for a meaningful edge or maintenance risk, and P3 only for narrow actionable improvement.

Return a report only. Do not edit files, apply fixes, change focus, create RSP artifacts, switch branches, stage, commit, push, open a PR, publish, delete, trigger external review, or approve. Later actions require separate explicit authority.
