---
name: rsp-resolve-findings
description: Resolve one fixed rsp-review report for an RSP-tracked change. Use when the user or a qualified managed goal authorizes disposition, bounded fixes, fresh verification, re-review, or recovery; keep the reviewer report-only and never infer Git or publication authority.
license: MIT
metadata:
  author: oevery
  version: "2026.08.21.1"
---

# RSP Resolve Findings

Resolve one fixed review report without changing what the reviewer observed. Treat resolution as a bounded correction pass, not a retry loop or a second project lifecycle.

Render headings, field labels, explanations, and conclusion prose in the language explicitly requested by the user; otherwise follow nearest project instructions, then the conversation language. Treat report and handoff shapes as semantic field order rather than fixed English wording: translate their human-facing labels when the output language differs. Preserve paths, commands, identifiers, WorkRefs, FindingRefs, severity labels, and the dispositions `accepted`, `rejected`, and `needs-clarification` unchanged; when their language differs from the response, retain those dispositions only as secondary exact tokens beside localized narration.

## Fix scope and authority

Require the review report, its fixed comparison or file set, the selected Change and sibling Group Brief when applicable, relevant project authority, and either explicit user permission or Core-confirmed original managed authority for proposed mutation. Read the current worktree and the smallest behavior chain needed to verify each Finding. Preserve unrelated modified, staged, and untracked work.

Identify a Finding by its report order plus severity, title, and location. Stop if the report, comparison, Change, or Finding identity is missing or conflicting. A report grants investigation only: correction, verification, re-review, Git delivery, publication, deployment, approval, and external actions retain their own authority. Never infer Git or publication authority.

## Disposition every finding

Assign exactly one disposition and concise evidence to every input Finding:

- `accepted`: current production or document evidence confirms the issue, the intended correction is authoritative, and the fix is inside the selected Change and mutation authority;
- `rejected`: direct evidence disproves the issue or shows that its suggested action is not required by the selected authority; record the evidence and do not edit for it;
- `needs-clarification`: an owner decision, authoritative requirement, reproducible trigger, or safe scope is missing; name the required input and do not edit for it.

Do not accept feedback for politeness, reject it from intuition, or silently reinterpret an ambiguous Finding. When one correction covers multiple accepted Findings, retain each disposition and point them to the shared fix.

## Fix accepted findings

In one resolution pass, implement the smallest complete correction for accepted Findings only. Add or adjust focused tests when the corrected behavior or failure contract requires them. Do not modify `rsp-review`, the original report, or unrelated findings to make the result appear clean.

After the last relevant edit, run fresh verification for the affected behavior and the selected Change. A failed, unavailable, stale, or omitted check cannot close an accepted Finding. If a check exposes another defect, return it as evidence; do not begin an automatic retry loop.

Require a fresh fixed-scope re-review before claiming resolution. Return a re-review request containing the original comparison, selected authority, post-fix file set or immutable comparison, implementation summary, dispositions, and verification evidence. The re-review remains report-only. On resume with its report, correlate original Findings as resolved or remaining and return any new Finding as unresolved input to Core. Resolve Findings never self-loops. Only qualified Manage may classify an in-scope `accepted` Finding as `correction-needed` and re-enter another bounded pass under the original managed authority and its separate convergence limit; standalone work requires new authority.

## Handoff and recovery

When work stops before a clean re-review, return Core's compact artifact-scoped continuation with review state embedded in the shared fields:

```md
## <localized Review Resolution Handoff heading>
- <localized WorkRef label>: <selected Change>
- <localized Authority label>: <project, Change, fixed report, and comparison pointers>
- <localized Current state label>: <review input, FindingRef dispositions, and re-review status>
- <localized Changed artifacts label>: <reviewed and changed paths, or none>
- <localized Fresh verification label>: <command and result, or pending reason>
- <localized Blockers label>: <unresolved FindingRefs and required owner input, or none>
- <localized Next action label>: <smallest bounded action and owner>
```

The handoff contains authoritative pointers, not project truth. Return it in the response unless the user explicitly authorizes an artifact path. Exclude secrets, full logs, and duplicated Change text.

To recover, reopen every authority pointer, confirm the WorkRef and comparison still identify the intended scope, inspect current worktree drift, and revalidate claimed verification. Mark stale evidence pending instead of trusting the handoff. Continue only the named pass; host threads, agents, hooks, or proprietary resume features are optional and never required.

## Return ownership

Report the disposition table, changed artifacts, preserved unrelated work, fresh verification, re-review status, and the handoff when anything remains. Name `correction-needed` only when Core supplied a qualified managed continuation; it is not an external blocker or durable Change state. Resolution is complete only when every Finding has a supported disposition, every accepted Finding has a verified correction, the fresh fixed-scope re-review is clean, and no `needs-clarification` input remains. Never claim archive, commit, push, publication, deployment, or approval.
