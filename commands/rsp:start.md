---
description: Start a new RSP change
---
Goal:
- Create a new tracked change
- Initialize RSP first if the repository is not initialized yet

If the repository does not have `.rsp/`, initialize first with:

`npx -y @oevery/rsp init --agents-mode print`

Then create the change with:

`npx -y @oevery/rsp create $1`

Then focus it with:

`npx -y @oevery/rsp focus $1`

Read the new `.rsp/changes/$1.md` and complete it based on the user's request:
1. `## Proposal`
2. `## Spec`
3. `## Design`
4. `## Tasks`
5. `## Verify`
6. `## Blockers`

Constraints:
- `$1` should be a clear change name; do not invent a vague name
- Do not use `--with-project-setup` in this command; that bootstrap change belongs to `rsp:init`
- Ensure the frontmatter has an explicit `kind`
- Create a change only when the user explicitly wants tracked open work
- For a small and straightforward tracked task, you may use `rsp create $1 --lite`
