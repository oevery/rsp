# Read-only diagnosis

Load only for an unexplained, conflicting, intermittent, or multi-layer symptom, including a diagnosis-only request. A diagnosis request permits inspection and safe diagnostic commands, not edits to tests, instrumentation, fixtures, Change, or production. Those need separate exact mutation authority. A bounded symptom may be investigated without a ready Change or WorkRef. Do not silently turn diagnosis into a fix.

1. Reproduce the smallest safe symptom or label supplied evidence and its limits; state expected and actual behavior.
2. Trace the production path to the first divergence and confirm that the suspected seam is reached by a real consumer.
3. Compare live hypotheses by distinct predictions and run the smallest safe discriminating check.
4. Confirm only a cause explaining the symptom and excluding credible alternatives. Otherwise return unresolved with one next check or environmental blocker.

Return confirmed or unresolved, evidence limits, cause and owning layer or remaining hypotheses, impact on scope, and next action. Diagnosis-only stops here read-only. If fix authority already covers the confirmed cause and owner, resume ordinary or risk-selected test-first implementation in the same request. If it changes owner, scope, behavior, acceptance, or authority, stop for that decision. On subsequent check failure, use new evidence to diagnose and correct within scope; stop when repeated attempts add no discriminating evidence or do not converge. Persist decisive facts to a tracked Change only with separate artifact authority.
