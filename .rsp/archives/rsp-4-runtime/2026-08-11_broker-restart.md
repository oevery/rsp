---
kind: "feature"
---

# Change: rsp-4-runtime/broker-restart

## Proposal
- Outcome: Add one serialized upgrade-safe Broker restart operation
- Why:
  - Protocol and package upgrades currently require users to discover the running Broker version, invoke a compatible older client to stop it, then start the intended package separately.
  - Separate `stop` and `start` commands release the singleton startup lock between operations, so another client may win the gap and turn an intended fresh replacement into reuse.
  - A dedicated restart operation can preserve the existing identity, ownership, no-side-by-side, and stale-recovery boundaries while making the common upgrade path explicit.
- Scope:
  - Add `rsp broker restart [--json]`.
  - Hold the Broker startup lock across inspection, cooperative stop or stale-record recovery, fresh daemon start, compatibility validation, and status projection.
  - Permit restart to replace a health- and ownership-verified Broker whose protocol major matches the current client, including an older protocol minor or incompatible runtime schema.
  - Return the previous and fresh public identities plus whether a live owner was stopped or stale metadata was recovered.
- Non-goals:
  - Stop an unhealthy Broker, a Broker with another protocol major, or a process whose identity or discovery ownership cannot be verified.
  - Preserve loaded project sessions, Web bearers, runtime handles, SSE subscriptions, endpoint, PID, or instance identity across restart.
  - Add automatic restart to `doctor`, `web`, package installation, update, or ordinary one-shot commands.

## Spec
### ADDED
- Requirement: Broker restart replaces one verified singleton under one serialized ownership boundary.
  - `rsp broker restart` acquires the existing startup lock once; the prior owner becomes absent before the startup claim transfers to the fresh daemon, and the daemon releases the lock only after atomically publishing its compatible discovery record.
  - A healthy Broker with the same protocol major may be stopped through its authenticated owned control endpoint even when its protocol minor or runtime schema is older than the current client requirement.
  - A protocol-major mismatch, unhealthy endpoint, changed process identity, changed discovery owner, invalid metadata, failed cooperative stop, or failed fresh startup remains an explicit non-zero failure and never starts a side-by-side Broker.
  - When no Broker exists, restart starts a fresh Broker. When stale metadata is identity-checked and removed, restart starts a fresh Broker without signaling the recorded PID.
  - Successful JSON output includes `action: "restart"`, `state: "running"`, `restarted`, `staleRecovered`, `previousBroker`, fresh `broker`, and `sessionCount`; neither identity exposes control tokens, process-start identities, project roots, or project tokens.

### Acceptance
#### Scenario: healthy restart
- GIVEN a healthy compatible Broker with loaded project sessions
- WHEN `rsp broker restart --json` runs
- THEN the old owner stops, one fresh compatible owner starts under the same serialized operation, its instance ID and PID differ, its session count is zero, and no side-by-side owner is observed

#### Scenario: protocol-minor upgrade
- GIVEN a health- and ownership-verified Broker with the current protocol major and an older protocol minor
- WHEN the current client restarts it
- THEN the older owner is cooperatively stopped and replaced by the current compatible Broker without requiring the older package CLI

#### Scenario: absent or stale Broker
- GIVEN no Broker or one identity-verified stale discovery record
- WHEN restart runs
- THEN a fresh Broker starts and output distinguishes absence from stale recovery without signaling an unrelated process

#### Scenario: unsafe replacement
- GIVEN a protocol-major mismatch, unhealthy owner, changed discovery identity, failed stop, or failed startup
- WHEN restart runs
- THEN it exits non-zero, reports the exact failure, and never creates an implicit side-by-side Broker

## Design
- Approach:
  - Add a `restartBroker()` client operation that reuses the existing discovery, health, process-identity, authenticated stop, stale unlink, daemon claim, and readiness checks under one `withBrokerStartLock(..., "restart")` call.
  - Extract only the smallest internal stop-and-wait and spawn-and-wait helpers needed to keep `startBroker`, `stopBroker`, and `restartBroker` behavior consistent.
  - Add a Broker command projection and citty subcommand with stable human and JSON output.
- Boundaries:
  - Restart broadens replacement only for a validated same-protocol-major owner; ordinary `stop` remains compatibility-strict.
  - The startup lock serializes cooperating clients, while discovery and process identity checks still protect against a changed or non-cooperating owner.
  - A successful stop followed by failed startup is reported as failure; restart does not resurrect the previous process or claim rollback.
- Affected areas:
  - Broker client lifecycle helpers, command output, CLI routing, and command help.
  - Broker protocol/lifecycle tests, CLI contract Specs, runtime Specs, and release dependency.
- Constraints:
  - Preserve exact loopback ownership, authenticated control, no-follow discovery, startup-claim, private-cache, compatibility, and no-side-by-side guarantees.
  - Do not signal a PID directly and do not weaken ordinary `start`, `stop`, `status`, doctor, or Web behavior.

## Tasks
- [x] Implement serialized restart and same-protocol-major upgrade replacement in the Broker client.
- [x] Add `rsp broker restart [--json]` human/JSON command surfaces.
- [x] Add lifecycle, concurrency, absent, stale, upgrade, and unsafe-replacement regression tests.
- [x] Update stable CLI/runtime facts and release dependency evidence.

## Verify
### Required
- Automated:
  - [x] Focused Broker lifecycle and CLI tests — proves: fresh identity, zero sessions, same-major older-minor replacement, absence/stale behavior, lock serialization, and fail-closed unsafe cases.
    - Fresh evidence: `mise exec -- pnpm exec vitest run test/broker-protocol.test.ts test/compatibility-migration.test.ts test/manage-runtime-integration.test.ts test/clean-install-check.test.ts --no-file-parallelism` passed 4 files and 52 tests on 2026-08-10.
    - Real-user evidence: `node dist/cli.mjs broker restart --json` replaced PID 12673 with PID 31591, both protocol `1.3`, returned `restarted: true`, `staleRecovered: false`, and `sessionCount: 0`.
  - [x] Build, typecheck, lint, full serial tests, documentation checks, and `git diff --check` — proves: restart does not regress existing Broker, Web, runtime, CLI, migration, or packaging behavior.
    - Fresh evidence: `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `mise exec -- pnpm run test -- --no-file-parallelism` (69 files, 823 tests), `mise exec -- pnpm run docs:check`, and `git diff --check` all passed on 2026-08-10.
### Optional
- Manual or environment:
  - [ ] Restart the current user-level Broker and reopen one Web Observatory session.
    - Restart was exercised against the current user-level Broker; browser reopening was not performed because it would require an interactive browser surface.
- Coverage:
  - Protocol-major replacement, unhealthy-process termination, automatic restart policy, session migration, and daemon supervision remain outside this Change.

## Blockers
- none
