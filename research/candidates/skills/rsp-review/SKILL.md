---
name: rsp-review
description: Review an RSP-tracked code or document change against a fixed scope and its project authorities, using separate code and document pipelines and returning one read-only findings report.
license: MIT
metadata:
  author: oevery
  version: "2026.07.20.1"
---

# RSP Review

Review one fixed change scope without modifying it. Keep code and document judgment separate, then return one deduplicated report.

## Use this skill when

- The user asks to review an RSP-tracked implementation or document change.
- A focused Change needs a report before fixes, durable review, archive, or delivery.
- A mixed change needs code behavior checked together with affected documentation.

Do not use it to implement fixes, resolve review feedback, commit, push, open a PR, publish, delete, or approve. Those are separate actions requiring their own authority.

## Contract

### 1. Fix the review request

Resolve before judging:

- one immutable comparison point or an explicit fixed file set;
- the reviewed files, including relevant untracked files named by the user;
- the selected Change and, for grouped work, its Group Brief;
- nearest project instructions and only the relevant Specs and Decision Records;
- any implementation summary supplied by the caller.

Do not switch branches or mutate the worktree to discover scope. If the comparison point cannot be fixed, report the review as blocked. If focus or authority is ambiguous, name the ambiguity and continue only with pipelines whose inputs remain authoritative.

### 2. Partition by review object

- **Code:** executable code, tests, configuration, scripts, schemas, and executable agent documents such as `SKILL.md`, prompts, commands, hooks, and workflow definitions.
- **Document:** requirements, plans, RSP Changes, Specs, Decision Records, ADRs, explanatory documentation, and user-facing documentation.

Some executable documents need both code-contract and document-coherence evidence. Run both pipelines when useful, then emit one finding for one underlying issue.

Load [Code Review](references/code-review.md#axes) only when Code scope is present. Load [Document Review](references/document-review.md#classify-the-document) only when Document scope is present.

### 3. Preserve authority

- The user request and nearest project instructions govern allowed operations.
- The selected Change defines the intended delta.
- Specs define stable current facts; Decision Records define lasting rationale.
- The implementation and its tests are evidence, not authority over missing requirements.

Report conflicts or missing authority. Never invent a Spec, standard, acceptance criterion, or design preference.

### 4. Return one normalized report

Use this structure:

```md
## Review Scope
- Comparison: <fixed ref, range, or explicit file set>
- Intent: <selected Change and other authorities, or missing/ambiguous>
- Code: <issues_found | clean | skipped | blocked>
- Document: <issues_found | clean | skipped | blocked>
- Excluded: <paths and reasons, or none>

## Findings
### [P0-P3] <title>
- Artifact kind: <code | document | cross-artifact>
- Axis: <pipeline axis>
- Location: <path:line or smallest precise section>
- Authority: <Change, Spec, instruction, invariant, or observed behavior>
- Evidence: <concrete conflicting behavior or text>
- Impact: <why this matters>
- Suggested action: <smallest correction; no automatic edit>
- Confidence: <high | medium | low>

## Coverage
- <what each applicable pipeline checked and could not check>

## Verdict
<blocked | findings | clean, with the smallest next action>
```

Omit the Findings entries when there are none, but keep pipeline statuses and Coverage. `clean` means the pipeline reviewed its scope and found no actionable issue. `skipped` means no applicable artifacts were reviewed. `blocked` means required scope or authority was unavailable.

Order findings by severity, then path. Deduplicate the same underlying issue across pipelines and retain both kinds of evidence in the merged finding. Report only actionable defects, meaningful risks, or concrete authority gaps; do not manufacture cleanup to make the report look useful.

## Read-only boundary

Review is report-only. Do not edit reviewed files, apply safe fixes, change focus, create RSP artifacts, switch branches, stage, commit, push, open a PR, publish, delete, or trigger external review. A later explicitly authorized workflow may verify and resolve selected findings.
