## Review Scope

- Comparison: `HEAD` (`49b08b7`)
- Intent: No Change, Spec, or project instructions found; assessed observable contract only.
- Code: issues_found
- Document: skipped
- Excluded: `.agents/` is untracked and not named for review.

## Findings

### [P1] Null input now throws despite the declared contract

- Artifact kind: code
- Axis: Safety and correctness
- Location: `src/name.ts:2`
- Authority: Observed public signature accepts `string | null`.
- Evidence: `value!.trim()` dereferences `null`; the prior behavior returned an empty string.
- Impact: Any normal caller passing `null` receives a runtime `TypeError` instead of a displayable name.
- Suggested action: Preserve a null-safe branch before calling `trim()`.
- Confidence: high

## Coverage

- Checked the complete tracked `HEAD` diff and whitespace validity.
- No test or project verification configuration is present; missing coverage is non-actionable without an authority specifying expected trimming behavior.

## Verdict

findings — restore null-safe behavior while retaining trimming only if that is the intended product rule.