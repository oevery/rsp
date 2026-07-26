# Interactive TUI

## Purpose
- Define Ink dashboard and Skill-manager routing, state, localization, layout, and terminal-lifecycle contracts while keeping their mutation boundaries distinct.

## Stable Facts
- Bare `rsp` opens the dashboard only when stdin and stdout are TTYs, `TERM` is not `dumb`, and `CI` is absent or exactly `false`; otherwise root help stays non-interactive. `rsp ui` is the explicit dual-TTY entry.
- Existing subcommands, root help/version/error paths, plain output, and JSON contracts remain deterministic and non-interactive.
- TUI-owned labels support only `en` and `zh-CN`. WorkRefs, paths, commands, canonical states, existing CLI output, JSON, Skills, and persisted artifacts are not localized.
- The primary scopes are `Changes`, `Groups`, and `History` in cycle order. The active scope is textual, and the bounded footer places the complete Tab path first so navigation remains visible at the 40-column minimum.
- The dashboard is read-only. It presents status, deterministic next commands, and lazy default-bounded history without mutating project state.
- Bare `rsp skills` is a separate dual-TTY entry. Its component owns only optional selection and confirmation; it closes the terminal session before the CLI invokes the presentation-neutral atomic installer once. It is not part of the read-only dashboard.
- Default lifecycle and optional project Skills render as separate groups. Defaults are selected and locked, optionals start unselected, and divergent selected targets require a separate replacement confirmation. Cancellation or declining replacement returns no mutation plan.
- `ProjectStatusSnapshot` is an immutable rich internal snapshot. The public status JSON uses an exact adapter and remains flat; TUI state does not leak into it.
- History list/detail loading, errors, filters, selection, and viewport state stay separate from `ProjectStatusSnapshot`. History loads only when first visited, and structured detail loads only after `Enter`.
- Project-relative archive path is the unique history selection identity. A TUI-owned source atomically caches validated records from the last successful bounded list so detail does not re-inspect the archive; failed refresh preserves the prior valid cache.
- Structured Tasks, Verify, and Blockers evidence recognizes only RSP checkbox/list prefixes, preserves project-authored Markdown punctuation, and renders one count-bearing heading plus hanging-wrapped terminal-native content per section without a Markdown dependency.
- The detail presenter shares physical rows across evidence headings and content after dynamic chrome is deducted. It prefers whitespace word boundaries with grapheme/display-cell fallback, bounds complete rows and identity fields by display-cell width, and marks source or viewport omission as truncated on the last allocated content row.
- `src/tui/` owns dashboard state and shared terminal/display primitives; `src/skills-tui/` owns the Skill selector and its typed labels. Each dynamically loads only after its interactive route succeeds.
- The TUI consumes status and presentation-neutral archive-history query/detail seams as sibling presenters. Status, history, and core do not depend on TUI modules.
- React, Ink, and Yoga remain outside ordinary command evaluation.
- The terminal host requires dual TTYs, enters and leaves alternate-screen mode safely, restores cursor/input state on every exit path, handles resize and signals, and preserves non-TUI stdout/stderr behavior.

## Boundaries
- In scope:
  - Interactive routing, read-only dashboard state/presentation, localization, display-cell layout, history navigation, and terminal cleanup.
- Out of scope:
  - Dashboard mutation, TUI-owned filesystem mutation, CLI contract localization, persisted UI state, alternative archive semantics, and loading UI dependencies on non-interactive paths.

## Constraints
- Maintain the exact public status JSON contract and lazy-load the TUI.
- Render correctly at the supported 40-column minimum and cleanly recover the terminal on normal exit, errors, signals, and rejected interactive loading.
- History detail must remain bounded, presentation-neutral at its source seam, and keyed by unique archive path.
