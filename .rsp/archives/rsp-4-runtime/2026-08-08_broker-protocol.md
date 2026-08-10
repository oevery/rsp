---
kind: "feature"
---

# Change: rsp-4-runtime/broker-protocol

## Proposal
- Outcome: Provide one compatible user-level Broker with isolated lazy project sessions
- Why:
  - Repeated `npx` invocations must not create one long-lived server per repository or race while discovering and starting the same runtime.
  - A shared process reduces duplicated HTTP, socket, connection, and event-loop resources only when repository identity, version compatibility, lifecycle, and permissions remain exact.
- Scope:
  - Define one user-level Broker discovery and control protocol for compatible RSP clients.
  - Derive stable project identity from the canonical checkout boundary and host isolated lazy project sessions, including distinct sessions for separate worktrees.
  - Implement atomic singleton startup, health checks, version negotiation, stale-process recovery, idle unload, and explicit status/stop operations.
  - Provide one authenticated loopback HTTP/SSE control and projection surface without making ordinary CLI commands Broker-dependent.
- Non-goals:
  - Start the Broker for `status`, `check`, `show`, lifecycle, Git, or other ordinary one-shot commands.
  - Scan, watch, index, or expose every repository on the machine by default.
  - Install launchd/systemd services, provide remote access, or create a general MCP or agent scheduler.
  - Run multiple incompatible Broker protocol majors side by side in the first 4.0 release.
  - Share authority, paths, credentials, events, or mutable state between project sessions.

## Spec
### ADDED
- Requirement: Compatible clients reuse one healthy user-level Broker while incompatible protocol majors never share writable runtime state.
  - Concurrent startup uses one atomic lock and rechecks health after lock acquisition.
  - Discovery validates PID, process-start identity, loopback endpoint ownership, health response, protocol compatibility, and runtime schema support.
  - The Broker lazily creates project sessions keyed by stable checkout identity and unloads inactive resources without deleting durable project files.
  - Project identity includes the canonical checkout root and filesystem identity; Git remotes or a shared common Git directory never collapse distinct worktrees.
  - Every request is scoped to one registered canonical repository root and cannot traverse or query another project implicitly.
  - Broker absence, shutdown, or incompatibility leaves ordinary RSP file workflows available.

### Acceptance
#### Scenario: concurrent compatible startup
- GIVEN no healthy Broker and two compatible `npx` clients for the same user
- WHEN both request Web or runtime service concurrently
- THEN exactly one Broker becomes authoritative and both clients receive the same healthy endpoint

#### Scenario: isolated project sessions
- GIVEN one Broker serving two repositories
- WHEN each repository opens a session and queries status
- THEN every response, path, token, event stream, and lifecycle operation remains bound to its exact project identity

#### Scenario: distinct worktrees
- GIVEN two worktrees backed by the same common Git repository
- WHEN both register with one Broker
- THEN each receives a distinct project identity, runtime namespace, status projection, and access token

#### Scenario: incompatible protocol
- GIVEN a healthy Broker whose protocol major is incompatible with the invoking client
- WHEN the client requests runtime service
- THEN it neither writes through the incompatible Broker nor starts an implicit side-by-side service and returns the exact stop-or-upgrade action

#### Scenario: stale runtime record
- GIVEN a recorded PID that is absent or has a different process identity
- WHEN a client discovers the Broker
- THEN discovery rejects the stale owner and recovers under the singleton lock without signaling an unrelated process

## Design
- Approach:
  - Add a small client/server protocol with independently versioned protocol and runtime schema identities.
  - Store only Broker discovery metadata in the user cache; keep project runtime data under exact project namespaces.
  - Use one authenticated loopback HTTP endpoint for control, browser snapshots, and SSE projections.
  - Reuse the existing process-identity, atomic-record, lock, path-boundary, and cooperative cleanup patterns where their ownership matches.
- Boundaries:
  - The Broker owns process discovery, project-session routing, health, transport, and lifecycle only.
  - Project sessions compose managed-run storage, bounded context, and repository-query adapters; RSP artifacts and commands retain engineering semantics and mutation authority.
  - A healthy Broker never grants permission to read a repository that the invoking project session did not register exactly.
- Affected areas:
  - New runtime/broker domain modules and `rsp broker` / `rsp web` entry routing.
  - Package inventory, portable user-cache paths, process lifecycle adapters, diagnostics, and protocol types.
  - Focused concurrency, stale-owner, compatibility, security-boundary, and clean-install tests.
- Constraints:
  - Default binding is loopback-only, startup is deterministic under parallel clients, and shutdown never signals by PID without process-identity revalidation.
  - Package-version differences alone do not require another Broker when protocol and schema compatibility are declared.
  - Idle unloading releases open handles and in-memory snapshots without changing repository truth; watching is added only by a child that owns a measured need.

## Tasks
- [x] Define stable Broker protocol, schema compatibility, checkout/worktree identity, portable discovery/process adapters, and bounded public JSON contracts.
- [x] Implement atomic singleton startup, health, status, stop, stale-record recovery, and compatible reuse.
- [x] Implement lazy isolated project sessions, idle unload, exact path scoping, and loopback transport security.
- [x] Keep one-shot commands Broker-independent and update package/runtime documentation for the new optional service.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/broker-protocol.test.ts` — 19 tests prove one compatible multi-process singleton, complete-record lock publication, one-time daemon claim transfer, interrupted-starter recovery, late-daemon self-exit, compatible package-version reuse, exact protocol/schema incompatibility handling without side-by-side startup, cooperative shutdown, stale/dead/reused-PID safety, SSE, and idle unload.
  - [x] `mise exec -- pnpm exec vitest run test/broker-protocol.test.ts` — repository, same-Git worktree, canonical same-checkout concurrent registration, token, namespace, origin, and canonical path-boundary scenarios prove that sessions cannot merge, issue immediately invalid tokens, cross-read, or cross-route.
  - [x] `mise exec -- pnpm exec vitest run test/broker-protocol.test.ts` — portable cache precedence, private metadata, quarantine-based replacement-safe cleanup, stale and identity-unavailable locks, stable process identity, exact loopback endpoint, bounded status and JSON responses, and cache-free ordinary commands pass.
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run typecheck && mise exec -- pnpm run lint` — the independent daemon and lazy CLI command path build and pass static validation.
  - [x] `mise exec -- pnpm run docs:check` — 7 bilingual page pairs and 30 Markdown files pass link and pairing validation.
  - [x] `mise exec -- pnpm run release:package-check` and `mise exec -- pnpm exec vitest run test/clean-install-check.test.ts` — the packed package includes `dist/broker-daemon.mjs`, installed absent status remains cache-free, and installed start/status/stop leaves no owned discovery or Broker process.
- Fixed-scope review correction evidence on 2026-08-08: the original five Findings are `accepted`; focused tests, build, typecheck, lint, docs, package smoke, and whitespace checks pass after the corrections.
- Final package-check cleanup Finding `[P2]` is `accepted`: cleanup is armed before `broker start`, a parseable start response records a safe PID early while malformed output falls back to the validated Broker status/discovery path, and `finally` always attempts cooperative stop with the same `RSP_BROKER_CACHE_HOME`. A deterministic invalid-JSON injection keeps idle timeout at 60 seconds and proves the failing script leaves neither a live daemon nor package workspace/discovery/cache residue.
- Fresh correction verification on 2026-08-08: the injected failure-path test passes; all 3 clean-install tests, `release:package-check`, build, typecheck, lint, and `git diff --check` pass. A report-only re-review against the original `e9a7ff9` Broker fixed set remains pending.
### Optional
- Manual or environment:
  - [ ] Launch compatible and incompatible exact-package clients from two repositories and inspect reuse, idle unload, and shutdown.
- Coverage:
  - Group integration later covers the SQLite adapters, Manage events, browser surface, package installation, and exact 4.0 migration.

## Blockers
- none
