# Authoring

Use for `create`, `revise`, `audit`, or `adapt`.

## Derive the candidate

Record the capability gap and contract delta in the Change before edits. Use rsp-doc's Skill branch for writing and package design. This method owns RSP traceability, standalone distribution and deliberate ownership/authority changes.

For `audit`, do not mutate the target unless the user also authorizes a repair. Run the corpus scanner when useful, then separate deterministic facts from semantic findings. An unreachable file, repeated paragraph, or large count is a review lead, not an automatic defect.

## Adapt accepted research

Require a report selected for adoption, recommendation ID, exact source identity, license conclusion, and reuse mode: `adapted`, `independent-reimplementation`, or `model-only`.

- For managed Git sources, retain the revision and source path.
- For targeted web snapshots, retain the retrieval date, URL, content hash, retained source location and retrieval gaps; a snapshot identity is not a Git revision or managed baseline acceptance.

Record preserved behavior, local changes, and rejected upstream behavior. Do not copy a whole upstream methodology to obtain one mechanism.

Use a three-way update model for later revisions: prior upstream base, local candidate, and new upstream evidence. Never overwrite local intent automatically.

## Check package boundaries

- Published product Skills live in their canonical authored package and may have discovery projections.
- Direct maintainer Skills remain outside the published inventory unless a separate product Change promotes them.
- Public names, fields, enums, receipts, and ownership boundaries retain compatibility unless the selected Change explicitly alters them.

## Context diagnostics

Use `node scripts/scan-skill-context.mjs --root . --package .agents/skills/author-rsp-skills --json` for one canonical package. Repeat `--package` for a selected corpus; paths resolve relative to `--root`. Without selection the scanner discovers real authored packages in `skills/` and `.agents/skills/`, skipping linked projections. An unknown, invalid or projected explicit target fails instead of falling back to the whole corpus.

- `diagnostics` retains the package's Markdown totals. `diagnostics_by_role` separates entrypoint, other Markdown references, root distribution texts and their combined document total. `distribution_files` includes root LICENSE, NOTICE, COPYING and THIRD-PARTY-NOTICES with no extension or `.md`/`.txt`; scripts and binary assets are not document statistics.
- Words are whitespace-delimited units, not model tokens. File totals include metadata and code; a final line terminator does not add a line. References include both reachable and unreachable documents.
- Reachability follows actual Markdown links and used reference definitions within the package. Frontmatter, code examples and unused definitions do not create edges. Anchors identify the same document; static reachability proves neither actual context loading nor model discovery.
- `repeated_prose` reports whitespace-normalized source text of AST paragraphs across distinct non-distribution Markdown files in the selected corpus, including unreachable files. It preserves inline code and literal links, excludes frontmatter and code blocks, and retains the existing 40-character noise floor; that is not a writing minimum or acceptance threshold. Exact textual repetition is a clue, not proof of equivalent meaning.

Use counts, unreachable documents and repetitions as investigation leads. No score, automatic deletion or quality gate follows from them. Missing/broken resource validation stays with `scripts/skill-package-check.mjs`; metadata and security retain their existing checks. Maintainer tools live under root `scripts/`, not inside these Skill packages.
