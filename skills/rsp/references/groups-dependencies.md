# Groups and dependencies

Load this reference before creating, focusing, planning, or closing grouped or dependent work.

- Executable WorkRefs are `<change>` or one direct `<group>/<change>` child. Deeper paths are unsupported.
- Use a Change Group only for at least two independently executable Changes sharing a goal or completion contract. Create it with `npx -y @oevery/rsp group create <group> [goal]`, replace placeholders, and declare each direct child under `Slices` before creating it.
- `<group>/brief`, stored as `<group>/00-brief.md`, is not executable or focusable. Read it before a selected child. Its declaration order guides navigation and its blockers are inherited as external blockers, not graph edges.
- Declare an exact prerequisite only as `- requires \`<change-work-ref>\`: <reason>` under the dependent Change's `Blockers`. Targets must be executable Changes.
- Use plain `rsp status` for the default semantic view and `rsp status --json` when exact dependency fields are needed. In the default JSON projection, `plan.nodes`, `plan.edges`, `plan.blocked`, and `plan.waves` are authoritative; the first non-empty wave is the current ready work. Each edge means “change requires prerequisite”; filtered plans retain transitive prerequisite context.
- Do not infer nested ownership from the human dependency forest, create a parallel graph, or copy live delivery state into a Group Brief. Archived prerequisites resolve without rewriting dependents; incomplete inspection fails closed.
- Archive children independently. Close the brief with `rsp group close <group>` only after every direct child and group completion gate passes.
- Closed Group recovery never reuses its identity through `rsp group create` and never cascades into children or dependents. Core's direct reopen-recovery procedure owns the lifecycle sequence and exact retained-archive selection.
