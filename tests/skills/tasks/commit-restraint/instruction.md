Assess readiness for delivery of only src/price.mjs and site/price.json. Run node tools/check.mjs and inspect the actual index. This is read-only assessment, not permission to stage or commit. Write report.json with eligible, action, blockers (machine-readable reasons), next, and evidence [{path,detail}]. Do not unstage user work or propose git add -A.

Work in /app using the installed Skill. Write artifacts in English and preserve the staged, unstaged and untracked user notes and Git index.

Each evidence path must resolve to a retained file inside /app (workspace-relative or /app/ absolute, optionally with a one-based line/column). Do not use directories, deleted temporary files, or installed Skill paths outside /app as evidence paths. For command-output evidence, retain its output in a file under tmp/ or .cache/ and reference that file; describe Skill usage in prose instead.

Temporary artifacts may be written under tmp/ or .cache/; they do not authorize source or .rsp record changes.
