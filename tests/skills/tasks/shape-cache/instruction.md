Write plan.md as a standalone executable design for approved per-entry cache TTL; do not create/focus a Change or modify source. TTL uses integer milliseconds: zero expires immediately, negative TTL is rejected, expired reads return undefined at now >= expiresAt. Inject the clock. Preserve key/string-value semantics. Include ownership, ordered steps and deterministic before/equal/after, zero and negative tests. State implementation and verification limits.

Work in /app using the installed Skill. Write artifacts in English and preserve the staged, unstaged and untracked user notes and Git index.

Temporary artifacts may be written under tmp/ or .cache/; they do not authorize source or .rsp record changes.
