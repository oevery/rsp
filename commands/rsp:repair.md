---
description: Repair or refresh the RSP structure in the current repository
---
Inspect setup health with:

`npx -y @oevery/rsp doctor --verbose`

If safe deterministic fixes are available, decide whether to run:

`npx -y @oevery/rsp doctor --fix`

If rules need refreshing, the managed block needs repair, or indexes need rebuilding, decide whether to run:

`npx -y @oevery/rsp update`

Summarize at the end:
1. Current setup health
2. Actual filesystem changes made
3. Remaining semantic issues that still need human or agent judgment

Constraints:
- `doctor --fix` `fixed` entries represent real filesystem changes
- Do not use the repair flow as a substitute for durable decisions, archive readiness, or stale-focus judgment
- If the `rsp` skill is available, load it for setup repair or audit judgment
