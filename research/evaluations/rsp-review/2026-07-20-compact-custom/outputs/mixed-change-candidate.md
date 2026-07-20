## Review Scope
- Comparison: `HEAD` (`b0ddfc96cda45c84abc8d7a71108d90bda4d786a`) vs current working tree
- Intent: `.rsp/changes/run-result.md` — failures return `{ ok: false, error }`; user documentation must describe that result.
- Code: clean
- Document: issues_found
- Excluded: `.agents/` is untracked review-skill material, not part of the focused Change.

## Findings
### [P1] Usage documentation describes a different failure contract
- Artifact kind: cross-artifact
- Axis: Change and Spec fidelity / cross-artifact coherence
- Location: `docs/usage.md:3`
- Authority: `.rsp/changes/run-result.md` specifies `{ ok: false, error }` on failure.
- Evidence: `src/run.ts:2` returns `{ ok: false, error: 'failed' }`, while the user documentation says “Returns zero on failure.”
- Impact: Consumers following the documentation will handle a numeric return instead of the failure object and may fail to inspect `ok` or `error`.
- Suggested action: Document the returned failure object and its `ok` / `error` fields.
- Confidence: high

## Coverage
- Reviewed the complete `HEAD` working-tree diff and the focused Change.
- No tests or executable verification configuration are present in this repository; none were run.
- The code implementation matches the explicit failure-result requirement.

## Verdict
findings — correct `docs/usage.md` to describe the implemented failure result.