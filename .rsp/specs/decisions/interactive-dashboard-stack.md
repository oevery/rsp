# Adopt an Ink dashboard in the main Node.js 22 package

RSP 3.1 uses Ink 7 and React 19 for the default read-only dashboard on an interactive terminal, raises the minimum runtime to Node.js 22, and ships the dashboard in the main package. The interactive entry is lazy-loaded so existing subcommands, plain status output, and JSON automation do not evaluate the TUI dependency graph.

## Considered Options

- Keep bare `rsp` as static help and offer no dashboard: rejected because it does not improve navigation, filtering, dependency inspection, or dense-project readability for human operators.
- Ship the dashboard as a separate opt-in package: rejected because installation and command discovery would conflict with making bare interactive `rsp` the default human experience.
- Use OpenTUI: rejected for the first release because its native per-platform distribution and Bun/Zig-centered build surface add packaging risk to a portable Node CLI.
- Use Terminal Kit: rejected because Ink better matches the component model, reducer-driven state, React integration, and terminal test approach selected for the dashboard.

## Consequences

- RSP 3.1 requires Node.js 22 or newer and must disclose that migration before release.
- The main production install includes Ink, React, and Yoga. Retained package evidence measures the added logical footprint below the accepted 15 MiB limit and keeps the packed tarball below 512 KiB.
- Bare `rsp` becomes interactive only on a real dual TTY outside CI; `rsp ui` is the explicit equivalent. Non-interactive bare invocation, existing subcommands, `rsp status`, and `rsp status --json` remain deterministic static paths.
- The first dashboard is read-only, supports English and Simplified Chinese only for TUI-owned labels, and leaves guided mutation or additional locales to separately shaped work.
- Replacing the stack or splitting package topology later requires revalidating terminal lifecycle, supported runtimes, installed footprint, startup isolation, and the default interactive-entry contract.
