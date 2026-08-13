---
kind: "fix"
---

# Change: rsp-4-runtime/live-runtime-web-projection

## Proposal
- Outcome: Remove the dead Broker Web projection bridge after default Web delivery is withdrawn
- Why:
  - The earlier live-store consistency fix established the correct store-ownership boundary, but the succeeding default-delivery decision removes every consumer of the Broker Web projection bridge.
  - Leaving Web credentials, snapshots, managed-Web subscriptions, and refresh hooks in `BrokerProjectSessions` would keep retired code in the default Broker build and expose internal paths to content that no route can serve.
- Scope:
  - Remove Broker-owned Web credentials, snapshots, managed-Web subscriptions, refresh events, and post-write publication hooks.
  - Keep runtime-store projection logic internal to the packaged runtime adapter and retain bounded offline path-snapshot inspection.
  - Preserve the rule that direct access to a SQLite database owned by a running Broker is unsupported.
- Non-goals:
  - Add MCP, host-specific configuration, automatic task correlation, or initialization prompts.
  - Delete retained authored projection/browser source or historical design evidence.
  - Change runtime authority, retention, migration, or Broker lifecycle semantics.

## Spec
### MODIFIED
- Requirement: The default Broker contains no Web projection session bridge.
  - Broker project sessions own only project registration, runtime-store lifecycle, and project lifecycle subscriptions.
  - Runtime-manage writes return their direct service result without publishing a retired Web event.
  - Packaged runtime adapters project from stores they own; offline inspection retains bounded path snapshots and diagnostics.

### Acceptance
#### Scenario: runtime-manage write
- GIVEN a Broker project session with an open runtime store
- WHEN a managed observation is committed through the runtime-manage route
- THEN the service result is returned without invoking Web projection, credential, snapshot, or subscription code

#### Scenario: default Broker build
- GIVEN the retained authored Web source remains in the repository
- WHEN the default Broker is built
- THEN no Broker module imports the retained Web source or exposes a Web-session bridge

## Design
- Approach:
  - Remove the Web-specific state and methods from `BrokerProjectSessions`.
  - Remove the runtime-manage publication hook and keep projection helpers internal to `src/runtime/store.ts`.
- Boundaries:
  - The Broker project session remains the sole owner of the live store and its lifecycle.
  - Retained `src/web/` and `web/src/` code is not imported by default build entries.
- Affected areas:
  - `src/runtime/store.ts`
  - `src/broker/sessions.ts`
  - `src/broker/server.ts`
  - default-delivery and retained-source tests
- Constraints:
  - Preserve direct runtime-manage behavior, runtime-store ownership, diagnostics, and migration behavior.
  - Do not add configuration or expand runtime availability into workflow authority.

## Tasks
- [x] Remove Web credential, snapshot, managed-event, and subscription state from Broker project sessions.
- [x] Remove the runtime-manage Web publication hook and Web-specific Broker error mapping.
- [x] Keep runtime projection helpers internal and preserve bounded offline inspection.
- [x] Update focused tests and durable runtime guidance for the final no-Web Broker boundary.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/web-observatory.test.ts test/default-no-web-delivery.test.ts` (`27/27`) — proves: runtime-manage writes return their direct service result, retained source remains testable, and no Web bridge or transport entry remains reachable or imported.
  - [x] `mise exec -- pnpm run build` and `mise exec -- pnpm run typecheck` — prove: authored TypeScript and packaged entries compile.
  - [x] `mise exec -- pnpm run lint` — proves: the implementation and tests satisfy repository static checks.
  - [x] `git diff --check` — proves: the scoped patch has no whitespace errors.
### Optional
- Manual or environment:
  - [ ] Confirm an older cached Web URL returns the generic Broker route-not-found response after an authorized compatible restart.
- Coverage:
  - Broker restart, MCP, automatic host task correlation, token measurement, publication, and external release remain outside this Change.

## Blockers
- none

## Durable Decision
- Current facts: Update existing spec or scoped instruction
- Current-fact target: `.rsp/specs/runtime.md`, `.rsp/specs/design.md`, and `.rsp/specs/distribution.md`
- Facts to write: The default Broker has no Web-session projection bridge; packaged runtime adapters retain their direct and offline projection boundaries without exposing live SQLite access.
- Decision Record: Create or update a Decision Record
- Decision Record target: `.rsp/specs/decisions/default-package-omits-web-observatory.md`
- Rationale to write: Once default Web delivery is withdrawn, retaining its Broker bridge would create a misleading callable internal surface and keep retired code in the default build.
- Archive ready: yes
