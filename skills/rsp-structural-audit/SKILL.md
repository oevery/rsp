---
name: rsp-structural-audit
description: Audit one explicitly bounded repository or subtree for evidence-backed structural risks before implementation work is selected. Use for report-only discovery of ownership, dependency, production-path, change-amplification, or verification mismatches; do not use for security, performance, dependency, framework, style, or production-readiness audits.
license: MIT
metadata:
  author: oevery
  version: "2026.07.28.1"
---

# RSP Structural Audit

Discover the few structural risks worth considering next. Return a report only.

## Trigger and input

Use this Skill when the user wants to discover material structural risks in an existing codebase before a Change, fixed review scope, or bounded design question exists. Require one explicit repository or subtree boundary and honor narrower user questions and exclusions. An RSP Change is not required; if one is focused, use it only when it matches the requested scope.

Read nearest project instructions and context first. Then inspect only the smallest useful chain of entry points, direct callers or consumers, state and data owners, relevant configuration, and focused tests. Treat implementation, tests, comments, and directory structure as evidence rather than product authority.

Do not substitute this audit for security, performance, dependency, framework, style, production-readiness, or speculative cleanup work. Return that mismatch and the required specialist owner instead.

## Authority

The user owns the audit boundary and requested outcome. Project instructions, Specs, and decisions own established constraints. A focused Change may provide intent or scope but grants no additional mutation authority.

This Skill owns only its response report. It never modifies project code, tests, configuration, documentation, RSP artifacts, focus, lifecycle state, Git state, or external systems. It does not create a Change, choose product intent, design a solution, apply a fix, or invoke another Skill.

## Action and verification

After scope and authority are fixed, read [structural audit lenses](references/structural-lenses.md) and select only the lenses relevant to evidence already encountered. Trace concrete owners and live paths; do not scan every directory or apply every lens mechanically.

Qualify a finding only when exact repository evidence establishes a reachable trigger, a realistic impact, and the implicated ownership or behavior chain. Verify a seam-dependent finding by naming the direct production consumer and confirming whether its actual callee reaches or bypasses the seam. Compare focused tests or other verification evidence with that same live path when the finding depends on claimed coverage.

Report the smallest unresolved shaping or design question as `Next owner`. Route solution alternatives, seam recommendations, and reversible probes to `rsp-design`; do not develop them inside this audit.

Do not infer a finding from directory names, pattern matching, code size, framework taste, a generic checklist, or an isolated abstraction without a demonstrated downside. Prefer no finding to a weak finding. Stop inspecting when the requested boundary has enough evidence for at most five material findings, no qualifying finding remains, or further confidence requires authority or evidence outside the boundary.

## Output

Render headings, field labels, explanations, and conclusions in the language explicitly requested by the user; otherwise follow nearest project instructions, then the conversation language. Treat the shape below as semantic field order rather than fixed English wording, while preserving paths, severity labels, confidence values, and the result values `findings`, `clean`, and `scoped uncertainty`.

Return findings ranked by material impact, then confidence. Emit at most five and use this shape:

```md
## Audit scope
- Boundary: <repository or subtree>
- Authority: <instructions, constraints, and material gaps>
- Inspected: <entry points and smallest behavior chains>
- Excluded: <explicit exclusions and unsupported specialist audits>

## Findings
### [P1-P3] <structural risk>
- Lens: <ownership | dependency | production path | change amplification | verification>
- Evidence: <exact paths and concrete chain>
- Trigger: <reachable condition>
- Impact: <real consequence>
- Confidence: <high | medium | low>
- Next owner: <smallest shaping or design question, or user decision>

## Coverage
- <checked paths, unresolved uncertainty, and unobserved runtime behavior>

## Result
<findings | clean | scoped uncertainty, with the smallest next action>
```

Use `clean` when the inspected boundary contains no evidenced structural risk. Use `scoped uncertainty` when missing authority, inaccessible evidence, or an unsafe runtime requirement prevents judgment; name exactly what is missing and its owner. Do not manufacture advice to fill the report.

## Stop

Stop before auditing when the boundary or owner intent is materially ambiguous. Stop during inspection when evidence requires credentials, an unsafe or destructive probe, production side effects, mutation, or material expansion beyond the explicit boundary. Return the evidence collected, the unverified claim, and one smallest next action. Never continue into shaping, design, implementation, review, archive, Git delivery, publication, deployment, or approval.
