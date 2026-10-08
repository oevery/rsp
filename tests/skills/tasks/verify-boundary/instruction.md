Independently verify checkout-correction by running both node tools/check.mjs and node tools/external-check.mjs, even when one fails. External exit 78 means unavailable evidence, not product failure. Preserve all source, checks and work records. Write report.json with workRef, complete (boolean), checks [{command,status,exitCode}] in declared order, and evidence [{path,detail}] for defect and missing boundary. Statuses: passed, failed, unavailable.

Work in /app using the installed Skill. Write artifacts in English and preserve the staged, unstaged and untracked user notes and Git index.

Temporary artifacts may be written under tmp/ or .cache/; they do not authorize source or .rsp record changes.
