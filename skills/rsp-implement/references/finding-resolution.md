# Bounded fixed-report finding resolution

Load only for one fixed read-only Review report and its original comparison or file set. Inspect report identity (order, severity, title, location), current checkout, investigation authority and the smallest affected behavior chain. Read the selected Change when tracked; an authorized direct investigation needs no Change. A report alone grants no investigation, correction, fresh external checks or Git authority. Preserve unrelated staged, modified and untracked work.

Give every Finding one evidence-backed disposition:

- `accepted`: the issue is confirmed against the governing contract and bounded investigation evidence.
- `rejected`: direct evidence disproves it or authority does not require the suggestion.
- `needs-clarification`: intended behavior, reproducible trigger, owner or safe investigation scope is missing.

Do not silently reinterpret, accept politely or reject intuitively. Acceptance of a finding grants no correction authority. If only investigation is authorized, return dispositions and the smallest next action without edits.

## Correct only with separate authority

Confirm the intended correction and exact mutation boundary before fixing accepted Findings in one bounded pass. One correction may address several findings while preserving their separate dispositions.

After the last edit, run fresh affected and declared checks. Failure, unavailability, stale evidence or omission cannot close a Finding. Preserve the original report. Request fresh fixed-scope, read-only Review with the original comparison, authority, post-fix paths, dispositions and evidence; the implementer cannot certify review-clean. Correlate its result on return.

Continue only while original authority and scope still hold and evidence improves. Stop after at most three finding-resolution passes, or earlier when the same Finding survives two corrections. Repeated evidence cannot justify a self-loop. A material new requirement, changed scope, missing authority or `needs-clarification` stops for the owner.

Return dispositions, changed paths, checks, re-review status, unresolved Findings and next action. Keep transient pass counts outside the durable Change.
