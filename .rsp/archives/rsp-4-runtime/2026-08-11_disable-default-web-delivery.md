---
kind: "refactor"
---

# Change: rsp-4-runtime/disable-default-web-delivery

## Proposal
- Outcome: Stop shipping Web Observatory in the default CLI and package inventory
- Why:
  - The current Web experience adds Broker, browser-session, packaged-asset, and observability expectations before it provides enough reliable user value.
  - RSP should preserve the simpler Markdown and one-shot CLI workflow as the default rather than expose a partially useful browser surface.
- Scope:
  - Remove `rsp web` from the public CLI command registry, help, and installed behavior.
  - Remove Web route/bootstrap wiring from the default Broker build so an installed package does not expose the browser surface.
  - Stop building and packaging Web-specific projector and browser assets.
  - Remove Web delivery claims and installed-package smoke coverage while retaining authored Web source and focused source-level tests for possible future re-evaluation.
- Non-goals:
  - Delete the authored Web implementation or its design history.
  - Add an experimental flag, environment variable, `config.toml` option, MCP integration, or initialization prompt.
  - Remove the Broker, runtime store, direct Specs queries, or Markdown-first workflow.

## Spec
### MODIFIED
- Requirement: The default RSP package does not provide the Web Observatory.
  - Public CLI discovery and execution contain no `rsp web` command.
  - The default Broker exposes no Web page, asset, bootstrap, snapshot, detail, or event routes.
  - Package inventory contains no Web-specific projector entry or browser assets.
  - Authored Web source may remain in the repository but is not a supported installed surface.

### Acceptance
#### Scenario: installed default package
- GIVEN a clean installation of the exact package
- WHEN command help, Broker routes, and package inventory are inspected
- THEN no Web Observatory command, route, projector entry, or browser asset is available

#### Scenario: ordinary workflow
- GIVEN the Web Observatory is not delivered
- WHEN users run Markdown-based status, check, show, ready, specs, lifecycle, Broker runtime, or Manage operations
- THEN those supported paths remain unchanged and do not require Web configuration

## Design
- Approach:
  - Remove the CLI registration and default Broker Web route/service wiring rather than adding a runtime switch.
  - Remove Web build entries and package inventory declarations while leaving `src/web/`, `web/src/`, and related source history available but unreachable from the default package.
  - Replace installed Web smoke assertions with negative inventory and route assertions.
- Boundaries:
  - This is a default-delivery decision, not deletion of the implementation or an experimental feature framework.
  - Runtime and Broker APIs unrelated to browser delivery remain public and supported.
- Affected areas:
  - CLI registry, Broker daemon/server wiring, build configuration, package inventory, and clean-install checks
  - public documentation and tests that currently claim or exercise installed Web delivery
- Constraints:
  - Do not leave a documented or callable partial Web surface that fails only because assets are absent.
  - Do not add configuration, hidden opt-ins, alternate entry points, or automatic prompts.
  - Preserve retained source without claiming it as shipped, supported, or release-verified.

## Tasks
- [x] Remove the public `rsp web` command and default Broker Web route/service wiring.
- [x] Remove Web projector/browser build entries and packaged asset inventory.
- [x] Remove the dead Web command/opener, browser transport entry, Broker Web-session bridge, generated static assets/default projector path, and Web-specific generic route errors.
- [x] Update clean-install and CLI/Broker tests to prove Web is absent while supported runtime paths remain intact.
- [x] Remove default-delivery claims from public English and Simplified Chinese documentation.

## Verify
### Required
- Automated:
  - [x] Focused Broker, package-inventory, retained-source, and clean-install tests (`35/35`) — prove: the default package exposes no Web surface, dead bridge, or retained transport entry, while supported non-Web behavior remains intact.
  - [x] `mise exec -- pnpm run test` (`816/816`, no skips) — proves: the complete repository behavior remains green after removing default Web delivery and obsolete delivery-only tests.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, and `mise exec -- pnpm run lint` — prove: retained source and default distribution compile cleanly.
  - [x] `mise exec -- pnpm run release:package-check` — proves: the installed package inventory contains no Web command, routes, projector entry, or browser assets while Broker/runtime smoke remains green.
  - [x] `mise exec -- pnpm run docs:check` — proves: English and Simplified Chinese public documentation agree on the no-Web default boundary.
  - [x] `git diff --check` — proves: the scoped patch has no whitespace errors.
### Optional
- Manual or environment:
  - [ ] Confirm an older cached Web URL receives only the generic Broker route-not-found response after a compatible restart.
- Coverage:
  - The optional old-URL check was not run because restarting the current user-owned Broker was not authorized. Source deletion, an experimental opt-in, MCP, automatic task correlation, publication, and remote release remain outside this Change.

## Blockers
- none

## Durable Decision
- Current facts: Update existing spec or scoped instruction
- Current-fact target: `.rsp/specs/cli-contracts.md`, `.rsp/specs/runtime.md`, `.rsp/specs/distribution.md`, and `.rsp/specs/design.md`
- Facts to write: The default package exposes no Web command, Broker routes, session bridge, projector entry, generated browser assets, or Web-specific generic route errors; retained authored Web source remains non-delivered and requires no configuration.
- Decision Record: Create or update a Decision Record
- Decision Record target: `.rsp/specs/decisions/default-package-omits-web-observatory.md`
- Rationale to write: Default Markdown and CLI workflows provide the safer current value boundary; an experimental configuration or initialization prompt would preserve complexity without proven benefit, while retaining source keeps future re-evaluation possible.
- Archive ready: yes
