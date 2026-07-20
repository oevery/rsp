## Review Scope

- Comparison: `HEAD` (`c4c223a`) against current working tree
- Intent: `.rsp/focus.d/clamp` selects Change `clamp`; `.rsp/changes/clamp.md` requires inclusive lower/upper bounds
- Code: clean
- Document: clean
- Excluded: `.agents/skills/rsp-review/SKILL.md` is untracked review tooling, not implementation scope

## Findings

None.

## Coverage

- Checked the complete tracked diff in `src/clamp.ts`.
- Confirmed the implementation now returns `min` below range, `max` above range, and preserves in-range and boundary values.
- `git diff --check` passes.
- No test harness or test files are present; additional coverage is non-actionable for this small deterministic correction.

## Verdict

clean — no actionable defect or unnecessary complexity found.