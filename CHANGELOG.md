# Changelog

## 1.0.2 (2026-05-23)

- Rename `.rsp/spec/` → `.rsp/specs/` throughout (consistent with plural `rules/`, `features/`)
- Update RSP acronym expansion: Rules, Spec, Plan → Rules, Specs, Plans

## 1.0.1 (2026-05-23)

- Remove auto-generated `AGENTS.md` from repository (belongs in user projects, not the package)
- Use `.rsp/rules/*.md` glob pattern in config examples instead of single file reference

## 1.0.0 (2026-05-22)

- Initial release of RSP (Rules, Specs, Plans) workflow for AI-assisted development
- CLI commands: `init`, `new`, `close`, `status`, `check`, `deps`, `archive-index`
- Feature lifecycle management with `.rsp/` directory conventions
- YAML frontmatter, semantic checkboxes, delta markers, and GIVEN/WHEN/THEN scenarios
- PID-based file locking for concurrent safety
- Customizable statuses, priorities, and required sections via `.rsp/config.yaml`
- Mermaid.js dependency graph support (`rsp deps --mermaid`)
- Archive INDEX.md auto-generation and spec index extraction
