---
name: rsp-release-docs
description: Prepare and audit evidence-based changelogs, release notes, and migration notes. Use when drafting or updating release documentation, reviewing an Unreleased section, summarizing a version range, deciding references or omissions, or checking that release prose matches shipped behavior and repository conventions.
license: MIT
metadata:
  author: oevery
  version: "2026.07.22.1"
---

# RSP Release Docs

Build one release evidence ledger, then project it into the repository's release surfaces. Treat Git history as navigation, not product truth.

## Establish authority

Resolve requirements in this order:

1. Follow the user's explicit scope, audience, language, format, reference, and mutation requirements.
2. Follow the applicable instruction hierarchy; nearer project instructions override broader host or personal defaults.
3. Follow existing release-tool configuration.
4. Preserve the target artifact's current structure, terminology, and language.
5. Match prior published releases and tag, link, and tracker conventions.
6. Apply the defaults in this Skill only where the repository is silent.

Use the higher-precedence source when two sources conflict. Ask one focused question only when the unresolved choice would materially change the public result. Read [convention discovery](references/convention-discovery.md) when locating or reconciling repository and personal conventions. Persist a preference only when the user explicitly authorizes its project or personal instruction owner.

Completion criterion: name the release range, target version or draft state, audience, output surfaces, language, link style, and allowed mutations from observed authority.

## Select the branch

- **Audit:** inspect existing release prose and return findings without editing.
- **Prepare:** draft requested artifacts; for a formal release, always include release notes. Update a changelog only when the repository owns one or the user requests one. Include migration guidance whenever users must act.
- **Finalize:** replace Unreleased markers, dates, comparison links, or draft labels only when the release identity is confirmed.

Publication is a separate branch. Preparing prose never grants commit, tag, push, release creation, registry publication, deployment, deletion, or approval authority.

Completion criterion: every requested surface has one disposition: draft, update, audit only, not applicable, or blocked by a named decision.

## Collect evidence

Inspect the smallest sufficient set:

- previous release tag or user-supplied base and the target ref;
- commits and net diff in the release range;
- PRs, issues, tracked Changes, changesets, news fragments, and release PRs when available;
- public API, CLI, configuration, packaging, migration, security, and operator-facing changes;
- existing changelog, prior release notes, migration guides, version files, and release configuration;
- fresh verification and known acceptance gaps when the release claims compatibility or readiness; label archived evidence with its observed revision or date instead of presenting it as current.

Use diffs and direct consumers to verify behavior. Use commit messages and labels to locate intent. Prefer accepted work artifacts and public documentation for business meaning. Reconcile disagreements explicitly instead of choosing the most convenient source.

Completion criterion: every commit and every relevant tracked item in the range is represented by evidence or has an explicit exclusion reason.

## Build the release ledger

Create a working ledger before writing prose. Keep it in the response or temporary work unless the repository already owns release fragments or the user authorizes a path.

For each net change record:

- evidence identifiers and links;
- user-visible or operator-visible outcome;
- affected audience;
- breaking, deprecation, security, compatibility, or migration impact;
- changelog disposition;
- release-note disposition;
- reference choice;
- exclusion or uncertainty, if any.

Collapse multiple commits into one outcome. Omit changes added and reverted within the same range. Fold fixes to never-released behavior into the final feature description. Keep internal work out unless it changes public behavior, packaging, compatibility, security, operations, or release integrity.

Completion criterion: the ledger describes the net released state rather than commit chronology, and every exclusion is intentional.

## Project the artifacts

Read [output contracts](references/output-contracts.md) before creating a new format, preparing a major or breaking release, or producing more than one surface.

### Changelog

Write a concise cumulative record of notable outcomes. Preserve existing categories; otherwise use Keep a Changelog categories and omit empty sections. Put breaking changes and required action first. Describe behavior, not implementation mechanics.

### Release notes

Write a release-specific narrative for the observed audience. Lead with the most important outcomes, make required action prominent, include compatibility or known limitations when evidenced, and link to the full changelog or comparison range. Do not merely duplicate the changelog.

### Migration notes

State who is affected, required actions in order, changed defaults or removed surfaces, compatibility window, validation steps, and rollback or support path when known. Use a separate guide when the instructions would overwhelm the release notes.

Completion criterion: every statement maps to the ledger, each surface serves its distinct audience and lifetime, and terminology remains consistent across surfaces.

## Apply reference policy

Follow repository policy first. Otherwise:

1. Add a version-level compare or tag link.
2. Prefer PR links for implementation context.
3. Prefer issue or tracked-work links for rationale and migration context.
4. Use commit links when no better semantic anchor exists, exact provenance matters, or the user requires them.

Do not force a reference onto every bullet. Use stable public links only; keep private tracker identifiers out of public prose unless the repository already exposes them.

Completion criterion: references add useful context without turning the artifact into a Git log or exposing private information.

## Audit before returning

Check all of the following:

- range and version identity are consistent across artifacts;
- every ledger item is included or intentionally excluded;
- no claim exceeds implementation or verification evidence;
- verification counts, package identities, and compatibility claims name their observed revision or date when they were not refreshed in the current run;
- breaking, migration, deprecation, security, and known-limit information is prominent where applicable;
- user-visible net outcomes are not fragmented by commit;
- links, dates, headings, language, and terminology match observed conventions;
- changelog and release notes agree without becoming copies;
- working-tree edits stay within authorized files.

Return the release range, artifacts drafted or changed, coverage and exclusions, unresolved decisions, validation performed, and whether any external release action occurred.

Completion criterion: the result is evidence-complete, convention-compatible, and truthful about omissions and publication state.
