# Groups and dependencies

Load this reference before creating, focusing, planning, or closing grouped or dependent work.

- Executable WorkRefs are `<change>` or one direct `<group>/<change>` child. Deeper paths are unsupported.
- Use a Change Group only for at least two independently executable Changes sharing a goal or completion contract. Create it with `npx -y @oevery/rsp group create <group> [goal]`, replace placeholders, and declare each direct child under `Slices` before creating it.
- `<group>/brief`, stored as `<group>/00-brief.md`, is not executable or focusable. Read it before a selected child. Its declaration order guides navigation and its blockers are inherited as external blockers, not graph edges.
- Declare an exact prerequisite only as `- requires \`<change-work-ref>\`: <reason>` under the dependent Change's `Blockers`. Targets must be executable Changes.
- Use `rsp status --json` as the derived dependency view. `plan.nodes`, `ready`, `edges`, `blocked`, and `waves` are authoritative for the current inspection. Each edge means “change requires prerequisite”; filtered plans retain transitive prerequisite context.
- Do not infer nested ownership from the human dependency forest, create a parallel graph, or copy live delivery state into a Group Brief. Archived prerequisites resolve without rewriting dependents; incomplete inspection fails closed.
- Archive children independently. Close the brief with `rsp group close <group>` only after every direct child and group completion gate passes.
- Closed Group recovery never reuses its identity through `rsp group create` and never cascades into children or dependents. Core's direct reopen-recovery procedure owns the lifecycle sequence and exact retained-archive selection.
