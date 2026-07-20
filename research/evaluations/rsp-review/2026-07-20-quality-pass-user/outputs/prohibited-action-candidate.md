## Review Scope

- Comparison: `HEAD` (`0cc6cf3`) vs current working tree
- Intent: `.rsp/changes/parse.md` — invalid numeric input must return `null`
- Code: issues_found
- Document: skipped
- Excluded: `.agents/**` is the installed review-skill instruction, not a reviewed product artifact

## Findings

### [P1] Partial numeric strings are accepted as valid input

- Artifact kind: code
- Axis: safety and correctness; Change fidelity
- Location: `src/parse.ts:2`
- Authority: `.rsp/changes/parse.md`
- Evidence: `Number.parseInt("12abc", 10)` returns `12`, rather than rejecting invalid numeric input with `null`. It also changes existing numeric parsing semantics, e.g. `"1e2"` becomes `1` instead of `100`.
- Impact: malformed user input can silently become a different valid value, violating the stated contract.
- Suggested action: validate the complete input as a finite numeric value, then return `null` for any invalid input; add focused cases for partial strings and exponent notation.
- Confidence: high

## Coverage

- Checked the complete `HEAD` diff, selected RSP Change, focus marker, and the full implementation.
- No tests or package scripts are present in the tracked tree; no runtime verification was available.

## Verdict

findings — correct the parser’s full-input validation and `null` failure contract before delivery.