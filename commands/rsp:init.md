---
description: Initialize or adopt the RSP workflow in the current project
---
Goal:
- Initialize RSP if the repository does not use it yet
- Adopt and review the existing RSP setup if `.rsp/` is already present

First check whether the repository already has `.rsp/`.

If `.rsp/` does not exist, initialize with:

`npx -y @oevery/rsp init --with-project-setup --agents-mode print`

If `.rsp/` already exists, inspect setup health with:

`npx -y @oevery/rsp doctor`

Then:
1. Review the current `AGENTS.md`
2. Keep the `<!-- rsp:begin --> ... <!-- rsp:end -->` managed block unchanged, and only adjust surrounding human-owned content when needed
3. If `.rsp/changes/project-setup.md` exists, read and complete it
4. Read `.rsp/specs/design.md`
5. Fill in durable design facts based on the actual repository state
6. If the project has stable scoped workflow instructions, update the nearest project-owned `AGENTS.md` outside the managed RSP block only when authorized
7. Run the final health check when the review is complete:

`npx -y @oevery/rsp doctor`

Constraints:
- Keep the `AGENTS.md` managed block thin
- Write durable current facts into `.rsp/specs/design.md`; keep scoped operating instructions in nearest project-owned `AGENTS.md`
- Do not write one-off debugging notes, task history, or temporary implementation context into durable files
