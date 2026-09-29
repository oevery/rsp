# Context migration

Load when a legacy CONTEXT-MAP.md is found, CLI reports it, or the user requests context migration. This is a conditional Core method, not a separate Skill or a mandatory project phase. CONTEXT.md remains the target model for vocabulary, domain relationships, and navigation.

## Inspect without migrating

Read the relevant legacy map, existing root/local CONTEXT files, scoped instructions, and incoming references. File presence is a migration signal, not proof that its content is obsolete or that an existing CONTEXT already contains it. Resolve overlapping or contradictory definitions with their owner; do not choose a winner from the filename.

Without migration authority, preserve files and use the legacy content relevant to the current task alongside current context. Report the pending migration without repeatedly demanding it or blocking unrelated work. Stop only work that depends on an unresolved meaning or authority conflict. Do not follow unsafe or out-of-scope paths merely because a legacy map points to them.

## Migrate within explicit scope

Establish authorized source files, target owners, reference updates, and whether retiring the old file is included. Reuse the selected WorkRef when tracked; bounded direct migration needs no new work record.

1. Map useful terms, relationships, and navigation to their root/local CONTEXT owners. Keep contracts and operating rules with their existing Spec/AGENTS owners, using links instead of parallel definitions. Resolve material conflicts before changing their meaning.
2. Merge into existing context without overwriting unrelated content or renaming concepts for consistency alone. For substantial writing use Doc when available; otherwise preserve meaning and verify the reader's navigation directly. Doc supplies the writing method, not migration or deletion authority.
3. Update active references and entry instructions. Check both lost meaning and broken paths; historical snapshots need not be rewritten.
4. Retire the old map only after checking preserved meaning, active references, and explicit retirement authority. If any gate is missing, keep it and report the remaining work.

`rsp update` and `rsp doctor` only detect the root legacy path and provide guidance; they do not compare semantics, merge context, or retire project files. A successful command is not migration acceptance.

Return the source-to-owner result, changed files, checks, and unresolved conflicts or permissions. Migration completion derives from inspected documents and references, not a new marker or stored lifecycle state.
