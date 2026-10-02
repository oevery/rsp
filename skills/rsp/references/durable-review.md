# Durable writeback decision

Load this reference only after required Tasks and implementation verification pass, or when auditing archive readiness.

## Establish the evidence boundary

The durable writeback decision is required before archive. Decide current-fact and Decision Record updates independently. Keep these evidence owners separate:

- Implementation verification supplies fresh evidence after mutation.
- Review owns fixed-scope, report-only comparison. Use it when explicitly requested, required by nearer authority or risk, or needed for managed `review-clean`; tiny direct actions do not automatically need it.
- Durable writeback decides what belongs in current facts or lasting rationale. It never substitutes for implementation checks or a required Review.

Run `rsp check --focused` and `rsp show --focused --json`, or `rsp ready <name> --json` for an explicit Change. Treat `durableReview.factCandidateTargets` and `decisionRecordsPath` as routing advice, not permission. Spec delta markers are planning aids and are never promoted automatically.

Use equivalent permitted read/search methods to inspect the same authoritative artifacts when a diagnostic tool fails. Do not replace a named required check, infer a successful ready result from manual reading, or mutate protected RSP files to obtain a gate. Diagnose the actual cause and effects; if decisive migration, structural or verification evidence remains unavailable, keep the dependent closeout incomplete.

When the inspection reports only `RSP project requires an update`, required Tasks and implementation verification have already passed, and update mutation is not authorized:

- Do not run `rsp update`.
- Preserve the completed implementation outcome and its passed verification evidence.
- Report durable writeback and readiness as incomplete because migration evidence is unavailable; keep archive and commit blocked.

This exception never converts a failed declared implementation or independent verification check into success. Other inspection failures remain unresolved.

## Converge the Change before writeback

Revalidate relevant Focus notes and converge the Change to its current design, completed outcomes, verification conclusions, necessary failure dispositions, remaining limits and evidence pointers. Group integration conclusions belong in the Brief. Keep working chronology out; original records and verdicts remain with their evidence owner. An unresolved Required failure still blocks closeout.

From these conclusions, select only justified stable facts or rationale for the owners below; no useful knowledge update is a valid result. After writeback, refresh the final Change, applicable checks, separately required fixed-scope Review and readiness. Author checks never establish independent review.

## Decide current facts and lasting rationale

Use no update when there is no stable fact or lasting rationale worth rereading.

Return the durable decision in this semantic field order. Localize headings and labels while preserving the canonical values:

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

Response-only Continuation and Durable Decision labels are not canonical artifact headings. In Chinese, for example, use `## 持久化决策`, `决策记录（Decision Record）`, and `可归档（Archive ready）`, not English labels alone.

## Write current facts to their owner

Write only a changed stable behavior, boundary, default or constraint that future maintainers need. Select the smallest existing owner:

- Domain contracts belong in the relevant Spec; project-wide architectural contracts belong in `.rsp/specs/design.md`.
- Vocabulary, domain relationships and navigation belong in an explicitly authorized scoped `CONTEXT.md`.
- Operating instructions belong in `AGENTS.md`.

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

Before archive, require converged final Change evidence, completed or unnecessary knowledge writeback, fresh applicable verification/readiness and every separately required Review clean. Then authorized archive preserves Change and clears its Focus marker; never clear the Capsule as a substitute for writeback. Archive is separate from local commit authority.

Ordinary work needs later explicit Git authority for one independently reviewable logical commit. Declined, unavailable or unselected coordination leaves Core advisory: configuration executes neither archive nor commit.

## Apply qualified lifecycle closeout

Only when Core selects qualified lifecycle closeout, read [closeout](closeout.md) for the effective ceiling, fresh eligibility gates, child archive and Group-close sequence, and complete lifecycle-diff inspection. Decide durable writeback for each child independently before its terminal closeout. This decision alone grants no lifecycle or Git action.

## Hand off exact Git delivery

For eligible coordinated delivery or an explicitly authorized checkpoint, use [closeout's delivery handoff](closeout.md#route-exact-delivery-separately); it owns the exact request and delivery conditions. Commit retains Git audit, staging, final-diff messaging, execution and effect observations. Missing Commit stops delivery without a Core fallback; a refusal or uncertain Git effects grants no replacement delivery authority.
