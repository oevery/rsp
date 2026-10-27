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
   - For a questioned test or added boundary, identify its real consumer, distinct observable consequence and evidence gap. Tests/docs alone establish no production load. Prefer stable public behavior and real internal collaboration; substitute external or nondeterministic boundaries as needed. Meaningful algorithms, parsers and critical boundaries can warrant focused unit tests.
   - Derive expectations from the contract or independent examples, not the tested computation or source spelling. Check uncertain fixture conditions with targeted evidence. Pin details, counts or ordering only when contract-relevant. Private structure and constants compared with themselves are not behavioral contracts; a public default can be.
   - Report duplicate confidence, forwarding-only assertions or test-only generality with a concrete smaller evidence path. Keep important scenario inputs and assertions visible. Independent consequences retain value; neither per-function/file/branch allocation nor a unit/integration ratio determines coverage.
7. **Simplicity:** for unnecessary abstraction, duplication, indirection, dependency or scope expansion, identify a smaller alternative preserving required behavior. Check who owns each rule, whether ordinary changes stay local and what internals callers must know. Similar code with different responsibilities may stay separate; unrelated flags can increase coupling through forced reuse. Judge extraction or removal by caller and maintainer burden, not file size, layer count or reuse count.

## Bounded structural discovery

Use only for a requested repository/subtree audit or a concrete structural risk within fixed-change scope. Without a narrower lead, use recurring changes or defects to select a candidate chain; history is navigation evidence, not a finding. Inspect current owners and the live path. Do not turn these lenses into a whole-repository checklist:

- **Ownership:** trace creation, validation, mutation, persistence, recovery and consumption. Report competing authority only when reachable paths can diverge with a concrete consequence; projections and fixtures are not automatically competing owners.
- **Dependencies:** start from a consumer's required knowledge of provider policy, representation, ordering, failures and lifecycle. Show actual change amplification or invalid-state exposure, not merely an import or large file. Trace a proposed layer removal: eliminating pass-through work may help, but scattering policy or failure knowledge into callers does not.
- **Repeated knowledge:** trace one representative change across its independently maintained owners. Generated copies, deliberate boundary translation and similar text alone establish no duplication problem.
- **Verification:** map claimed evidence to the same entry path and public result. A bypassed isolated seam can give false confidence; missing tests alone establish neither a structural finding nor a functional defect.

## Finding gate

Anchor a finding to changed lines or the smallest inspected behavior chain. For a defect, show its reachable trigger and consequence. For a simplification, show the current responsibility, concrete burden and smaller complete alternative, including what remains unchanged. In both cases support the chain with evidence, expose uncertainty and preserve failure, authority and Required gates. Return the smallest correction or unresolved owner/design question, not a replacement design or implementation.

Discard speculative impact and taste-only cleanup. Rank by consequence and confidence, not lines removed or ease of correction. A supported reduction need not change a user-visible result; fewer lines alone are not evidence of lower burden.
