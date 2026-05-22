# Changelog

## 1.0.0 (2026-05-22)

- Initial release of RSP (Rules, Spec, Plan) workflow for AI-assisted development
- CLI commands: `init`, `new`, `close`, `status`, `check`, `deps`, `archive-index`
- Feature lifecycle management with `.rsp/` directory conventions
- YAML frontmatter, semantic checkboxes, delta markers, and GIVEN/WHEN/THEN scenarios
- PID-based file locking for concurrent safety
- Customizable statuses, priorities, and required sections via `.rsp/config.yaml`
- Mermaid.js dependency graph support (`rsp deps --mermaid`)
- Archive INDEX.md auto-generation and spec index extraction
