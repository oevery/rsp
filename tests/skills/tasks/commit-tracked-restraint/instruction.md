Use the host-provided rsp-commit Skill directly. The selected tracked child is checkout/price-update; its record is .rsp/changes/checkout/price-update.md and its Group context is .rsp/changes/checkout/00-brief.md.

Assess readiness for delivery of only src/price.mjs and site/price.json. Run node tools/check.mjs and inspect the actual index. This is read-only assessment, not permission to stage or commit. Write report.json with workRef (the selected logical child identity), eligible, action, blockers (machine-readable reasons), next, and evidence [{path,detail}]. Do not unstage user work or propose git add -A.

Work in /app using the installed Skill. Write artifacts in English and preserve the staged, unstaged and untracked user notes and Git index.

Temporary artifacts may be written under tmp/ or .cache/; they do not authorize source or .rsp record changes.

The next field must be a nonempty JSON string describing the bounded next action. Combine multiple steps in that string; do not use an array or object.

Each evidence path must resolve to a retained file inside /app, using a workspace-relative path or an /app/ absolute path. A path may include a one-based line, line:column or inclusive line range (for example src/value.mjs:2, src/value.mjs:2:1, or src/value.mjs:2-4); L-prefixed line numbers are also accepted. Locations must exist, ranges must be ordered, and a column may mark the end-of-line insertion point. Do not reference directories, removed temporary files, or paths outside /app.
