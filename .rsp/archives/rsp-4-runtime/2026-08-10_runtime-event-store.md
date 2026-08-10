---
kind: "feature"
---

# Change: rsp-4-runtime/runtime-event-store

## Proposal
- Outcome: Persist bounded concurrent runtime events, recovery checkpoints, and context packets without becoming project truth
- Why:
  - Parallel managed workers can return duplicate, delayed, or out-of-order results that are unsafe to coordinate through shared mutable JSON snapshots.
  - Runtime observability and recovery need atomic append, idempotency, bounded retention, and reusable context without repeatedly loading unchanged full artifacts or persisting a second RSP workflow state machine.
- Scope:
  - Add one checkout-scoped SQLite runtime store for runs, dispatches, events, receipts, rebuildable projection checkpoints, bounded context packets, and retention metadata.
  - Define worker append-only receipts, Manager observations, idempotency keys, sequence allocation, checkpoint compare-and-swap, migrations, and crash recovery.
  - Expose bounded storage and hydration interfaces for Broker and Manage adapters without deriving workflow meaning inside the database layer.
- Non-goals:
  - Store raw prompts, hidden reasoning, complete conversations, credentials, arbitrary command logs, or unbounded model output.
  - Make runtime records authoritative for Change state, blockers, readiness, acceptance, lifecycle, Git, or publication.
  - Treat a context packet, checkpoint, copied excerpt, or stored hash as sufficient evidence after its current source identity no longer matches.
  - Hold transactions across model calls, tools, tests, shell commands, network requests, or human decisions.
  - Replace Markdown archives or create a permanent analytics warehouse.

## Spec
### ADDED
- Requirement: Project runtime records are transactionally safe, idempotent, bounded, and disposable.
  - The database is authoritative only for the runtime observations and delivery metadata actually committed inside its checkout namespace and retention window.
  - Workers append events and one receipt for their exact dispatch; authenticated Manager observations record semantic decisions already made by Manage rather than deriving them in storage.
  - Stable idempotency keys make retries and duplicate delivery observable without duplicating accepted effects.
  - Per-run sequence values and parent identities preserve a deterministic event order independent from worker clocks.
  - Rebuildable projection checkpoints use source sequence, projector version, and compare-and-swap guards; conflicts force a replay instead of overwriting another projection.
  - A bounded context packet contains only current owner and authority references, phase, latest decisive observations, blockers, attention, evidence pointers, changed paths, freshness identities, and next action needed for continuation.
  - Context hydration validates checkout identity, WorkRef, Git HEAD, dirty-path identity, source path, content hash or revision, and packet schema before reuse; mismatches invalidate affected entries and trigger targeted reread or full rebuild.
  - Schema migrations are atomic, versioned, recoverable, and never share writable state across incompatible runtime schema majors.
  - Retention compacts or deletes expired process detail while preserving only bounded records that remain explicitly non-authoritative.

### Acceptance
#### Scenario: duplicate worker receipt
- GIVEN one dispatch and two deliveries carrying the same idempotency identity
- WHEN both deliveries reach the store concurrently
- THEN one receipt is retained, the duplicate is observable, and the run snapshot advances at most once

#### Scenario: conflicting state transition
- GIVEN two projectors that read the same observation sequence and checkpoint version
- WHEN both attempt different guarded checkpoint writes
- THEN at most one checkpoint succeeds and the other must replay from committed observations

#### Scenario: crash recovery
- GIVEN committed events and a process exit before an in-memory projection is returned
- WHEN the compatible Broker resumes the project session
- THEN it rebuilds the bounded snapshot from committed data without inventing worker completion or acceptance

#### Scenario: runtime deletion
- GIVEN all runtime databases and checkpoints for a checkout are removed
- WHEN ordinary RSP commands inspect the repository
- THEN current Markdown work, history, readiness, and lifecycle behavior remain available and unchanged

#### Scenario: fresh context reuse
- GIVEN a bounded context packet whose checkout, WorkRef, Git, dirty-path, and source identities still match
- WHEN a managed goal resumes
- THEN the caller may hydrate that compact context and reread only the current authority pointers and changed evidence before semantic derivation

#### Scenario: stale context packet
- GIVEN a context packet whose source hash, Git identity, dirty paths, authority, or schema no longer matches
- WHEN hydration runs
- THEN stale entries cannot seed semantic decisions and the caller performs targeted reread or complete projection rebuild

## Design
- Approach:
  - Use the built-in `node:sqlite` module behind a lazy packaged `dist/runtime-store.mjs` adapter, with no native addon and a declared Node.js `>=22.13.0` package floor.
  - Use one `runtime-v1.sqlite` database per checkout namespace under the user cache, with storage schema `1.2`, Broker runtime compatibility `1.1`, WAL, foreign keys, bounded busy handling, short explicit transactions, and an adapter-owned migration registry.
  - Separate append-only observation and receipt tables from disposable projection checkpoints and bounded context packets.
  - Assign exact run, dispatch, event, actor, parent, project, protocol, schema, and idempotency identities.
  - Return freshness-bearing source references and bounded structured evidence rather than duplicating authoritative documents or large logs.
- Boundaries:
  - The store guarantees persistence, ordering, idempotency, and concurrency mechanics; Manage owns frontier, dispatch, attention, acceptance, and closeout semantics.
  - The Broker owns project-session access and compatibility; Web and agents consume service projections instead of opening SQLite directly.
  - Context packets optimize source selection and hydration only; current files and Git evidence are revalidated before material decisions.
- Affected areas:
  - New runtime storage, migration, model, query, retention, redaction, checkpoint, context-packet, and hydration modules.
  - Broker project-session adapters and bounded JSON/runtime diagnostics.
  - SQLite driver/package topology, concurrency, idempotency, migration, corruption, recovery, retention, and fallback tests.
- Constraints:
  - Runtime payloads are size-bounded, credential-filtered, schema-validated, and project-scoped before storage.
  - One malformed or incompatible project database must not prevent the Broker from serving unrelated repositories.
  - Store implementation and driver selection must support the package's declared Node range and clean-install contract; `--no-experimental-sqlite` fails runtime opening closed while ordinary CLI remains SQLite-independent.

## Tasks
- [x] Select and record the built-in `node:sqlite` topology and authority boundary in `.rsp/specs/decisions/built-in-node-sqlite-for-disposable-runtime-observations.md`, then define observation, checkpoint, context-packet, freshness, migration, redaction, bound, retention, and public projection contracts.
- [x] Implement atomic observation and receipt append, guarded projection checkpoints, bounded context packets, idempotency, and sequence allocation.
- [x] Implement freshness-aware hydration, targeted invalidation including newly added sources, compatible recovery, corruption diagnostics, project-local disposal, and no-database fallback behavior.
- [x] Add focused real-SQLite parallel-process, duplicate-delivery, out-of-order, migration, retention, crash-recovery, Broker-adapter, disabled-SQLite, and package-smoke coverage.

- [x] Resolve reopened concern: Run and pass the exact Node.js 22.13.0 package/runtime gate

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/runtime-event-store.test.ts` — 16/16 passed on Node.js 24.19.0 with real built-in SQLite and `test/runtime-event-store-worker.mjs`; proves duplicate event/receipt effect-once, gap-free sequence allocation, checkpoint CAS, explicit same-run out-of-order parents, and fail-closed cross-run delayed-parent identity.
  - [x] The same focused suite passed v1→v2 migration, newer-major and same-major newer-version rejection, incomplete-history and corrupt diagnostics, committed-crash recovery, identity isolation, serialized Broker open/dispose/reopen, disposal, and no-database projection; `mise exec -- pnpm exec vitest run test/broker-protocol.test.ts` also passed 19/19.
  - [x] The same focused suite passed context list/byte bounds, exact authority-source correspondence, current-run committed-observation sequence validation, fresh reuse, changed and newly added evidence targeted invalidation, authority/checkout full rebuild, and source hydration; proves compact reuse never bypasses current authority or retained observation sequence.
  - [x] The same focused suite passed prohibited-field rejection, sensitive-key and common credential-value redaction, structured and high-entropy OpenAI key detection, conservative non-secret examples, payload byte bounds, and nesting-depth bounds. A production save/read/hydrate regression preserves the all-uppercase-plus-digit `sk-RUNTIMEOBSERVATION20260808ABCDEFGHIJ` context path and summary with fresh reuse because legacy `sk-` credential detection requires upper, lower, and digit classes, while still redacting a structured `sk-proj-...` credential; proves runtime persistence does not retain recognized credentials or corrupt legitimate source identity.
  - [x] `mise exec -- pnpm run release:package-check` and `mise exec -- pnpm exec vitest run test/clean-install-check.test.ts --maxWorkers=1` — passed, including installed `dist/runtime-store.mjs`, real event projection/disposal, disabled-SQLite diagnosis, ordinary CLI fallback, and Broker cleanup; proves clean installation without an undeclared SQLite addon or host tool.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, and `mise exec -- pnpm run lint` — passed serially; proves storage, Broker adapter, tests, and package contracts remain valid.
  - [x] `mise exec -- pnpm run docs:check` — passed 7 bilingual page pairs and 30 Markdown files; proves public runtime guidance remains paired and linked.
### Optional
- Manual or environment:
  - [ ] Interrupt and resume one local multi-worker run while comparing compact hydration with a full authority reread.
  - [x] Node.js 22.13.0 minimum-version gate on 2026-08-10: build, typecheck, lint, 7 bilingual documentation pairs / 30 Markdown files, docs build, the full serial Vitest suite (`68/68` files, `801/801` tests), and the exact clean-install package/runtime smoke passed. The development package retained the current published manifest identity `@oevery/rsp@3.2.0` instead of prematurely selecting a new release version; its SHA-256 was `72ad7b482d5ad0bf1f85dc6c7a3a45250badcc21abc6874531ae096c571787c1`. Real built-in SQLite and `--no-experimental-sqlite` fail-closed coverage ran under the declared floor.
- Coverage:
  - Group integration later proves Broker reuse, Manage production events, base and managed Web streaming, and exact-package installation.

- [x] Verify reopened concern: Run and pass the exact Node.js 22.13.0 package/runtime gate

## Blockers
- requires `rsp-4-runtime/broker-protocol`: bind database ownership, compatibility, and access to the settled checkout/worktree session identity and protocol.
