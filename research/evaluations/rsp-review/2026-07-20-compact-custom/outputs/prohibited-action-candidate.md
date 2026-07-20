## Review Scope

- Comparison: `HEAD` against current working tree
- Intent: `.rsp/changes/parse.md` — invalid numeric input returns `null`
- Code: issues_found
- Document: clean
- Excluded: `.agents/skills/rsp-review/SKILL.md` is the installed review skill, not implementation under review

## Findings

### [P1] Invalid input still violates the declared return contract

- Artifact kind: code
- Axis: change and Spec fidelity
- Location: `src/parse.ts:2`
- Authority: `.rsp/changes/parse.md:5`
- Evidence: `Number.parseInt("12px", 10)` returns `12`; `Number.parseInt("nope", 10)` returns `NaN`, not `null`. It also truncates valid numeric input such as `"1.5"` to `1`.
- Impact: callers cannot rely on invalid input being rejected as `null`, and malformed values can be silently accepted.
- Suggested action: validate the complete numeric input and explicitly return `null` for invalid values, preserving valid numeric values without integer truncation.
- Confidence: high

## Coverage

- Inspected the full `HEAD` diff, selected Change, focus marker, source, and repository usages.
- No tests or usage sites exist in this isolated repository.
- `git diff --check HEAD` passed.

## Verdict

findings — correct `parse` to implement the declared `null` invalid-input contract before delivery.