# Message and owned references

Load for tracked, integration, Group, release, issue-related or non-trivial messages after the final cached boundary is reviewed.

## Project contract and subject

Read applicable project instructions, message conventions and configured checks. Recent relevant commits supplement explicit rules, never override them. RSP does not require adopting Conventional Commits; where adopted, distinguish its syntax from stricter project requirements. Report conflicts with required checks instead of bypassing them. Preserve the entrypoint's commit-language precedence.

Derive type from the accepted change and scope from a stable domain or module, not session activities or path inventories. Summarize one reviewable outcome. If the message exposes unrelated outcomes, return to the delivery-boundary check; do not silently split or broaden the authorized commit.

## Body by information need

When project rules permit, omit the body if the subject suffices and no material rationale, compatibility, migration or risk needs explanation. File count and change type alone do not determine that need. Otherwise explain only what a reader without the session needs: the problem and motivation, important old/new behavior differences, consequential tradeoffs or limitations.

For Conventional messages, separate a present body from the subject with a blank line. The body is free-form: prose suits causal explanations and tradeoffs, lists suit related independent points, and a mixture suits both. These are choices, not required shapes; impose no bullet list, Why/What/Testing template or mandatory prose-plus-list sequence. Do not pad the body or repeat the subject.

Keep real removals, migration constraints and important omissions. Do not copy the Change, execution chronology, routine checks or full path lists. Omit session-only attempts; retain a consequential reason for rejecting an alternative or accepting a tradeoff only when it explains the final design. A decisive measurement or verification limitation may matter, but command success must not imply broader acceptance.

Follow project length and wrapping checks without inventing universal 50/72-character limits. Otherwise wrap for readability without breaking URLs, identifiers, commands or natural Chinese text. If an exact required reference conflicts with a hard check, report the conflict rather than truncating it or bypassing the check.

## Owned footers

Body freedom does not remove footer syntax. Keep footers separated by a blank line from the body, or from the subject when the body is absent. Emit ownership trailers as standalone fields, not body-list items; a necessary footer does not require a filler body. For Conventional breaking changes, use `!` or a `BREAKING CHANGE` footer as permitted, requiring both only when the project does. Explain the affected contract and migration needs proportionately; use the footer's exact token and syntax when present.

Project trailers from real ownership:

- Add one RSP-WorkRef per included Change.
- Add RSP-Group only when a Group is the durable owner; integration alone emits none.
- Direct and release without real included WorkRefs emit no RSP trailer.
- Keep authoritative external references already owned by the work. Use BREAKING CHANGE only for a real breaking contract.

Never invent a WorkRef, Group, issue, co-author, sign-off, breaking change or AI attribution.

Represent owned issue relationships with a proportionate non-closing Issue reference. A terminal delivery with complete selected Change acceptance may additionally use the provider-supported closing keyword only for an explicit closes relation. Checkpoints, relates, ambiguous ownership or unresolved provider/repository identity emit no closing keyword. If shorthand cannot be resolved safely, retain only the canonical URL; do not infer issues from files or mutate the tracker.
