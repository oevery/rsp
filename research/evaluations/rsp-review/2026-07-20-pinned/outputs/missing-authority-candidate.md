## Review Scope
- Comparison: `HEAD` (`e79c0944f52fc0feb807906eb085be908deaca64`) vs current working tree
- Intent: Missing — no Change, Spec, decision record, or project-local instructions were present
- Code: issues_found
- Document: skipped
- Excluded: `.agents/` untracked review-skill files; not part of `git diff HEAD`

## Findings
### [P1] Null input now throws instead of producing a display value
- Artifact kind: code
- Axis: Safety and correctness
- Location: `src/name.ts:2`
- Authority: Observed prior public behavior and declared parameter type `string | null`
- Evidence: Replacing `value ?? ''` with `value!.trim()` causes `displayName(null)` to throw at runtime; the non-null assertion only suppresses TypeScript checking.
- Impact: Any caller passing the declared valid `null` value will fail instead of receiving the previous empty-string result.
- Suggested action: Preserve an explicit null fallback before trimming, if trimming is intended.
- Confidence: high

### [P2] Changed public behavior has no focused verification
- Artifact kind: code
- Axis: Project standards and regression coverage
- Location: `src/name.ts:2`
- Authority: Code-review requirement for focused verification of changed externally observable contracts
- Evidence: The function’s output behavior changes for whitespace-only strings, while `null` changes to a failure path; no tests or other verification evidence exists in the reviewed scope.
- Impact: The intended behavior and the null regression are not guarded against future changes.
- Suggested action: Add focused coverage for `null`, ordinary strings, and whitespace-only strings once the intended contract is supplied.
- Confidence: high

## Coverage
- Code: Reviewed the complete `HEAD` working-tree diff and executable implementation for correctness, observable contract changes, and available project standards. Change/spec fidelity could not be assessed because no governing product authority was available.
- Document: No documentation artifacts were in scope.

## Verdict
findings — first restore safe handling of the declared `null` input; then confirm the intended whitespace behavior and add focused verification.