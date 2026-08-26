# TUI

## Purpose

Define the interactive terminal presentation of current RSP projections.

## Current facts

- The primary scopes are `Work`, `Specs`, and `History`. Work presents Changes and Groups while retaining exact WorkRef identity and kind.
- TUI consumes presentation-neutral status, history, and Specs projections. It does not derive lifecycle, dependency, readiness, authority, or delivery state independently.
- TUI labels support `en` and `zh-CN`. WorkRefs, paths, commands, canonical machine values, JSON, Skills, and persisted Markdown remain unchanged.
- Dashboard, detail, search, and history views are read-only unless an explicitly owned command action is invoked.
- Terminal lifecycle owns TTY detection, layout, focus, input, resize, cleanup, and restoration of the terminal.
- Missing, invalid, or unavailable data is shown as a diagnostic or empty projection; TUI does not infer successful work from missing evidence.

## Boundaries

- TUI owns interactive routing state, labels, layout, and terminal lifecycle.
- Core, command domains, status, history, and Specs inspection own the data and semantics displayed by TUI.

## Constraints

- Keep TUI presentation separate from ordinary command evaluation.
- Preserve exact WorkRef and path identity in every interactive scope.
- Do not persist TUI state as RSP workflow truth.
