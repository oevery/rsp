---
kind: refactor
---

# Change: use-ast-document-parsing

## Proposal
- Outcome: Use one source-positioned Markdown syntax model and YAML Document parsing for document consumers, avoiding competing string-based interpretations.
- Scope: Change/Group structure, completion and dependency evidence, summaries, Specs metadata/headings, managed AGENTS entry spans, TUI Markdown and maintenance document checks; dependency selection needed to verify the candidate against fixed-source fixtures.
- Integration boundary: Preserve the existing uncommitted asset-alignment corrections and their owner; this Change owns the newly authorized parser migration and its integration checks.
- Non-goals: changing WorkRef or lifecycle grammar, rewriting historical documents, generic plugin pipelines, Git delivery, host/global installation or publication.

## Spec
### MODIFIED
- Requirement: Markdown structure and semantic evidence are read from syntax nodes with original source positions. Comments and code examples do not declare work, completion, dependencies or document identity; code literals within valid protocol items retain their exact source spelling.
- Requirement: Canonical RSP headings, custom task states, failure diagnostics and frontmatter delimiters remain supported under the [CLI](../specs/cli.md) and [Work model](../specs/work-model.md) contracts.
- Requirement: YAML value consumers use validated Document parsing; editing retains comments and preserves unchanged source where the existing mutation contract requires it.
### Acceptance
- Public CLI checks distinguish visible protocol content from hidden sections, code examples and inline literals, including recovery replay refusal and unchanged archive bytes.
- Direct consumers reuse parsed document/section models rather than reparsing extracted source for structural decisions. Literal search and local protocol-value validation retain their existing owners.
- Complete code, package, documentation and offline Skill checks pass without live model calls or modifications to unrelated work.

## Design
- Reuse mdast/micromark with GFM and frontmatter extensions, and the existing yaml Document API. Keep the shared syntax reader usable by runtime and source-checkout maintenance scripts.
- Retain raw source and node spans. RSP schema projection recognizes canonical headings and protocol tokens; append operations continue to splice source rather than serialize an AST.
- Parse Markdown HTML tokens with the HTML syntax reader to locate comments without hiding adjacent text or attribute literals. Fixed-source fixtures retain their own manifest, lock and evidence identity; every copied package and dependency edge must match that selection.
- Pass parsed sections to completion, dependency, summary and history readers. Presentation owns rendering, not lifecycle interpretation. YAML mapping validation remains separate from syntax recognition.
- Project local Blocker declarations once for dependency, status, TUI and history consumers; current dependency resolution remains separate from retained historical evidence. Reuse HTML-token comment analysis while keeping authored and normalized source coordinates distinct.
- Preserve the asset-alignment baseline; do not rewrite its retained reports or infer delivery/lifecycle authority from this integration.

## Tasks
- [x] Implement shared source-positioned Markdown/frontmatter, HTML-token and validated YAML readers; preserve raw literals, source spans and lossless edits.
- [x] Migrate runtime consumers to shared Blocker, Verify and summary projections; reuse parsed Group and Specs inputs, share TUI labels, and remove unused parsing interfaces and payload fields.
- [x] Migrate maintenance document consumers from structural scans to syntax views and collect only needed nodes; retain exact fixture tool closure and frozen dependency selection.
- [x] Retain public CLI and document-tool regressions for hidden content, strict headings/classification, custom and compact task states, managed entry spans, cross-consumer consistency and lossless recovery. Remove two redundant unit tests and share fixtures across focused Group lifecycle tests.
- [x] Establish required checks and write back the parsing boundary to [Architecture](../specs/design.md) and [CLI](../specs/cli.md). No separate lasting-rationale record is needed.

## Verify
### Required
- [x] The AST-only delivery candidate based on fac56af946f67429601203dba7d11580dbc77c19 passes mise exec -- pnpm run build, typecheck, lint and test: 18 files, 125 tests. Public CLI coverage includes hidden/quoted/fenced structure, Required/Optional boundaries, custom and compact task states, recovery replay and unchanged archive bytes. Visible blocker continuations and compact pending items prevent archive without changing the Change or Focus; comment-only containers and code examples provide neither required Group content nor blockers. Managed marker comments sharing HTML tokens retain adjacent user content and do not duplicate entry blocks. Blocker regression checks status, rendered TUI explanations and historical declarations. Summary regression verifies comment-only fallback and Group goals, trailing comments, exact inline-code spelling, historical summaries and unchanged archive bytes. Transient comparison against the pre-refactor reader confirms unchanged link and list-line outputs across six documents, including forward references, first-definition precedence, optional definition output, examples and CRLF.
- [x] The AST-only candidate passes frozen offline dependency installation, packed installation/inventory, eight product package checks and security checks (42 files, zero findings). The initial packed-install check lacked local offline cache; copying the existing repository cache resolved the environment gap without source changes or network access, and the complete code suite then passed. Documentation checks pass seven bilingual pairs and 29 files; docs:build also passes on this candidate.
- [x] On the AST-only candidate, mise exec -- node tests/skills/runner/cli.mjs check --suite full passes all 75 cases with zero provider calls and behavioralAcceptance: not-run. The 76-case result from the mixed working tree is not standalone AST evidence: the asset-owned mixed-results case is excluded. The maintainer checker and both parser sources match their fixture copies; fixed-source dependency evidence keeps its selected immutable lock rather than the current worktree lock.
- [x] Focused RSP structure and diff hygiene pass. The AST-only candidate retains the baseline authored/generated fallback; the mixed working tree fallback remains owned by asset alignment. Pre-existing asset corrections and their historical reports remain unchanged.
- [x] Independent final review of the AST-only delivery boundary and complete final Change reports Code: clean and Document: clean, with no actionable P0–P3 findings. The reviewer inspected source, contracts and evidence applicability; it did not independently rerun the execution checks.
### Optional
- Verification runs on Node.js 24.21.0. Node.js 22-specific execution, live model evaluation and real project migration remain unexecuted.

## Blockers
- none
