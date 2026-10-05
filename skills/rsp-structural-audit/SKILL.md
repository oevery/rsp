---
name: rsp-structural-audit
description: Audit an explicitly bounded codebase for structural risks in ownership, module dependencies, production paths, change amplification or verification. Report-only discovery, not fixed-change review, design or specialist audits.
license: MIT
metadata:
  author: oevery
  version: "2026.10.05.1"
---

# RSP Structural Audit

Discover the few structural risks worth considering next. Return a report only.

## Trigger and input

Use this Skill when the user wants to discover material structural risks in an existing codebase before a Change, fixed review scope, or bounded design question exists. Require one explicit repository or subtree boundary and honor narrower user questions and exclusions. An RSP Change is not required; if one is focused, use it only when it matches the requested scope.

Read nearest project instructions and context first. Then inspect only the smallest useful chain of entry points, direct callers or consumers, state and data owners, relevant configuration, and focused tests. Treat implementation, tests, comments, and directory structure as evidence rather than product authority.

Module dependency direction is in scope. Third-party package selection, version or vulnerability audits are not. Do not substitute this audit for security, performance, framework, style, production-readiness or speculative cleanup work. Return that mismatch and the required specialist owner instead.

## Authority

The user owns the audit boundary and requested outcome. Project instructions, Specs, and decisions own established constraints. A focused Change may provide intent or scope but grants no additional mutation authority.

Own only the response report: no project/RSP/Git/external mutation, Change creation, product decision, solution design, fix or invocation of another Skill.

## Action and verification

After scope and authority are fixed, read [structural audit lenses](references/structural-lenses.md) and select only the lenses relevant to evidence already encountered. Trace concrete owners and live paths with suitable read/search tools; do not scan every directory or apply every lens mechanically. A diagnosed inspection-tool fault permits another read-only method within the same boundary and evidence requirement. Missing decisive evidence remains uncertainty; tools grant no repair, probe or expanded audit authority.

Qualify a finding only when exact repository evidence establishes a reachable trigger, a realistic impact, and the implicated ownership or behavior chain. Verify a seam-dependent finding by naming the direct production consumer and confirming whether its actual callee reaches or bypasses the seam. Compare focused tests or other verification evidence with that same live path when the finding depends on claimed coverage.

Report the smallest unresolved shaping or design question as `Next owner`. Route solution alternatives, seam recommendations, and reversible probes to Shape's conditional read-only design mode; do not develop them inside this audit.

Do not infer a finding from directory names, pattern matching, code size, framework taste, a generic checklist, or an isolated abstraction without a demonstrated downside. Prefer no finding to a weak finding. Stop inspecting when the requested boundary has enough evidence for at most five material findings, no qualifying finding remains, or further confidence requires authority or evidence outside the boundary.

## Output

Responses follow explicit language instruction, personal instructions, then conversation language, never project artifact-language settings. Preserve paths, severity/confidence and `findings | clean | scoped uncertainty`; use localized narration with differing machine values as secondary exact tokens.

Report scope first: repository/subtree, governing authority and material gaps, inspected entry points/chains and exclusions. Then give at most five findings ranked by impact and confidence, coverage limits and `findings | clean | scoped uncertainty` with the smallest needed next action. Headings and empty Findings sections are unnecessary.

Each finding identifies P1–P3 severity, risk, relevant lens, exact paths and chain, reachable trigger, consequence, confidence (`high | medium | low`) and the smallest question for its next owner. Coverage states checked paths, remaining uncertainty and unobserved runtime behavior. For example, an illustrative finding might read:

> [P2] Competing status writers (ownership; high confidence). `api/save.ts` writes a status that `jobs/retry.ts` later replaces from an older snapshot; concurrent retry can erase completion. Next owner: Shape should resolve which writer owns the transition. Runtime concurrency has not been observed.

Use `clean` when the inspected boundary contains no evidenced structural risk. Use `scoped uncertainty` when missing authority, inaccessible evidence, or an unsafe runtime requirement prevents judgment; name exactly what is missing and its owner. Do not manufacture advice to fill the report.

## Stop

Stop before auditing when the boundary or owner intent is materially ambiguous. Stop during inspection when evidence requires credentials, an unsafe or destructive probe, production side effects, mutation, or material expansion beyond the explicit boundary. Return the evidence collected, the unverified claim, and one smallest next action. Never continue into shaping, design, implementation, review, archive, Git delivery, publication, deployment, or approval.
