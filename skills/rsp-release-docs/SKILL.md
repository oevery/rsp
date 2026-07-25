---
name: rsp-release-docs
description: Prepare, finalize, reconcile, and audit evidence-based changelogs, release notes, and migration notes. Use when drafting or updating release documentation, reviewing an Unreleased section, summarizing a version range, deciding references or omissions, checking that release prose matches shipped behavior, finalizing artifacts before an explicit tag or publication request, or reconciling public release surfaces afterward.
license: MIT
metadata:
  author: oevery
  version: "2026.07.25.3"
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

A release identity is confirmed only when the user states it or an authoritative repository release configuration already selects it. Never infer the next version from semantic-version ordering, a previous prerelease, commit contents, a planned changelog, or package-manager convention. When identity or range remains undecided, return that exact owner decision instead of choosing it.

## Select the branch

- **Audit:** inspect existing release prose and return findings without editing.
- **Draft:** build a version-neutral ledger while the release identity may still change. Keep it in the response, temporary work, or an existing release-fragment system; do not mutate version manifests, target changelog headings, exact-version README commands, versioned release-note paths, or tag comparisons before identity is confirmed. Once confirmed, draft the requested release surfaces; for a formal release, always include release notes. Update a changelog only when the repository owns one or the user requests one. Include migration guidance whenever users must act.
- **Finalize for publication:** with a confirmed release identity and range, make every shipped surface true both immediately before and after publication, then produce a checkable publication handoff. An explicit request to create a tag, GitHub release, registry version, or equivalent public release must pass this branch even when earlier drafts were reviewed. Bind `ready` to the exact release commit after all required implementation Changes and lifecycle closeout are already represented in its committed range.
- **Reconcile published release:** verify the external release against the confirmed identity, repair only authorized mutable public surfaces, and record immutable discrepancies and their remediation owner. Never rewrite a published package or move an existing tag to make evidence appear consistent.

Publication remains an external action. This Skill never executes commit, tag, push, release creation, registry publication, deployment, deletion, or approval; finalization returns a handoff to the separately authorized operator.

Completion criterion: exactly one branch is selected, and every requested surface has one disposition: draft, finalize, reconcile, audit only, not applicable, or blocked by a named decision.

## Choose transient or durable ownership

A confirmed mechanical release does not require an RSP Change. Use the explicit user request or authoritative release configuration for identity and range, keep the ledger, command progress, authentication state, and publication handoff transient, and rely on manifests, changelog, release commit, tag, hosted release, and registry record as durable release history.

Use an optional Release Change only when material version/range, migration, rollback, security, compatibility, cross-repository/team, multi-stage handoff, recovery, blocker, or acceptance decisions need a persistent owner. Do not create one merely to repeat the release checklist, verification output, or prose already owned by release surfaces.

Completion criterion: ownership is transient by default, or one concrete durable coordination need justifies the optional Release Change.

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

## Assign surface lifetime

Classify every release statement by the lifetime and owner of its destination:

- **Shipped surfaces:** public release communication and package metadata captured by the release tag or package, including README content, changelog entries, repository release notes, manifests, and migration guides. Internal workflow records merely present in the source tag, such as archived Changes, remain governed by their own artifact lifetime rather than becoming release prose. Finalized shipped prose must be **publication-invariant**: it remains true before publication, at publication, and afterward. Use the target version and stable comparison target; exclude transient claims such as “not yet published,” “available after publication,” pending authentication, live registry state, or comparisons ending at `HEAD`.
- **Mutable public surfaces:** hosted release descriptions, registry metadata that can be safely changed, and other public records outside the immutable artifact. Keep their stable narrative aligned with shipped surfaces; add post-publication verification only after observing it.
- **Transient release state:** pending publication, credentials, command progress, authentication status, and unverified registry availability. Keep it in the selected Change, an authorized release tracker, temporary working ledger, or response handoff—never in shipped prose.

When a published immutable surface is wrong, preserve the historical artifact, state the discrepancy on an authorized mutable surface, and name a corrective follow-up version or owner. Do not manufacture consistency by changing historical evidence.

Completion criterion: every ledger statement has one named surface class and owner, and no transient release state is assigned to a shipped surface.

## Project the artifacts

Read [output contracts](references/output-contracts.md) before creating a new format, preparing a major or breaking release, or producing more than one surface.

### Changelog

Write a concise cumulative record of notable outcomes. Preserve existing categories; otherwise use Keep a Changelog categories and omit empty sections. Put breaking changes and required action first. Describe behavior, not implementation mechanics.

### Release notes

Write a release-specific narrative for the observed audience. Lead with the most important outcomes, make required action prominent, include compatibility or known limitations when evidenced, and link to the full changelog or comparison range. Do not merely duplicate the changelog.

### Migration notes

State who is affected, required actions in order, changed defaults or removed surfaces, compatibility window, validation steps, and rollback or support path when known. Use a separate guide when the instructions would overwhelm the release notes.

Completion criterion: every statement maps to the ledger, each surface serves its distinct audience and lifetime, and terminology remains consistent across surfaces.

## Finalize for publication

Enter this gate only with a confirmed target version and release range from explicit user or authoritative repository release operation authority. Inspect the exact public release surfaces and package inventory, not every internal workflow record present in the source tag. Ordinary implementation Changes must complete their own review and lifecycle closeout first. When Git delivery is authorized, keep their commits independently reviewable and finalize version manifests and versioned shipped surfaces in a separate release commit. An optional Release Change may supplement authority when durable coordination was justified, but its archive is not required for a mechanical release. The final handoff must rerun against the exact release commit.

Require all of the following before returning a publication handoff:

- version manifests, changelog heading and date, release-note identity, migration guidance, and exact-version assertions agree on the target version;
- the target changelog entry is no longer labeled `Unreleased`;
- stable comparison links terminate at the target tag or immutable release ref rather than `HEAD`;
- shipped surfaces contain no pending-publication, pending-authentication, or unverified-live-state prose;
- the package inventory and release checks have been run at the exact candidate revision, with results and omissions named;
- required lifecycle closeout is already captured by the candidate revision, and the working tree/candidate relationship is explicit, so the operator can tell exactly what the tag and package will contain.

Return a publication handoff containing the target version and immutable candidate ref, required external actions, fresh checks, known omissions, and a clear `ready` or `not ready` result. `ready` means the documentation and candidate are internally eligible for a separately authorized publication operation; it is not publication authority or evidence that publication occurred.

Completion criterion: every gate above has observed evidence or the result is `not ready` with the exact failed gate and owner.

## Reconcile a published release

After publication, observe the tag target, hosted release state, registry version and dist-tags, and exact-version consumer command when applicable. Compare them to the finalization handoff and shipped artifact inventory. Update authorized mutable public surfaces only when their current state is known; keep unknown external facts explicitly unverified. Record immutable drift as a release discrepancy with its corrective version or owner.

Completion criterion: every intended external surface is verified, explicitly unverified, or assigned a discrepancy owner without rewriting immutable release history.

## Protect transient credentials

Treat one-time passwords, browser-auth URLs, device codes, and token-bearing query strings as transient credentials even when they expire or are single-use. Keep them out of release prose, Changes, evidence ledgers, command summaries, retained logs, and final responses. Prefer a CLI-owned interactive browser flow only when it does not copy authentication material into retained agent output. If the command would emit that material into a retained transcript, stop and let the authorized human complete authentication in a trusted local terminal, then resume credential-free verification. The release handoff may state that authentication is required or completed, but never include the credential value or URL.

Completion criterion: retained artifacts contain only credential-free authentication status, and the publication operator owns any interactive authentication outside this Skill.

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
- every shipped statement is publication-invariant and every transient fact stays with its release-state owner;
- finalization gates are complete before any explicit tag or publication handoff is marked `ready`;
- retained artifacts and responses contain no transient credential values or token-bearing URLs;
- working-tree edits stay within authorized files.

Return the release range, artifacts drafted or changed, coverage and exclusions, unresolved decisions, validation performed, and whether any external release action occurred.

Completion criterion: the result is evidence-complete, convention-compatible, lifetime-correct, credential-safe, and truthful about omissions and publication state.
