Use the appropriate host-provided RSP capability to audit src/ for structural ownership and reachable production-path risks. Use CONTEXT.md for declared ownership and report concrete production consequences supported by source and test evidence.

Keep product and Git state read-only. Write report.json with findings containing owner, bypass, entrypoint (repository paths), example {input, expectedCents, actualCents}, consequence, coverage and evidence [{path,line}]. Cite the reachable chain and explain any test blind spot. Findings do not authorize repair or replacement design. Work in /app and preserve staged, unstaged and untracked user work.

For each finding, owner, bypass and entrypoint must each be a single file-path string relative to the repository root, without line numbers or explanation. Put explanations and call chains in consequence, coverage or additional fields; extra fields are allowed.

Temporary artifacts may be written under tmp/ or .cache/; they do not authorize source or .rsp record changes.
