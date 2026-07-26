---
name: rsp-release-docs
description: Draft, audit, finalize, or reconcile evidence-based changelogs, release notes, and migration notes for an explicit release operation.
license: MIT
metadata:
  author: oevery
  version: "2026.07.26.1"
---

# RSP Release Docs

Build one net-release evidence ledger and project it into repository-owned release surfaces. Git history locates evidence; it is not product truth.

## Establish authority

Resolve user scope, audience, language, format, references, and mutation authority first; then nearest project instructions, release-tool configuration, target-artifact conventions, and prior published releases. Higher-precedence evidence wins. Ask one focused question only when an unresolved owner choice materially changes the public result.

Read [convention discovery](references/convention-discovery.md) when repository, personal, tool, or historical conventions must be located or reconciled. Do not invent configuration or persist preferences without authority.

A release identity is confirmed only by explicit user instruction or authoritative repository release configuration. Never infer it from semantic-version ordering, prior prereleases, commits, planned prose, or package-manager convention. Until confirmed, keep work version-neutral and do not mutate manifests, target changelog headings, exact-version commands, versioned note paths, or tag comparisons.

Before continuing, name the range, confirmed version or draft state, audience, surfaces, language, link style, and allowed mutations.

## Select one branch

- **Audit:** inspect fixed release prose and return findings without editing.
- **Draft:** collect and project evidence. While identity can change, keep the ledger transient or use an existing release-fragment owner. Once identity is confirmed, update only authorized surfaces. Formal releases include release notes; update a changelog only when the repository owns one or the user asks; include migration guidance whenever users must act.
- **Finalize for publication:** require confirmed identity and range, completed implementation Change closeout, and an exact clean candidate. An explicit tag, hosted release, registry publication, or equivalent public request must pass this branch even after prose review. Bind `ready` to the exact release commit.
- **Reconcile published release:** observe the published identity and external surfaces, repair only authorized mutable surfaces, and assign immutable discrepancies to a corrective version or owner. Never rewrite a published package or move a tag to manufacture consistency.

Exactly one branch is active. Give every requested surface one disposition: draft, finalize, reconcile, audit only, not applicable, or blocked by a named decision.

## Keep release coordination proportional

A confirmed mechanical release does not require an RSP Change. Keep the ledger, command progress, authentication state, and publication handoff transient; manifests, changelog, release commit, tag, hosted release, and registry record own durable release history.

Use an optional Release Change only when material version/range, migration, rollback, security, compatibility, cross-repository/team, multi-stage handoff, recovery, blocker, or acceptance decisions need a persistent owner. Do not create one for a checklist, verification transcript, or prose already owned by release surfaces.

## Build evidence before prose

Inspect the smallest sufficient set: base and target refs; commits and net diff; relevant PRs, issues, Changes, fragments, and release PRs; public API, CLI, configuration, packaging, migration, security, and operator behavior; release surfaces and configuration; fresh verification and known acceptance gaps.

Use direct consumers and diffs for behavior, work artifacts and public docs for meaning, and commit metadata for navigation. Reconcile disagreements explicitly. Historical verification must name its observed revision or date.

Read [evidence and surfaces](references/evidence-and-surfaces.md) before drafting the ledger, classifying statement lifetime, or deciding exclusions. Read [output contracts](references/output-contracts.md) before introducing a format, preparing a major/breaking release, or producing multiple surfaces.

Every relevant commit and work item must map to a net outcome or explicit exclusion. Collapse implementation chronology, omit additions reverted within the range, fold prerelease fixes into final behavior, and exclude internal work unless it changes public behavior, packaging, compatibility, security, operations, or release integrity.

## Project distinct surfaces

- **Changelog:** concise cumulative notable outcomes using the existing categories, or Keep a Changelog categories as fallback. Put breaking changes and required action first.
- **Release notes:** audience-specific narrative led by the most important outcomes, required action, evidenced compatibility and limitations, plus the full range link. Do not merely duplicate the changelog.
- **Migration notes:** identify affected users, ordered actions, changed defaults or removed surfaces, compatibility window, validation, and known rollback/support. Use a separate guide when this would overwhelm the notes.

Every claim must map to the ledger. Keep terminology aligned while respecting each surface's audience and lifetime.

## Finalize the exact candidate

Read [publication lifecycle](references/publication-lifecycle.md) before a publication handoff or post-publication reconciliation.

Finalization inspects public release surfaces and package inventory at the exact candidate—not every internal workflow artifact present in the tag. Require version, date, changelog, notes, migration guidance, comparisons, manifests, package inventory, release checks, and lifecycle closeout to agree. Shipped prose must remain true before, during, and after publication; transient publication or authentication state belongs only in the handoff.

When Git delivery is authorized, implementation Changes remain independently reviewable and versioned shipped surfaces are finalized in a separate release commit. Return the version, immutable candidate ref, required external actions, fresh checks, omissions, and `ready` or `not ready`. `ready` means internally eligible for a separately authorized operation; it is neither publication authority nor evidence of publication.

## Protect authority and credentials

This Skill never executes or grants authority for commit, tag, push, hosted release creation, registry publication, deployment, deletion, approval, or rewriting immutable history. Publication is a separate external operation.

Treat one-time passwords, browser-auth URLs, device codes, tokens, and token-bearing query strings as credentials. Never retain their values in release prose, Changes, ledgers, logs, summaries, or responses. If a command would expose them to retained output, stop and let the authorized human authenticate in a trusted terminal; resume only with credential-free status.

## Return an evidence-complete result

Before returning, confirm consistent range and identity; ledger coverage or explicit exclusions; claims bounded by evidence; prominent breaking, migration, security, deprecation, and known-limit information; convention-compatible links, dates, headings, language, and terminology; publication-invariant shipped prose; transient state with its owner; credential-free retained output; and edits limited to authorized paths.

Return the range, branch, changed or audited artifacts, coverage and exclusions, unresolved owner decisions, validation, handoff readiness when applicable, and whether any external action occurred.
