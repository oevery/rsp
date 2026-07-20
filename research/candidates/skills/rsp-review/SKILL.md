---
name: rsp-review
description: Review an RSP-tracked code, document, or mixed change against a fixed comparison scope and project authorities. Use for read-only findings before fixes, durable review, archive, or delivery; keep Code and Document states separate and never implement, commit, publish, or approve.
license: MIT
metadata:
  author: oevery
  version: "2026.07.20.2"
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

## Classify the scope

- **Code:** executable code, tests, configuration, scripts, schemas, executable prompts, Skills, commands, hooks, and workflows.
- **Document:** requirements, plans, Changes, Specs, Decision Records, ADRs, explanatory documentation, and user-facing documentation.

Run each applicable pipeline. An executable document may need both; merge evidence for the same underlying issue into one cross-artifact finding.

## Review Code

Check in this order:

1. Safety and correctness: reachable bugs, data loss, security violations, invalid state transitions, broken contracts, unsafe failures, and regressions.
2. Change and Spec fidelity: observable behavior against explicit intent and stable facts.
3. Project standards: only rules established by nearest instructions or authoritative local conventions.
4. Regression evidence: make missing coverage a Finding only when explicit authority requires it or the change introduces a materially risky failure branch, state transition, concurrency, persistence, security behavior, or public contract shape. For a simple deterministic correction with no such risk, mention absent coverage only under Coverage.
5. Simplicity: unnecessary abstraction, duplication, indirection, dependency, or scope expansion with a concrete smaller alternative; never trade away required behavior.

Anchor each Finding to changed lines or the smallest behavior chain. State a realistic trigger and impact. Do not report formatting, naming, generated output, taste, or hypothetical cleanup without authority or demonstrated downside.

## Review Documents

Classify each document by its semantic role: requirement/Change, implementation plan, Spec, Decision Record/ADR, or explanatory/user documentation. Then check:

1. Authority and traceability of claims and decisions.
2. Internal and cross-artifact coherence, including current implementation facts.
3. Completeness and ambiguity: undefined terms, unverifiable completion, and choices disguised as decisions. Report an unresolved product, operational, rollback, migration, or completion choice as an ambiguity Finding when no authority resolves it; ask for owner judgment and mark a dependent result blocked only when the choice prevents coherent review.
4. Feasibility of named paths, interfaces, sequencing, safety, migration, and executable verification, at the detail appropriate to the document role.
5. Scope and concision: scope leakage, duplicate authority, unrelated requirements, or verbosity hiding a contract.

Anchor Findings to the smallest heading or claim. Do not apply code-style or test-coverage rules to semantic documents, auto-fix meaning, or rewrite prose for taste.

## Report

Use this shape:

```md
## Review Scope
- Comparison: <fixed ref, range, or file set>
- Intent: <authorities, missing, or ambiguous>
- Code: <issues_found | clean | skipped | blocked>
- Document: <issues_found | clean | skipped | blocked>
- Excluded: <paths and reasons, or none>

## Findings
### [P0-P3] <title>
- Artifact kind: <code | document | cross-artifact>
- Axis: <pipeline axis>
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

Omit Finding entries when none exist. `clean` means an applicable pipeline was reviewed with no actionable issue; `skipped` means no applicable artifacts; `blocked` means required scope or authority was unavailable. Deduplicate one underlying issue across pipelines, then order by severity and path. Use P0 for critical security/data/breakage, P1 for normal-path contract failure, P2 for a meaningful edge or maintenance risk, and P3 only for narrow actionable improvement.

Return a report only. Do not edit files, apply fixes, change focus, create RSP artifacts, switch branches, stage, commit, push, open a PR, publish, delete, trigger external review, or approve. Later actions require separate explicit authority.
