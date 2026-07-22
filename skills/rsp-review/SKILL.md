---
name: rsp-review
description: Review an RSP-tracked code, document, or mixed change against a fixed comparison scope and project authorities. Use for read-only findings before fixes, durable review, archive, or delivery; keep Code and Document states separate and never implement, commit, publish, or approve.
license: MIT
metadata:
  author: oevery
  version: "2026.07.22.3"
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

Determine applicability only from artifacts inside the fixed comparison scope. A Change, Spec, instruction, implementation file, or test read only as authority or evidence is not thereby a reviewed artifact. Run each applicable pipeline; return `skipped` for a pipeline with no reviewed artifacts even when authority of that kind was inspected, and never return `clean` for authority-only documents. When such authority is missing, ambiguous, or conflicting, record it in Review Scope, Coverage, and Verdict; do not emit a Finding owned by a skipped pipeline. An executable document may need both; merge evidence for the same underlying issue into one cross-artifact finding.

Inspect in a bounded order: fixed status/diff, selected authority, then only the smallest direct behavior chain and tests needed to resolve a concrete question. Stop when every applicable pipeline can be judged. Do not search unrelated files or broaden authority merely to fill Coverage or Findings.

## Review Code

Check in this order:

1. Safety and correctness: reachable bugs, data loss, security violations, invalid state transitions, broken contracts, unsafe failures, and regressions.
2. Change and Spec fidelity: observable behavior against explicit intent and stable facts.
3. Project standards: only rules established by nearest instructions or authoritative local conventions.
4. Production reachability — hard gate before completing a seam-dependent Finding: when a Finding or suggested correction depends on an adapter, wrapper, validator, normalizer, or similar seam, name the direct production caller, compare its actual callee with that seam, and verify that the changed production consumer actually reaches that seam. Put the comparison in Evidence or Coverage. If the live path bypasses the seam, report the bypass and do not present an isolated seam fix as sufficient.
5. Regression evidence — hard gate before `clean`: for every changed Code artifact, compare public return and failure behavior at the comparison point with the reviewed diff. Changing failure delivery between throw/rejection, sentinel values, `null`, status codes, or result objects is always a failure-contract change, even when implementation matches the selected Change. Without a focused test or other explicit verification evidence, emit a Finding and return `issues_found`. Absence of a new test is not actionable by itself: apply the simple deterministic-correction exception when the public behavior shape is preserved and no risky branch, state transition, concurrency, persistence, security behavior, or failure delivery changes, even though the corrected value differs. The exception never applies to a failure-contract change.
6. Simplicity: unnecessary abstraction, duplication, indirection, dependency, or scope expansion with a concrete smaller alternative; never trade away required behavior.

Anchor each Finding to changed lines or the smallest behavior chain. State a realistic trigger and impact. Do not report formatting, naming, generated output, taste, or hypothetical cleanup without authority or demonstrated downside.

## Review Documents

Classify each document by its semantic role: requirement/Change, implementation plan, Spec, Decision Record/ADR, or explanatory/user documentation. Then check:

1. Authority and traceability of claims and decisions.
2. Internal and cross-artifact coherence, including current implementation facts.
3. Completeness and ambiguity: undefined terms, unverifiable completion, and choices disguised as decisions. Report an unresolved product, operational, rollback, migration, or completion choice as an ambiguity Finding when no authority resolves it; ask for owner judgment and mark a dependent result blocked only when the choice prevents coherent review.
4. Feasibility of named paths, interfaces, sequencing, safety, migration, and executable verification, at the detail appropriate to the document role.
5. Scope and concision: scope leakage, duplicate authority, unrelated requirements, or verbosity hiding a contract.

Before the Document verdict, enumerate every unresolved choice in each changed document. Any unresolved product, operational, rollback, migration, ownership, or completion choice must either have resolving authority or produce an ambiguity Finding; do not stop after finding other defects.

Anchor Findings to the smallest heading or claim. Do not apply code-style or test-coverage rules to semantic documents, auto-fix meaning, or rewrite prose for taste.

## Report

Render headings, field labels, explanations, and verdict prose in the language explicitly requested by the user; otherwise follow nearest project instructions, then the conversation language. Treat the shape below as semantic field order rather than fixed English wording: translate its human-facing labels when the output language differs. Preserve paths, commands, identifiers, WorkRefs, severity labels `P0`-`P3`, and the values `issues_found`, `clean`, `skipped`, and `blocked` unchanged.

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

Omit Finding entries when none exist. `clean` means an applicable pipeline was reviewed with no actionable issue; `skipped` means no applicable artifacts; `blocked` means required scope or authority was unavailable. Deduplicate one underlying issue across pipelines, then order by severity and path. Use P0 for critical security/data/breakage, P1 for normal-path contract failure, P2 for a meaningful edge or maintenance risk, and P3 only for narrow actionable improvement.

Return a report only. Do not edit files, apply fixes, change focus, create RSP artifacts, switch branches, stage, commit, push, open a PR, publish, delete, trigger external review, or approve. Later actions require separate explicit authority.
