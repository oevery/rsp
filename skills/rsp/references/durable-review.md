# Durable writeback decision

Load for a necessary stable-knowledge update or preparation/audit of lifecycle or terminal delivery. Passing Tasks/checks or resuming work alone does not activate it. An evidence-only Tasks/Verify refresh with accurate scope, contract, design and stable knowledge stays in Core's direct path; it neither establishes closeout eligibility nor skips separately required Review.

## Establish the evidence boundary

For routine writeback, establish the relevant facts, update justified knowledge using the methods below, reconcile only affected Change sections when tracked, and check those edits. Preserve ongoing plans and unfinished work; this does not trigger final whole-Change convergence, readiness or closure. Before archive, current-fact and Decision Record decisions are both required. Keep these evidence owners separate:

- Implementation verification supplies applicable evidence for the final content, reusing unchanged coverage and rerunning affected checks after mutation.
- Review owns fixed-scope, report-only comparison. Use it when explicitly requested, required by nearer authority or risk, or needed by the selected acceptance; tiny direct actions do not automatically need it.
- Durable writeback decides what belongs in current facts or lasting rationale. It never substitutes for implementation checks or a required Review.

Inspect existing evidence and the selected Change when tracked. Use `rsp ready <name> --json` when current readiness or durable target advice is needed; obtain fresh readiness immediately before an authorized archive. Do not query readiness twice merely for separate writing and delivery roles. Treat `durableReview.factCandidateTargets` and `decisionRecordsPath` as routing advice, not permission. Spec delta markers are planning aids and are never promoted automatically.

Use equivalent permitted read/search methods to inspect the same authoritative artifacts when a diagnostic tool fails. Do not replace a named required check, infer a successful ready result from manual reading, or mutate protected RSP files to obtain a gate. Diagnose the actual cause and effects; if decisive migration, structural or verification evidence remains unavailable, keep the dependent closeout incomplete.

If inspection reports only `RSP project requires an update` and update mutation is not authorized, do not run `rsp update`. Preserve supported implementation and verification outcomes; identify which knowledge, readiness or delivery judgments depend on the unavailable migration evidence. Archive remains blocked without current readiness. This does not independently block a separately authorized checkpoint: Commit assesses its exact boundary and required evidence, and stops if that evidence is affected or unavailable. Other inspection failures and required checks remain unresolved, never converted into success.

## Close out in order

Apply this sequence only for established final delivery or preparation/audit of closure. Routine knowledge updates use the bounded writeback above.

1. **Verify outcome facts.** Establish the approved delivered result from current implementation, authoritative contracts and decisive evidence. Distinguish passed, failed, unverified and superseded conclusions. This establishes truth, not a preliminary full-document rewrite; plans and recovery notes alone cannot establish current facts.
2. **Distill Focus as needed.** Integrate only verified outcomes, evidence applicability or material limits missing from Change; no useful addition means no edit. Recovery state alone supplies no required acceptance evidence.
3. **Write back knowledge as needed.** Using the verified result and Change delta, decide current facts and lasting rationale independently using the methods below. Update existing owners only when justified. No stable change means no edit; a delivered contract that leaves its authoritative Spec stale requires correction before closeout. Do not copy the whole Change or its verification history into knowledge documents.
4. **Converge the whole Change.** Use `rsp-doc` and its artifact-lenses method when available; this is whole-record writing, not a tiny edit. After necessary writeback, read all six sections as one final document. Retain the delivered contract delta, relevant design, task outcomes, candidate-bound verification, material failures/limits and knowledge-update references. Reconcile superseded plans and misplaced or duplicated content; process history stays in its retained report or conversation, not this outcome snapshot. Keep product boundaries distinct from transient operation permissions. Group integration conclusions belong in the Brief. When Doc is unavailable, perform this same bounded convergence locally without installing it or replacing required Review.
5. **Check final consistency, then archive when authorized.** Check the final Change and knowledge owners against the verified result. Earlier review of another revision or a passing readiness command does not establish this text's quality. Reuse still-applicable implementation/test evidence; check new knowledge/document changes and fill only missing or invalidated coverage. Document-only writeback or archive preparation does not itself invalidate code checks. Complete separately required Review before the archive gate below. Fix prose defects in scope; return material contract or implementation contradictions to the appropriate decision, implementation or verification owner rather than editing away the failure. An unresolved Required failure still blocks closeout.

These are dependency constraints, not persisted phases or mandatory separate tool calls. Needs-based writeback may produce no edit when unnecessary; it never waives a required update. At this final-delivery/closure boundary, whole-Change convergence applies and may confirm already-converged text without rewriting it. Use the verified outcome to resolve stale statements; do not reopen settled planning, restyle unrelated sections or add a no-op report merely to demonstrate this check. Original records and verdicts remain with their evidence owner. Author checks never establish independent review.

For acceptance-critical commands, prefer separate observed invocations. A batch must stop on failure and expose each command's result and exit status; trailing success cannot establish preceding checks. If a result is missing, re-observe only that read-only or proven repeat-safe check using its declared method; inspect actual effects before repeating any mutation. Keep dependent lifecycle actions incomplete until required passing evidence is established. Prefer existing document/link checks or known-path inspection to improvised general Markdown regex parsing. Ordinary reads may still be batched.

## Decide current facts and lasting rationale

Use no update when there is no stable fact or lasting rationale worth rereading.

Report actual knowledge updates, unresolved decisions and requested readiness conclusions concisely. Current-fact and Decision Record decisions remain independently required before archive, but routine no-op fields need not appear in the response. Include exact targets and decisive rationale when needed; a readiness report retains `yes | no`, gate evidence and blockers. Use the complete rendering below only for an explicit request or real technical consumer. Localize headings and labels while preserving the canonical values:

```md
## <localized Durable Decision heading>
- <localized Current facts label>: <No current-fact update needed | Update existing spec or scoped instruction | Create a new durable spec>
- <localized Current-fact target label>: <exact file path or N/A>
- <localized Facts to write label>: <durable facts or none>
- <localized Decision Record label>: <No Decision Record needed | Create or update a Decision Record>
- <localized Decision Record target label>: <exact file path or N/A>
- <localized Rationale to write label>: <lasting rationale or none>
- <localized Archive ready label>: <yes | no>
```

This is a response-only decision summary, not a block to paste into Change or archive. Persist actual knowledge updates and material decisions in the appropriate existing sections; omit empty targets, transient readiness and authorization receipts unless a declared consumer requires them. In Chinese, for example, use `## 持久化决策`, `决策记录（Decision Record）`, and `可归档（Archive ready）`, not English labels alone. Compact presentation changes no decision or closeout gate.

## Write current facts to their owner

Write only a changed stable fact that future maintainers need. Select the smallest existing owner; summarize and link rather than maintain the same rule twice:

- `README` owns introduction, usage and starting points, not duplicate specifications.
- `AGENTS.md` owns scoped operating rules, authority and checks, not product behavior.
- Authorized root or local `CONTEXT.md` owns canonical vocabulary, domain relationships and navigation, not implementation notes or session history. Define a term once in its domain and link it elsewhere.
- Specs own current capabilities, collaboration contracts, boundaries and necessary constraints, not code inventories or future plans. Domain contracts use their relevant Spec; project-wide architecture uses `.rsp/specs/design.md`. Keep design references when they define normative evidence.
- Change owns this outcome's delta, design, work and evidence, not a full baseline copy. Decision Records own significant choices, alternatives and consequences, not another current-contract definition. Archives retain historical evidence, not current authority.

Create a Spec only for reusable truth with no suitable existing owner.

For substantial authorized writeback, use `rsp-doc` when available. A partial or older installation may instead apply these local checks; neither method replaces required Review:

- State consumers/value, handoffs, observable behavior, invariants and limits that survive replaceable internals.
- New domain Specs may use Purpose, Boundaries, Contracts, Scenarios and Constraints as a scaffold. Domain headings and normative design references remain valid; neither table shape nor template conformity selects ownership.
- Include only useful discriminating scenarios; Given/When/Then is optional. Plain-prose hints may stay, but requirements and limits remain visible.
- Link rationale to its Decision Record and verification to the Change. Resolve Spec/code discrepancies before choosing the correction owner; code alone supplies no new promise.
- Check that the future reader can find and use grounded facts, understand conditions and unknowns, and follow valid references. Preserve meaning; do not rewrite existing Specs merely for matching headings.

## Write lasting rationale when needed

Create or update a Decision Record only for a hard-to-reverse or surprising choice with a real tradeoff. It owns rationale, alternatives, tradeoffs and consequences, not duplicated current facts. Choose one exact file under `durableReview.decisionRecordsPath`, not the directory itself.

Never use generated indexes, archives, `.rsp/rsp-rules.md`, or the managed RSP block as ordinary writeback targets. Keep narrative history, debugging notes, task chronology, and transient evidence out of Specs and Decisions.

## Prepare the Change for archive

Before archive, require converged final Change evidence, completed or unnecessary knowledge writeback, applicable passing verification and current readiness and every separately required Review clean. Then authorized archive preserves Change and clears its Focus marker; never clear the Capsule as a substitute for writeback. Archive is separate from local commit authority.

Git delivery needs explicit authority for one independently reviewable logical commit. Closure is independent of delegation or coordination: use the selected closeout policy and current gates, even when all work is local. No closure setting authorizes Git.

## Deliver with explicit boundaries

[Delivery closeout](closeout.md) owns checkpoint/final classification, the ask/auto/manual closure decision, Group-close sequence and exact Git handoff. Ordinary completion leaves work open. Reuse applicable evidence, and never infer Git authority from closure.
