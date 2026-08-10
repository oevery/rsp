# Use one compatible user-level Broker with isolated checkout sessions

RSP uses one optional user-level Broker per resolved cache root because repeated package invocations need deterministic reuse without creating a long-lived daemon for every repository. The process is shared only across compatible protocol and runtime-schema identities; every canonical checkout, including each Git worktree, receives an isolated lazy session, token, and namespace.

## Considered Options

- Start one long-lived process per repository: rejected because concurrent `npx` invocations would duplicate ports, HTTP servers, event loops, and lifecycle races while still needing a separate cross-process discovery protocol.
- Install a launchd, systemd, or Windows service: rejected because a package-owned optional runtime should remain portable, explicitly started, removable with the package cache, and independent from host service installation authority.
- Allow incompatible protocol majors to run side by side automatically: rejected because multiple writable runtime owners would make discovery, browser routing, cache ownership, and migration ambiguous in the first 4.0 release.
- Identify projects by Git remote or common Git directory: rejected because forks, remote-less repositories, and distinct worktrees would collide and could cross-route paths, tokens, or observations.
- Treat the Broker or its runtime projections as workflow authority: rejected because operational reuse must not replace current Markdown, checkout evidence, or the Skills and commands that own RSP semantics.

## Consequences

- Compatible package versions reuse one healthy endpoint through complete-record atomic lock publication, one-time client-to-daemon claim transfer, and exclusive discovery publication; protocol and runtime schema, rather than package version alone, define compatibility.
- Incompatible clients stop with an exact stop-or-upgrade action and never start an implicit side-by-side Broker.
- Discovery and shutdown revalidate PID process-start identity and endpoint ownership. Dead or reused PIDs cause quarantine-based identity-scoped metadata cleanup only; concurrent replacements are restored or preserved, and unavailable identity fails closed.
- The shared process binds only exact IPv4 loopback, requires control or project bearer tokens, checks browser origin, bounds paths and payloads, keeps one canonical token per loaded checkout session, and bounds every JSON response before sending headers.
- Canonical checkout path plus filesystem identity deliberately makes each worktree a distinct project session and runtime namespace.
- Idle sessions unload resources without deleting repository files or making the retained namespace authoritative. Ordinary one-shot RSP commands stay Broker-independent.
- A future change that adds another protocol major, remote transport, OS service installation, shared worktree identity, or runtime authority must revisit singleton discovery, migration, security, and rollback together.
