# Cross-source synthesis

Load only when the user asks to synthesize two or more completed source reports into `research/models/<topic>.md`.

- Cite source-report paths and their Git revisions or dated snapshot identities, not raw cache files.
- Add frontmatter `sources` entries in `<source>@<revision-or-snapshot-id> -> <report-path>` form for traceability. Recheck them against the cited reports when updating a model; managed status checks registered Git reports, not synthesis freshness or unregistered web snapshots.
- Separate shared mechanisms, disagreements, RSP gaps, rejected ideas, and candidate recommendations.
- Keep RSP's current product files as the authority. A model is intermediate research, not a rule or design decision.
- Do not promote a recommendation until the user selects it for a normal RSP change.
