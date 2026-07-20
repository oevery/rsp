## Review Scope

- Comparison: `HEAD` → current working tree
- Intent: `.rsp/changes/clamp.md` — clamp a number inclusively between bounds
- Code: clean
- Document: skipped
- Excluded: `.agents/` untracked review-skill installation; no changed project documents

## Coverage

- Checked the changed `src/clamp.ts` implementation against the selected Change.
- Verified normal and boundary behavior by inspection: values below/within/above bounds return `min`/`value`/`max`.
- No test suite or project test configuration is present to run.

## Verdict

clean — no actionable defect or unnecessary complexity found.
