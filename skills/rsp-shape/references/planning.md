# Authorized planning and readiness

Load only for authorized planning-artifact work, before choosing or naming an owner, creating/refining a Change or Group, or updating the selected Change Design. Advice alone grants no artifact mutation.

## Choose and name the owner

When Shape must establish a new WorkRef, preserve an explicit valid user-supplied identity through canonical normalization. Otherwise follow an explicit nearest project or domain WorkRef naming convention. If neither exists, infer ASCII lowercase kebab-case from stable domain or technical vocabulary. Artifact, commit, response, host locale, and TUI language settings never select or translate WorkRef language. Safe Unicode remains available through explicit input or project/domain convention; never rename an existing open or archived identity because language or naming guidance changes.

Prefer one ordinary Change only for one observable outcome sharing a consistency, focused-verification, review, archive, and rollback boundary. Change granularity does not prescribe Git commit count; never split or merge Changes merely to enforce a Change-to-commit mapping. Use a shallow Group for independent outcomes under one goal; an integration gate never merges them. A shared completion contract gates Group closure, not child archive unless declared there. Keep Brief `Slices`, child `Blockers`, and derived readiness. Add no hierarchy.

## Write one outcome

Keep one observable outcome per Change:

- `Proposal`: outcome, scope, non-goals;
- `Spec`: this change's contract delta and acceptance, referencing affected existing Specs rather than copying the baseline;
- `Design`: approach, responsibility boundaries, and necessary tradeoffs, not repeated requirements or tasks;
- `Tasks`: checkable work, with prescribed order only where correctness, safety, or migration requires it;
- `Verify`: methods linked to acceptance, then actual decisive results, gaps, and limits, not repeated requirements or transcripts;
- `Blockers`: dependencies and decisions, or `none`.

Keep the six sections; small changes need only proportionate content. Plain-prose HTML scaffold hints may remain or be removed; they guide writing, never supply requirements, evidence, or completed content. Resolve body placeholders and keep all material decisions visible outside comments.

Plan a test only when it protects observable behavior or a real boundary, adds distinct future confidence, avoids duplicate or implementation-detail coverage, and costs proportionately. Otherwise prefer smallest sufficient evidence and keep probes temporary.

A Change is a convergent current-plan and final-evidence snapshot, not an append-only execution log. Replace superseded evidence; keep process in the response. Before archive, retain final decisive verification, gaps, and risks.

Use domain language. Mention agents only as real product actors or constraints, not authors or execution narrators.

## Apply the Shape Ready gate

A Change is ready only when:

- outcome, non-goals, and acceptance are concrete;
- product and mutation authority are settled;
- affected boundaries and material constraints are known;
- no hidden assumption can change implementation or acceptance;
- Tasks are executable without performing them;
- Verify proves the result without process chronology; Blockers are truthful;
- one Change or a justified shallow Group is the smallest sufficient owner.

After authorized planning mutation, run the focused RSP check. Readiness permits Core to continue only the already authorized objective; it grants no product, lifecycle, Git or external authority.
