---
kind: "feature"
---

# Change: rsp-4-runtime/manage-runtime-integration

## Proposal
- Outcome: Project qualified Manage execution into the local runtime without widening authority
- Why:
  - The Web and recovery surfaces need structured evidence of real managed dispatches and receipts rather than inferred chat transcripts.
  - Current Manage control data is intentionally transient, so optional persistence must remain observability-only and must not become a hidden scheduler or acceptance owner.
- Scope:
  - Define a host-neutral runtime adapter and capability discovery contract for managed run, dispatch, event, receipt, attention, pause, and resume observations.
  - Add optional runtime correlation to Manager and worker envelopes while preserving current lane, worker identity, evidence, and stop contracts.
  - Derive bounded attention, run projections, and freshness-aware context packets from accepted observations while preserving existing continuation and fresh-reread behavior.
- Non-goals:
  - Parse natural-language responses to infer dispatch, completion, authority, acceptance, or errors.
  - Require the Broker for ordinary Manage operation or replace unavailable required workers with controller execution.
  - Let the runtime start workers, choose lanes, mutate Changes, archive, commit, push, publish, deploy, approve, or accept human-facing results.
  - Store complete prompts, hidden reasoning, or unbounded worker output.

## Spec
### ADDED
- Requirement: Manage emits optional structured observability without changing its existing control result.
  - Runtime capability is discovered explicitly; absence or failure is visible but does not change routing, authority, dispatch limits, acceptance, or closeout.
  - Every observation carries exact WorkRef, run, dispatch, lane, actor, result, evidence reference, stop boundary, and idempotency identity where applicable.
  - The runtime records what the host actually created and returned; missing workers or receipts remain incomplete and are never synthesized.
  - Attention and run summaries are bounded read-only projections with source references and freshness; they never become routing, acceptance, or closeout inputs.
  - A runtime context packet may seed bounded resume context and select which authority and evidence sources require hydration, but it cannot substitute for current authority, status, diff, blockers, or decisive evidence.
  - Resume validates packet schema, checkout identity, WorkRef, Git state, dirty paths, source revisions or hashes, and authority references before reuse; cached observations cannot override drift.

### Acceptance
#### Scenario: runtime available
- GIVEN a qualified managed goal and a compatible runtime capability
- WHEN Manager dispatches workers and receives valid receipts
- THEN the runtime records exact observations and the existing Manage acceptance result remains derived by the owning Skill

#### Scenario: runtime unavailable
- GIVEN the same qualified managed goal without Broker or runtime capability
- WHEN Manage executes
- THEN current host-neutral behavior, authority stops, worker obligations, acceptance, and continuation remain unchanged

#### Scenario: missing worker
- GIVEN a required implementation worker was not created
- WHEN runtime observations are projected
- THEN the run remains incomplete and no synthetic dispatch, receipt, success, or acceptance is stored

#### Scenario: stale resume
- GIVEN retained runtime observations and changed repository authority or diff
- WHEN the goal resumes
- THEN fresh Core and Manage derivation takes precedence and the stale observation is surfaced only as non-authoritative history or attention

#### Scenario: bounded resume context
- GIVEN a retained context packet whose checkout, WorkRef, Git, dirty-path, source, and authority identities remain current
- WHEN the managed goal resumes
- THEN Manage hydrates the compact packet, rereads current authority pointers and changed evidence, and derives the same control result without loading unchanged full artifacts

## Design
- Approach:
  - Define one structured adapter seam consumed by published Skills when the host exposes a compatible local runtime capability.
  - Keep the existing WorkerEnvelope and receipt semantics canonical; add only correlation and optional observation calls at real boundaries.
  - Project the canonical continuation fields into a bounded runtime context packet with exact source identities rather than introducing a second semantic continuation owner.
  - Hydrate fresh packets selectively and rebuild stale packets from current repository evidence.
  - Make observation failure explicit in diagnostics while keeping semantic control fail-safe ownership in Core and Manage.
  - Ship `dist/manage-runtime.mjs` with capability identity `rsp.manage-runtime@1.0`; discover only an already running compatible Broker, or bind the same contract directly to an accepted runtime store.
  - Keep run and attention projections non-authoritative and capped at 32 items; keep `manage-resume` context packets within 12 KiB and 24 hours.
  - Let only the runtime service clock assign context update, expiry, and hydration time. Public save and hydrate requests expose no caller-controlled clock or packet timestamp, and a future caller timestamp is rejected rather than reviving retained context.
  - Advance one transactional committed run sequence for every newly accepted observation boundary, including dispatch. Context save compares packet `sourceSequence` with the unified current run revision inside the same short ownership transaction as packet version/write and returns stale attempts as not applied; hydration compares again before reuse. Run projection reads revision, events, dispatches, and receipts from one SQLite read snapshot, and duplicate delivery retains its original sequence.
  - Expose only narrow `terminalDeliveryObserved` history. It requires one explicit host-confirmed terminal boundary whose sequence equals the current committed revision, at least one observed dispatch, no truncation, and a retained non-unavailable, non-`boundary-changed` receipt for every observed dispatch; any later observation clears it until another terminal boundary, and it never means managed completion or acceptance.
  - Refresh only the current managed-controller beta product-composition lock for this optional observation-only Skill change. The retained reports and summaries remain immutable historical 19-case evidence; current 21-case deterministic contracts, static available/absent prompt holdouts, and a deterministic fake-host callback harness prove the added contract and ordering behavior. They are not real-host execution evidence. A future claim about real-host interruption or scheduling benefit requires a new immutable evaluation identity and run.
- Boundaries:
  - Core owns initial route and authority; Manage owns selected-goal execution, worker acceptance, review convergence, and closeout.
  - The adapter owns transport and observation only; the event store owns persistence mechanics; the Broker owns project access.
  - Web and later sessions consume projections but cannot write semantic outcomes back through the runtime.
- Affected areas:
  - `rsp`, `rsp-manage`, managed routing and interruption/recovery contracts.
  - Runtime adapter commands or host capability interface, read-only run and attention projection types, context packet and hydration contracts, diagnostics, and tests.
  - Maintainer deterministic fake-host callback ordering, duplicate receipts, unavailable runtime, pause/resume, drift, and static prompt-contract holdouts.
- Constraints:
  - Keep the published Skills host-neutral and fully usable without Web, SQLite, or a long-lived process.
  - Never persist token counts or context-size targets as routing or acceptance inputs.
  - Bound packets by deterministic records, byte size, excerpts, source references, and evidence items; measure token reduction only as evaluation evidence.
  - Do not create `.rsp` run files, controller ledgers, ticket maps, or parallel lifecycle state.

## Tasks
- [x] Define runtime capability discovery, correlation identities, observation commands, bounded run/attention projections, and context-packet freshness contracts.
- [x] Integrate optional run, dispatch, receipt, and attention observations at exact existing Manage boundaries.
- [x] Integrate selective context hydration on resume while preserving no-runtime behavior and making stale or failed observations non-authoritative and bounded.
- [x] Extend managed contracts and static holdout projections for exact supplied identities, missing and duplicate delivery, interruption, resume, and drift.
- [x] Remove caller-controlled context clocks and packet timestamps from the public capability and Broker service, with service-construction clock injection only.
- [x] Unify dispatch, event, and receipt committed revisions, atomically reject stale context saves, invalidate retained context after every later semantic observation, and return each run projection from one attributable read snapshot without advancing duplicate effects.
- [x] Require exact dispatch identity for worker events, preserve exact dispatch sequence in boundary-change attention, and narrow terminal delivery to a current explicit host terminal boundary plus safe retained observed deliveries.
- [x] Add deterministic fake-host creation/observation ordering and relabel static managed fixtures and holdouts so they do not claim real-host evidence.

## Verify
### Required
- Automated:
  - [x] Managed controller contract and holdout evaluations with runtime enabled and absent — 21 deterministic contracts, available/absent prompt projections, and current beta evidence contract passed. The deterministic fake-host harness confirms dispatch observation occurs only after worker creation returns exact identities, available and absent runtime paths retain the same control result, and zero dispatch does not imply terminal delivery; these checks prove contract and ordering behavior, not real-host execution.
  - [x] Duplicate, missing, unavailable, boundary-changed, exact worker identity, pause/resume, stale-resume, atomic context ownership, single-snapshot projection, and terminal-order fixtures — `test/manage-runtime-integration.test.ts` passed 6/6 and the focused five-file runtime/Broker/managed set passed 107/107. Deterministic two-store interleavings prove stale context save is not applied and projected rows remain attributable to one committed revision; later dispatch, receipt, and nonterminal observations clear terminal delivery until a new current terminal event.
  - [x] Context-packet bound, selective-hydration, freshness, and full-reread equivalence tests — fresh and targeted hydration reread authority, reuse only unchanged evidence, and derive the same control fingerprint as a full reread; authority drift and absent packets force full reread.
  - [x] Attention and run projection bound and source-reference tests — 32-item capability bounds, truncation, missing receipt, boundary change, runtime-unavailable attention, committed sequence freshness, and exact source references passed.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, and `mise exec -- pnpm run lint` — passed; proves published Skill and runtime seams remain package-valid.
  - [x] `mise exec -- pnpm run docs:check` — passed 7 bilingual page pairs and 30 Markdown files.
  - [x] `mise exec -- pnpm run release:package-check` — clean install passed; the tarball SHA-256 was `af0ee7e15d65430b8b23b31c8cbf8f42803686cfde45530ac8b36f6d3a570590`, contains `dist/manage-runtime.mjs`, and its installed `rsp.manage-runtime@1.0` run projection smoke passed without Broker or temp-process residue.
  - [x] Full suite — the direct serial command `mise exec -- pnpm exec vitest run --maxWorkers=1` completed 66/67 files and 770/773 tests. The exact three remaining `test/helpers.test.ts` compatibility assertions are: `keeps the published RSP skill conformant and independently versioned` expects the old `2026.08.06.1` CalVer; `keeps high-value guardrails in rules and skill` embeds the same old CalVer; and `documents the localized durable decision contract and consolidated Skill guidance` expects the removed generated Specs-index rewrite statement. These are Group successor coverage owned by `compatibility-migration` and do not exercise this Change's runtime integration boundaries.
### Optional
- Manual or environment:
  - [ ] Observe one real multi-worker managed run and resume it after an intentional interruption.
- Coverage:
  - Group browser acceptance later proves that the same observations drive the read-only timeline and attention UI.
  - Group successor `compatibility-migration` refreshes the three stale helper assertions observed by the full-suite run.

## Blockers
- none
