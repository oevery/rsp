# Bounded fixed-report finding resolution

Load only for one fixed read-only Review report and its original comparison or file set. Inspect report identity (order, severity, title, location), current checkout, investigation authority and the smallest affected behavior chain. Read the selected Change when tracked; an authorized direct investigation needs no Change. A report alone grants no investigation, correction, fresh external checks or Git authority. Preserve unrelated staged, modified and untracked work.

Give every Finding one evidence-backed disposition:

- `accepted`: the issue is confirmed against the governing contract and bounded investigation evidence.
- `rejected`: direct evidence disproves it or authority does not require the suggestion.
- `needs-clarification`: intended behavior, reproducible trigger, owner or safe investigation scope is missing.

Acceptance of a finding grants no correction authority. If only investigation is authorized, return dispositions and the smallest next action without edits.

## Correct only with separate authority

Confirm the intended correction and exact mutation boundary before fixing accepted Findings in one bounded pass. One correction may address several findings while preserving their separate dispositions.

After the last edit, rerun affected or missing declared checks and reuse traceable passes for unaffected inputs. Preserve the original report and return dispositions, actual changed paths, comparison, checks and limits to the caller. Failure, unavailability or stale evidence cannot close a Finding; the implementer cannot certify review-clean.

Use this method for one correction. For requested or required correction/review, [Core review convergence](../../rsp/references/coordination-review.md) owns fresh Review, continuation and pass limits. Direct invocation needs no earlier Core execution; its caller applies that loop only to the remaining authorized review obligation. For repair-only requests, return the correction and unperformed review status. Claim no acceptance or new review assignment.

Stop this pass for changed scope or authority, an unresolved material requirement, `needs-clarification`, unsafe effects or missing decisive evidence. Do not start a second local retry counter or reset the caller's count. Return any unresolved Findings and the exact next decision or evidence needed.
