# Code review

Load for behavior or tool semantics within the fixed reviewed content. Document examples, API comments and executable instructions can need Code checks without making their entire containing file or evidence source an implementation-review target.

Match checks and evidence to the actual role and changed risk:

- Copyable examples: syntax, prerequisites, API/command compatibility, outcomes and dangerous side effects; execute only with authority.
- API comments: declared inputs, returns and failures against authority and implementation. Type, compiler, lint or generation annotations can affect tooling despite comment syntax.
- Illustrative pseudocode: logic/contract consistency, not mandatory compilation, runtime dependencies or production tests.
- Real changed seams and public behavior: retain the applicable reachability and regression gates below; do not impose them on prose or unchanged code read as evidence.

Check in this order:

1. **Safety and correctness:** reachable bugs, data loss, security violations, invalid transitions, broken contracts, unsafe failures and regressions.
2. **Change and Spec fidelity:** observable behavior against explicit intent and stable facts.
3. **Project standards:** user rules, nearest instructions and relevant Specs. Check ordinary comments for local accuracy and useful information that nearby code does not make clear, such as constraints, rationale or usage; restatement without added information is unnecessary. Document owns fuller expression/usability checks when applicable; cite agreed requirements, not taste. For reviewed Skills, compare trigger, inputs, authority, failures, output, completion, verification and conditional loading with the baseline. Trace relevant branches and required local safety guidance; report concrete misroutes or missing contracts. Static pruning or a newer model label proves neither behavioral equivalence nor quality or cost gain.
4. **Production reachability — hard gate for a changed seam:**
   - For adapter, wrapper, validator, normalizer, registration, loader, generated wire-up, bin, worker, subprocess, plugin assembly or other shipped-entry behavior, name the smallest production chain and verify it reaches the seam. Isolated tests bypassing it are insufficient.
   - Record that entry path in Evidence or Coverage before completing a seam-dependent Finding or returning `clean`. Missing evidence or a bypassed seam requires a reported gap, no `clean`, and no isolated-fix sufficiency claim.
5. **Regression evidence — hard gate before `clean`:**
   - Compare each changed Code artifact's public return and failure behavior with the fixed baseline. Changes between throw/rejection, sentinel, `null`, status code or result object are failure-contract changes even when intended. Require focused tests or other explicit verification for the affected judgment. If decisive evidence is unavailable, report the gap and block that judgment under the shared report contract. Emit a Finding for a demonstrated defect or an evidenced violation of an explicit project/task verification requirement, not absence of a new test alone.
   - Simple deterministic correction is excepted when public behavior shape is preserved and no risky branch, state transition, concurrency, persistence, security or failure delivery changes, despite a corrected value. Failure-contract changes are never excepted.
6. **Test and seam value — hard gate before `clean`:**
   - For an added or preserved permanent test, public seam, validator, fallback, capability, compatibility path or generic option, classify consumers as production, non-production or ambiguous. Tests/docs alone establish no production load.
   - A questioned test needs an observable consequence, distinct plausible regression, existing evidence gap and maintenance cost. Derive expectations from the agreed contract or an independent example, not the tested computation. If fixture construction, platform behavior, fault injection or scheduling leaves the target condition uncertain, seek targeted evidence; a precondition assertion or mutation run is not mandatory for every test.
   - Prefer real collaboration when fast, deterministic and practical for the scenario. A substitute may control a necessary boundary while preserving the verified behavior. Judge error details and interaction counts/order by contract relevance; otherwise assess outcomes and effects, including rejection.
   - Report test-only generality, wrapper/forwarding assertions, self-confirming expectations, source-string coupling or duplicate failure coverage only with a concrete real owner or smaller evidence path. Keep helpers clear about important inputs and assertions; useful shared setup and limited repetition are both acceptable. Tests protecting independent consequences retain value; fewer tests are not inherently better.
7. **Simplicity:** for unnecessary abstraction, duplication, indirection, dependency or scope expansion, identify a smaller alternative preserving required behavior. Check who owns each rule, whether ordinary changes stay local and what internals callers must know. Similar code with different responsibilities may stay separate; unrelated flags can increase coupling through forced reuse. Judge extraction or removal by caller and maintainer burden, not file size, layer count or reuse count.

Anchor each Finding to changed lines or the smallest behavior chain. State a realistic trigger and impact. Do not report formatting, naming, generated output, taste, or hypothetical cleanup without authority or demonstrated downside.
