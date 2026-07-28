# Convention discovery

Use this reference when a repository may have personal, project, tool, or historical release conventions. Discover; do not introduce a new configuration file merely to satisfy this Skill.

## Authority sources

Inspect only relevant, non-secret sources:

1. Current user instructions, including requested audience, language, tone, links, output paths, and whether edits are allowed.
2. Applicable instructions, with the nearest project instruction winning over broader host or personal defaults.
3. Project release documents such as `CONTRIBUTING.md`, maintainer guides, or a documented release checklist.
4. Existing target artifacts such as `CHANGELOG.md`, `NEWS.md`, release-note templates, upgrade guides, or an in-app What's New source.
5. Release configuration and package scripts.
6. Recent published releases and tags.

Do not scan unrelated home-directory configuration. Do not print tokens, registry credentials, private URLs, authorization headers, or hidden release secrets. When a named config may contain secrets, inspect only the keys needed to identify release behavior. Keep a newly stated preference session-local unless the user explicitly authorizes an existing project or personal instruction owner.

## Common configuration signals

Look for these only when present or relevant:

- `.github/release.yml`, Release Drafter, or GitHub Release templates;
- release-please manifest/configuration;
- `.changeset/config.json` and changeset fragments;
- Towncrier, Changie, or similar news fragments;
- `cliff.toml`, conventional-changelog, semantic-release, or commit-and-tag-version configuration;
- monorepo package boundaries and per-package changelogs;
- package scripts, CI release workflows, and version files;
- tracker labels such as breaking, feature, fix, skip-changelog, or security.

Treat generated release notes and automation output as evidence inventories. Human-facing claims still require semantic review.

## Adaptation decisions

Resolve these dimensions independently:

| Dimension | Evidence to prefer |
| --- | --- |
| Audience | Explicit request, established release surface, prior releases |
| Language | Explicit request, established target artifact, configured effective artifact language, nearest project instruction, prior published releases, conversation |
| Voice | Existing artifact and product terminology |
| Categories | Existing artifact/config; Keep a Changelog only as fallback |
| Version and tags | Confirmed target, manifests, release config, prior tags |
| References | Existing links and tracker policy; generic hierarchy only as fallback |
| Output paths | Existing release owner or explicit path authority |
| Detail | Audience needs, release risk, and existing cadence |

Personal preferences refine the project format where compatible. Project-owned parsers, schemas, and release contracts win when a stylistic preference would break them. Report the conflict when the user must choose.

For language specifically, follow Core's response-versus-artifact boundary. An explicit surface-specific request wins. Otherwise preserve an existing target artifact's established language. For a new release artifact, use the configured effective artifact language, then the nearest project or release instruction, prior published releases, and finally the conversation language. Configuration changes never translate an existing release surface by themselves.

## Repository shapes

- **Library or SDK:** emphasize public API, compatibility, deprecation, migration, runtime support, and precise references.
- **Application:** emphasize visible workflows, changed defaults, operator action, rollout, and known limitations.
- **CLI:** emphasize command/flag/config semantics, output contracts, migration, and shell compatibility.
- **Monorepo:** determine the released unit before collecting evidence; avoid mixing unrelated packages.
- **GitHub-Releases-only project:** draft release notes without creating `CHANGELOG.md` unless requested.
- **Fragment-based project:** use accepted fragments as semantic evidence, then verify the net diff and release boundary.

## Conflict examples

- If the user requests Chinese release notes but `CHANGELOG.md` is consistently English, keep the changelog English and draft the release notes in Chinese unless the user explicitly asks to translate both.
- If the user requests commit IDs but prior releases use PR links, preserve PR links and add commit links only for exact provenance unless the user explicitly overrides the project style.
- If a tool requires two synchronized formats, update both from one ledger while preserving each parser's syntax.
