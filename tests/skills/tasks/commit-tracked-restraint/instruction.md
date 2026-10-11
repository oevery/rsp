Use the host-provided rsp-commit Skill directly. The selected tracked child is checkout/price-update; its record is .rsp/changes/checkout/price-update.md and its Group context is .rsp/changes/checkout/00-brief.md.

Assess readiness for delivery of only src/price.mjs and site/price.json. Run node tools/check.mjs and inspect the actual index. This is read-only assessment, not permission to stage or commit. Write report.json with workRef (the selected logical child identity), eligible, action, blockers (machine-readable reasons), next, and evidence [{path,detail}]. Do not unstage user work or propose git add -A.

Work in /app using the installed Skill. Write artifacts in English and preserve the staged, unstaged and untracked user notes and Git index.

Temporary artifacts may be written under tmp/ or .cache/; they do not authorize source or .rsp record changes.

Evidence paths must identify existing workspace files, not directories.
