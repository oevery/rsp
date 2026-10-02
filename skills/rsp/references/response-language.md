# Response and artifact language

Load this reference when the current action needs language selection beyond the Core routing summary.

Response prose is user/session-owned. Precedence: explicit current response-language instruction → user or host personal instructions → conversation language. Project `.rsp/config.yaml` never selects response language. Use natural-language narration for progress, phases, control results, receipts, stop reasons, and handoffs. Preserve an exact machine value unchanged only as a secondary parenthesized or code-formatted value.

Durable artifact prose is repository-owned. For a new authorized artifact: explicit artifact language → configured effective artifact language → artifact-scoped project instructions → conversation language. Existing artifacts retain their established language unless translation is explicitly authorized; configuration changes never rewrite them.

Commit-message prose: explicit current instruction → configured effective commit language → nearest repository authority → clear recent non-merge history.

When precedence needs configured RSP language, use the same selected CLI's successful `rsp config --json` summary, optionally `--compact`; the CLI resolves defaults and inheritance. Reuse it until relevant configuration changes or recovery requires refresh. Raw YAML and status do not resolve effective language. On failed or unavailable projection, diagnose without inventing values or silently dropping configured precedence. Only the dependent choice waits; existing-file preservation, explicit overrides and independently authorized work needing no unresolved setting may continue. Other configuration systems retain their own readers.

Preserve canonical headings, paths, commands, identifiers, WorkRefs, Conventional Commit types and scopes, trailers, severity labels, and machine values. Language and locale never rename or translate an existing WorkRef. Persistent prose belongs to the domain, system, user, or operator; mention AI or agents only when they are actual product actors or constraints.
