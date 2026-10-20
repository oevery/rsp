Investigate only the fixed findings in findings.md against actual source and project-brief.md. Do not correct files, even if a finding is accepted. Write report.json with dispositions [{id,status,reason}] for F1 then F2, repaired (boolean), and evidence [{path,detail}]. Statuses are accepted, rejected or needs-clarification. Keep product and Git state unchanged.

Work in /app. Use the installed rsp-implement Skill. Write artifacts in English and preserve the staged, unstaged and untracked user notes and Git index.

Each evidence path must resolve to a retained file inside /app, using a workspace-relative path or an /app/ absolute path. A path may include a one-based line, line:column or inclusive line range (for example src/value.mjs:2, src/value.mjs:2:1, or src/value.mjs:2-4); L-prefixed line numbers are also accepted. Locations must exist, ranges must be ordered, and a column may mark the end-of-line insertion point. Do not reference directories, removed temporary files, or paths outside /app.

Temporary artifacts may be written under tmp/ or .cache/; they do not authorize source or .rsp record changes.
