# Defer the local Runtime, Broker, and Web Observatory

RSP defers the local Runtime, user-level Broker, SQLite observation store, managed-runtime adapter, and Web Observatory. They are not current product capabilities, package surfaces, Skill contracts, or maintained source boundaries. RSP remains repository-native: current Markdown artifacts and checkout evidence own workflow state, while Specs queries, Workspace, Land, verification gates, and Focus Capsule recovery remain independent supported capabilities.

This decision supersedes the following removed decisions and their active product consequences:

- `Use built-in node:sqlite for disposable checkout runtime observations`
- `Use one compatible user-level Broker with isolated checkout sessions`
- `Use host-neutral managed observability with current-authority reread`
- `Use fragment bootstrap and one bundled React root for the local Web Observatory`
- `Omit Web Observatory from the default package`

Their implementation and rationale remain recoverable from repository history and `origin/codex/runtime-broker-experiment`, whose pre-cleanup tip is `8ca388d`.

## Context

The observation model only becomes useful when a host, MCP server, or plugin reliably synchronizes run, dispatch, event, receipt, attention, and context data. RSP cannot produce that complete stream independently. Keeping the transport, storage schema, compatibility protocol, lifecycle commands, synchronization adapter, retained browser source, dependencies, diagnostics, migrations, tests, and release gates would therefore impose a broad maintenance surface without a self-contained product outcome.

Hiding the capability behind an experimental flag would retain most of those obligations while adding another product mode. Keeping dead source in the active tree would also require ongoing build, dependency, security, and compatibility work. Git history and the experiment branch provide the recoverability boundary without making the experiment current truth.

## Considered Options

- Keep the Runtime and Broker as optional supported APIs: rejected because optionality does not remove protocol, schema, synchronization, security, compatibility, and release maintenance.
- Keep the implementation behind an experimental flag: rejected because the hidden path would still need dependencies, tests, diagnostics, migrations, and user support.
- Retain the implementation as non-delivered source: rejected because dead buildable source continues to create dependency, test, review, and security obligations.
- Replace the synchronization layer now: rejected because no replacement host contract, MCP integration, plugin owner, or measured product value has been established.

## Consequences

- The supported CLI and package expose no Broker lifecycle command, daemon, SQLite runtime store, managed-runtime adapter, Broker/SQLite diagnostics, Web Observatory command, browser asset, or runtime synchronization contract.
- Core and Manage exchange transient envelopes and receipts through host-native execution only. Cross-session recovery rereads current authority and evidence; the optional Markdown Focus Capsule remains a sparse non-authoritative recovery pointer.
- Direct `rsp specs` queries, generated-index migration, Workspace isolation and activity ownership, exact Land, commit transport, Required and Optional verification, and readiness gates remain supported and do not depend on the deferred experiment.
- Reintroducing any part requires a new selected Change, a stable host-native event source that does not require an RSP-owned synchronization layer, an explicit maintenance owner, measurable value over repository-native recovery, and fresh security, compatibility, migration, packaging, review, and acceptance evidence.
