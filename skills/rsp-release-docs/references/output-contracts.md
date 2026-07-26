# Output contracts

Use these as fallbacks. Preserve an established repository format whenever it exists.

The generic baseline is Keep a Changelog 1.1.0 for cumulative structure and Semantic Versioning 2.0.0 for version meaning. Treat Conventional Commits, forge-generated notes, and label-based categorization as evidence inventories rather than finished prose.

## Default changelog shape

```markdown
# Changelog

## [Unreleased]

## [3.0.0] - YYYY-MM-DD

### Added

- Add a user-visible capability. ([#123])

### Changed

- **Breaking:** Change an existing contract. See the [migration guide].

### Fixed

- Prevent an observable failure in a supported workflow. ([abc1234])

[Unreleased]: https://github.com/OWNER/REPO/compare/v3.0.0...HEAD
[3.0.0]: https://github.com/OWNER/REPO/compare/v2.0.0...v3.0.0
[#123]: https://github.com/OWNER/REPO/pull/123
[abc1234]: https://github.com/OWNER/REPO/commit/abc1234...
[migration guide]: https://example.com/migration
```

Use Added, Changed, Deprecated, Removed, Fixed, and Security as fallback categories. Omit empty categories. Do not add an Unreleased section when the established project intentionally does not use one.

## Default release-note shape

```markdown
# Version 3.0.0

One short paragraph explaining the release's purpose and who benefits.

## Highlights

- Outcome and benefit, grouped by capability rather than commit.

## Breaking changes and migration

- Who is affected, what action is required, and where to find the full guide.

## Other changes

- Notable improvements and fixes that matter to this audience.

## Compatibility and known limitations

- Supported environments, verified coverage, and explicit non-claims.

**Full changelog:** https://github.com/OWNER/REPO/compare/v2.0.0...v3.0.0
```

Omit inapplicable sections. Prefer three to seven scannable themes for a typical release; group small visible fixes without hiding high-impact items. Include contributors when the established release surface values attribution.

## Migration contract

For each required action, answer:

1. Who is affected?
2. What old behavior or surface changes?
3. What must they do, in what order?
4. What compatibility window or deadline applies?
5. How can they verify success?
6. What rollback, recovery, or support path exists?

Keep a short summary in release notes and link a dedicated guide when the procedure is long, conditional, or operationally risky.

## Net-release examples

- Five commits build one new capability: write one outcome.
- A feature is added and reverted before release: omit it.
- A bug is found and fixed before users receive the new feature: fold the final behavior into the feature item.
- An internal refactor changes no public, packaging, security, or operator behavior: exclude it and record the reason in the coverage audit.
- A dependency update changes the minimum runtime or bundled behavior: include the observable compatibility impact, not the dependency housekeeping.

## Integrity gate

Before finalizing, require:

- complete range coverage with explicit exclusions;
- traceable claims and no inferred readiness;
- archived verification labeled as historical, with a fresh finalization gate when the release range has advanced;
- matching versions, dates, tags, and links;
- visible breaking and migration action;
- no leaked private identifiers or secrets;
- no external publication implied by a draft;
- a diff limited to authorized release artifacts.
