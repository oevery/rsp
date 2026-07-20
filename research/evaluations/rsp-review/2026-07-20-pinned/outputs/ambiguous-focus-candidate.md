## Review Scope

- Comparison: `HEAD` → current working tree
- Intent: blocked — both `.rsp/focus.d/first` and `.rsp/focus.d/second` select conflicting Changes
- Code: blocked
- Document: skipped
- Excluded: `.agents/skills/rsp-review/SKILL.md` — untracked review instruction, not a changed product artifact

## Findings

### [P1] Conflicting RSP Change focus prevents authoritative code review
- Artifact kind: document
- Axis: authority gap
- Location: `.rsp/focus.d/first`, `.rsp/focus.d/second`
- Authority: RSP focus selection
- Evidence: `first` requires “Return the first value,” while `second` requires “Return the second value.” Both are active, and `src/value.ts` changes the value to `'new'`.
- Impact: No single authoritative intent can determine whether the code change is correct.
- Suggested action: Select exactly one active Change, then rerun the review.
- Confidence: high

## Coverage

- Fixed the comparison point at `HEAD` and inspected the current diff: `src/value.ts`.
- Did not judge changed code because the authoritative RSP intent is ambiguous.
- No changed document artifacts were reviewed.

## Verdict

blocked — resolve the duplicate conflicting focus selection.