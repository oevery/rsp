---
kind: group
---

# Change Group: rsp-4-runtime

## Goal
- Introduce the RSP 4.0 local runtime, bounded context reuse, dynamic repository projections, and read-only observability without replacing Markdown authority

## Scope
- Introduce one user-level local Broker that lazily hosts isolated project sessions and is reused by compatible `npx` invocations.
- Add a disposable SQLite runtime for bounded Manage events, worker dispatches, receipts, recovery checkpoints, context packets, and read-only projections.
- Preserve repository Markdown, current checkout evidence, and RSP artifacts as the authoritative engineering truth.
- Replace committed generated Specs navigation with direct dynamic CLI/API queries over the current filesystem.
- Add a local-only, read-only Web Observatory for current work, Specs, and retained history, then extend it with managed runs, attention, and live events.
- Deliver safe 3.x migration behavior, then reconcile the exact 4.0 package, documentation, and release-candidate boundary.

## Shared Constraints
- The Broker and every project session grant no planning, product mutation, lifecycle, Git, publication, deployment, approval, or human-acceptance authority.
- Committed runtime observations and sequence are the unified retained record of what the runtime actually observed; checkpoints, context packets, and Web state remain disposable projections, and none becomes a second owner of Change, Spec, Decision, blocker, readiness, or acceptance facts.
- No process-local snapshot, worker response, browser state, or context packet may supersede the committed runtime observation sequence inside its retained checkout namespace.
- Runtime context may seed bounded continuation and avoid reloading unchanged evidence, but every material decision revalidates its source pointers, checkout identity, Git state, freshness, and current Markdown authority.
- One compatible Broker process may serve multiple checkouts, but project identity, paths, events, tokens, retention, and queries remain exactly namespaced and fail closed; distinct worktrees never collapse to one project session.
- Ordinary CLI inspection and mutation commands remain one-shot and do not require or automatically start the Broker.
- Broker startup, reuse, shutdown, version negotiation, PID/process identity, loopback endpoint ownership, locks, and stale-record recovery are deterministic and safe under concurrent `npx` invocations.
- Browser access is loopback-only by default, read-only, origin-checked, token-scoped, path-bounded, and stripped of credentials and unsafe raw process data.
- SQLite transactions are short, idempotent, migration-safe, and never held across model calls, tools, shell commands, tests, or external operations.
- Dynamic repository queries return source paths and bounded excerpts from current files; consumers re-read authoritative files before material decisions or mutation.
- Token reduction is an operational benefit measured through bounded context and selective source hydration; token counts or context-size targets never become routing, readiness, acceptance, or closeout inputs.
- Preserve unrelated work and keep every child independently reviewable, verifiable, archivable, and reversible before the terminal migration boundary.

## Slices
- `rsp-4-runtime/broker-protocol`: define and implement the user-level singleton Broker, project identity, compatible client protocol, lifecycle, discovery, and security boundary.
- `rsp-4-runtime/runtime-event-store`: define and implement the SQLite observation/receipt model, concurrency, idempotency, retention, recovery checkpoints, context packets, and bounded projections.
- `rsp-4-runtime/manage-runtime-integration`: connect qualified Manage execution to runtime observations and freshness-aware context hydration without persisting authority decisions as project truth.
- `rsp-4-runtime/specs-query`: add dynamic Specs discovery and bounded literal search over current files, then remove runtime dependence on generated `00-index.md`.
- `rsp-4-runtime/web-observatory`: add the local read-only Web shell and snapshot projections over current project state, Specs, and history.
- `rsp-4-runtime/managed-run-observatory`: add managed run topology, receipts, attention, evidence, and timeline views over accepted runtime observations.
- `rsp-4-runtime/compatibility-migration`: retain the existing removed-option diagnostic, remove recognized generated Specs indexes, migrate supported projects, and reconcile runtime/cache diagnostics.
- `rsp-4-runtime/web-localization`: add English and Simplified Chinese Web-owned labels with browser-local locale selection while preserving projected repository content and canonical identities.
- `rsp-4-runtime/web-react-foundation`: migrate the authored browser bundle to one typed React root with behavior parity, deterministic assets, and unchanged local authentication and projection boundaries.
- `rsp-4-runtime/parallel-run-visualization`: add a bounded SVG swimlane projection for manager and dispatch branches while retaining committed sequence as the audit order.
- `rsp-4-runtime/managed-run-invocation-tree`: replace the default managed-run swimlane with an invocation-identity tree that preserves repeated worker calls, explicit parent invocation relationships, host-observed worker labels, and sequence-owned audit views.
- `rsp-4-runtime/markdown-document-presentation`: render current Specs and Decision Records from a bounded server-owned safe Markdown block projection without allowing repository HTML or browser-side semantic parsing.
- `rsp-4-runtime/web-content-presentation`: present normal-size Specs and archived Changes completely through shared safe Markdown rendering and a modern lightweight responsive shell, while retaining generous fail-closed resource ceilings.
- `rsp-4-runtime/broker-restart`: add one serialized Broker restart operation that safely replaces the current same-protocol-major singleton, including an older compatible-control minor, without creating a side-by-side process.
- `rsp-4-runtime/release-4-0`: reconcile the accepted feature and migration outcomes into the exact 4.0 package, documentation, and local release candidate.

## Completion Conditions
- [ ] Every child Change passes its declared Required verification and fixed-scope review before independent archive.
- [x] Compatible concurrent `npx` clients reuse one healthy Broker; incompatible protocol majors never share writable runtime state.
- [x] Multiple repositories and distinct worktrees remain isolated while inactive project sessions release open handles and memory after the declared idle policy.
- [x] Parallel managed workers can submit duplicate or out-of-order results without lost updates, unauthorized state transitions, or false acceptance.
- [x] A fresh runtime context packet can restore bounded run, receipt, attention, evidence-reference, and next-action context without reloading unchanged full artifacts; stale source identity forces targeted rehydration or full rebuild.
- [x] RSP remains fully usable for ordinary repository work when the Broker, Web UI, or runtime database is absent.
- [x] Runtime-present and runtime-absent execution derive the same authority, routing, acceptance, and closeout results from current repository evidence.
- [x] Markdown and current checkout evidence remain authoritative; every runtime or Web projection is identifiable, bounded, freshness-aware, and disposable.
- [x] Existing recognized `00-index.md` files migrate safely, unrecognized reserved content is preserved for owner review, and direct Specs navigation and search cover fresh clones.
- [x] The Web Observatory supports complete English and Simplified Chinese presentation-owned labels without translating projected repository content, paths, WorkRefs, or canonical identities.
- [x] The packaged Web Observatory renders through one typed React root while preserving its exact local authentication, projection, localization, refresh, accessibility, and responsive behavior.
- [x] Parallel managed dispatches are readable as a bounded sequence-owned SVG swimlane with explicit branches, receipts, anomalies, and an accessible textual audit fallback.
- [x] Managed runs default to an invocation-identity tree that keeps repeated calls distinct, resolves parent invocation relationships without semantic invention, records optional host-observed worker labels and roles, and retains committed sequence as the exact audit order.
- [x] Current Specs and Decision Records render from a bounded server-owned safe Markdown block projection with exact source fallback and no executable repository HTML or remote embedded content.
- [x] Normal-size Specs and archived Changes remain complete and readable through one modern lightweight Web presentation, with truncation reserved for exceptional resource bounds rather than ordinary documents.
- [x] One `rsp broker restart` operation atomically stops or recovers the current same-protocol-major singleton and starts a fresh compatible Broker without a side-by-side race.
- [ ] 3.x projects receive explicit 4.0 migration guidance for removed `--lite`, generated Specs indexes, runtime caches, and supported Node/package behavior.
- [ ] Full build, typecheck, lint, tests, documentation checks, clean-install package checks, Broker concurrency/recovery tests, and local browser acceptance pass on the exact release candidate.

## Durable Outcomes
- Current facts: update the smallest owning Core, CLI, Skill-system, distribution, runtime, Specs-navigation, and Web presentation Specs established by each child.
- Lasting rationale: create or update Decision Records for the Broker topology, runtime authority and context-freshness boundary, and Web security model when the implemented tradeoffs are confirmed.

## Blockers
- none
